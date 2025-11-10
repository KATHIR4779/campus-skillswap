// Campus SkillSwap - Dashboard JavaScript
console.log('Dashboard.js script loaded!');

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

// Dashboard-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard.js loaded and DOMContentLoaded fired');
    console.log('Current pathname:', window.location.pathname);
    if (window.location.pathname.includes('dashboard.html')) {
        console.log('Dashboard page detected, initializing features...');
        initializeDashboardFeatures();
    } else {
        console.log('Not on dashboard page, skipping initialization');
    }
});

// Helper function to get user from storage
function getUserFromStorage() {
    // If authentication state is explicitly false, don't return cached data
    if (window.isLoggedIn === false) {
        return null;
    }
    
    // Try multiple possible storage keys for compatibility
    const possibleKeys = ['campusSkillSwapUser', 'userData', 'current_user'];
    
    for (const key of possibleKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const user = JSON.parse(stored);
                if (user && user.email && user.email !== 'test@example.com') {
                    return user;
                }
            } catch (e) {
                console.error('Error parsing stored user data:', e);
                return null;
            }
        }
    }
    
    // Try to get from auth manager if available
    if (window.authManager && window.authManager.currentUser) {
        return window.authManager.currentUser;
    }
    
    return null;
}

// Load user profile from API
async function loadUserProfile() {
    try {
        // Try to get user from API
        if (window.apiClient && window.apiClient.getCurrentUser) {
            const user = await window.apiClient.getCurrentUser();
            if (user) {
                localStorage.setItem('userData', JSON.stringify(user));
                loadDashboardData(user);
                return user;
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        
        // Only clear auth state for authentication failures, not display errors
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            // Clear invalid tokens and user data when API validation fails
            localStorage.removeItem('access_token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('campusSkillSwapUser');
            localStorage.removeItem('current_user');
            
            // Clear authentication state
            window.currentUser = null;
            window.isLoggedIn = false;
            
            // Update auth manager if available
            if (window.authManager) {
                window.authManager.currentUser = null;
                window.authManager.isLoggedIn = false;
                window.authManager.updateAuthUI();
            }
            
            // Update navigation to show login/register buttons
            updateNavigation();
        } else {
            // For other errors (like display errors), try to load from storage
            const storedUser = getUserFromStorage();
            if (storedUser) {
                try {
                    loadDashboardData(storedUser);
                } catch (displayError) {
                    console.error('Error displaying dashboard data:', displayError);
                }
            }
        }
    }
    
    showToast('Please login to access dashboard', 'warning');
    return null;
}

function initializeDashboardFeatures() {
    console.log('initializeDashboardFeatures called');
    
    // Initialize authentication state
    initializeAuthState();
    
    // Initialize dashboard components
    initializeProgressChart();
    initializeMessagesModal();
    initializeSessionModals();
    initializeQuickActions();
    initializeSkillManagement();
    
    console.log('All dashboard features initialized');
    
    // Update navigation first
    updateNavigation();
    
    // Load dashboard data from API with slight delays to prevent rate limiting
    loadUserProfile().then((user) => {
        // API validation successful, load dashboard with verified user
        if (user) {
            loadDashboardData(user);
        } else {
            loadDashboardData(); // This will show logged out state
        }
    }).catch(() => {
        // API validation failed, user should be logged out
        // Authentication state has already been cleared in loadUserProfile
        loadDashboardData(); // This will show logged out state
    });
}

// Initialize authentication state from storage
function initializeAuthState() {
    const user = getUserFromStorage();
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    
    if (user && user.email && user.email !== 'test@example.com' && token) {
        // Set global auth state
        window.currentUser = user;
        window.isLoggedIn = true;
        
        // Set token in API client
        if (window.apiClient) {
            window.apiClient.setToken(token);
            console.log('Dashboard: API client token set');
        }
        
        console.log('Dashboard: Auth state initialized with user:', user);
    } else {
        window.currentUser = null;
        window.isLoggedIn = false;
        console.log('Dashboard: No valid auth state found');
    }
}

function initializeProgressChart() {
    const canvas = document.getElementById('progress-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 150;
    
    // Load actual session data and draw chart
    loadProgressChartData(ctx);
}

async function loadProgressChartData(ctx) {
    try {
        // Get completed sessions from API
        if (window.apiClient && window.apiClient.get) {
            const response = await window.apiClient.get('/sessions?status=completed&limit=30');
            
            if (response.success && response.data) {
                const sessions = response.data;
                
                // Group sessions by date and count
                const sessionsByDate = {};
                sessions.forEach(session => {
                    const date = new Date(session.completedAt || session.createdAt);
                    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    sessionsByDate[dateKey] = (sessionsByDate[dateKey] || 0) + 1;
                });
                
                // Get last 7 days of data
                const dates = [];
                const values = [];
                const today = new Date();
                
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    dates.push(dateKey);
                    values.push(sessionsByDate[dateKey] || 0);
                }
                
                const data = {
                    labels: dates,
                    datasets: [{
                        label: 'Sessions',
                        data: values,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                };
                
                drawSimpleChart(ctx, data);
                return;
            }
        }
        
        // Fallback with demo data if API is not available
        const demoData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sessions',
                data: [2, 3, 1, 4, 2, 3, 5],
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        };
        drawSimpleChart(ctx, demoData);
    } catch (error) {
        console.error('Error loading chart data:', error);
        // Draw demo chart on error
        const demoData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sessions',
                data: [2, 3, 1, 4, 2, 3, 5],
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        };
        drawSimpleChart(ctx, demoData);
    }
}

function drawSimpleChart(ctx, data) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 40;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const dataPoints = data.datasets[0].data;
    const labels = data.labels;
    
    // If no data, show empty state
    if (!dataPoints || dataPoints.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available yet', width / 2, height / 2);
        return;
    }
    
    // Draw axes
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // Draw grid lines (horizontal)
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 0.5;
    const maxValue = Math.max(...dataPoints, 1); // At least 1 to avoid division by zero
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i * (height - 2 * padding) / 4);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        
        // Draw Y-axis labels
        ctx.fillStyle = '#a0aec0';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        const value = Math.round(maxValue * (4 - i) / 4);
        ctx.fillText(value.toString(), padding - 5, y + 4);
    }
    
    // Draw X-axis labels
    ctx.fillStyle = '#a0aec0';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
        const x = padding + (i * (width - 2 * padding) / (labels.length - 1 || 1));
        ctx.fillText(label, x, height - padding + 15);
    });
    
    // Draw filled area
    ctx.fillStyle = data.datasets[0].backgroundColor;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    for (let i = 0; i < dataPoints.length; i++) {
        const x = padding + (i * (width - 2 * padding) / (dataPoints.length - 1 || 1));
        const y = height - padding - (dataPoints[i] / maxValue) * (height - 2 * padding);
        ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Draw data line
    ctx.strokeStyle = data.datasets[0].borderColor;
    ctx.lineWidth = data.datasets[0].borderWidth;
    ctx.beginPath();
    
    for (let i = 0; i < dataPoints.length; i++) {
        const x = padding + (i * (width - 2 * padding) / (dataPoints.length - 1 || 1));
        const y = height - padding - (dataPoints[i] / maxValue) * (height - 2 * padding);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw data points
        ctx.fillStyle = data.datasets[0].borderColor;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        if (i < dataPoints.length - 1) {
            ctx.moveTo(x, y);
        }
    }
    
    ctx.stroke();
}

function initializeMessagesModal() {
    const messagesBtn = document.getElementById('view-messages-btn');
    const messagesModal = document.getElementById('messages-modal');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    
    if (messagesBtn && messagesModal) {
        messagesBtn.addEventListener('click', function() {
            loadMessages();
            openModal('messages-modal');
        });
    }
    
    if (messageForm) {
        messageForm.addEventListener('submit', handleSendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage(e);
            }
        });
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', handleSendMessage);
    }
}

function loadMessages() {
    const conversationList = document.getElementById('conversationList');
    if (!conversationList) return;
    
    // Conversations will be loaded from API
    const conversations = [];
    
    conversationList.innerHTML = conversations.map(conv => `
        <div class="conversation-item" data-conversation-id="${conv.id}">
            <div class="conversation-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="conversation-content">
                <div class="conversation-header">
                    <h4>${conv.name}</h4>
                    <span class="conversation-time">${conv.time}</span>
                </div>
                <p class="conversation-preview">${conv.lastMessage}</p>
            </div>
            ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
        </div>
    `).join('');
    
    // Add click handlers
    conversationList.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', function() {
            const conversationId = this.dataset.conversationId;
            loadConversation(conversationId);
            
            // Update active state
            conversationList.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Load first conversation by default
    if (conversationList.querySelector('.conversation-item')) {
        conversationList.querySelector('.conversation-item').classList.add('active');
    }
}

function loadConversation(conversationId) {
    const threadHeader = document.getElementById('threadHeader');
    const threadBody = document.getElementById('threadBody');
    const messageForm = document.getElementById('message-form');
    
    // Mock conversation data
    const conversations = {
        '1': {
            name: 'Rajesh Kumar',
            messages: [
                { sender: 'Rajesh Kumar', message: 'Hi! I\'m interested in learning Python', time: '2 hours ago', isOwn: false },
                { sender: 'You', message: 'Great! I\'d be happy to help you learn Python', time: '2 hours ago', isOwn: true },
                { sender: 'Rajesh Kumar', message: 'Thanks for the Python session!', time: '2 hours ago', isOwn: false }
            ]
        }
    };
    
    const conversation = conversations[conversationId];
    if (conversation && threadHeader && threadBody) {
        threadHeader.textContent = conversation.name;
        threadBody.innerHTML = conversation.messages.map(msg => `
            <div class="message ${msg.isOwn ? 'own' : 'other'}">
                <div class="message-content">
                    <p>${msg.message}</p>
                    <span class="message-time">${msg.time}</span>
                </div>
            </div>
        `).join('');
        
        threadBody.scrollTop = threadBody.scrollHeight;
    }
    
    if (messageForm) {
        messageForm.style.display = 'flex';
    }
}

