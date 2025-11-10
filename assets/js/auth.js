// Campus SkillSwap - Authentication Module

class AuthManager {
    constructor() {
        this.apiClient = new APIClient();
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Password strength indicator
        const passwordInput = document.getElementById('register-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
        }

        // Modal switching
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToRegister();
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLogin();
            });
        }

        // Logout functionality
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn') {
                this.handleLogout();
            }
        });

        // Modal close functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="block"]');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });

        // Google login functionality
        const googleLoginBtn = document.getElementById('google-login-btn');
        const googleRegisterBtn = document.getElementById('google-register-btn');
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGoogleAuth('login');
            });
        }
        
        if (googleRegisterBtn) {
            googleRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGoogleAuth('register');
            });
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Validate form
        if (!this.validateLoginForm(loginData)) {
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        try {
            const response = await this.apiClient.post('/auth/login', loginData);
            
            if (response.success) {
                // Store tokens
                this.apiClient.setToken(response.token);
                // Note: Backend doesn't currently return refresh tokens
                // if (response.refresh_token) {
                //     localStorage.setItem('refresh_token', response.refresh_token);
                // }

                // Get user profile
                await this.loadUserProfile();
                
                // Close modal and show success
                this.closeModal('login-modal');
                this.showToast('Login successful! Welcome back!', 'success');
                
                // Update UI
                this.updateAuthUI();
                
                // If already on dashboard, reload dashboard data
                if (window.location.pathname.includes('dashboard')) {
                    if (typeof loadDashboardData === 'function') {
                        loadDashboardData();
                    }
                } else {
                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const registerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            university: 'Hindustan Institute of Technology and Science', // Default for now
            major: formData.get('major'),
            year: formData.get('year'),
            password: formData.get('password')
        };

        // Validate form
        if (!this.validateRegisterForm(registerData, formData.get('confirmPassword'))) {
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;

        try {
            console.log('Attempting registration with data:', registerData);
            const response = await this.apiClient.post('/auth/register', registerData);
            console.log('Registration response:', response);
            
            if (response.success) {
                this.closeModal('register-modal');
                this.showToast('Registration successful! Please check your email to verify your account.', 'success');
                
                // Show email verification message
                this.showEmailVerificationMessage(registerData.email);
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.showToast(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateLoginForm(data) {
        if (!data.email || !data.password) {
            this.showToast('Please fill in all fields.', 'error');
            return false;
        }

        if (!this.isValidEmail(data.email)) {
            this.showToast('Please enter a valid email address.', 'error');
            return false;
        }

        return true;
    }

    validateRegisterForm(data, confirmPassword) {
        // Check required fields
        if (!data.name || !data.email || !data.major || !data.year || !data.password) {
            this.showToast('Please fill in all required fields.', 'error');
            return false;
        }

        // Validate email
        if (!this.isValidEmail(data.email)) {
            this.showToast('Please enter a valid email address.', 'error');
            return false;
        }

        // Check university email
        if (!data.email.includes('@hicet.ac.in')) {
            this.showToast('Please use your university email address (@hicet.ac.in).', 'error');
            return false;
        }

        // Validate password
        if (data.password.length < 8) {
            this.showToast('Password must be at least 8 characters long.', 'error');
            return false;
        }

        // Check password confirmation
        if (data.password !== confirmPassword) {
            this.showToast('Passwords do not match.', 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    updatePasswordStrength(password) {
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');
        
        if (!strengthFill || !strengthText) return;

        let strength = 0;
        let feedback = '';

        // Check password length
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Check for lowercase letters
        if (/[a-z]/.test(password)) strength++;

        // Check for uppercase letters
        if (/[A-Z]/.test(password)) strength++;

        // Check for numbers
        if (/\d/.test(password)) strength++;

        // Check for special characters
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        // Determine strength level and feedback
        if (strength <= 2) {
            strengthFill.className = 'strength-fill weak';
            feedback = 'Weak password';
        } else if (strength <= 4) {
            strengthFill.className = 'strength-fill medium';
            feedback = 'Medium password';
        } else {
            strengthFill.className = 'strength-fill strong';
            feedback = 'Strong password';
        }

        strengthText.textContent = feedback;
    }

    async loadUserProfile() {
        try {
            const response = await this.apiClient.get('/auth/me');
            if (response.success) {
                this.currentUser = response.user;
                this.isLoggedIn = true;
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                
                // Sync with app.js global variables
                if (window.currentUser !== undefined) {
                    window.currentUser = this.currentUser;
                }
                if (window.isLoggedIn !== undefined) {
                    window.isLoggedIn = this.isLoggedIn;
                }
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            // If authentication fails, clear the token and reset state
            this.apiClient.removeToken();
            this.currentUser = null;
            this.isLoggedIn = false;
            localStorage.removeItem('current_user');
            
            // Sync with app.js global variables
            if (window.currentUser !== undefined) {
                window.currentUser = null;
            }
            if (window.isLoggedIn !== undefined) {
                window.isLoggedIn = false;
            }
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('access_token');
        if (token) {
            this.apiClient.setToken(token);
            try {
                await this.loadUserProfile();
                this.updateAuthUI();
                
                // If on dashboard, reload dashboard data
                if (window.location.pathname.includes('dashboard') && typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
            } catch (error) {
                console.error('Authentication check failed:', error);
                // Clear invalid token and reset state
                this.apiClient.removeToken();
                this.currentUser = null;
                this.isLoggedIn = false;
                localStorage.removeItem('current_user');
                
                // Sync with app.js global variables
                if (window.currentUser !== undefined) {
                    window.currentUser = null;
                }
                if (window.isLoggedIn !== undefined) {
                    window.isLoggedIn = false;
                }
                
                this.updateAuthUI();
            }
        } else {
            // No token found, ensure logout state is synced
            this.currentUser = null;
            this.isLoggedIn = false;
            
            // Sync with app.js global variables
            if (window.currentUser !== undefined) {
                window.currentUser = null;
            }
            if (window.isLoggedIn !== undefined) {
                window.isLoggedIn = false;
            }
            
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const navAuth = document.getElementById('nav-auth');
        if (!navAuth) return;

        // Preserve theme toggle - look for the button with id="theme-btn"
        const themeButton = navAuth.querySelector('#theme-btn');
        const themeButtonHTML = themeButton ? themeButton.outerHTML : '';

        if (this.isLoggedIn && this.currentUser) {
            navAuth.innerHTML = `
                ${themeButtonHTML}
                <div class="user-menu">
                    <div class="user-avatar-small">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="user-name">${this.currentUser.name}</span>
                    <div class="user-dropdown">
                        <a href="profile.html" class="dropdown-item">
                            <i class="fas fa-user"></i> Profile
                        </a>
                        <a href="dashboard.html" class="dropdown-item">
                            <i class="fas fa-tachometer-alt"></i> Dashboard
                        </a>
                        <a href="messages.html" class="dropdown-item">
                            <i class="fas fa-envelope"></i> Messages
                        </a>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item" id="logout-btn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            `;
            
            // Re-bind theme button after HTML replacement
            if (themeButtonHTML && window.themeManager) {
                window.themeManager.bindEvents();
            }
        } else {
            navAuth.innerHTML = `
                ${themeButtonHTML}
                <button class="btn btn-outline" id="login-btn">Login</button>
                <button class="btn btn-primary" id="register-btn">Register</button>
            `;
            
            // Re-bind login/register button events
            this.bindAuthButtons();
            
            // Re-bind theme button after HTML replacement
            if (themeButtonHTML && window.themeManager) {
                window.themeManager.bindEvents();
            }
        }
    }

    bindAuthButtons() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const getStartedBtn = document.getElementById('get-started-btn');
        const joinNowBtn = document.getElementById('join-now-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('login-modal');
            });
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('register-modal');
            });
        }
        
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('register-modal');
            });
        }
        
        if (joinNowBtn) {
            joinNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('register-modal');
            });
        }
    }

    switchToRegister() {
        this.closeModal('login-modal');
        setTimeout(() => {
            this.openModal('register-modal');
        }, 300);
    }

    switchToLogin() {
        this.closeModal('register-modal');
        setTimeout(() => {
            this.openModal('login-modal');
        }, 300);
    }

    async handleLogout() {
        try {
            // Call logout endpoint
            await this.apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local data regardless of API call success
            this.apiClient.removeToken();
            localStorage.removeItem('current_user');
            this.currentUser = null;
            this.isLoggedIn = false;
            
            // Sync with app.js global variables
            if (window.currentUser !== undefined) {
                window.currentUser = null;
            }
            if (window.isLoggedIn !== undefined) {
                window.isLoggedIn = false;
            }
            
            // Update UI
            this.updateAuthUI();
            
            // Show success message
            this.showToast('Logged out successfully.', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Clear form
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    showEmailVerificationMessage(email) {
        const message = `
            <div class="email-verification-message">
                <div class="verification-icon">
                    <i class="fas fa-envelope"></i>
                </div>
                <h3>Check Your Email</h3>
                <p>We've sent a verification link to <strong>${email}</strong></p>
                <p>Please check your inbox and click the link to verify your account.</p>
                <div class="verification-actions">
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Got it!
                    </button>
                </div>
            </div>
        `;
        
        // Create and show message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'modal';
        messageDiv.style.display = 'block';
        messageDiv.innerHTML = `
            <div class="modal-content">
                <div class="modal-body">
                    ${message}
                </div>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
    }

    showToast(message, type = 'info') {
        console.log(`showToast called with message: "${message}", type: "${type}"`);
        
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        console.log(`Found ${existingToasts.length} existing toasts, removing them`);
        existingToasts.forEach(toast => toast.remove());

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        console.log('Toast element created:', toast);
        document.body.appendChild(toast);
        console.log('Toast appended to body');

        // Show toast
        setTimeout(() => {
            console.log('Adding show class to toast');
            toast.classList.add('show');
        }, 100);

        // Hide toast after 5 seconds
        setTimeout(() => {
            console.log('Removing show class from toast');
            toast.classList.remove('show');
            setTimeout(() => {
                console.log('Removing toast element');
                toast.remove();
            }, 300);
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Public methods for external use
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.isLoggedIn;
    }

    requireAuth() {
        if (!this.isLoggedIn) {
            this.openModal('login-modal');
            return false;
        }
        return true;
    }

    async handleGoogleAuth(action) {
        try {
            console.log(`Google ${action} clicked - OAuth integration needed`);
            
            // For now, show a message that Google OAuth needs to be configured
            console.log('Showing toast for Google OAuth...');
            this.showToast('Google OAuth integration coming soon! Please use email/password for now.', 'info');
            console.log('Toast should be visible now');
            
            // TODO: Implement actual Google OAuth
            // This would typically involve:
            // 1. Loading Google OAuth library
            // 2. Initializing Google OAuth client
            // 3. Handling OAuth flow
            // 4. Sending OAuth token to backend
            // 5. Processing authentication response
            
        } catch (error) {
            console.error('Google auth error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.showToast('Google authentication failed. Please try again.', 'error');
        }
    }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Make it globally available
window.authManager = authManager;
