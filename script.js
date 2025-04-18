/**
 * CampusMess - Main JavaScript File
 * Handles navigation, authentication, and interactive features
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initAuthModals();
    initLocationFeatures();
    initDistanceFilter();
    initMapInteraction();
    initSpecialOffers();
});

/**
 * Navigation between tabs
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav a');
    
    // Handle navigation click events
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default if it's an internal page
            const href = this.getAttribute('href');
            if (href && (href === '#' || href.startsWith('#'))) {
                e.preventDefault();
            }
            
            // Remove active class from all links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // If it's a page tab, simulate page change
            if (href && !href.startsWith('#') && href !== '#') {
                // Save current active tab in session storage
                sessionStorage.setItem('activeTab', href);
                
                // Simulate page loading
                document.body.style.opacity = '0.5';
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
    
    // Check for active tab on page load
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
    
    // Restore active tab from session storage if available
    const storedTab = sessionStorage.getItem('activeTab');
    if (storedTab) {
        navLinks.forEach(link => {
            if (link.getAttribute('href') === storedTab) {
                link.classList.add('active');
            }
        });
    }
}

/**
 * Authentication Modal Handling
 */
function initAuthModals() {
    // Reference to buttons
    const loginBtn = document.querySelector('.auth-buttons .btn-secondary');
    const signupBtn = document.querySelector('.auth-buttons .btn-primary');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            showLoginModal();
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            showSignupModal();
        });
    }
    
    // Check if user is already logged in
    checkAuthStatus();
}

/**
 * Create and show login modal
 */
function showLoginModal() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'auth-modal-container';
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="auth-modal login-modal">
            <div class="modal-header">
                <h2>Log In to CampusMess</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" required placeholder="Enter your password">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-block">Log In</button>
                    </div>
                    <div class="form-footer">
                        <a href="#" class="forgot-password">Forgot password?</a>
                        <p>Don't have an account? <a href="#" class="switch-to-signup">Sign up</a></p>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    setupModalEvents(modalContainer);
    
    // Switch to signup
    modalContainer.querySelector('.switch-to-signup').addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(modalContainer);
        showSignupModal();
    });
    
    // Handle form submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Simulate login API request
        loginUser(email, password)
            .then(response => {
                // Close modal and update UI
                closeModal(modalContainer);
                updateUIForLoggedInUser(response.user);
            })
            .catch(error => {
                // Show error message
                showError(loginForm, error.message);
            });
    });
}

/**
 * Create and show signup modal
 */
function showSignupModal() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'auth-modal-container';
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="auth-modal signup-modal">
            <div class="modal-header">
                <h2>Create Your Account</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="signup-form">
                    <div class="form-group">
                        <label for="signup-name">Full Name</label>
                        <input type="text" id="signup-name" required placeholder="Enter your full name">
                    </div>
                    <div class="form-group">
                        <label for="signup-email">Email</label>
                        <input type="email" id="signup-email" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" id="signup-password" required placeholder="Create a password">
                        <p class="password-hint">Password must be at least 8 characters</p>
                    </div>
                    <div class="form-group">
                        <label for="signup-college">College/University</label>
                        <select id="signup-college">
                            <option value="">Select your college</option>
                            <option value="engineering">Engineering College</option>
                            <option value="arts">Arts College</option>
                            <option value="science">Science Campus</option>
                            <option value="medical">Medical College</option>
                            <option value="business">Business School</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-block">Create Account</button>
                    </div>
                    <div class="form-footer">
                        <p>Already have an account? <a href="#" class="switch-to-login">Log in</a></p>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    setupModalEvents(modalContainer);
    
    // Switch to login
    modalContainer.querySelector('.switch-to-login').addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(modalContainer);
        showLoginModal();
    });
    
    // Handle form submission
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const college = document.getElementById('signup-college').value;
        
        // Validate password
        if (password.length < 8) {
            showError(signupForm, 'Password must be at least 8 characters');
            return;
        }
        
        // Simulate signup API request
        registerUser(name, email, password, college)
            .then(response => {
                // Close modal and update UI
                closeModal(modalContainer);
                updateUIForLoggedInUser(response.user);
            })
            .catch(error => {
                // Show error message
                showError(signupForm, error.message);
            });
    });
}

