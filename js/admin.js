// Jury AI Admin Panel JavaScript

// Disable right-click context menu and keyboard shortcuts for security
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+P
    if (e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
        (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 65 || e.keyCode === 80))) {
        e.preventDefault();
        return false;
    }
});

// Global Variables
let currentTab = 'dashboard';
let sidebarCollapsed = false;
let charts = {};
let adminData = {
    users: [],
    lawyers: [],
    chatSessions: [],
    communityPosts: [],
    documents: [],
    analytics: {}
};

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    loadDashboardData();
    initializeCharts();
    setupEventListeners();
    startRealTimeUpdates();
    checkAdminAuthentication();
});

// Admin Authentication Check
function checkAdminAuthentication() {
    const adminToken = localStorage.getItem('adminToken');
    const adminEmail = localStorage.getItem('adminEmail');
    
    if (!adminToken || !adminEmail) {
        showLoginModal();
        return false;
    }
    
    // Validate token (in real app, this would be server-side)
    if (!validateAdminToken(adminToken)) {
        logout();
        return false;
    }
    
    return true;
}

function validateAdminToken(token) {
    // Simple token validation (implement proper JWT validation in production)
    try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        return tokenData.exp > Date.now() / 1000 && tokenData.role === 'admin';
    } catch (e) {
        return false;
    }
}

// Initialize Admin Panel
function initializeAdminPanel() {
    console.log('🚀 Initializing Jury AI Admin Panel');
    
    // Set initial active states
    document.querySelector('[data-tab="dashboard"]').classList.add('active');
    document.getElementById('dashboard').classList.add('active');
    
    // Update page title
    updatePageTitle('Dashboard');
    
    // Show welcome message
    setTimeout(() => {
        showNotification('Welcome to Jury AI Admin Panel', 'success');
    }, 1000);
}

// Setup Event Listeners
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Tab navigation
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    navLinks.forEach(link => {
        link.addEventListener('click', handleTabClick);
    });
    
    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotifications);
    }
    
    // Search functionality
    setupSearchListeners();
    
    // Form submissions
    setupFormListeners();
    
    // Window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        localStorage.setItem('sidebarCollapsed', 'true');
    } else {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
    }
    
    // Trigger chart resize after animation
    setTimeout(() => {
        Object.values(charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }, 300);
}

// Handle Tab Click
function handleTabClick(e) {
    e.preventDefault();
    const tabId = e.currentTarget.getAttribute('data-tab');
    switchTab(tabId);
}

// Switch Tab
function switchTab(tabId) {
    if (tabId === currentTab) return;
    
    // Remove active classes
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active classes
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    // Update current tab
    currentTab = tabId;
    
    // Update page title
    updatePageTitle(getTabTitle(tabId));
    
    // Load tab-specific data
    loadTabData(tabId);
    
    // Update URL hash
    window.history.replaceState(null, null, `#${tabId}`);
}

// Get Tab Title
function getTabTitle(tabId) {
    const titles = {
        dashboard: 'Dashboard',
        users: 'User Management',
        lawyers: 'Lawyer Management',
        chat: 'Chat Monitoring',
        community: 'Community Posts',
        templates: 'Template Management',
        documents: 'Document Analysis',
        analytics: 'Analytics',
        settings: 'Settings'
    };
    return titles[tabId] || 'Dashboard';
}

// Update Page Title
function updatePageTitle(title) {
    document.querySelector('.page-title').textContent = title;
    document.title = `${title} - Jury AI Admin`;
}

