/**
 * CENTRALIZOVANA KONFIGURACIJA APLIKACIJE
 * Svi config fajlovi spojeni u jedan radi boljeg upravljanja
 */

// =============================================================================
// APP KONFIGURACIJA
// =============================================================================

export const APP_CONFIG = {
    name: 'Perfect Shine',
    version: '1.0.0',
    environment: 'production',
    debug: false
};

// =============================================================================
// SECTION KONSTANTE
// =============================================================================

export const SECTIONS = {
    HERO: 'hero',
    ABOUT: 'about',
    GALLERY: 'gallerySection',
    SERVICES: 'services',
    FEATURES: 'featuree',
    PRICING: 'pricing',
    PARTNERS: 'partners',
    CONTACT: 'contact',
    FOOTER: 'footer'
};

// =============================================================================
// JEZIČKE KONSTANTE
// =============================================================================

export const LANGUAGES = {
    SR: 'sr',
    EN: 'en',
    RU: 'ru'
};

// =============================================================================
// BREAKPOINT KONSTANTE
// =============================================================================

export const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
};

// =============================================================================
// SCROLL KONFIGURACIJA
// =============================================================================

export const SCROLL_CONFIG = {
    OFFSET: 80,
    DURATION: 800,
    EASING: 'easeInOutCubic'
};

// =============================================================================
// API KONFIGURACIJA
// =============================================================================

export const API_CONFIG = {
    baseUrl: '/api',
    timeout: 10000,
    endpoints: {
        contact: '/send_email.php',
        analytics: '/api/analytics'
    }
};

// =============================================================================
// STORAGE KONFIGURACIJA
// =============================================================================

export const STORAGE_CONFIG = {
    prefix: 'perfect_shine_',
    keys: {
        language: 'perfect_shine_lang',
        userPreferences: 'user_preferences',
        session: 'session_data'
    }
};

// =============================================================================
// FEATURE FLAGOVI
// =============================================================================

export const FEATURES = {
    serviceWorker: false,
    pushNotifications: false,
    offlineSupport: false,
    analytics: true,
    performanceMonitoring: true
};

// =============================================================================
// GALLERY KONFIGURACIJA
// =============================================================================

export const GALLERY_CONFIG = {
    images: [
        { id: 1, src: "img/gallery/1200x800/1.webp", thumbnail: "img/gallery/1.webp", alt: "Prekrasan prikaz prirode 1", category: "priroda" },
        { id: 2, src: "img/gallery/1200x800/2.webp", thumbnail: "img/gallery/2.webp", alt: "Moderna arhitektura 2", category: "arhitektura" },
        { id: 3, src: "img/gallery/1200x800/3.webp", thumbnail: "img/gallery/3.webp", alt: "Gradski vidik noću 3", category: "grad" },
        { id: 4, src: "img/gallery/1200x800/4.webp", thumbnail: "img/gallery/4.webp", alt: "Planinski pejzaž 4", category: "priroda" },
        { id: 5, src: "img/gallery/1200x800/5.webp", thumbnail: "img/gallery/5.webp", alt: "Morska obala 5", category: "more" },
        { id: 6, src: "img/gallery/1200x800/6.webp", thumbnail: "img/gallery/6.webp", alt: "Šumska staza 6", category: "priroda" },
        { id: 7, src: "img/gallery/1200x800/7.webp", thumbnail: "img/gallery/7.webp", alt: "Gradska četvrt 7", category: "grad" },
        { id: 8, src: "img/gallery/1200x800/8.webp", thumbnail: "img/gallery/8.webp", alt: "Zimski pejzaž 8", category: "priroda" },
        { id: 9, src: "img/gallery/1200x800/9.webp", thumbnail: "img/gallery/9.webp", alt: "Pustinjski krajolik 9", category: "priroda" },
        { id: 10, src: "img/gallery/1200x800/10.webp", thumbnail: "img/gallery/10.webp", alt: "Jezerski vidik 10", category: "priroda" },
        { id: 11, src: "img/gallery/1200x800/11.webp", thumbnail: "img/gallery/11.webp", alt: "Planinski vrh 11", category: "priroda" },
        { id: 12, src: "img/gallery/1200x800/12.webp", thumbnail: "img/gallery/12.webp", alt: "Šumski potok 12", category: "priroda" },
        { id: 13, src: "img/gallery/1200x800/14.webp", thumbnail: "img/gallery/14.webp", alt: "Poljski cvijet 13", category: "priroda" },
        { id: 14, src: "img/gallery/1200x800/13.webp", thumbnail: "img/gallery/13.webp", alt: "Gradska noć 14", category: "grad" }
    ],
    grid: {
        desktop: { rows: 2, gap: 4, minWidth: 300 },
        tablet: { rows: 2, gap: 15, minWidth: 200 },
        mobile: { rows: 2, gap: 3, minWidth: 120 }
    },
    features: {
        rotation: {
            interval: 2500,
            enabled: true
        },
        autoplay: {
            interval: 3000,
            enabled: false
        },
        zoom: {
            minScale: 0.5,
            maxScale: 2.5,
            scaleStep: 0.25
        },
        drag: {
            threshold: 50,
            sensitivity: 1.5
        }
    }
};

