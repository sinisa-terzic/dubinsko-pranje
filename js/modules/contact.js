import { EventBus } from '../core/event-bus.js';
import { Utilities } from '../core/utilities.js';

export class ContactModule {
    constructor() {
        this.contactForm = null;
        this.isInitialized = false;
        this.isSubmitting = false;
        this.hasUserStartedTyping = false;
        this.hasFieldErrors = false;

        this.languageModuleReady = false;
        this.waitForLanguagePromise = null;
        this.languageModule = null;
        this.translations = null;

        this.validationState = {
            subject: { isValid: false, isTouched: false },
            phone: { isValid: false, isTouched: false },
            message: { isValid: false, isTouched: false }
        };

        this.config = {
            apiEndpoint: '/send_email.php',
            validateForms: true,
            showSuccessMessage: true,
            successMessageDuration: 3000,
            phonePatterns: [
                /^\d{3} \d{3} \d{3}$/,           // xxx xxx xxx
                /^\d{3} \d{3} \d{4}$/,           // xxx xxx xxxx
                /^\+\d{3} \d{2} \d{3} \d{3}$/,   // +xxx xx xxx xxx
                /^\+\d{3} \d{2} \d{3} \d{4}$/,   // +xxx xx xxx xxxx
                /^\+\d{3} \d{1} \d{3} \d{6}$/,   // +xxx x xxx xxxxxx
                /^\d{9}$/,                        // xxxxxxxxx (spojeno)
                /^\d{10}$/,                       // xxxxxxxxxx (spojeno)
                /^\+\d{11,14}$/                   // +xxxxxxxxxxxx (spojeno)
            ],
            languageModuleTimeout: 3000
        };

        this.handleLanguageChange = this.handleLanguageChange.bind(this);
    }

    async initialize(dependencies = {}) {
        if (this.isInitialized) return;

        this.eventBus = dependencies.eventBus || EventBus;
        this.config = { ...this.config, ...dependencies.config };

        // Pokreni čekanje language modula paralelno
        this.waitForLanguagePromise = this.waitForLanguageModule();

        this.cacheDOMElements();
        this.setupEventListeners();
        this.initializeFormState();

        // Sačekaj language modul prije nego što ažuriramo placeholdere
        await this.waitForLanguagePromise;

        this.updatePlaceholders();

        this.isInitialized = true;
        this.emit('contact:ready');
    }

