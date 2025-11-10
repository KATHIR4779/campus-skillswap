// Campus SkillSwap - Main JavaScript File

// Global variables
let currentUser = null;
let isLoggedIn = false;

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="${iconMap[type] || iconMap.info}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Make showToast globally available
window.showToast = showToast;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js loaded and DOMContentLoaded fired');
    console.log('Current pathname:', window.location.pathname);
    
    // Initialize core functionality
    initializeApp();
    initializeResponsiveEnhancements();
    
    // Page-specific initialization
    const page = window.location.pathname.split('/').pop();
    console.log('Current page:', page);
    
    switch(page) {
        case '':
        case 'index.html':
            initializeHomepage();
            break;
        case 'dashboard.html':
            initializeDashboard();
            break;
        case 'marketplace.html':
            initializeMarketplace();
            break;
        case 'contact.html':
            initializeContact();
            break;
        case 'ledger.html':
            initializeLedger();
            break;
        case 'resources.html':
            initializeResources();
            break;
        case 'profile.html':
            initializeProfile();
            break;
    }
});

function initializeApp() {
    // Initialize responsive utilities
    initializeResponsive();
    
    // Initialize authentication state first
    initializeAuth();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize modals
    initializeModals();
    
    // Initialize forms
    initializeForms();
    
    // Initialize authentication buttons (AuthManager handles the rest)
    initializeAuthButtons();
    
    // Check and update auth status - but let AuthManager take precedence if available
    if (!window.authManager) {
        checkAuthStatus();
    }
    
    // Initialize page-specific functionality
    initializePageSpecific();
}

// Responsive utilities and enhancements
function initializeResponsive() {
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
        document.head.appendChild(viewport);
    }
    
    // Add touch-action CSS for better touch performance
    if (!document.querySelector('#responsive-styles')) {
        const style = document.createElement('style');
        style.id = 'responsive-styles';
        style.textContent = `
            * {
                touch-action: manipulation;
            }
            
            /* Improve scrolling on iOS */
            .modal-body, .profile-content, .skills-grid {
                -webkit-overflow-scrolling: touch;
            }
            
            /* Prevent zoom on input focus for iOS */
            input, textarea, select {
                font-size: 16px !important;
            }
            
            /* Better focus indicators for keyboard navigation */
            .btn:focus, .nav-link:focus, input:focus, textarea:focus, select:focus {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            // Trigger resize event to recalculate layouts
            window.dispatchEvent(new Event('resize'));
        }, 100);
    });
    
    // Add device detection classes
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    document.body.classList.add(isMobile ? 'mobile' : 'desktop');
    if (isTablet) {
        document.body.classList.add('tablet');
    }
    document.body.classList.add(isTouch ? 'touch' : 'no-touch');
    
    // Add responsive breakpoint detection
    let currentBreakpoint = getCurrentBreakpoint();
    document.body.setAttribute('data-breakpoint', currentBreakpoint);
    
    window.addEventListener('resize', function() {
        const newBreakpoint = getCurrentBreakpoint();
        if (newBreakpoint !== currentBreakpoint) {
            currentBreakpoint = newBreakpoint;
            document.body.setAttribute('data-breakpoint', currentBreakpoint);
            
            // Dispatch custom event for breakpoint changes
            window.dispatchEvent(new CustomEvent('breakpointChange', {
                detail: { breakpoint: currentBreakpoint }
            }));
        }
    });
}

// Get current breakpoint based on window width
function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width >= 1920) return 'ultra-wide';
    if (width >= 1440) return 'large-desktop';
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    if (width >= 481) return 'mobile-landscape';
    return 'mobile-portrait';
}

// Enhanced Navigation functionality with responsive improvements
function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Prevent body scroll when menu is open on mobile
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close mobile menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Update navigation based on auth status
    updateNavigation();
}

function updateNavigation() {
    // If AuthManager is available, let it handle navigation updates
    if (window.authManager) {
        console.log('App deferring to AuthManager for navigation update');
        window.authManager.updateAuthUI();
        return;
    }
    
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;
    
    console.log('App updateNavigation called with isLoggedIn:', isLoggedIn, 'currentUser:', currentUser);
    
    // Preserve theme button
    const themeBtn = navAuth.querySelector('#theme-btn');
    const themeBtnHTML = themeBtn ? themeBtn.outerHTML : '';
    
    if (isLoggedIn && currentUser) {
        navAuth.innerHTML = `
            ${themeBtnHTML}
            <div class="user-menu">
                <div class="user-avatar-small">
                    <i class="fas fa-user"></i>
                </div>
                <span class="user-name">${currentUser.name}</span>
                <div class="user-dropdown">
                    <a href="profile.html" class="dropdown-item">
                        <i class="fas fa-user"></i>
                        <span>Profile</span>
                    </a>
                    <a href="dashboard.html" class="dropdown-item">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="messages.html" class="dropdown-item">
                        <i class="fas fa-envelope"></i>
                        <span>Messages</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        // Re-initialize theme button
        if (window.themeManager) {
            window.themeManager.bindEvents();
        }
    } else {
        navAuth.innerHTML = `
            ${themeBtnHTML}
            <a href="login.html" class="btn btn-outline">Login</a>
            <a href="register.html" class="btn btn-primary">Register</a>
        `;
        
        // Re-initialize theme button
        if (window.themeManager) {
            window.themeManager.bindEvents();
        }
    }
}