// =============================================================================
// MODULE KONFIGURACIJA
// =============================================================================

export const MODULES_CONFIG = {
    // Navigation module
    navigation: {
        enabled: true,
        options: {
            smoothScroll: true,
            mobileBreakpoint: BREAKPOINTS.MOBILE,
            scrollOffset: SCROLL_CONFIG.OFFSET,
            stickyThreshold: 0.3,
            closeOnScroll: true
        }
    },

    // Loader module
    loader: {
        enabled: true,
        options: {
            minDisplayTime: 2000,
            autoHide: true,
            forceHideTimeout: 8000
        }
    },

    // Language module
    language: {
        enabled: true,
        options: {
            defaultLang: LANGUAGES.SR,
            supportedLangs: [LANGUAGES.SR, LANGUAGES.EN, LANGUAGES.RU],
            storageKey: STORAGE_CONFIG.keys.language,
            autoDetect: true
        }
    },

    // Gallery module
    gallery: {
        enabled: true,
        options: {
            // Koristi GALLERY_CONFIG za slike i grid
            autoplay: GALLERY_CONFIG.features.autoplay,
            zoom: GALLERY_CONFIG.features.zoom,
            drag: GALLERY_CONFIG.features.drag,
            rotation: GALLERY_CONFIG.features.rotation
        }
    },

    // Pricing module
    pricing: {
        enabled: true,
        options: {
            currency: '€',
            showModals: true,
            planConfig: {
                1: { type: 'deepCleaning', key: 'deep_cleaning' },
                2: { type: 'vehicles', key: 'vehicles_and_vessels' },
                3: { type: 'hotels', key: 'hotels_and_yachts' }
            }
        }
    },

    // CallUs module
    callus: {
        enabled: true,
        options: {
            phoneNumber: '+38268069211',
            showOnSticky: true,
            autoCloseOnScroll: true,
            closeOnOutsideClick: true
        }
    },

    // Partners module
    partners: {
        enabled: true,
        options: {
            speed: 2,
            pauseOnHover: true,
            viewportOffset: 100,
            autoStart: true
        }
    },

    // Contact module
    contact: {
        enabled: true,
        options: {
            apiEndpoint: API_CONFIG.endpoints.contact,
            validateForms: true,
            showSuccessMessage: true,
            successMessageDuration: 3000,
            phonePatterns: [
                /^\d{3} \d{3} \d{3}$/,
                /^\d{3} \d{3} \d{4}$/,
                /^\+\d{3} \d{2} \d{3} \d{3}$/,
                /^\+\d{3} \d{2} \d{3} \d{4}$/,
                /^\+\d{3} \d{1} \d{3} \d{6}$/,
                /^\d{9}$/,
                /^\d{10}$/,
                /^\+\d{11,14}$/
            ]
        }
    }
};

// =============================================================================
// PERFORMANCE KONFIGURACIJA
// =============================================================================

export const PERFORMANCE_CONFIG = {
    throttleDelay: 16,
    debounceDelay: 250,
    resizeThrottle: 250,
    scrollThrottle: 16,
    animationFrameRate: 60
};

// =============================================================================
// DETECTION DEVELOPMENT MODE
// =============================================================================

// Detektuj development mode na osnovu URL-a
const isDevelopment = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:' ||
    window.location.search.includes('debug=true');

// Ažuriraj konfiguraciju za development mode
if (isDevelopment) {
    APP_CONFIG.environment = 'development';
    APP_CONFIG.debug = true;

    // Development-specific konfiguracije
    PERFORMANCE_CONFIG.throttleDelay = 8;
}

// =============================================================================
// EXPORT SVIH KONFIGURACIJA
// =============================================================================

export default {
    APP_CONFIG,
    SECTIONS,
    LANGUAGES,
    BREAKPOINTS,
    SCROLL_CONFIG,
    API_CONFIG,
    STORAGE_CONFIG,
    FEATURES,
    MODULES_CONFIG,
    PERFORMANCE_CONFIG,
    GALLERY_CONFIG
};