/**
 * Setup common modal events
 */
function setupModalEvents(modalContainer) {
    // Close on X button
    const closeBtn = modalContainer.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal(modalContainer);
        });
    }
    
    // Close on click outside modal
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer) {
            closeModal(modalContainer);
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal(modalContainer);
        }
    });
    
    // Add animation class after a delay
    setTimeout(() => {
        const modal = modalContainer.querySelector('.auth-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }, 10);
}

/**
 * Close modal
 */
function closeModal(modalContainer) {
    const modal = modalContainer.querySelector('.auth-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    // Remove after animation
    setTimeout(() => {
        document.body.removeChild(modalContainer);
    }, 300);
}

/**
 * Show error message in form
 */
function showError(form, message) {
    // Remove existing error messages
    const existingError = form.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerText = message;
    
    // Insert after form actions
    const formActions = form.querySelector('.form-actions');
    formActions.after(errorDiv);
    
    // Highlight with animation
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 10);
}

/**
 * Simulate login API request
 */
function loginUser(email, password) {
    return new Promise((resolve, reject) => {
        // Simulate API delay
        setTimeout(() => {
            // Demo validation logic
            if (email === 'demo@campusmess.com' && password === 'password123') {
                resolve({
                    success: true,
                    user: {
                        id: 'user123',
                        name: 'Demo User',
                        email: 'demo@campusmess.com',
                        college: 'Engineering College'
                    }
                });
            } else {
                reject({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
        }, 1000);
    });
}

/**
 * Simulate signup API request
 */
function registerUser(name, email, password, college) {
    return new Promise((resolve, reject) => {
        // Simulate API delay
        setTimeout(() => {
            // Demo validation logic - in real app, would check if email exists
            if (email === 'demo@campusmess.com') {
                reject({
                    success: false,
                    message: 'This email is already registered'
                });
            } else {
                resolve({
                    success: true,
                    user: {
                        id: 'user' + Math.floor(Math.random() * 1000),
                        name: name,
                        email: email,
                        college: college
                    }
                });
            }
        }, 1000);
    });
}

/**
 * Check if user is logged in
 */
function checkAuthStatus() {
    // Check localStorage for user data
    const userData = localStorage.getItem('campusmess_user');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateUIForLoggedInUser(user);
        } catch (e) {
            // Invalid data, clear storage
            localStorage.removeItem('campusmess_user');
        }
    }
}

/**
 * Update UI for logged in user
 */
function updateUIForLoggedInUser(user) {
    // Save user data
    localStorage.setItem('campusmess_user', JSON.stringify(user));
    
    // Update auth buttons
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <div class="user-profile-menu">
                <div class="user-profile-trigger">
                    <div class="user-avatar">${user.name.charAt(0)}</div>
                    <span class="user-name">${user.name.split(' ')[0]}</span>
                    <span class="dropdown-arrow">▼</span>
                </div>
                <div class="user-dropdown">
                    <ul>
                        <li><a href="#profile">My Profile</a></li>
                        <li><a href="#favorites">Saved Mess</a></li>
                        <li><a href="#subscription">My Plan</a></li>
                        <li><a href="#reviews">My Reviews</a></li>
                        <li class="separator"></li>
                        <li><a href="#" class="logout-link">Log Out</a></li>
                    </ul>
                </div>
            </div>
        `;
        
        // Add dropdown toggle
        const userTrigger = document.querySelector('.user-profile-trigger');
        if (userTrigger) {
            userTrigger.addEventListener('click', function() {
                const dropdown = document.querySelector('.user-dropdown');
                dropdown.classList.toggle('show');
            });
            
            // Close on click outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.user-profile-menu')) {
                    const dropdown = document.querySelector('.user-dropdown');
                    if (dropdown && dropdown.classList.contains('show')) {
                        dropdown.classList.remove('show');
                    }
                }
            });
        }
        
        // Add logout handler
        const logoutLink = document.querySelector('.logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
    }
}

/**
 * Logout user
 */
function logoutUser() {
    // Clear localStorage
    localStorage.removeItem('campusmess_user');
    
    // Restore auth buttons
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn btn-secondary">Log In</button>
            <button class="btn btn-primary">Sign Up</button>
        `;
        
        // Re-initialize auth buttons
        initAuthModals();
    }
    
    // Show logout notification
    showNotification('You have been logged out successfully');
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerText = message;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Initialize location features
 */
function initLocationFeatures() {
    const updateLocationBtn = document.querySelector('.btn-location');
    const campusSelect = document.querySelector('.campus-select');
    
    if (updateLocationBtn) {
        updateLocationBtn.addEventListener('click', function() {
            // Simulate geolocation request
            updateLocationBtn.innerHTML = '<span class="loading-icon">⏳</span> Updating...';
            updateLocationBtn.disabled = true;
            
            // Simulated delay
            setTimeout(() => {
                // Update location display
                document.querySelector('.status-text h3').innerText = 'Your Current Location';
                
                // Reset button
                updateLocationBtn.innerHTML = '<span class="location-icon">📡</span> Update Location';
                updateLocationBtn.disabled = false;
                
                // Show success message
                showNotification('Location updated successfully');
                
                // Reload nearby options
                loadNearbyOptions();
            }, 1500);
        });
    }
    
    if (campusSelect) {
        campusSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const campusName = selectedOption.text;
            
            // Update location display
            document.querySelector('.status-text h3').innerText = campusName;
            
            // Show success message
            showNotification(`Showing mess options near ${campusName}`);
            
            // Reload nearby options
            loadNearbyOptions();
        });
    }
}

/**
 * Initialize distance filter
 */
function initDistanceFilter() {
    const distanceButtons = document.querySelectorAll('.distance-btn');
    
    if (distanceButtons.length) {
        distanceButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                distanceButtons.forEach(button => {
                    button.classList.remove('active');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get selected distance
                const distance = this.innerText;
                
                // Show notification
                showNotification(`Showing mess options within ${distance}`);
                
                // Reload nearby options
                loadNearbyOptions();
            });
        });
    }
}

