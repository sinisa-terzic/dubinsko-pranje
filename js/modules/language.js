import { EventBus } from '../core/event-bus.js';

export class LanguageModule {
    constructor() {
        this.currentLanguage = 'sr';
        this.translations = {};
        this.isInitialized = false;
        this.scrollManager = null;
        this.readyPromise = null;
        this.readyPromiseResolver = null;
        this.translationsLoaded = false;

        this.flagMap = {
            'sr': {
                active: 'img/flag/mne+.svg',
                inactive: 'img/flag/mne.svg',
                name: 'Crnogorski'
            },
            'en': {
                active: 'img/flag/eng+.svg',
                inactive: 'img/flag/eng.svg',
                name: 'English'
            },
            'ru': {
                active: 'img/flag/rus+.svg',
                inactive: 'img/flag/rus.svg',
                name: 'Русский'
            }
        };
    }

    async initialize(dependencies = {}) {
        if (this.isInitialized) return;

        this.eventBus = dependencies.eventBus || EventBus;
        this.scrollManager = dependencies.scrollManager;
        this.config = dependencies.config || {};

        await this.loadLanguagePreference();
        await this.loadTranslations(this.currentLanguage);
        this.translationsLoaded = true;
        this.setupDOM();
        this.bindEvents();
        this.setupScrollHandler();
        this.updateUI();

        this.isInitialized = true;
        this.emit('language:ready');

        // Signaliziraj da je modul spreman
        this.readyPromiseResolver?.(true);
    }

    // Nova metoda za čekanje spremnosti
    waitForReady() {
        if (this.isInitialized && this.translationsLoaded) {
            return Promise.resolve(true);
        }

        if (!this.readyPromise) {
            this.readyPromise = new Promise((resolve) => {
                this.readyPromiseResolver = resolve;
            });
        }
        return this.readyPromise;
    }

    setupScrollHandler() {
        if (this.scrollManager) {
            this.scrollHandlerId = this.scrollManager.addHandler(() => {
                this.handleScroll();
            }, 5); // Visok prioritet za brzo zatvaranje
        }
    }

    handleScroll() {
        if (this.isDropdownOpen()) {
            this.closeDropdown();
        }
    }

    async loadLanguagePreference() {
        try {
            const savedLang = localStorage.getItem(this.config.storageKey || 'perfect_shine_lang');
            if (savedLang && this.isLanguageSupported(savedLang)) {
                this.currentLanguage = savedLang;
            }
        } catch (error) {
            this.currentLanguage = this.config.defaultLang || 'sr';
        }
    }