// Load Tab Data
function loadTabData(tabId) {
    showLoadingSpinner(true);
    
    switch (tabId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'lawyers':
            loadLawyersData();
            break;
        case 'chat':
            loadChatData();
            break;
        case 'community':
            loadCommunityData();
            break;
        case 'templates':
            loadTemplatesData();
            break;
        case 'documents':
            loadDocumentsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
    
    setTimeout(() => showLoadingSpinner(false), 500);
}

// Load Dashboard Data
function loadDashboardData() {
    // Simulate API calls
    setTimeout(() => {
        updateStatsCards();
        updateActivityTimeline();
        if (charts.activity) updateActivityChart();
        if (charts.service) updateServiceChart();
    }, 300);
}

// Update Stats Cards
function updateStatsCards() {
    const stats = {
        totalUsers: Math.floor(Math.random() * 3000) + 2000,
        activeLawyers: Math.floor(Math.random() * 500) + 300,
        chatSessions: Math.floor(Math.random() * 20000) + 15000,
        documentsAnalyzed: Math.floor(Math.random() * 10000) + 8000
    };
    
    // Animate counter updates
    animateCounter('.stats-card:nth-child(1) .stats-number', stats.totalUsers);
    animateCounter('.stats-card:nth-child(2) .stats-number', stats.activeLawyers);
    animateCounter('.stats-card:nth-child(3) .stats-number', stats.chatSessions);
    animateCounter('.stats-card:nth-child(4) .stats-number', stats.documentsAnalyzed);
}

// Animate Counter
function animateCounter(selector, targetValue) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutCubic(progress));
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Easing function
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Update Activity Timeline
function updateActivityTimeline() {
    const activities = [
        {
            icon: 'fas fa-user-plus',
            iconClass: 'bg-success',
            title: 'New User Registration',
            description: `${getRandomName()} registered as a new user`,
            time: '2 minutes ago'
        },
        {
            icon: 'fas fa-file-upload',
            iconClass: 'bg-primary',
            title: 'Document Analyzed',
            description: `Contract analysis completed for ${getRandomEmail()}`,
            time: '15 minutes ago'
        },
        {
            icon: 'fas fa-exclamation-triangle',
            iconClass: 'bg-warning',
            title: 'System Alert',
            description: 'High server load detected',
            time: '1 hour ago'
        },
        {
            icon: 'fas fa-user-tie',
            iconClass: 'bg-info',
            title: 'Lawyer Verification',
            description: `${getRandomName()} completed lawyer verification`,
            time: '2 hours ago'
        }
    ];
    
    const timeline = document.querySelector('.activity-timeline');
    if (timeline) {
        timeline.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.iconClass}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h6>${activity.title}</h6>
                    <p>${activity.description}</p>
                    <small class="text-muted">${activity.time}</small>
                </div>
            </div>
        `).join('');
    }
}

// Initialize Charts
function initializeCharts() {
    initializeActivityChart();
    initializeServiceChart();
    initializeUserGrowthChart();
    initializePerformanceChart();
}

// Initialize Activity Chart
function initializeActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    charts.activity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Active Users',
                data: [1200, 1900, 3000, 5000, 2300, 3200],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#1e3a8a',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

// Initialize Service Chart
function initializeServiceChart() {
    const ctx = document.getElementById('serviceChart');
    if (!ctx) return;
    
    charts.service = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Chat AI', 'Document Analysis', 'Templates', 'Legal Info'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Initialize User Growth Chart
function initializeUserGrowthChart() {
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;
    
    charts.userGrowth = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'New Users',
                data: [120, 190, 300, 500, 230, 320],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Initialize Performance Chart
function initializePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    charts.performance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Response Time', 'Accuracy', 'User Satisfaction', 'Uptime', 'Security'],
            datasets: [{
                label: 'Performance Metrics',
                data: [85, 92, 88, 95, 90],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#1e3a8a',
                pointBorderColor: '#3b82f6',
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// Load Users Data
function loadUsersData() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    
    // Generate sample user data
    const users = generateSampleUsers(10);
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge bg-primary">${user.role}</span></td>
            <td><span class="badge ${user.status === 'Active' ? 'bg-success' : 'bg-danger'}">${user.status}</span></td>
            <td>${user.registered}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Generate Sample Users
function generateSampleUsers(count) {
    const users = [];
    for (let i = 1; i <= count; i++) {
        users.push({
            id: String(i).padStart(3, '0'),
            name: getRandomName(),
            email: getRandomEmail(),
            role: Math.random() > 0.8 ? 'Lawyer' : 'User',
            status: Math.random() > 0.1 ? 'Active' : 'Inactive',
            registered: getRandomDate()
        });
    }
    return users;
}

// Utility Functions
function getRandomName() {
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Anna', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function getRandomEmail() {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'juryai.com'];
    const username = Math.random().toString(36).substring(7);
    return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function getRandomDate() {
    const start = new Date(2024, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}

// User Management Functions
function editUser(userId) {
    showNotification(`Editing user ${userId}`, 'info');
    // Implement user edit functionality
}

function deleteUser(userId) {
    if (confirm(`Are you sure you want to delete user ${userId}?`)) {
        showNotification(`User ${userId} deleted successfully`, 'success');
        loadUsersData(); // Refresh the table
    }
}

// Notification System
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Show Notifications Panel
function showNotifications() {
    const notifications = [
        { message: 'New user registered', time: '2 min ago', type: 'success' },
        { message: 'System backup completed', time: '1 hour ago', type: 'info' },
        { message: 'High server load detected', time: '2 hours ago', type: 'warning' },
        { message: 'Database maintenance scheduled', time: '1 day ago', type: 'info' },
        { message: 'Security scan completed', time: '2 days ago', type: 'success' }
    ];
    
    // Create notification modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Notifications</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${notifications.map(notif => `
                        <div class="alert alert-${notif.type} d-flex justify-content-between align-items-center">
                            <span>${notif.message}</span>
                            <small class="text-muted">${notif.time}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    new bootstrap.Modal(modal).show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

// Loading Spinner
function showLoadingSpinner(show) {
    let spinner = document.getElementById('loadingSpinner');
    
    if (show && !spinner) {
        spinner = document.createElement('div');
        spinner.id = 'loadingSpinner';
        spinner.className = 'position-fixed top-50 start-50 translate-middle';
        spinner.style.zIndex = '9999';
        spinner.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
        document.body.appendChild(spinner);
    } else if (!show && spinner) {
        spinner.remove();
    }
}

// Search Functionality
function setupSearchListeners() {
    // Add search functionality for tables
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('table-search')) {
            filterTable(e.target);
        }
    });
}

