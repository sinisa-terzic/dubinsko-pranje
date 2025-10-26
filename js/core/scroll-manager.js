import { Utilities } from './utilities.js';
import { SCROLL_CONFIG, PERFORMANCE_CONFIG } from '../config/index.js';

export class ScrollManager {
    constructor() {
        this.handlers = new Map();
        this.isScrolling = false;
        this.lastScrollTop = 0;
        this.scrollTimeout = null;
        this.scrollToTimeout = null;
        this.isProgrammaticScroll = false;
        this.lastDetectedSection = null;
        this.sectionUpdateThrottle = null;
        this.currentAnimationFrame = null;

        // NOVO: Za bolju detekciju sekcija
        this.sectionUpdateCallbacks = new Set();
        this.lastSectionUpdateTime = 0;
        this.sectionUpdateInterval = 100; // ms između provjera sekcija

        this.init();
    }

    init() {
        this.throttledScroll = Utilities.throttle(
            () => this.handleScroll(),
            PERFORMANCE_CONFIG.scrollThrottle || 16
        );

        window.addEventListener('scroll', this.throttledScroll, { passive: true });
        window.addEventListener('scroll', this.handleProgrammaticScroll.bind(this), { passive: true });

        // NOVO: Instant section detection na load
        setTimeout(() => {
            this.updateActiveSection(true); // force update
        }, 500);
    }

    handleScroll() {
        if (this.isProgrammaticScroll) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > this.lastScrollTop ? 'down' : 'up';
        const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);

        // NOVO: Poboljšana detekcija sekcija - manji threshold
        if (scrollDelta > 1) { // Smanjen threshold sa 50 na 1
            if (!this.sectionUpdateThrottle) {
                this.sectionUpdateThrottle = setTimeout(() => {
                    this.updateActiveSection();
                    this.sectionUpdateThrottle = null;
                }, 50); // Smanjen delay sa 150ms na 50ms
            }
        }

        if (scrollDelta > 1) {
            this.handlers.forEach((handler, id) => {
                try {
                    handler({
                        scrollTop,
                        scrollDirection,
                        scrollDelta,
                        windowHeight: window.innerHeight,
                        documentHeight: document.documentElement.scrollHeight,
                        isScrolling: true,
                        isProgrammatic: false
                    });
                } catch (error) {
                    console.error(`Scroll handler error (${id}):`, error);
                }
            });
        }

