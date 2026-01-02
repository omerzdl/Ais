// Initialize Lucide Icons (will be called after DOM is ready)

// ============================================
// GLOBAL CONSTANTS
// ============================================
const CORPORATE_TABS = ['about', 'mission-vision', 'application'];
const PRODUCT_ITEMS = ['surface-cleaners', 'concentrated-detergents', 'disinfectants', 'liquid-soap', 'shampoo'];

// ============================================
// NAVBAR FUNCTIONALITY
// ============================================

// GSAP Animation for Logo and Nav
function initNavbarAnimation() {
    const logoContainer = document.getElementById('logo-container');
    const navbar = document.getElementById('navbar');
    
    if (logoContainer && navbar && typeof gsap !== 'undefined') {
        // Set initial state
        gsap.set([logoContainer, navbar], { 
            y: -50, 
            opacity: 0 
        });
        
        // Animate in
        gsap.to([logoContainer, navbar], {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out',
        });
    }
}

// Desktop Dropdown Menu - Event Delegation Pattern
// Global state for dropdown management
let navDropdownState = {
    clickOpenedDropdown: null,
    hoverTimeout: null
};

// Helper function to get chevron (works with Lucide icons)
function getChevron(dropdown) {
    return dropdown.querySelector('svg.lucide-chevron-down') || 
           dropdown.querySelector('[data-lucide="chevron-down"]') ||
           dropdown.querySelector('i.lucide-chevron-down');
}

// Helper function to show dropdown
function showNavDropdown(dropdown, menu) {
    menu.classList.add('show');
    const trigger = dropdown.querySelector('a');
    const chevron = getChevron(dropdown);
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }
    if (chevron) {
        chevron.style.transform = 'rotate(180deg)';
        chevron.style.transition = 'transform 0.2s ease';
    }
}

// Helper function to hide dropdown
function hideNavDropdown(dropdown, menu) {
    menu.classList.remove('show');
    const trigger = dropdown.querySelector('a');
    const chevron = getChevron(dropdown);
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
    if (chevron) {
        chevron.style.transform = 'rotate(0deg)';
    }
}

// Helper function to hide all nav dropdowns
function hideAllNavDropdowns() {
    navDropdownState.clickOpenedDropdown = null;
    document.querySelectorAll('.nav-dropdown').forEach(dd => {
        const m = dd.querySelector('.dropdown-menu');
        if (m) {
            hideNavDropdown(dd, m);
        }
    });
}

// Helper function to check if device supports hover (desktop)
function isDesktop() {
    return window.innerWidth >= 768 && window.matchMedia('(hover: hover)').matches;
}

// Initialize desktop dropdowns - only sets up overflow styles, event delegation is handled globally
function initDesktopDropdowns() {
    // Force overflow visible on all parent containers
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        let parent = dropdown.parentElement;
        while (parent && parent !== document.body) {
            parent.style.overflow = 'visible';
            parent = parent.parentElement;
        }
    });
}

// Global event delegation for desktop nav dropdowns
function setupNavDropdownDelegation() {
    // Click handler - delegation on document.body
    document.body.addEventListener('click', (e) => {
        // Check if clicked on nav dropdown trigger
        const dropdown = e.target.closest('.nav-dropdown');
        if (!dropdown) {
            // Click outside - close all dropdowns
            hideAllNavDropdowns();
            return;
        }
        
        const menu = dropdown.querySelector('.dropdown-menu');
        const trigger = dropdown.querySelector('a');
        if (!menu || !trigger) return;
        
        // Check if clicked on chevron or SVG icon
        const clickedElement = e.target;
        const isChevronClick = clickedElement.closest('.dropdown-toggle-icon') || 
                               clickedElement.classList.contains('dropdown-toggle-icon') ||
                               clickedElement.closest('svg') ||
                               clickedElement.closest('[data-lucide="chevron-down"]');
        
        if (isChevronClick && trigger.contains(clickedElement)) {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = menu.classList.contains('show');
            
            // Close all other dropdowns first
            document.querySelectorAll('.nav-dropdown').forEach(dd => {
                if (dd !== dropdown) {
                    const m = dd.querySelector('.dropdown-menu');
                    if (m) hideNavDropdown(dd, m);
                }
            });
            
            // Toggle current dropdown
            if (isOpen) {
                hideNavDropdown(dropdown, menu);
                navDropdownState.clickOpenedDropdown = null;
            } else {
                showNavDropdown(dropdown, menu);
                navDropdownState.clickOpenedDropdown = dropdown;
            }
        }
        
        // Check if clicked on dropdown menu link
        const menuLink = e.target.closest('.dropdown-menu a[href^="#"]');
        if (menuLink) {
            e.preventDefault();
            e.stopPropagation();
            
            const href = menuLink.getAttribute('href');
            hideAllNavDropdowns();
            
            // Handle Corporate tabs
            if (CORPORATE_TABS.includes(href.slice(1))) {
                handleCorporateTabNavigation(href);
                return;
            }
            
            // Handle Products tabs
            if (href.startsWith('#products-')) {
                handleProductNavigation(href);
                return;
            }
            
            // Default scroll behavior
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.scrollY - 150;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        }
    });
    
    // Hover events - delegation for desktop only
    document.body.addEventListener('mouseenter', (e) => {
        if (!isDesktop()) return;
        
        const dropdown = e.target.closest('.nav-dropdown');
        if (!dropdown) return;
        
        const menu = dropdown.querySelector('.dropdown-menu');
        if (!menu) return;
        
        // Clear any pending hide timeout
        if (navDropdownState.hoverTimeout) {
            clearTimeout(navDropdownState.hoverTimeout);
            navDropdownState.hoverTimeout = null;
        }
        
        showNavDropdown(dropdown, menu);
    }, true);
    
    document.body.addEventListener('mouseleave', (e) => {
        if (!isDesktop()) return;
        
        const dropdown = e.target.closest('.nav-dropdown');
        if (!dropdown) return;
        
        // Don't close if it was opened by click
        if (navDropdownState.clickOpenedDropdown === dropdown) return;
        
        const menu = dropdown.querySelector('.dropdown-menu');
        if (!menu) return;
        
        // Add a small delay before hiding
        navDropdownState.hoverTimeout = setTimeout(() => {
            hideNavDropdown(dropdown, menu);
        }, 100);
    }, true);
    
    // Close dropdowns on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideAllNavDropdowns();
        }
    });
}

// Mobile Menu Toggle and Scroll Lock
let mobileMenuOpen = false;
let scrollPosition = 0;

function toggleMobileMenu() {
    const portal = document.getElementById('mobile-menu-portal');
    const button = document.getElementById('mobile-menu-button');
    const menuIcon = document.getElementById('menu-icon');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    
    if (!portal || !button) return;
    
    mobileMenuOpen = !mobileMenuOpen;
    
    if (mobileMenuOpen) {
        // Save scroll position
        scrollPosition = window.scrollY;
        
        // Lock scroll
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPosition}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        
        // Show menu
        portal.classList.remove('hidden');
        portal.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
        
        // Apply translations to mobile menu when it opens
        if (window.i18n && typeof window.i18n.updatePageContent === 'function') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (window.i18n.updatePageContent) {
                    window.i18n.updatePageContent();
                }
            }, 10);
        }
        
        // Change icon to X
        if (menuIcon) {
            menuIcon.setAttribute('data-lucide', 'x');
            lucide.createIcons();
        }
        
        // Close on backdrop click
        if (backdrop) {
            const backdropClickHandler = () => {
                closeMobileMenu();
                backdrop.removeEventListener('click', backdropClickHandler);
            };
            backdrop.addEventListener('click', backdropClickHandler);
        }
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu(restoreScroll = true) {
    const portal = document.getElementById('mobile-menu-portal');
    const button = document.getElementById('mobile-menu-button');
    const menuIcon = document.getElementById('menu-icon');
    
    if (!portal || !button) return;
    
    mobileMenuOpen = false;
    
    // Restore scroll position only if requested (not when navigating)
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    if (restoreScroll) {
        window.scrollTo(0, scrollPosition);
    }
    
    // Hide menu
    portal.classList.remove('show');
    portal.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');
    
    // Change icon back to menu
    if (menuIcon) {
        menuIcon.setAttribute('data-lucide', 'menu');
        lucide.createIcons();
    }
    
    // Close all mobile dropdowns
    document.querySelectorAll('.mobile-dropdown-content').forEach(content => {
        content.classList.remove('show');
    });
    document.querySelectorAll('.mobile-dropdown-toggle').forEach(toggle => {
        toggle.classList.remove('active');
    });
}

