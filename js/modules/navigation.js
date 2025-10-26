import { EventBus } from '../core/event-bus.js';
import { Utilities } from '../core/utilities.js';
import { BREAKPOINTS } from '../config/index.js';

export class NavigationModule {
    constructor() {
        this.currentSection = 'hero';
        this.isMenuOpen = false;
        this.isSticky = false;
        this.heroHeight = 0;
        this.scrollHandlerId = null;
        this.sectionUpdateHandler = null;
        this.lastHistoryUpdate = 0;
        this.historyUpdateThreshold = 1000;
        this.sections = ['hero', 'about', 'gallerySection', 'services', 'featuree', 'pricing', 'partners', 'contact'];
        this.isHandlingPopState = false;
        this.popStateScrollTimeout = null;

        this.sectionUpdateTimeout = null;
        this.lastScrollTop = 0;
        this.scrollDeltaThreshold = 1;
    }

    async initialize(dependencies = {}) {
        this.eventBus = dependencies.eventBus || EventBus;
        this.scrollManager = dependencies.scrollManager;
        this.config = dependencies.config || {};

        this.cacheDOMElements();
        this.setupStickyNavigation();
        this.bindEvents();
        this.setupSmoothScroll();
        this.setupMobileNavigation();
        this.setupHistoryHandling();

        this.setupEnhancedScrollHandler();
        this.checkActiveSectionOnLoad();

        // DODATO: Proveri sticky status na load
        setTimeout(() => {
            this.handleStickyNavigation();
        }, 100);

        this.emit('navigation:ready');
    }

    getCleanURL() {
        return window.location.href.split('#')[0];
    }

    setupEnhancedScrollHandler() {
        this.scrollHandlerId = this.scrollManager.addHandler((scrollData) => {
            this.handleEnhancedScroll(scrollData);
            this.handleStickyNavigation();
        }, 1);

        this.sectionUpdateHandler = this.scrollManager.onSectionChange((section) => {
            this.handleSectionChange(section);
        });
    }

    handleEnhancedScroll(scrollData) {
        if (scrollData.isScrolling && scrollData.scrollDelta > this.scrollDeltaThreshold) {
            this.updateActiveSectionOnScroll();
        }
    }

    updateActiveSectionOnScroll() {
        if (!this.sectionUpdateTimeout) {
            this.sectionUpdateTimeout = setTimeout(() => {
                const currentSection = this.scrollManager.getCurrentSection(this.sections);
                if (currentSection && currentSection !== this.currentSection) {
                    this.handleSectionChange(currentSection);
                }
                this.sectionUpdateTimeout = null;
            }, 80);
        }
    }

    handleSectionChange(section) {
        if (this.isHandlingPopState) return;

        this.currentSection = section;
        this.updateActiveNavLink(section);
        this.updateURLWithoutHistory(section);

        this.emit('navigation:sectionChanged', section);
    }

    checkActiveSectionOnLoad() {
        setTimeout(() => {
            const currentSection = this.scrollManager.getCurrentSection(this.sections);
            if (currentSection && currentSection !== this.currentSection) {
                this.handleSectionChange(currentSection);
            }
        }, 100);
    }

