// Campus SkillSwap - Contact JavaScript

// Contact page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('contact.html')) {
        initializeContactFeatures();
    }
});

function initializeContactFeatures() {
    // Initialize contact components
    initializeContactForm();
    initializeFAQ();
    initializeResourceLinks();
    initializeContactMethods();
}

function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', handleContactFormSubmission);
    
    // Add real-time validation
    const formInputs = contactForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function handleContactFormSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Validate form
    if (!validateContactForm(formDataObj)) {
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    // Simulate form submission
    setTimeout(() => {
        hideLoading(submitBtn);
        
        // Show success message
        showToast('Message sent successfully! We\'ll get back to you within 24 hours.', 'success');
        
        // Reset form
        e.target.reset();
        
        // Track form submission (in real app, you'd send to server)
        trackContactFormSubmission(formDataObj);
        
    }, 2000);
}

function validateContactForm(data) {
    let isValid = true;
    const errors = {};
    
    // Required field validation
    const requiredFields = ['name', 'email', 'subject', 'message'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            isValid = false;
        }
    });
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
    }
    
    // Phone validation (if provided)
    if (data.phone && data.phone.trim() !== '' && !isValidPhone(data.phone)) {
        errors.phone = 'Please enter a valid phone number';
        isValid = false;
    }
    
    // Display errors
    if (!isValid) {
        displayFormErrors(errors);
    }
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.name;
    
    let error = '';
    
    // Required field check
    if (field.hasAttribute('required') && value === '') {
        error = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    
    // Email validation
    if (fieldName === 'email' && value && !isValidEmail(value)) {
        error = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (fieldName === 'phone' && value && !isValidPhone(value)) {
        error = 'Please enter a valid phone number';
    }
    
    // Display error
    if (error) {
        showFieldError(field, error);
    } else {
        clearFieldError(e);
    }
}

function clearFieldError(e) {
    const field = e.target;
    const errorElement = field.parentNode.querySelector('.field-error');
    
    if (errorElement) {
        errorElement.remove();
    }
    
    field.classList.remove('error');
}

function showFieldError(field, message) {
    // Remove existing error
    clearFieldError({ target: field });
    
    // Add error class
    field.classList.add('error');
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    // Insert after field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

function displayFormErrors(errors) {
    // Clear existing errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    
    // Display new errors
    Object.keys(errors).forEach(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            showFieldError(field, errors[fieldName]);
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function trackContactFormSubmission(data) {
    // In a real application, you would send this data to your analytics service
    console.log('Contact form submitted:', {
        name: data.name,
        email: data.email,
        subject: data.subject,
        phone: data.phone,
        message: data.message.substring(0, 100) + '...', // Truncate for privacy
        newsletter: data.newsletter,
        timestamp: new Date().toISOString()
    });
}

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                toggleFAQItem(item);
            });
        }
    });
}

function toggleFAQItem(item) {
    const isActive = item.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(faqItem => {
        faqItem.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        item.classList.add('active');
    }
}

function initializeResourceLinks() {
    const resourceLinks = document.querySelectorAll('.resource-link');
    
    resourceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            handleResourceLinkClick(this);
        });
    });
}

function handleResourceLinkClick(link) {
    const linkText = link.textContent.trim();
    
    // Simulate resource access
    showToast(`Opening ${linkText}...`, 'info');
    
    // In a real application, you would navigate to the actual resource
    setTimeout(() => {
        showToast(`${linkText} is coming soon!`, 'info');
    }, 1000);
}

function initializeContactMethods() {
    // Add click handlers for contact method cards
    const contactMethods = document.querySelectorAll('.contact-method');
    
    contactMethods.forEach(method => {
        method.addEventListener('click', function() {
            handleContactMethodClick(this);
        });
    });
}

function handleContactMethodClick(methodElement) {
    const methodType = methodElement.querySelector('h3').textContent;
    
    switch (methodType) {
        case 'Email':
            handleEmailContact();
            break;
        case 'Phone':
            handlePhoneContact();
            break;
        case 'Address':
            handleAddressContact();
            break;
        case 'Response Time':
            handleResponseTimeInfo();
            break;
    }
}