// Modal functionality
function initializeModals() {
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Close modal when clicking close button
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not([style*="display: none"])');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus first input in modal
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form if it's a form modal
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Authentication buttons functionality
function initializeAuthButtons() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const getStartedBtn = document.getElementById('get-started-btn');
    const joinNowBtn = document.getElementById('join-now-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Check if we're on login page, if not redirect
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Check if we're on register page, if not redirect
            if (!window.location.pathname.includes('register.html')) {
                window.location.href = 'register.html';
            }
        });
    }
    
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }
    
    if (joinNowBtn) {
        joinNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }
}

// Form functionality
function initializeForms() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Add skill form
    const addSkillForm = document.getElementById('add-skill-form');
    if (addSkillForm) {
        addSkillForm.addEventListener('submit', handleAddSkill);
    }
    
    // Switch between login and register modals
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('login-modal');
            openModal('register-modal');
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('register-modal');
            openModal('login-modal');
        });
    }
}

// Authentication functions
function initializeAuth() {
    // Check for stored user data using multiple possible keys
    const possibleKeys = ['campusSkillSwapUser', 'userData', 'current_user'];
    
    for (const key of possibleKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const user = JSON.parse(stored);
                if (user && user.email && user.email !== 'test@example.com') {
                    currentUser = user;
                    isLoggedIn = true;
                    console.log('App: Auth state initialized with user from key:', key, user);
                    return; // Found valid user, exit
                }
            } catch (e) {
                console.error('Error parsing stored user data from key:', key, e);
                localStorage.removeItem(key);
            }
        }
    }
    
    // No valid user found
    currentUser = null;
    isLoggedIn = false;
    console.log('App: No valid auth state found');
}

