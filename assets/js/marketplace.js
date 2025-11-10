// Campus SkillSwap - Marketplace JavaScript

// Marketplace-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('marketplace.html') || window.location.pathname.includes('resources.html')) {
        initializeMarketplaceFeatures();
    }
});

function initializeMarketplaceFeatures() {
    console.log('Initializing marketplace features');
    // Initialize marketplace components
    initializeSkillSearch();
    initializeSkillFilters();
    initializeCategoryFilters();
    initializeSkillCards();
    initializeLoadMore();
    
    // Load initial skills
    loadMarketplaceSkills();
    
    // Update navigation
    if (typeof updateNavigation === 'function') {
        updateNavigation();
    }
    console.log('Marketplace features initialized');
}

function initializeSkillSearch() {
    const searchInput = document.getElementById('skill-search') || document.getElementById('marketQuery');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSkillSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSkillSearch();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSkillSearch);
    }
}

function initializeSkillFilters() {
    console.log('Initializing skill filters');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    console.log('Category filter element:', categoryFilter);
    console.log('Sort filter element:', sortFilter);
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilterChange);
        console.log('Added change listener to category filter');
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', handleFilterChange);
        console.log('Added change listener to sort filter');
    }
}

function initializeCategoryFilters() {
    const categoryChips = document.querySelectorAll('.chip');
    
    categoryChips.forEach(chip => {
        chip.addEventListener('click', function() {
            // Remove active class from all chips
            categoryChips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            this.classList.add('active');
            
            // Filter skills by category
            const category = this.dataset.cat;
            filterSkillsByCategory(category);
        });
    });
}

function initializeSkillCards() {
    // Add click handlers for skill cards
    document.addEventListener('click', function(e) {
        const skillCard = e.target.closest('.skill-item, .skill-clickable');
        if (skillCard && !e.target.closest('button')) {
            const skillId = skillCard.dataset.skillId;
            if (skillId) {
                console.log('Skill card clicked:', skillId);
                showSkillDetails(skillId);
            }
        }
    });
}

// Modal functionality removed - now using dedicated skill details page

// Session booking modal functionality removed - now handled in skill-details.html

function initializeLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreSkills);
    }
}

function loadMarketplaceSkills() {
    const skillsGrid = document.getElementById('skills-grid') || document.getElementById('results');
    if (!skillsGrid) return;
    
    // Show loading state
    skillsGrid.innerHTML = '<div class="loading-spinner">Loading skills...</div>';
    
    // Load skills from API
    setTimeout(async () => {
        const skills = await getSkills();
        renderSkills(skills, skillsGrid);
        updateMarketplaceStats(skills);
        
        // Test rating display
        testRatingFunctionality();
    }, 1000);
}

function testRatingFunctionality() {
    console.log('Testing rating functionality...');
    
    // Test the getRatingValue function
    const testSkill1 = { rating: { average: 4.5, count: 10 } };
    const testSkill2 = { rating: { average: 0, count: 0 } };
    const testSkill3 = { rating: 3.5 };
    
    console.log('Test 1 - Object rating:', getRatingValue(testSkill1));
    console.log('Test 2 - Zero rating:', getRatingValue(testSkill2));
    console.log('Test 3 - Number rating:', getRatingValue(testSkill3));
    
    // Test the generateStars function
    console.log('Stars for 4.5:', generateStars(4.5));
    console.log('Stars for 0:', generateStars(0));
    console.log('Stars for 3.7:', generateStars(3.7));
}

async function getSkills() {
    try {
        if (window.apiClient && window.apiClient.get) {
            const response = await window.apiClient.get('/skills');
            console.log('API response for skills:', response);
            if (response.success) {
                // Store loaded skills for modal access
                loadedSkills = response.data || [];
                
                // Log detailed information about the skills
                console.log('Number of skills loaded:', loadedSkills.length);
                loadedSkills.forEach((skill, index) => {
                    console.log(`Skill ${index + 1}:`, {
                        title: skill.title,
                        rating: skill.rating,
                        teacher: skill.teacher
                    });
                });
                
                return loadedSkills;
            } else {
                console.error('API returned error:', response.message);
            }
        }
    } catch (error) {
        console.error('Error fetching skills:', error);
    }
    loadedSkills = [];
    return loadedSkills;
}

