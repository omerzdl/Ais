// ============================================
// I18N (Internationalization) System
// NON-DESTRUCTIVE: Only updates text nodes, never uses innerHTML on target elements
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
    if (window.location.hostname === 'omerzdl.github.io' || 
        window.location.pathname.startsWith('/Ais')) {
        return '/Ais';
    }
    return '';
}

// Load translation file
async function loadTranslations(lang) {
    try {
        const basePath = getBasePath();
        let response = await fetch(`${basePath}/translations/${lang}.json`);
        if (!response.ok) {
            response = await fetch(`${basePath}/src/translations/${lang}.json`);
        }
        if (!response || !response.ok) {
            throw new Error(`Failed to load translations for ${lang}`);
        }
        translations[lang] = await response.json();
        return translations[lang];
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        if (lang !== DEFAULT_LANGUAGE) {
            return await loadTranslations(DEFAULT_LANGUAGE);
        }
        return {};
    }
}

// Get translation by key path
function t(key, params = {}) {
    // Hata kontrolü: key null/undefined ise key'i döndür (boş string değil)
    if (!key || key === null || key === undefined) {
        return key || '';
    }
    
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            if (currentLanguage !== DEFAULT_LANGUAGE) {
                value = translations[DEFAULT_LANGUAGE];
                for (const k2 of keys) {
                    if (value && typeof value === 'object') {
                        value = value[k2];
                    } else {
                        // Çeviri bulunamadı - key'i döndür (debug için)
                        return key;
                    }
                }
            } else {
                // Çeviri bulunamadı - key'i döndür (debug için)
                return key;
            }
        }
    }
    
    // Hata kontrolü: value null/undefined ise key'i döndür (boş string değil)
    if (value === null || value === undefined) {
        return key;
    }
    
    if (typeof value !== 'string') {
        return key;
    }
    
    const result = value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
    });
    
    // Son kontrol: result null/undefined veya boş string ise key'i döndür (debug için)
    // Boş string sorunu gizliyor, key görmek daha iyi
    if (!result || result.trim() === '') {
        return key;
    }
    
    return result;
}

// Get current language
function getCurrentLanguage() {
    return currentLanguage;
}

// ============================================
// NON-DESTRUCTIVE TEXT NODE UPDATES
// ALTIN KURAL: Sadece text node'ları (nodeType === 3) güncelle
// HTML taglerine (<svg>, <img>, <span>, vb.) ASLA dokunma
// ============================================

/**
 * Recursively finds the first non-empty text node within an element
 * This function searches through child elements to find the actual text content
 * BLACKLIST: Never enters SVG, icon, or image elements to preserve their structure
 * 
 * @param {Node} node - Starting node to search from
 * @returns {Text|null} - First non-empty text node found, or null
 */
function findTextNodeRecursively(node) {
    // BLACKLIST: Yasaklı elementler - ASLA içine girme
    // Lucide ikonları için data-lucide attribute'lu elementler de dahil
    const BLACKLIST = ['SVG', 'PATH', 'G', 'CIRCLE', 'RECT', 'USE', 'IMG', 'I', 'LINE', 'POLYLINE', 'POLYGON', 'ELLIPSE'];
    
    // If this is a text node and it has non-empty content, return it
    if (node.nodeType === Node.TEXT_NODE) {
        const trimmed = node.nodeValue ? node.nodeValue.trim() : '';
        if (trimmed.length > 0) {
            return node;
        }
    }
    
    // If this is an element node, check BLACKLIST first
    if (node.nodeType === Node.ELEMENT_NODE) {
        // BLACKLIST kontrolü: Eğer bu element yasaklı listede ise, içine girme
        if (node.tagName && BLACKLIST.includes(node.tagName.toUpperCase())) {
            return null; // Bu dalı tamamen atla
        }
        
        // Lucide ikonlarını koru: data-lucide attribute'u olan elementlere dokunma
        if (node.hasAttribute && node.hasAttribute('data-lucide')) {
            return null; // Lucide ikon elementi - atla
        }
        
        // lucide- class'ı olan SVG'leri de koru
        if (node.classList && (node.classList.contains('lucide') || 
            Array.from(node.classList).some(c => c.startsWith('lucide-')))) {
            return null; // Lucide SVG - atla
        }
        
        // BLACKLIST'te değilse, çocuklarını ara
        for (let i = 0; i < node.childNodes.length; i++) {
            const found = findTextNodeRecursively(node.childNodes[i]);
            if (found) {
                return found;
            }
        }
    }
    
    return null;
}

/**
 * Updates ONLY text nodes within an element, preserving ALL HTML structure
 * ROBUST: Handles complex structures like <button><svg>...</svg> <span>Text</span></button>
 * or <button><svg>...</svg> Text</button>
 * 
 * LUCIDE KORUMA: data-lucide attribute'lu elementlere ASLA dokunmaz
 * 
 * @param {Element} element - Target element with data-i18n attribute
 * @param {string} translation - Translation text (plain text, no HTML)
 */
