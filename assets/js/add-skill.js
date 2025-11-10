// Add Skill Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Add skill page loaded');
    
    // Initialize the form
    initializeAddSkillForm();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize day/time selection
    initializeDayTimeSelection();
});

function initializeAddSkillForm() {
    console.log('Initializing add skill form...');
    
    const addSkillForm = document.getElementById('add-skill-form');
    if (!addSkillForm) {
        console.error('Add skill form not found!');
        return;
    }
    
    // Handle form submission
    console.log('Adding submit event listener to form');
    addSkillForm.addEventListener('submit', function(e) {
        console.log('Form submit event triggered!');
        e.preventDefault();
        console.log('Add skill form submitted');
        handleAddSkillForm(e);
    });
    
    // Handle button click as backup (but prevent default to avoid double handling)
    const submitBtn = addSkillForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        console.log('Adding click event listener to submit button as backup');
        submitBtn.addEventListener('click', function(e) {
            console.log('Submit button clicked directly!');
            e.preventDefault(); // Always prevent default to let form submit handle it
            
            // Only trigger if not already processing
            if (!addSkillForm.classList.contains('processing')) {
                console.log('Form not processing, triggering submit event');
                // Trigger form submission
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                addSkillForm.dispatchEvent(submitEvent);
            } else {
                console.log('Form is already being processed, ignoring click');
            }
        });
    }
    
    console.log('Event listener added successfully');
}

function handleAddSkillForm(e) {
    console.log('handleAddSkillForm called');
    console.log('Form target:', e.target);
    
    // Prevent double submission
    const form = e.target;
    if (form.classList.contains('processing')) {
        console.log('Form already being processed, ignoring...');
        return;
    }
    
    form.classList.add('processing');
    
    // Helper function to reset form state
    const resetFormState = () => {
        console.log('Resetting form state...');
        form.classList.remove('processing');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Skill';
        }
        console.log('Form processing state reset - form can now be submitted again');
    };
    
    const formData = new FormData(form);
    console.log('FormData created');
    
    // Log all form data
    for (let [key, value] of formData.entries()) {
        console.log(`Form field ${key}:`, value);
    }
    
    // Collect available times from day-specific inputs
    const availableTimes = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const startTime = formData.get(`${day}StartTime`);
        const endTime = formData.get(`${day}EndTime`);
        if (startTime && endTime) {
            availableTimes.push({
                start: startTime,
                end: endTime
            });
        }
    });

    // Build skill data according to the backend schema
    const skillData = {
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        creditsPerHour: parseInt(formData.get('creditsPerHour')),
        level: formData.get('level') || 'Beginner',
        location: formData.get('location') || 'campus-library',
        maxStudents: parseInt(formData.get('maxStudents')) || 1,
        sessionDuration: parseInt(formData.get('sessionDuration')) || 60,
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [],
        availableDays: Array.from(formData.getAll('availableDays')),
        availableTimes: availableTimes
    };
    
    console.log('Skill data:', skillData);
    
    // Validation
    console.log('Starting validation...');
    
    if (!skillData.title || !skillData.category || !skillData.description || !skillData.creditsPerHour) {
        console.log('Validation failed - missing required fields');
        showToast('Please fill in all required fields', 'error');
        resetFormState();
        return;
    }
    
    if (skillData.title.length < 3) {
        showToast('Skill title must be at least 3 characters long', 'error');
        resetFormState();
        return;
    }
    
    if (skillData.description.length < 10) {
        showToast('Description must be at least 10 characters long', 'error');
        resetFormState();
        return;
    }
    
    // Validate time inputs for selected days
    const selectedDays = Array.from(formData.getAll('availableDays'));
    for (const day of selectedDays) {
        const startTime = formData.get(`${day}StartTime`);
        const endTime = formData.get(`${day}EndTime`);
        
        if (selectedDays.length > 0 && (!startTime || !endTime)) {
            showToast(`Please specify start and end times for ${day}`, 'error');
            resetFormState();
            return;
        }
        
        if (startTime && endTime && startTime >= endTime) {
            showToast(`End time must be after start time for ${day}`, 'error');
            resetFormState();
            return;
        }
    }
    
    console.log('Validation passed!');
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Skill...';
    }
    
    // Safety timeout to reset processing state after 30 seconds
    const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout triggered - resetting form state');
        resetFormState();
        showToast('Request timed out. Please try again.', 'error');
    }, 30000);
    
    // Call API to add skill
    console.log('API Client available:', !!window.apiClient);
    console.log('createSkill method available:', !!(window.apiClient && window.apiClient.createSkill));
    
    // Ensure API client is initialized
    if (typeof window.apiClient === 'undefined' && typeof APIClient !== 'undefined') {
        console.log('Initializing API client...');
        window.apiClient = new APIClient();
    }
    
    if (window.apiClient && window.apiClient.createSkill) {
        console.log('Calling API to create skill with data:', skillData);
        
        window.apiClient.createSkill(skillData)
            .then(response => {
                console.log('API response:', response);
                if (response.success) {
                    console.log('Skill added successfully');
                    showToast('Skill added successfully! It will be visible in the marketplace shortly.', 'success');
                    
                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                    
                    // Also refresh marketplace if we can
                    if (typeof loadMarketplaceSkills === 'function') {
                        setTimeout(() => {
                            loadMarketplaceSkills();
                        }, 1000);
                    }
                } else {
                    console.log('API returned error:', response.message);
                    showToast(response.message || 'Failed to add skill', 'error');
                }
            })
            .catch(error => {
                console.error('Error adding skill:', error);
                console.error('Error details:', {
                    message: error.message,
                    status: error.status,
                    response: error.response
                });
                
                if (error.message && error.message.includes('401')) {
                    showToast('Please log in to add skills.', 'error');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else if (error.message && error.message.includes('403')) {
                    showToast('You do not have permission to add skills.', 'error');
                } else if (error.message && error.message.includes('400')) {
                    showToast('Invalid skill data. Please check your input.', 'error');
                } else {
                    showToast(`Failed to add skill: ${error.message || 'Unknown error'}`, 'error');
                }
            })
            .finally(() => {
                // Clear safety timeout and reset form state
                clearTimeout(safetyTimeout);
                resetFormState();
            });
    } else {
        // Fallback if API not available
        console.log('API not available, simulating success...');
        clearTimeout(safetyTimeout);
        setTimeout(() => {
            resetFormState();
            showToast('API not available. Please try again later.', 'error');
        }, 1500);
    }
}

function initializeNavigation() {
    // Set active navigation state if needed
    console.log('Navigation initialized for add skill page');
}

function initializeDayTimeSelection() {
    console.log('Initializing day/time selection...');
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const checkbox = document.getElementById(`day-${day}`);
        const timeSection = document.getElementById(`${day}-times`);
        
        if (checkbox && timeSection) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    timeSection.style.display = 'block';
                } else {
                    timeSection.style.display = 'none';
                    // Clear the time inputs when day is unchecked
                    const startInput = document.getElementById(`${day}-start`);
                    const endInput = document.getElementById(`${day}-end`);
                    if (startInput) startInput.value = '';
                    if (endInput) endInput.value = '';
                }
            });
        }
    });
}

// Utility function to show toast messages - standalone implementation to prevent recursion
function showToast(message, type = 'info') {
    console.log(`Toast [${type.toUpperCase()}]: ${message}`);
    
    // Check if a toast already exists to prevent multiple toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create a simple toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 100000 !important;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, 3000);
}
