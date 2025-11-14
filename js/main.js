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

    const languageData = {
        'sr': { flag: 'img/flag/mne+.svg', name: 'Crnogorski' },
        'en': { flag: 'img/flag/eng+.svg', name: 'English' },
        'ru': { flag: 'img/flag/rus+.svg', name: 'Русский' }
    };

    let currentLanguage = 'sr';
    let scrollTimeout;
    let pricingModalInitialized = false;
    let currentPrices = {};

    // ==================== OPTIMIZOVANE UTILITY FUNCTIONS ====================
    const utils = {
        getNestedValue: (obj, path) => {
            if (!obj || !path) return null;
            return path.split('.').reduce((current, key) => current?.[key], obj);
        },

        stopPropagation: (e) => e?.stopPropagation?.(),

        addHidden: (element) => element?.classList?.add('hidden'),

        removeHidden: (element) => element?.classList?.remove('hidden'),

        toggleHidden: (element) => element?.classList?.toggle('hidden'),

        closeAllUIElements: () => {
            utils.addHidden(language);
            utils.addHidden(callOptions);
            callUsImg?.classList.remove("callUs-is-open");
            callUsIcon?.classList.remove("open-callUs-remove");
        }
    };

    // ==================== DEBOUNCE FUNKCIJA ZA PERFORMANSE ====================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ==================== CONTACT FORM HANDLING ====================
    function setupContactForm() {
        const contactForm = document.querySelector('form.info');

        if (!contactForm) return;

        // Setup clear buttons functionality
        setupClearButtons(contactForm);

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validacija forme prije slanja
            const validationResult = validateContactForm(this);
            if (!validationResult.isValid) {
                showNotification(validationResult.message, 'error');
                return;
            }

            const submitButton = this.querySelector('.sendMsg');
            const originalText = submitButton.textContent;

            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = getTranslation('contact.sending') || 'Slanje...';
            submitButton.classList.add('loading');

            try {
                const formData = new FormData(this);

                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    // Success message - RESET FORM
                    showNotification(
                        getTranslation('contact.success') || 'Poruka je uspješno poslana! Kontaktiraćemo vas uskoro.',
                        'success'
                    );
                    this.reset();
                    clearFieldErrors(); // Clear any existing errors
                    updateClearButtonsVisibility(contactForm); // Update clear buttons after reset
                } else {
                    // Error message - samo za server greške
                    showNotification(result.message, 'error');

                    // Resetuj formu samo ako je server greška (500)
                    if (response.status >= 500) {
                        this.reset();
                        clearFieldErrors();
                        updateClearButtonsVisibility(contactForm);
                    }
                }

            } catch (error) {
                console.error('Form submission error:', error);
                showNotification(
                    getTranslation('contact.error') || 'Došlo je do greške. Pokušajte ponovo.',
                    'error'
                );
                // Reset form i pri network greškama
                contactForm.reset();
                clearFieldErrors();
                updateClearButtonsVisibility(contactForm);
            } finally {
                // Re-enable button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                submitButton.classList.remove('loading');
            }
        });

        // Real-time validation
        setupRealTimeValidation(contactForm);
    }

    // Setup clear buttons functionality
    function setupClearButtons(form) {
        const clearButtons = form.querySelectorAll('.clear-input, .clear-textarea');

        clearButtons.forEach(button => {
            button.addEventListener('click', function () {
                const wrapper = this.closest('.input-wrapper, .textarea-wrapper');
                const input = wrapper.querySelector('input, textarea');

                // Clear the input
                input.value = '';
                input.focus();

                // Remove validation classes
                input.classList.remove('valid', 'invalid');

                // Remove field errors
                removeFieldError(input);

                // Update button visibility
                updateClearButtonVisibility(input);

                // Trigger input event for validation
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });

        // Add input event listeners to update clear button visibility
        const inputs = form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]');
        inputs.forEach(input => {
            input.addEventListener('input', function () {
                updateClearButtonVisibility(this);
            });

            // Initial visibility check
            updateClearButtonVisibility(input);
        });
    }

    // Update clear button visibility based on input content
    function updateClearButtonVisibility(input) {
        const wrapper = input.closest('.input-wrapper, .textarea-wrapper');
        const clearButton = wrapper.querySelector('.clear-input, .clear-textarea');

        if (input.value.trim() !== '') {
            clearButton.style.opacity = '1';
            clearButton.style.visibility = 'visible';
        } else {
            clearButton.style.opacity = '0';
            clearButton.style.visibility = 'hidden';
        }
    }

    // Update all clear buttons visibility in form
    function updateClearButtonsVisibility(form) {
        const inputs = form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]');
        inputs.forEach(input => {
            updateClearButtonVisibility(input);
        });
    }

    // Real-time validation setup
    function setupRealTimeValidation(form) {
        const inputs = form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]');

        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                validateField(this);
            });

            input.addEventListener('input', function () {
                // Clear error state when user starts typing
                if (this.classList.contains('invalid')) {
                    this.classList.remove('invalid');
                    const errorElement = this.parentNode.querySelector('.field-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                }
                // Update clear button visibility
                updateClearButtonVisibility(this);
            });
        });
    }

    // Validate individual field
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let message = '';

        switch (fieldName) {
            case 'subject':
                isValid = validateSubject(value);
                if (!isValid) {
                    if (value.length < 2) {
                        message = getTranslation('contact.validation.subjectLength') || 'Tema mora imati najmanje 2 karaktera.';
                    } else {
                        message = getTranslation('contact.validation.subjectRandom') || 'Tema ne smije sadržavati nasumičan tekst.';
                    }
                }
                break;

            case 'phone':
                isValid = validatePhone(value);
                if (!isValid) {
                    message = getTranslation('contact.validation.phoneInvalid') || 'Unesite ispravan broj telefona.';
                }
                break;

            case 'message':
                isValid = validateMessage(value);
                if (!isValid) {
                    if (value.length < 5) {
                        message = getTranslation('contact.validation.messageLength') || 'Poruka mora imati najmanje 5 karaktera.';
                    } else {
                        message = getTranslation('contact.validation.messageRandom') || 'Poruka ne smije sadržavati nasumičan tekst.';
                    }
                }
                break;
        }

        // Update field appearance
        if (value !== '') {
            if (isValid) {
                field.classList.remove('invalid');
                field.classList.add('valid');
            } else {
                field.classList.remove('valid');
                field.classList.add('invalid');
                showFieldError(field, message);
            }
        } else {
            field.classList.remove('valid', 'invalid');
            removeFieldError(field);
        }

        return isValid;
    }

    // Validate entire form
    function validateContactForm(form) {
        const subject = form.querySelector('input[name="subject"]').value.trim();
        const phone = form.querySelector('input[name="phone"]').value.trim();
        const message = form.querySelector('textarea[name="message"]').value.trim();

        // Check if fields are empty
        if (!subject || !phone || !message) {
            return {
                isValid: false,
                message: getTranslation('contact.validation.required') || 'Sva polja su obavezna.'
            };
        }

        // Validate individual fields
        if (!validateSubject(subject)) {
            const field = form.querySelector('input[name="subject"]');
            validateField(field);
            let errorMsg = subject.length < 2
                ? getTranslation('contact.validation.subjectLength') || 'Tema mora imati najmanje 2 karaktera.'
                : getTranslation('contact.validation.subjectRandom') || 'Tema ne smije sadržavati nasumičan tekst.';
            return {
                isValid: false,
                message: errorMsg
            };
        }

        if (!validatePhone(phone)) {
            const field = form.querySelector('input[name="phone"]');
            validateField(field);
            return {
                isValid: false,
                message: getTranslation('contact.validation.phoneInvalid') || 'Unesite ispravan broj telefona.'
            };
        }

        if (!validateMessage(message)) {
            const field = form.querySelector('textarea[name="message"]');
            validateField(field);
            let errorMsg = message.length < 5
                ? getTranslation('contact.validation.messageLength') || 'Poruka mora imati najmanje 5 karaktera.'
                : getTranslation('contact.validation.messageRandom') || 'Poruka ne smije sadržavati nasumičan tekst.';
            return {
                isValid: false,
                message: errorMsg
            };
        }

        return { isValid: true, message: '' };
    }

    // Specific validation functions
    function validateSubject(subject) {
        if (subject.length < 2) return false;

        // Check for random text (repeating characters, no vowels, etc.)
        if (isRandomText(subject)) return false;

        return true;
    }

    function validatePhone(phone) {
        // Basic phone validation - allow numbers, +, -, spaces, parentheses
        const phoneRegex = /^[+]?[0-9\s\-\(\)]{6,20}$/;
        return phoneRegex.test(phone);
    }

    function validateMessage(message) {
        if (message.length < 5) return false;

        // Check for random text
        if (isRandomText(message)) return false;

        return true;
    }

    // Detect random text (simple heuristic)
    function isRandomText(text) {
        // Remove spaces and convert to lowercase
        const cleanText = text.replace(/\s+/g, '').toLowerCase();

        // Check for repeating characters (like "aaaa", "1111")
        if (/(.)\1{3,}/.test(cleanText)) return true;

        // Check for very low vowel-to-consonant ratio (indicative of random typing)
        const vowels = cleanText.match(/[aeiou]/gi);
        const consonants = cleanText.match(/[bcdfghjklmnpqrstvwxyz]/gi);

        if (!vowels && consonants && consonants.length > 8) return true;

        // Check for keyboard walking (adjacent keys)
        const commonRandomPatterns = [
            /qwerty/i, /asdfgh/i, /zxcvbn/i, /123456/i,
            /qazwsx/i, /edcrfv/i, /tgbnhy/i
        ];

        return commonRandomPatterns.some(pattern => pattern.test(text));
    }

    // Field error display functions
    function showFieldError(field, message) {
        // Remove existing error
        removeFieldError(field);

        // Create error element
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;

        // Insert after the field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    function removeFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    function clearFieldErrors() {
        const errors = document.querySelectorAll('.field-error');
        errors.forEach(error => error.remove());

        const fields = document.querySelectorAll('.info input, .info textarea');
        fields.forEach(field => {
            field.classList.remove('invalid', 'valid');
        });
    }

    // Notification function
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.form-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `form-notification form-notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // ==================== OPTIMIZOVAN PRICE MANAGEMENT ====================
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

    function formatPrice(priceData) {
        if (!priceData) return '';

        let prefix = '';
        if (priceData.prefix) {
            const prefixTranslations = {
                'sr': 'od',
                'en': 'from',
                'ru': 'от'
            };
            const translatedPrefix = prefixTranslations[currentLanguage] || 'od';
            prefix = `<small>${translatedPrefix}</small> &nbsp;`;
        }

        let plus = '';
        if (priceData.plus) {
            plus = `<span class="price-plus">+</span>`;
        }

        return `${prefix}${priceData.price?.toFixed(2) || '0.00'} €${plus}`;
    }

    // ==================== OPTIMIZOVAN RADIO PRICE MANAGEMENT ====================
    function setupRadioPrices() {
        const radioSections = [
            { sectionId: 1, planKey: 'dubinsko_pranje' },
            { sectionId: 2, planKey: 'vozila_i_plovila' },
            { sectionId: 3, planKey: 'hoteli_i_jahte' }
        ];

        radioSections.forEach(section => {
            const radioPrices = currentPrices.radio_prices?.[section.planKey];
            if (!radioPrices) return;

            // Ažuriraj vrednosti za sva radio dugmad
            radioPrices.forEach(radioItem => {
                const radioElement = document.getElementById(radioItem.id);
                if (radioElement) {
                    let value = radioItem.price?.toFixed(2) || '0.00';
                    if (radioItem.plus) value += '+';
                    radioElement.value = value;
                    if (radioItem.disabled) radioElement.disabled = true;
                }
            });

            // Postavi event listener na container
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

            // Inicijalno postavi prikaz za checked radio
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

    function updateRadioPriceDisplay(output, radioItem, sectionId) {
        let priceHtml = `<span class="euro">€</span><span>${radioItem.price?.toFixed(2) || '0.00'}</span>`;
        if (radioItem.plus) priceHtml += `<span class="price-plus">+</span>`;

        let html = priceHtml;
        if (sectionId === 2 && radioItem.price === 100.00) {
            const dryingText = getTranslation('pricing.dryingText') || 'sušenje';
            html += ` <p class="level"><span>${dryingText}</span> ~ 24<sup>h</sup></p>`;
        }

        output.innerHTML = html;

        const button = document.getElementById(`showFullPrice-${sectionId}`);
        if (button) {
            button.classList.add('pulse');
            setTimeout(() => button.classList.remove('pulse'), 800);
        }
    }

    // ==================== OPTIMIZOVAN MODAL HISTORY MANAGEMENT ====================
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

    function closeAllModals() {
        closePricingModalWithoutHistory();
    }

    // ==================== OPTIMIZOVAN UI MANAGEMENT ====================
    const optimizedCheckStickyNavigation = debounce(() => {
        const heroSection = document.querySelector(".hero-text-box");
        if (!heroSection) return;

        const heroRect = heroSection.getBoundingClientRect();
        if (heroRect.bottom < 200) {
            body.classList.add("sticky");
            utils.addHidden(logo1);
            utils.removeHidden(logo2);
        } else {
            body.classList.remove("sticky");
            utils.removeHidden(logo1);
            utils.addHidden(logo2);
        }
    }, 10);

    function checkStickyNavigation() {
        optimizedCheckStickyNavigation();
    }

    // ==================== OPTIMIZOVANI EVENT HANDLERS ====================
    function setupEventListeners() {
        // Optimizovano scroll handling sa debounce
        window.addEventListener('scroll', function () {
            utils.closeAllUIElements();
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(function () {
                    scrollTimeout = null;
                    checkStickyNavigation();
                }, 10);
            }
        });

        // Mobile navigation
        btnNavEl?.addEventListener("click", function () {
            headerEl.classList.toggle("nav-open");
        });

        // Close mobile navigation on link click
        document.querySelectorAll("a.main-nav-link").forEach(link => {
            link.addEventListener("click", function () {
                headerEl.classList.toggle("nav-open");
            });
        });

        // Language toggle
        languageImg?.addEventListener("click", function (e) {
            utils.stopPropagation(e);
            utils.toggleHidden(language);
            utils.addHidden(callOptions);
            callUsImg?.classList.remove("callUs-is-open");
            callUsIcon?.classList.remove("open-callUs-remove");
        });

        // Call options toggle  
        phoneNumber?.addEventListener("click", function (e) {
            utils.stopPropagation(e);
            utils.toggleHidden(callOptions);
            utils.addHidden(language);
            callUsImg?.classList.remove("callUs-is-open");
            callUsIcon?.classList.remove("open-callUs-remove");
        });

        // Call Us dialog
        callUsIcon?.addEventListener('click', function (e) {
            utils.stopPropagation(e);
            callUsImg?.classList.add("callUs-is-open");
            this.classList.add("open-callUs-remove");
            utils.addHidden(language);
            utils.addHidden(callOptions);
        });

        callUsClose?.addEventListener('click', utils.closeAllUIElements);

        // Optimizovano outside click handling
        document.addEventListener('click', function (e) {
            // Proveri da li je klik van UI elemenata
            if (!e.target.closest('.language') &&
                !e.target.closest('.call-options') &&
                !e.target.closest('.callUs') &&
                !e.target.closest('#languageImg') &&
                !e.target.closest('.phone-number')) {
                utils.closeAllUIElements();
            }
        });

        // Prevent closing when clicking inside elements
        [language, callOptions, callUsImg].forEach(element => {
            element?.addEventListener('click', utils.stopPropagation);
        });
    }

    // ==================== OPTIMIZOVANA INTERNATIONALIZATION ====================
    function getTranslation(key) {
        if (window.currentTranslations) {
            return utils.getNestedValue(window.currentTranslations, key);
        }
        const element = document.querySelector(`[data-i18n="${key}"]`);
        return element ? element.textContent : null;
    }

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'sr') return loadTranslations('sr');
            return {};
        }
    }

    function applyTranslations(translations) {
        if (!translations) return;

        // Text translations
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const value = utils.getNestedValue(translations, key);
            if (value) element.textContent = value;
        });

        // HTML translations
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const value = utils.getNestedValue(translations, key);
            if (value) element.innerHTML = value;
        });

        // Placeholder translations
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const value = utils.getNestedValue(translations, key);
            if (value) element.placeholder = value;
        });

        // SEO optimizations
        updateSEOMetaTags(translations);
    }

    function updateSEOMetaTags(translations) {
        if (!translations) return;

        // HTML lang attribute
        const langMap = { 'sr': 'sr', 'en': 'en', 'ru': 'ru' };
        document.documentElement.lang = langMap[currentLanguage] || 'sr';

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

        // Update Open Graph tags
        updateOpenGraphTags(translations);
        updateSEOTags();
        injectStructuredData();
    }

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

    function updateSEOTags() {
        const currentUrl = getCurrentLanguageUrl();

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', currentUrl);

        updateHreflangTags(currentUrl);
    }

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

    function getCurrentLanguageUrl() {
        const baseUrl = 'https://perfectshine.me';
        return currentLanguage === 'sr' ? `${baseUrl}/` : `${baseUrl}/${currentLanguage}/`;
    }

    async function injectStructuredData() {
        try {
            const existingScript = document.getElementById('structured-data');
            if (existingScript) existingScript.remove();

            const response = await fetch('data/structured-data.json');
            let structuredData = await response.json();
            structuredData = await updateStructuredDataWithTranslations(structuredData);

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = 'structured-data';
            script.textContent = JSON.stringify(structuredData);
            document.head.appendChild(script);

        } catch (error) {
            console.error('Error loading structured data:', error);
            injectBasicStructuredData();
        }
    }

    async function updateStructuredDataWithTranslations(structuredData) {
        const translations = window.currentTranslations;
        if (translations && translations.pageDescription) {
            structuredData.description = translations.pageDescription;
        }
        return structuredData;
    }

    function injectBasicStructuredData() {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'structured-data';
        script.textContent = JSON.stringify(getStructuredData());
        document.head.appendChild(script);
    }

    function getStructuredData() {
        const translations = window.currentTranslations || {};
        return {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Perfect Shine",
            "description": translations.pageDescription || "Profesionalno dubinsko pranje automobila, garnitura, jahti i hotela",
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
            "openingHours": ["Mo-Su 08:00-20:00"],
            "areaServed": { "@type": "State", "name": "Crna Gora" },
            "serviceType": [
                "Dubinsko pranje automobila",
                "Pranje garnitura",
                "Održavanje jahti",
                "Čišćenje hotela",
                "Polimerizacija farova"
            ],
            "sameAs": [
                "https://www.instagram.com/_dubinsko_pranje_tivat",
                "https://www.facebook.com/profile.php?id=100064044033023"
            ]
        };
    }

    function updateLanguageDisplay(lang) {
        const languageImg = document.querySelector('#languageImg img');
        const languageDropdown = document.querySelector('.language');

        // Update main button
        if (languageImg && languageData[lang]) {
            languageImg.src = languageData[lang].flag;
            languageImg.alt = languageData[lang].name;
        }

        // Update dropdown menu
        const availableLanguages = Object.keys(languageData).filter(l => l !== lang);
        const flagLinks = languageDropdown?.querySelectorAll('.flagLink') || [];

        flagLinks.forEach(link => link.style.display = 'none');
        availableLanguages.forEach((langCode, index) => {
            if (flagLinks[index] && languageData[langCode]) {
                flagLinks[index].style.display = 'flex';
                flagLinks[index].setAttribute('data-lang-code', langCode);
                flagLinks[index].querySelector('.flag').src = languageData[langCode].flag.replace('+', '');
                flagLinks[index].querySelector('.flag').alt = languageData[langCode].name;

                const textNode = flagLinks[index].childNodes[2];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = ' ' + languageData[langCode].name;
                } else {
                    flagLinks[index].appendChild(document.createTextNode(' ' + languageData[langCode].name));
                }
            }
        });
    }

    async function changeLanguage(lang) {
        if (lang === currentLanguage) return;
        await loadAndApplyLanguage(lang);
        utils.addHidden(language);
        headerEl.classList.remove("nav-open");
    }

    // ==================== OPTIMIZOVAN PRICING MODAL MANAGEMENT ====================
    function setupPricingHistory() {
        window.addEventListener('load', function () {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#pricing-')) {
                const planId = hash.split('-')[1];
                showPricingModal(planId);
            }
        });
    }

    function showPricingModal(planId) {
        const modal = document.getElementById('pricing-modal');
        const modalTitle = document.getElementById('pricing-modal-title');
        const modalContent = document.getElementById('pricing-modal-content');

        if (!modal || modal.style.display === 'block') return;

        document.body.style.overflow = 'hidden';

        const planData = {
            '1': {
                titleKey: 'pricing.plans.dubinsko_pranje.modalTitle',
                pricesKey: 'dubinsko_pranje'
            },
            '2': {
                titleKey: 'pricing.plans.vozila_i_plovila.modalTitle',
                pricesKey: 'vozila_i_plovila'
            },
            '3': {
                titleKey: 'pricing.plans.hoteli_i_jahte.modalTitle',
                pricesKey: 'hoteli_i_jahte'
            }
        };

        const currentPlan = planData[planId];
        if (!currentPlan) return;

        const title = getTranslation(currentPlan.titleKey);
        modalTitle.textContent = title || 'Cjenovnik';
        modalContent.innerHTML = generatePricingContent(currentPlan.pricesKey);
        modal.style.display = 'block';

        const currentState = history.state;
        if (!currentState || currentState.modal !== 'pricing' || currentState.planId !== planId) {
            window.history.pushState({
                modal: 'pricing',
                planId: planId
            }, '', `#pricing-${planId}`);
        }

        setupPricingModalEventListeners();
    }

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

    function closePricingModalWithoutHistory() {
        const modal = document.getElementById('pricing-modal');
        if (!modal || modal.style.display === 'none') return;

        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function setupPricingModalEventListeners() {
        const modal = document.getElementById('pricing-modal');
        const modalBody = modal?.querySelector('.pricing-modal-body');
        const closeBtn = modal?.querySelector('.pricing-modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                utils.stopPropagation(e);
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

    function setupPricingModalButtons() {
        document.querySelectorAll('[id^="showFullPrice-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const planId = this.id.split('-')[1];
                showPricingModal(planId);
            });
        });
    }

    function generatePricingContent(pricesKey) {
        const prices = currentPrices[pricesKey];
        const translations = getTranslation(`pricing.modal.prices.${pricesKey}`);

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

    // ==================== OPTIMIZOVAN PARTNERS MARQUEE ====================
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

    // ==================== OPTIMIZOVANA MAIN INITIALIZATION ====================
    async function loadAndApplyLanguage(lang) {
        currentLanguage = lang;
        const translations = await loadTranslations(lang);
        window.currentTranslations = translations;
        applyTranslations(translations);
        updateLanguageDisplay(lang);
        closeAllModals();
        setupRadioPrices();
        localStorage.setItem('preferredLanguage', lang);
    }

    async function initializeApp() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'sr';
        await loadPrices();
        setupRadioPrices();
        updateLanguageDisplay(savedLanguage);
        await loadAndApplyLanguage(savedLanguage);
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
        utils.stopPropagation(e);
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