// Mobile Menu - Event Delegation Pattern
function initMobileMenu() {
    // This function is now just a placeholder for compatibility
    // All logic is handled via event delegation in setupMobileMenuDelegation()
}

// Global event delegation for mobile menu
function setupMobileMenuDelegation() {
    // Mobile menu button click/touch
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('#mobile-menu-button');
        if (button) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        }
    });
    
    document.body.addEventListener('touchstart', (e) => {
        const button = e.target.closest('#mobile-menu-button');
        if (button) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        }
    }, { passive: false });
    
    // Mobile dropdown toggles - delegation
    document.body.addEventListener('click', (e) => {
        const toggle = e.target.closest('.mobile-dropdown-toggle');
        if (toggle) {
            e.stopPropagation();
            
            const content = toggle.nextElementSibling;
            const chevron = toggle.querySelector('i[data-lucide="chevron-down"]');
            
            if (content && content.classList.contains('mobile-dropdown-content')) {
                const isOpen = content.classList.contains('show');
                
                // Close all other dropdowns
                document.querySelectorAll('.mobile-dropdown-content').forEach(c => {
                    c.classList.remove('show');
                });
                document.querySelectorAll('.mobile-dropdown-toggle').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Toggle current dropdown
                if (!isOpen) {
                    content.classList.add('show');
                    toggle.classList.add('active');
                    if (chevron) {
                        chevron.style.transform = 'rotate(180deg)';
                    }
                } else {
                    content.classList.remove('show');
                    toggle.classList.remove('active');
                    if (chevron) {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                }
            }
        }
        
        // Close mobile menu when clicking a link
        const link = e.target.closest('#mobile-menu-items a');
        if (link) {
            setTimeout(() => {
                closeMobileMenu(false);
            }, 300);
        }
    });
}


// Enhanced Navigation with Scroll Offsets
function initEnhancedNavigation() {
    // Handle path-based navigation links (like /catalog)
    document.querySelectorAll('a[href^="/"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Close mobile menu if open (don't restore scroll since we're navigating)
            if (mobileMenuOpen) {
                closeMobileMenu(false);
            }
            
            // Handle /catalog and other path-based routes
            if (href.startsWith('/') && !href.startsWith('//')) {
                e.preventDefault();
                // Navigate to the route - this will work with React Router if set up correctly
                window.location.href = href;
                return;
            }
        });
    });
    
    // Override the existing smooth scroll handler for hash links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Close mobile menu if open (don't restore scroll since we're navigating)
            if (mobileMenuOpen) {
                closeMobileMenu(false);
            }
            
            // Corporate tab hash'leri için özel işlem (about, mission-vision, career, culture, application)
            if (CORPORATE_TABS.includes(href.slice(1))) {
                e.preventDefault();
                handleCorporateTabNavigation(href);
                return;
            }
            
            // Products hash'leri için özel işlem
            if (href.startsWith('#products-')) {
                e.preventDefault();
                handleProductNavigation(href);
                return;
            }
            
            // Quality section
            if (href === '#quality') {
                e.preventDefault();
                const qualitySection = document.getElementById('quality');
                if (qualitySection) {
                    qualitySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    const offsetTop = qualitySection.getBoundingClientRect().top + window.scrollY - 150;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
                return;
            }
            
            // Corporate section
            if (href === '#corporate') {
                e.preventDefault();
                setTimeout(() => {
                    const section = document.getElementById('about');
                    if (section) {
                        const offsetTop = section.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    }
                }, 50);
                return;
            }
            
            // Products section - Products başlığı en üstte kalacak şekilde
            if (href === '#products') {
                e.preventDefault();
                const productsSection = document.getElementById('products');
                if (productsSection) {
                    const offsetTop = productsSection.offsetTop - 100;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
                return;
            }
            
            // Private Label section - scroll to title
            if (href === '#private-label-title') {
                e.preventDefault();
                const privateLabelTitle = document.getElementById('private-label-title');
                if (privateLabelTitle) {
                    const offsetTop = privateLabelTitle.getBoundingClientRect().top + window.scrollY - 150;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
                return;
            }
            
            // Legacy support for #private-label (redirect to title)
            if (href === '#private-label') {
                e.preventDefault();
                const privateLabelTitle = document.getElementById('private-label-title');
                if (privateLabelTitle) {
                    const offsetTop = privateLabelTitle.getBoundingClientRect().top + window.scrollY - 150;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
                return;
            }
            
            // Contact section - scroll to heading with proper offset
            if (href === '#contact') {
                e.preventDefault();
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    // Get the contact heading (h2) within the section
                    const contactHeading = contactSection.querySelector('h2');
                    if (contactHeading) {
                        // Calculate offset to position heading at top (accounting for navbar ~120px)
                        const navbarHeight = 120;
                        const offsetTop = contactHeading.getBoundingClientRect().top + window.scrollY - navbarHeight;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    } else {
                        // Fallback to section scroll
                        const offsetTop = contactSection.getBoundingClientRect().top + window.scrollY - 120;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    }
                }
                return;
            }
            
            // Default smooth scroll
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.scrollY - 150;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });
}

// Parallax Effect for Water Droplets
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const droplets = document.querySelectorAll('.water-droplet');
    
    droplets.forEach(droplet => {
        const speed = parseFloat(droplet.getAttribute('data-speed'));
        // Apply translation based on scroll position and speed factor
        // Also adding a slight easing feel by dividing scrollY
        droplet.style.transform = `translateY(${scrollY * speed}px)`;
    });
});

// ============================================
// HYGIENIC BUBBLE SCROLL-LINKED ANIMATION
// ============================================
(function() {
    let ticking = false;
    
    // Get all bubble layers
    const bubbleLayers = document.querySelectorAll('.bubble-layer');
    
    // Performance-optimized scroll handler using requestAnimationFrame
    function updateBubblePositions() {
        const scrollY = window.scrollY;
        
        bubbleLayers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed')) || -0.3;
            const bubbles = layer.querySelectorAll('.hygienic-bubble');
            
            bubbles.forEach(bubble => {
                // Calculate vertical offset based on scroll position
                // Negative speed means bubbles move upward as user scrolls down
                const scrollOffset = scrollY * speed;
                
                // Transform: translateY(var(--scroll-y)) - CSS'te tanımlı
                // CSS custom property --scroll-y kullanılıyor
                // Salınım animasyonu margin ile yapılıyor, transform ile çakışmıyor
                bubble.style.setProperty('--scroll-y', `${scrollOffset}px`);
                
                // Doğrulama: window.scrollY * data-speed = --scroll-y
                // Debug: İlk baloncuk için console log (sadece ilk layer'dan)
                if (layer === bubbleLayers[0] && bubbles.length > 0 && bubble === bubbles[0]) {
                    console.log(`Bubble Scroll - scrollY: ${scrollY}, speed: ${speed}, offset: ${scrollOffset}px`);
                }
            });
        });
        
        ticking = false;
    }
    
    // Throttled scroll handler
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(updateBubblePositions);
            ticking = true;
        }
    }
    
    // Initialize on page load
    function initBubbleAnimation() {
        if (bubbleLayers.length === 0) {
            console.warn('Bubble layers not found!');
            return;
        }
        
        console.log(`Initialized ${bubbleLayers.length} bubble layers`);
        
        // Count total bubbles and apply random opacity
        let totalBubbles = 0;
        let smallBubbles = [];
        
        bubbleLayers.forEach(layer => {
            const bubbles = layer.querySelectorAll('.hygienic-bubble');
            totalBubbles += bubbles.length;
            
            bubbles.forEach(bubble => {
                // Rastgele opacity: 0.03 ile 0.1 arası
                const randomOpacity = 0.03 + Math.random() * 0.07; // 0.03 - 0.1
                bubble.style.opacity = randomOpacity;
                
                // Küçük baloncukları topla (turuncu glow için)
                if (bubble.classList.contains('bubble-size-sm')) {
                    smallBubbles.push(bubble);
                }
            });
        });
        
        console.log(`Total bubbles: ${totalBubbles}`);
        
        // Küçük baloncukların %5'ine turuncu glow ekle
        const orangeGlowCount = Math.max(1, Math.floor(smallBubbles.length * 0.05));
        const shuffled = smallBubbles.sort(() => 0.5 - Math.random());
        for (let i = 0; i < orangeGlowCount && i < shuffled.length; i++) {
            shuffled[i].classList.add('has-orange-glow');
        }
        
        // Set initial positions
        updateBubblePositions();
        
        // Listen to scroll events with passive flag for better performance
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Also update on resize to recalculate positions
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateBubblePositions();
            }, 100);
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBubbleAnimation);
    } else {
        initBubbleAnimation();
    }
})();

