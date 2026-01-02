// ============================================
// I18N (Internationalization) System
// ============================================

const SUPPORTED_LANGUAGES = {
    en: 'English',
    tr: 'Türkçe',
    ru: 'Русский',
    sr: 'Српски',
    hr: 'Hrvatski',
    ro: 'Română'
};

const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'ais_language';

let currentLanguage = DEFAULT_LANGUAGE;
let translations = {};

// Get base path for GitHub Pages
function getBasePath() {
    // Check if we're on GitHub Pages
    if (window.location.hostname === 'omerzdl.github.io') {
        return '/Ais';
    }
    return '';
}

// Load translation file
async function loadTranslations(lang) {
    try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}/src/translations/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${lang}`);
        }
        translations[lang] = await response.json();
        return translations[lang];
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        // Fallback to English if translation fails
        if (lang !== DEFAULT_LANGUAGE) {
            return await loadTranslations(DEFAULT_LANGUAGE);
        }
        return {};
    }
}

// Get translation by key path (e.g., 'nav.home' or 'hero.title1')
function t(key, params = {}) {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            // Fallback to English if key not found
            if (currentLanguage !== DEFAULT_LANGUAGE) {
                value = translations[DEFAULT_LANGUAGE];
                for (const k2 of keys) {
                    if (value && typeof value === 'object') {
                        value = value[k2];
                    } else {
                        return key; // Return key if not found
                    }
                }
            } else {
                return key; // Return key if not found
            }
        }
    }
    
    if (typeof value !== 'string') {
        return key;
    }
    
    // Replace parameters if provided
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
    });
}

// Get current language
function getCurrentLanguage() {
    return currentLanguage;
}

// Set language and update UI
async function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES[lang]) {
        console.warn(`Language ${lang} is not supported`);
        return;
    }
    
    // Load translations if not already loaded
    if (!translations[lang]) {
        await loadTranslations(lang);
    }
    
    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update all translatable elements
    updatePageContent();
    
    // Update language switcher UI
    updateLanguageSwitcher();
    
    // Notify React components about language change
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));
    }
    
    // Re-initialize icons after content update
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Update all elements with data-i18n attribute
function updatePageContent() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            // For input elements, update value (not placeholder here)
            if (!element.hasAttribute('data-i18n-placeholder')) {
                element.value = translation;
            }
        } else if (element.tagName === 'IMG' && element.hasAttribute('data-i18n-alt')) {
            // For images, update alt text
            element.alt = translation;
        } else {
            // For other elements, update text content or innerHTML
            if (element.hasAttribute('data-i18n-html')) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Update placeholders separately (for elements with data-i18n-placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
            element.placeholder = t(placeholderKey);
        }
    });
    
    // Update HTML attributes
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
        const attrKey = element.getAttribute('data-i18n-attr');
        const attrName = element.getAttribute('data-i18n-attr-name') || 'title';
        const translation = t(attrKey);
        element.setAttribute(attrName, translation);
    });
}

// Initialize language from storage or browser preference
async function initLanguage() {
    // Try to get from localStorage
    const savedLang = localStorage.getItem(STORAGE_KEY);
    
    if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
        await setLanguage(savedLang);
        return;
    }
    
    // Try to detect from browser
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES[browserLang]) {
        await setLanguage(browserLang);
        return;
    }
    
    // Fallback to default
    await setLanguage(DEFAULT_LANGUAGE);
}

// Update language switcher UI
function updateLanguageSwitcher() {
    // Update desktop switcher
    const desktopSwitcher = document.getElementById('language-switcher-desktop');
    if (desktopSwitcher) {
        const currentLangElement = desktopSwitcher.querySelector('.current-lang');
        if (currentLangElement) {
            currentLangElement.textContent = currentLanguage.toUpperCase();
        }
        
        // Update active state in dropdown
        desktopSwitcher.querySelectorAll('.lang-option').forEach(option => {
            if (option.dataset.lang === currentLanguage) {
                option.classList.add('active');
                option.style.backgroundColor = '#F8FAFC';
                option.style.color = '#FF8C00';
                option.style.fontWeight = '600';
            } else {
                option.classList.remove('active');
                option.style.backgroundColor = '';
                option.style.color = '';
                option.style.fontWeight = '';
            }
        });
    }
    
    // Update mobile switcher
    const mobileSwitcher = document.getElementById('language-switcher-mobile');
    if (mobileSwitcher) {
        mobileSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === currentLanguage) {
                btn.classList.add('active');
                btn.style.backgroundColor = '#FF8C00';
                btn.style.color = 'white';
                btn.style.borderColor = '#FF8C00';
            } else {
                btn.classList.remove('active');
                btn.style.backgroundColor = 'white';
                btn.style.color = '#1E293B';
                btn.style.borderColor = '#E2E8F0';
            }
        });
    }
}

// Export functions for use in other scripts
window.i18n = {
    t,
    setLanguage,
    getCurrentLanguage,
    initLanguage,
    SUPPORTED_LANGUAGES
};