function checkAuthStatus() {
    if (isLoggedIn && currentUser) {
        // Update UI for logged-in user
        updateUserInterface();
    }
    
    // Always update navigation regardless of auth status
    updateNavigation();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Simple validation
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    showLoading(e.target.querySelector('button[type="submit"]'));
    
    try {
        // Call API to login
        const response = await API.login(email, password);
        
        // Get user profile
        currentUser = await API.getCurrentUser();
        isLoggedIn = true;
        localStorage.setItem('campusSkillSwapUser', JSON.stringify(currentUser));
        
        hideLoading(e.target.querySelector('button[type="submit"]'));
        closeModal('login-modal');
        showToast('Login successful!', 'success');
        
        // Update UI
        updateUserInterface();
        updateNavigation();
        
        // Redirect to dashboard if on homepage
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
    } catch (error) {
        hideLoading(e.target.querySelector('button[type="submit"]'));
        showToast(error.message || 'Login failed', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const major = formData.get('major');
    const year = formData.get('year');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validation
    if (!name || !email || !major || !year || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    // Simple email validation
    if (!email.includes('@') || !email.includes('.')) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    showLoading(e.target.querySelector('button[type="submit"]'));
    
    try {
        // Call API to register
        const userData = {
            name: name,
            email: email,
            university: 'Hindustan Institute of Technology and Science', // Default university
            major: major,
            year: year,
            password: password
        };
        
        await API.register(userData);
        
        hideLoading(e.target.querySelector('button[type="submit"]'));
        closeModal('register-modal');
        showToast('Registration successful! Please check your email to verify your account.', 'success');
        
        // Redirect to login
        setTimeout(() => {
            openModal('login-modal');
        }, 2000);
        
    } catch (error) {
        hideLoading(e.target.querySelector('button[type="submit"]'));
        showToast(error.message || 'Registration failed', 'error');
    }
}

async function logout() {
    try {
        await API.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        currentUser = null;
        isLoggedIn = false;
        localStorage.removeItem('campusSkillSwapUser');
        
        showToast('Logged out successfully', 'success');
        
        // Update UI
        updateNavigation();
        
        // Redirect to homepage
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

function updateUserInterface() {
    // Update welcome message if on dashboard
    const welcomeName = document.getElementById('welcome-name');
    const userDetails = document.getElementById('user-details');
    
    if (welcomeName && currentUser) {
        welcomeName.textContent = `Welcome back, ${currentUser.name}!`;
    }
    
    if (userDetails && currentUser) {
        userDetails.textContent = `${currentUser.major}, ${currentUser.year}`;
    }
    
    // Update stats if on dashboard
    updateDashboardStats();
}

function updateDashboardStats() {
    if (!currentUser) return;
    
    const timeCredits = document.getElementById('time-credits');
    const userRating = document.getElementById('user-rating');
    const skillsTaught = document.getElementById('skills-taught');
    const skillsLearned = document.getElementById('skills-learned');
    
    if (timeCredits) timeCredits.textContent = currentUser.timeCredits || currentUser.credits || '0';
    if (userRating) {
        const rating = currentUser.rating?.average || currentUser.rating;
        // Convert to number and ensure it's valid
        const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
        userRating.textContent = numericRating.toFixed(1);
    }
    if (skillsTaught) skillsTaught.textContent = currentUser.stats?.sessionsTaught || currentUser.skillsTaught || '0';
    if (skillsLearned) skillsLearned.textContent = currentUser.stats?.sessionsCompleted || currentUser.skillsLearned || '0';
}

// Contact form handling
function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    // Validation
    if (!name || !email || !subject || !message) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate form submission
    showLoading(e.target.querySelector('button[type="submit"]'));
    
    setTimeout(() => {
        hideLoading(e.target.querySelector('button[type="submit"]'));
        e.target.reset();
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
    }, 2000);
}

// Add skill form handling
function handleAddSkill(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const category = formData.get('category');
    const description = formData.get('description');
    const credits = formData.get('credits');
    const tags = formData.get('tags');
    
    // Validation
    if (!title || !category || !description || !credits) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate skill addition
    showLoading(e.target.querySelector('button[type="submit"]'));
    
    setTimeout(() => {
        hideLoading(e.target.querySelector('button[type="submit"]'));
        e.target.reset();
        closeModal('add-skill-modal');
        showToast('Skill added successfully!', 'success');
        
        // Update skills list if on dashboard
        updateSkillsList();
    }, 1500);
}

function updateSkillsList() {
    const skillsList = document.getElementById('my-skills-list');
    if (!skillsList) return;
    
    // Skills will be loaded from API
    const skills = [];
    
    skillsList.innerHTML = skills.map(skill => `
        <div class="skill-item">
            <div class="skill-header">
                <i class="fas fa-${getSkillIcon(skill.category)}"></i>
                <div class="skill-info">
                    <h4>${skill.title}</h4>
                    <span class="skill-category">${skill.category}</span>
                </div>
            </div>
            <div class="skill-meta">
                <span class="skill-credits">${skill.credits} Credits/hour</span>
                <button class="btn btn-outline btn-small">Edit</button>
            </div>
        </div>
    `).join('');
}

function getSkillIcon(category) {
    const icons = {
        'Technology': 'code',
        'Academics': 'graduation-cap',
        'Arts': 'palette',
        'Language': 'language',
        'Life Skills': 'utensils',
        'Sports': 'running'
    };
    return icons[category] || 'star';
}

// Page-specific initialization with responsive enhancements
function initializePageSpecific() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Add responsive enhancements for all pages
    initializeResponsiveEnhancements();
    
    switch (currentPage) {
        case 'dashboard.html':
            initializeDashboard();
            break;
        case 'marketplace.html':
            initializeMarketplace();
            break;
        case 'contact.html':
            initializeContact();
            break;
        case 'features.html':
            initializeLedger();
            break;
        case 'resources.html':
            initializeResources();
            break;
        case 'profile.html':
            initializeProfile();
            break;
    }
}

// Responsive enhancements for all pages
function initializeResponsiveEnhancements() {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading states for better UX
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        button.addEventListener('click', function() {
            if (this.closest('form').checkValidity()) {
                this.classList.add('loading');
                this.disabled = true;
                
                // Re-enable after a delay (in real app, this would be after API call)
                setTimeout(() => {
                    this.classList.remove('loading');
                    this.disabled = false;
                }, 2000);
            }
        });
    });
    
    // Add intersection observer for animations
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.profile-card, .skill-card, .feature-card, .testimonial-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    // Add keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                openModal.style.display = 'none';
            }
        }
        
        // Tab navigation improvements
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    // Remove keyboard navigation class on mouse use
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Handle window resize for responsive adjustments
    window.addEventListener('resize', debounce(function() {
        // Recalculate any layout-dependent elements
        const cards = document.querySelectorAll('.profile-card, .skill-card');
        cards.forEach(card => {
            // Trigger reflow for better responsive behavior
            card.style.transform = 'translateZ(0)';
        });
    }, 250));
}