function updateTextNodes(element, translation) {
    // Hata kontrolü: translation null/undefined ise boş string kullan
    const safeTranslation = translation || '';
    
    // 0. LUCIDE KORUMA: Element içinde Lucide ikonu var mı kontrol et
    const lucideIcons = element.querySelectorAll('[data-lucide], svg.lucide, i[data-lucide]');
    const hasLucideIcons = lucideIcons.length > 0;
    
    // 1. AKILLI TEXT NODE SEÇİMİ
    // Elementin tüm çocuklarını döngüye sok
    const allNodes = Array.from(element.childNodes);
    
    // Önce doğrudan çocuklarda non-empty text node ara
    let targetTextNode = null;
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
            const trimmed = node.nodeValue ? node.nodeValue.trim() : '';
            if (trimmed.length > 0) {
                targetTextNode = node;
                break;
            }
        }
    }
    
    // Eğer doğrudan çocuklarda bulamadıysak, recursive olarak ara
    // Bu, <button><svg>...</svg> <span>Home</span></button> gibi durumları destekler
    if (!targetTextNode) {
        for (let i = 0; i < allNodes.length; i++) {
            const found = findTextNodeRecursively(allNodes[i]);
            if (found) {
                targetTextNode = found;
                break;
            }
        }
    }
    
    // 2. FALLBACK (Güvenlik Ağı)
    if (targetTextNode) {
        // Text node bulundu - güncelle
        targetTextNode.nodeValue = safeTranslation;
        
        // Diğer boş text node'ları temizle (whitespace'leri)
        // AMA Lucide ikonlarının yanındaki whitespace'lere dikkat et
        allNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node !== targetTextNode) {
                const trimmed = node.nodeValue ? node.nodeValue.trim() : '';
                if (trimmed.length === 0) {
                    // Lucide ikonu yanındaysa whitespace'i koru (görsel ayrım için)
                    const prevSibling = node.previousSibling;
                    const nextSibling = node.nextSibling;
                    const isNearIcon = (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE && 
                                        (prevSibling.hasAttribute('data-lucide') || 
                                         prevSibling.tagName === 'SVG' ||
                                         prevSibling.classList?.contains('lucide'))) ||
                                       (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE && 
                                        (nextSibling.hasAttribute?.('data-lucide') || 
                                         nextSibling.tagName === 'SVG' ||
                                         nextSibling.classList?.contains('lucide')));
                    
                    if (!isNearIcon) {
                        // Sadece ikon yakınında değilse kaldır
                        node.remove();
                    }
                }
            }
        });
    } else {
        // Text node bulunamadı - fallback stratejileri
        const elementNodes = allNodes.filter(node => node.nodeType === Node.ELEMENT_NODE);
        
        if (elementNodes.length > 0) {
            // İkonlar var ama Text Node yok - yeni bir Text Node oluştur
            // Lucide ikonları varsa, ikonun SONRASINA ekle (önemli!)
            if (hasLucideIcons) {
                // Son Lucide ikonundan sonra text ekle
                const lastIcon = lucideIcons[lucideIcons.length - 1];
                const textNode = document.createTextNode(' ' + safeTranslation);
                if (lastIcon.nextSibling) {
                    element.insertBefore(textNode, lastIcon.nextSibling);
                } else {
                    element.appendChild(textNode);
                }
            } else {
                // Normal durum - sona ekle
                element.appendChild(document.createTextNode(safeTranslation));
            }
        } else {
            // Hiç çocuk yok - textContent kullan (güvenli fallback)
            element.textContent = safeTranslation;
        }
    }
}

/**
 * Handles HTML content in translations using a dedicated container
 * This prevents innerHTML from destroying the main element's structure
 * 
 * @param {Element} element - Target element with data-i18n-html attribute
 * @param {string} translation - Translation text (may contain HTML like <b>bold</b>)
 */
function updateWithHTML(element, translation) {
    // First, remove all direct text node children to prevent duplication
    // Keep only element nodes (like icons, etc.)
    const childNodes = Array.from(element.childNodes);
    childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            node.remove();
        }
    });
    
    // Find or create a dedicated container for HTML content
    // This container is separate from the main element's structure
    let htmlContainer = element.querySelector('[data-i18n-html-container]');
    
    if (!htmlContainer) {
        // Create a new container if it doesn't exist
        htmlContainer = document.createElement('span');
        htmlContainer.setAttribute('data-i18n-html-container', '');
        
        // Find all non-container child elements (preserve icons, etc.)
        const existingChildren = Array.from(element.children).filter(
            child => !child.hasAttribute('data-i18n-html-container')
        );
        
        if (existingChildren.length > 0) {
            // Insert container before first existing child (preserves order)
            element.insertBefore(htmlContainer, existingChildren[0]);
        } else {
            // No existing children - just append
            element.appendChild(htmlContainer);
        }
    }
    
    // Update ONLY the container's innerHTML (safe - it's isolated)
    // The main element's structure (dropdown-icons, etc.) remains untouched
    htmlContainer.innerHTML = translation;
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

