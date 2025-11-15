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

    // ==================== UTILITY FUNCTIONS ====================
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

    // ==================== DEBOUNCE FUNCTION ====================
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

        setupClearButtons(contactForm);
        setupRealTimeValidation(contactForm);

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validate form first - if invalid, show error and STOP (don't submit, don't reset)
            const validationResult = validateContactForm(this);
            if (!validationResult.isValid) {
                showNotification(validationResult.message, 'error');
                return; // STOP here - don't submit, don't reset - user needs to fix input
            }

            // Only submit if validation passes
            await submitFormData(this);
        });
    }

    function setupClearButtons(form) {
        const clearButtons = form.querySelectorAll('.clear-input');

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

    function clearInputField(input) {
        input.value = '';
        input.focus();
        input.classList.remove('valid', 'invalid');
        removeFieldError(input);
        updateClearButtonVisibility(input);
    }

    function updateClearButtonVisibility(input) {
        const clearButton = input.closest('.input-wrapper, .textarea-wrapper').querySelector('.clear-input');
        const hasValue = input.value.trim() !== '';
        clearButton.style.opacity = hasValue ? '1' : '0';
        clearButton.style.visibility = hasValue ? 'visible' : 'hidden';
    }

    function setupRealTimeValidation(form) {
        form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]').forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', function () {
                if (this.classList.contains('invalid')) {
                    this.classList.remove('invalid');
                    removeFieldError(this);
                }
                updateClearButtonVisibility(this);
            });
        });
    }

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

    function updateFieldAppearance(field, isValid, message) {
        field.classList.remove('valid', 'invalid');
        removeFieldError(field);

        if (field.value.trim() !== '') {
            if (isValid) {
                field.classList.add('valid');
            } else {
                field.classList.add('invalid');
                showFieldError(field, message);
            }
        }
    }

    function validateContactForm(form) {
        const subject = form.querySelector('input[name="subject"]').value.trim();
        const phone = form.querySelector('input[name="phone"]').value.trim();
        const message = form.querySelector('textarea[name="message"]').value.trim();

        // Validacija obaveznih polja
        if (!subject || !phone || !message) {
            return { isValid: false, message: getTranslation('contact.validation.required') || 'Sva polja su obavezna.' };
        }

        // Validacija teme
        if (!validateTextContent(subject, 2)) {
            validateField(form.querySelector('input[name="subject"]'));
            return { isValid: false, message: getTranslation('contact.validation.subjectRandom') || 'Tema sadrži nevalidne karaktere.' };
        }

        // Validacija telefona
        if (!validatePhoneNumber(phone)) {
            validateField(form.querySelector('input[name="phone"]'));
            return { isValid: false, message: getTranslation('contact.validation.phoneInvalid') || 'Unesite ispravan broj telefona.' };
        }

        // Validacija poruke
        if (!validateTextContent(message, 5)) {
            validateField(form.querySelector('textarea[name="message"]'));
            return { isValid: false, message: getTranslation('contact.validation.messageRandom') || 'Poruka sadrži nevalidne karaktere.' };
        }

        return { isValid: true, message: '' };
    }

    function validatePhoneNumber(phone) {
        const cleanPhone = phone.replace(/\s+/g, '');

        // Osnovne provjere dužine
        if (cleanPhone.length < 6 || cleanPhone.length > 15) return false;

        // Format +381/382 xx xxx xxxx
        if (/^(\+381|\+382)\d{8,9}$/.test(cleanPhone)) return true;

        // Format 067 xxx xxx (crnogorski mobilni)
        if (/^06[7-9]\d{6}$/.test(cleanPhone)) return true;

        // Format 067/xxx/xxx ili 067-xxx-xxx
        if (/^06[7-9][\s\/\-]?\d{3}[\s\/\-]?\d{3}$/.test(cleanPhone)) return true;

        // Format +382 67 xxx xxx
        if (/^\+382[\s\-]?6[7-9][\s\-]?\d{3}[\s\-]?\d{3}$/.test(cleanPhone)) return true;

        // Format 020 xxx xxx (fiksni)
        if (/^020[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/.test(cleanPhone)) return true;

        return false;
    }

    function validateTextContent(text, minLength) {
        if (text.length < minLength) return false;

        const cleanText = text.toLowerCase().replace(/\s+/g, '');

        // Brze provjere za performance
        if (/(.)\1{2,}/.test(cleanText)) return false; // 3+ uzastopna ista karaktera
        if (isKeyboardPattern(text)) return false; // Keyboard walking pattern
        if (isSequentialPattern(cleanText)) return false; // Sekvencijalni patterni

        // Skupije provjere samo ako je potrebno
        if (hasIsolatedDoubleChars(text)) return false;
        if (!hasMeaningfulStructure(text)) return false;

        return true;
    }

    function isKeyboardPattern(text) {
        const patterns = [
            /qwerty|asdfgh|zxcvbn|123456|abcdef/i,
            /qazwsx|edcrfv|tgbnhy|yhnujm|ikm,|ol.|p;|['\]]/i,
            /mnbvcxz|lkjhgfdsa|poiuytrewq/i
        ];
        return patterns.some(pattern => pattern.test(text));
    }

    function isSequentialPattern(text) {
        if (text.length < 4) return false;

        // Provjera numeričkih sekvenci
        if (/123|234|345|456|567|678|789|987|876|765|654|543|432|321/.test(text)) return true;

        // Provjera alfabetskih sekvenci
        for (let i = 0; i <= text.length - 3; i++) {
            const segment = text.substring(i, i + 3);
            if (isAlphabeticalSequence(segment)) return true;
        }

        // Provjera mješovitih patterna
        if (/^([a-z]\d){3,}|^(\d[a-z]){3,}/i.test(text)) return true;

        return false;
    }

    function isAlphabeticalSequence(segment) {
        for (let i = 1; i < segment.length; i++) {
            if (Math.abs(segment.charCodeAt(i) - segment.charCodeAt(i - 1)) !== 1) return false;
        }
        return true;
    }

    function hasIsolatedDoubleChars(text) {
        const words = text.toLowerCase().split(/\s+/);
        const legitimateWords = new Set([
            'address', 'class', 'glass', 'pass', 'book', 'look', 'food', 'good',
            'door', 'floor', 'feel', 'keep', 'deep', 'meet', 'pool', 'room', 'soon',
            'add', 'egg', 'inn', 'off', 'well', 'will', 'ball', 'call', 'fall'
        ]);

        for (let word of words) {
            if (word.length < 2) continue;

            const doubleMatch = word.match(/([a-z])\1/);
            if (doubleMatch && !isLegitimateDoubleWord(word, legitimateWords)) {
                return true;
            }
        }
        return false;
    }

    function isLegitimateDoubleWord(word, legitimateWords) {
        if (legitimateWords.has(word)) return true;
        if (word.length <= 2) return false;

        // Provjera da li riječ prati osnovne jezičke pattern-e
        return /^[bcdfghjklmnpqrstvwxyz]{0,2}[aeiou]{1,2}[bcdfghjklmnpqrstvwxyz]{0,2}$/i.test(word) ||
            /^[aeiou]{1,2}[bcdfghjklmnpqrstvwxyz]{1,3}[aeiou]{0,2}$/i.test(word);
    }

    function hasMeaningfulStructure(text) {
        const words = text.trim().split(/\s+/);
        if (words.length < 2 && text.length > 10) return false;

        // Provjera balansa samoglasnika i suglasnika
        const cleanText = text.replace(/[^a-zA-ZčćžšđČĆŽŠĐ]/g, '').toLowerCase();
        const vowels = cleanText.match(/[aeioučćžšđ]/gi);
        const consonants = cleanText.match(/[bcdfghjklmnpqrstvwxyz]/gi);

        if (!vowels || !consonants) return false;

        const vowelRatio = vowels.length / cleanText.length;
        if (vowelRatio < 0.2 || vowelRatio > 0.6) return false;

        // Provjera za uobičajene strukture riječi
        return hasCommonWordStructures(words);
    }

    function hasCommonWordStructures(words) {
        const commonPatterns = ['pr', 'kr', 'tr', 'st', 'sp', 'the', 'and', 'ing', 'ed'];

        for (let word of words) {
            const cleanWord = word.toLowerCase().replace(/[^a-zčćžšđ]/g, '');
            if (cleanWord.length < 3) continue;

            for (let pattern of commonPatterns) {
                if (cleanWord.includes(pattern)) return true;
            }
        }
        return words.length <= 3; // Dozvoli kratke poruke bez kompleksnih pattern-a
    }

    async function submitFormData(form) {
        const submitButton = form.querySelector('.sendMsg');
        const originalText = submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent = getTranslation('contact.sending') || 'Slanje...';
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
                showNotification(getTranslation('contact.success') || 'Poruka je uspješno poslana!', 'success');
                resetForm(form);
            } else {
                // Server error - koristi prevedenu poruku umesto result.message
                showNotification(getTranslation('contact.error') || 'Došlo je do greške. Pokušajte ponovo.', 'error');
                resetForm(form);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showNotification(getTranslation('contact.error') || 'Došlo je do greške. Pokušajte ponovo.', 'error');
            resetForm(form);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            submitButton.classList.remove('loading');
        }
    }

    function resetForm(form) {
        form.reset();
        clearFieldErrors();
        form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]').forEach(updateClearButtonVisibility);
    }

    function showFieldError(field, message) {
        removeFieldError(field);
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    function removeFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();
    }

    function clearFieldErrors() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.info input, .info textarea').forEach(field => {
            field.classList.remove('invalid', 'valid');
        });
    }

    function showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.form-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = `form-notification form-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // ==================== UPDATE EXISTING ERRORS ON LANGUAGE CHANGE ====================
    function updateExistingErrors() {
        // Ažuriraj sve postojeće field errore
        const form = document.querySelector('form.info');
        if (!form) return;

        const fields = form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]');

        fields.forEach(field => {
            if (field.classList.contains('invalid')) {
                // Ponovo validiraj polje da bi dobili prevedenu poruku
                validateField(field);
            }
        });

        // Ažuriraj globalne notifikacije ako postoje
        const notification = document.querySelector('.form-notification');
        if (notification) {
            const isError = notification.classList.contains('form-notification-error');
            const isSuccess = notification.classList.contains('form-notification-success');

            let newMessage = '';
            if (isError) {
                newMessage = getTranslation('contact.error') || 'Došlo je do greške. Pokušajte ponovo.';
            } else if (isSuccess) {
                newMessage = getTranslation('contact.success') || 'Poruka je uspješno poslana!';
            }

            if (newMessage && notification.textContent !== newMessage) {
                notification.textContent = newMessage;
            }
        }
    }

    // ==================== PRICE MANAGEMENT ====================
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

    // ==================== MODAL HISTORY MANAGEMENT ====================
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
            } else {
                closeAllModals();
            }
        });
    }

    function closeAllModals() {
        closePricingModalWithoutHistory();
    }

    // ==================== PRICING MODAL MANAGEMENT ====================
    function setupPricingHistory() {
        window.addEventListener('load', function () {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#pricing-')) {
                const planId = hash.split('-')[1];
                showPricingModal(planId);
            }
        });
    }

    function setupPricingModalButtons() {
        document.querySelectorAll('[id^="showFullPrice-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const planId = this.id.split('-')[1];
                showPricingModal(planId);
            });
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

        // Reset scroll to top
        const modalBody = modal.querySelector('.pricing-modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
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

    function closePricingModal() {
        const modal = document.getElementById('pricing-modal');
        if (!modal || modal.style.display === 'none') return;

        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Reset scroll for next opening
        const modalBody = modal.querySelector('.pricing-modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }

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

        // Reset scroll for next opening
        const modalBody = modal.querySelector('.pricing-modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
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

    // ==================== PARTNERS MARQUEE ====================
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
        // Clone the content for seamless loop
        const originalContent = container.innerHTML;
        container.innerHTML = originalContent + originalContent;

        let scrollAmount = 0;
        let isPaused = false;
        let animationFrameId;
        const scrollSpeed = 1;

        function marqueeScroll() {
            if (!isPaused) {
                scrollAmount += scrollSpeed;
                const containerWidth = container.scrollWidth / 2;

                if (scrollAmount >= containerWidth) {
                    scrollAmount = 0;
                }

                container.style.transform = `translateX(-${scrollAmount}px)`;
            }
            animationFrameId = requestAnimationFrame(marqueeScroll);
        }

        marqueeScroll();

        // Pause on hover
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

        // Cleanup on page hide
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                isPaused = true;
            } else {
                isPaused = false;
            }
        });
    }

    // ==================== INTERNATIONALIZATION ====================
    function getTranslation(key) {
        if (window.currentTranslations) {
            const value = utils.getNestedValue(window.currentTranslations, key);
            if (value !== undefined && value !== null) {
                return value;
            }
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

        window.currentTranslations = translations;

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

        // Ažuriraj postojeće greške nakon primene prevoda
        updateExistingErrors();
    }

    function updateLanguageDisplay(lang) {
        const languageImg = document.querySelector('#languageImg img');
        const languageDropdown = document.querySelector('.language');

        if (languageImg && languageData[lang]) {
            languageImg.src = languageData[lang].flag;
            languageImg.alt = languageData[lang].name;
        }

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

    // ==================== UI MANAGEMENT ====================
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

    // ==================== MAIN INITIALIZATION ====================
    async function loadAndApplyLanguage(lang) {
        currentLanguage = lang;
        const translations = await loadTranslations(lang);
        window.currentTranslations = translations;
        applyTranslations(translations);
        updateLanguageDisplay(lang);
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
        setupPricingModalButtons();
        setupPricingModalEventListeners();
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