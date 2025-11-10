// Campus SkillSwap - Ledger JavaScript
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

// Ledger page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('features.html')) {
        initializeLedgerFeatures();
    }
});

function initializeLedgerFeatures() {
    // Initialize ledger components
    initializeCreditsDisplay();
    initializeSkillsManagement();
    initializeTransactionHistory();
    initializeMessagesSystem();
    initializeEarnSpendButtons();
    
    // Load ledger data
    loadLedgerData();
}

function initializeCreditsDisplay() {
    const creditsElement = document.getElementById('credits');
    const earnBtn = document.getElementById('earnBtn');
    const spendBtn = document.getElementById('spendBtn');
    
    if (earnBtn) {
        earnBtn.addEventListener('click', handleEarnCredits);
    }
    
    if (spendBtn) {
        spendBtn.addEventListener('click', handleSpendCredits);
    }
    
    // Update credits display
    updateCreditsDisplay();
}

function initializeSkillsManagement() {
    const addSkillForm = document.getElementById('addSkillForm');
    const skillsList = document.getElementById('skillsList');
    
    if (addSkillForm) {
        addSkillForm.addEventListener('submit', handleAddSkill);
    }
    
    // Load existing skills
    loadSkillsList();
}

function initializeTransactionHistory() {
    const txnBody = document.getElementById('txnBody');
    
    if (txnBody) {
        loadTransactionHistory();
    }
}

function initializeMessagesSystem() {
    const conversationList = document.getElementById('conversationList');
    const newConversationForm = document.getElementById('newConversationForm');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    
    if (newConversationForm) {
        newConversationForm.addEventListener('submit', handleNewConversation);
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
    
    // Load conversations
    loadConversations();
}

function initializeEarnSpendButtons() {
    // Additional earn/spend functionality can be added here
    console.log('Earn/Spend buttons initialized');
}

function loadLedgerData() {
    // Load user data from localStorage or API
    const user = window.CampusSkillSwap ? window.CampusSkillSwap.currentUser() : null;
    
    if (user) {
        updateCreditsDisplay(user.credits || 0);
    } else {
        // Default values for demo
        updateCreditsDisplay(5);
    }
}

function updateCreditsDisplay(credits = null) {
    const creditsElement = document.getElementById('credits');
    if (!creditsElement) return;
    
    if (credits === null) {
        // Get credits from localStorage
        const savedCredits = localStorage.getItem('ledgerCredits');
        credits = savedCredits ? parseInt(savedCredits) : 5;
    }
    
    creditsElement.textContent = credits;
    
    // Save to localStorage
    localStorage.setItem('ledgerCredits', credits.toString());
    
    // Update user object if available
    const user = window.CampusSkillSwap ? window.CampusSkillSwap.currentUser() : null;
    if (user) {
        user.credits = credits;
        localStorage.setItem('campusSkillSwapUser', JSON.stringify(user));
    }
}

function handleEarnCredits() {
    const currentCredits = parseInt(document.getElementById('credits').textContent);
    const newCredits = currentCredits + 1;
    
    updateCreditsDisplay(newCredits);
    
    // Add transaction record
    addTransaction({
        type: 'earned',
        amount: 1,
        skill: 'Teaching Session',
        with: 'Student',
        date: formatDate(new Date())
    });
    
    showToast('Earned 1 credit!', 'success');
}

function handleSpendCredits() {
    const currentCredits = parseInt(document.getElementById('credits').textContent);
    
    if (currentCredits <= 0) {
        showToast('Not enough credits!', 'error');
        return;
    }
    
    const newCredits = currentCredits - 1;
    updateCreditsDisplay(newCredits);
    
    // Add transaction record
    addTransaction({
        type: 'spent',
        amount: -1,
        skill: 'Learning Session',
        with: 'Teacher',
        date: formatDate(new Date())
    });
    
    showToast('Spent 1 credit!', 'info');
}

function handleAddSkill(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const skillTitle = formData.get('skillTitle') || document.getElementById('skillTitle').value;
    const skillCategory = formData.get('skillCategory') || document.getElementById('skillCategory').value;
    
    if (!skillTitle.trim()) {
        showToast('Please enter a skill title', 'error');
        return;
    }
    
    // Add skill to list
    addSkillToList({
        title: skillTitle.trim(),
        category: skillCategory
    });
    
    // Clear form
    e.target.reset();
    document.getElementById('skillTitle').value = '';
    
    showToast('Skill added successfully!', 'success');
}

function addSkillToList(skill) {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    
    // Create skill element
    const skillElement = document.createElement('li');
    skillElement.className = 'skill-pill';
    skillElement.innerHTML = `
        <span class="skill-title">${skill.title}</span>
        <span class="skill-category">${skill.category}</span>
        <button class="remove-skill" onclick="removeSkill(this)">×</button>
    `;
    
    skillsList.appendChild(skillElement);
    
    // Save to localStorage
    saveSkillsToStorage();
}

function removeSkill(button) {
    const skillElement = button.closest('.skill-pill');
    if (skillElement) {
        skillElement.remove();
        saveSkillsToStorage();
        showToast('Skill removed', 'info');
    }
}

function loadSkillsList() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    
    // Load from localStorage
    const savedSkills = localStorage.getItem('ledgerSkills');
    if (savedSkills) {
        try {
            const skills = JSON.parse(savedSkills);
            skills.forEach(skill => {
                const skillElement = document.createElement('li');
                skillElement.className = 'skill-pill';
                skillElement.innerHTML = `
                    <span class="skill-title">${skill.title}</span>
                    <span class="skill-category">${skill.category}</span>
                    <button class="remove-skill" onclick="removeSkill(this)">×</button>
                `;
                skillsList.appendChild(skillElement);
            });
        } catch (e) {
            console.error('Error loading skills:', e);
        }
    } else {
        // Add default skills
        const defaultSkills = [
            { title: 'Python Programming', category: 'Tech' },
            { title: 'Guitar Basics', category: 'Arts' },
            { title: 'Digital Art', category: 'Arts' }
        ];
        
        defaultSkills.forEach(skill => {
            addSkillToList(skill);
        });
    }
}