/**
 * Load nearby mess options
 */
function loadNearbyOptions() {
    const nearbyList = document.querySelector('.nearby-mess-list');
    
    if (nearbyList) {
        // Show loading state
        nearbyList.innerHTML = '<div class="loading-state">Loading nearby mess options...</div>';
        
        // Simulate API delay
        setTimeout(() => {
            // In a real app, this would be fetched from an API
            // For now, just restore the original content
            // You could replace this with real data fetching logic
            nearbyList.innerHTML = originalNearbyContent || nearbyList.innerHTML;
            
            // Store original content on first load
            if (!originalNearbyContent) {
                originalNearbyContent = nearbyList.innerHTML;
            }
            
            // Add event listeners to the new elements
            initMessCardEvents();
        }, 1000);
    }
}

// Store original content
let originalNearbyContent = null;

/**
 * Initialize map interaction
 */
function initMapInteraction() {
    const mapContainer = document.querySelector('.map-container');
    
    if (mapContainer) {
        const mapPlaceholder = document.querySelector('.map-placeholder');
        
        // Simulate map loading on click
        mapPlaceholder.addEventListener('click', function() {
            // Change overlay text
            document.querySelector('.map-overlay').innerHTML = 'Loading interactive map...<br>Please wait a moment';
            
            // Simulate loading delay
            setTimeout(() => {
                // Remove overlay to "show" the map
                const overlay = document.querySelector('.map-overlay');
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                    }, 300);
                }
                
                showNotification('Interactive map loaded successfully');
            }, 1500);
        });
    }
}

/**
 * Initialize mess card events
 */
function initMessCardEvents() {
    // Get directions buttons
    const directionsButtons = document.querySelectorAll('.directions-btn');
    
    if (directionsButtons.length) {
        directionsButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get mess name from parent card
                const messCard = this.closest('.nearby-mess-card');
                const messName = messCard.querySelector('h3').innerText;
                
                // Show notification
                showNotification(`Opening directions to ${messName}`);
                
                // Simulate opening map app
                setTimeout(() => {
                    alert(`In a real app, this would open directions to ${messName} in a map application.`);
                }, 500);
            });
        });
    }
    
    // View details buttons
    const viewDetailsButtons = document.querySelectorAll('.nearby-mess-info .btn-secondary');
    
    if (viewDetailsButtons.length) {
        viewDetailsButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get mess name from parent card
                const messCard = this.closest('.nearby-mess-card');
                const messName = messCard.querySelector('h3').innerText;
                
                // Simulate page navigation
                document.body.style.opacity = '0.5';
                showNotification(`Loading details for ${messName}`);
                
                setTimeout(() => {
                    alert(`In a real app, this would navigate to the details page for ${messName}.`);
                    document.body.style.opacity = '1';
                }, 800);
            });
        });
    }
}