// Corporate Tab Navigation
function handleCorporateTabNavigation(hash) {
    const tabId = hash.slice(1); // Remove #
    
    if (CORPORATE_TABS.includes(tabId)) {
        // Scroll to about section (corporate section) - tüm tab'lar için aynı scroll hedefi
        const aboutSection = document.getElementById('about');
        
        if (aboutSection) {
            const offsetTop = aboutSection.offsetTop - 100;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
        
        // Activate tab after scroll
        setTimeout(() => {
            switchTab(tabId);
            // Update glider position for mobile
            updateGliderPosition(tabId);
        }, 500);
    }
}

function switchTab(tabId) {
    console.log('switchTab called with:', tabId);
    
    // Check the corresponding radio input
    const radioInput = document.getElementById(`corporate-${tabId}`);
    if (radioInput) {
        radioInput.checked = true;
        console.log('Radio input checked:', radioInput.id);
    } else {
        console.warn('Radio input not found for:', `corporate-${tabId}`);
    }
    
    // Get all tab contents
    const allContents = document.querySelectorAll('.corporate-tab-content');
    console.log('Found tab contents:', allContents.length);
    
    // Hide all tab contents
    allContents.forEach(content => {
        content.style.cssText = 'display: none !important;';
        content.classList.add('hidden');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`tab-content-${tabId}`);
    console.log('Looking for:', `tab-content-${tabId}`, 'Found:', selectedContent);
    
    if (selectedContent) {
        selectedContent.style.cssText = 'display: block !important;';
        selectedContent.classList.remove('hidden');
        
        console.log('Tab content shown:', `tab-content-${tabId}`);
        
        // Re-initialize Lucide icons for the new content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Update URL hash without triggering scroll
        if (window.location.hash !== `#${tabId}`) {
            history.pushState(null, null, `#${tabId}`);
        }
        
        // Update glider position (important for mobile)
        setTimeout(() => {
            updateGliderPosition(tabId);
        }, 50);
    } else {
        console.error('Tab content not found for:', `tab-content-${tabId}`);
    }
}

// Update glider position dynamically for mobile responsive
function updateGliderPosition(tabId) {
    const glider = document.querySelector('.glass-glider');
    const activeLabel = document.querySelector(`.glass-radio-group label[data-tab="${tabId}"]`);
    const radioGroup = document.querySelector('.glass-radio-group');
    
    if (!glider || !activeLabel || !radioGroup) {
        console.log('updateGliderPosition: missing elements', { glider, activeLabel, radioGroup });
        return;
    }
    
    console.log('updateGliderPosition called for:', tabId, 'window.innerWidth:', window.innerWidth);
    
    // Use dynamic positioning on mobile (< 768px)
    if (window.innerWidth < 768) {
        const labelRect = activeLabel.getBoundingClientRect();
        const groupRect = radioGroup.getBoundingClientRect();
        
        // Calculate position relative to the group (accounting for padding)
        const groupPadding = parseFloat(getComputedStyle(radioGroup).paddingLeft) || 0;
        const left = labelRect.left - groupRect.left;
        const width = labelRect.width;
        
        console.log('Glider position:', { left, width, labelRect, groupRect });
        
        // Apply dynamic positioning with inline styles (override CSS)
        glider.style.cssText = `
            width: ${width}px !important;
            transform: translateX(${left}px) !important;
            left: 0 !important;
            transition: transform 0.3s cubic-bezier(0.37, 1.95, 0.66, 0.56), width 0.3s ease !important;
        `;
    } else {
        // Reset to CSS-based positioning on desktop
        glider.style.cssText = '';
    }
}

// Scroll active tab into view on mobile
function scrollTabIntoView(tabId) {
    const wrapper = document.querySelector('.glass-radio-group-wrapper');
    const activeLabel = document.querySelector(`.glass-radio-group label[data-tab="${tabId}"]`);
    
    if (!wrapper || !activeLabel) return;
    
    // Only scroll on mobile
    if (window.innerWidth < 768) {
        const labelRect = activeLabel.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Check if label is not fully visible
        if (labelRect.left < wrapperRect.left || labelRect.right > wrapperRect.right) {
            activeLabel.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }
}

// Initialize corporate tabs
function initCorporateTabs() {
    console.log('initCorporateTabs called');
    
    const radioInputs = document.querySelectorAll('.glass-radio-group input[type="radio"]');
    const labels = document.querySelectorAll('.glass-radio-group label[data-tab]');
    
    console.log('Found radio inputs:', radioInputs.length);
    console.log('Found labels:', labels.length);
    
    // Add event listeners to radio inputs
    radioInputs.forEach(input => {
        input.addEventListener('change', function() {
            const tabId = this.value;
            console.log('Radio change event:', tabId);
            switchTab(tabId);
            updateGliderPosition(tabId);
            scrollTabIntoView(tabId);
        });
    });
    
    // Add click event listeners to labels - directly switch tab
    labels.forEach(label => {
        label.addEventListener('click', function(e) {
            e.stopPropagation();
            const tabId = this.getAttribute('data-tab');
            console.log('Label click event:', tabId);
            if (tabId) {
                // Check the radio input manually
                const radioInput = document.getElementById(`corporate-${tabId}`);
                if (radioInput) {
                    radioInput.checked = true;
                    console.log('Radio checked:', radioInput.id);
                }
                // Switch tab immediately
                switchTab(tabId);
                updateGliderPosition(tabId);
                scrollTabIntoView(tabId);
            }
        });
    });
    
    // Handle resize to update glider position
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const checkedInput = document.querySelector('.glass-radio-group input[type="radio"]:checked');
            if (checkedInput) {
                updateGliderPosition(checkedInput.value);
            }
        }, 100);
    });
    
    // Check initial hash
    const initialHash = window.location.hash.slice(1);
    console.log('Initial hash:', initialHash);
    
    if (CORPORATE_TABS.includes(initialHash)) {
        switchTab(initialHash);
        // Delay glider update to ensure DOM is ready
        setTimeout(() => updateGliderPosition(initialHash), 100);
    } else {
        // Show default "about" tab content and update glider
        switchTab('about');
        setTimeout(() => updateGliderPosition('about'), 100);
    }
}