function saveSkillsToStorage() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    
    const skills = Array.from(skillsList.children).map(skillElement => ({
        title: skillElement.querySelector('.skill-title').textContent,
        category: skillElement.querySelector('.skill-category').textContent
    }));
    
    localStorage.setItem('ledgerSkills', JSON.stringify(skills));
}

function loadTransactionHistory() {
    const txnBody = document.getElementById('txnBody');
    if (!txnBody) return;
    
    // Load from localStorage
    const savedTransactions = localStorage.getItem('ledgerTransactions');
    let transactions = [];
    
    if (savedTransactions) {
        try {
            transactions = JSON.parse(savedTransactions);
        } catch (e) {
            console.error('Error loading transactions:', e);
        }
    }
    
    // Add default transactions if none exist
    if (transactions.length === 0) {
        transactions = [
            {
                date: '2024-01-15',
                type: 'earned',
                amount: 2,
                skill: 'Python Programming',
                with: 'Rajesh K.'
            },
            {
                date: '2024-01-14',
                type: 'spent',
                amount: -1,
                skill: 'Guitar Lessons',
                with: 'Priya M.'
            },
            {
                date: '2024-01-13',
                type: 'earned',
                amount: 1,
                skill: 'Digital Art',
                with: 'Meera K.'
            }
        ];
        localStorage.setItem('ledgerTransactions', JSON.stringify(transactions));
    }
    
    // Render transactions
    renderTransactions(transactions);
}

function renderTransactions(transactions) {
    const txnBody = document.getElementById('txnBody');
    if (!txnBody) return;
    
    txnBody.innerHTML = transactions.map(txn => `
        <tr>
            <td>${txn.date}</td>
            <td>
                <span class="txn-type ${txn.type}">
                    ${txn.type === 'earned' ? 'Earned' : 'Spent'}
                </span>
            </td>
            <td>${txn.with}</td>
            <td>${txn.skill}</td>
            <td class="${txn.amount > 0 ? 'positive' : 'negative'}">
                ${txn.amount > 0 ? '+' : ''}${txn.amount}
            </td>
        </tr>
    `).join('');
}

