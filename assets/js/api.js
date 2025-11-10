// Campus SkillSwap - API Client

class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:5001/api';
        this.token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        this.refreshToken = localStorage.getItem('refresh_token');
        console.log('API Client initialized with token:', this.token ? 'Present' : 'Missing');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
            localStorage.setItem('authToken', token); // For compatibility
        } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('authToken');
        }
    }

    removeToken() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refresh_token');
    }

    async request(url, options = {}) {
        // Add default headers
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Add auth header if token exists
        if (this.token) {
            defaultHeaders['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        console.log('Making API request to:', `${this.baseURL}${url}`);
        console.log('Making API request to:', `${this.baseURL}${url}`, config);

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);
            
            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const retryTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default to 1 minute
                
                console.warn(`Rate limit exceeded. Retry after ${retryTime}ms`);
                
                // Show user-friendly message
                if (typeof window !== 'undefined' && window.showToast) {
                    window.showToast(`Too many requests. Please wait ${Math.ceil(retryTime / 1000)} seconds before trying again.`, 'warning');
                }
                
                // Reject with rate limit error
                throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(retryTime / 1000)} seconds.`);
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // Authentication methods
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        
        if (response.success) {
            // Store token
            this.setToken(response.token);
            
            // Store user data
            if (response.user) {
                localStorage.setItem('current_user', JSON.stringify(response.user));
                localStorage.setItem('userData', JSON.stringify(response.user)); // For compatibility
            }
            
            return response;
        }
        
        throw new Error(response.message || 'Login failed');
    }

    async register(userData) {
        const response = await this.post('/auth/register', userData);
        
        if (response.success) {
            return response;
        }
        
        throw new Error(response.message || 'Registration failed');
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            this.removeToken();
            localStorage.removeItem('current_user');
            localStorage.removeItem('userData');
        }
    }

    async getCurrentUser() {
        const response = await this.get('/auth/me');
        
        if (response.success) {
            return response.user;
        }
        
        throw new Error(response.message || 'Failed to get user data');
    }

    // User profile methods
    async updateProfile(profileData) {
        return this.put('/users/profile', profileData);
    }

    async uploadProfileImage(imageFile) {
        const formData = new FormData();
        formData.append('profileImage', imageFile);
        
        return this.request('/users/profile/image', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                // Don't set Content-Type for FormData, let browser set it
            },
        });
    }

    // Skills methods
    async getSkills(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/skills?${queryParams}` : '/skills';
        return this.get(endpoint);
    }

    async getSkill(skillId) {
        return this.get(`/skills/${skillId}`);
    }

    async createSkill(skillData) {
        console.log('API Client createSkill called with:', skillData);
        console.log('Current token:', this.token);
        return this.post('/skills', skillData);
    }

    async updateSkill(skillId, skillData) {
        return this.put(`/skills/${skillId}`, skillData);
    }

    async deleteSkill(skillId) {
        return this.delete(`/skills/${skillId}`);
    }

    // Sessions methods
    async getSessions(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/sessions?${queryParams}` : '/sessions';
        return this.get(endpoint);
    }

    async getSession(sessionId) {
        return this.get(`/sessions/${sessionId}`);
    }

    async requestSession(sessionData) {
        return this.post('/sessions', sessionData);
    }

    async updateSession(sessionId, sessionData) {
        return this.put(`/sessions/${sessionId}`, sessionData);
    }

    async cancelSession(sessionId) {
        return this.put(`/sessions/${sessionId}/cancel`);
    }

    // Reviews methods
    async getReviews(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/reviews?${queryParams}` : '/reviews';
        return this.get(endpoint);
    }

    async createReview(reviewData) {
        return this.post('/reviews', reviewData);
    }

    // Messages methods
    async getMessages() {
        return this.get('/messages');
    }

    async getMessageThread(threadId) {
        return this.get(`/messages/threads/${threadId}`);
    }

    async sendMessage(messageData) {
        return this.post('/messages', messageData);
    }

    // Admin methods
    async getAdminStats() {
        return this.get('/admin/stats');
    }

    async getAdminUsers(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
        return this.get(endpoint);
    }

    async updateUserStatus(userId, status) {
        return this.put(`/admin/users/${userId}/status`, { status });
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }
}

// Create global instance
const apiClient = new APIClient();

// Make it globally available
window.apiClient = apiClient;
window.APIClient = APIClient;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, apiClient };
}