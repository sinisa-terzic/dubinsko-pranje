// main.js - COMPLETE SYNCHRONIZED VERSION WITH BROWSER HISTORY & SEO
document.addEventListener('DOMContentLoaded', function () {
    // ==================== GLOBAL VARIABLES ====================
    const body = document.body;
    const headerEl = document.querySelector(".header");
    const btnNavEl = document.querySelector(".btn-mobile-nav");
    const languageImg = document.querySelector("#languageImg");
    const language = document.querySelector(".language");
    const phoneNumber = document.querySelector(".phone-number");
    const callOptions = document.querySelector(".call-options");
    const callUsImg = document.querySelector('.callUs');
    const callUsClose = document.querySelector('.callUs-close');
    const callUsIcon = document.querySelector('.open-callUs');
    const logo1 = document.querySelector(".logo");
    const logo2 = document.querySelector(".logo-sm");

    let currentLanguage = 'sr';
    let scrollTimeout;
    let pricingModalInitialized = false;
    let currentPrices = {};
    let translationCache = {};

    // ==================== STRUCTURED DATA IMPROVEMENTS ====================

    /**
     * Uklanja duplicirane structured data script-ove
     */
    function cleanupDuplicateStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');

        if (scripts.length > 1) {
            for (let i = 1; i < scripts.length; i++) {
                scripts[i].remove();
            }
        }
    }

    /**
     * Popravlja structured data probleme
     */
    function fixStructuredDataIssues(data) {
        if (data.serviceArea && typeof data.serviceArea.geoRadius === "string") {
            data.serviceArea.geoRadius = parseInt(data.serviceArea.geoRadius);
        }

        if (!data.image) {
            data.image = [
                "https://perfectshine.me/img/logo/logo.png",
                "https://perfectshine.me/img/about/puzi-hero+.webp",
                "https://perfectshine.me/img/services/furniture-washing.webp"
            ];
        }

        return data;
    }

    /**
     * Ažurira structured data sa popravkama
     */
    async function updateStructuredDataWithFixes(lang) {
        try {
            cleanupDuplicateStructuredData();

            let structuredData = await loadStructuredData();

            structuredData = await updateStructuredDataWithTranslations(structuredData, lang);

            structuredData = fixStructuredDataIssues(structuredData);

            injectStructuredData(structuredData);

        } catch (error) {
            console.error('Error fixing structured data:', error);
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Zatvara sve UI elemente (language dropdown, call options, call us dialog)
     */
    const closeAllUIElements = () => {
        UTILS.addHidden(language);
        UTILS.addHidden(callOptions);
        callUsImg?.classList.remove("callUs-is-open");
        callUsIcon?.classList.remove("open-callUs-remove");
    };

    /**
     * Zaustavlja propagaciju eventa kako ne bi trigger-ovali parent event handlere
     */
    const stopPropagation = (e) => e?.stopPropagation?.();

    const debounce = UTILS.debounce;

    /**
     * Prikazuje loading state za promjenu jezika
     */
    function showLanguageLoading() {
        body.classList.add('language-changing');

        // Dodaj loading overlay ako već ne postoji
        let loadingOverlay = document.querySelector('.language-loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'language-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="language-loading-spinner"></div>
                <p class="language-loading-text">${getTranslation('language.loading') || 'Učitavanje...'}</p>
            `;
            document.body.appendChild(loadingOverlay);
        }

        loadingOverlay.style.display = 'flex';
    }

    /**
     * Sakriva loading state za promjenu jezika
     */
    function hideLanguageLoading() {
        body.classList.remove('language-changing');

        const loadingOverlay = document.querySelector('.language-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // ==================== BROWSER HISTORY MANAGEMENT ====================

    /**
     * Postavlja globalni handler za browser history (back/forward buttons)
     */
    function setupGlobalHistoryHandler() {
        window.addEventListener('popstate', function (event) {
            const state = event.state;
            if (!state) {
                closeAllModals();
                return;
            }

            if (state.modal === 'pricing') {
                const pricingModal = document.getElementById('pricing-modal');
                if (pricingModal && pricingModal.style.display === 'none') {
                    showPricingModal(state.planId);
                }
            }
        });
    }

    /**
     * Zatvara sve modalne prozore
     */
    function closeAllModals() {
        closePricingModalWithoutHistory();
    }

    /**
     * Zatvara pricing modal bez manipulacije browser history-ja
     */
    function closePricingModalWithoutHistory() {
        const modal = document.getElementById('pricing-modal');
        if (!modal || modal.style.display === 'none') return;

        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // ==================== CONTACT FORM HANDLING ====================

    /**
     * Inicijalizuje kontakt formu sa svim event listener-ima
     */
    function setupContactForm() {
        const contactForm = document.querySelector('form.info');
        if (!contactForm) return;

        setupClearButtons(contactForm);
        setupRealTimeValidation(contactForm);

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const validationResult = validateContactForm(this);
            if (!validationResult.isValid) {
                showNotification(validationResult.message, 'error');
                return;
            }

            await submitFormData(this);
        });
    }

    /**
     * Postavlja clear dugmad za input polja forme
     */
    function setupClearButtons(form) {
        const clearButtons = form.querySelectorAll('.clear-input, .clear-textarea');

        clearButtons.forEach(button => {
            button.addEventListener('click', function () {
                const input = this.closest('.input-wrapper, .textarea-wrapper').querySelector('input, textarea');
                clearInputField(input);
            });
        });

        form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]').forEach(input => {
            input.addEventListener('input', () => updateClearButtonVisibility(input));
            updateClearButtonVisibility(input);
        });
    }

    /**
     * Briše sadržaj input polja i resetuje stanje
     */
    function clearInputField(input) {
        input.value = '';
        input.focus();
        input.classList.remove('valid', 'invalid');
        removeFieldError(input);
        updateClearButtonVisibility(input);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Ažurira vidljivost clear dugmeta na osnovu sadržaja input polja
     */
    function updateClearButtonVisibility(input) {
        const clearButton = input.closest('.input-wrapper, .textarea-wrapper').querySelector('.clear-input, .clear-textarea');
        const hasValue = input.value.trim() !== '';
        clearButton.style.opacity = hasValue ? '1' : '0';
        clearButton.style.visibility = hasValue ? 'visible' : 'hidden';
    }

    /**
     * Postavlja real-time validaciju za formu
     */
    function setupRealTimeValidation(form) {
        form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]').forEach(input => {
            input.addEventListener('blur', () => validateField(input));

            input.addEventListener('input', function () {
                if (this.name === 'phone') {
                    this.value = UTILS.filterPhoneInput(this.value);
                }

                if (this.classList.contains('invalid')) {
                    this.classList.remove('invalid');
                    removeFieldError(this);
                }
                updateClearButtonVisibility(this);
            });
        });
    }

    /**
     * Validira pojedinačno polje forme i prikazuje odgovarajuće errore
     */
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;

        if (value === '') {
            field.classList.remove('valid', 'invalid');
            removeFieldError(field);
            return true;
        }

        let isValid = false;
        let message = '';

        switch (fieldName) {
            case 'subject':
                isValid = validateTextContent(value, 2);
                message = isValid ? '' : (value.length < 2
                    ? getTranslation('contact.validation.subjectLength')
                    : getTranslation('contact.validation.subjectRandom'));
                break;
            case 'phone':
                isValid = validatePhoneNumber(value);
                message = isValid ? '' : getTranslation('contact.validation.phoneInvalid');
                break;
            case 'message':
                isValid = validateTextContent(value, 5);
                message = isValid ? '' : (value.length < 5
                    ? getTranslation('contact.validation.messageLength')
                    : getTranslation('contact.validation.messageRandom'));
                break;
        }

        updateFieldAppearance(field, isValid, message);
        return isValid;
    }

    /**
     * Ažurira vizuelni izgled polja na osnovu validacije
     */
    function updateFieldAppearance(field, isValid, message) {
        field.classList.remove('valid', 'invalid');
        removeFieldError(field);

        if (isValid) {
            field.classList.add('valid');
        } else {
            field.classList.add('invalid');
            showFieldError(field, message);
        }
    }

    /**
     * Validira kompletnu formu prije slanja
     */
    function validateContactForm(form) {
        const subject = form.querySelector('input[name="subject"]').value.trim();
        const phone = form.querySelector('input[name="phone"]').value.trim();
        const message = form.querySelector('textarea[name="message"]').value.trim();

        if (!subject || !phone || !message) {
            return { isValid: false, message: getTranslation('contact.validation.required') };
        }

        if (!validateTextContent(subject, 2)) {
            validateField(form.querySelector('input[name="subject"]'));
            return { isValid: false, message: getTranslation('contact.validation.subjectRandom') };
        }

        if (!validatePhoneNumber(phone)) {
            validateField(form.querySelector('input[name="phone"]'));
            return { isValid: false, message: getTranslation('contact.validation.phoneInvalid') };
        }

        if (!validateTextContent(message, 5)) {
            validateField(form.querySelector('textarea[name="message"]'));
            return { isValid: false, message: getTranslation('contact.validation.messageRandom') };
        }

        return { isValid: true, message: '' };
    }

    /**
     * Validira telefonski broj koristeći pattern-e iz config.js
     */
    function validatePhoneNumber(phone) {
        const cleanPhone = phone.replace(/\s+/g, '');
        return CONFIG.validation.phonePatterns.some(pattern => pattern.test(cleanPhone));
    }

    /**
     * Validira tekstualni sadržaj sa anti-spam zaštitom
     */
    function validateTextContent(text, minLength) {
        if (text.length < minLength) return false;

        const cleanText = text.toLowerCase().replace(/\s+/g, '');

        if (/(.)\1{2,}/.test(cleanText)) return false;
        if (UTILS.isKeyboardPattern(text)) return false;
        if (UTILS.isSequentialPattern(cleanText)) return false;
        if (UTILS.hasIsolatedDoubleChars(text)) return false;
        if (!UTILS.hasMeaningfulStructure(text)) return false;

        return true;
    }

    /**
     * Šalje podatke forme na server i rukuje odgovorom
     */
    async function submitFormData(form) {
        const submitButton = form.querySelector('.sendMsg');
        const originalText = submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent = getTranslation('contact.sending');
        submitButton.classList.add('loading');

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const result = await response.json();

            if (result.success) {
                showNotification(getTranslation('contact.success'), 'success');
                resetForm(form);
            } else if (response.status >= 500) {
                showNotification(getTranslation('contact.error'), 'error');
                resetForm(form);
            } else {
                showNotification(getTranslation('contact.error'), 'error');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            showNotification(getTranslation('contact.error'), 'error');
            resetForm(form);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            submitButton.classList.remove('loading');
        }
    }

    /**
     * Resetuje formu na početno stanje
     */
    function resetForm(form) {
        form.reset();
        clearFieldErrors();
        updateClearButtonsVisibility(form);
    }

    /**
     * Ažurira vidljivost svih clear dugmadi u formi
     */
    function updateClearButtonsVisibility(form) {
        form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]').forEach(input => {
            updateClearButtonVisibility(input);
        });
    }

    /**
     * Prikazuje error poruku ispod određenog polja
     */
    function showFieldError(field, message) {
        removeFieldError(field);
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    /**
     * Uklanja error poruku ispod određenog polja
     */
    function removeFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();
    }

    /**
     * Uklanja sve error poruke iz forme
     */
    function clearFieldErrors() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.info input, .info textarea').forEach(field => {
            field.classList.remove('invalid', 'valid');
        });
    }

    /**
     * Prikazuje notifikaciju korisniku (success/error/info)
     */
    function showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.form-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = `form-notification form-notification-${type}`;
        notification.textContent = message;

        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // ==================== PRICE MANAGEMENT ====================

    /**
     * Učitava cijene iz JSON fajla
     */
    async function loadPrices() {
        try {
            const response = await fetch('data/prices.json');
            if (!response.ok) throw new Error('Network response was not ok');
            currentPrices = await response.json();
            return currentPrices;
        } catch (error) {
            console.error('Error loading prices:', error);
            return {};
        }
    }

    /**
     * Formatira cijenu sa jezičkim prefiksima (od/from/от)
     */
    function formatPrice(priceData) {
        return UTILS.formatPrice(priceData, currentLanguage);
    }

    // ==================== RADIO PRICE MANAGEMENT ====================

    /**
     * Postavlja radio button sistem za dinamičko računanje cijena
     */
    function setupRadioPrices() {
        CONFIG.pricing.radioSections.forEach(section => {
            const radioPrices = currentPrices.radio_prices?.[section.planKey];
            if (!radioPrices) return;

            radioPrices.forEach(radioItem => {
                const radioElement = document.getElementById(radioItem.id);
                if (radioElement) {
                    let value = radioItem.price?.toFixed(2) || '0.00';
                    if (radioItem.plus) value += '+';
                    radioElement.value = value;
                    if (radioItem.disabled) radioElement.disabled = true;
                }
            });

            const checkboxContainer = document.getElementById(`checkboxes-${section.sectionId}`);
            if (checkboxContainer) {
                checkboxContainer.addEventListener('change', function (e) {
                    if (e.target.type === 'radio' && e.target.checked) {
                        const radioItem = radioPrices.find(item => item.id === e.target.id);
                        const outputElement = document.getElementById(`total-${section.sectionId}`);
                        if (radioItem && outputElement) {
                            updateRadioPriceDisplay(outputElement, radioItem, section.sectionId);
                        }
                    }
                });
            }

            const checkedRadio = document.querySelector(`#checkboxes-${section.sectionId} input[type="radio"]:checked`);
            if (checkedRadio) {
                const radioId = checkedRadio.id;
                const radioItem = radioPrices.find(item => item.id === radioId);
                const outputElement = document.getElementById(`total-${section.sectionId}`);
                if (radioItem && outputElement) {
                    updateRadioPriceDisplay(outputElement, radioItem, section.sectionId);
                }
            }
        });
    }

    /**
     * Resetuje radio dugmad za hotelsku sekciju
     */
    function resetHotelRadios() {
        const hotelRadios = document.querySelectorAll('#checkboxes-3 input[type="radio"]');
        hotelRadios.forEach(radio => {
            radio.checked = false;
        });

        // Resetuj prikaz cijene
        const hotelOutput = document.getElementById('total-3');
        if (hotelOutput) {
            hotelOutput.innerHTML = '<span class="euro">€</span><span>0.00</span>';
        }
    }

    /**
     * Ažurira prikaz cijene za radio selection sa novom funkcionalnošću za hotele
     */
    function updateRadioPriceDisplay(output, radioItem, sectionId) {
        if (sectionId === 2 && radioItem.price === 100.00) {
            const dryingText = getTranslation('pricing.dryingText') || 'sušenje';
            output.innerHTML = `
                <span class="euro">€</span><span>${radioItem.price?.toFixed(2) || '0.00'}</span>
                <p class="level"><span>${dryingText}</span> ~ 24<sup>h</sup></p>
            `;
        } else if (sectionId === 3) {
            // Specijalan slučaj za hotele - otvara callUs dialog
            const callUsText = getTranslation('pricing.callUsText') || 'pozovite nas!';
            output.innerHTML = `
                <span class="euro">€</span><span>${radioItem.price?.toFixed(2) || '0.00'}</span>
                <p class="level"><span class="call-us-trigger">${callUsText}</span></p>
            `;

            // Dodaj event listener za call us trigger
            const callUsTrigger = output.querySelector('.call-us-trigger');
            if (callUsTrigger) {
                callUsTrigger.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openCallUsDialog();
                });
            }

            // Automatski otvori callUs dialog
            openCallUsDialog();
        } else {
            let priceHtml = `<span class="euro">€</span><span>${radioItem.price?.toFixed(2) || '0.00'}</span>`;
            if (radioItem.plus) priceHtml += `<span class="price-plus">+</span>`;
            output.innerHTML = priceHtml;
        }

        const button = document.getElementById(`showFullPrice-${sectionId}`);
        if (button) {
            button.classList.add('pulse');
            setTimeout(() => button.classList.remove('pulse'), 800);
        }
    }

    /**
     * Otvara callUs dialog
     */
    function openCallUsDialog() {
        if (callUsImg && callUsIcon) {
            callUsImg.classList.add("callUs-is-open");
            callUsIcon.classList.add("open-callUs-remove");
            // Zatvori ostale UI elemente
            UTILS.addHidden(language);
            UTILS.addHidden(callOptions);
        }
    }

    // ==================== UI MANAGEMENT ====================

    /**
     * Debounced funkcija za sticky navigation
     */
    const optimizedCheckStickyNavigation = debounce(() => {
        const heroSection = document.querySelector(".hero-text-box");
        if (!heroSection) return;

        const heroRect = heroSection.getBoundingClientRect();
        if (heroRect.bottom < 200) {
            body.classList.add("sticky");
            UTILS.addHidden(logo1);
            UTILS.removeHidden(logo2);
        } else {
            body.classList.remove("sticky");
            UTILS.removeHidden(logo1);
            UTILS.addHidden(logo2);
        }
    }, 10);

    /**
     * Proverava i ažurira sticky navigation stanje
     */
    function checkStickyNavigation() {
        optimizedCheckStickyNavigation();
    }

    // ==================== EVENT HANDLERS ====================

    /**
     * Postavlja sve globalne event listenere
     */
    function setupEventListeners() {
        window.addEventListener('scroll', function () {
            closeAllUIElements();
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(function () {
                    scrollTimeout = null;
                    checkStickyNavigation();
                }, 10);
            }
        });

        btnNavEl?.addEventListener("click", function () {
            headerEl.classList.toggle("nav-open");
        });

        document.querySelectorAll("a.main-nav-link").forEach(link => {
            link.addEventListener("click", function () {
                headerEl.classList.toggle("nav-open");
            });
        });

        languageImg?.addEventListener("click", function (e) {
            stopPropagation(e);
            UTILS.toggleHidden(language);
            UTILS.addHidden(callOptions);
            callUsImg?.classList.remove("callUs-is-open");
            callUsIcon?.classList.remove("open-callUs-remove");
        });

        phoneNumber?.addEventListener("click", function (e) {
            stopPropagation(e);
            UTILS.toggleHidden(callOptions);
            UTILS.addHidden(language);
            callUsImg?.classList.remove("callUs-is-open");
            callUsIcon?.classList.remove("open-callUs-remove");
        });

        callUsIcon?.addEventListener('click', function (e) {
            stopPropagation(e);
            callUsImg?.classList.add("callUs-is-open");
            this.classList.add("open-callUs-remove");
            UTILS.addHidden(language);
            UTILS.addHidden(callOptions);
        });

        callUsClose?.addEventListener('click', closeAllUIElements);

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.language') &&
                !e.target.closest('.call-options') &&
                !e.target.closest('.callUs') &&
                !e.target.closest('#languageImg') &&
                !e.target.closest('.phone-number')) {
                closeAllUIElements();
            }
        });

        [language, callOptions, callUsImg].forEach(element => {
            element?.addEventListener('click', stopPropagation);
        });
    }

    // ==================== INTERNATIONALIZATION ====================

    /**
     * Dobija prevedeni tekst za dati ključ
     */
    function getTranslation(key) {
        if (window.currentTranslations) {
            return UTILS.getNestedValue(window.currentTranslations, key);
        }
        const element = document.querySelector(`[data-i18n="${key}"]`);
        return element ? element.textContent : null;
    }

    /**
     * Učitava translation fajl za dati jezik
     */
    async function loadTranslations(lang) {
        // Koristi cache ako postoji
        if (translationCache[lang]) {
            return translationCache[lang];
        }

        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            const translations = await response.json();

            // Sačuvaj u cache
            translationCache[lang] = translations;
            return translations;
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'sr') return loadTranslations('sr');
            return {};
        }
    }

    /**
     * Ažurira HTML lang attribute za SEO
     */
    function updateHtmlLangAttribute(lang) {
        const htmlElement = document.documentElement;
        if (htmlElement) {
            htmlElement.setAttribute('lang', lang);
        }
    }

    /**
     * Ažurira postojeće validation error poruke kada se promeni jezik
     */
    function updateExistingValidationErrors() {
        const errorElements = document.querySelectorAll('.field-error');

        errorElements.forEach(errorElement => {
            const field = errorElement.previousElementSibling;
            if (field && (field.name === 'subject' || field.name === 'phone' || field.name === 'message')) {
                const isValid = validateField(field);
                if (!isValid) {
                } else {
                    removeFieldError(field);
                    field.classList.remove('invalid');
                }
            }
        });
    }

    /**
     * Ažurira placeholder tekste u formi na trenutni jezik
     */
    function updateFormPlaceholders() {
        const subjectInput = document.querySelector('input[name="subject"]');
        const phoneInput = document.querySelector('input[name="phone"]');
        const messageTextarea = document.querySelector('textarea[name="message"]');

        if (subjectInput) {
            subjectInput.placeholder = getTranslation('contact.namePlaceholder') || 'Subject';
        }
        if (phoneInput) {
            phoneInput.placeholder = getTranslation('contact.phonePlaceholder') || 'Phone';
        }
        if (messageTextarea) {
            messageTextarea.placeholder = getTranslation('contact.messagePlaceholder') || 'Your message...';
        }
    }

    /**
     * Primjenjuje prevode na sve elemente na stranici
     */
    function applyTranslations(translations) {
        if (!translations) return;

        window.currentTranslations = translations;

        // Text translations
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const value = UTILS.getNestedValue(translations, key);
            if (value) {
                if (element.hasAttribute('content')) {
                    element.setAttribute('content', value);
                } else {
                    element.textContent = value;
                }
            }
        });

        // HTML content translations
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const value = UTILS.getNestedValue(translations, key);
            if (value) element.innerHTML = value;
        });

        // Placeholder translations
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const value = UTILS.getNestedValue(translations, key);
            if (value) element.placeholder = value;
        });

        updateFormPlaceholders();

        updateSEOMetaTags(translations);
    }

    /**
     * Ažurira SEO meta tagove za trenutni jezik
     */
    function updateSEOMetaTags(translations) {
        if (!translations) return;

        updateHtmlLangAttribute(currentLanguage);

        // Meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && translations.pageDescription) {
            metaDescription.content = translations.pageDescription;
        }

        // Page title
        const pageTitle = document.querySelector('title');
        if (pageTitle && translations.pageTitle) {
            pageTitle.textContent = translations.pageTitle;
        }

        updateOpenGraphTags(translations);
        updateSEOTags();
    }

    /**
     * Ažurira Open Graph tagove za social sharing
     */
    function updateOpenGraphTags(translations) {
        const ogLocaleMap = { 'sr': 'sr_RS', 'en': 'en_US', 'ru': 'ru_RU' };

        // OG Locale
        let ogLocale = document.querySelector('meta[property="og:locale"]');
        if (!ogLocale) {
            ogLocale = document.createElement('meta');
            ogLocale.setAttribute('property', 'og:locale');
            document.head.appendChild(ogLocale);
        }
        ogLocale.setAttribute('content', ogLocaleMap[currentLanguage] || 'sr_RS');

        // OG Title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', translations?.pageTitle || 'Perfect Shine - Dubinsko Pranje');

        // OG Description
        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
            ogDescription = document.createElement('meta');
            ogDescription.setAttribute('property', 'og:description');
            document.head.appendChild(ogDescription);
        }
        ogDescription.setAttribute('content', translations?.pageDescription ||
            'Profesionalno dubinsko pranje automobila, garnitura, jahti i hotela na crnogorskom primorju.');

        // OG URL
        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
            ogUrl = document.createElement('meta');
            ogUrl.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute('content', getCurrentLanguageUrl());
    }

    /**
     * Ažurira SEO tagove (canonical, hreflang)
     */
    function updateSEOTags() {
        const currentUrl = getCurrentLanguageUrl();

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', currentUrl);

        updateHreflangTags(currentUrl);
    }

    /**
     * Ažurira hreflang tagove za multi-language SEO
     */
    function updateHreflangTags(currentUrl) {
        const languages = ['sr', 'en', 'ru'];
        const baseUrl = 'https://perfectshine.me';

        languages.forEach(lang => {
            const hreflang = document.querySelector(`link[hreflang="${lang === 'sr' ? 'sr' : lang}"]`);
            if (hreflang) {
                const url = lang === 'sr' ? `${baseUrl}/` : `${baseUrl}/${lang}/`;
                hreflang.setAttribute('href', url);
            }
        });
    }

    /**
     * Generiše URL za trenutni jezik
     */
    function getCurrentLanguageUrl() {
        const baseUrl = 'https://perfectshine.me';
        return currentLanguage === 'sr' ? `${baseUrl}/` : `${baseUrl}/${currentLanguage}/`;
    }

    /**
     * Ažurira prikaz jezičkog selector-a
     */
    function updateLanguageDisplay(lang) {
        const languageImg = document.querySelector('#languageImg img');
        const languageDropdown = document.querySelector('.language');

        if (languageImg && CONFIG.languages[lang]) {
            languageImg.src = CONFIG.languages[lang].flag;
            languageImg.alt = CONFIG.languages[lang].name;
        }

        const availableLanguages = Object.keys(CONFIG.languages).filter(l => l !== lang);
        const flagLinks = languageDropdown?.querySelectorAll('.flagLink') || [];

        flagLinks.forEach(link => link.style.display = 'none');
        availableLanguages.forEach((langCode, index) => {
            if (flagLinks[index] && CONFIG.languages[langCode]) {
                flagLinks[index].style.display = 'flex';
                flagLinks[index].setAttribute('data-lang-code', langCode);
                flagLinks[index].querySelector('.flag').src = CONFIG.languages[langCode].flag.replace('+', '');
                flagLinks[index].querySelector('.flag').alt = CONFIG.languages[langCode].name;

                const textNode = flagLinks[index].childNodes[2];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = ' ' + CONFIG.languages[langCode].name;
                } else {
                    flagLinks[index].appendChild(document.createTextNode(' ' + CONFIG.languages[langCode].name));
                }
            }
        });
    }

    /**
     * Učitava i primjenjuje jezik sa svim SEO optimizacijama
     */
    async function loadAndApplyLanguage(lang) {
        currentLanguage = lang;
        updateHtmlLangAttribute(lang);

        const translations = await loadTranslations(lang);
        window.currentTranslations = translations;
        applyTranslations(translations);

        updateExistingValidationErrors();

        updateLanguageDisplay(lang);
        setupRadioPrices();
        localStorage.setItem('preferredLanguage', lang);
    }

    /**
     * Mijenja jezik sajta
     */
    async function changeLanguage(lang) {
        if (lang === currentLanguage) return;

        // Prikaži loading state
        showLanguageLoading();

        try {
            updateHtmlLangAttribute(lang);
            await loadAndApplyLanguage(lang);
            await updateStructuredDataWithFixes(lang);
            UTILS.addHidden(language);
            headerEl.classList.remove("nav-open");
        } catch (error) {
            console.error('Error changing language:', error);
        } finally {
            // Sakrij loading state
            hideLanguageLoading();
        }
    }

    // ==================== PRICING MODAL WITH BROWSER HISTORY ====================

    /**
     * Postavlja history handler za pricing modal
     */
    function setupPricingHistory() {
        window.addEventListener('load', function () {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#pricing-')) {
                const planId = hash.split('-')[1];
                showPricingModal(planId);
            }
        });
    }

    /**
     * Prikazuje pricing modal sa browser history management
     */
    function showPricingModal(planId) {
        const modal = document.getElementById('pricing-modal');
        const modalTitle = document.getElementById('pricing-modal-title');
        const modalContent = document.getElementById('pricing-modal-content');

        if (!modal || modal.style.display === 'block') return;

        document.body.style.overflow = 'hidden';

        const currentPlan = CONFIG.pricing.plans[planId];
        if (!currentPlan) return;

        const title = getTranslation(currentPlan.titleKey);
        modalTitle.textContent = title || 'Cjenovnik';
        modalContent.innerHTML = generatePricingContent(currentPlan.pricesKey);
        modal.style.display = 'block';

        // Resetuj radio dugmad samo za hotele (planId 3)
        if (planId === '3') {
            resetHotelRadios();
        }

        const currentState = history.state;
        if (!currentState || currentState.modal !== 'pricing' || currentState.planId !== planId) {
            window.history.pushState({
                modal: 'pricing',
                planId: planId
            }, '', `#pricing-${planId}`);
        }

        setupPricingModalEventListeners();
    }

    /**
     * Zatvara pricing modal sa browser history management
     */
    function closePricingModal() {
        const modal = document.getElementById('pricing-modal');
        if (!modal || modal.style.display === 'none') return;

        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        const currentState = history.state;
        if (currentState && currentState.modal === 'pricing') {
            if (window.location.hash && window.location.hash.startsWith('#pricing-')) {
                window.history.back();
            }
        }
    }

    /**
     * Postavlja event listenere za pricing modal
     */
    function setupPricingModalEventListeners() {
        const modal = document.getElementById('pricing-modal');
        const modalBody = modal?.querySelector('.pricing-modal-body');
        const closeBtn = modal?.querySelector('.pricing-modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                stopPropagation(e);
                closePricingModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closePricingModal();
            });
            if (modalBody) modalBody.scrollTo(0, 0);
        }

        if (!pricingModalInitialized) {
            document.addEventListener('keydown', function (e) {
                const modal = document.getElementById('pricing-modal');
                if (e.key === 'Escape' && modal && modal.style.display === 'block') {
                    closePricingModal();
                }
            });
            pricingModalInitialized = true;
        }
    }

    /**
     * Postavlja dugmad za otvaranje pricing modala
     */
    function setupPricingModalButtons() {
        document.querySelectorAll('[id^="showFullPrice-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const planId = this.id.split('-')[1];
                showPricingModal(planId);
            });
        });
    }

    /**
     * Generiše HTML sadržaj za pricing modal sa custom porukom za hotele
     */
    function generatePricingContent(pricesKey) {
        const prices = currentPrices[pricesKey];
        const translations = getTranslation(`pricing.modal.prices.${pricesKey}`);

        // Specijalan slučaj za hotele i jahte - prikaži custom poruku
        if (pricesKey === 'hoteli_i_jahte') {
            const customMessage = getTranslation('pricing.customPriceMessage') ||
                'Cijene se kreiraju individualno u zavisnosti od stanja, kompleksnosti posla i specifičnih zahtjeva. Naš tim će vam rado pružiti besplatnu procjenu i prilagoditi cijenu prema vašim potrebama. Kontaktirajte nas za detaljniju ponudu!';

            let html = '';
            prices.forEach((category, index) => {
                const translatedCategory = translations?.[index];
                html += `<div class="pricing-category">
                    <h4 class="pricing-category-title">${translatedCategory?.name || category.name}</h4>
                    <div class="pricing-custom-message">
                        <p>${customMessage}</p>
                    </div>
                </div>`;
            });
            return html;
        }

        // Standardni prikaz cijena za ostale kategorije
        if (!prices || !Array.isArray(prices) || prices.length === 0) {
            return '<p class="pricing-no-prices">Nema dostupnih cijena</p>';
        }

        let html = '';
        prices.forEach((category, index) => {
            const translatedCategory = translations?.[index];
            html += `<div class="pricing-category">
                <h4 class="pricing-category-title">${translatedCategory?.name || category.name}</h4>
                <ul class="pricing-subitems">`;

            if (category.subitems && Array.isArray(category.subitems)) {
                category.subitems.forEach((item, itemIndex) => {
                    const translatedItem = translatedCategory?.subitems?.[itemIndex];
                    html += `<li class="pricing-subitem">
                        <span class="pricing-subitem-name">${translatedItem?.name || item.name}</span>
                        <span class="pricing-subitem-price">${formatPrice(item)}</span>
                    </li>`;
                });
            }

            html += `</ul></div>`;
        });

        return html;
    }

    // ==================== PARTNERS MARQUEE ====================

    /**
     * Postavlja partners marquee animaciju
     */
    function setupPartnersMarquee() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const container = document.querySelector(".marquee-inner");
        if (!container) return;

        if (prefersReducedMotion) {
            setupStaticPartnersLayout(container);
        } else {
            setupAnimatedMarquee(container);
        }
    }

    /**
     * Postavlja statički layout za partnere (za korisnike koji preferiraju smanjen motion)
     */
    function setupStaticPartnersLayout(container) {
        container.style.transform = "none";
        container.style.flexWrap = "wrap";
        container.style.justifyContent = "center";
        container.style.gap = "2rem";
        container.style.padding = "2rem";
        container.style.animation = "none";

        const images = container.querySelectorAll('.ratio');
        const totalImages = images.length;
        for (let i = totalImages / 2; i < totalImages; i++) {
            images[i]?.remove();
        }
    }

    /**
     * Postavlja animirani marquee za partnere
     */
    function setupAnimatedMarquee(container) {
        const clones = container.cloneNode(true);
        container.appendChild(clones);

        let scrollAmount = 0;
        let isPaused = false;
        let animationFrameId;

        function marqueeScroll() {
            if (!isPaused) {
                scrollAmount += 1;
                container.style.transform = `translateX(-${scrollAmount}px)`;
                if (scrollAmount >= container.scrollWidth / 2) {
                    scrollAmount = 0;
                    container.style.transform = `translateX(0px)`;
                }
            }
            animationFrameId = requestAnimationFrame(marqueeScroll);
        }

        marqueeScroll();

        const wrapper = document.querySelector(".marquee-wrapper");
        if (wrapper) {
            wrapper.addEventListener("mouseenter", () => isPaused = true);
            wrapper.addEventListener("mouseleave", () => isPaused = false);

            const logos = wrapper.querySelectorAll('.ratio');
            logos.forEach(logo => {
                logo.addEventListener('focus', () => isPaused = true);
                logo.addEventListener('blur', () => isPaused = false);
            });
        }
    }

    // ==================== STRUCTURED DATA MANAGEMENT ====================

    /**
     * Učitava structured data iz JSON fajla
     */
    async function loadStructuredData() {
        try {
            const response = await fetch('data/structured-data.json');
            if (!response.ok) throw new Error('Failed to load structured data');
            return await response.json();
        } catch (error) {
            console.warn('Using fallback structured data:', error);
            return getFallbackStructuredData();
        }
    }

    /**
     * Fallback structured data ako glavni fajl nije dostupan
     */
    function getFallbackStructuredData() {
        return {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Perfect Shine",
            "description": "Profesionalno dubinsko pranje automobila, garnitura, jahti i hotela na crnogorskom primorju",
            "url": "https://perfectshine.me",
            "telephone": "+38268069211",
            "email": "info@perfectshine.me",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Radanovići bb, Ruska garaža",
                "addressLocality": "Kotor",
                "addressRegion": "Crna Gora",
                "postalCode": "85300",
                "addressCountry": "ME"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": 42.369187,
                "longitude": 18.753562
            },
            "openingHours": [
                "Mo-Su 00:00-23:59"
            ],
            "areaServed": [
                "Tivat",
                "Kotor",
                "Budva",
                "Herceg Novi",
                "Podgorica",
                "Crna Gora"
            ],
            "serviceType": [
                "Dubinsko pranje automobila",
                "Pranje garnitura",
                "Održavanje jahti",
                "Čišćenje hotela",
                "Polimerizacija farova",
                "Dezinfekcija",
                "Dezinsekcija"
            ],
            "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                    "@type": "GeoCoordinates",
                    "latitude": 42.369187,
                    "longitude": 18.753562
                },
                "geoRadius": "50000"
            },
            "sameAs": [
                "https://www.instagram.com/_dubinsko_pranje_tivat",
                "https://www.facebook.com/profile.php?id=100064044033023",
                "https://vm.tiktok.com/ZMYUrGDGo/"
            ],
            "priceRange": "€€",
            "currenciesAccepted": "EUR"
        };
    }

    /**
     * Ažurira structured data sa prevodima za trenutni jezik
     */
    async function updateStructuredDataWithTranslations(structuredData, lang) {
        const translations = {
            'sr': {
                description: "Profesionalno dubinsko pranje automobila, garnitura, jahti i hotela na crnogorskom primorju",
                serviceType: [
                    "Dubinsko pranje automobila",
                    "Pranje garnitura",
                    "Održavanje jahti",
                    "Čišćenje hotela",
                    "Polimerizacija farova",
                    "Dezinfekcija",
                    "Dezinsekcija"
                ]
            },
            'en': {
                description: "Professional deep cleaning of cars, furniture, yachts and hotels on the Montenegrin coast",
                serviceType: [
                    "Deep car cleaning",
                    "Furniture washing",
                    "Yacht maintenance",
                    "Hotel cleaning",
                    "Headlight polymerization",
                    "Disinfection",
                    "Disinsection"
                ]
            },
            'ru': {
                description: "Профессиональная глубокая чистка автомобилей, мебели, яхт и отелей на черногорском побережье",
                serviceType: [
                    "Глубокая чистка автомобилей",
                    "Чистка мебели",
                    "Обслуживание яхт",
                    "Уборка отелей",
                    "Полимеризация фар",
                    "Дезинфекция",
                    "Дезинсекция"
                ]
            }
        };

        const langData = translations[lang] || translations['sr'];

        if (langData.description) {
            structuredData.description = langData.description;
        }

        if (langData.serviceType) {
            structuredData.serviceType = langData.serviceType;
        }

        return structuredData;
    }

    /**
     * Ubacuje structured data u <head> stranice
     */
    function injectStructuredData(structuredData) {
        removeExistingStructuredData();

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);

        document.head.appendChild(script);
    }

    /**
     * Uklanja postojeće structured data skripte
     */
    function removeExistingStructuredData() {
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => {
            if (script.textContent.includes('Perfect Shine') ||
                script.textContent.includes('LocalBusiness')) {
                script.remove();
            }
        });
    }

    // ==================== INITIALIZATION ====================

    /**
     * Inicijalizuje celu aplikaciju
     */
    async function initializeApp() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'sr';

        await loadPrices();
        setupRadioPrices();
        updateLanguageDisplay(savedLanguage);
        await loadAndApplyLanguage(savedLanguage);
        await updateStructuredDataWithFixes(savedLanguage);
        checkStickyNavigation();

        setupGlobalHistoryHandler();
        setupPricingHistory();
        setupPricingModalEventListeners();
        setupPricingModalButtons();
        setupPartnersMarquee();
        setupContactForm();
    }

    // ==================== START APPLICATION ====================

    setupEventListeners();

    document.querySelector(".year").textContent = new Date().getFullYear();

    document.querySelector('.language')?.addEventListener('click', function (e) {
        stopPropagation(e);
        const flagLink = e.target.closest('.flagLink');
        if (flagLink) {
            const langCode = flagLink.getAttribute('data-lang-code');
            changeLanguage(langCode);
        }
    });

    window.addEventListener('load', function () {
        body.classList.add("loaded");
    });

    initializeApp();
});