/**
 * Initialize special offers
 */
function initSpecialOffers() {
    const claimButtons = document.querySelectorAll('.special-card .btn-primary');
    
    if (claimButtons.length) {
        claimButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Get offer title
                const offerCard = this.closest('.special-card');
                const offerTitle = offerCard.querySelector('h3').innerText;
                
                // Check if user is logged in
                const userData = localStorage.getItem('campusmess_user');
                
                if (!userData) {
                    // Show login prompt
                    showNotification('Please log in to claim this offer', 'error');
                    setTimeout(() => {
                        showLoginModal();
                    }, 500);
                    return;
                }
                
                // Show success message
                showNotification(`You've successfully claimed: ${offerTitle}`);
                
                // Change button text and disable
                this.innerText = 'Claimed';
                this.disabled = true;
                this.classList.add('claimed');
            });
        });
    }
}

/**
 * Add CSS for dynamic elements
 */
(function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Auth Modal Styles */
        .auth-modal-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }
        
        .auth-modal {
            background-color: #fff;
            border-radius: 12px;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .auth-modal.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 1.8rem;
            cursor: pointer;
            color: #64748b;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #475569;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 1rem;
        }
        
        .password-hint {
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 0.5rem;
        }
        
        .btn-block {
            width: 100%;
        }
        
        .form-footer {
            margin-top: 1.5rem;
            text-align: center;
            color: #64748b;
        }
        
        .form-footer a {
            color: #2563eb;
        }
        
        .form-error {
            background-color: #fee2e2;
            color: #b91c1c;
            padding: 12px;
            border-radius: 8px;
            margin-top: 1rem;
            font-size: 0.95rem;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .form-error.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* User Profile Menu */
        .user-profile-menu {
            position: relative;
        }
        
        .user-profile-trigger {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            transition: background-color 0.3s ease;
        }
        
        .user-profile-trigger:hover {
            background-color: #f1f5f9;
        }
        
        .user-avatar {
            width: 36px;
            height: 36px;
            background-color: #2563eb;
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }
        
        .user-name {
            font-weight: 500;
        }
        
        .dropdown-arrow {
            font-size: 0.75rem;
            color: #64748b;
        }
        
        .user-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            width: 220px;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            padding: 0.75rem 0;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
            z-index: 100;
        }
        
        .user-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .user-dropdown ul {
            list-style: none;
        }
        
        .user-dropdown li {
            padding: 0;
        }
        
        .user-dropdown a {
            padding: 0.75rem 1.5rem;
            display: block;
            color: #475569;
            transition: background-color 0.3s ease;
        }
        
        .user-dropdown a:hover {
            background-color: #f1f5f9;
            color: #2563eb;
        }
        
        .user-dropdown .separator {
            margin: 0.5rem 0;
            border-top: 1px solid #e2e8f0;
        }
        
        .logout-link {
            color: #ef4444 !important;
        }
        
        .logout-link:hover {
            background-color: #fee2e2 !important;
            color: #b91c1c !important;
        }
        
        /* Notification */
        .notification {
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 20px;
            background-color: #fff;
            color: #475569;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            font-size: 0.95rem;
            z-index: 1000;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .notification.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .notification.success {
            border-left: 4px solid #10b981;
        }
        
        .notification.error {
            border-left: 4px solid #ef4444;
        }
        
        /* Loading States */
        .loading-state {
            text-align: center;
            padding: 2rem 0;
            color: #64748b;
        }
        
        .loading-icon {
            display: inline-block;
            animation: spin 1.5s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* Responsive Styles */
        @media (max-width: 768px) {
            .auth-modal {
                max-width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
})();