// Profile page specific initialization
function initializeProfile() {
    // Add responsive profile enhancements
    const profileActions = document.querySelector('.profile-actions');
    if (profileActions) {
        // Add responsive button stacking
        window.addEventListener('resize', debounce(function() {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                profileActions.style.flexDirection = 'column';
                profileActions.style.gap = 'var(--spacing-md)';
            } else {
                profileActions.style.flexDirection = 'row';
                profileActions.style.gap = 'var(--spacing-lg)';
            }
        }, 250));
    }
    
    // Add touch-friendly interactions for mobile
    if ('ontouchstart' in window) {
        document.querySelectorAll('.profile-card').forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            card.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }
    
    // Load user profile data
    loadUserProfileData();
}

// Load and populate user profile data
async function loadUserProfileData() {
    try {
        let user = null;
        
        // Try to get user from API first
        if (window.apiClient && window.apiClient.getCurrentUser) {
            user = await window.apiClient.getCurrentUser();
        }
        
        // Fallback to localStorage if API fails
        if (!user) {
            const storedUser = localStorage.getItem('userData') || localStorage.getItem('current_user');
            if (storedUser) {
                user = JSON.parse(storedUser);
            }
        }
        
        if (user) {
            populateProfileData(user);
        }
    } catch (error) {
        console.error('Error loading user profile data:', error);
        
        // Try to load from localStorage as fallback
        try {
            const storedUser = localStorage.getItem('userData') || localStorage.getItem('current_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                populateProfileData(user);
            }
        } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
        }
    }
}