function handleEmailContact() {
    const email = 'support@campusskillswap.com';
    
    // Copy email to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
            showToast('Email address copied to clipboard!', 'success');
        }).catch(() => {
            showToast(`Email: ${email}`, 'info');
        });
    } else {
        showToast(`Email: ${email}`, 'info');
    }
}

function handlePhoneContact() {
    const phone = '+91 98765 43210';
    
    // Copy phone to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(phone).then(() => {
            showToast('Phone number copied to clipboard!', 'success');
        }).catch(() => {
            showToast(`Phone: ${phone}`, 'info');
        });
    } else {
        showToast(`Phone: ${phone}`, 'info');
    }
}

function handleAddressContact() {
    const address = 'Coimbatore, Tamil Nadu, India';
    
    // Open maps (if available)
    if (navigator.geolocation) {
        showToast('Opening location in maps...', 'info');
        // In a real app, you'd open Google Maps or similar
    } else {
        showToast(`Address: ${address}`, 'info');
    }
}

function handleResponseTimeInfo() {
    showToast('We typically respond within 24 hours during business days (Mon-Fri, 9 AM - 6 PM IST)', 'info');
}

// Additional contact page utilities
function initializeContactPageAnimations() {
    // Add scroll animations for contact elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe contact elements
    const contactElements = document.querySelectorAll('.contact-form-card, .contact-info-card, .faq-item, .resource-card');
    contactElements.forEach(el => observer.observe(el));
}

function initializeContactFormEnhancements() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    // Add character counter for message field
    const messageField = contactForm.querySelector('textarea[name="message"]');
    if (messageField) {
        const maxLength = 1000;
        messageField.setAttribute('maxlength', maxLength);
        
        // Create character counter
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.textContent = `0/${maxLength} characters`;
        
        messageField.parentNode.appendChild(counter);
        
        // Update counter on input
        messageField.addEventListener('input', function() {
            const remaining = maxLength - this.value.length;
            counter.textContent = `${this.value.length}/${maxLength} characters`;
            
            if (remaining < 50) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
        });
    }
    
    // Add auto-save functionality
    const formFields = contactForm.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        field.addEventListener('input', debounce(autoSaveForm, 1000));
    });
    
    // Load saved form data
    loadSavedFormData();
}

function autoSaveForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    const formData = new FormData(contactForm);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Save to localStorage
    localStorage.setItem('contactFormDraft', JSON.stringify(formDataObj));
}

function loadSavedFormData() {
    const savedData = localStorage.getItem('contactFormDraft');
    if (!savedData) return;
    
    try {
        const formData = JSON.parse(savedData);
        const contactForm = document.getElementById('contact-form');
        
        Object.keys(formData).forEach(fieldName => {
            const field = contactForm.querySelector(`[name="${fieldName}"]`);
            if (field && formData[fieldName]) {
                field.value = formData[fieldName];
            }
        });
        
        // Clear saved data after loading
        localStorage.removeItem('contactFormDraft');
        
    } catch (e) {
        console.error('Error loading saved form data:', e);
    }
}

function initializeContactPageAccessibility() {
    // Add keyboard navigation for FAQ items
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
            question.setAttribute('aria-expanded', 'false');
            
            question.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFAQItem(item);
                }
            });
        }
    });
    
    // Update aria-expanded when FAQ items are toggled
    const originalToggleFAQ = toggleFAQItem;
    toggleFAQItem = function(item) {
        const question = item.querySelector('.faq-question');
        const isActive = item.classList.contains('active');
        
        originalToggleFAQ(item);
        
        if (question) {
            question.setAttribute('aria-expanded', !isActive);
        }
    };
}

// Initialize all contact features
function initializeContactFeatures() {
    initializeContactForm();
    initializeFAQ();
    initializeResourceLinks();
    initializeContactMethods();
    initializeContactPageAnimations();
    initializeContactFormEnhancements();
    initializeContactPageAccessibility();
}

// Utility functions
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

// Export functions for global access
window.ContactFunctions = {
    handleContactFormSubmission,
    toggleFAQItem,
    handleResourceLinkClick,
    handleContactMethodClick,
    validateContactForm,
    autoSaveForm,
    loadSavedFormData
};

