/*
|--------------------------------------------------------------------------
| PARTNERS MODULE - OPTIMIZOVANO MARQUEE ZA VIDNO POLJE
|--------------------------------------------------------------------------
*/

import { EventBus } from '../core/event-bus.js';
import { Utilities } from '../core/utilities.js';

export class PartnersModule {
    constructor() {
        this.eventBus = null;
        this.utils = Utilities;

        this.marqueeInner = null;
        this.marqueeContainer = null;
        this.isInitialized = false;

        // Konfiguracija
        this.CONFIG = {
            SPEED: 2,
            PAUSE_ON_HOVER: true,
            VIEWPORT_OFFSET: 100
        };

        this.scrollAmount = 0;
        this.isHovered = false;
        this.isInViewport = false;
        this.animationId = null;
        this.observer = null;
    }

    async initialize(dependencies = {}) {
        if (this.isInitialized) return;

        this.eventBus = dependencies.eventBus || EventBus;
        this.config = dependencies.config || {};

        // Ažuriraj konfiguraciju iz settings.js ako postoji
        if (this.config.speed) this.CONFIG.SPEED = this.config.speed;
        if (this.config.pauseOnHover !== undefined) this.CONFIG.PAUSE_ON_HOVER = this.config.pauseOnHover;
        if (this.config.viewportOffset) this.CONFIG.VIEWPORT_OFFSET = this.config.viewportOffset;

        await this.initPartners();
        this.isInitialized = true;
        this.emit('partners:ready');
    }

    async initPartners() {
        this.marqueeInner = document.querySelector('.marquee-inner');
        this.marqueeContainer = document.querySelector('.partners-container');

        if (!this.marqueeInner || !this.marqueeContainer) {
            console.warn('⚠️ Partners elementi nisu pronađeni');
            return;
        }

        this.setupMarquee();
    }

    setupMarquee() {
        // Dupliraj sadržaj za besprekidan loop
        const marqueeContent = this.marqueeInner.innerHTML;
        this.marqueeInner.innerHTML += marqueeContent;

        // Postavi Intersection Observer
        this.setupIntersectionObserver();

        // Dodaj event listenere
        this.addEventListeners();
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: `${this.CONFIG.VIEWPORT_OFFSET}px`,
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!this.isInViewport) {
                        this.isInViewport = true;
                        this.startScrolling();
                    }
                } else {
                    if (this.isInViewport) {
                        this.isInViewport = false;
                        this.stopScrolling();
                    }
                }
            });
        }, options);

        this.observer.observe(this.marqueeContainer);
    }

    startScrolling() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const animate = () => {
            if (!this.isHovered && this.isInViewport) {
                this.scrollAmount -= this.CONFIG.SPEED;

                if (Math.abs(this.scrollAmount) >= this.marqueeInner.scrollWidth / 2) {
                    this.scrollAmount = 0;
                }

                this.marqueeInner.style.transform = `translateX(${this.scrollAmount}px)`;
            }

            if (this.isInViewport) {
                this.animationId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    stopScrolling() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    addEventListeners() {
        if (this.CONFIG.PAUSE_ON_HOVER) {
            this.marqueeInner.addEventListener('mouseenter', () => {
                this.isHovered = true;
            });

            this.marqueeInner.addEventListener('mouseleave', () => {
                this.isHovered = false;
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopScrolling();
            } else if (this.isInViewport) {
                this.startScrolling();
            }
        });

        // Resize handler za responzivnost
        this.utils.throttledResize = this.utils.throttle(() => {
            if (this.isInViewport) {
                this.stopScrolling();
                this.startScrolling();
            }
        }, 250);

        window.addEventListener('resize', this.utils.throttledResize);
    }

    // Metoda za ažuriranje brzine scrolla
    setSpeed(speed) {
        this.CONFIG.SPEED = speed;
        if (this.isInViewport) {
            this.stopScrolling();
            this.startScrolling();
        }
    }

    // Metoda za pauziranje/nastavljanje
    pause() {
        this.isHovered = true;
    }

    resume() {
        this.isHovered = false;
    }

    // Metoda za ponovno pokretanje
    restart() {
        this.scrollAmount = 0;
        this.marqueeInner.style.transform = 'translateX(0)';
        if (this.isInViewport) {
            this.startScrolling();
        }
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    destroy() {
        this.stopScrolling();

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Ukloni event listenere
        if (this.utils.throttledResize) {
            window.removeEventListener('resize', this.utils.throttledResize);
        }

        // Resetuj stanje
        this.scrollAmount = 0;
        this.isHovered = false;
        this.isInViewport = false;
        this.isInitialized = false;

        this.emit('partners:destroyed');
    }
}