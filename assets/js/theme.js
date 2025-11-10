// Campus SkillSwap - Theme Manager

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
    }

    init() {
        // Check system preference on first load
        if (!localStorage.getItem('theme')) {
            this.currentTheme = this.systemPreference.matches ? 'dark' : 'light';
        }
        
        this.setTheme(this.currentTheme);
        this.bindEvents();
    }

    bindEvents() {
        const themeBtn = document.getElementById('theme-btn');
        console.log('ThemeManager: Looking for theme button:', themeBtn);
        if (themeBtn) {
            console.log('ThemeManager: Theme button found, binding click event');
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('ThemeManager: Theme button clicked!');
                this.toggleTheme();
            });
        } else {
            console.log('ThemeManager: Theme button not found!');
        }

        // Listen for system theme changes
        this.systemPreference.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        // Add transition class for smooth theme switching
        document.documentElement.classList.add('theme-transition');
        
        // Update data attribute on html element
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update localStorage
        localStorage.setItem('theme', theme);
        
        // Update button icon
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Update current theme
        this.currentTheme = theme;
        
        // Remove transition class after animation
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 300);
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));

        // Show theme change notification
        this.showThemeNotification(theme);
    }

    showThemeNotification(theme) {
        // Remove existing notification
        const existingNotification = document.querySelector('.theme-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <div class="theme-notification-content">
                <i class="fas fa-${theme === 'dark' ? 'moon' : 'sun'}"></i>
                <span>Switched to ${theme === 'dark' ? 'Dark' : 'Light'} theme</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide notification after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    // Public method to set theme programmatically
    setLightTheme() {
        this.setTheme('light');
    }

    setDarkTheme() {
        this.setTheme('dark');
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Make it globally available
window.themeManager = themeManager;

// Fallback initialization for pages that load scripts asynchronously
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded: Checking for theme button...');
    // Re-initialize theme button if it exists but wasn't bound
    let themeBtn = document.getElementById('theme-btn');
    console.log('DOMContentLoaded: Theme button found:', themeBtn);
    
    if (!themeBtn) {
        console.log('DOMContentLoaded: No theme button found, creating fallback...');
        // Create a fallback theme button
        themeBtn = document.createElement('button');
        themeBtn.id = 'theme-btn';
        themeBtn.className = 'fallback-theme-btn';
        themeBtn.title = 'Toggle theme';
        themeBtn.innerHTML = '<i class="fas fa-moon" id="theme-icon"></i>';
        document.body.appendChild(themeBtn);
        console.log('DOMContentLoaded: Fallback theme button created');
    }
    
    if (themeBtn && !themeBtn.hasAttribute('data-bound')) {
        console.log('DOMContentLoaded: Binding theme button');
        themeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('DOMContentLoaded: Theme button clicked!');
            if (window.themeManager) {
                window.themeManager.toggleTheme();
            }
        });
        themeBtn.setAttribute('data-bound', 'true');
    }
});