    async waitForLanguageModule() {
        const maxWaitTime = this.config.languageModuleTimeout || 3000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            const languageModule = window.app?.getModule('language');
            if (languageModule && languageModule.isInitialized && languageModule.translations) {
                this.languageModule = languageModule;
                this.translations = languageModule.translations;
                this.languageModuleReady = true;
                console.log('✅ Contact: Language module ready');
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log('ℹ️ Contact: Continuing without language module');
        this.languageModuleReady = false;
        return false;
    }

    // Nova metoda za čekanje spremnosti
    waitForReady() {
        return this.waitForLanguagePromise || Promise.resolve();
    }

    cacheDOMElements() {
        this.contactForm = document.querySelector('.section-contact form[method="POST"]');
        this.subjectInput = this.contactForm?.querySelector('input[name="subject"]');
        this.phoneInput = this.contactForm?.querySelector('input[name="phone"]');
        this.messageTextarea = this.contactForm?.querySelector('textarea[name="message"]');
        this.submitButton = this.contactForm?.querySelector('.sendMsg');

        this.setupPlaceholderAttributes();
        this.createFeedbackElements();
        this.createResetButton();
        this.createFieldErrorContainers();
    }

    setupPlaceholderAttributes() {
        if (this.subjectInput) {
            this.subjectInput.setAttribute('data-i18n', 'contact.subjectPlaceholder');
            this.subjectInput.setAttribute('data-i18n-placeholder', 'true');
        }
        if (this.phoneInput) {
            this.phoneInput.setAttribute('data-i18n', 'contact.phonePlaceholder');
            this.phoneInput.setAttribute('data-i18n-placeholder', 'true');
        }
        if (this.messageTextarea) {
            this.messageTextarea.setAttribute('data-i18n', 'contact.messagePlaceholder');
            this.messageTextarea.setAttribute('data-i18n-placeholder', 'true');
        }
    }

    createResetButton() {
        this.resetContainer = document.createElement('div');
        this.resetContainer.className = 'contact-reset-container hidden';
        this.resetContainer.innerHTML = `
            <button type="button" class="reset-form-btn" data-i18n="contact.resetForm">
                <ion-icon name="refresh-outline"></ion-icon>
                <span data-i18n="contact.resetForm">Reset Form</span>
            </button>
        `;

        if (this.contactForm && this.contactForm.parentNode) {
            this.contactForm.parentNode.insertBefore(this.resetContainer, this.contactForm);
        }

        this.resetButton = this.resetContainer.querySelector('.reset-form-btn');
    }

    createFeedbackElements() {
        if (!this.contactForm) return;

        // Success Message
        const successMessage = document.createElement('div');
        successMessage.className = 'contact-success hidden';
        successMessage.innerHTML = `
            <div class="success-content">
                <ion-icon name="checkmark-circle" class="success-icon"></ion-icon>
                <span class="success-text" data-i18n="contact.successMessage"></span>
                <button type="button" class="close-feedback" aria-label="Close message">
                    <ion-icon name="close-circle"></ion-icon>
                </button>
            </div>
        `;

        // Error Message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'contact-error hidden';
        errorMessage.innerHTML = `
            <div class="error-content">
                <ion-icon name="alert-circle" class="error-icon"></ion-icon>
                <span class="error-text" data-i18n="contact.errorMessage"></span>
                <button type="button" class="close-feedback" aria-label="Close message">
                    <ion-icon name="close-circle"></ion-icon>
                </button>
            </div>
        `;

        this.contactForm.parentNode.insertBefore(successMessage, this.contactForm);
        this.contactForm.parentNode.insertBefore(errorMessage, this.contactForm);

        this.successMessage = successMessage;
        this.errorMessage = errorMessage;
    }

    createFieldErrorContainers() {
        const fields = [
            { element: this.subjectInput, key: 'subject' },
            { element: this.phoneInput, key: 'phone' },
            { element: this.messageTextarea, key: 'message' }
        ];

        fields.forEach(({ element, key }) => {
            if (!element) return;

            const errorContainer = document.createElement('div');
            errorContainer.className = 'field-error hidden';
            errorContainer.setAttribute('data-i18n-key', `contact.${key}Required`);
            errorContainer.setAttribute('aria-live', 'polite');

            element.parentNode.insertBefore(errorContainer, element.nextSibling);
            element.dataset.fieldKey = key;
        });
    }

    initializeFormState() {
        if (this.submitButton) {
            this.updateSubmitButtonState();
        }
    }

    setupEventListeners() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Event listeneri za praćenje unosa podataka
        if (this.subjectInput) {
            this.subjectInput.addEventListener('input', (e) => {
                this.markUserStartedTyping();
                this.validateSubject(e.target);
                this.validateAllFields();
                this.checkFieldErrors();
            });
            this.subjectInput.addEventListener('blur', (e) => {
                this.markFieldTouched('subject');
                this.checkFieldErrors();
            });
            this.subjectInput.addEventListener('focus', () => {
                this.showAllFieldErrors();
                this.checkFieldErrors();
            });
        }

        if (this.phoneInput) {
            this.phoneInput.addEventListener('input', (e) => {
                this.markUserStartedTyping();
                this.formatPhoneNumber(e.target);
                this.validatePhone(e.target);
                this.validateAllFields();
                this.checkFieldErrors();
            });
            this.phoneInput.addEventListener('blur', (e) => {
                this.markFieldTouched('phone');
                this.checkFieldErrors();
            });
            this.phoneInput.addEventListener('focus', () => {
                this.showAllFieldErrors();
                this.checkFieldErrors();
            });
        }

        if (this.messageTextarea) {
            this.messageTextarea.addEventListener('input', (e) => {
                this.markUserStartedTyping();
                this.validateMessage(e.target);
                this.validateAllFields();
                this.checkFieldErrors();
            });
            this.messageTextarea.addEventListener('blur', (e) => {
                this.markFieldTouched('message');
                this.checkFieldErrors();
            });
            this.messageTextarea.addEventListener('focus', () => {
                this.showAllFieldErrors();
                this.checkFieldErrors();
            });
        }

        // Close feedback buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-feedback')) {
                this.resetForm();
                this.hideMessages();
            }
        });

        // Reset form button
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetForm();
                this.hideResetButton();
            });
        }

        // Language change handler
        this.eventBus.on('language:changed', this.handleLanguageChange);
        this.eventBus.on('language:ready', () => {
            this.updatePlaceholders();
            this.updateSubmitButtonText();
        });
    }

    markUserStartedTyping() {
        if (!this.hasUserStartedTyping) {
            this.hasUserStartedTyping = true;
            this.showResetButton();
            console.log('👤 User started typing - reset button shown');
        }
    }

    checkFieldErrors() {
        const hasVisibleErrors = Object.keys(this.validationState).some(fieldName => {
            const field = this.getFieldElement(fieldName);
            if (!field) return false;

            const errorContainer = field.nextElementSibling;
            return errorContainer &&
                errorContainer.classList.contains('field-error') &&
                !errorContainer.classList.contains('hidden');
        });

        if (hasVisibleErrors && !this.hasFieldErrors) {
            this.hasFieldErrors = true;
            this.showResetButton();
            console.log('⚠️ Field errors detected - reset button shown');
        } else if (!hasVisibleErrors && this.hasFieldErrors) {
            this.hasFieldErrors = false;
            if (!this.hasUserStartedTyping) {
                this.hideResetButton();
            }
        }
    }

    showResetButton() {
        if (this.resetContainer) {
            this.resetContainer.classList.remove('hidden');
        }
    }

    hideResetButton() {
        if (this.resetContainer) {
            this.resetContainer.classList.add('hidden');
        }
    }

    handleLanguageChange() {
        this.updateSubmitButtonText();
        this.updateFeedbackMessages();
        this.updateFieldErrorMessages();
        this.updatePlaceholders();
        this.updateResetButton();
    }

    updateResetButton() {
        if (this.resetButton) {
            const resetText = this.resetButton.querySelector('span');
            if (resetText) {
                resetText.textContent = this.translate('contact.resetForm');
            }
        }
    }

    updatePlaceholders() {
        if (this.subjectInput) {
            const translated = this.translate('contact.subjectPlaceholder');
            if (translated !== 'contact.subjectPlaceholder') {
                this.subjectInput.placeholder = translated;
            }
        }
        if (this.phoneInput) {
            const translated = this.translate('contact.phonePlaceholder');
            if (translated !== 'contact.phonePlaceholder') {
                this.phoneInput.placeholder = translated;
            }
        }
        if (this.messageTextarea) {
            const translated = this.translate('contact.messagePlaceholder');
            if (translated !== 'contact.messagePlaceholder') {
                this.messageTextarea.placeholder = translated;
            }
        }
    }

    markFieldTouched(fieldName) {
        this.validationState[fieldName].isTouched = true;
        this.updateFieldAppearance(fieldName);
        this.updateFieldError(fieldName);
        this.checkFieldErrors();
    }

    showAllFieldErrors() {
        Object.keys(this.validationState).forEach(fieldName => {
            if (!this.validationState[fieldName].isValid && this.validationState[fieldName].isTouched) {
                this.updateFieldError(fieldName);
            }
        });
        this.checkFieldErrors();
    }

    formatPhoneNumber(input) {
        let value = input.value;
        const hasPlus = value.startsWith('+');
        let cleanValue = value.replace(/\D/g, '');

        if (hasPlus && cleanValue.length > 0) {
            cleanValue = '+' + cleanValue;
        }

        input.value = cleanValue;
    }

    validateSubject(input) {
        const value = input.value.trim();
        const isValid = value.length > 0;

        this.validationState.subject.isValid = isValid;
        this.updateFieldAppearance('subject');
        this.updateFieldError('subject');

        return isValid;
    }

    validatePhone(input) {
        const value = input.value.trim();
        let isValid = false;

        for (const pattern of this.config.phonePatterns) {
            if (pattern.test(value)) {
                isValid = true;
                break;
            }
        }

        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length >= 9 && cleanValue.length <= 15) {
            isValid = true;
        }

        this.validationState.phone.isValid = isValid;
        this.updateFieldAppearance('phone');
        this.updateFieldError('phone');

        return isValid;
    }

    validateMessage(input) {
        const value = input.value.trim();
        const isValid = value.length >= 10;

        this.validationState.message.isValid = isValid;
        this.updateFieldAppearance('message');
        this.updateFieldError('message');

        return isValid;
    }

    validateAllFields() {
        this.updateSubmitButtonState();
    }

    isFormValid() {
        return Object.values(this.validationState).every(field => field.isValid);
    }

    updateFieldAppearance(fieldName) {
        const field = this.getFieldElement(fieldName);
        if (!field) return;

        const fieldState = this.validationState[fieldName];

        field.classList.remove('valid', 'invalid');

        if (fieldState.isTouched) {
            if (fieldState.isValid) {
                field.classList.add('valid');
            } else {
                field.classList.add('invalid');
            }
        }
    }

    updateFieldError(fieldName) {
        const field = this.getFieldElement(fieldName);
        if (!field) return;

        const errorContainer = field.nextElementSibling;
        if (errorContainer && errorContainer.classList.contains('field-error')) {
            const fieldState = this.validationState[fieldName];

            if (!fieldState.isValid && fieldState.isTouched) {
                let messageKey;
                switch (fieldName) {
                    case 'subject':
                        messageKey = 'contact.subjectRequired';
                        break;
                    case 'phone':
                        messageKey = this.phoneInput.value.trim().length > 0 ?
                            'contact.phoneInvalid' : 'contact.phoneRequired';
                        break;
                    case 'message':
                        messageKey = this.messageTextarea.value.trim().length > 0 ?
                            'contact.messageTooShort' : 'contact.messageRequired';
                        break;
                    default:
                        messageKey = 'contact.fieldRequired';
                }

                const message = this.translate(messageKey);
                errorContainer.textContent = message;
                errorContainer.classList.remove('hidden');
            } else {
                errorContainer.classList.add('hidden');
                errorContainer.textContent = '';
            }
        }

        this.checkFieldErrors();
    }

    updateFieldErrorMessages() {
        Object.keys(this.validationState).forEach(fieldName => {
            this.updateFieldError(fieldName);
        });
    }

    getFieldElement(fieldName) {
        switch (fieldName) {
            case 'subject': return this.subjectInput;
            case 'phone': return this.phoneInput;
            case 'message': return this.messageTextarea;
            default: return null;
        }
    }

    updateSubmitButtonState() {
        if (!this.submitButton) return;

        const allValid = this.isFormValid();
        this.submitButton.disabled = !allValid;
        this.updateSubmitButtonText();
    }

    updateSubmitButtonText() {
        if (!this.submitButton) return;

        const allValid = this.isFormValid();

        if (allValid) {
            this.submitButton.innerHTML = this.translate('contact.sendButton');
            this.submitButton.setAttribute('data-i18n', 'contact.sendButton');
        } else {
            this.submitButton.innerHTML = this.translate('contact.enterData');
            this.submitButton.removeAttribute('data-i18n');
        }
    }

    updateFeedbackMessages() {
        if (this.successMessage) {
            const successText = this.successMessage.querySelector('.success-text');
            if (successText) {
                successText.textContent = this.translate('contact.successMessage');
            }
        }

        if (this.errorMessage) {
            const errorText = this.errorMessage.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = this.translate('contact.errorMessage');
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        // SAKRIJ RESET DUGME KADA SE KLIKNE POŠALJI
        this.hideResetButton();

        Object.keys(this.validationState).forEach(fieldName => {
            this.validationState[fieldName].isTouched = true;
            this.updateFieldAppearance(fieldName);
            this.updateFieldError(fieldName);
        });

        this.checkFieldErrors();

        if (this.isSubmitting || !this.isFormValid()) {
            if (!this.isFormValid()) {
                this.showError('contact.validationError');
            }
            return;
        }

        this.isSubmitting = true;
        this.setSubmitButtonLoadingState(true);

        try {
            this.emit('contact:submitting');

            const formData = this.prepareFormData();
            await this.submitToAPI(formData);

            // USPJEŠNO POSLATO - PRIKAŽI SUCCESS PORUKU
            this.showSuccess('contact.successMessage');
            this.resetForm();
            this.emit('contact:success', { formData });

        } catch (error) {
            console.error('Contact form error:', error);
            // GREŠKA PRI SLANJU - PRIKAŽI ERROR PORUKU
            this.showError('contact.submissionError');
            this.emit('contact:error', { error, formData });
        } finally {
            this.isSubmitting = false;
            this.setSubmitButtonLoadingState(false);
        }
    }

    prepareFormData() {
        return {
            subject: this.subjectInput?.value.trim() || '',
            phone: this.phoneInput?.value.trim() || '',
            message: this.messageTextarea?.value.trim() || '',
            timestamp: new Date().toISOString(),
            location: 'Tivat, Montenegro'
        };
    }

    async submitToAPI(formData) {
        if (this.config.apiEndpoint) {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } else {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        messageId: 'msg_' + Date.now(),
                        timestamp: new Date().toISOString()
                    });
                }, 1500);
            });
        }
    }

    showSuccess(messageKey = 'contact.successMessage') {
        if (!this.successMessage) return;

        this.hideMessages();

        // Ažuriraj success poruku
        const successText = this.successMessage.querySelector('.success-text');
        if (successText) {
            successText.textContent = this.translate(messageKey);
        }

        this.successMessage.classList.remove('hidden');

        // Automatski sakrij success poruku nakon 3 sekunde
        if (this.config.showSuccessMessage) {
            setTimeout(() => {
                this.hideMessages();
            }, this.config.successMessageDuration);
        }
    }

    showError(messageKey = 'contact.errorMessage') {
        if (!this.errorMessage) return;

        this.hideMessages();

        // Ažuriraj error poruku
        const errorText = this.errorMessage.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = this.translate(messageKey);
        }

        this.errorMessage.classList.remove('hidden');

        // Error poruka ostaje vidljiva dok korisnik ne klikne X
        // Ne postavljamo auto-hide za error poruke
    }

    hideMessages() {
        if (this.successMessage) this.successMessage.classList.add('hidden');
        if (this.errorMessage) this.errorMessage.classList.add('hidden');
    }

    setSubmitButtonLoadingState(isSubmitting) {
        if (!this.submitButton) return;

        if (isSubmitting) {
            this.submitButton.disabled = true;
            this.submitButton.innerHTML = this.translate('contact.sending');
            this.submitButton.classList.add('loading');
        } else {
            this.updateSubmitButtonState();
            this.submitButton.classList.remove('loading');
        }
    }

    resetForm() {
        if (this.contactForm) {
            this.contactForm.reset();

            // Reset sva stanja
            Object.keys(this.validationState).forEach(fieldName => {
                this.validationState[fieldName] = { isValid: false, isTouched: false };
                this.updateFieldAppearance(fieldName);
                this.updateFieldError(fieldName);
            });

            this.hasUserStartedTyping = false;
            this.hasFieldErrors = false;
            this.hideResetButton();
            this.updateSubmitButtonState();
            this.hideMessages();

            console.log('🔄 Form reset successfully');
        }
    }

    translate(key) {
        if (this.languageModuleReady && this.languageModule) {
            return this.languageModule.translate(key);
        }

        // Fallback prijevodi
        const fallbackTranslations = {
            'contact.subjectPlaceholder': 'Subject',
            'contact.phonePlaceholder': 'Phone Number',
            'contact.messagePlaceholder': 'Your Message',
            'contact.sendButton': 'Send Message',
            'contact.enterData': 'Please enter all data',
            'contact.resetForm': 'Reset Form',
            'contact.successMessage': 'Message sent successfully!',
            'contact.errorMessage': 'Error sending message. Please try again.',
            'contact.sending': 'Sending...',
            'contact.subjectRequired': 'Subject is required',
            'contact.phoneRequired': 'Phone number is required',
            'contact.phoneInvalid': 'Please enter a valid phone number',
            'contact.messageRequired': 'Message is required',
            'contact.messageTooShort': 'Message must be at least 10 characters',
            'contact.validationError': 'Please fix validation errors',
            'contact.submissionError': 'Error sending message'
        };

        return fallbackTranslations[key] || key;
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    destroy() {
        if (this.contactForm) {
            this.contactForm.removeEventListener('submit', this.handleSubmit);
        }

        if (this.resetButton) {
            this.resetButton.removeEventListener('click', this.resetForm);
        }

        this.eventBus.off('language:changed', this.handleLanguageChange);
        this.eventBus.off('language:ready');
    }
}