function addTransaction(transaction) {
    const savedTransactions = localStorage.getItem('ledgerTransactions');
    let transactions = [];
    
    if (savedTransactions) {
        try {
            transactions = JSON.parse(savedTransactions);
        } catch (e) {
            console.error('Error loading transactions:', e);
        }
    }
    
    // Add new transaction
    transactions.unshift(transaction);
    
    // Keep only last 50 transactions
    if (transactions.length > 50) {
        transactions = transactions.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('ledgerTransactions', JSON.stringify(transactions));
    
    // Re-render transactions
    renderTransactions(transactions);
}

function loadConversations() {
    const conversationList = document.getElementById('conversationList');
    if (!conversationList) return;
    
    // Mock conversations
    const conversations = [
        {
            id: 1,
            name: 'Rajesh Kumar',
            lastMessage: 'Thanks for the Python session!',
            time: '2 hours ago',
            unread: 0
        },
        {
            id: 2,
            name: 'Priya Menon',
            lastMessage: 'Can we schedule guitar lessons?',
            time: '1 day ago',
            unread: 2
        },
        {
            id: 3,
            name: 'Vikram Nair',
            lastMessage: 'Great job on the GATE prep!',
            time: '3 days ago',
            unread: 0
        }
    ];
    
    conversationList.innerHTML = conversations.map(conv => `
        <li class="conversation-item ${conv.unread > 0 ? 'unread' : ''}" data-conversation-id="${conv.id}">
            <div class="conversation-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="conversation-info">
                <div class="conversation-name">${conv.name}</div>
                <div class="conversation-last-message">${conv.lastMessage}</div>
                <div class="conversation-time">${conv.time}</div>
            </div>
            ${conv.unread > 0 ? `<div class="unread-badge">${conv.unread}</div>` : ''}
        </li>
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
    if (conversations.length > 0) {
        loadConversation(conversations[0].id);
        conversationList.querySelector('.conversation-item').classList.add('active');
    }
}

function loadConversation(conversationId) {
    const threadHeader = document.getElementById('threadHeader');
    const threadBody = document.getElementById('threadBody');
    const messageForm = document.getElementById('messageForm');
    
    // Mock conversation data
    const conversations = {
        1: {
            name: 'Rajesh Kumar',
            messages: [
                { sender: 'them', message: 'Hi! Are you available for Python tutoring?', time: '2 hours ago' },
                { sender: 'me', message: 'Yes, I can help with Python basics', time: '2 hours ago' },
                { sender: 'them', message: 'Great! When can we meet?', time: '2 hours ago' },
                { sender: 'me', message: 'How about tomorrow at 2 PM?', time: '1 hour ago' },
                { sender: 'them', message: 'Perfect! Thanks for the session!', time: '30 minutes ago' }
            ]
        },
        2: {
            name: 'Priya Menon',
            messages: [
                { sender: 'them', message: 'I heard you teach guitar?', time: '1 day ago' },
                { sender: 'me', message: 'Yes, I teach guitar basics', time: '1 day ago' },
                { sender: 'them', message: 'Can we schedule guitar lessons?', time: '1 day ago' }
            ]
        },
        3: {
            name: 'Vikram Nair',
            messages: [
                { sender: 'them', message: 'Thanks for the GATE preparation help!', time: '3 days ago' },
                { sender: 'me', message: 'You\'re welcome! How did the exam go?', time: '3 days ago' },
                { sender: 'them', message: 'Great job on the GATE prep!', time: '3 days ago' }
            ]
        }
    };
    
    const conversation = conversations[conversationId];
    if (!conversation) return;
    
    // Update header
    if (threadHeader) {
        threadHeader.textContent = conversation.name;
    }
    
    // Update messages
    if (threadBody) {
        threadBody.innerHTML = conversation.messages.map(msg => `
            <div class="message ${msg.sender === 'me' ? 'message-sent' : 'message-received'}">
                <div class="message-content">${msg.message}</div>
                <div class="message-time">${msg.time}</div>
            </div>
        `).join('');
        
        // Scroll to bottom
        threadBody.scrollTop = threadBody.scrollHeight;
    }
    
    // Show message form
    if (messageForm) {
        messageForm.style.display = 'flex';
    }
}

function handleNewConversation(e) {
    e.preventDefault();
    
    const recipientInput = document.getElementById('newRecipient');
    const recipientName = recipientInput.value.trim();
    
    if (!recipientName) {
        showToast('Please enter a recipient name', 'error');
        return;
    }
    
    // Add new conversation
    const conversationList = document.getElementById('conversationList');
    const newConversation = document.createElement('li');
    newConversation.className = 'conversation-item';
    newConversation.dataset.conversationId = Date.now();
    newConversation.innerHTML = `
        <div class="conversation-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="conversation-info">
            <div class="conversation-name">${recipientName}</div>
            <div class="conversation-last-message">No messages yet</div>
            <div class="conversation-time">Just now</div>
        </div>
    `;
    
    conversationList.appendChild(newConversation);
    
    // Clear input
    recipientInput.value = '';
    
    // Load the new conversation
    loadConversation(newConversation.dataset.conversationId);
    
    // Update active state
    conversationList.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
    newConversation.classList.add('active');
    
    showToast(`Started conversation with ${recipientName}`, 'success');
}

function handleSendMessage(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const threadBody = document.getElementById('threadBody');
    
    if (!messageInput || !messageInput.value.trim()) return;
    
    const message = messageInput.value.trim();
    
    // Add message to thread
    if (threadBody) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-sent';
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">Just now</div>
        `;
        
        threadBody.appendChild(messageElement);
        threadBody.scrollTop = threadBody.scrollHeight;
    }
    
    // Clear input
    messageInput.value = '';
    
    // Show success message
    showToast('Message sent!', 'success');
}

// Additional ledger utilities
function initializeLedgerAnimations() {
    // Add smooth animations for credit changes
    const creditsElement = document.getElementById('credits');
    if (creditsElement) {
        creditsElement.style.transition = 'all 0.3s ease';
    }
}

function initializeLedgerKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + E to earn credits
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            handleEarnCredits();
        }
        
        // Ctrl/Cmd + S to spend credits
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSpendCredits();
        }
    });
}