// Populate profile page with user data
function populateProfileData(user) {
    // Update basic profile info
    const profileName = document.getElementById('profile-name');
    const profileMajor = document.getElementById('profile-major');
    
    if (profileName) {
        profileName.textContent = user.name || 'Unknown';
    }
    
    if (profileMajor) {
        profileMajor.textContent = `${user.major || 'Major'}, ${user.year || 'Year'}`;
    }
    
    // Update profile rating
    const profileStars = document.getElementById('profile-stars');
    const profileRatingText = document.getElementById('profile-rating-text');
    
    if (profileStars && profileRatingText) {
        const rating = user.rating?.average || user.rating || 0;
        const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
        
        // Generate star icons
        profileStars.innerHTML = generateStars(numericRating);
        profileRatingText.textContent = `(${numericRating.toFixed(1)})`;
    }
    
    // Update profile stats
    const profileCredits = document.getElementById('profile-credits');
    const profileSessions = document.getElementById('profile-sessions');
    const profileStudents = document.getElementById('profile-students');
    
    if (profileCredits) {
        profileCredits.textContent = user.timeCredits || user.credits || '0';
    }
    
    if (profileSessions) {
        const sessionsTaught = user.stats?.sessionsTaught || 0;
        const sessionsCompleted = user.stats?.sessionsCompleted || 0;
        profileSessions.textContent = sessionsTaught + sessionsCompleted;
    }
    
    if (profileStudents) {
        profileStudents.textContent = user.stats?.studentsHelped || '0';
    }
    
    // Update detailed profile info
    const infoName = document.getElementById('info-name');
    const infoEmail = document.getElementById('info-email');
    const infoMajor = document.getElementById('info-major');
    const infoYear = document.getElementById('info-year');
    const infoUniversity = document.getElementById('info-university');
    const infoMemberSince = document.getElementById('info-member-since');
    
    if (infoName) infoName.textContent = user.name || 'Unknown';
    if (infoEmail) infoEmail.textContent = user.email || 'Unknown';
    if (infoMajor) infoMajor.textContent = user.major || 'Unknown';
    if (infoYear) infoYear.textContent = user.year || 'Unknown';
    if (infoUniversity) infoUniversity.textContent = user.university || 'Unknown';
    
    if (infoMemberSince && user.memberSince) {
        const memberSince = new Date(user.memberSince);
        infoMemberSince.textContent = memberSince.toLocaleDateString();
    }
    
    // Update bio
    const profileBio = document.getElementById('profile-bio');
    if (profileBio) {
        profileBio.textContent = user.bio || 'No bio available. Click edit to add your bio.';
    }
    
    // Update interests
    const profileInterests = document.getElementById('profile-interests');
    if (profileInterests && user.interests && Array.isArray(user.interests)) {
        profileInterests.innerHTML = user.interests.map(interest => 
            `<span class="tag">${interest}</span>`
        ).join('');
    }
    
    // Update teaching preferences
    const prefLocation = document.getElementById('pref-location');
    const prefDays = document.getElementById('pref-days');
    const prefTime = document.getElementById('pref-time');
    const prefDuration = document.getElementById('pref-duration');
    
    if (prefLocation && user.teachingPreferences?.location) {
        const locationMap = {
            'campus-library': 'Campus Library',
            'campus-cafeteria': 'Campus Cafeteria',
            'study-rooms': 'Study Rooms',
            'online': 'Online',
            'flexible': 'Flexible'
        };
        prefLocation.textContent = locationMap[user.teachingPreferences.location] || user.teachingPreferences.location;
    }
    
    if (prefDays && user.teachingPreferences?.availableDays) {
        prefDays.textContent = Array.isArray(user.teachingPreferences.availableDays) 
            ? user.teachingPreferences.availableDays.join(', ') 
            : user.teachingPreferences.availableDays;
    }
    
    if (prefDuration && user.teachingPreferences?.sessionDuration) {
        const durationMap = {
            '30min': '30 minutes',
            '1hour': '1 hour',
            '1.5hours': '1.5 hours',
            '2hours': '2 hours'
        };
        prefDuration.textContent = durationMap[user.teachingPreferences.sessionDuration] || user.teachingPreferences.sessionDuration;
    }
}

function initializeDashboard() {
    // Dashboard-specific initialization
    if (currentUser) {
        updateDashboardStats();
        updateSkillsList();
        loadRecentActivity();
        loadUpcomingSessions();
        loadPendingRequests();
    }
    
    // Add skill button
    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', () => {
            window.location.href = 'add-skill.html';
        });
    }
    
    // Browse skills button
    const browseSkillsBtn = document.getElementById('browse-skills-btn');
    if (browseSkillsBtn) {
        browseSkillsBtn.addEventListener('click', () => {
            window.location.href = 'marketplace.html';
        });
    }
}

function initializeMarketplace() {
    // Marketplace-specific initialization
    loadSkills();
    initializeSearch();
    initializeFilters();
    // initializeSkillCards and initializeLoadMore are handled in marketplace.js
}

function initializeContact() {
    // Contact-specific initialization
    initializeFAQ();
}

function initializeLedger() {
    // Ledger-specific initialization
    if (currentUser) {
        updateCreditsDisplay();
        loadTransactionHistory();
        loadSkillsList();
        loadMessages();
    }
}

function initializeResources() {
    // Resources-specific initialization
    loadSkills();
    initializeSearch();
}

// Utility functions
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showLoading(button) {
    if (!button) return;
    
    button.disabled = true;
    button.classList.add('loading');
    
    const originalText = button.textContent;
    button.innerHTML = '<span class="spinner"></span> Loading...';
    button.dataset.originalText = originalText;
}