function handleSendMessage(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('message-input');
    const threadBody = document.getElementById('threadBody');
    
    if (!messageInput || !messageInput.value.trim()) return;
    
    const message = messageInput.value.trim();
    
    // Add message to thread
    if (threadBody) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message own';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">Just now</span>
            </div>
        `;
        threadBody.appendChild(messageElement);
        threadBody.scrollTop = threadBody.scrollHeight;
    }
    
    // Clear input
    messageInput.value = '';
    
    showToast('Message sent!', 'success');
}

function initializeSessionModals() {
    // Session detail modal
    const sessionDetailModal = document.getElementById('session-detail-modal');
    
    // Add click handlers for session items
    document.addEventListener('click', function(e) {
        // Handle session item clicks, but exclude completed sessions which have their own handler
        if (e.target.closest('.session-item') && !e.target.closest('.session-item.completed')) {
            const sessionItem = e.target.closest('.session-item');
            showSessionDetails(sessionItem);
        }
        
        // Handle accept request button clicks
        if (e.target.classList.contains('accept-request-btn')) {
            const requestId = e.target.dataset.requestId;
            acceptRequest(requestId);
        }
        
        // Handle decline request button clicks
        if (e.target.classList.contains('decline-request-btn')) {
            const requestId = e.target.dataset.requestId;
            declineRequest(requestId);
        }
    });
}

function showSessionDetails(sessionItem) {
    const modal = document.getElementById('session-detail-modal');
    if (!modal) {
        console.error('Session detail modal not found');
        return;
    }
    
    console.log('showSessionDetails called with:', sessionItem);
    
    // Extract session data from the item
    const title = sessionItem.querySelector('h4')?.textContent || 'Session Details';
    const teacher = sessionItem.querySelector('p')?.textContent || 'Teacher';
    const time = sessionItem.querySelector('.session-time')?.textContent || 'Time TBD';
    const credits = sessionItem.querySelector('.session-credits')?.textContent || '2 credits';
    const sessionId = sessionItem.dataset.sessionId || 'Unknown';
    
    console.log('Session ID:', sessionId);
    
    // Get full session data if available
    let sessionData = null;
    try {
        const sessionDataAttr = sessionItem.dataset.sessionData;
        if (sessionDataAttr) {
            sessionData = JSON.parse(sessionDataAttr.replace(/'/g, '"'));
            console.log('Parsed session data:', sessionData);
        } else {
            console.warn('No session data attribute found');
        }
    } catch (e) {
        console.error('Error parsing session data:', e);
    }
    
    // Update modal content
    const sessionInfo = modal.querySelector('#session-info');
    if (sessionInfo) {
        sessionInfo.innerHTML = `
            <h3 id="session-title">${title}</h3>
            <p id="session-teacher"><strong>With:</strong> ${teacher}</p>
            <p id="session-time"><strong>When:</strong> ${time}</p>
            <p id="session-credits"><strong>Credits:</strong> ${credits}</p>
            <p id="session-description">Join this session to learn new skills and earn credits. Make sure to be on time and come prepared with any required materials.</p>
        `;
    } else {
        console.error('session-info element not found');
    }
    
    // Update action buttons
    const sessionActions = modal.querySelector('#session-actions');
    if (!sessionActions) {
        console.error('session-actions element not found');
        return;
    }
    
    console.log('Current user:', window.currentUser);
    
    // Check if user is teacher or student for this session
    let isTeacher = false;
    let isStudent = false;
    if (sessionData && window.currentUser) {
        // Normalize IDs to strings for comparison
        const currentUserId = String(window.currentUser._id || window.currentUser.id);
        const teacherId = String(sessionData.teacher?._id || sessionData.teacher);
        const studentId = String(sessionData.student?._id || sessionData.student);
        
        isTeacher = teacherId === currentUserId;
        isStudent = studentId === currentUserId;
        
        console.log('User role - isTeacher:', isTeacher, 'isStudent:', isStudent);
        console.log('ID comparison - currentUser:', currentUserId, 'teacher:', teacherId, 'student:', studentId);
    }
    
    // Show different buttons based on user role and session status
    let actionButtons = '';
    
    // Check if there's a pending completion request
    const hasPendingCompletion = sessionData?.completionRequest?.status === 'pending';
    console.log('Session status:', sessionData?.status, 'Has pending completion:', hasPendingCompletion);
    console.log('Full session data:', sessionData);
    
    // Don't show any action buttons for completed or cancelled sessions
    if (sessionData && (sessionData.status === 'completed' || sessionData.status === 'cancelled')) {
        actionButtons = ''; // No buttons for completed or cancelled sessions
        console.log('Session is completed or cancelled - hiding all buttons');
    } else if (sessionData && sessionData.status === 'in-progress') {
        if (isTeacher) {
            actionButtons = `
                <button class="btn btn-primary" id="complete-session-btn">Mark Session Completed</button>
                <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
            `;
        } else if (isStudent) {
            actionButtons = `
                <button class="btn btn-primary" id="request-completion-btn">Session Completed</button>
                <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
            `;
        } else {
            // Fallback for unidentified role
            actionButtons = `
                <button class="btn btn-primary" id="join-session-btn">Join Session</button>
                <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
            `;
        }
    } else if (sessionData && sessionData.status === 'approved') {
        if (isTeacher) {
            actionButtons = `
                <button class="btn btn-primary" id="start-session-btn">Start Session</button>
                <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
            `;
        } else if (isStudent) {
            if (hasPendingCompletion) {
                actionButtons = `
                    <button class="btn btn-secondary" disabled>Completion Request Pending</button>
                    <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                    <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
                `;
            } else {
                actionButtons = `
                    <button class="btn btn-primary" id="request-completion-btn">Session Completed</button>
                    <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                    <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
                `;
            }
        } else {
            // Fallback for unidentified role  
            actionButtons = `
                <button class="btn btn-primary" id="join-session-btn">Join Session</button>
                <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
            `;
        }
    } else if (sessionData && sessionData.status === 'confirmed') {
        if (isTeacher) {
            actionButtons = `
                <button class="btn btn-primary" id="start-session-btn">Start Session</button>
                <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
            `;
        } else if (isStudent) {
            if (hasPendingCompletion) {
                actionButtons = `
                    <button class="btn btn-secondary" disabled>Completion Request Pending</button>
                    <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                    <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
                `;
            } else {
                actionButtons = `
                    <button class="btn btn-primary" id="request-completion-btn">Session Completed</button>
                    <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                    <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
                `;
            }
        } else {
            // Fallback for unidentified role
            actionButtons = `
                <button class="btn btn-primary" id="join-session-btn">Join Session</button>
                <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
                <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
            `;
        }
    } else {
        // Default buttons for any other status or when session data is incomplete
        console.log('Using default buttons');
        actionButtons = `
            <button class="btn btn-primary" id="join-session-btn">Join Session</button>
            <button class="btn btn-outline" id="reschedule-session-btn">Reschedule</button>
            <button class="btn btn-danger" id="cancel-session-btn">Cancel Session</button>
        `;
    }
    
    console.log('Setting action buttons:', actionButtons);
    sessionActions.innerHTML = actionButtons;
    
    // Add event listeners to the buttons
    const joinBtn = sessionActions.querySelector('#join-session-btn');
    const startBtn = sessionActions.querySelector('#start-session-btn');
    const completeBtn = sessionActions.querySelector('#complete-session-btn');
    const requestCompletionBtn = sessionActions.querySelector('#request-completion-btn');
    const rescheduleBtn = sessionActions.querySelector('#reschedule-session-btn');
    const cancelBtn = sessionActions.querySelector('#cancel-session-btn');
    
    console.log('Event listeners - joinBtn:', !!joinBtn, 'startBtn:', !!startBtn, 'completeBtn:', !!completeBtn, 'requestCompletionBtn:', !!requestCompletionBtn);
    
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            showToast('Joining session...', 'info');
            closeModal('session-detail-modal');
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            updateSessionStatus(sessionId, 'in-progress');
        });
    }
    
    if (completeBtn) {
        completeBtn.addEventListener('click', function() {
            // Show confirmation dialog
            if (confirm('Are you sure the session is completed? This will transfer credits from the student to the teacher.')) {
                updateSessionStatus(sessionId, 'completed');
            }
        });
    }
    
    if (requestCompletionBtn) {
        requestCompletionBtn.addEventListener('click', function() {
            requestSessionCompletion(sessionId);
        });
    }
    
    if (rescheduleBtn) {
        rescheduleBtn.addEventListener('click', function() {
            showToast('Reschedule request sent!', 'success');
            closeModal('session-detail-modal');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel this session?')) {
                updateSessionStatus(sessionId, 'cancelled');
            }
        });
    }
    
    openModal('session-detail-modal');
}

// Function to update session status
async function updateSessionStatus(sessionId, newStatus) {
    try {
        if (window.apiClient && window.apiClient.put) {
            const response = await window.apiClient.put(`/sessions/${sessionId}`, {
                status: newStatus
            });
            
            if (response.success) {
                showToast(`Session ${newStatus} successfully!`, 'success');
                closeModal('session-detail-modal');
                // Reload sessions to update the UI
                await loadUpcomingSessions();
                await loadPendingRequests();
            } else {
                throw new Error(response.message || 'Failed to update session status');
            }
        } else {
            // Fallback without API
            showToast(`Session marked as ${newStatus}!`, 'success');
            closeModal('session-detail-modal');
        }
    } catch (error) {
        console.error('Error updating session status:', error);
        showToast('Failed to update session status. Please try again.', 'error');
    }
}

// Function to request session completion (for learners)
async function requestSessionCompletion(sessionId) {
    try {
        if (confirm('Are you sure you want to mark this session as completed? This will send a confirmation request to your teacher.')) {
            if (window.apiClient && window.apiClient.post) {
                const response = await window.apiClient.post(`/sessions/${sessionId}/request-completion`, {});
                
                if (response.success) {
                    showToast('Completion request sent to teacher! You will be notified once they confirm.', 'success');
                    closeModal('session-detail-modal');
                    // Reload sessions to update the UI
                    await loadUpcomingSessions();
                } else {
                    throw new Error(response.message || 'Failed to request completion');
                }
            } else {
                // Fallback without API
                showToast('Completion request sent!', 'success');
                closeModal('session-detail-modal');
            }
        }
    } catch (error) {
        console.error('Error requesting completion:', error);
        showToast(error.message || 'Failed to request session completion. Please try again.', 'error');
    }
}

// Function to confirm session completion (for teachers)
async function confirmSessionCompletion(sessionId) {
    try {
        if (window.apiClient && window.apiClient.post) {
            const response = await window.apiClient.post(`/sessions/${sessionId}/confirm-completion`, {});
            
            if (response.success) {
                showToast('Session completion confirmed! Credits have been transferred.', 'success');
                closeModal('completion-request-modal');
                // Reload sessions to update the UI
                await loadPendingCompletionRequests();
                await loadCompletedSessions();
                
                // The student will receive an email with a link to rate the session
                // No need to show rating modal here as teacher confirmed
            } else {
                throw new Error(response.message || 'Failed to confirm completion');
            }
        } else {
            // Fallback without API
            showToast('Session completion confirmed!', 'success');
            closeModal('completion-request-modal');
        }
    } catch (error) {
        console.error('Error confirming completion:', error);
        showToast(error.message || 'Failed to confirm session completion. Please try again.', 'error');
    }
}

// Function to reject session completion (for teachers)
async function rejectSessionCompletion(sessionId, reason) {
    try {
        if (window.apiClient && window.apiClient.post) {
            const response = await window.apiClient.post(`/sessions/${sessionId}/reject-completion`, {
                rejectionReason: reason
            });
            
            if (response.success) {
                showToast('Completion request rejected.', 'info');
                closeModal('completion-request-modal');
                // Reload pending completion requests
                await loadPendingCompletionRequests();
            } else {
                throw new Error(response.message || 'Failed to reject completion');
            }
        } else {
            // Fallback without API
            showToast('Completion request rejected.', 'info');
            closeModal('completion-request-modal');
        }
    } catch (error) {
        console.error('Error rejecting completion:', error);
        showToast(error.message || 'Failed to reject completion request. Please try again.', 'error');
    }
}

function initializeQuickActions() {
    console.log('initializeQuickActions called');
    
    // Add New Skill button
    const addSkillBtn = document.getElementById('add-skill-btn');
    console.log('Add skill button found:', addSkillBtn);
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', function() {
            console.log('Add skill button clicked!');
            window.location.href = 'add-skill.html';
        });
        console.log('Add skill button event listener added');
    } else {
        console.error('Add skill button not found!');
    }
    
    // Browse Skills button
    const browseSkillsBtn = document.getElementById('browse-skills-btn');
    if (browseSkillsBtn) {
        browseSkillsBtn.addEventListener('click', function() {
            window.location.href = 'marketplace.html';
        });
    }
    
    // View Messages button
    const viewMessagesBtn = document.getElementById('view-messages-btn');
    if (viewMessagesBtn) {
        viewMessagesBtn.addEventListener('click', function() {
            window.location.href = 'messages.html';
        });
    }
    
    // Earn Credits button
    const earnCreditsBtn = document.getElementById('earn-credits-btn');
    if (earnCreditsBtn) {
        earnCreditsBtn.addEventListener('click', function() {
            window.location.href = 'marketplace.html';
        });
    }
    
    // Manage Skills button
    const manageSkillsBtn = document.getElementById('manage-skills-btn');
    if (manageSkillsBtn) {
        manageSkillsBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
    
    // View All Sessions button
    const viewAllSessionsBtn = document.getElementById('view-all-sessions-btn');
    if (viewAllSessionsBtn) {
        viewAllSessionsBtn.addEventListener('click', function() {
            showToast('Loading all sessions...', 'info');
            // In a real app, this would navigate to a sessions page
        });
    }
    
    // View All Completed Sessions button
    const viewAllCompletedBtn = document.getElementById('view-all-completed-btn');
    if (viewAllCompletedBtn) {
        viewAllCompletedBtn.addEventListener('click', function() {
            // Show all completed sessions in a modal
            showAllCompletedSessions();
        });
    }
}

function initializeSkillManagement() {
    // Add skill form validation
    const addSkillForm = document.getElementById('add-skill-form');
    console.log('Add skill form found:', addSkillForm);

    if (addSkillForm) {
        console.log('Adding submit event listener to form');
        addSkillForm.addEventListener('submit', function(e) {
            console.log('Form submit event triggered!');
            e.preventDefault();
            console.log('Add skill form submitted');
            handleAddSkillForm(e);
        });
        console.log('Event listener added successfully');
        
        // Also add click event listener to the submit button as backup
        const submitBtn = addSkillForm.querySelector('button[type="submit"]');
        console.log('Submit button found:', submitBtn);
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                console.log('Submit button clicked!');
                // Don't prevent default here, let the form submit event handle it
            });
            console.log('Click event listener added to submit button');
        }
    } else {
        console.error('Add skill form not found!');
    }
}

function handleAddSkillForm(e) {
    console.log('handleAddSkillForm called');
    console.log('Form target:', e.target);
    console.log('Form target tagName:', e.target.tagName);
    
    const formData = new FormData(e.target);
    console.log('FormData created');
    
    // Log all form data
    for (let [key, value] of formData.entries()) {
        console.log(`Form field ${key}:`, value);
    }
    
    const skillData = {
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        creditsPerHour: parseInt(formData.get('creditsPerHour')),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        availableDays: Array.from(formData.getAll('availability')),
        availableTimes: Array.from(formData.getAll('timeSlots')).map(slot => {
            // Map time slots to time ranges
            const timeMap = {
                'morning': { start: '08:00', end: '12:00' },
                'afternoon': { start: '12:00', end: '17:00' },
                'evening': { start: '17:00', end: '21:00' },
                'night': { start: '21:00', end: '23:00' }
            };
            return timeMap[slot] || { start: '08:00', end: '12:00' };
        }),
        level: 'Beginner', // Default level
        location: 'campus-library' // Default location
    };
    
    console.log('Skill data:', skillData);
    
    // Validation
    console.log('Starting validation...');
    console.log('Title:', skillData.title);
    console.log('Category:', skillData.category);
    console.log('Description:', skillData.description);
    
    if (!skillData.title || !skillData.category || !skillData.description) {
        console.log('Validation failed - missing required fields');
        console.log('Missing fields:', {
            title: !skillData.title,
            category: !skillData.category,
            description: !skillData.description
        });
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    console.log('Validation passed!');
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding Skill...';
    }
    
    // Call API to add skill
    console.log('API Client available:', !!window.apiClient);
    console.log('createSkill method available:', !!(window.apiClient && window.apiClient.createSkill));
    console.log('Current user:', window.currentUser);
    console.log('Is logged in:', window.isLoggedIn);
    console.log('Auth token:', window.apiClient ? window.apiClient.token : 'No API client');
    
    if (window.apiClient && window.apiClient.createSkill) {
        console.log('Calling API to create skill...');
        window.apiClient.createSkill(skillData)
            .then(response => {
                console.log('API response:', response);
                if (response.success) {
                    console.log('Skill added successfully');
                    addSkillToList(response.data);
                    e.target.reset();
                    closeModal('add-skill-modal');
                    showToast('Skill added successfully!', 'success');
                    
                    // Refresh the marketplace to show the new skill
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
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Add Skill';
                }
                
                // Update user stats
                updateUserStats();
            });
    } else {
        // Fallback to local addition if API not available
        setTimeout(() => {
            addSkillToList(skillData);
            e.target.reset();
            closeModal('add-skill-modal');
            showToast('Skill added locally!', 'info');
            
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Skill';
            }
            
            // Update user stats
            updateUserStats();
        }, 1500);
    }
}

function addSkillToList(skillData) {
    const skillsList = document.getElementById('my-skills-list');
    if (!skillsList) return;
    
    // Remove empty state if it exists
    const emptyState = skillsList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const skillElement = document.createElement('div');
    skillElement.className = 'skill-item';
    skillElement.innerHTML = `
        <div class="skill-header">
            <i class="fas fa-${getSkillIcon(skillData.category)}"></i>
            <div class="skill-info">
                <h4>${skillData.title}</h4>
                <span class="skill-category">${skillData.category}</span>
            </div>
        </div>
        <div class="skill-credits">${skillData.creditsPerHour || skillData.credits} Credits/hour</div>
        <div class="skill-actions">
            <button class="btn btn-outline btn-small" onclick="editSkill(this)">Edit</button>
            <button class="btn btn-danger btn-small" onclick="deleteSkill(this)">Delete</button>
        </div>
    `;
    
    skillsList.appendChild(skillElement);
    
    // Update the skills count
    const skillsTaughtElement = document.getElementById('skills-taught');
    if (skillsTaughtElement) {
        const currentCount = parseInt(skillsTaughtElement.textContent) || 0;
        skillsTaughtElement.textContent = currentCount + 1;
    }
}

function editSkill(button) {
    const skillItem = button.closest('.skill-item');
    const title = skillItem.querySelector('h4').textContent;
    showToast(`Editing ${title}...`, 'info');
}

function deleteSkill(button) {
    const skillItem = button.closest('.skill-item');
    const title = skillItem.querySelector('h4').textContent;
    const skillId = skillItem.dataset.skillId; // Get the skill ID from data attribute
    
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        // If we have access to the API client, use it to delete the skill
        if (window.apiClient && window.apiClient.deleteSkill) {
            // Show loading state
            const deleteBtn = skillItem.querySelector('.btn-danger');
            if (deleteBtn) {
                deleteBtn.textContent = 'Deleting...';
                deleteBtn.disabled = true;
            }
            
            window.apiClient.deleteSkill(skillItem.dataset.skillId)
                .then(response => {
                    if (response.success) {
                        // Remove the skill from the UI
                        skillItem.remove();
                        showToast('Skill deleted successfully!', 'success');
                        updateUserStats();
                        
                        // Reload marketplace skills to ensure the deleted skill is not shown
                        if (typeof loadMarketplaceSkills === 'function') {
                            // Add a small delay to allow the delete to propagate
                            setTimeout(loadMarketplaceSkills, 1000);
                        }
                    } else {
                        throw new Error(response.message || 'Failed to delete skill');
                    }
                })
                .catch(error => {
                    console.error('Error deleting skill:', error);
                    showToast('Failed to delete skill. Please try again.', 'error');
                    // Re-enable the button
                    if (deleteBtn) {
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.disabled = false;
                    }
                });
        } else {
            // Fallback: just remove from UI if no API client
            skillItem.remove();
            showToast('Skill deleted successfully!', 'success');
            updateUserStats();
        }
    }
}

function updateUserStats() {
    const skillsList = document.getElementById('my-skills-list');
    const skillsCount = skillsList ? skillsList.querySelectorAll('.skill-item').length : 0;
    
    // Update skills taught count
    const skillsTaughtElement = document.getElementById('skills-taught-count');
    if (skillsTaughtElement) {
        skillsTaughtElement.textContent = skillsCount;
    }
    
    // Update user data in localStorage
    const user = getUserFromStorage();
    if (user) {
        user.skillsTaught = skillsCount;
        localStorage.setItem('campusSkillSwapUser', JSON.stringify(user));
    }
}

function loadDashboardData(user = null) {
    // Only get from storage if no user provided AND we're not in a failed auth state
    if (!user && window.isLoggedIn !== false) {
        user = getUserFromStorage();
    }
    
    // Update navigation based on auth status
    updateNavigation(user);
    
    // Update welcome message
    const welcomeName = document.getElementById('welcome-name');
    const userDetails = document.getElementById('user-details');
    
    if (welcomeName) {
        if (user && (user.name || user.email || user.id)) {
            const displayName = user.name || user.email || user.id || 'User';
            welcomeName.textContent = `Welcome back, ${displayName}!`;
        } else {
            welcomeName.textContent = 'Please log in to access your dashboard';
        }
    }
    
    if (userDetails) {
        if (user && user.major && user.year) {
            userDetails.textContent = `${user.major}, ${user.year}`;
        } else if (user && user.name) {
            userDetails.textContent = 'Welcome to your dashboard!';
        } else {
            userDetails.textContent = 'You need to be logged in to view your dashboard content';
        }
    }
    
    // Load dashboard components with small delays to prevent rate limiting
    if (user) {
        // Load user skills immediately
        loadUserSkills();
        
        // Load other components with small delays
        setTimeout(() => {
            loadUpcomingSessions();
        }, 100);
        
        setTimeout(() => {
            loadPendingRequests();
        }, 200);
        
        setTimeout(() => {
            loadMessageCount();
        }, 300);
        
        setTimeout(() => {
            loadCompletedSessions(2); // Load only 2 most recent completed sessions by default
        }, 400);
        
        // Load other components
        loadRecentActivity();
        updateDashboardStats(user);
        loadDashboardReviews();
    } else {
        // Load components without user data
        loadRecentActivity();
        if (user) {
            updateDashboardStats(user);
        }
        showToast('Please log in to view your dashboard', 'info');
    }
}

// Open add skill modal
function openAddSkillModal() {
    const modal = document.getElementById('add-skill-modal');
    if (modal) {
        openModal('add-skill-modal');
    } else {
        showToast('Add skill feature coming soon!', 'info');
    }
}

function loadUserSkills() {
    const skillsList = document.getElementById('my-skills-list');
    if (!skillsList) return;
    
    // Show loading state
    skillsList.innerHTML = '<div class="loading">Loading your skills...</div>';
    
    // Load user skills from API
    if (window.apiClient && window.apiClient.get) {
        window.apiClient.get('/skills/my-skills')
            .then(response => {
                if (response.success) {
                    const userSkills = response.data || [];
                    
                    if (userSkills.length === 0) {
                        skillsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-plus-circle"></i>
                                <h3>No Skills Added Yet</h3>
                                <p>Start by adding your first skill to teach others!</p>
                                <button class="btn btn-primary" onclick="openAddSkillModal()">Add Your First Skill</button>
                            </div>
                        `;
                    } else {
                        skillsList.innerHTML = userSkills.map(skill => {
                            // Get the rating value - handle both number and object formats
                            const rating = skill.rating?.average || skill.rating || 0;
                            const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
                            
                            // Generate star icons
                            const stars = Array(5).fill(0).map((_, i) => 
                                `<i class="${i < Math.floor(numericRating) ? 'fas' : (i < numericRating ? 'fas' : 'far')} fa-star"></i>`
                            ).join('');
                            
                            return `
                                <div class="skill-item" data-skill-id="${skill._id}">
                                    <div class="skill-header">
                                        <i class="fas fa-${getSkillIcon(skill.category)}"></i>
                                        <div class="skill-info">
                                            <h4>${skill.title}</h4>
                                            <span class="skill-category">${skill.category}</span>
                                        </div>
                                    </div>
                                    <div class="skill-credits">${skill.creditsPerHour} Credits/hour</div>
                                    <div class="skill-rating">
                                        <div class="stars">${stars}</div>
                                        <span>(${numericRating.toFixed(1)})</span>
                                    </div>
                                    <div class="skill-actions">
                                        <button class="btn btn-outline btn-small" onclick="editSkill(this)">Edit</button>
                                        <button class="btn btn-danger btn-small" onclick="deleteSkill(this)">Delete</button>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                } else {
                    throw new Error(response.message || 'Failed to load skills');
                }
            })
            .catch(error => {
                console.error('Error loading user skills:', error);
                skillsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error Loading Skills</h3>
                        <p>Failed to load your skills. Please try again later.</p>
                        <button class="btn btn-primary" onclick="loadUserSkills()">Retry</button>
                    </div>
                `;
            });
    } else {
        // Fallback for when API client is not available
        skillsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-plus-circle"></i>
                <h3>No Skills Added Yet</h3>
                <p>Start by adding your first skill to teach others!</p>
                <button class="btn btn-primary" onclick="openAddSkillModal()">Add Your First Skill</button>
            </div>
        `;
    }
}

function updateDashboardStats(user = null) {
    // Only get from storage if no user provided AND we're not in a failed auth state
    if (!user && window.isLoggedIn !== false) {
        user = getUserFromStorage();
    }
    
    // Debug logging
    console.log('updateDashboardStats called with user:', user);
    console.log('User rating:', user?.rating);
    console.log('User rating type:', typeof user?.rating);
    
    // Update time credits in stats section
    const timeCreditsElement = document.getElementById('time-credits');
    if (timeCreditsElement) {
        timeCreditsElement.textContent = user && (user.timeCredits || user.credits) ? (user.timeCredits || user.credits) : '0';
    }
    
    // Update rating in stats section
    const userRatingElement = document.getElementById('user-rating');
    if (userRatingElement) {
        const rating = user?.rating?.average || user?.rating;
        // Convert to number and ensure it's valid
        const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
        userRatingElement.textContent = numericRating.toFixed(1);
    }
    
    // Update skills taught in stats section
    const skillsTaughtElement = document.getElementById('skills-taught');
    if (skillsTaughtElement) {
        const skillsTaught = user?.stats?.sessionsTaught || user?.skillsTaught || 0;
        skillsTaughtElement.textContent = skillsTaught.toString();
    }
    
    // Update skills learned in stats section
    const skillsLearnedElement = document.getElementById('skills-learned');
    if (skillsLearnedElement) {
        const skillsLearned = user?.stats?.sessionsCompleted || user?.skillsLearned || 0;
        skillsLearnedElement.textContent = skillsLearned.toString();
    }
    
    // Update progress stats (bottom section)
    const sessionsCompleted = document.getElementById('sessions-completed');
    if (sessionsCompleted) {
        const sessions = user?.stats?.sessionsCompleted || user?.sessionsCompleted || 0;
        sessionsCompleted.textContent = sessions.toString();
    }
    
    const hoursTaught = document.getElementById('hours-taught');
    if (hoursTaught) {
        const hours = user?.stats?.totalHours || user?.hoursTaught || 0;
        hoursTaught.textContent = hours.toString();
    }
    
    const hoursLearned = document.getElementById('hours-learned');
    if (hoursLearned) {
        const hours = user?.stats?.totalHours || user?.hoursLearned || 0;
        hoursLearned.textContent = hours.toString();
    }
    
    // Load actual session counts from API if available
    loadSessionCounts();
}

// Load actual session counts from API
async function loadSessionCounts() {
    try {
        if (window.apiClient && window.apiClient.get) {
            // Load skills taught count (sessions where user is teacher and completed)
            const taughtResponse = await window.apiClient.get('/sessions?role=teacher&status=completed');
            if (taughtResponse.success) {
                const skillsTaughtElement = document.getElementById('skills-taught');
                if (skillsTaughtElement) {
                    skillsTaughtElement.textContent = taughtResponse.data.length.toString();
                }
                
                // Update hours taught (sum of durations)
                const totalHoursTaught = taughtResponse.data.reduce((sum, session) => {
                    return sum + (session.duration || 0);
                }, 0) / 60; // Convert minutes to hours
                
                const hoursTaughtElement = document.getElementById('hours-taught');
                if (hoursTaughtElement) {
                    hoursTaughtElement.textContent = Math.round(totalHoursTaught).toString();
                }
            }
            
            // Load skills learned count (sessions where user is student and completed)
            const learnedResponse = await window.apiClient.get('/sessions?role=student&status=completed');
            if (learnedResponse.success) {
                const skillsLearnedElement = document.getElementById('skills-learned');
                if (skillsLearnedElement) {
                    skillsLearnedElement.textContent = learnedResponse.data.length.toString();
                }
                
                // Update hours learned (sum of durations)
                const totalHoursLearned = learnedResponse.data.reduce((sum, session) => {
                    return sum + (session.duration || 0);
                }, 0) / 60; // Convert minutes to hours
                
                const hoursLearnedElement = document.getElementById('hours-learned');
                if (hoursLearnedElement) {
                    hoursLearnedElement.textContent = Math.round(totalHoursLearned).toString();
                }
            }
            
            // Load total completed sessions
            const completedResponse = await window.apiClient.get('/sessions?status=completed');
            if (completedResponse.success) {
                const sessionsCompletedElement = document.getElementById('sessions-completed');
                if (sessionsCompletedElement) {
                    sessionsCompletedElement.textContent = completedResponse.data.length.toString();
                }
            }
        }
    } catch (error) {
        console.error('Error loading session counts:', error);
    }
}

// Clean up corrupted code section that was accidentally inserted

// Modal helper functions
function openModal(modalId) {
    console.log('openModal called with ID:', modalId);
    const modal = document.getElementById(modalId);
    console.log('Modal element found:', modal);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        console.log('Modal opened successfully');
        
        // Focus first input in modal
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    } else {
        console.error('Modal not found:', modalId);
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
        }, duration);
    }, duration);
}

// Sample data loading functions

function getSkillIcon(category) {
    const icons = {
        'Technology': 'code',
        'Academics': 'graduation-cap',
        'Arts': 'palette',
        'Language': 'language',
        'Life Skills': 'utensils',
        'Sports': 'running',
        'Music': 'music',
        'Business': 'briefcase'
    };
    return icons[category] || 'star';
}

function loadRecentActivity() {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;
    
    // Show loading state
    activityFeed.innerHTML = '<div class="loading">Loading recent activity...</div>';
    
    // Load recent activity from API
    if (window.apiClient && window.apiClient.get) {
        window.apiClient.get('/sessions?status=history&limit=5')
            .then(response => {
                if (response.success) {
                    const historySessions = response.data || [];
                    
                    if (historySessions.length === 0) {
                        activityFeed.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-history"></i>
                                <p>No recent activity</p>
                            </div>
                        `;
                    } else {
                        activityFeed.innerHTML = historySessions.map(session => {
                            // Determine if current user is student or teacher
                            let role = 'participant';
                            let otherPartyName = 'Unknown';
                            if (window.currentUser) {
                                // Normalize IDs to strings for comparison
                                const currentUserId = String(window.currentUser._id || window.currentUser.id);
                                const teacherId = String(session.teacher?._id || session.teacher);
                                const studentId = String(session.student?._id || session.student);
                                
                                if (teacherId === currentUserId) {
                                    role = 'teacher';
                                    otherPartyName = session.student?.name || 'Student';
                                } else if (studentId === currentUserId) {
                                    role = 'student';
                                    otherPartyName = session.teacher?.name || 'Teacher';
                                }
                            }
                            
                            // Format time
                            const time = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt);
                            
                            // Activity message based on role and session status
                            let activityMessage = '';
                            if (session.status === 'completed') {
                                if (role === 'teacher') {
                                    activityMessage = `Taught ${session.skill?.title || 'a session'} to ${otherPartyName}`;
                                } else {
                                    activityMessage = `Learned ${session.skill?.title || 'a session'} from ${otherPartyName}`;
                                }
                            } else if (session.status === 'cancelled') {
                                activityMessage = `Cancelled session: ${session.skill?.title || 'Session'}`;
                            } else {
                                activityMessage = `Session completed: ${session.skill?.title || 'Session'}`;
                            }
                            
                            return `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="fas fa-${session.status === 'completed' ? 'check-circle' : 'times-circle'}"></i>
                                    </div>
                                    <div class="activity-content">
                                        <p>${activityMessage}</p>
                                        <span class="activity-time">${formatDate(time)}</span>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                } else {
                    throw new Error(response.message || 'Failed to load activity');
                }
            })
            .catch(error => {
                console.error('Error loading recent activity:', error);
                activityFeed.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load recent activity</p>
                    </div>
                `;
            });
    } else {
        // Fallback for when API client is not available
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
    }
}