    setupHistoryHandling() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                const targetSection = e.state.section;
                if (targetSection !== this.currentSection) {
                    console.log(`🔙 Browser navigation to: ${targetSection}`);

                    this.isHandlingPopState = true;
                    this.currentSection = targetSection;
                    const targetElement = document.getElementById(targetSection);

                    if (targetElement) {
                        this.scrollManager.cancelScroll();
                        this.scrollManager.scrollTo(targetElement, this.config.scrollOffset || 80)
                            .then(() => {
                                setTimeout(() => {
                                    this.isHandlingPopState = false;
                                }, 100);
                            })
                            .catch(() => {
                                this.isHandlingPopState = false;
                            });
                    }

                    this.updateActiveNavLink(targetSection);

                    clearTimeout(this.popStateScrollTimeout);
                    this.popStateScrollTimeout = setTimeout(() => {
                        this.isHandlingPopState = false;
                    }, 2000);
                }
            }
        });

        window.addEventListener('activeSectionChanged', (e) => {
            if (this.isHandlingPopState) return;

            const section = e.detail.section;
            if (section && section !== this.currentSection) {
                this.handleSectionChange(section);
            }
        });

        if (!history.state) {
            const initialHash = window.location.hash.substring(1) || 'hero';
            history.replaceState({ section: initialHash }, '', this.getCleanURL() + '#' + initialHash);
        }
    }

    setupSmoothScroll() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.goToSection(targetId);
            }
        });

        window.addEventListener('hashchange', (e) => {
            if (this.isHandlingPopState) return;

            const newHash = window.location.hash.substring(1);
            const oldHash = e.oldURL.split('#')[1] || 'hero';

            if (newHash && newHash !== this.currentSection && this.sections.includes(newHash)) {
                console.log(`🔗 Hash change: ${oldHash} -> ${newHash}`);
                const targetElement = document.getElementById(newHash);
                if (targetElement) {
                    this.currentSection = newHash;
                    this.scrollManager.scrollTo(targetElement, this.config.scrollOffset || 80);
                    this.updateActiveNavLink(newHash);
                }
            }
        });
    }

    goToSection(section) {
        if (!section || !this.sections.includes(section)) return;

        console.log(`🎯 Navigating to section: ${section}`);
        this.currentSection = section;
        const targetElement = document.getElementById(section);

        if (targetElement) {
            this.scrollManager.cancelScroll();

            const now = Date.now();
            if (now - this.lastHistoryUpdate > this.historyUpdateThreshold) {
                history.pushState({ section: section }, '', `#${section}`);
                this.lastHistoryUpdate = now;
            } else {
                history.replaceState({ section: section }, '', `#${section}`);
            }

            this.scrollManager.scrollTo(targetElement, this.config.scrollOffset || 80);
            this.updateActiveNavLink(section);
        }

        this.emit('navigation:sectionChanged', section);
    }

    updateActiveNavLink(section) {
        if (!this.navLinks || this.navLinks.length === 0) return;

        this.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });

        const activeLink = Array.from(this.navLinks).find(link =>
            link.getAttribute('href') === `#${section}`
        );

        if (activeLink) {
            activeLink.classList.add('active');
            activeLink.setAttribute('aria-current', 'page');

            if (this.config.debug) {
                console.log(`📍 Active nav link: ${section}`);
            }
        }
    }

    updateURLWithoutHistory(section) {
        if (this.isHandlingPopState) return;

        if (history.replaceState) {
            history.replaceState({ section: section }, '', `#${section}`);
        }
    }

    debugSectionDetection() {
        console.log('=== SECTION DETECTION DEBUG ===');
        console.log('Current Section:', this.currentSection);
        console.log('Scroll Top:', window.pageYOffset || document.documentElement.scrollTop);

        this.sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const elementTop = element.offsetTop;
                const elementBottom = elementTop + element.offsetHeight;
                const viewportMiddle = scrollTop + (window.innerHeight * 0.5);

                const inViewport = viewportMiddle >= elementTop && viewportMiddle <= elementBottom;
                const traditionalCheck = scrollTop >= elementTop - (window.innerHeight * 0.6);

                console.log(`${section}:`, {
                    elementTop,
                    elementBottom,
                    viewportMiddle,
                    inViewport,
                    traditionalCheck,
                    isActive: section === this.currentSection,
                    distanceFromTop: elementTop - scrollTop
                });
            }
        });
    }

    forceSectionUpdate() {
        this.scrollManager.checkSectionImmediately();
    }

    cacheDOMElements() {
        this.header = document.querySelector('.header');
        this.heroElement = document.querySelector('#hero');
        this.bigLogo = document.querySelector('.logo');
        this.smallLogo = document.querySelector('.logo-sm');
        this.mobileNavBtn = document.querySelector('.btn-mobile-nav');
        this.menuIcon = document.querySelector('.icon-mobile-nav[name="menu-outline"]');
        this.closeIcon = document.querySelector('.icon-mobile-nav[name="close-outline"]');
        this.mainNav = document.querySelector('.main-nav');
        this.body = document.body;
        this.navLinks = this.mainNav?.querySelectorAll('a[href^="#"]') || [];
    }

    setupStickyNavigation() {
        if (!this.heroElement) {
            this.heroElement = document.querySelector('section:first-of-type');
        }
        this.heroHeight = this.heroElement?.offsetHeight || 0;
    }

    setupMobileNavigation() {
        if (!this.mobileNavBtn || !this.mainNav) return;

        this.mobileNavBtn.addEventListener('click', () => this.toggleMobileNav());

        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMobileNav());
        });
    }

    toggleMobileNav() {
        this.isMenuOpen = !this.isMenuOpen;
        this.body.classList.toggle('nav-open', this.isMenuOpen);

        if (this.menuIcon && this.closeIcon) {
            this.menuIcon.classList.toggle('hidden', this.isMenuOpen);
            this.closeIcon.classList.toggle('hidden', !this.isMenuOpen);
        }

        document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';

        if (this.isMenuOpen) {
            this.emit('navigation:mobileOpened');
        } else {
            this.emit('navigation:mobileClosed');
        }
    }

    closeMobileNav() {
        if (!this.isMenuOpen) return;

        this.isMenuOpen = false;
        this.body.classList.remove('nav-open');

        if (this.menuIcon && this.closeIcon) {
            this.menuIcon.classList.remove('hidden');
            this.closeIcon.classList.add('hidden');
        }

        document.body.style.overflow = '';
        this.emit('navigation:mobileClosed');
    }

    bindEvents() {
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileNav();
            }
        });

        this.eventBus.on('navigation:closeAllMenus', () => {
            this.closeMobileNav();
        });

        this.resizeHandler = Utilities.debounce(() => {
            if (window.innerWidth >= BREAKPOINTS.MOBILE && this.isMenuOpen) {
                this.closeMobileNav();
            }
        }, 250);

        window.addEventListener('resize', this.resizeHandler);
    }

    handleOutsideClick(e) {
        if (this.isMenuOpen &&
            !e.target.closest('.main-nav') &&
            !e.target.closest('.btn-mobile-nav')) {
            this.closeMobileNav();
        }
    }

    handleStickyNavigation() {
        if (!this.header || !this.heroElement) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const triggerPoint = this.heroHeight * (this.config.stickyThreshold || 0.3);

        if (scrollTop > triggerPoint) {
            this.activateSticky();
        } else {
            this.deactivateSticky();
        }
    }

    activateSticky() {
        if (this.isSticky) return;

        this.header.classList.add('sticky');
        this.showSmallLogo();
        this.isSticky = true;
        this.emit('navigation:stickyEnabled');
    }

    deactivateSticky() {
        if (!this.isSticky) return;

        this.header.classList.remove('sticky');
        this.showBigLogo();
        this.isSticky = false;
        this.emit('navigation:stickyDisabled');
    }

    showSmallLogo() {
        if (this.bigLogo && this.smallLogo) {
            this.bigLogo.classList.add('hidden');
            this.smallLogo.classList.remove('hidden');
        }
    }

    showBigLogo() {
        if (this.bigLogo && this.smallLogo) {
            this.bigLogo.classList.remove('hidden');
            this.smallLogo.classList.add('hidden');
        }
    }

    getCurrentSection() {
        return this.currentSection;
    }

    isMobileMenuOpen() {
        return this.isMenuOpen;
    }

    isStickyActive() {
        return this.isSticky;
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    destroy() {
        if (this.scrollHandlerId) {
            this.scrollManager.removeHandler(this.scrollHandlerId);
        }

        if (this.sectionUpdateHandler) {
            this.sectionUpdateHandler();
        }

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        if (this.sectionUpdateTimeout) {
            clearTimeout(this.sectionUpdateTimeout);
        }

        if (this.popStateScrollTimeout) {
            clearTimeout(this.popStateScrollTimeout);
        }

        this.eventBus.off('navigation:closeAllMenus');
        this.closeMobileNav();
        this.isSticky = false;
    }
}