    isLanguageSupported(lang) {
        const supported = this.config.supportedLangs || ['sr', 'en', 'ru'];
        return supported.includes(lang);
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            this.translations = await response.json();
            return true;
        } catch (error) {
            console.error(`Failed to load translations for ${lang}:`, error);
            if (lang !== 'sr') {
                return await this.loadTranslations('sr');
            }
            return false;
        }
    }

    setupDOM() {
        this.languageButton = document.getElementById('languageImg');
        this.languageButtonImg = this.languageButton?.querySelector('img');
        this.dropdown = document.querySelector('.language');
        this.languageLinks = document.querySelectorAll('.flagLink');
    }

    bindEvents() {
        if (this.languageButton) {
            this.languageButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });

            this.languageButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDropdown();
                } else if (e.key === 'Escape' && this.isDropdownOpen()) {
                    this.closeDropdown();
                    this.languageButton.focus();
                } else if (e.key === 'ArrowDown' && !this.isDropdownOpen()) {
                    this.openDropdown();
                }
            });
        }

        this.languageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const langCode = e.currentTarget.getAttribute('data-lang-code');
                this.changeLanguage(langCode);
            });

            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const langCode = e.currentTarget.getAttribute('data-lang-code');
                    this.changeLanguage(langCode);
                } else if (e.key === 'Escape') {
                    this.closeDropdown();
                    this.languageButton.focus();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.focusNextLink(link);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.focusPreviousLink(link);
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!this.languageButton?.contains(e.target) && !this.dropdown?.contains(e.target)) {
                this.closeDropdown();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen()) {
                this.closeDropdown();
                this.languageButton?.focus();
            }
        });
    }

    focusNextLink(currentLink) {
        const visibleLinks = Array.from(this.languageLinks).filter(link =>
            link.style.display !== 'none' && !link.hasAttribute('hidden')
        );
        const currentIndex = visibleLinks.indexOf(currentLink);
        const nextIndex = (currentIndex + 1) % visibleLinks.length;
        visibleLinks[nextIndex]?.focus();
    }

    focusPreviousLink(currentLink) {
        const visibleLinks = Array.from(this.languageLinks).filter(link =>
            link.style.display !== 'none' && !link.hasAttribute('hidden')
        );
        const currentIndex = visibleLinks.indexOf(currentLink);
        const previousIndex = (currentIndex - 1 + visibleLinks.length) % visibleLinks.length;
        visibleLinks[previousIndex]?.focus();
    }

    toggleDropdown() {
        if (this.dropdown) {
            const isOpen = !this.dropdown.classList.contains('hidden');
            if (isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }
    }

    openDropdown() {
        if (this.dropdown) {
            this.dropdown.classList.remove('hidden');
            this.languageButton.setAttribute('aria-expanded', 'true');

            const firstVisibleLink = Array.from(this.languageLinks).find(link =>
                link.style.display !== 'none' && !link.hasAttribute('hidden')
            );
            firstVisibleLink?.focus();

            this.emit('language:dropdownOpened');
        }
    }

    closeDropdown() {
        if (this.dropdown) {
            this.dropdown.classList.add('hidden');
            this.languageButton.setAttribute('aria-expanded', 'false');
            this.emit('language:dropdownClosed');
        }
    }

    isDropdownOpen() {
        return this.dropdown && !this.dropdown.classList.contains('hidden');
    }

    async changeLanguage(lang) {
        if (!this.isLanguageSupported(lang) || lang === this.currentLanguage) {
            this.closeDropdown();
            return;
        }

        try {
            this.emit('language:changing', { from: this.currentLanguage, to: lang });

            const success = await this.loadTranslations(lang);
            if (!success) throw new Error('Translation load failed');

            const previousLanguage = this.currentLanguage;
            this.currentLanguage = lang;

            localStorage.setItem(this.config.storageKey || 'perfect_shine_lang', lang);

            this.updateUI();
            this.closeDropdown();

            this.languageButton?.focus();

            this.emit('language:changed', {
                language: lang,
                previousLanguage: previousLanguage,
                translations: this.translations
            });

        } catch (error) {
            console.error('Language change failed:', error);
            this.emit('language:error', { error, language: lang });
        }
    }

    updateUI() {
        this.updateLanguageButton();
        this.updateLanguageDropdown();
        this.updatePageTexts();
        this.updateMetaTags();
        this.updateHtmlLang();
    }

    updateLanguageButton() {
        if (!this.languageButton || !this.languageButtonImg) return;

        const flagInfo = this.flagMap[this.currentLanguage];
        if (flagInfo) {
            this.languageButtonImg.src = flagInfo.active;
            this.languageButtonImg.alt = flagInfo.name;

            this.languageButton.setAttribute('aria-label', `Change language. Current: ${flagInfo.name}`);
            this.languageButton.setAttribute('title', `Current language: ${flagInfo.name}`);
            this.languageButton.setAttribute('data-current-lang', this.currentLanguage);
        }
    }

    updateLanguageDropdown() {
        this.languageLinks.forEach(link => {
            const langCode = link.getAttribute('data-lang-code');
            const flagImg = link.querySelector('img.flag');
            const flagInfo = this.flagMap[langCode];

            if (flagInfo && flagImg) {
                flagImg.src = flagInfo.inactive;
                flagImg.alt = flagInfo.name;

                const textNodes = Array.from(link.childNodes).filter(node =>
                    node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                );
                if (textNodes.length > 0) {
                    textNodes[0].textContent = flagInfo.name;
                } else {
                    const existingSpan = link.querySelector('span');
                    if (existingSpan) {
                        existingSpan.textContent = flagInfo.name;
                    } else {
                        const span = document.createElement('span');
                        span.textContent = flagInfo.name;
                        link.appendChild(span);
                    }
                }
            }

            if (langCode === this.currentLanguage) {
                link.setAttribute('hidden', '');
                link.style.display = 'none';
            } else {
                link.removeAttribute('hidden');
                link.style.display = 'flex';
            }
        });
    }

    updatePageTexts() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);

            if (translation !== undefined) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'IMG') {
                    element.alt = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const translation = this.getTranslation(key);
            if (translation !== undefined) {
                element.innerHTML = translation;
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.getTranslation(key);
            if (translation !== undefined) {
                element.title = translation;
            }
        });
    }

    getTranslation(key) {
        if (!this.translations) return undefined;

        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    }

    updateMetaTags() {
        const pageTitle = this.getTranslation('pageTitle');
        const pageDescription = this.getTranslation('pageDescription');

        if (pageTitle) {
            document.title = pageTitle;
        }

        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription && pageDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        if (metaDescription && pageDescription) {
            metaDescription.content = pageDescription;
        }

        this.updateOpenGraphTags();
    }

    updateOpenGraphTags() {
        const pageTitle = this.getTranslation('pageTitle');
        const pageDescription = this.getTranslation('pageDescription');

        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle && pageTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        if (ogTitle && pageTitle) {
            ogTitle.content = pageTitle;
        }

        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription && pageDescription) {
            ogDescription = document.createElement('meta');
            ogDescription.setAttribute('property', 'og:description');
            document.head.appendChild(ogDescription);
        }
        if (ogDescription && pageDescription) {
            ogDescription.content = pageDescription;
        }
    }

    updateHtmlLang() {
        document.documentElement.lang = this.currentLanguage;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getLanguageName(langCode) {
        const flagInfo = this.flagMap[langCode];
        return flagInfo ? flagInfo.name : 'Unknown';
    }

    getSupportedLanguages() {
        return Object.keys(this.flagMap);
    }

    translate(key) {
        const translation = this.getTranslation(key);
        return translation !== undefined ? translation : key;
    }

    translateElement(element) {
        const key = element.getAttribute('data-i18n');
        if (key) {
            const translation = this.getTranslation(key);
            if (translation !== undefined) {
                element.textContent = translation;
            }
        }
    }

    addLanguage(langCode, flagInfo) {
        this.flagMap[langCode] = flagInfo;
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    destroy() {
        this.closeDropdown();

        if (this.scrollHandlerId && this.scrollManager) {
            this.scrollManager.removeHandler(this.scrollHandlerId);
        }

        if (this.languageButton) {
            this.languageButton.replaceWith(this.languageButton.cloneNode(true));
        }

        this.languageLinks.forEach(link => {
            link.replaceWith(link.cloneNode(true));
        });
    }
}