function hideLoading(button) {
    if (!button) return;
    
    button.disabled = false;
    button.classList.remove('loading');
    
    const originalText = button.dataset.originalText;
    if (originalText) {
        button.textContent = originalText;
        delete button.dataset.originalText;
    }
}

// Mock data functions
function loadRecentActivity() {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;
    
    // Activities will be loaded from API
    const activities = [];
    
    activityFeed.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.message}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        'session': 'check-circle',
        'skill': 'plus-circle',
        'request': 'bell'
    };
    return icons[type] || 'circle';
}

function loadUpcomingSessions() {
    const sessionsList = document.getElementById('upcoming-sessions');
    if (!sessionsList) return;
    
    // Sessions will be loaded from API
    const sessions = [];
    
    sessionsList.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-info">
                <h4>${session.skill}</h4>
                <p>with ${session.teacher}</p>
                <span class="session-time">${session.time}</span>
            </div>
            <div class="session-credits">${session.credits} credits</div>
        </div>
    `).join('');
}

function loadPendingRequests() {
    const requestsList = document.getElementById('pending-requests');
    if (!requestsList) return;
    
    // Requests will be loaded from API
    const requests = [];
    
    requestsList.innerHTML = requests.map(request => `
        <div class="request-item">
            <div class="request-info">
                <h4>${request.student}</h4>
                <p>wants to learn ${request.skill}</p>
                <span class="request-time">${request.time}</span>
            </div>
            <div class="request-actions">
                <button class="btn btn-primary btn-small">Accept</button>
                <button class="btn btn-outline btn-small">Decline</button>
            </div>
        </div>
    `).join('');
}

function loadSkills() {
    const skillsGrid = document.getElementById('skills-grid');
    if (!skillsGrid) return;
    
    // Skills will be loaded from API
    const skills = [];
    
    skillsGrid.innerHTML = skills.map(skill => `
        <div class="skill-item" data-skill-id="${skill.id}">
            <div class="skill-header">
                <i class="fas fa-${getSkillIcon(skill.category)}"></i>
                <div class="skill-info">
                    <h3>${skill.title}</h3>
                    <div class="skill-rating">
                        <div class="stars">
                            ${generateStars(skill.rating)}
                        </div>
                        <span>(${skill.rating})</span>
                    </div>
                </div>
            </div>
            <p>${skill.description}</p>
            <div class="skill-meta">
                <span class="skill-teacher">by ${skill.teacher}</span>
                <span class="skill-credits">${skill.credits} Credits/hour</span>
            </div>
            <div class="skill-actions">
                <button class="btn btn-primary" onclick="requestSession(${skill.id})">Request Session</button>
                <button class="btn btn-outline" onclick="viewSkillDetails(${skill.id})">View Details</button>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    // Ensure rating is a valid number
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    
    // Clamp rating between 0 and 5
    const clampedRating = Math.max(0, Math.min(5, numericRating));
    
    const fullStars = Math.floor(clampedRating);
    const hasHalfStar = clampedRating % 1 >= 0.5;
    let stars = '';
    
    // Generate full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Generate half star if needed
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Generate empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function initializeSearch() {
    const searchInput = document.getElementById('skill-search') || document.getElementById('marketQuery');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
}

function initializeFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilterChange);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', handleFilterChange);
    }
}

function handleSearch() {
    const searchInput = document.getElementById('skill-search') || document.getElementById('marketQuery');
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        const teacher = item.querySelector('.skill-teacher').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query) || teacher.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function handleFilterChange() {
    // Implement filtering logic
    console.log('Filter changed');
}

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                item.classList.toggle('active');
            });
        }
    });
}

// Global functions for skill interactions
function requestSession(skillId) {
    if (!isLoggedIn) {
        showToast('Please login to request a session', 'warning');
        openModal('login-modal');
        return;
    }
    
    showToast('Session request sent!', 'success');
}

function viewSkillDetails(skillId) {
    // Implement skill details modal
    showToast('Opening skill details...', 'info');
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other files
window.CampusSkillSwap = {
    openModal,
    closeModal,
    showToast,
    hideLoading,
    showLoading,
    currentUser: () => currentUser,
    isLoggedIn: () => isLoggedIn,
    generateStars
};

// Also export generateStars directly for backward compatibility
window.generateStars = generateStars;
