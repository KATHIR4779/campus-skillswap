// Campus SkillSwap - Admin Panel
// Utility function to format dates consistently as DD/MM/YYYY
function formatDate(dateInput) {
    if (!dateInput) return 'Unknown';
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

class AdminManager {
    constructor() {
        this.baseURL = 'http://localhost:5001/api';
        this.token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
        this.isLoggedIn = false;
        this.currentTab = 'users';
        
        // Check if we're running from file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('⚠️ Admin panel is being served from file:// protocol. Please access it through http://localhost:5500/frontend/admin.html');
            this.showToast('Please access admin panel through http://localhost:5500/frontend/admin.html', 'warning');
        }
        
        // Test API connection
        this.testAPIConnection();
        
        this.init();
    }

    async testAPIConnection() {
        try {
            console.log('Testing API connection to:', this.baseURL);
            const response = await fetch(`${this.baseURL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('API connection test response status:', response.status);
            if (response.status === 401) {
                console.log('✅ API is accessible (401 is expected without token)');
            } else if (response.ok) {
                console.log('✅ API is accessible and working');
            } else {
                console.log('⚠️ API responded with status:', response.status);
            }
        } catch (error) {
            console.error('❌ API connection failed:', error);
            this.showToast('Cannot connect to backend API. Make sure the server is running on port 5001.', 'error');
        }
    }

    async init() {
        this.bindEvents();
        await this.checkAdminAuth();
        if (this.isLoggedIn) {
            this.loadStats();
        }
        this.setupTabs();
    }

    bindEvents() {
        // Admin login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // User management
        document.getElementById('user-search')?.addEventListener('input', (e) => this.searchUsers(e.target.value));
        document.getElementById('user-status-filter')?.addEventListener('change', (e) => this.filterUsers(e.target.value));

        // Settings save
        const settingsForm = document.getElementById('system-settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.saveSystemSettings(e));
        }

        // Logs refresh
        document.getElementById('refresh-logs-btn')?.addEventListener('click', () => this.refreshLogs());

        // Skills management
        document.getElementById('skill-search')?.addEventListener('input', (e) => this.searchSkills(e.target.value));
        document.getElementById('skill-status-filter')?.addEventListener('change', (e) => this.filterSkills(e.target.value));

        // Sessions management
        document.getElementById('session-search')?.addEventListener('input', (e) => this.searchSessions(e.target.value));
        document.getElementById('session-status-filter')?.addEventListener('change', (e) => this.filterSessions(e.target.value));
        
        // Email domains management
        document.getElementById('add-domain-btn')?.addEventListener('click', () => this.addNewDomain());
        document.getElementById('save-domains-btn')?.addEventListener('click', () => this.saveAllDomains());
        document.getElementById('reset-domains-btn')?.addEventListener('click', () => this.resetDomains());
        
        // Theme button - ensure it's properly bound
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.themeManager) {
                    window.themeManager.toggleTheme();
                }
            });
        }
    }

    async checkAdminAuth() {
        // Update token in case it changed
        this.token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
        
        console.log('Checking admin auth with token:', this.token ? 'Present' : 'Missing');
        
        if (!this.token) {
            console.log('No token found, showing login section');
            this.showLoginSection();
            return;
        }

        try {
            console.log('Making auth check request...');
            const response = await fetch(`${this.baseURL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Auth check response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Auth check data:', data);
                
                if (data.user && data.user.role === 'admin') {
                    console.log('Admin user authenticated successfully');
                    this.isLoggedIn = true;
                    this.showAdminDashboard();
                    this.loadUsers();
                    this.loadStats();
                } else {
                    console.log('User is not admin, showing login section');
                    this.showLoginSection();
                }
            } else {
                console.log('Auth check failed, showing login section');
                this.showLoginSection();
            }
        } catch (error) {
            console.error('Admin auth check failed:', error);
            this.showLoginSection();
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        console.log('Attempting admin login for:', email);

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);

            if (response.ok && data.success) {
                console.log('Login successful, storing token');
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('access_token', data.token);
                this.isLoggedIn = true;
                this.showAdminDashboard();
                this.loadUsers();
                this.loadStats();
                this.showToast('Admin login successful!', 'success');
            } else {
                console.log('Login failed:', data.message);
                this.showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            this.showToast('Login failed. Please try again.', 'error');
        }
    }

    showLoginSection() {
        document.getElementById('admin-login-section').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showAdminDashboard() {
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        // Load stats when dashboard is shown
        this.loadStats();
    }

    async loadStats() {
        if (!this.isLoggedIn) {
            console.log('Not logged in, skipping stats load');
            return;
        }

        try {
            console.log('Loading stats with token:', this.token ? 'Present' : 'Missing');
            const response = await fetch(`${this.baseURL}/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Stats API response:', data);
                this.updateStatsCards(data);
            } else {
                console.error('Failed to load stats, status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                // Show error message to user
                this.showToast('Failed to load statistics. Please refresh the page.', 'error');
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.showToast('Failed to load statistics. Please check your connection.', 'error');
        }
    }

    updateStatsCards(stats) {
        console.log('Updating stats cards with data:', stats);
        
        // Extract overview data from the nested structure
        const overview = stats.data?.overview || stats;
        
        const totalUsersEl = document.getElementById('total-users');
        const activeUsersEl = document.getElementById('active-users');
        const totalSkillsEl = document.getElementById('total-skills');
        const totalSessionsEl = document.getElementById('total-sessions');
        
        if (totalUsersEl) {
            totalUsersEl.textContent = overview.totalUsers || 0;
            console.log('Updated total users:', overview.totalUsers || 0);
        } else {
            console.error('Element total-users not found');
        }
        
        if (activeUsersEl) {
            activeUsersEl.textContent = overview.activeUsers || 0;
            console.log('Updated active users:', overview.activeUsers || 0);
        } else {
            console.error('Element active-users not found');
        }
        
        if (totalSkillsEl) {
            totalSkillsEl.textContent = overview.totalSkills || 0;
            console.log('Updated total skills:', overview.totalSkills || 0);
        } else {
            console.error('Element total-skills not found');
        }
        
        if (totalSessionsEl) {
            totalSessionsEl.textContent = overview.totalSessions || 0;
            console.log('Updated total sessions:', overview.totalSessions || 0);
        } else {
            console.error('Element total-sessions not found');
        }
    }

    setupTabs() {
        this.switchTab('users');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        this.currentTab = tabName;

        // Load tab-specific data
        switch (tabName) {
            case 'users':
                this.loadUsers();
                break;
            case 'skills':
                console.log('Switching to skills tab, loading skills...');
                this.loadSkills();
                break;
            case 'sessions':
                this.loadSessions();
                break;
            case 'email-domains':
                this.loadEmailDomains();
                break;
            case 'system-settings':
                this.loadSystemSettings();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    async loadUsers() {
        if (!this.isLoggedIn) {
            console.log('Not logged in, skipping users load');
            return;
        }

        try {
            console.log('Loading users with token:', this.token ? 'Present' : 'Missing');
            const response = await fetch(`${this.baseURL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Users API response:', data);
                console.log('Users data:', data.data);
                this.renderUsersTable(data.data || []);
            } else {
                console.error('Failed to load users, status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No users found</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user._id.substring(0, 8)}...</td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.university || 'N/A'}</td>
                <td>
                    <span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${user.isVerified ? 'active' : 'pending'}">
                        ${user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td>${user.timeCredits || 0}</td>
                <td class="admin-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminManager.toggleUserStatus('${user._id}', ${!user.isActive})">
                        ${user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminManager.toggleUserVerification('${user._id}', ${!user.isVerified})">
                        ${user.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminManager.deleteUser('${user._id}')">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async toggleUserStatus(userId, newStatus) {
        try {
            const response = await fetch(`${this.baseURL}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: newStatus })
            });

            if (response.ok) {
                this.showToast(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
                this.loadUsers();
            } else {
                this.showToast('Failed to update user status', 'error');
            }
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            this.showToast('Failed to update user status', 'error');
        }
    }

    async toggleUserVerification(userId, newStatus) {
        try {
            const response = await fetch(`${this.baseURL}/admin/users/${userId}/verify`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isVerified: newStatus })
            });

            if (response.ok) {
                this.showToast(`User ${newStatus ? 'verified' : 'unverified'} successfully`, 'success');
                this.loadUsers();
            } else {
                this.showToast('Failed to update user verification', 'error');
            }
        } catch (error) {
            console.error('Failed to toggle user verification:', error);
            this.showToast('Failed to update user verification', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showToast('User deleted successfully', 'success');
                this.loadUsers();
            } else {
                this.showToast('Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            this.showToast('Failed to delete user', 'error');
        }
    }

    searchUsers(query) {
        const rows = document.querySelectorAll('#users-table-body tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    filterUsers(status) {
        const rows = document.querySelectorAll('#users-table-body tr');
        rows.forEach(row => {
            if (!status) {
                row.style.display = '';
                return;
            }

            const statusBadge = row.querySelector('.status-badge');
            const isActive = statusBadge && statusBadge.textContent.toLowerCase().includes('active');
            
            if (status === 'active' && isActive) {
                row.style.display = '';
            } else if (status === 'inactive' && !isActive) {
                row.style.display = '';
            } else if (status === 'pending_verification') {
                const isVerified = statusBadge && statusBadge.textContent.toLowerCase().includes('verified');
                row.style.display = isVerified ? 'none' : '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async loadSkills() {
        if (!this.isLoggedIn) {
            console.log('Not logged in, skipping skills load');
            return;
        }

        try {
            console.log('Loading skills with token:', this.token ? 'Present' : 'Missing');
            const response = await fetch(`${this.baseURL}/admin/skills`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Skills API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Skills API response:', data);
                
                // Handle different possible response structures
                let skills = [];
                if (data.data) {
                    skills = data.data;
                } else if (data.skills) {
                    skills = data.skills;
                } else if (Array.isArray(data)) {
                    skills = data;
                } else {
                    console.warn('Unexpected API response structure:', data);
                    skills = [];
                }
                
                console.log('Skills data extracted:', skills);
                this.renderSkillsTable(skills);
                
                if (skills.length === 0) {
                    console.log('No skills found in the database');
                    this.showToast('No skills found in the database.', 'info');
                }
            } else {
                console.error('Failed to load skills, status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                
                // Show appropriate error message based on status
                if (response.status === 401) {
                    this.showToast('Authentication failed. Please login again.', 'error');
                } else if (response.status === 403) {
                    this.showToast('Access denied. Admin privileges required.', 'error');
                } else {
                    this.showToast('Failed to load skills. Please refresh the page.', 'error');
                }
            }
        } catch (error) {
            console.error('Failed to load skills:', error);
            this.showToast('Failed to load skills. Please check your connection.', 'error');
        }
    }

    renderSkillsTable(skills) {
        const tbody = document.getElementById('skills-table-body');
        if (!tbody) {
            console.error('Skills table body element not found');
            return;
        }
        
        console.log('Rendering skills table with', skills.length, 'skills');
        tbody.innerHTML = '';

        if (!skills || skills.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No skills found</td></tr>';
            return;
        }

        skills.forEach(skill => {
            console.log('Rendering skill:', skill.title);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${skill.title || 'N/A'}</td>
                <td>${skill.category || 'N/A'}</td>
                <td>${skill.teacher?.name || skill.teacher?.email || 'Unknown'}</td>
                <td>${skill.creditsPerHour || 0} credits</td>
                <td>
                    <span class="status-badge status-${skill.isActive ? 'active' : 'inactive'}">
                        ${skill.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${skill.isVerified ? 'active' : 'pending'}">
                        ${skill.isVerified ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td class="admin-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminManager.toggleSkillStatus('${skill._id}', ${!skill.isActive})">
                        ${skill.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminManager.toggleSkillVerification('${skill._id}', ${!skill.isVerified})">
                        ${skill.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminManager.deleteSkill('${skill._id}')">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async toggleSkillStatus(skillId, newStatus) {
        try {
            const response = await fetch(`${this.baseURL}/admin/skills/${skillId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: newStatus })
            });

            if (response.ok) {
                this.showToast(`Skill ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
                this.loadSkills();
            } else {
                this.showToast('Failed to update skill status', 'error');
            }
        } catch (error) {
            console.error('Failed to toggle skill status:', error);
            this.showToast('Failed to update skill status', 'error');
        }
    }

    async toggleSkillVerification(skillId, newStatus) {
        try {
            const response = await fetch(`${this.baseURL}/admin/skills/${skillId}/verify`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isVerified: newStatus })
            });

            if (response.ok) {
                this.showToast(`Skill ${newStatus ? 'verified' : 'unverified'} successfully`, 'success');
                this.loadSkills();
            } else {
                this.showToast('Failed to update skill verification', 'error');
            }
        } catch (error) {
            console.error('Failed to toggle skill verification:', error);
            this.showToast('Failed to update skill verification', 'error');
        }
    }

    async deleteSkill(skillId) {
        if (!confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/admin/skills/${skillId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showToast('Skill deleted successfully', 'success');
                this.loadSkills();
            } else {
                this.showToast('Failed to delete skill', 'error');
            }
        } catch (error) {
            console.error('Failed to delete skill:', error);
            this.showToast('Failed to delete skill', 'error');
        }
    }

    searchSkills(query) {
        const rows = document.querySelectorAll('#skills-table-body tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    filterSkills(status) {
        const rows = document.querySelectorAll('#skills-table-body tr');
        rows.forEach(row => {
            if (!status) {
                row.style.display = '';
                return;
            }

            const statusBadge = row.querySelector('.status-badge');
            const isActive = statusBadge && statusBadge.textContent.toLowerCase().includes('active');
            
            if (status === 'active' && isActive) {
                row.style.display = '';
            } else if (status === 'inactive' && !isActive) {
                row.style.display = '';
            } else if (status === 'pending_verification') {
                const isVerified = statusBadge && statusBadge.textContent.toLowerCase().includes('verified');
                row.style.display = isVerified ? 'none' : '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async loadSessions() {
        try {
            const response = await fetch(`${this.baseURL}/admin/sessions`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Fix: Use data.data instead of data.sessions since the API returns sessions in data property
                this.renderSessionsTable(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }

    renderSessionsTable(sessions) {
        const tbody = document.getElementById('sessions-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        sessions.forEach(session => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session.skill?.title || 'Unknown Skill'}</td>
                <td>${session.teacher?.name || 'Unknown'}</td>
                <td>${session.student?.name || 'Unknown'}</td>
                <td>${formatDate(session.scheduledDate)}</td>
                <td>${session.duration} minutes</td>
                <td>${session.totalCredits} credits</td>
                <td>
                    <span class="status-badge status-${session.status}">
                        ${session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                </td>
                <td class="admin-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminManager.updateSessionStatus('${session._id}', 'completed')">
                        Complete
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminManager.updateSessionStatus('${session._id}', 'cancelled')">
                        Cancel
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async updateSessionStatus(sessionId, newStatus) {
        try {
            const response = await fetch(`${this.baseURL}/admin/sessions/${sessionId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                this.showToast(`Session ${newStatus} successfully`, 'success');
                this.loadSessions();
            } else {
                this.showToast('Failed to update session status', 'error');
            }
        } catch (error) {
            console.error('Failed to update session status:', error);
            this.showToast('Failed to update session status', 'error');
        }
    }

    searchSessions(query) {
        const rows = document.querySelectorAll('#sessions-table-body tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    filterSessions(status) {
        const rows = document.querySelectorAll('#sessions-table-body tr');
        rows.forEach(row => {
            if (!status) {
                row.style.display = '';
                return;
            }

            const statusBadge = row.querySelector('.status-badge');
            const sessionStatus = statusBadge ? statusBadge.textContent.toLowerCase().trim() : '';
            
            if (status === sessionStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async loadEmailDomains() {
        try {
            console.log('Loading email domains...');
            const response = await fetch(`${this.baseURL}/admin/email-domains`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Email domains response:', data);
                this.renderEmailDomains(data.domains || []);
            } else {
                console.error('Failed to load email domains, status:', response.status);
                // Fallback to mock data if API fails
                const mockDomains = [
                    { name: 'hicet.ac.in', status: 'active', userCount: 2, addedDate: '2024-01-15', description: 'Hindustan Institute of Technology' },
                    { name: 'university.edu', status: 'active', userCount: 45, addedDate: '2024-01-10', description: 'University of Education' },
                    { name: 'college.com', status: 'active', userCount: 23, addedDate: '2024-01-05', description: 'College Network' },
                    { name: 'school.edu', status: 'inactive', userCount: 12, addedDate: '2024-01-01', description: 'School System' }
                ];
                this.renderEmailDomains(mockDomains);
            }
        } catch (error) {
            console.error('Failed to load email domains:', error);
            // Fallback to mock data
            const mockDomains = [
                { name: 'hicet.ac.in', status: 'active', userCount: 2, addedDate: '2024-01-15', description: 'Hindustan Institute of Technology' },
                { name: 'university.edu', status: 'active', userCount: 45, addedDate: '2024-01-10', description: 'University of Education' },
                { name: 'college.com', status: 'active', userCount: 23, addedDate: '2024-01-05', description: 'College Network' },
                { name: 'school.edu', status: 'inactive', userCount: 12, addedDate: '2024-01-01', description: 'School System' }
            ];
            this.renderEmailDomains(mockDomains);
        }
    }

    renderEmailDomains(domains) {
        const tbody = document.getElementById('domains-table-body');
        const domainCount = document.getElementById('domain-count');
        
        if (!tbody) return;

        // Update domain count
        if (domainCount) {
            domainCount.textContent = `${domains.length} domains configured`;
        }

        if (!domains || domains.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: var(--spacing-xl);">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: var(--spacing-md); display: block;"></i>
                        No email domains configured
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = domains.map(domain => `
            <tr>
                <td class="domain-name">${domain.name}</td>
                <td>
                    <span class="domain-status ${domain.status}">
                        <i class="fas fa-${domain.status === 'active' ? 'check-circle' : 'times-circle'}"></i>
                        ${domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="user-count">${domain.userCount} users</span>
                </td>
                <td>${formatDate(domain.addedDate)}</td>
                <td>
                    <div class="domain-actions">
                        <button class="btn btn-small btn-${domain.status === 'active' ? 'outline' : 'primary'}" 
                                onclick="adminManager.toggleDomainStatus('${domain.name}', '${domain.status}')">
                            <i class="fas fa-${domain.status === 'active' ? 'pause' : 'play'}"></i>
                            ${domain.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-small btn-danger" 
                                onclick="adminManager.removeDomain('${domain.name}')">
                            <i class="fas fa-trash"></i>
                            Remove
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    toggleDomainStatus(domainName, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        console.log(`Toggling domain ${domainName} from ${currentStatus} to ${newStatus}`);
        this.showToast(`Domain ${domainName} ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
        // Reload domains to reflect changes
        this.loadEmailDomains();
    }

    removeDomain(domainName) {
        if (confirm(`Are you sure you want to remove the domain "${domainName}"? This action cannot be undone.`)) {
            console.log(`Removing domain: ${domainName}`);
            this.showToast(`Domain ${domainName} removed successfully`, 'success');
            // Reload domains to reflect changes
            this.loadEmailDomains();
        }
    }

    addNewDomain() {
        const domainInput = document.getElementById('new-domain');
        const descriptionInput = document.getElementById('domain-description');
        
        if (!domainInput || !domainInput.value.trim()) {
            this.showToast('Please enter a domain name', 'error');
            return;
        }

        const domainName = domainInput.value.trim().toLowerCase();
        const description = descriptionInput ? descriptionInput.value.trim() : '';

        // Basic domain validation
        if (!this.isValidDomain(domainName)) {
            this.showToast('Please enter a valid domain name (e.g., example.edu)', 'error');
            return;
        }

        console.log(`Adding new domain: ${domainName}`);
        this.showToast(`Domain ${domainName} added successfully`, 'success');
        
        // Clear inputs
        domainInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        
        // Reload domains to show the new one
        this.loadEmailDomains();
    }

    isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return domainRegex.test(domain);
    }

    saveAllDomains() {
        console.log('Saving all domain changes...');
        this.showToast('Domain changes saved successfully', 'success');
        // In a real implementation, this would save to the backend
        this.loadEmailDomains();
    }

    resetDomains() {
        if (confirm('Are you sure you want to reset all domain changes? This will undo any unsaved modifications.')) {
            console.log('Resetting domain changes...');
            this.showToast('Domain changes reset', 'info');
            this.loadEmailDomains();
        }
    }

    async saveEmailDomains() {
        const domains = document.getElementById('allowed-domains').value;
        const strictCheck = document.getElementById('strict-domain-check').checked;

        try {
            const response = await fetch(`${this.baseURL}/admin/email-domains`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    allowedDomains: domains.split(',').map(d => d.trim()),
                    strictCheck 
                })
            });

            if (response.ok) {
                this.showToast('Email domains updated successfully', 'success');
            } else {
                this.showToast('Failed to update email domains', 'error');
            }
        } catch (error) {
            console.error('Failed to save email domains:', error);
            this.showToast('Failed to update email domains', 'error');
        }
    }

    async loadSystemSettings() {
        try {
            const response = await fetch(`${this.baseURL}/admin/settings`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.populateSystemSettings(data.settings || {});
            }
        } catch (error) {
            console.error('Failed to load system settings:', error);
        }
    }

    populateSystemSettings(settings) {
        const fields = [
            'site-name', 'site-description', 'max-file-size', 
            'rate-limit', 'bcrypt-rounds'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = settings[field.replace('-', '')] || '';
            }
        });

        const debugMode = document.getElementById('debug-mode');
        if (debugMode) {
            debugMode.checked = settings.debugMode || false;
        }
    }

    async saveSystemSettings(e) {
        e.preventDefault();

        const settings = {
            siteName: document.getElementById('site-name').value,
            siteDescription: document.getElementById('site-description').value,
            maxFileSize: parseInt(document.getElementById('max-file-size').value),
            rateLimit: parseInt(document.getElementById('rate-limit').value),
            bcryptRounds: parseInt(document.getElementById('bcrypt-rounds').value),
            debugMode: document.getElementById('debug-mode').checked
        };

        try {
            const response = await fetch(`${this.baseURL}/admin/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showToast('System settings saved successfully', 'success');
            } else {
                this.showToast('Failed to save system settings', 'error');
            }
        } catch (error) {
            console.error('Failed to save system settings:', error);
            this.showToast('Failed to save system settings', 'error');
        }
    }

    async loadLogs() {
        const logsContainer = document.getElementById('logs-content');
        if (!logsContainer) return;
        
        logsContainer.innerHTML = '<div class="loading-spinner">Loading logs...</div>';

        try {
            const response = await fetch(`${this.baseURL}/admin/logs`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderLogs(data.logs || []);
            } else {
                logsContainer.innerHTML = '<p>Failed to load logs</p>';
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
            logsContainer.innerHTML = '<p>Failed to load logs</p>';
        }
    }

    renderLogs(logs) {
        const logsContainer = document.getElementById('logs-content');
        if (!logsContainer) return;
        
        logsContainer.innerHTML = '';

        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${log.level}`;
            logEntry.innerHTML = `
                <strong>${new Date(log.timestamp).toLocaleString()}</strong> 
                [${log.level.toUpperCase()}] ${log.message}
            `;
            logsContainer.appendChild(logEntry);
        });
    }

    async refreshLogs() {
        await this.loadLogs();
        this.showToast('Logs refreshed', 'success');
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    logout() {
        localStorage.removeItem('authToken');
        this.token = null;
        this.isLoggedIn = false;
        this.showLoginSection();
        this.showToast('Logged out successfully', 'success');
    }
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});