function initializeLedgerDataExport() {
    // Add export functionality
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline btn-small';
    exportBtn.textContent = 'Export Data';
    exportBtn.style.marginTop = '1rem';
    
    exportBtn.addEventListener('click', exportLedgerData);
    
    // Add to balance panel
    const balancePanel = document.querySelector('.panel.balance');
    if (balancePanel) {
        balancePanel.appendChild(exportBtn);
    }
}

function exportLedgerData() {
    const credits = document.getElementById('credits').textContent;
    const skills = JSON.parse(localStorage.getItem('ledgerSkills') || '[]');
    const transactions = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    
    const exportData = {
        credits: parseInt(credits),
        skills: skills,
        transactions: transactions,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `campus-skillswap-ledger-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Ledger data exported!', 'success');
}

// Initialize all ledger features
function initializeLedgerFeatures() {
    initializeCreditsDisplay();
    initializeSkillsManagement();
    initializeTransactionHistory();
    initializeMessagesSystem();
    initializeEarnSpendButtons();
    initializeLedgerAnimations();
    initializeLedgerKeyboardShortcuts();
    initializeLedgerDataExport();
    
    loadLedgerData();
}

// Export functions for global access
window.LedgerFunctions = {
    handleEarnCredits,
    handleSpendCredits,
    handleAddSkill,
    removeSkill,
    loadConversation,
    handleNewConversation,
    handleSendMessage,
    addTransaction,
    exportLedgerData
};