// Application Form Handling - Enhanced with Netlify Integration
function initApplicationForm() {
    const form = document.getElementById('application-form');
    const messageTextarea = document.getElementById('app-message');
    const charCount = document.getElementById('char-count');
    const cvInput = document.getElementById('app-cv');
    const cvLabel = document.getElementById('app-cv-label');
    const cvText = document.getElementById('app-cv-text');
    const cvPlaceholder = document.getElementById('app-cv-placeholder');
    const cvError = document.getElementById('app-cv-error');
    const nameInput = document.getElementById('app-name');
    const nameError = document.getElementById('app-name-error');
    const emailInput = document.getElementById('app-email');
    const emailError = document.getElementById('app-email-error');
    const phoneInput = document.getElementById('app-phone');
    const phoneError = document.getElementById('app-phone-error');
    const submitBtn = document.getElementById('app-submit-btn');
    const submitText = document.getElementById('app-submit-text');
    const formSuccess = document.getElementById('app-form-success');
    const formError = document.getElementById('app-form-error');
    
    // Helper functions to show/hide errors
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }
    
    function hideError(element) {
        if (element) {
            element.textContent = '';
            element.classList.add('hidden');
        }
    }
    
    // ========================================
    // NAME INPUT VALIDATION
    // ========================================
    if (nameInput) {
        nameInput.addEventListener('invalid', function(e) {
            e.preventDefault();
            if (this.validity.valueMissing) {
                showError(nameError, 'Full name is required.');
                this.setCustomValidity('Full name is required.');
            }
        });
        
        nameInput.addEventListener('input', function() {
            this.setCustomValidity('');
            hideError(nameError);
        });
    }
    
    // ========================================
    // EMAIL INPUT VALIDATION
    // ========================================
    if (emailInput) {
        emailInput.addEventListener('invalid', function(e) {
            e.preventDefault();
            if (this.validity.valueMissing) {
                showError(emailError, 'Email is required.');
                this.setCustomValidity('Email is required.');
            } else if (this.validity.typeMismatch) {
                showError(emailError, 'Please enter a valid email address.');
                this.setCustomValidity('Please enter a valid email address.');
            }
        });
        
        emailInput.addEventListener('input', function() {
            this.setCustomValidity('');
            hideError(emailError);
        });
    }
    
    // ========================================
    // PHONE INPUT - ONLY NUMBERS
    // ========================================
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Remove all non-digit characters
            const cleaned = this.value.replace(/\D/g, '');
            if (this.value !== cleaned) {
                this.value = cleaned;
            }
            this.setCustomValidity('');
            hideError(phoneError);
        });
        
        phoneInput.addEventListener('invalid', function(e) {
            e.preventDefault();
            if (this.validity.valueMissing) {
                showError(phoneError, 'Phone number is required.');
                this.setCustomValidity('Phone number is required.');
            } else if (this.validity.patternMismatch) {
                showError(phoneError, 'Phone number can only contain digits.');
                this.setCustomValidity('Phone number can only contain digits.');
            }
        });
        
        // Prevent non-numeric key presses
        phoneInput.addEventListener('keypress', function(e) {
            if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                e.preventDefault();
            }
        });
    }
    
    // ========================================
    // CV FILE UPLOAD
    // ========================================
    if (cvInput) {
        cvInput.addEventListener('change', function() {
            const file = this.files[0];
            const maxSize = 10 * 1024 * 1024; // 10MB
            
            // Reset states
            hideError(cvError);
            
            if (file) {
                // File size validation
                if (file.size > maxSize) {
                    showError(cvError, 'File size cannot exceed 10MB.');
                    this.value = '';
                    if (cvText) {
                        cvText.textContent = '';
                        cvText.classList.add('hidden');
                    }
                    if (cvPlaceholder) {
                        cvPlaceholder.classList.remove('hidden');
                    }
                    return;
                }
                
                // File type validation
                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                const allowedExtensions = ['.pdf', '.doc', '.docx'];
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                
                if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
                    showError(cvError, 'Only PDF, DOC or DOCX files are allowed.');
                    this.value = '';
                    if (cvText) {
                        cvText.textContent = '';
                        cvText.classList.add('hidden');
                    }
                    if (cvPlaceholder) {
                        cvPlaceholder.classList.remove('hidden');
                    }
                    return;
                }
                
                // Success - show file name
                const fileName = file.name.length > 50 ? file.name.substring(0, 47) + '...' : file.name;
                if (cvText) {
                    cvText.textContent = fileName;
                    cvText.classList.remove('hidden');
                }
                if (cvPlaceholder) {
                    cvPlaceholder.classList.add('hidden');
                }
                hideError(cvError);
            } else {
                // No file selected - show placeholder
                if (cvText) {
                    cvText.textContent = '';
                    cvText.classList.add('hidden');
                }
                if (cvPlaceholder) {
                    cvPlaceholder.classList.remove('hidden');
                }
            }
        });
    }
    
    // ========================================
    // TEXTAREA AUTO-RESIZE & CHARACTER COUNTER
    // ========================================
    if (messageTextarea) {
        messageTextarea.addEventListener('input', function() {
            // Update character count
            if (charCount) {
                charCount.textContent = this.value.length;
            }
            
            // Auto-resize textarea
            this.style.height = '48px'; // Reset to minimum
            const scrollHeight = this.scrollHeight;
            this.style.height = `${Math.max(48, scrollHeight)}px`;
        });
    }
    
    // ========================================
    // FORM SUBMISSION - NETLIFY
    // ========================================
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Hide previous messages
            if (formSuccess) formSuccess.classList.add('hidden');
            if (formError) formError.classList.add('hidden');
            
            // Reset all field errors
            hideError(nameError);
            hideError(emailError);
            hideError(phoneError);
            hideError(cvError);
            
            // Get form values
            const name = nameInput?.value.trim() || '';
            const email = emailInput?.value.trim() || '';
            const phone = phoneInput?.value.trim() || '';
            
            // Validate required fields
            let hasErrors = false;
            
            if (!name) {
                showError(nameError, 'Full name is required.');
                nameInput?.focus();
                hasErrors = true;
            }
            
            if (!email) {
                showError(emailError, 'Email is required.');
                if (!hasErrors) emailInput?.focus();
                hasErrors = true;
            } else {
                // Email format validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showError(emailError, 'Please enter a valid email address.');
                    if (!hasErrors) emailInput?.focus();
                    hasErrors = true;
                }
            }
            
            if (!phone) {
                showError(phoneError, 'Phone number is required.');
                if (!hasErrors) phoneInput?.focus();
                hasErrors = true;
            } else if (!/^\d+$/.test(phone)) {
                showError(phoneError, 'Phone number can only contain digits.');
                if (!hasErrors) phoneInput?.focus();
                hasErrors = true;
            }
            
            if (hasErrors) {
                return false;
            }
            
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
            }
            if (submitText) submitText.textContent = 'Submitting...';
            
            try {
                // Create FormData for file upload
                const formData = new FormData(form);
                
                // Submit to Netlify
                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    // Success
                    if (formSuccess) {
                        formSuccess.classList.remove('hidden');
                        lucide.createIcons();
                    }
                    
                    // Reset form
                    form.reset();
                    if (charCount) charCount.textContent = '0';
                    if (messageTextarea) messageTextarea.style.height = '48px';
                    if (cvText) {
                        cvText.textContent = '';
                        cvText.classList.add('hidden');
                    }
                    if (cvPlaceholder) {
                        cvPlaceholder.classList.remove('hidden');
                    }
                    
                    // Scroll to success message
                    formSuccess?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                if (formError) {
                    formError.classList.remove('hidden');
                    lucide.createIcons();
                }
            } finally {
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                }
                if (submitText) submitText.textContent = 'Submit Application';
            }
        });
    }
}

// Products Tab Navigation
function handleProductNavigation(hash) {
    const productId = hash.replace('#products-', '');
    
    if (PRODUCT_ITEMS.includes(productId)) {
        // Scroll to products tabs section
        const productsTabsSection = document.getElementById('products-tabs');
        const productsSection = document.getElementById('products');
        if (productsSection) {
            const offsetTop = productsSection.offsetTop - 150; // Header offset
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
        
        // Activate product after scroll
        setTimeout(() => {
            switchProduct(productId);
        }, 500);
    }
}

function switchProduct(productId) {
    // Remove active class from all tabs
    document.querySelectorAll('.product-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all product contents
    document.querySelectorAll('.product-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Hide all product images
    document.querySelectorAll('.product-image-container').forEach(image => {
        image.classList.add('hidden');
    });
    
    // Update mobile custom dropdown
    updateMobileProductDropdown(productId);
    
    // Activate selected product
    const selectedTab = document.querySelector(`[data-product="${productId}"]`);
    const selectedContent = document.getElementById(`product-content-${productId}`);
    const selectedImage = document.getElementById(`product-image-${productId}`);
    
    if (selectedTab && selectedContent) {
        selectedTab.classList.add('active');
        selectedContent.classList.remove('hidden');
        
        // Show corresponding product image if it exists
        if (selectedImage) {
            selectedImage.classList.remove('hidden');
        }
        
        // Update URL hash without triggering scroll
        if (window.location.hash !== `#products-${productId}`) {
            history.pushState(null, null, `#products-${productId}`);
        }
        
        // Re-initialize icons
        lucide.createIcons();
    }
}

// Update mobile product dropdown UI
function updateMobileProductDropdown(productId) {
    const trigger = document.getElementById('products-mobile-trigger');
    const items = document.querySelectorAll('.products-mobile-item');
    
    // Update trigger text
    if (trigger) {
        const selectedItem = document.querySelector(`.products-mobile-item[data-value="${productId}"]`);
        if (selectedItem) {
            // Get text from the span inside the button (not the icon)
            const textSpan = selectedItem.querySelector('span:not([class])') || selectedItem.querySelector('span');
            const text = textSpan?.textContent || productId;
            const selectedText = trigger.querySelector('.selected-text');
            if (selectedText) {
                selectedText.textContent = text;
            }
        }
    }
    
    // Update item styles
    items.forEach(item => {
        const isSelected = item.getAttribute('data-value') === productId;
        item.setAttribute('aria-selected', String(isSelected));
        
        // Remove all state classes first
        item.classList.remove('selected', 'bg-[#0061FF]', 'text-white', 'text-[#1A2F25]/80', 'hover:bg-[#EDF2FB]', 'hover:text-[#0061FF]');
        
        if (isSelected) {
            item.classList.add('selected', 'bg-[#0061FF]', 'text-white');
        } else {
            item.classList.add('text-[#1A2F25]/80', 'hover:bg-[#EDF2FB]', 'hover:text-[#0061FF]');
        }
    });
}

// Initialize products tabs
function initProductsTabs() {
    const tabs = document.querySelectorAll('.product-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const productId = this.getAttribute('data-product');
            switchProduct(productId);
        });
    });
    
    // Initialize custom mobile dropdown
    initMobileProductDropdown();
    
    // Check initial hash
    const initialHash = window.location.hash.slice(1);
    if (initialHash.startsWith('products-')) {
        const productId = initialHash.replace('products-', '');
        if (PRODUCT_ITEMS.includes(productId)) {
            switchProduct(productId);
        } else {
            switchProduct('surface-cleaners');
        }
    } else {
        // Default to first product
        switchProduct('surface-cleaners');
    }
    
    // Packaging dropdowns are now handled via event delegation (setupPackagingDropdownDelegation)
    // No need to initialize them here
}