function filterTable(searchInput) {
    const table = searchInput.closest('.card').querySelector('table tbody');
    const searchTerm = searchInput.value.toLowerCase();
    
    Array.from(table.rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Form Listeners
function setupFormListeners() {
    document.addEventListener('submit', (e) => {
        if (e.target.tagName === 'FORM') {
            e.preventDefault();
            handleFormSubmission(e.target);
        }
    });
}

function handleFormSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    showNotification('Settings saved successfully!', 'success');
    console.log('Form data:', data);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    // Alt + number keys for tab switching
    if (e.altKey && e.keyCode >= 49 && e.keyCode <= 57) {
        const tabIndex = e.keyCode - 49;
        const tabs = ['dashboard', 'users', 'lawyers', 'chat', 'community', 'templates', 'documents', 'analytics', 'settings'];
        if (tabs[tabIndex]) {
            switchTab(tabs[tabIndex]);
        }
    }
}

// Window Resize Handler
function handleWindowResize() {
    // Auto-collapse sidebar on mobile
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('collapsed');
        sidebarCollapsed = true;
    }
    
    // Resize charts
    Object.values(charts).forEach(chart => {
        if (chart && chart.resize) {
            chart.resize();
        }
    });
}

// Real-time Updates
function startRealTimeUpdates() {
    setInterval(() => {
        if (currentTab === 'dashboard') {
            updateStatsCards();
            updateActivityTimeline();
        }
    }, 30000); // Update every 30 seconds
}

// Logout Function
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminData');
    
    showNotification('Logged out successfully', 'success');
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Login Modal
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('data-bs-backdrop', 'static');
    modal.innerHTML = `
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Admin Login Required</h5>
                </div>
                <div class="modal-body">
                    <form id="adminLoginForm">
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Login</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        // Simple authentication (implement proper authentication in production)
        if (email === 'admin@juryai.com' && password === 'admin123') {
            const token = generateToken();
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminEmail', email);
            
            modalInstance.hide();
            modal.remove();
            showNotification('Login successful!', 'success');
        } else {
            showNotification('Invalid credentials', 'danger');
        }
    });
}

function generateToken() {
    const payload = {
        email: 'admin@juryai.com',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };
    
    return 'header.' + btoa(JSON.stringify(payload)) + '.signature';
}

// Placeholder functions for other tabs
function loadLawyersData() {
    console.log('Loading lawyers data...');
}

function loadChatData() {
    console.log('Loading chat data...');
}

function loadCommunityData() {
    console.log('Loading community data...');
}

function loadTemplatesData() {
    console.log('Loading templates data...');
}

function loadDocumentsData() {
    console.log('Loading documents data...');
}

function loadAnalyticsData() {
    console.log('Loading analytics data...');
}

function loadSettingsData() {
    console.log('Loading settings data...');
}

// Export functions for use in other modules
window.AdminPanel = {
    switchTab,
    showNotification,
    logout,
    editUser,
    deleteUser
};

// console.log('✅ Jury AI Admin Panel JavaScript loaded successfully');