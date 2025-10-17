/**
 * JURY AI - MAIN JAVASCRIPT FILE
 * ================================
 * Main JavaScript functionality for the Jury AI Legal Assistant
 * Handles animations, interactions, and dynamic content
 */

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all functions
    initializeAOS();
    initializeNavigation();
    initializeScrollEffects();
    initializeCounterAnimation();
    initializeCarousel();
    initializeSmoothScroll();
    initializeBackToTop();
    initializeSecurityFeatures();
    initializeTooltips();
    initializePreloader();
    initializeNewsUpdates();
    
    console.log('Jury AI - Legal Assistant Loaded Successfully');
});

/**
 * Initialize AOS (Animate On Scroll) Library
 */
function initializeAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false,
            offset: 100,
            delay: 0
        });
    }
}

/**
 * Navigation Functionality
 */
function initializeNavigation() {
    const navbar = document.getElementById('mainNavbar');
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-link-custom');
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
            header.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
            header.classList.remove('scrolled');
        }
    });
    
    // Active nav link highlighting
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Close mobile menu if open
            const navbarCollapse = document.getElementById('navbarNav');
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        });
    });
}

/**
 * Scroll Effects and Parallax
 */
function initializeScrollEffects() {
    const heroSection = document.querySelector('.hero-section');
    const statsSection = document.querySelector('.stats-section');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // Parallax effect for hero section
        if (heroSection) {
            heroSection.style.transform = `translateY(${rate}px)`;
        }
        
        // Fade effect for stats section
        if (statsSection) {
            const sectionTop = statsSection.getBoundingClientRect().top;
            const sectionVisible = sectionTop < window.innerHeight;
            
            if (sectionVisible) {
                statsSection.style.opacity = '1';
                statsSection.style.transform = 'translateY(0)';
            }
        }
    });
}

/**
 * Counter Animation for Statistics
 */
function initializeCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    let hasAnimated = false;
    
    const animateCounters = () => {
        if (hasAnimated) return;
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            };
            
            updateCounter();
        });
        
        hasAnimated = true;
    };
    
    // Trigger animation when stats section is visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
            }
        });
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

/**
 * Enhanced Carousel Functionality
 */
function initializeCarousel() {
    const carousel = document.getElementById('newsCarousel');
    
    if (carousel) {
        // Auto-play carousel
        setInterval(() => {
            const nextButton = carousel.querySelector('.carousel-control-next');
            if (nextButton) {
                nextButton.click();
            }
        }, 5000); // Auto-slide every 5 seconds
        
        // Pause on hover
        carousel.addEventListener('mouseenter', () => {
            carousel.setAttribute('data-bs-interval', 'false');
        });
        
        carousel.addEventListener('mouseleave', () => {
            carousel.setAttribute('data-bs-interval', '5000');
        });
    }
}

/**
 * Smooth Scrolling for Internal Links
 */
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                const headerHeight = document.getElementById('header').offsetHeight;
                const navbarHeight = document.getElementById('mainNavbar').offsetHeight;
                const offset = headerHeight + navbarHeight + 20;
                
                const targetPosition = targetElement.offsetTop - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Back to Top Button
 */
function initializeBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    
    if (backToTopButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });
        
        // Smooth scroll to top
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Security Features - Disable Right Click, Copy, etc.
 */
function initializeSecurityFeatures() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showSecurityToast('Right-click is disabled for security purposes.');
        return false;
    });
    
    // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            showSecurityToast('Developer tools are disabled.');
            return false;
        }
        
        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            showSecurityToast('Developer tools are disabled.');
            return false;
        }
        
        // Ctrl+U
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            showSecurityToast('View source is disabled.');
            return false;
        }
        
        // Ctrl+S
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            showSecurityToast('Save page is disabled.');
            return false;
        }
        
        // Ctrl+A
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            showSecurityToast('Select all is disabled.');
            return false;
        }
        
        // Ctrl+C
        if (e.ctrlKey && e.keyCode === 67) {
            e.preventDefault();
            showSecurityToast('Copy is disabled.');
            return false;
        }
    });
    
    // Disable drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable image drag
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
}

/**
 * Show Security Toast Notification
 */
function showSecurityToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.security-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'security-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-shield-alt"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        font-size: 0.9rem;
        font-weight: 500;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .toast-content { display: flex; align-items: center; }
        .toast-content i { margin-right: 10px; }
    `;
    document.head.appendChild(style);
    
    // Append to body
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

/**
 * Initialize Tooltips
 */
function initializeTooltips() {
    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

/**
 * Preloader
 */
function initializePreloader() {
    // Create preloader if it doesn't exist
    let preloader = document.querySelector('.preloader');
    if (!preloader) {
        preloader = document.createElement('div');
        preloader.className = 'preloader';
        preloader.innerHTML = `
            <div class="preloader-content">
                <div class="preloader-logo">
                    <img src="assets/images/logo.png" alt="Jury AI" class="logo-spin">
                </div>
                <div class="preloader-text">
                    <h3>Jury AI</h3>
                    <p>Loading Legal Assistant...</p>
                </div>
                <div class="preloader-spinner">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add preloader styles
        preloader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1e3a8a, #0f172a);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.5s ease-out;
        `;
        
        document.body.appendChild(preloader);
    }
    
    // Hide preloader after page load
    window.addEventListener('load', function() {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                if (preloader.parentNode) {
                    preloader.parentNode.removeChild(preloader);
                }
            }, 500);
        }, 1000);
    });
}

/**
 * Dynamic News Updates
 */
function initializeNewsUpdates() {
    // Simulate real-time news updates
    const newsCards = document.querySelectorAll('.news-card');
    
    newsCards.forEach((card, index) => {
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-20px) scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // Add click analytics (simulation)
        card.addEventListener('click', function() {
            console.log(`News card ${index + 1} clicked - Analytics tracked`);
            
            // Show toast notification
            showInfoToast('Redirecting to full article...');
        });
    });
}

/**
 * Show Info Toast Notification
 */
function showInfoToast(message) {
    const toast = document.createElement('div');
    toast.className = 'info-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        font-size: 0.9rem;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2500);
}

/**
 * Feature Card Interactions
 */
document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add glowing effect
            this.style.boxShadow = '0 30px 70px rgba(59, 130, 246, 0.2), 0 0 20px rgba(251, 191, 36, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
        
        // Add click handler
        card.addEventListener('click', function() {
            const title = this.querySelector('.feature-title').textContent;
            console.log(`Feature "${title}" clicked`);
            
            // You can add navigation logic here
            showInfoToast(`Exploring ${title}...`);
        });
    });
});

/**
 * Login Button Interactions
 */
document.addEventListener('DOMContentLoaded', function() {
    const authButtons = document.querySelectorAll('.btn-auth');
    
    authButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const buttonType = this.textContent.trim();
            console.log(`${buttonType} button clicked`);
            
            // Add loading animation
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
            this.style.pointerEvents = 'none';
            
            // Simulate loading
            setTimeout(() => {
                this.innerHTML = originalText;
                this.style.pointerEvents = 'auto';
            }, 2000);
        });
    });
});

/**
 * CTA Button Effects
 */
document.addEventListener('DOMContentLoaded', function() {
    const ctaButtons = document.querySelectorAll('.cta-button, .cta-button-primary, .cta-button-secondary');
    
    ctaButtons.forEach(button => {
        // Ripple effect on click
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple 0.6s linear;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

/**
 * Responsive Navigation Toggle
 */
document.addEventListener('DOMContentLoaded', function() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.getElementById('navbarNav');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            // Add custom animation classes
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.style.animation = 'slideUp 0.3s ease-out';
            } else {
                navbarCollapse.style.animation = 'slideDown 0.3s ease-out';
            }
        });
    }
});

/**
 * Error Handling
 */
window.addEventListener('error', function(e) {
    console.error('Jury AI Error:', e.error);
    // You can add error reporting here
});

/**
 * Console Protection
 */
(function() {
    let devtools = false;
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools) {
                devtools = true;
                console.clear();
                console.log('%cJury AI - Legal Assistant', 'color: #1e3a8a; font-size: 24px; font-weight: bold;');
                console.log('%c⚖️ Unauthorized access to developer tools is prohibited.', 'color: #ef4444; font-size: 16px;');
                console.log('%c🔒 This application is protected by security measures.', 'color: #f59e0b; font-size: 14px;');
            }
        } else {
            devtools = false;
        }
    }, 500);
})();

/**
 * Performance Monitoring
 */
window.addEventListener('load', function() {
    const loadTime = performance.now();
    console.log(`Jury AI loaded in ${Math.round(loadTime)}ms`);
    
    // Monitor page performance
    if ('PerformanceObserver' in window) {
        const perfObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'navigation') {
                    console.log('Navigation timing:', entry);
                }
            });
        });
        
        perfObserver.observe({ entryTypes: ['navigation'] });
    }
});

// Export functions for external use
window.JuryAI = {
    showSecurityToast,
    showInfoToast,
    initializeAOS,
    initializeNavigation
};