        this.lastScrollTop = scrollTop;

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.handlers.forEach((handler, id) => {
                try {
                    handler({
                        scrollTop: this.lastScrollTop,
                        scrollDirection: 'none',
                        scrollDelta: 0,
                        windowHeight: window.innerHeight,
                        documentHeight: document.documentElement.scrollHeight,
                        isScrolling: false,
                        isProgrammatic: false
                    });
                } catch (error) {
                    console.error(`Scroll end handler error (${id}):`, error);
                }
            });
        }, 100);
    }

    // NOVO: Poboljšana metoda za detekciju sekcija
    updateActiveSection(force = false) {
        const currentTime = Date.now();

        // Throttle provjere sekcija, ali ne previše agresivno
        if (!force && currentTime - this.lastSectionUpdateTime < this.sectionUpdateInterval) {
            return;
        }

        this.lastSectionUpdateTime = currentTime;

        const sections = ['hero', 'about', 'gallerySection', 'services', 'featuree', 'pricing', 'partners', 'contact'];
        const currentSection = this.getCurrentSection(sections);

        if (currentSection && currentSection !== this.lastDetectedSection) {
            this.lastDetectedSection = currentSection;

            window.dispatchEvent(new CustomEvent('activeSectionChanged', {
                detail: { section: currentSection }
            }));

            // NOVO: Pozovi sve callback-ove
            this.sectionUpdateCallbacks.forEach(callback => {
                try {
                    callback(currentSection);
                } catch (error) {
                    console.error('Section update callback error:', error);
                }
            });
        }
    }

    // NOVO: Poboljšana metoda za određivanje trenutne sekcije
    getCurrentSection(sections = []) {
        if (!sections.length) return null;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;

        // POVEĆANA OSJETLJIVOST: koristi 60% od visine prozora umjesto 30%
        const triggerPoint = windowHeight * 0.4;

        for (let i = sections.length - 1; i >= 0; i--) {
            const sectionId = sections[i];
            const element = document.getElementById(sectionId);

            if (element) {
                const elementTop = element.offsetTop;
                const elementHeight = element.offsetHeight;

                // PROŠIRENA DETEKCIJA: provjeri da li je sekcija u viewportu
                const elementBottom = elementTop + elementHeight;
                const viewportMiddle = scrollTop + (windowHeight * 0.5);

                // Sekcija je aktivna ako je sredina viewporta unutar sekcije
                if (viewportMiddle >= elementTop && viewportMiddle <= elementBottom) {
                    return sectionId;
                }

                // Fallback: tradicionalna provjera sa većom osjetljivošću
                if (scrollTop >= elementTop - triggerPoint) {
                    return sectionId;
                }
            }
        }

        return sections[0] || null;
    }

    // NOVO: Metoda za direktno pretplaćivanje na promjene sekcija
    onSectionChange(callback) {
        this.sectionUpdateCallbacks.add(callback);

        // Vrati funkciju za unsubscribe
        return () => {
            this.sectionUpdateCallbacks.delete(callback);
        };
    }

    // NOVO: Instant section check
    checkSectionImmediately() {
        this.updateActiveSection(true);
    }

    // NOVO: DODAJ OVU METODU koja nedostaje
    getScrollPosition() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = this.lastScrollTop > scrollTop ? 'up' : 'down';

        return {
            scrollTop,
            scrollDirection,
            isScrolling: this.isScrolling,
            isProgrammaticScroll: this.isProgrammaticScroll,
            windowHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight,
            progress: this.getScrollProgress()
        };
    }

    // NOVO: DODAJ I OVU METODU ako ne postoji
    getScrollProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const maxScroll = documentHeight - windowHeight;

        return maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    }

    // OSTALE METODE...
    handleProgrammaticScroll() {
        if (this.isProgrammaticScroll) {
            this.isProgrammaticScroll = false;
        }
    }

    addHandler(handler, priority = 10) {
        const id = Utilities.generateId('scroll_handler');
        this.handlers.set(id, handler);
        return id;
    }

    removeHandler(handlerId) {
        this.handlers.delete(handlerId);
    }

    scrollTo(element, offset = SCROLL_CONFIG.OFFSET) {
        if (!element) {
            console.warn('⚠️ ScrollManager: Element not found for scrolling');
            return Promise.reject(new Error('Element not found'));
        }

        return new Promise((resolve) => {
            this.cancelScroll();

            const targetPosition = this.calculateScrollPosition(element, offset);
            const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
            const distance = Math.abs(targetPosition - currentPosition);

            if (distance < 5) {
                resolve();
                return;
            }

            this.isProgrammaticScroll = true;
            this.isScrolling = true;

            this.handlers.forEach((handler) => {
                try {
                    handler({
                        scrollTop: currentPosition,
                        scrollDirection: targetPosition > currentPosition ? 'down' : 'up',
                        scrollDelta: distance,
                        windowHeight: window.innerHeight,
                        documentHeight: document.documentElement.scrollHeight,
                        isScrolling: true,
                        isProgrammatic: true,
                        scrollTo: {
                            target: element.id,
                            startPosition: currentPosition,
                            targetPosition: targetPosition
                        }
                    });
                } catch (error) {
                    // Ignore handler errors
                }
            });

            this.smoothScrollToPosition(targetPosition, SCROLL_CONFIG.DURATION)
                .then(() => {
                    this.isScrolling = false;
                    this.isProgrammaticScroll = false;

                    const finalPosition = window.pageYOffset || document.documentElement.scrollTop;
                    this.handlers.forEach((handler) => {
                        try {
                            handler({
                                scrollTop: finalPosition,
                                scrollDirection: 'none',
                                scrollDelta: 0,
                                windowHeight: window.innerHeight,
                                documentHeight: document.documentElement.scrollHeight,
                                isScrolling: false,
                                isProgrammatic: true,
                                scrollComplete: true
                            });
                        } catch (error) {
                            // Ignore handler errors
                        }
                    });

                    resolve();
                })
                .catch(() => {
                    this.isScrolling = false;
                    this.isProgrammaticScroll = false;
                    resolve();
                });
        });
    }

    calculateScrollPosition(element, offset = 0) {
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        return Math.max(0, absoluteElementTop - offset);
    }

    smoothScrollToPosition(targetPosition, duration = SCROLL_CONFIG.DURATION) {
        return new Promise((resolve) => {
            const startPosition = window.pageYOffset || document.documentElement.scrollTop;
            const distance = targetPosition - startPosition;
            const startTime = performance.now();

            if (this.currentAnimationFrame) {
                cancelAnimationFrame(this.currentAnimationFrame);
            }

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = this.easeInOutCubic(progress);

                window.scrollTo(0, startPosition + (distance * ease));

                if (progress < 1) {
                    this.currentAnimationFrame = requestAnimationFrame(animate);
                } else {
                    this.currentAnimationFrame = null;
                    resolve();
                }
            };

            this.currentAnimationFrame = requestAnimationFrame(animate);
        });
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    cancelScroll() {
        if (this.scrollToTimeout) {
            clearTimeout(this.scrollToTimeout);
            this.scrollToTimeout = null;
        }

        if (this.sectionUpdateThrottle) {
            clearTimeout(this.sectionUpdateThrottle);
            this.sectionUpdateThrottle = null;
        }

        if (this.currentAnimationFrame) {
            cancelAnimationFrame(this.currentAnimationFrame);
            this.currentAnimationFrame = null;
        }

        window.scrollTo({
            top: window.pageYOffset || document.documentElement.scrollTop,
            behavior: 'auto'
        });

        this.isScrolling = false;
        this.isProgrammaticScroll = false;
    }

    isElementInViewport(element, threshold = 0) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= (windowHeight + threshold) &&
            rect.right <= (windowWidth + threshold)
        );
    }

    getElementVisibility(element) {
        if (!element) return 0;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        const elementHeight = rect.height;
        const elementTop = rect.top;
        const elementBottom = rect.bottom;

        const visibleTop = Math.max(0, elementTop);
        const visibleBottom = Math.min(windowHeight, elementBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        return (visibleHeight / elementHeight) * 100;
    }

    isAtBottom(threshold = 100) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        return (scrollTop + windowHeight) >= (documentHeight - threshold);
    }

    isAtTop(threshold = 100) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return scrollTop <= threshold;
    }

    smoothScrollTo(target, offset = 0, duration = SCROLL_CONFIG.DURATION) {
        const targetPosition = this.calculateScrollPosition(target, offset);
        return this.smoothScrollToPosition(targetPosition, duration);
    }

    destroy() {
        this.cancelScroll();

        window.removeEventListener('scroll', this.throttledScroll);
        window.removeEventListener('scroll', this.handleProgrammaticScroll);

        this.handlers.clear();
        this.sectionUpdateCallbacks.clear();
        clearTimeout(this.scrollTimeout);

        this.isScrolling = false;
        this.isProgrammaticScroll = false;
    }
}