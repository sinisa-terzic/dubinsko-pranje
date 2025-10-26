import { App } from './core/app.js';
import { APP_CONFIG, PERFORMANCE_CONFIG } from './config/index.js';

console.log(`🎯 ${APP_CONFIG.name} v${APP_CONFIG.version} starting...`);

class Application {
    constructor() {
        this.app = new App();
        this.init();
    }

    async init() {
        try {
            document.documentElement.classList.add('app-loading');

            const perfStart = performance.now();
            await this.app.init();
            const perfEnd = performance.now();

            console.log(`⚡ App initialized in ${(perfEnd - perfStart).toFixed(2)}ms`);
            this.app.start();

            document.documentElement.classList.remove('app-loading');
            document.documentElement.classList.add('app-ready');

            console.log(`🚀 ${APP_CONFIG.name} v${APP_CONFIG.version} started successfully!`);

            this.setupLoaderFallback();
            this.setupGlobalNavigation();

            window.dispatchEvent(new CustomEvent('perfectshine:ready', {
                detail: {
                    app: this.app,
                    config: APP_CONFIG,
                    performance: {
                        initTime: perfEnd - perfStart,
                        timestamp: Date.now()
                    }
                }
            }));

        } catch (error) {
            console.error('Failed to start application:', error);
            document.documentElement.classList.remove('app-loading');
            document.documentElement.classList.add('app-error');
            this.hideLoaderEmergency();

            window.dispatchEvent(new CustomEvent('perfectshine:error', {
                detail: {
                    error: error,
                    timestamp: Date.now()
                }
            }));
        }
    }

    setupGlobalNavigation() {
        // Globalna navigacijska pomoc
        window.addEventListener('hashchange', (e) => {
            const newHash = window.location.hash.substring(1);
            const navigationModule = this.app.getModule('navigation');

            if (navigationModule && newHash && newHash !== navigationModule.getCurrentSection()) {
                console.log(`🌐 Global hash change handled: ${newHash}`);
            }
        });

        // Fallback za direktne hash linkove
        setTimeout(() => {
            const initialHash = window.location.hash.substring(1);
            if (initialHash) {
                const navigationModule = this.app.getModule('navigation');
                if (navigationModule && navigationModule.getCurrentSection() !== initialHash) {
                    console.log(`🎯 Applying initial hash: ${initialHash}`);
                    navigationModule.goToSection(initialHash);
                }
            }
        }, 1000);
    }

    setupLoaderFallback() {
        const fallbackTimeouts = [
            setTimeout(() => {
                const loaderModule = this.app.getModule('loader');
                if (loaderModule && !loaderModule.isHidden) {
                    console.log('🔄 Fallback 1: Module force hide');
                    loaderModule.forceHide();
                }
            }, 3000),

            setTimeout(() => {
                const loaderWrapper = document.getElementById('loaderWrapper');
                if (loaderWrapper && loaderWrapper.style.display !== 'none') {
                    console.log('🔄 Fallback 2: Direct DOM hide');
                    loaderWrapper.style.display = 'none';
                }
            }, 4000),

            setTimeout(() => {
                this.hideLoaderEmergency();
                console.log('🔄 Fallback 3: Emergency cleanup');
            }, 5000)
        ];

        this.app.eventBus.on('loader:hidden', () => {
            fallbackTimeouts.forEach(timeout => clearTimeout(timeout));
        });
    }

    hideLoaderEmergency() {
        const loaderWrapper = document.getElementById('loaderWrapper');
        if (loaderWrapper) {
            loaderWrapper.style.display = 'none';
            loaderWrapper.style.visibility = 'hidden';
            loaderWrapper.style.opacity = '0';
            loaderWrapper.classList.add('loaded', 'loader-force-hide');

            setTimeout(() => {
                if (loaderWrapper.parentNode) {
                    loaderWrapper.parentNode.removeChild(loaderWrapper);
                }
            }, 1000);
        }

        try {
            const loaderModule = this.app.getModule('loader');
            if (loaderModule && typeof loaderModule.forceHide === 'function') {
                loaderModule.forceHide();
            }
        } catch (e) {
            // Ignore module errors
        }
    }

    getApp() {
        return this.app;
    }

    isReady() {
        return this.app.isInitialized;
    }

    hideLoader() {
        this.hideLoaderEmergency();
    }

    async destroy() {
        await this.app.destroy();
        document.documentElement.classList.remove('app-ready', 'app-error');
    }
}

const initializeYear = () => {
    try {
        const yearElements = document.querySelectorAll('.year');
        const currentYear = new Date().getFullYear();

        yearElements.forEach(element => {
            if (element.textContent !== String(currentYear)) {
                element.textContent = currentYear;
                element.setAttribute('title', `Current year: ${currentYear}`);
                element.setAttribute('aria-live', 'polite');
            }
        });

        return currentYear;

    } catch (error) {
        console.warn('⚠️ Could not initialize year:', error);
        return null;
    }
};

