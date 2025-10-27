import { EventBus } from '../core/event-bus.js';
import { PERFORMANCE_CONFIG } from '../config/index.js';

export class LoaderModule {
    constructor() {
        this.loaderWrapper = null;
        this.loaderSections = null;
        this.loader = null;
        this.loaderImage = null;
        this.isInitialized = false;
        this.isHidden = false;
        this.minDisplayTime = 1500;
        this.startTime = null;
        this.forceHideTimeout = null;
        this.cleanupTimeouts = new Set();
        this.hideTimeout = null;

        // Nove varijable za waitForReady
        this.readyPromise = null;
        this.readyPromiseResolver = null;
    }

    async initialize(dependencies = {}) {
        if (this.isInitialized) return;

        this.eventBus = dependencies.eventBus || EventBus;
        this.config = dependencies.config || {};

        this.minDisplayTime = this.config.minDisplayTime || 2000; // POVEĆANO NA 2 SEKUNDE
        this.forceHideTimeoutMs = this.config.forceHideTimeout || 8000; // POVEĆANO NA 8 SEKUNDI
        this.startTime = Date.now();

        this.cacheDOMElements();
        this.setupEventListeners();
        this.setupForceHide();
        this.show();

        this.isInitialized = true;

        // Signaliziraj da je loader spreman
        this.readyPromiseResolver?.(true);
        this.emit('loader:ready');
    }

    // Nova metoda za čekanje spremnosti
    waitForReady() {
        if (this.isInitialized) {
            return Promise.resolve(true);
        }

        if (!this.readyPromise) {
            this.readyPromise = new Promise((resolve) => {
                this.readyPromiseResolver = resolve;
            });
        }
        return this.readyPromise;
    }

    cacheDOMElements() {
        this.loaderWrapper = document.getElementById('loaderWrapper');
        this.loaderSections = document.querySelectorAll('.loader-section');
        this.loader = document.querySelector('.loader');
        this.loaderImage = document.querySelector('.loader-image');

        if (!this.loaderWrapper) {
            console.error('❌ Loader wrapper not found!');
        }
    }

    setupEventListeners() {
        // Glavni event za sakrivanje loadera - sa boljim timingom
        this.eventBus.on('app:modulesReady', () => {
            console.log('🎯 Loader: app:modulesReady received - scheduling hide');
            this.hideWithDelay();
        });

        // Fallback ako modulesReady ne stigne
        this.eventBus.on('app:ready', () => {
            console.log('🎯 Loader: app:ready received - backup hide');
            setTimeout(() => {
                if (!this.isHidden) {
                    this.hideWithDelay();
                }
            }, 1000);
        });

        // Fallback eventi
        this.eventBus.on('app:error', (data) => {
            console.error('🎯 Loader: app:error received', data);
            this.hide();
        });

        // Manual control
        this.eventBus.on('loader:hide', () => {
            this.hide();
        });

        this.eventBus.on('loader:show', () => {
            this.show();
        });

        // Emergency hide na klik/tap
        document.addEventListener('click', this.emergencyHideHandler = () => {
            if (!this.isHidden) {
                console.log('🔄 Loader: Emergency hide on user interaction');
                this.forceHide();
            }
        }, { once: true, passive: true });
    }

    setupForceHide() {
        this.forceHideTimeout = setTimeout(() => {
            if (!this.isHidden) {
                console.warn('⚠️ Loader: Force hide timeout triggered');
                this.forceHide();
            }
        }, this.forceHideTimeoutMs);
    }

    hideWithDelay() {
        if (this.isHidden) return;

        const elapsed = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayTime - elapsed);

        console.log(`⏰ Loader: hiding in ${remainingTime}ms (elapsed: ${elapsed}ms)`);

        // Očisti prethodni timeout ako postoji
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, remainingTime);

        this.cleanupTimeouts.add(this.hideTimeout);
    }

    hide() {
        if (this.isHidden) return;

        this.isHidden = true;

        // Dodaj loaded klasu za CSS animacije
        document.documentElement.classList.add('loaded');

        // Očisti sve timeoute
        this.cleanupTimeouts.forEach(timeout => clearTimeout(timeout));
        this.cleanupTimeouts.clear();

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Sakrij kompletno nakon animacije
        const finalHideTimeout = setTimeout(() => {
            if (this.loaderWrapper) {
                this.loaderWrapper.style.visibility = 'hidden';
                this.loaderWrapper.style.display = 'none';
            }
            this.emit('loader:hidden');
        }, PERFORMANCE_CONFIG.throttleDelay * 2);

        this.cleanupTimeouts.add(finalHideTimeout);
    }

    show() {
        if (this.isHidden) {
            this.isHidden = false;
            this.startTime = Date.now();
        }

        if (this.loaderWrapper) {
            // Reset stanja
            this.loaderWrapper.style.visibility = 'visible';
            this.loaderWrapper.style.display = 'block';

            // Ukloni loaded klasu
            document.documentElement.classList.remove('loaded');

            // Reset sekcija (za slučaj ponovnog pokretanja)
            this.loaderSections.forEach(section => {
                section.style.transform = 'translateX(0)';
            });

            // Reset loader opacity
            if (this.loader) this.loader.style.opacity = '1';
            if (this.loaderImage) this.loaderImage.style.opacity = '1';
        }

        // Ponovo postavi force hide
        this.setupForceHide();

        this.emit('loader:shown');
    }

    forceHide() {
        console.log('🔄 Loader: force hiding');
        this.isHidden = true;

        if (this.loaderWrapper) {
            this.loaderWrapper.style.display = 'none';
            this.loaderWrapper.style.visibility = 'hidden';
            this.loaderWrapper.classList.add('loader-force-hide');
        }

        document.documentElement.classList.add('loaded', 'app-ready');

        // Očisti sve timeoute
        this.cleanupTimeouts.forEach(timeout => clearTimeout(timeout));
        this.cleanupTimeouts.clear();

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.emit('loader:forceHidden');
    }

    restart() {
        console.log('🔃 Loader: restarting');
        this.isHidden = false;
        this.startTime = Date.now();
        this.show();
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    destroy() {
        // Očisti sve timeoute
        this.cleanupTimeouts.forEach(timeout => clearTimeout(timeout));
        this.cleanupTimeouts.clear();

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        if (this.forceHideTimeout) {
            clearTimeout(this.forceHideTimeout);
        }

        // Ukloni sve event listenere
        this.eventBus.off('app:ready');
        this.eventBus.off('app:modulesReady');
        this.eventBus.off('app:error');
        this.eventBus.off('loader:hide');
        this.eventBus.off('loader:show');

        if (this.emergencyHideHandler) {
            document.removeEventListener('click', this.emergencyHideHandler);
        }

        this.forceHide();
    }
}