// Initialize Mobile Product Custom Dropdown - Event Delegation Pattern
function initMobileProductDropdown() {
    // This function is now just a placeholder for compatibility
    // All logic is handled via event delegation in setupMobileProductDropdownDelegation()
}

// Global state for mobile product dropdown
let mobileProductDropdownState = {
    touchHandled: false,
    clickTimeout: null,
    itemTouchHandled: new Map(),
    itemClickTimeout: new Map()
};

// Global event delegation for mobile product dropdown
function setupMobileProductDropdownDelegation() {
    // Touch handling for trigger
    document.body.addEventListener('touchstart', (e) => {
        const trigger = e.target.closest('#products-mobile-trigger');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            
            mobileProductDropdownState.touchHandled = true;
            if (mobileProductDropdownState.clickTimeout) {
                clearTimeout(mobileProductDropdownState.clickTimeout);
                mobileProductDropdownState.clickTimeout = null;
            }
            
            const menu = document.getElementById('products-mobile-menu');
            if (!menu) return;
            
            const isOpen = menu.classList.contains('show');
            if (isOpen) {
                closeMobileProductDropdown();
            } else {
                openMobileProductDropdown();
            }
            
            mobileProductDropdownState.clickTimeout = setTimeout(() => {
                mobileProductDropdownState.touchHandled = false;
            }, 300);
        }
    }, { passive: false });
    
    // Click handling for trigger
    document.body.addEventListener('click', (e) => {
        const trigger = e.target.closest('#products-mobile-trigger');
        if (trigger) {
            // If we just handled a touch, ignore this click
            if (mobileProductDropdownState.touchHandled) {
                mobileProductDropdownState.touchHandled = false;
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            const menu = document.getElementById('products-mobile-menu');
            if (!menu) return;
            
            const isOpen = menu.classList.contains('show');
            if (isOpen) {
                closeMobileProductDropdown();
            } else {
                openMobileProductDropdown();
            }
        }
    });
    
    // Touch handling for items
    document.body.addEventListener('touchstart', (e) => {
        const item = e.target.closest('.products-mobile-item');
        if (item) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = item.getAttribute('data-value');
            if (!productId) return;
            
            mobileProductDropdownState.itemTouchHandled.set(productId, true);
            if (mobileProductDropdownState.itemClickTimeout.has(productId)) {
                clearTimeout(mobileProductDropdownState.itemClickTimeout.get(productId));
            }
            
            closeMobileProductDropdown();
            switchProduct(productId);
            
            mobileProductDropdownState.itemClickTimeout.set(productId, setTimeout(() => {
                mobileProductDropdownState.itemTouchHandled.delete(productId);
            }, 300));
        }
    }, { passive: false });
    
    // Click handling for items
    document.body.addEventListener('click', (e) => {
        const item = e.target.closest('.products-mobile-item');
        if (item) {
            const productId = item.getAttribute('data-value');
            if (!productId) return;
            
            // If we just handled a touch, ignore this click
            if (mobileProductDropdownState.itemTouchHandled.get(productId)) {
                mobileProductDropdownState.itemTouchHandled.delete(productId);
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            closeMobileProductDropdown();
            switchProduct(productId);
        }
    });
    
    // Close dropdown when clicking outside
    document.body.addEventListener('click', (e) => {
        // Don't close if clicking on trigger or menu
        if (e.target.closest('.products-mobile-dropdown-wrapper')) {
            return;
        }
        
        // Don't close if clicking on packaging dropdown
        if (e.target.closest('.packaging-dropdown-wrapper')) {
            return;
        }
        
        // Don't close if we just opened the menu
        if (mobileProductDropdownOpening) {
            return;
        }
        
        closeMobileProductDropdown();
    }, true);
    
    document.body.addEventListener('touchstart', (e) => {
        // Don't close if clicking on trigger or menu
        if (e.target.closest('.products-mobile-dropdown-wrapper')) {
            return;
        }
        
        // Don't close if clicking on packaging dropdown
        if (e.target.closest('.packaging-dropdown-wrapper')) {
            return;
        }
        
        // Don't close if we just opened the menu
        if (mobileProductDropdownOpening) {
            return;
        }
        
        closeMobileProductDropdown();
    }, true);
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileProductDropdown();
        }
    });
}

// Global flag to prevent immediate closing
let mobileProductDropdownOpening = false;