const initApp = () => {
    window.perfectShineApp = new Application();

    const isDevelopment = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:' ||
        window.location.search.includes('debug=true');

    if (isDevelopment) {
        window.app = window.perfectShineApp.getApp();
    }

    initializeYear();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

////////////////////////////////////////
// Globalni error handler za unhandled promises
window.addEventListener('unhandledrejection', (event) => {
    // Filtriranje ove specifične greške
    if (event.reason && event.reason.message &&
        event.reason.message.includes('asynchronous response') &&
        event.reason.message.includes('message channel closed')) {

        console.log('🔕 Suppressed async response warning');
        event.preventDefault(); // Sprečava default error handling
        return;
    }

    // Za sve ostale greške, nastavite sa normalnim handlingom
    console.error('Unhandled promise rejection:', event.reason);
});

// Ili jednostavnije - ignoriši specifičnu grešku
window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    if (message.includes('asynchronous response') && message.includes('message channel closed')) {
        event.preventDefault();
        return;
    }
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    window.perfectShineApp?.hideLoaderEmergency();
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    window.perfectShineApp?.hideLoaderEmergency();
    event.preventDefault();
});

setTimeout(() => {
    const loaderWrapper = document.getElementById('loaderWrapper');
    if (loaderWrapper && loaderWrapper.style.display !== 'none') {
        console.log('🔄 Emergency timeout loader hide');
        loaderWrapper.style.display = 'none';
        loaderWrapper.style.visibility = 'hidden';
    }
}, 5000);

window.PerfectShine = {
    getApp: () => window.perfectShineApp?.getApp(),
    isReady: () => window.perfectShineApp?.isReady(),
    reload: () => window.location.reload(),

    hideLoader: () => {
        const app = window.perfectShineApp?.getApp();
        if (app?.getModule('loader')) {
            app.getModule('loader').hide();
        } else {
            window.perfectShineApp?.hideLoaderEmergency();
        }
    },

    showLoader: () => {
        const app = window.perfectShineApp?.getApp();
        const loaderModule = app?.getModule('loader');
        if (loaderModule) {
            loaderModule.show();
        }
    },

    navigateTo: (sectionId) => {
        const app = window.perfectShineApp?.getApp();
        const navigationModule = app?.getModule('navigation');
        if (navigationModule) {
            navigationModule.goToSection(sectionId);
        } else {
            const element = document.getElementById(sectionId);
            element?.scrollIntoView({ behavior: 'smooth' });
        }
    },

    openGallery: (imageIndex = 0) => {
        const app = window.perfectShineApp?.getApp();
        app?.getModule('gallery')?.open(imageIndex);
    },

    openPricing: (planType = 'deepCleaning') => {
        const app = window.perfectShineApp?.getApp();
        app?.getModule('pricing')?.showFullPrice(planType);
    },

    openCallUs: () => {
        const app = window.perfectShineApp?.getApp();
        app?.getModule('callus')?.openCallUs();
    },

    changeLanguage: (langCode) => {
        const app = window.perfectShineApp?.getApp();
        app?.getModule('language')?.changeLanguage(langCode);
    },

    getCurrentLanguage: () => {
        const app = window.perfectShineApp?.getApp();
        return app?.getModule('language')?.getCurrentLanguage() || 'sr';
    },

    getCurrentYear: () => {
        const yearElement = document.querySelector('.year');
        return yearElement ? yearElement.textContent : new Date().getFullYear();
    },

    refreshYear: () => initializeYear(),

    getModuleState: (moduleName) => {
        const app = window.perfectShineApp?.getApp();
        const module = app?.getModule(moduleName);
        return module ? {
            initialized: module.isInitialized,
            exists: true,
            state: typeof module.getState === 'function' ? module.getState() : 'no_state_method'
        } : { initialized: false, exists: false };
    },

    debug: () => {
        const app = window.perfectShineApp?.getApp();
        if (!app) return { status: 'not_initialized' };

        const modules = {};
        if (app.modules) {
            for (const [name, module] of app.modules) {
                modules[name] = {
                    initialized: module.isInitialized,
                    state: typeof module.getState === 'function' ? module.getState() : 'no_state_method'
                };
            }
        }

        return {
            status: app.isInitialized ? 'ready' : 'initializing',
            version: APP_CONFIG.version,
            environment: APP_CONFIG.environment,
            modules: modules,
            performance: app.getPerformanceMetrics?.(),
            currentYear: window.PerfectShine.getCurrentYear(),
            timestamp: Date.now()
        };
    },

    emergency: {
        removeLoader: () => {
            const loaderWrapper = document.getElementById('loaderWrapper');
            if (loaderWrapper?.parentNode) {
                loaderWrapper.parentNode.removeChild(loaderWrapper);
            }
        },

        showApp: () => {
            document.documentElement.classList.add('app-ready');
            document.documentElement.classList.remove('app-loading', 'app-error');

            const loaderWrapper = document.getElementById('loaderWrapper');
            if (loaderWrapper) {
                loaderWrapper.style.display = 'none';
            }
        },

        reset: () => {
            document.documentElement.className = '';
            const loaderWrapper = document.getElementById('loaderWrapper');
            if (loaderWrapper) {
                loaderWrapper.style.display = 'none';
            }
        }
    }
};

let checkCount = 0;
const loaderCheckInterval = setInterval(() => {
    const loaderWrapper = document.getElementById('loaderWrapper');
    if (document.documentElement.classList.contains('app-ready') && loaderWrapper && loaderWrapper.style.display !== 'none') {
        loaderWrapper.style.display = 'none';
    }
    checkCount++;
    if (checkCount >= 10) {
        clearInterval(loaderCheckInterval);
    }
}, 1000);

export default Application;