/**
 * Updates all translatable elements on the page
 * NON-DESTRUCTIVE: Never uses innerHTML on target elements
 */
function updatePageContent() {
    // Check if translations are loaded
    if (!translations[currentLanguage] || Object.keys(translations[currentLanguage]).length === 0) {
        console.warn(`Translations for ${currentLanguage} not loaded yet`);
        return;
    }
    
    // Update elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    if (elements.length === 0) {
        console.warn('No elements with data-i18n attribute found');
        return;
    }
    
    elements.forEach(element => {
        // Skip if element has data-i18n-html (it will be handled separately)
        if (element.hasAttribute('data-i18n-html')) {
            return;
        }
        
        const key = element.getAttribute('data-i18n');
        if (!key) return;
        
        const translation = t(key);
        
        // Skip if translation is the same as key (translation not found)
        if (translation === key && key.includes('.')) {
            console.warn(`Translation not found for key: ${key}`);
        }
        
        // Handle different element types
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            // For input/textarea: update value (not placeholder here)
            if (!element.hasAttribute('data-i18n-placeholder')) {
                element.value = translation;
            }
        } else if (element.tagName === 'IMG' && element.hasAttribute('data-i18n-alt')) {
            // For images: ONLY update alt text, NEVER touch src
            element.alt = translation;
        } else {
            // Plain text: update only text nodes, preserve HTML structure
            updateTextNodes(element, translation);
        }
    });
    
    // Handle data-i18n-html elements separately
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
        const key = element.getAttribute('data-i18n-html');
        if (!key) return;
        
        // Check for data-link-id attribute to pass as parameter
        const params = {};
        const linkId = element.getAttribute('data-link-id');
        if (linkId) {
            params.linkId = linkId;
        }
        
        const translation = t(key, params);
        updateWithHTML(element, translation);
    });
    
    // Update placeholders separately (safe - attribute update)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
            element.placeholder = t(placeholderKey);
        }
    });
    
    // Update HTML attributes (safe - attribute update)
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
        const attrKey = element.getAttribute('data-i18n-attr');
        const attrName = element.getAttribute('data-i18n-attr-name') || 'title';
        const translation = t(attrKey);
        element.setAttribute(attrName, translation);
    });
    
    // ============================================
    // ÇEVIRI TAMAMLANDI - UI'A HABER VER
    // Lucide ikonları ve diğer UI bileşenlerinin yenilenmesi için
    // ============================================
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('i18n-content-updated', { 
            detail: { language: currentLanguage } 
        }));
    }
}

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

/**
 * Set language and update UI
 * NON-DESTRUCTIVE: No need to re-initialize functionality
 */
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
    
    // Update all translatable elements (non-destructive - no re-init needed)
    updatePageContent();
    
    // Update language switcher UI
    updateLanguageSwitcher();
    
    // Notify React components about language change
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));
    }
    
    // Re-initialize icons (they might need to be recreated)
    // This is safe because we only update text nodes, icons remain in DOM
    setTimeout(() => {
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            try {
                lucide.createIcons();
            } catch (e) {
                console.warn('Error initializing icons:', e);
            }
        }
    }, 50);
}

/**
 * Initialize language from storage or browser preference
 */
async function initLanguage() {
    try {
        const savedLang = localStorage.getItem(STORAGE_KEY);
        
        if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
            await setLanguage(savedLang);
            return;
        }
        
        const browserLang = navigator.language.split('-')[0].toLowerCase();
        if (SUPPORTED_LANGUAGES[browserLang]) {
            await setLanguage(browserLang);
            return;
        }
        
        await setLanguage(DEFAULT_LANGUAGE);
    } catch (error) {
        console.error('Error in initLanguage:', error);
        setTimeout(() => {
            if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        }, 100);
    }
}

/**
 * Update language switcher UI
 */
function updateLanguageSwitcher() {
    // Update desktop switcher
    const desktopSwitcher = document.getElementById('language-switcher-desktop');
    if (desktopSwitcher) {
        const currentLangElement = desktopSwitcher.querySelector('.current-lang');
        if (currentLangElement) {
            currentLangElement.textContent = currentLanguage.toUpperCase();
        }
        
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

// ============================================
// EXPORT
// ============================================

// ES Module exports
export {
    t,
    setLanguage,
    getCurrentLanguage,
    initLanguage,
    updatePageContent,
    SUPPORTED_LANGUAGES
};

// Default export (object with all functions)
const i18n = {
    t,
    setLanguage,
    getCurrentLanguage,
    initLanguage,
    updatePageContent,
    SUPPORTED_LANGUAGES
};

export default i18n;

// Also export to window for backward compatibility (non-module scripts)
try {
    window.i18n = i18n;
    console.log('i18n module initialized successfully');
} catch (error) {
    console.error('Error initializing i18n module:', error);
    window.i18n = {
        t: (key) => key,
        setLanguage: async () => {},
        getCurrentLanguage: () => 'en',
        initLanguage: async () => {},
        updatePageContent: () => {},
        SUPPORTED_LANGUAGES: {}
    };
}