// Open mobile product dropdown
function openMobileProductDropdown() {
    const trigger = document.getElementById('products-mobile-trigger');
    const menu = document.getElementById('products-mobile-menu');
    
    if (!trigger || !menu) {
        console.warn('Mobile product dropdown elements not found when opening');
        return;
    }
    
    console.log('Opening mobile product dropdown');
    
    // Set flag to prevent immediate closing
    mobileProductDropdownOpening = true;
    setTimeout(() => {
        mobileProductDropdownOpening = false;
    }, 100);
    
    // Remove any conflicting Tailwind classes and inline styles
    menu.classList.remove('opacity-0', 'invisible', 'hidden');
    
    // Add show class
    menu.classList.add('show');
    trigger.classList.add('active');
    trigger.setAttribute('aria-expanded', 'true');
    
    // Force visibility with inline styles as backup
    requestAnimationFrame(() => {
        if (menu.classList.contains('show')) {
            menu.style.opacity = '1';
            menu.style.visibility = 'visible';
            menu.style.transform = 'translateY(0)';
            menu.style.display = 'block';
            menu.style.zIndex = '10000';
            menu.style.position = 'absolute';
        }
    });
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Close mobile product dropdown
function closeMobileProductDropdown() {
    const trigger = document.getElementById('products-mobile-trigger');
    const menu = document.getElementById('products-mobile-menu');
    
    if (!trigger || !menu) return;
    
    console.log('Closing mobile product dropdown');
    
    menu.classList.remove('show');
    trigger.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
    
    // Ensure menu is hidden after transition
    setTimeout(() => {
        if (!menu.classList.contains('show')) {
            menu.style.opacity = '';
            menu.style.visibility = '';
            menu.style.transform = '';
        }
    }, 300); // Wait for transition to complete
}

// Custom Packaging Dropdown - Event Delegation Pattern
function initPackagingDropdowns() {
    // This function is now just a placeholder for compatibility
    // All logic is handled via event delegation in setupPackagingDropdownDelegation()
}

// Global event delegation for packaging dropdowns
function setupPackagingDropdownDelegation() {
    // Click handler - delegation on document.body
    document.body.addEventListener('click', (e) => {
        // Check if clicked on packaging dropdown trigger
        const trigger = e.target.closest('.packaging-dropdown-trigger');
        if (trigger) {
            e.stopPropagation();
            
            const wrapper = trigger.closest('.packaging-dropdown-wrapper');
            if (!wrapper) return;
            
            const menu = wrapper.querySelector('.packaging-dropdown-menu');
            if (!menu) return;
            
            // Close other dropdowns first
            document.querySelectorAll('.packaging-dropdown-menu.show').forEach(m => {
                if (m !== menu) {
                    m.classList.remove('show');
                    m.closest('.packaging-dropdown-wrapper')?.querySelector('.packaging-dropdown-trigger')?.classList.remove('active');
                    m.closest('.packaging-dropdown-wrapper')?.querySelector('.packaging-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current dropdown
            const isOpen = menu.classList.contains('show');
            menu.classList.toggle('show');
            trigger.classList.toggle('active');
            const willBeOpen = !isOpen;
            trigger.setAttribute('aria-expanded', willBeOpen);
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Check if clicked on packaging dropdown item
        const item = e.target.closest('.packaging-dropdown-item');
        if (item) {
            e.stopPropagation();
            
            const wrapper = item.closest('.packaging-dropdown-wrapper');
            if (!wrapper) return;
            
            const menu = wrapper.querySelector('.packaging-dropdown-menu');
            const trigger = wrapper.querySelector('.packaging-dropdown-trigger');
            const selectedText = trigger?.querySelector('.selected-text');
            
            if (!menu || !trigger) return;
            
            const value = item.getAttribute('data-value');
            const text = item.querySelector('span')?.textContent || value;
            
            // Update selected state
            wrapper.querySelectorAll('.packaging-dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Update trigger text
            if (selectedText) {
                selectedText.textContent = text;
            }
            
            // Close dropdown
            menu.classList.remove('show');
            trigger.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Click outside - close all packaging dropdowns
        if (!e.target.closest('.packaging-dropdown-wrapper')) {
            document.querySelectorAll('.packaging-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
                menu.closest('.packaging-dropdown-wrapper')?.querySelector('.packaging-dropdown-trigger')?.classList.remove('active');
                menu.closest('.packaging-dropdown-wrapper')?.querySelector('.packaging-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            });
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.packaging-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
                menu.closest('.packaging-dropdown-wrapper')?.querySelector('.packaging-dropdown-trigger')?.classList.remove('active');
                menu.closest('.packaging-dropdown-wrapper')?.querySelector('.packaging-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            });
        }
    });
}

// Parallax effect for product images (excluding right column images)
function initProductParallax() {
    const productImages = document.querySelectorAll('.product-image[data-parallax="true"]');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        productImages.forEach(img => {
            // Skip parallax for images in the right column (product-image-container)
            if (img.closest('.product-image-container')) {
                img.style.transform = 'none';
                return;
            }
            
            const rect = img.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                const speed = 0.1;
                const yPos = -(scrollY * speed);
                img.style.transform = `translateY(${yPos}px)`;
            }
        });
    });
}


// Hash change listener (update to include products)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('products-')) {
        const productId = hash.replace('products-', '');
        if (PRODUCT_ITEMS.includes(productId)) {
            handleProductNavigation(`#${hash}`);
        }
    } else if (CORPORATE_TABS.includes(hash)) {
        handleCorporateTabNavigation(`#${hash}`);
    }
});

// ============================================
// CONTACT FORM FUNCTIONALITY
// ============================================

// Multi-language translations for contact form
const contactTranslations = {
    tr: {
        contact: {
            title: 'İletişim',
            subtitle: 'Toptan satış siparişleri ve bayilik başvuruları için formu doldurun.',
            companyTagline: 'Profesyonel Temizlik Çözümleri',
            addressTitle: 'Fabrika & Merkez',
            addressText: 'Organize Sanayi Bölgesi 4. Cadde<br>34000 İstanbul, Türkiye',
            phoneTitle: 'Telefon',
            emailTitle: 'E-posta',
            form: {
                name: 'Ad Soyad',
                namePlaceholder: 'Adınız ve soyadınız',
                nameRequired: 'Ad soyad alanı zorunludur.',
                email: 'E-posta',
                emailPlaceholder: 'ornek@sirket.com',
                emailRequired: 'E-posta alanı zorunludur.',
                emailInvalid: 'Lütfen geçerli bir e-posta adresi girin.',
                phone: 'Telefon',
                phonePlaceholder: '+90 5XX XXX XX XX',
                phoneRequired: 'Telefon alanı zorunludur.',
                phoneInvalid: 'Lütfen geçerli bir telefon numarası girin.',
                message: 'Mesaj',
                messagePlaceholder: 'Mesajınızı buraya yazın...',
                messageRequired: 'Mesaj alanı zorunludur.',
                marketing: 'Kampanya ve yeniliklerden haberdar olmak istiyorum.',
                kvkk: 'Bu formu doldurarak, kişisel verilerinizin işlenmesine ve',
                kvkkLink: 'Gizlilik Politikamıza',
                kvkkEnd: 'onay vermiş olursunuz.',
                submit: 'Mesaj Gönder',
                submitting: 'Gönderiliyor...',
                successTitle: 'Mesajınız başarıyla gönderildi!',
                successSubtitle: 'En kısa sürede size dönüş yapacağız.',
                errorTitle: 'Mesaj gönderilirken bir hata oluştu.',
                errorSubtitle: 'Lütfen daha sonra tekrar deneyin.'
            },
            modal: {
                title: 'Gizlilik Politikası',
                accept: 'Anladım'
            }
        }
    },
    en: {
        contact: {
            title: 'Contact Us',
            subtitle: 'Fill out the form for wholesale orders and dealership applications.',
            companyTagline: 'Professional Cleaning Solutions',
            addressTitle: 'Factory & Headquarters',
            addressText: 'Organized Industrial Zone 4th Street<br>34000 Istanbul, Turkey',
            phoneTitle: 'Phone',
            emailTitle: 'Email',
            form: {
                name: 'Full Name',
                namePlaceholder: 'Your full name',
                nameRequired: 'Full name is required.',
                email: 'Email',
                emailPlaceholder: 'example@company.com',
                emailRequired: 'Email is required.',
                emailInvalid: 'Please enter a valid email address.',
                phone: 'Phone',
                phonePlaceholder: '+90 5XX XXX XX XX',
                phoneRequired: 'Phone is required.',
                phoneInvalid: 'Please enter a valid phone number.',
                message: 'Message',
                messagePlaceholder: 'Write your message here...',
                messageRequired: 'Message is required.',
                marketing: 'I would like to receive updates about campaigns and new products.',
                kvkk: 'By filling out this form, you agree to our',
                kvkkLink: 'Privacy Policy',
                kvkkEnd: 'and consent to the processing of your personal data.',
                submit: 'Send Message',
                submitting: 'Sending...',
                successTitle: 'Your message has been sent successfully!',
                successSubtitle: 'We will get back to you as soon as possible.',
                errorTitle: 'An error occurred while sending your message.',
                errorSubtitle: 'Please try again later.'
            },
            modal: {
                title: 'Privacy Policy',
                accept: 'I Understand'
            }
        }
    },
    it: {
        contact: {
            title: 'Contattaci',
            subtitle: 'Compila il modulo per ordini all\'ingrosso e richieste di distribuzione.',
            companyTagline: 'Soluzioni Professionali per la Pulizia',
            addressTitle: 'Fabbrica & Sede',
            addressText: 'Zona Industriale Organizzata 4a Strada<br>34000 Istanbul, Turchia',
            phoneTitle: 'Telefono',
            emailTitle: 'Email',
            form: {
                name: 'Nome Completo',
                namePlaceholder: 'Il tuo nome completo',
                nameRequired: 'Il nome completo è obbligatorio.',
                email: 'Email',
                emailPlaceholder: 'esempio@azienda.com',
                emailRequired: 'L\'email è obbligatoria.',
                emailInvalid: 'Inserisci un indirizzo email valido.',
                phone: 'Telefono',
                phonePlaceholder: '+90 5XX XXX XX XX',
                phoneRequired: 'Il telefono è obbligatorio.',
                phoneInvalid: 'Inserisci un numero di telefono valido.',
                message: 'Messaggio',
                messagePlaceholder: 'Scrivi il tuo messaggio qui...',
                messageRequired: 'Il messaggio è obbligatorio.',
                marketing: 'Desidero ricevere aggiornamenti su campagne e nuovi prodotti.',
                kvkk: 'Compilando questo modulo, accetti la nostra',
                kvkkLink: 'Politica sulla Privacy',
                kvkkEnd: 'e acconsenti al trattamento dei tuoi dati personali.',
                submit: 'Invia Messaggio',
                submitting: 'Invio in corso...',
                successTitle: 'Il tuo messaggio è stato inviato con successo!',
                successSubtitle: 'Ti risponderemo il prima possibile.',
                errorTitle: 'Si è verificato un errore durante l\'invio del messaggio.',
                errorSubtitle: 'Riprova più tardi.'
            },
            modal: {
                title: 'Politica sulla Privacy',
                accept: 'Ho Capito'
            }
        }
    },
    de: {
        contact: {
            title: 'Kontakt',
            subtitle: 'Füllen Sie das Formular für Großhandelsbestellungen und Händlerbewerbungen aus.',
            companyTagline: 'Professionelle Reinigungslösungen',
            addressTitle: 'Fabrik & Hauptsitz',
            addressText: 'Organisierte Industriezone 4. Straße<br>34000 Istanbul, Türkei',
            phoneTitle: 'Telefon',
            emailTitle: 'E-Mail',
            form: {
                name: 'Vollständiger Name',
                namePlaceholder: 'Ihr vollständiger Name',
                nameRequired: 'Der vollständige Name ist erforderlich.',
                email: 'E-Mail',
                emailPlaceholder: 'beispiel@firma.com',
                emailRequired: 'E-Mail ist erforderlich.',
                emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
                phone: 'Telefon',
                phonePlaceholder: '+90 5XX XXX XX XX',
                phoneRequired: 'Telefon ist erforderlich.',
                phoneInvalid: 'Bitte geben Sie eine gültige Telefonnummer ein.',
                message: 'Nachricht',
                messagePlaceholder: 'Schreiben Sie hier Ihre Nachricht...',
                messageRequired: 'Nachricht ist erforderlich.',
                marketing: 'Ich möchte Updates zu Kampagnen und neuen Produkten erhalten.',
                kvkk: 'Durch das Ausfüllen dieses Formulars stimmen Sie unserer',
                kvkkLink: 'Datenschutzrichtlinie',
                kvkkEnd: 'zu und willigen in die Verarbeitung Ihrer personenbezogenen Daten ein.',
                submit: 'Nachricht Senden',
                submitting: 'Wird gesendet...',
                successTitle: 'Ihre Nachricht wurde erfolgreich gesendet!',
                successSubtitle: 'Wir werden uns so schnell wie möglich bei Ihnen melden.',
                errorTitle: 'Beim Senden Ihrer Nachricht ist ein Fehler aufgetreten.',
                errorSubtitle: 'Bitte versuchen Sie es später erneut.'
            },
            modal: {
                title: 'Datenschutzrichtlinie',
                accept: 'Verstanden'
            }
        }
    }
};

// Get current language
function getCurrentLanguage() {
    let lang = localStorage.getItem('language');
    if (lang !== 'tr' && lang !== 'en' && lang !== 'it' && lang !== 'de') {
        lang = 'en'; // Default to English
    }
    return lang;
}

// Translation helper function for contact form
function t(key) {
    const currentLang = getCurrentLanguage();
    const keys = key.split('.');
    let value = contactTranslations[currentLang];
    for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
    }
    return value || key;
}

// Update contact form texts based on language
// Uses non-destructive text node updates
function updateContactTexts() {
    const elements = {
        'contactTitle': t('contact.title'),
        'contactSubtitle': t('contact.subtitle'),
        'companyTagline': t('contact.companyTagline'),
        'addressTitle': t('contact.addressTitle'),
        'phoneTitle': t('contact.phoneTitle'),
        'emailTitle': t('contact.emailTitle'),
        'marketingLabel': t('contact.form.marketing'),
        'contact-submit-text': t('contact.form.submit'),
        'successTitle': t('contact.form.successTitle'),
        'successSubtitle': t('contact.form.successSubtitle'),
        'errorTitle': t('contact.form.errorTitle'),
        'errorSubtitle': t('contact.form.errorSubtitle'),
        'kvkkModalTitle': t('contact.modal.title'),
        'kvkkAcceptText': t('contact.modal.accept')
    };
    
    for (const [id, text] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    
    // Update labels with required asterisk - non-destructive
    const updateLabelWithAsterisk = (labelElement, text) => {
        if (!labelElement) return;
        const existingSpan = labelElement.querySelector('span.text-red-500');
        const textNodes = Array.from(labelElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        if (textNodes.length > 0) {
            textNodes[0].nodeValue = text + ' ';
        } else {
            labelElement.textContent = text + ' ';
        }
        if (!existingSpan) {
            const asterisk = document.createElement('span');
            asterisk.className = 'text-red-500';
            asterisk.textContent = '*';
            labelElement.appendChild(asterisk);
        }
    };
    
    updateLabelWithAsterisk(document.getElementById('nameLabel'), t('contact.form.name'));
    updateLabelWithAsterisk(document.getElementById('emailLabel'), t('contact.form.email'));
    updateLabelWithAsterisk(document.getElementById('phoneLabel'), t('contact.form.phone'));
    updateLabelWithAsterisk(document.getElementById('messageLabel'), t('contact.form.message'));
    
    // Update placeholders
    const nameInput = document.getElementById('contact-name');
    if (nameInput) nameInput.placeholder = t('contact.form.namePlaceholder');
    
    const emailInput = document.getElementById('contact-email');
    if (emailInput) emailInput.placeholder = t('contact.form.emailPlaceholder');
    
    const phoneInput = document.getElementById('contact-phone');
    if (phoneInput) phoneInput.placeholder = t('contact.form.phonePlaceholder');
    
    const messageInput = document.getElementById('contact-message');
    if (messageInput) messageInput.placeholder = t('contact.form.messagePlaceholder');
    
    // Update KVKK text - use dedicated container for HTML
    const kvkkText = document.getElementById('kvkkText');
    if (kvkkText) {
        let container = kvkkText.querySelector('[data-kvkk-container]');
        if (!container) {
            container = document.createElement('span');
            container.setAttribute('data-kvkk-container', '');
            kvkkText.appendChild(container);
        }
        container.innerHTML = `${t('contact.form.kvkk')} <button type="button" id="kvkkLink" class="underline text-[#0061FF] hover:text-[#0052E6] transition-colors font-medium">${t('contact.form.kvkkLink')}</button> ${t('contact.form.kvkkEnd')}`;
        // Event delegation handles this, no need to re-attach
    }
    
    // Update address text - use dedicated container for HTML
    const addressText = document.getElementById('addressText');
    if (addressText) {
        let container = addressText.querySelector('[data-address-container]');
        if (!container) {
            container = document.createElement('span');
            container.setAttribute('data-address-container', '');
            addressText.appendChild(container);
        }
        container.innerHTML = t('contact.addressText');
    }
}

// KVKK Modal Functions
function openKvkkModal(event) {
    if (event) event.preventDefault();
    const kvkkModal = document.getElementById('kvkkModal');
    if (kvkkModal) {
        kvkkModal.classList.remove('hidden');
        kvkkModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function closeKvkkModal() {
    const kvkkModal = document.getElementById('kvkkModal');
    if (kvkkModal) {
        kvkkModal.classList.add('hidden');
        kvkkModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

// Initialize Contact Form
function initContactForm() {
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const phoneInput = document.getElementById('contact-phone');
    const messageInput = document.getElementById('contact-message');
    const marketingCheckbox = document.getElementById('marketingOptInCheckbox');
    const marketingHidden = document.getElementById('isMarketingOptIn');
    const submitBtn = document.getElementById('contact-submit-btn');
    const submitText = document.getElementById('contact-submit-text');
    const formSuccess = document.getElementById('contact-form-success');
    const formError = document.getElementById('contact-form-error');
    const kvkkLink = document.getElementById('kvkkLink');
    const kvkkModal = document.getElementById('kvkkModal');
    const kvkkModalClose = document.getElementById('kvkkModalClose');
    const kvkkModalAccept = document.getElementById('kvkkModalAccept');
    
    // ========================================
    // KVKK MODAL HANDLERS
    // ========================================
    // Event delegation handles these - no need for direct listeners
    
    // Close modal on backdrop click
    if (kvkkModal) {
        kvkkModal.addEventListener('click', (event) => {
            if (event.target === kvkkModal || event.target.classList.contains('bg-black/50')) {
                closeKvkkModal();
            }
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeKvkkModal();
        }
    });
    
    // ========================================
    // PHONE INPUT CLEANING
    // ========================================
    if (phoneInput) {
        // Input event - clean as user types
        phoneInput.addEventListener('input', function(e) {
            // Only allow digits, +, space, and hyphen
            this.value = this.value.replace(/[^0-9+\s\-]/g, '');
            this.setCustomValidity('');
        });
        
        // Paste event - clean pasted content
        phoneInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const cleanedText = pastedText.replace(/[^0-9+\s\-]/g, '');
            
            // Insert at cursor position
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const currentValue = this.value;
            this.value = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
            
            // Move cursor to end of pasted content
            const newCursorPos = start + cleanedText.length;
            this.setSelectionRange(newCursorPos, newCursorPos);
        });
        
        // Invalid event - custom validation message
        phoneInput.addEventListener('invalid', function(e) {
            e.preventDefault();
            if (this.validity.valueMissing) {
                this.setCustomValidity(t('contact.form.phoneRequired'));
            } else if (this.validity.patternMismatch) {
                this.setCustomValidity(t('contact.form.phoneInvalid'));
            }
        });
    }
    
    // ========================================
    // NAME INPUT VALIDATION
    // ========================================
    if (nameInput) {
        nameInput.addEventListener('invalid', function(e) {
            e.preventDefault();
            if (this.validity.valueMissing) {
                this.setCustomValidity(t('contact.form.nameRequired'));
            }
        });
        
        nameInput.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    }
    
    // ========================================
    // EMAIL INPUT VALIDATION
    // ========================================
    if (emailInput) {
        emailInput.addEventListener('invalid', function(e) {
            e.preventDefault();
            if (this.validity.valueMissing) {
                this.setCustomValidity(t('contact.form.emailRequired'));
            } else if (this.validity.typeMismatch) {
                this.setCustomValidity(t('contact.form.emailInvalid'));
            }
        });
        
        emailInput.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    }
    
    // ========================================
    // MESSAGE INPUT VALIDATION
    // ========================================
    if (messageInput) {
        messageInput.addEventListener('invalid', function(e) {
            e.preventDefault();
            if (this.validity.valueMissing) {
                this.setCustomValidity(t('contact.form.messageRequired'));
            }
        });
        
        messageInput.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    }
    
    // ========================================
    // MARKETING OPT-IN HANDLING
    // ========================================
    if (marketingCheckbox && marketingHidden) {
        marketingCheckbox.addEventListener('change', function() {
            marketingHidden.value = this.checked ? 'true' : 'false';
        });
    }
    
    // ========================================
    // FORM SUBMISSION - NETLIFY
    // ========================================
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Hide previous messages
            if (formSuccess) formSuccess.classList.add('hidden');
            if (formError) formError.classList.add('hidden');
            
            // Update marketing opt-in value before submit
            if (marketingCheckbox && marketingHidden) {
                marketingHidden.value = marketingCheckbox.checked ? 'true' : 'false';
            }
            
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
            }
            if (submitText) submitText.textContent = t('contact.form.submitting');
            
            try {
                // Create FormData
                const formData = new FormData(form);
                
                // Submit to Netlify
                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    // Success
                    if (formSuccess) {
                        formSuccess.classList.remove('hidden');
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                    
                    // Reset form
                    form.reset();
                    if (marketingHidden) marketingHidden.value = 'false';
                    
                    // Scroll to success message
                    formSuccess?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                if (formError) {
                    formError.classList.remove('hidden');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            } finally {
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                }
                if (submitText) submitText.textContent = t('contact.form.submit');
            }
        });
    }
    
    // Initialize texts based on current language
    updateContactTexts();
}

// ============================================
// LANGUAGE SWITCHER FUNCTIONALITY
// ============================================

function initLanguageSwitcher() {
    // Desktop language switcher
    const desktopButton = document.getElementById('language-switcher-desktop-button');
    const desktopDropdown = document.getElementById('language-switcher-desktop-dropdown');
    const desktopOptions = document.querySelectorAll('#language-switcher-desktop .lang-option');
    
    if (desktopButton && desktopDropdown) {
        let isOpen = false;
        
        // Toggle dropdown
        desktopButton.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            
            if (isOpen) {
                desktopDropdown.classList.remove('opacity-0', 'invisible', 'pointer-events-none');
                desktopDropdown.classList.add('opacity-100', 'visible');
                desktopDropdown.style.transform = 'translateY(0)';
                const chevron = desktopButton.querySelector('[data-lucide="chevron-down"]');
                if (chevron) {
                    chevron.style.transform = 'rotate(180deg)';
                }
            } else {
                desktopDropdown.classList.add('opacity-0', 'invisible', 'pointer-events-none');
                desktopDropdown.classList.remove('opacity-100', 'visible');
                desktopDropdown.style.transform = 'translateY(-10px)';
                const chevron = desktopButton.querySelector('[data-lucide="chevron-down"]');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // Handle language selection
        desktopOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                e.stopPropagation();
                const lang = option.dataset.lang;
                if (window.i18n && lang) {
                    await window.i18n.setLanguage(lang);
                    isOpen = false;
                    desktopDropdown.classList.add('opacity-0', 'invisible', 'pointer-events-none');
                    desktopDropdown.classList.remove('opacity-100', 'visible');
                    desktopDropdown.style.transform = 'translateY(-10px)';
                    const chevron = desktopButton.querySelector('[data-lucide="chevron-down"]');
                    if (chevron) {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!desktopButton.contains(e.target) && !desktopDropdown.contains(e.target)) {
                isOpen = false;
                desktopDropdown.classList.add('opacity-0', 'invisible', 'pointer-events-none');
                desktopDropdown.classList.remove('opacity-100', 'visible');
                desktopDropdown.style.transform = 'translateY(-10px)';
                const chevron = desktopButton.querySelector('[data-lucide="chevron-down"]');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });
    }
    
    // Mobile language switcher
    const mobileButtons = document.querySelectorAll('#language-switcher-mobile .lang-btn');
    
    mobileButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const lang = btn.dataset.lang;
            if (window.i18n && lang) {
                await window.i18n.setLanguage(lang);
            }
        });
    });
}

// ============================================
// GLOBAL EVENT DELEGATION SETUP
// All interactive elements use event delegation on document.body
// This ensures functionality works even if DOM is modified by i18n
// ============================================

let eventDelegationSetup = false;

// Contact form and KVKK modal event delegation
function setupContactFormDelegation() {
    // KVKK link click
    document.body.addEventListener('click', (e) => {
        const kvkkLink = e.target.closest('#kvkkLink');
        if (kvkkLink) {
            e.preventDefault();
            openKvkkModal(e);
        }
        
        // KVKK modal close buttons
        const kvkkModalClose = e.target.closest('#kvkkModalClose, #kvkkModalAccept');
        if (kvkkModalClose) {
            e.preventDefault();
            closeKvkkModal();
        }
        
        // KVKK modal backdrop click
        const kvkkModal = e.target.closest('#kvkkModal');
        if (kvkkModal && e.target === kvkkModal) {
            closeKvkkModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const kvkkModal = document.getElementById('kvkkModal');
            if (kvkkModal && !kvkkModal.classList.contains('hidden')) {
                closeKvkkModal();
            }
        }
    });
}

function setupAllEventDelegation() {
    // Only setup once - event delegation persists even if DOM changes
    if (eventDelegationSetup) return;
    eventDelegationSetup = true;
    
    // Setup all event delegation handlers
    setupNavDropdownDelegation();
    setupPackagingDropdownDelegation();
    setupMobileMenuDelegation();
    setupMobileProductDropdownDelegation();
    setupContactFormDelegation();
}

// ============================================
// INITIALIZATION
// ============================================

async function initAll() {
    // Setup event delegation once (never needs re-initialization)
    setupAllEventDelegation();
    
    // Initialize i18n if available
    if (window.i18n && typeof window.i18n.initLanguage === 'function') {
        try {
            const currentLang = window.i18n.getCurrentLanguage();
            if (!currentLang || currentLang === 'en') {
                await window.i18n.initLanguage();
            }
        } catch (error) {
            console.warn('Error ensuring i18n is ready:', error);
        }
    }
    
    // Initialize icons
    const initIcons = () => {
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            try {
                lucide.createIcons();
            } catch (e) {
                console.warn('Error initializing icons:', e);
            }
        }
    };
    
    initIcons();
    
    // Initialize language switcher
    initLanguageSwitcher();
    
    // Visual setup only (event handling is via delegation)
    initNavbarAnimation();
    initDesktopDropdowns();
    initMobileMenu();
    initEnhancedNavigation();
    
    // Initialize functionality
    initCorporateTabs();
    initApplicationForm();
    initProductsTabs();
    initProductParallax();
    initContactForm();
    
    // Re-initialize icons for dynamically added content
    setTimeout(initIcons, 100);
    setTimeout(initIcons, 500);
}

// Export initAll to window
if (typeof window !== 'undefined') {
    window.initAll = initAll;
    
    // Listen for language change events - only re-initialize icons
    // Event delegation persists, so no need to re-setup
    window.addEventListener('languagechange', () => {
        setTimeout(() => {
            if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        }, 50);
    });
}

// Initialize when DOM is ready
// Check if DOM is already loaded (for dynamic imports)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for Lucide to be available
        const waitForLucide = async () => {
            if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                await initAll();
            } else {
                setTimeout(waitForLucide, 50);
            }
        };
        waitForLucide();
    });
} else {
    // DOM already loaded, wait for Lucide
    const waitForLucide = async () => {
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            await initAll();
        } else {
            setTimeout(waitForLucide, 50);
        }
    };
    waitForLucide();
}

// Also initialize on window load as a fallback
window.addEventListener('load', () => {
    setTimeout(() => {
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }
    }, 100);
});