function getActivityIcon(type) {
    const icons = {
        'session': 'check-circle',
        'skill': 'plus-circle',
        'request': 'bell'
    };
    return icons[type] || 'circle';
}

async function loadUpcomingSessions() {
    const sessionsList = document.getElementById('upcoming-sessions');
    if (!sessionsList) {
        console.error('Upcoming sessions container not found');
        return;
    }

    // Show loading state
    sessionsList.innerHTML = '<div class="loading">Loading upcoming sessions...</div>';

    try {
        if (window.apiClient && window.apiClient.get) {
            // Call the sessions API to get upcoming sessions
            const response = await window.apiClient.get('/sessions?status=upcoming');
            
            if (response.success && response.data) {
                const upcomingSessions = response.data;
                console.log('Upcoming sessions loaded:', upcomingSessions);
                
                if (upcomingSessions.length === 0) {
                    sessionsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-calendar-check"></i>
                            <p>No upcoming sessions scheduled</p>
                        </div>
                    `;
                } else {
                    sessionsList.innerHTML = upcomingSessions.map(session => {
                        // Determine if current user is student or teacher
                        let otherPartyName = 'Unknown';
                        if (window.currentUser) {
                            if (session.teacher && session.teacher._id === window.currentUser._id) {
                                // Current user is teacher, show student name
                                otherPartyName = session.student?.name || 'Student';
                            } else if (session.student && session.student._id === window.currentUser._id) {
                                // Current user is student, show teacher name
                                otherPartyName = session.teacher?.name || 'Teacher';
                            }
                        }
                        
                        // If we still have 'Unknown', try to extract from the populated objects
                        if (otherPartyName === 'Unknown' || otherPartyName === 'Teacher' || otherPartyName === 'Student') {
                            if (session.teacher && session.teacher.name) {
                                if (session.teacher._id === window.currentUser._id) {
                                    otherPartyName = session.student?.name || 'Student';
                                } else {
                                    otherPartyName = session.teacher.name;
                                }
                            } else if (session.student && session.student.name) {
                                if (session.student._id === window.currentUser._id) {
                                    otherPartyName = session.teacher?.name || 'Teacher';
                                } else {
                                    otherPartyName = session.student.name;
                                }
                            }
                        }
                        
                        return `
                        <div class="session-item" data-session-id="${session._id}" data-session-data='${JSON.stringify(session)}'>
                            <div class="session-info">
                                <h4>${session.skill?.title || 'Session'}</h4>
                                <p>with ${otherPartyName}</p>
                                <span class="session-time">${formatDate(session.scheduledDate)} at ${session.startTime}</span>
                            </div>
                            <div class="session-credits">${session.totalCredits || session.creditsPerHour || 0} credits</div>
                        </div>
                    `}).join('');
                }
            } else {
                throw new Error(response.message || 'Failed to load sessions');
            }
        } else {
            // Fallback when API client is not available
            sessionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>No upcoming sessions scheduled</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading upcoming sessions:', error);
        sessionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load upcoming sessions</p>
            </div>
        `;
    }
}

async function loadPendingRequests() {
    const requestsList = document.getElementById('pending-requests');
    const pendingRequestsBadge = document.getElementById('pending-requests-count');
    
    if (!requestsList) {
        console.error('Pending requests container not found');
        return;
    }
    
    // Show loading state
    requestsList.innerHTML = '<div class="loading">Loading pending requests...</div>';

    try {
        if (window.apiClient && window.apiClient.get) {
            // Load both pending session requests and pending completion requests
            const [sessionRequestsResponse, completionRequestsResponse] = await Promise.all([
                window.apiClient.get('/sessions?status=pending&role=teacher&limit=5'),
                loadPendingCompletionRequests(true) // Pass true to indicate we only want the data, not to update UI
            ]);
            
            const sessionRequests = sessionRequestsResponse.success ? sessionRequestsResponse.data : [];
            const completionRequests = completionRequestsResponse || [];
            
            console.log('Pending session requests loaded:', sessionRequests);
            console.log('Pending completion requests loaded:', completionRequests);
            
            // Combine both types of requests
            const totalRequests = sessionRequests.length + completionRequests.length;
            
            // Update the badge count
            if (pendingRequestsBadge) {
                if (totalRequests > 0) {
                    pendingRequestsBadge.textContent = totalRequests;
                    pendingRequestsBadge.style.display = 'block';
                } else {
                    pendingRequestsBadge.style.display = 'none';
                }
            }
            
            if (totalRequests === 0) {
                requestsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No pending requests</p>
                    </div>
                `;
            } else {
                let requestsHTML = '';
                
                // Add completion requests first (higher priority)
                if (completionRequests.length > 0) {
                    requestsHTML += '<h4 class="requests-section-title">Completion Confirmations</h4>';
                    requestsHTML += completionRequests.map(session => {
                        console.log('Completion request data:', session.completionRequest);
                        
                        // Format requested date - try multiple fallback sources
                        let requestedDate = 'Unknown';
                        const requestedAt = session.completionRequest?.requestedAt || session.updatedAt || session.createdAt;
                        if (requestedAt) {
                            requestedDate = formatDate(requestedAt);
                        }
                        
                        // Format session date
                        let sessionDate = 'Unknown';
                        if (session.scheduledDate) {
                            sessionDate = formatDate(session.scheduledDate);
                        }
                        
                        return `
                        <div class="request-item completion-request" data-session-id="${session._id}">
                            <div class="request-info">
                                <h4>Session Completion Request</h4>
                                <p>${session.student?.name || 'Student'} completed: ${session.skill?.title || 'a session'}</p>
                                <p><small>Requested on: ${requestedDate}</small></p>
                                <p><small>Session date: ${sessionDate} at ${session.startTime}</small></p>
                            </div>
                            <div class="request-actions">
                                <button class="btn btn-primary btn-small confirm-completion-btn" data-session-id="${session._id}">Confirm</button>
                                <button class="btn btn-outline btn-small reject-completion-btn" data-session-id="${session._id}">Reject</button>
                            </div>
                        </div>
                    `;
                    }).join('');
                }
                
                // Add session requests
                if (sessionRequests.length > 0) {
                    if (completionRequests.length > 0) {
                        requestsHTML += '<h4 class="requests-section-title" style="margin-top: 20px;">New Session Requests</h4>';
                    }
                    requestsHTML += sessionRequests.map(request => {
                        // Format requested date
                        let requestedDate = 'Unknown';
                        const reqDate = new Date(request.requestedAt || request.createdAt);
                        if (!isNaN(reqDate.getTime())) {
                            requestedDate = formatDate(reqDate);
                        }
                        
                        // Format scheduled date
                        let scheduledDate = 'Unknown';
                        if (request.scheduledDate) {
                            scheduledDate = formatDate(request.scheduledDate);
                        }
                        
                        return `
                        <div class="request-item" data-request-id="${request._id}">
                            <div class="request-info">
                                <h4>${request.student?.name || 'Student'}</h4>
                                <p>wants to learn ${request.skill?.title || 'a skill'}</p>
                                <p><small>Requested on: ${requestedDate}</small></p>
                                <p><small>Proposed date: ${scheduledDate} at ${request.startTime}</small></p>
                                ${request.requestMessage ? `<p><small>Message: ${request.requestMessage}</small></p>` : ''}
                            </div>
                            <div class="request-actions">
                                <button class="btn btn-primary btn-small accept-request-btn" data-request-id="${request._id}">Accept</button>
                                <button class="btn btn-outline btn-small decline-request-btn" data-request-id="${request._id}">Decline</button>
                            </div>
                        </div>
                    `;
                    }).join('');
                }
                
                requestsList.innerHTML = requestsHTML;
                
                // Add event listeners for session request buttons
                document.querySelectorAll('.accept-request-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        acceptRequest(this.dataset.requestId);
                    });
                });
                
                document.querySelectorAll('.decline-request-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        declineRequest(this.dataset.requestId);
                    });
                });
                
                // Add event listeners for completion request buttons
                document.querySelectorAll('.confirm-completion-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        confirmSessionCompletion(this.dataset.sessionId);
                    });
                });
                
                document.querySelectorAll('.reject-completion-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const reason = prompt('Please provide a reason for rejecting this completion request:');
                        if (reason !== null) { // User didn't cancel
                            rejectSessionCompletion(this.dataset.sessionId, reason);
                        }
                    });
                });
            }
        } else {
            // Fallback when API client is not available
            if (pendingRequestsBadge) {
                pendingRequestsBadge.style.display = 'none';
            }
            requestsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No pending requests</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading pending requests:', error);
        if (pendingRequestsBadge) {
            pendingRequestsBadge.style.display = 'none';
        }
        requestsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load pending requests</p>
            </div>
        `;
    }
}

// Load pending completion requests for teachers
async function loadPendingCompletionRequests(returnDataOnly = false) {
    try {
        if (window.apiClient && window.apiClient.get) {
            // Get all sessions where user is teacher and there's a pending completion request
            const response = await window.apiClient.get('/sessions?role=teacher');
            
            if (response.success && response.data) {
                // Filter sessions with pending completion requests
                const pendingCompletions = response.data.filter(session => 
                    session.completionRequest && 
                    session.completionRequest.status === 'pending'
                );
                
                console.log('Pending completion requests:', pendingCompletions);
                
                if (returnDataOnly) {
                    return pendingCompletions;
                }
                
                return pendingCompletions;
            }
        }
        return [];
    } catch (error) {
        console.error('Error loading pending completion requests:', error);
        return [];
    }
}

// Remove corrupted HTML/JS code that was accidentally inserted
// This was causing syntax errors in the file

// Handle request actions
async function acceptRequest(requestId) {
    try {
        if (window.apiClient && window.apiClient.put) {
            // Update session status to approved
            const response = await window.apiClient.put(`/sessions/${requestId}`, {
                status: 'approved',
                approvalMessage: 'Request accepted'
            });
            
            if (response.success) {
    showToast('Request accepted! Session scheduled.', 'success');
                // Reload pending requests to update the UI and badge
                await loadPendingRequests();
            } else {
                throw new Error(response.message || 'Failed to accept request');
            }
        } else {
            // Fallback without API
            showToast('Request accepted! Session scheduled.', 'success');
            // Remove the request from UI for demo purposes
    const requestItem = document.querySelector(`[data-request-id="${requestId}"]`);
    if (requestItem) {
        requestItem.remove();
    }
            // Update badge count manually for demo
            const pendingRequestsBadge = document.getElementById('pending-requests-count');
            if (pendingRequestsBadge) {
                const currentCount = parseInt(pendingRequestsBadge.textContent) || 0;
                const newCount = Math.max(0, currentCount - 1);
                if (newCount > 0) {
                    pendingRequestsBadge.textContent = newCount;
                    pendingRequestsBadge.style.display = 'block';
                } else {
                    pendingRequestsBadge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error accepting request:', error);
        showToast('Failed to accept request. Please try again.', 'error');
    }
}

async function declineRequest(requestId) {
    try {
        if (window.apiClient && window.apiClient.put) {
            // Update session status to cancelled
            const response = await window.apiClient.put(`/sessions/${requestId}`, {
                status: 'cancelled',
                cancellationReason: 'Request declined by teacher'
            });
            
            if (response.success) {
    showToast('Request declined.', 'info');
                // Reload pending requests to update the UI and badge
                await loadPendingRequests();
            } else {
                throw new Error(response.message || 'Failed to decline request');
            }
        } else {
            // Fallback without API
            showToast('Request declined.', 'info');
            // Remove the request from UI for demo purposes
    const requestItem = document.querySelector(`[data-request-id="${requestId}"]`);
    if (requestItem) {
        requestItem.remove();
    }
            // Update badge count manually for demo
            const pendingRequestsBadge = document.getElementById('pending-requests-count');
            if (pendingRequestsBadge) {
                const currentCount = parseInt(pendingRequestsBadge.textContent) || 0;
                const newCount = Math.max(0, currentCount - 1);
                if (newCount > 0) {
                    pendingRequestsBadge.textContent = newCount;
                    pendingRequestsBadge.style.display = 'block';
                } else {
                    pendingRequestsBadge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error declining request:', error);
        showToast('Failed to decline request. Please try again.', 'error');
    }
}

// Demo user function removed - use real authentication

// Load completed sessions
async function loadCompletedSessions(limit = 2) {
    const sessionsList = document.getElementById('completed-sessions');
    
    if (!sessionsList) {
        console.error('Completed sessions container not found');
        return;
    }
    
    // Show loading state
    sessionsList.innerHTML = '<div class="loading">Loading completed sessions...</div>';
    
    try {
        if (window.apiClient && window.apiClient.get) {
            // Get all completed sessions to determine the total count
            const allSessionsResponse = await window.apiClient.get('/sessions?status=completed');
            
            if (allSessionsResponse.success && allSessionsResponse.data) {
                // Get all completed sessions and sort them
                const allCompletedSessions = allSessionsResponse.data;
                allCompletedSessions.sort((a, b) => {
                    const dateA = new Date(a.completedAt || a.createdAt);
                    const dateB = new Date(b.completedAt || b.createdAt);
                    return dateB - dateA;
                });
                
                // Get the sessions to display (limited number)
                const sessionsToShow = limit ? allCompletedSessions.slice(0, limit) : allCompletedSessions;
                
                // Check if any completed session needs rating (for students)
                if (window.currentUser) {
                    const currentUserId = String(window.currentUser._id || window.currentUser.id);
                    
                    // Find first completed session where user is student and hasn't been reviewed
                    const sessionNeedingReview = allCompletedSessions.find(session => {
                        const studentId = String(session.student?._id || session.student);
                        // Check if current user is student and session was recently completed (within last 24 hours)
                        if (studentId === currentUserId) {
                            const completedAt = new Date(session.completedAt);
                            const now = new Date();
                            const hoursSinceCompletion = (now - completedAt) / (1000 * 60 * 60);
                            
                            // Check if there's already a review from the current user
                            const hasReview = session.reviews && session.reviews.some(review => {
                                const reviewerId = String(review.reviewer?._id || review.reviewer);
                                return reviewerId === currentUserId;
                            });
                            
                            // Show rating modal if completed within last 24 hours and no review exists
                            return hoursSinceCompletion < 24 && !hasReview;
                        }
                        return false;
                    });
                    
                    // Auto-show rating modal for newly completed sessions
                    if (sessionNeedingReview && !sessionStorage.getItem(`rated_${sessionNeedingReview._id}`)) {
                        setTimeout(() => {
                            showRatingModal(sessionNeedingReview._id);
                        }, 1000); // Show after 1 second delay
                    }
                }
                
                if (allCompletedSessions.length === 0) {
                    sessionsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>No completed sessions yet</p>
                        </div>
                    `;
                } else {
                    sessionsList.innerHTML = sessionsToShow.map(session => {
                        // Determine if current user is student or teacher
                        let role = 'participant';
                        let otherPartyName = 'Unknown';
                        if (window.currentUser) {
                            // Normalize IDs to strings for comparison
                            const currentUserId = String(window.currentUser._id || window.currentUser.id);
                            const teacherId = String(session.teacher?._id || session.teacher);
                            const studentId = String(session.student?._id || session.student);
                            
                            if (teacherId === currentUserId) {
                                role = 'teacher';
                                otherPartyName = session.student?.name || 'Student';
                            } else if (studentId === currentUserId) {
                                role = 'student';
                                otherPartyName = session.teacher?.name || 'Teacher';
                            }
                        }
                        
                        const completedDate = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt);
                        const durationHours = Math.round((session.duration || 60) / 60 * 10) / 10; // Convert minutes to hours, round to 1 decimal
                        
                        // Check if there's a review for this session
                        let reviewHTML = '';
                        if (session.reviews && session.reviews.length > 0) {
                            const review = session.reviews[0]; // Get the first review
                            const rating = review.rating || 0;
                            const stars = Array(5).fill(0).map((_, i) => 
                                i < rating ? '<i class="fas fa-star" style="color: #ffd700;"></i>' : '<i class="far fa-star" style="color: #ffd700;"></i>'
                            ).join('');
                            reviewHTML = `
                                <div class="session-review">
                                    <div class="review-stars">${stars}</div>
                                    ${review.comment ? `<p class="review-comment">${review.comment.substring(0, 100)}${review.comment.length > 100 ? '...' : ''}</p>` : ''}
                                </div>
                            `;
                        }
                        
                        return `
                            <div class="session-item completed" data-session-id="${session._id}">
                                <div class="session-info">
                                    <h4>${session.skill?.title || 'Session'}</h4>
                                    <p>${role === 'teacher' ? 'Taught to' : 'Learned from'} ${otherPartyName}</p>
                                    <div class="session-meta">
                                        <span class="session-date">
                                            <i class="fas fa-calendar"></i>
                                            ${formatDate(completedDate)}
                                        </span>
                                        <span class="session-duration">
                                            <i class="fas fa-clock"></i>
                                            ${session.duration} minutes
                                        </span>
                                    </div>
                                    ${reviewHTML}
                                </div>
                                <div class="session-status">
                                    <span class="status-badge status-completed">
                                        <i class="fas fa-check-circle"></i>
                                        Completed
                                    </span>
                                    <div class="session-credits">${session.totalCredits || session.creditsPerHour || 0} credits</div>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Add click handlers to show session details
                    document.querySelectorAll('.session-item.completed').forEach(item => {
                        item.addEventListener('click', function() {
                            const sessionData = allCompletedSessions.find(s => s._id === this.dataset.sessionId);
                            if (sessionData) {
                                showCompletedSessionDetails(sessionData);
                            }
                        });
                    });
                    
                    // If we're showing limited sessions and there are more, show the "View All" button
                    const viewAllBtn = document.getElementById('view-all-completed-btn');
                    // Show "View All" button only if we have more sessions than the limit
                    if (limit && allCompletedSessions.length > limit && viewAllBtn) {
                        viewAllBtn.style.display = 'inline-block';
                    } else if (viewAllBtn) {
                        viewAllBtn.style.display = 'none';
                    }
                }
            } else {
                throw new Error(allSessionsResponse.message || 'Failed to load completed sessions');
            }
        } else {
            // Fallback when API client is not available
            sessionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No completed sessions yet</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading completed sessions:', error);
        sessionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load completed sessions</p>
            </div>
        `;
    }
}

// Load completed sessions
async function loadCompletedSessions(limit = 2) {
    const sessionsList = document.getElementById('completed-sessions');
    
    if (!sessionsList) {
        console.error('Completed sessions container not found');
        return;
    }
    
    // Show loading state
    sessionsList.innerHTML = '<div class="loading">Loading completed sessions...</div>';
    
    try {
        if (window.apiClient && window.apiClient.get) {
            // Get all completed sessions to determine the total count
            const allSessionsResponse = await window.apiClient.get('/sessions?status=completed');
            
            if (allSessionsResponse.success && allSessionsResponse.data) {
                // Get all completed sessions and sort them
                const allCompletedSessions = allSessionsResponse.data;
                allCompletedSessions.sort((a, b) => {
                    const dateA = new Date(a.completedAt || a.createdAt);
                    const dateB = new Date(b.completedAt || b.createdAt);
                    return dateB - dateA;
                });
                
                // Get the sessions to display (limited number)
                const sessionsToShow = limit ? allCompletedSessions.slice(0, limit) : allCompletedSessions;
                
                if (allCompletedSessions.length === 0) {
                    sessionsList.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No completed sessions yet</p></div>';
                } else {
                    let html = '';
                    for (let i = 0; i < sessionsToShow.length; i++) {
                        const session = sessionsToShow[i];
                        
                        // Determine if current user is student or teacher
                        let role = 'participant';
                        let otherPartyName = 'Unknown';
                        if (window.currentUser) {
                            // Normalize IDs to strings for comparison
                            const currentUserId = String(window.currentUser._id || window.currentUser.id);
                            const teacherId = String(session.teacher?._id || session.teacher);
                            const studentId = String(session.student?._id || session.student);
                            
                            if (teacherId === currentUserId) {
                                role = 'teacher';
                                otherPartyName = session.student?.name || 'Student';
                            } else if (studentId === currentUserId) {
                                role = 'student';
                                otherPartyName = session.teacher?.name || 'Teacher';
                            }
                        }
                        
                        const completedDate = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt);
                        
                        // Check if there's a review for this session
                        let reviewHTML = '';
                        if (session.reviews && session.reviews.length > 0) {
                            const review = session.reviews[0]; // Get the first review
                            const rating = review.rating || 0;
                            let stars = '';
                            for (let j = 0; j < 5; j++) {
                                if (j < rating) {
                                    stars += '<i class="fas fa-star" style="color: #ffd700;"></i>';
                                } else {
                                    stars += '<i class="far fa-star" style="color: #ffd700;"></i>';
                                }
                            }
                            reviewHTML = '<div class="session-review"><div class="review-stars">' + stars + '</div>' + 
                                (review.comment ? '<p class="review-comment">' + review.comment.substring(0, 100) + (review.comment.length > 100 ? '...' : '') + '</p>' : '') + 
                                '</div>';
                        }
                        
                        html += '<div class="session-item completed" data-session-id="' + session._id + '">' +
                            '<div class="session-info">' +
                            '<h4>' + (session.skill?.title || 'Session') + '</h4>' +
                            '<p>' + (role === 'teacher' ? 'Taught to' : 'Learned from') + ' ' + otherPartyName + '</p>' +
                            '<div class="session-meta">' +
                            '<span class="session-date"><i class="fas fa-calendar"></i> ' + formatDate(completedDate) + '</span>' +
                            '<span class="session-duration"><i class="fas fa-clock"></i> ' + session.duration + ' minutes</span>' +
                            '</div>' + reviewHTML +
                            '</div>' +
                            '<div class="session-status">' +
                            '<span class="status-badge status-completed"><i class="fas fa-check-circle"></i> Completed</span>' +
                            '<div class="session-credits">' + (session.totalCredits || session.creditsPerHour || 0) + ' credits</div>' +
                            '</div>' +
                            '</div>';
                    }
                    sessionsList.innerHTML = html;
                    
                    // Add click handlers to show session details
                    const sessionItems = document.querySelectorAll('.session-item.completed');
                    for (let i = 0; i < sessionItems.length; i++) {
                        sessionItems[i].addEventListener('click', function() {
                            const sessionData = allCompletedSessions.find(s => s._id === this.dataset.sessionId);
                            if (sessionData) {
                                showCompletedSessionDetails(sessionData);
                            }
                        });
                    }
                    
                    // If we're showing limited sessions and there are more, show the "View All" button
                    const viewAllBtn = document.getElementById('view-all-completed-btn');
                    // Show "View All" button only if we have more sessions than the limit
                    if (limit && allCompletedSessions.length > limit && viewAllBtn) {
                        viewAllBtn.style.display = 'inline-block';
                    } else if (viewAllBtn) {
                        viewAllBtn.style.display = 'none';
                    }
                }
            } else {
                throw new Error(allSessionsResponse.message || 'Failed to load completed sessions');
            }
        } else {
            // Fallback when API client is not available
            sessionsList.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No completed sessions yet</p></div>';
        }
    } catch (error) {
        console.error('Error loading completed sessions:', error);
        sessionsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load completed sessions</p></div>';
    }
}

// Make functions globally available
window.loadDashboardData = loadDashboardData;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
// createDemoUser removed
window.acceptRequest = acceptRequest;
window.declineRequest = declineRequest;
window.updateNavigation = updateNavigation;
window.logout = logout;
window.updateSessionStatus = updateSessionStatus;
window.requestSessionCompletion = requestSessionCompletion;
window.confirmSessionCompletion = confirmSessionCompletion;
window.rejectSessionCompletion = rejectSessionCompletion;
// Ensure inline handlers on My Skills work
window.editSkill = editSkill;
window.deleteSkill = deleteSkill;
// Ensure inline handlers on My Skills work
window.editSkill = editSkill;
window.deleteSkill = deleteSkill;

// Handle rating form submission
async function handleRatingFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const sessionId = form.dataset.sessionId;
    const rating = form.querySelector('input[name="rating"]').value;
    const comment = form.querySelector('textarea[name="comment"]').value;
    
    if (!sessionId || !rating) {
        showToast('Please provide a rating', 'error');
        return;
    }
    
    try {
        if (window.apiClient && window.apiClient.post) {
            const response = await window.apiClient.post(`/sessions/${sessionId}/review`, { rating, comment });
            
            if (response.success) {
                showToast('Review submitted successfully', 'success');
                closeModal('session-review-modal');
                loadDashboardData();
            } else {
                throw new Error(response.message || 'Failed to submit review');
            }
        } else {
            // Fallback when API client is not available
            showToast('API client not available', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Failed to submit review', 'error');
    }
}

// Show all completed sessions in a modal
async function showAllCompletedSessions() {
    const modal = document.getElementById('all-completed-sessions-modal');
    const sessionsList = document.getElementById('all-completed-sessions-list');
    
    if (!modal || !sessionsList) {
        console.error('All completed sessions modal or list not found');
        return;
    }
    
    // Show loading state
    sessionsList.innerHTML = '<div class="loading">Loading all completed sessions...</div>';
    
    // Open the modal
    openModal('all-completed-sessions-modal');
    
    try {
        if (window.apiClient && window.apiClient.get) {
            // Load all completed sessions
            const response = await window.apiClient.get('/sessions?status=completed');
            
            if (response.success && response.data) {
                const completedSessions = response.data;
                console.log('All completed sessions loaded:', completedSessions);
                
                // Sort sessions by completion date (newest first)
                completedSessions.sort((a, b) => {
                    const dateA = new Date(a.completedAt || a.createdAt);
                    const dateB = new Date(b.completedAt || b.createdAt);
                    return dateB - dateA;
                });
                
                if (completedSessions.length === 0) {
                    sessionsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <p>No completed sessions yet</p>
                        </div>
                    `;
                } else {
                    sessionsList.innerHTML = completedSessions.map(session => {
                        // Determine if current user is student or teacher
                        let role = 'participant';
                        let otherPartyName = 'Unknown';
                        if (window.currentUser) {
                            // Normalize IDs to strings for comparison
                            const currentUserId = String(window.currentUser._id || window.currentUser.id);
                            const teacherId = String(session.teacher?._id || session.teacher);
                            const studentId = String(session.student?._id || session.student);
                            
                            if (teacherId === currentUserId) {
                                role = 'teacher';
                                otherPartyName = session.student?.name || 'Student';
                            } else if (studentId === currentUserId) {
                                role = 'student';
                                otherPartyName = session.teacher?.name || 'Teacher';
                            }
                        }
                        
                        const completedDate = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt);
                        
                        // Check if there's a review for this session
                        let reviewHTML = '';
                        if (session.reviews && session.reviews.length > 0) {
                            const review = session.reviews[0]; // Get the first review
                            const rating = review.rating || 0;
                            const stars = Array(5).fill(0).map((_, i) => 
                                i < rating ? '<i class="fas fa-star" style="color: #ffd700;"></i>' : '<i class="far fa-star" style="color: #ffd700;"></i>'
                            ).join('');
                            reviewHTML = '<div class="session-review"><div class="review-stars">' + stars + '</div>' + 
                                (review.comment ? '<p class="review-comment">' + review.comment.substring(0, 100) + (review.comment.length > 100 ? '...' : '') + '</p>' : '') + 
                                '</div>';
                        }
                        
                        return '<div class="session-item completed" data-session-id="' + session._id + '">' +
                            '<div class="session-info">' +
                            '<h4>' + (session.skill?.title || 'Session') + '</h4>' +
                            '<p>' + (role === 'teacher' ? 'Taught to' : 'Learned from') + ' ' + otherPartyName + '</p>' +
                            '<div class="session-meta">' +
                            '<span class="session-date"><i class="fas fa-calendar"></i> ' + formatDate(completedDate) + '</span>' +
                            '<span class="session-duration"><i class="fas fa-clock"></i> ' + session.duration + ' minutes</span>' +
                            '</div>' + reviewHTML +
                            '</div>' +
                            '<div class="session-status">' +
                            '<span class="status-badge status-completed"><i class="fas fa-check-circle"></i> Completed</span>' +
                            '<div class="session-credits">' + (session.totalCredits || session.creditsPerHour || 0) + ' credits</div>' +
                            '</div>' +
                            '</div>';
                    }).join('');
                    
                    // Add click handlers to show session details
                    document.querySelectorAll('.session-item.completed').forEach(item => {
                        item.addEventListener('click', function() {
                            const sessionData = completedSessions.find(s => s._id === this.dataset.sessionId);
                            if (sessionData) {
                                showCompletedSessionDetails(sessionData);
                            }
                        });
                    });
                }
            } else {
                throw new Error(response.message || 'Failed to load completed sessions');
            }
        } else {
            // Fallback when API client is not available
            sessionsList.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No completed sessions yet</p></div>';
        }
    } catch (error) {
        console.error('Error loading completed sessions:', error);
        sessionsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load completed sessions</p></div>';
    }
}

// Make functions globally available
window.loadDashboardData = loadDashboardData;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
// createDemoUser removed
window.acceptRequest = acceptRequest;
window.declineRequest = declineRequest;
window.updateNavigation = updateNavigation;
window.logout = logout;
window.updateSessionStatus = updateSessionStatus;
window.requestSessionCompletion = requestSessionCompletion;
window.confirmSessionCompletion = confirmSessionCompletion;
window.rejectSessionCompletion = rejectSessionCompletion;
// Ensure inline handlers on My Skills work
window.editSkill = editSkill;
window.deleteSkill = deleteSkill;

// Handle rating form submission
async function handleRatingFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const sessionId = form.dataset.sessionId;
    const rating = form.querySelector('input[name="rating"]').value;
    const comment = form.querySelector('textarea[name="comment"]').value;
    
    if (!sessionId || !rating) {
        showToast('Please provide a rating', 'error');
        return;
    }
    
    try {
        if (window.apiClient && window.apiClient.post) {
            const response = await window.apiClient.post(`/sessions/${sessionId}/review`, { rating, comment });
            
            if (response.success) {
                showToast('Review submitted successfully', 'success');
                closeModal('session-review-modal');
                loadDashboardData();
            } else {
                throw new Error(response.message || 'Failed to submit review');
            }
        } else {
            // Fallback when API client is not available
            showToast('API client not available', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Failed to submit review', 'error');
    }
}

// Show completed session details
function showCompletedSessionDetails(session) {
    const modal = document.getElementById('session-detail-modal');
    if (!modal) return;
    
    // Determine if current user is student or teacher
    let role = 'participant';
    let otherPartyName = 'Unknown';
    if (window.currentUser) {
        // Normalize IDs to strings for comparison
        const currentUserId = String(window.currentUser._id || window.currentUser.id);
        const teacherId = String(session.teacher?._id || session.teacher);
        const studentId = String(session.student?._id || session.student);
        
        if (teacherId === currentUserId) {
            role = 'teacher';
            otherPartyName = session.student?.name || 'Student';
        } else if (studentId === currentUserId) {
            role = 'student';
            otherPartyName = session.teacher?.name || 'Teacher';
        }
    }
    
    const completedDate = session.completedAt ? new Date(session.completedAt) : new Date(session.createdAt);
    
    // Update modal content
    const sessionInfo = modal.querySelector('#session-info');
    if (sessionInfo) {
        sessionInfo.innerHTML = `
            <div class="session-detail-content">
                <h3>${session.skill?.title || 'Session'}</h3>
                <div class="detail-row">
                    <strong>${role === 'teacher' ? 'Student' : 'Teacher'}:</strong>
                    <span>${otherPartyName}</span>
                </div>
                <div class="detail-row">
                    <strong>Completed:</strong>
                    <span>${formatDate(completedDate)} at ${completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="detail-row">
                    <strong>Duration:</strong>
                    <span>${session.duration} minutes</span>
                </div>
                <div class="detail-row">
                    <strong>Credits:</strong>
                    <span>${session.totalCredits || session.creditsPerHour || 0} credits ${role === 'teacher' ? 'earned' : 'spent'}</span>
                </div>
                <div class="detail-row">
                    <strong>Status:</strong>
                    <span class="status-badge status-completed"><i class="fas fa-check-circle"></i> Completed</span>
                </div>
                ${session.completionNotes?.teacher || session.completionNotes?.student ? `
                    <div class="detail-row">
                        <strong>Notes:</strong>
                        <p>${role === 'teacher' ? session.completionNotes.teacher : session.completionNotes.student}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Update action buttons - for completed sessions, only show close button
    const sessionActions = modal.querySelector('#session-actions');
    if (sessionActions) {
        sessionActions.innerHTML = `
            <button class="btn btn-outline" onclick="closeModal('session-detail-modal')">Close</button>
        `;
    }
    
    openModal('session-detail-modal');
}

// Load unread message count
async function loadMessageCount() {
    const messageCountBadge = document.getElementById('message-count');
    
    if (!messageCountBadge) {
        console.error('Message count badge not found');
        return;
    }

    try {
        if (window.apiClient && window.apiClient.get) {
            const response = await window.apiClient.get('/messages/unread-count');
            
            if (response.success && response.data) {
                const unreadCount = response.data.unreadCount || 0;
                console.log('Unread message count:', unreadCount);
                
                if (unreadCount > 0) {
                    messageCountBadge.textContent = unreadCount;
                    messageCountBadge.style.display = 'block';
                } else {
                    messageCountBadge.style.display = 'none';
                }
            } else {
                // Hide badge if API call fails
                messageCountBadge.style.display = 'none';
            }
        } else {
            // Fallback when API client is not available
            messageCountBadge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading message count:', error);
        // Hide badge if there's an error
        messageCountBadge.style.display = 'none';
    }
}

// Update notification badges (legacy function - kept for compatibility)
function updateNotificationBadges() {
    // This function is now replaced by loadMessageCount() and loadPendingRequests()
    // which handle their own badge updates
    console.log('updateNotificationBadges called - functionality moved to specific load functions');
}

// Update navigation based on authentication status
function updateNavigation(user = null) {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;
    
    // Preserve theme button
    const themeButton = navAuth.querySelector('#theme-btn');
    const themeButtonHTML = themeButton ? themeButton.outerHTML : '';
    
    // Use global auth state if available, only fallback to storage if we're not in a failed auth state
    const currentUser = user || (window.isLoggedIn !== false ? (window.currentUser || getUserFromStorage()) : null);
    const isLoggedIn = window.isLoggedIn !== undefined ? window.isLoggedIn : (currentUser && currentUser.email && currentUser.email !== 'test@example.com');
    
    console.log('Dashboard updateNavigation called with user:', currentUser, 'isLoggedIn:', isLoggedIn);
    
    if (isLoggedIn && currentUser) {
        navAuth.innerHTML = `
            ${themeButtonHTML}
            <div class="user-menu">
                <span class="user-name">${currentUser.name || currentUser.email || 'User'}</span>
                <button class="btn btn-outline btn-small" id="logout-btn">Logout</button>
            </div>
        `;
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        // Re-bind theme button
        if (themeButtonHTML && window.themeManager) {
            window.themeManager.bindEvents();
        }
    } else {
        navAuth.innerHTML = `
            ${themeButtonHTML}
            <button class="btn btn-outline" id="login-btn">Login</button>
            <button class="btn btn-primary" id="register-btn">Register</button>
        `;
        
        // Add login/register button functionality
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            });
        }
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                if (!window.location.pathname.includes('register.html')) {
                    window.location.href = 'register.html';
                }
            });
        }
        
        // Re-bind theme button
        if (themeButtonHTML && window.themeManager) {
            window.themeManager.bindEvents();
        }
    }
}

// Logout function
function logout() {
    // Clear all user data
    localStorage.removeItem('campusSkillSwapUser');
    localStorage.removeItem('userData');
    localStorage.removeItem('current_user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    
    // Clear global auth state
    window.currentUser = null;
    window.isLoggedIn = false;
    
    showToast('Logged out successfully', 'success');
    
    // Update navigation
    updateNavigation();
    
    // Redirect to homepage
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Load dashboard reviews
async function loadDashboardReviews() {
    const reviewsContainer = document.getElementById('dashboard-recent-reviews');

    if (!reviewsContainer) {
        console.error('Dashboard reviews container not found');
        return;
    }

    // Show loading state
    reviewsContainer.innerHTML = '<div class="loading">Loading recent reviews...</div>';

    try {
        if (window.apiClient && window.apiClient.get) {
            // Get recent reviews for the current user (both as reviewer and reviewee)
            const response = await window.apiClient.get('/reviews?limit=3');

            if (response.success && response.data) {
                const reviews = response.data;

                if (reviews.length === 0) {
                    reviewsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-star"></i>
                            <p>No reviews yet</p>
                            <small>Complete sessions to see reviews here</small>
                        </div>
                    `;
                } else {
                    reviewsContainer.innerHTML = reviews.map(review => {
                        const isReviewer = review.reviewer && review.reviewer._id === window.currentUser._id;
                        const otherParty = isReviewer ? (review.reviewee?.name || 'Student') : (review.reviewer?.name || 'Reviewer');
                        const reviewType = isReviewer ? 'Given' : 'Received';
                        const skillTitle = review.session?.skill?.title || 'Session';

                        return `
                            <div class="review-item">
                                <div class="review-header">
                                    <span class="review-type">${reviewType}</span>
                                    <div class="review-rating">
                                        ${Array(5).fill(0).map((_, i) =>
                                            `<i class="${i < (review.rating || 0) ? 'fas' : 'far'} fa-star"></i>`
                                        ).join('')}
                                    </div>
                                </div>
                                <p class="review-skill">${skillTitle} with ${otherParty}</p>
                                <p class="review-comment">${review.comment ? review.comment.substring(0, 80) + (review.comment.length > 80 ? '...' : '') : 'No comment'}</p>
                                <span class="review-date">${review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                            </div>
                        `;
                    }).join('');
                }
            } else {
                throw new Error(response.message || 'Failed to load reviews');
            }
        } else {
            // Fallback when API client is not available
            reviewsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>Reviews will appear here</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading dashboard reviews:', error);
        reviewsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load reviews</p>
            </div>
        `;
    }
}

// Make functions globally available
window.loadDashboardData = loadDashboardData;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
// createDemoUser removed
window.acceptRequest = acceptRequest;
window.declineRequest = declineRequest;
window.updateNavigation = updateNavigation;
window.logout = logout;
window.updateSessionStatus = updateSessionStatus;
window.requestSessionCompletion = requestSessionCompletion;
window.confirmSessionCompletion = confirmSessionCompletion;
window.rejectSessionCompletion = rejectSessionCompletion;
// Ensure inline handlers on My Skills work
window.editSkill = editSkill;
window.deleteSkill = deleteSkill;

// Handle rating form submission
async function handleRatingFormSubmit(e) {
    console.log('handleRatingFormSubmit called!');
    e.preventDefault();
    const sessionIdInput = document.getElementById('review-session-id');
    const ratingValue = document.getElementById('rating-value');
    const commentField = document.getElementById('review-comment');
    
    const sessionId = sessionIdInput ? sessionIdInput.value : null;
    const rating = ratingValue ? parseInt(ratingValue.value) : 0;
    const comment = commentField ? commentField.value.trim() : '';
    
    console.log('Form data:', { sessionId, rating, comment });
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        console.log('Rating validation failed:', rating);
        showToast('Please provide a rating before submitting', 'warning');
        return;
    }
    
    // Validate session ID
    if (!sessionId) {
        console.log('Session ID missing');
        showToast('Session information is missing', 'error');
        return;
    }
    
    // Collect detailed ratings
    const detailedRatings = {};
    document.querySelectorAll('.mini-rating').forEach(ratingGroup => {
        const category = ratingGroup.dataset.category;
        const value = parseInt(ratingGroup.dataset.value);
        if (value) {
            detailedRatings[category] = value;
        }
    });
    
    console.log('Detailed ratings:', detailedRatings);
    
    // Submit review
    try {
        if (window.apiClient && window.apiClient.post) {
            console.log('Submitting review to API...');
            const response = await window.apiClient.post('/reviews', {
                session: sessionId,
                rating: rating,
                comment: comment,
                detailedRatings: detailedRatings
            });
            
            console.log('API response:', response);
            
            if (response.success) {
                showToast('Thank you for your review!', 'success');
                closeModal('rating-review-modal');
                
                // Mark session as rated in sessionStorage
                sessionStorage.setItem(`rated_${sessionId}`, 'true');
                
                // Reset form
                const reviewForm = document.getElementById('rating-review-form');
                if (reviewForm) {
                    reviewForm.reset();
                }
                if (ratingValue) {
                    ratingValue.value = '';
                }
                
                // Reset all stars
                document.querySelectorAll('#rating-stars i, .mini-rating i').forEach(star => {
                    star.classList.remove('fas');
                    star.classList.add('far');
                });
                
                // Clear detailed ratings values
                document.querySelectorAll('.mini-rating').forEach(ratingGroup => {
                    ratingGroup.dataset.value = '';
                });
                
                // Reload dashboard data
                await loadCompletedSessions();
            } else {
                throw new Error(response.message || 'Failed to submit review');
            }
        } else {
            // Fallback
            console.log('API client not available, using fallback');
            showToast('Review submitted successfully!', 'success');
            closeModal('rating-review-modal');
            const reviewForm = document.getElementById('rating-review-form');
            if (reviewForm) {
                reviewForm.reset();
            }
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        
        // Handle specific error cases
        if (error.message && error.message.includes('Review already exists')) {
            showToast('You have already reviewed this session', 'info');
            closeModal('rating-review-modal');
            // Mark as rated so it doesn't prompt again
            sessionStorage.setItem(`rated_${sessionId}`, 'true');
        } else if (error.message && error.message.includes('Session not completed')) {
            showToast('This session has not been completed yet', 'warning');
        } else {
            showToast(error.message || 'Failed to submit review. Please try again.', 'error');
        }
    }
}

// Rating and Review Modal Functionality
function initializeRatingModal() {
    console.log('Initializing rating modal...');
    const ratingStars = document.querySelectorAll('#rating-stars i');
    const ratingValue = document.getElementById('rating-value');
    const reviewForm = document.getElementById('rating-review-form');
    const commentField = document.getElementById('review-comment');
    const commentCount = document.getElementById('comment-count');
    
    console.log('Rating modal elements:', {
        ratingStars: ratingStars.length,
        ratingValue: !!ratingValue,
        reviewForm: !!reviewForm,
        commentField: !!commentField,
        commentCount: !!commentCount
    });
    
    // Main rating stars
    ratingStars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            ratingValue.value = rating;
            
            // Update star display
            ratingStars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
        
        // Hover effect
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            ratingStars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('fas');
                    s.classList.remove('far');
                } else {
                    s.classList.add('far');
                    s.classList.remove('fas');
                }
            });
        });
    });
    
    // Reset on mouse leave
    const ratingContainer = document.getElementById('rating-stars');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', function() {
            const currentRating = parseInt(ratingValue.value) || 0;
            ratingStars.forEach((s, i) => {
                if (i < currentRating) {
                    s.classList.add('fas');
                    s.classList.remove('far');
                } else {
                    s.classList.add('far');
                    s.classList.remove('fas');
                }
            });
        });
    }
    
    // Detailed ratings
    document.querySelectorAll('.mini-rating').forEach(ratingGroup => {
        const stars = ratingGroup.querySelectorAll('i');
        const category = ratingGroup.dataset.category;
        
        stars.forEach((star) => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                
                // Update star display for this category
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
                
                // Store the rating value (you can store in hidden inputs if needed)
                ratingGroup.dataset.value = rating;
            });
        });
    });
    
    // Character counter
    if (commentField && commentCount) {
        commentField.addEventListener('input', function() {
            commentCount.textContent = this.value.length;
        });
    }
    
    // Form submission
    if (reviewForm) {
        console.log('Rating form event listener being attached');
        // Remove any existing listeners
        reviewForm.onsubmit = null;
        // Add new listener
        reviewForm.addEventListener('submit', handleRatingFormSubmit);
        console.log('Submit event listener attached successfully');
        
        // Also add click listener to submit button as backup
        const submitButton = reviewForm.querySelector('button[type="submit"]');
        if (submitButton) {
            console.log('Submit button found, adding click listener');
            submitButton.addEventListener('click', function(e) {
                console.log('Submit button clicked!');
                // Check if form validation passes
                if (reviewForm.checkValidity()) {
                    e.preventDefault();
                    handleRatingFormSubmit(e);
                } else {
                    console.log('Form validation failed');
                }
            });
        } else {
            console.error('Submit button not found!');
        }
    } else {
        console.error('Review form not found!');
    }
}