// Helper function to get proper rating value
function getRatingValue(skill) {
    // Handle different rating object structures
    if (typeof skill.rating === 'number') {
        return skill.rating;
    } else if (skill.rating && typeof skill.rating === 'object') {
        // For skill objects, the rating is an object with average and count
        // We want to use the average value
        return skill.rating.average || 0;
    }
    return 0;
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

function renderSkills(skills, container) {
    if (!container) return;
    
    if (skills.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <h3>No Skills Available</h3>
                <p>There are currently no skills available in the marketplace. Be the first to add a skill!</p>
                <a href="add-skill.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Add Your First Skill
                </a>
            </div>
        `;
        return;
    }
    
    if (container.id === 'results') {
        // For resources.html (simpler format)
        container.innerHTML = skills.map(skill => {
            const rating = getRatingValue(skill);
            return `
                <div class="card skill-clickable" data-skill-id="${skill._id || skill.id}">
                    <div class="card-header">
                        <h3>${skill.title}</h3>
                        <span class="credits">${skill.creditsPerHour || skill.credits} credits/hr</span>
                    </div>
                    <div class="card-body">
                        <p class="teacher">by ${skill.teacher?.name || skill.teacher || 'Unknown Teacher'}</p>
                        <p class="description">${skill.description}</p>
                        <div class="rating">
                            <div class="stars">${generateStars(rating)}</div>
                            <span>${rating > 0 ? rating.toFixed(1) : '0.0'}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn primary" onclick="requestSession('${skill._id || skill.id}')">Request Session</button>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // For marketplace.html (detailed format)
        container.innerHTML = skills.map(skill => {
            const rating = getRatingValue(skill);
            const teacherName = skill.teacher?.name || skill.teacher || 'Unknown Teacher';
            const tags = skill.tags || [];
            const category = skill.category || 'Technology'; // Default to Technology if no category
            
            // Log for debugging
            console.log('Rendering skill:', skill.title, 'Rating:', rating, 'Category:', category);
            
            return `
                <div class="skill-item skill-clickable" data-skill-id="${skill._id || skill.id}" data-category="${category}">
                    <div class="skill-header">
                        <i class="fas fa-${getSkillIcon(category)}"></i>
                        <div class="skill-info">
                            <h3>${skill.title}</h3>
                            <div class="skill-rating">
                                <div class="stars">${generateStars(rating)}</div>
                                <span>(${rating > 0 ? rating.toFixed(1) : '0.0'})</span>
                            </div>
                        </div>
                    </div>
                    <div class="skill-description">
                        <p>${skill.description}</p>
                    </div>
                    <div class="skill-tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="skill-meta">
                        <span class="skill-teacher">by ${teacherName}</span>
                        <span class="skill-credits">${skill.creditsPerHour || skill.credits} Credits/hour</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function handleSkillSearch() {
    const searchInput = document.getElementById('skill-search') || document.getElementById('marketQuery');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const skillItems = document.querySelectorAll('.skill-item, .card');
    
    if (!query) {
        skillItems.forEach(item => item.style.display = 'block');
        return;
    }
    
    let visibleCount = 0;
    
    skillItems.forEach(item => {
        const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
        const teacher = item.querySelector('.skill-teacher, .teacher')?.textContent.toLowerCase() || '';
        const description = item.querySelector('.description')?.textContent.toLowerCase() || '';
        const tags = Array.from(item.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');
        
        if (title.includes(query) || teacher.includes(query) || description.includes(query) || tags.includes(query)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide empty state
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        emptyState.hidden = visibleCount > 0;
    }
    
    // Update results count
    updateResultsCount(visibleCount);
}

function filterSkillsByCategory(category) {
    const skillItems = document.querySelectorAll('.skill-item, .card');
    
    if (category === 'all') {
        skillItems.forEach(item => item.style.display = 'block');
        updateResultsCount(skillItems.length);
        return;
    }
    
    let visibleCount = 0;
    
    skillItems.forEach(item => {
        const skillCategory = getSkillCategoryFromItem(item);
        if (skillCategory === category) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    updateResultsCount(visibleCount);
}

function getSkillCategoryFromItem(item) {
    // Try to get the category from data attribute first
    const dataCategory = item.dataset.category;
    if (dataCategory) {
        return dataCategory;
    }
    
    // Fallback to existing logic
    const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
    const tags = Array.from(item.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');
    
    if (title.includes('programming') || title.includes('python') || title.includes('web') || title.includes('machine learning')) {
        return 'Technology';
    } else if (title.includes('music') || title.includes('art') || title.includes('design') || title.includes('guitar')) {
        return 'Arts';
    } else if (title.includes('gate') || title.includes('exam') || title.includes('preparation')) {
        return 'Academics';
    } else if (title.includes('cooking') || title.includes('cuisine')) {
        return 'Life Skills';
    } else if (title.includes('language') || title.includes('tamil') || title.includes('english') || title.includes('hindi')) {
        return 'Language';
    } else if (title.includes('sports') || title.includes('cricket') || title.includes('football') || title.includes('yoga')) {
        return 'Sports';
    }
    
    return 'Technology'; // Default
}

function handleFilterChange() {
    console.log('Filter change detected');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    const category = categoryFilter ? categoryFilter.value : 'all';
    const sortBy = sortFilter ? sortFilter.value : 'popular';
    
    console.log('Selected filters - Category:', category, 'Sort by:', sortBy);
    applyFilters(category, sortBy);
}

function applyFilters(category, sortBy) {
    console.log('Applying filters - Category:', category, 'Sort by:', sortBy);
    
    const container = document.getElementById('skills-grid') || document.getElementById('results');
    if (!container) return;
    
    // Get all skill items
    let skillItems = Array.from(container.querySelectorAll('.skill-item, .card'));
    console.log('Total skills before filtering:', skillItems.length);
    
    // Filter by category
    if (category !== 'all') {
        skillItems = skillItems.filter(item => {
            const skillCategory = getSkillCategoryFromItem(item);
            const match = skillCategory === category;
            console.log('Category filter - Item category:', skillCategory, 'Filter category:', category, 'Match:', match);
            return match;
        });
        console.log('Skills after category filter:', skillItems.length);
    }
    
    // Sort skills
    skillItems.sort((a, b) => {
        switch (sortBy) {
            case 'rating':
                const ratingA = parseFloat(a.querySelector('.stars')?.nextElementSibling?.textContent?.match(/\(([0-9.]+)\)/)?.[1] || 
                               a.querySelector('.stars')?.parentElement?.textContent?.match(/\(([0-9.]+)\)/)?.[1] || '0');
                const ratingB = parseFloat(b.querySelector('.stars')?.nextElementSibling?.textContent?.match(/\(([0-9.]+)\)/)?.[1] || 
                               b.querySelector('.stars')?.parentElement?.textContent?.match(/\(([0-9.]+)\)/)?.[1] || '0');
                console.log('Sorting by rating - A:', ratingA, 'B:', ratingB);
                return ratingB - ratingA;
            case 'credits-low':
                const creditsA = parseInt(a.querySelector('.skill-credits, .credits')?.textContent?.match(/(\d+)/)?.[1] || '0');
                const creditsB = parseInt(b.querySelector('.skill-credits, .credits')?.textContent?.match(/(\d+)/)?.[1] || '0');
                console.log('Sorting by low credits - A:', creditsA, 'B:', creditsB);
                return creditsA - creditsB;
            case 'credits-high':
                const creditsHighA = parseInt(a.querySelector('.skill-credits, .credits')?.textContent?.match(/(\d+)/)?.[1] || '0');
                const creditsHighB = parseInt(b.querySelector('.skill-credits, .credits')?.textContent?.match(/(\d+)/)?.[1] || '0');
                console.log('Sorting by high credits - A:', creditsHighA, 'B:', creditsHighB);
                return creditsHighB - creditsHighA;
            case 'newest':
                // For now, we'll keep original order as we don't have date information
                return 0;
            default: // popular
                console.log('Sorting by default/popular');
                return 0; // Keep original order
        }
    });
    
    // Show/hide items based on filtering
    const allItems = container.querySelectorAll('.skill-item, .card');
    allItems.forEach(item => {
        if (skillItems.includes(item)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    updateResultsCount(skillItems.length);
}

// Store loaded skills for modal access
let loadedSkills = [];

function showSkillDetails(skillId) {
    console.log('Redirecting to skill details page for:', skillId);
    
    // Redirect to the new skill details page
    window.location.href = `skill-details.html?id=${skillId}`;
}

// Direct session request functionality removed - now handled in skill-details.html

function handleRequestSession(skillId = null, skill = null) {
    if (!skillId) {
        showToast('Session request failed - no skill selected', 'error');
        return;
    }
    
    console.log('Requesting session for skill:', skillId);
    
    // Redirect to skill details page for booking
    window.location.href = `skill-details.html?id=${skillId}`;
}

// Booking confirmation functionality removed - now handled in skill-details.html


// Modal-related functions removed - functionality moved to skill-details.html

function loadMoreSkills() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        showLoading(loadMoreBtn);
    }
    
    // Simulate loading more skills
    setTimeout(() => {
        if (loadMoreBtn) {
            hideLoading(loadMoreBtn);
        }
        
        showToast('No more skills to load', 'info');
    }, 1500);
}

function updateResultsCount(count) {
    console.log('Updating results count to:', count);
    const countElements = document.querySelectorAll('.results-count');
    countElements.forEach(el => {
        el.textContent = `${count} skills found`;
    });
    
    // Also update the marketplace stats if needed
    const totalSkillsElement = document.getElementById('total-skills');
    if (totalSkillsElement) {
        totalSkillsElement.textContent = count + '+';
    }
}

// Global functions for skill interactions
function requestSession(skillId) {
    if (!skillId) {
        if (typeof showToast === 'function') {
            showToast('Session request failed', 'error');
        }
        return;
    }
    
    console.log('Global requestSession called for:', skillId);
    
    // Redirect to skill details page for booking
    window.location.href = `skill-details.html?id=${skillId}`;
}

// Utility functions

function getSkillIcon(category) {
    const icons = {
        'Technology': 'laptop-code',
        'Arts': 'palette',
        'Academics': 'graduation-cap',
        'Life Skills': 'hands-helping',
        'Language': 'language',
        'Wellness': 'heart'
    };
    return icons[category] || 'star';
}

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

// Fallback showToast function if not available globally
if (typeof window.showToast !== 'function') {
    window.showToast = function(message, type = 'info') {
        console.log(`Toast [${type.toUpperCase()}]: ${message}`);
        
        // Create a simple toast notification
        const toast = document.createElement('div');
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
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    };
}

function updateMarketplaceStats(skills) {
    // Update total skills count
    const totalSkillsElement = document.getElementById('total-skills');
    if (totalSkillsElement) {
        totalSkillsElement.textContent = skills.length;
    }
    
    // Calculate unique teachers
    const uniqueTeachers = new Set(skills.map(skill => skill.teacher?._id || skill.teacher?.id || skill.teacher));
    const activeTeachersElement = document.getElementById('active-teachers');
    if (activeTeachersElement) {
        activeTeachersElement.textContent = uniqueTeachers.size;
    }
    
    // Calculate average rating
    const ratings = skills.map(skill => getRatingValue(skill)).filter(rating => rating > 0);
    const avgRatingElement = document.getElementById('avg-rating');
    if (avgRatingElement && ratings.length > 0) {
        const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        avgRatingElement.textContent = averageRating.toFixed(1);
    } else if (avgRatingElement) {
        avgRatingElement.textContent = '0.0';
    }
}

// Export functions for global access
window.requestSession = requestSession;
window.showSkillDetails = showSkillDetails;
window.generateStars = generateStars;