// Show rating modal for a specific session
function showRatingModal(sessionId) {
    console.log('showRatingModal called with sessionId:', sessionId);
    
    // Check if already rated in sessionStorage
    if (sessionStorage.getItem(`rated_${sessionId}`)) {
        console.log('Session already rated (sessionStorage):', sessionId);
        showToast('You have already reviewed this session', 'info');
        return;
    }
    
    // Check if review exists via API
    if (window.apiClient && window.apiClient.get) {
        window.apiClient.get(`/reviews?session=${sessionId}`)
            .then(response => {
                if (response.success && response.data && response.data.length > 0) {
                    // Review already exists
                    console.log('Review already exists for session:', sessionId);
                    sessionStorage.setItem(`rated_${sessionId}`, 'true');
                    showToast('You have already reviewed this session', 'info');
                    return;
                }
                // No review exists, proceed to show modal
                openRatingModalUI(sessionId);
            })
            .catch(error => {
                console.error('Error checking for existing review:', error);
                // Proceed anyway if check fails
                openRatingModalUI(sessionId);
            });
    } else {
        // API not available, proceed to show modal
        openRatingModalUI(sessionId);
    }
}

function openRatingModalUI(sessionId) {
    console.log('Opening rating modal UI for session:', sessionId);
    
    const sessionIdInput = document.getElementById('review-session-id');
    if (sessionIdInput) {
        sessionIdInput.value = sessionId;
        console.log('Session ID set to:', sessionId);
    } else {
        console.error('review-session-id input not found!');
    }
    
    // Reset form
    const reviewForm = document.getElementById('rating-review-form');
    if (reviewForm) {
        reviewForm.reset();
        console.log('Form reset');
        
        // Re-attach submit event listener to ensure it's not lost
        const existingListener = reviewForm.onsubmit;
        console.log('Existing form.onsubmit:', existingListener);
        
        // Remove old listener if exists and add new one
        reviewForm.onsubmit = null;
        reviewForm.addEventListener('submit', handleRatingFormSubmit);
        console.log('Submit event listener attached');
    } else {
        console.error('rating-review-form not found!');
    }
    
    // Reset rating value
    const ratingValue = document.getElementById('rating-value');
    if (ratingValue) {
        ratingValue.value = '';
    }
    
    // Reset all stars
    document.querySelectorAll('#rating-stars i, .mini-rating i').forEach(star => {
        star.classList.remove('fas');
        star.classList.add('far');
    });
    
    // Clear detailed ratings values
    document.querySelectorAll('.mini-rating').forEach(ratingGroup => {
        ratingGroup.dataset.value = '';
    });
    
    // Open modal
    openModal('rating-review-modal');
}

// Check URL for rating request on page load
function checkForRatingRequest() {
    const urlParams = new URLSearchParams(window.location.search);
    const rateSessionId = urlParams.get('rateSession');
    
    if (rateSessionId) {
        // Wait for page to load completely before showing modal
        setTimeout(() => {
            showRatingModal(rateSessionId);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 1000);
    }
}

// Initialize rating modal when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeRatingModal();
        checkForRatingRequest();
    });
} else {
    initializeRatingModal();
    checkForRatingRequest();
}

// Make functions globally available
// Make functions globally available
if (typeof window !== 'undefined') {
  window.showRatingModal = showRatingModal;
}
