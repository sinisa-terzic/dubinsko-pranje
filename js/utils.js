// utils.js - COMPLETE FIXED VERSION
const UTILS = {
    // DOM Utilities
    getNestedValue: (obj, path) => {
        if (!obj || !path) return null;
        return path.split('.').reduce((current, key) => current?.[key], obj);
    },

    stopPropagation: (e) => e?.stopPropagation?.(),

    addHidden: (element) => {
        if (element?.classList) element.classList.add('hidden');
    },

    removeHidden: (element) => {
        if (element?.classList) element.classList.remove('hidden');
    },

    toggleHidden: (element) => {
        if (element?.classList) element.classList.toggle('hidden');
    },

    safeQuery: (selector) => {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.warn('Invalid selector:', selector, error);
            return null;
        }
    },

    safeQueryAll: (selector) => {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.warn('Invalid selector:', selector, error);
            return [];
        }
    },

    // Performance Utilities
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validation Utilities
    isKeyboardPattern: (text) => {
        return CONFIG.validation.keyboardPatterns.some(pattern => pattern.test(text));
    },

    isSequentialPattern: (text) => {
        if (text.length < 4) return false;

        // Numeričke sekvence
        if (CONFIG.validation.sequentialPatterns[0].test(text)) return true;

        // Alfabetske sekvence
        for (let i = 0; i <= text.length - 3; i++) {
            const segment = text.substring(i, i + 3);
            if (UTILS.isAlphabeticalSequence(segment)) return true;
        }

        // Mješoviti patterni
        if (/^([a-z]\d){3,}|^(\d[a-z]){3,}/i.test(text)) return true;

        return false;
    },

    isAlphabeticalSequence: (segment) => {
        for (let i = 1; i < segment.length; i++) {
            if (Math.abs(segment.charCodeAt(i) - segment.charCodeAt(i - 1)) !== 1) return false;
        }
        return true;
    },

    hasIsolatedDoubleChars: (text) => {
        const words = text.toLowerCase().split(/\s+/);

        for (let word of words) {
            if (word.length < 2) continue;

            const doubleMatch = word.match(/([a-z])\1/);
            if (doubleMatch && !UTILS.isLegitimateDoubleWord(word)) {
                return true;
            }
        }
        return false;
    },

    isLegitimateDoubleWord: (word) => {
        if (CONFIG.validation.legitimateDoubleWords.has(word)) return true;
        if (word.length <= 2) return false;

        return /^[bcdfghjklmnpqrstvwxyz]{0,2}[aeiou]{1,2}[bcdfghjklmnpqrstvwxyz]{0,2}$/i.test(word) ||
            /^[aeiou]{1,2}[bcdfghjklmnpqrstvwxyz]{1,3}[aeiou]{0,2}$/i.test(word);
    },

    hasMeaningfulStructure: (text) => {
        const words = text.trim().split(/\s+/);
        if (words.length < 2 && text.length > 10) return false;

        const cleanText = text.replace(/[^a-zA-ZčćžšđČĆŽŠĐ]/g, '').toLowerCase();
        const vowels = cleanText.match(/[aeioučćžšđ]/gi);
        const consonants = cleanText.match(/[bcdfghjklmnpqrstvwxyz]/gi);

        if (!vowels || !consonants) return false;

        const vowelRatio = vowels.length / cleanText.length;
        if (vowelRatio < 0.2 || vowelRatio > 0.6) return false;

        return UTILS.hasCommonWordStructures(words);
    },

    hasCommonWordStructures: (words) => {
        const commonPatterns = ['pr', 'kr', 'tr', 'st', 'sp', 'the', 'and', 'ing', 'ed'];

        for (let word of words) {
            const cleanWord = word.toLowerCase().replace(/[^a-zčćžšđ]/g, '');
            if (cleanWord.length < 3) continue;

            for (let pattern of commonPatterns) {
                if (cleanWord.includes(pattern)) return true;
            }
        }
        return words.length <= 3;
    },

    // Phone Input Filter
    filterPhoneInput: (input) => {
        if (!input) return '';

        // Dozvoli samo: brojeve, +, -, space, /, (, )
        const filtered = input.replace(/[^\d+\-\s\/()]/g, '');
        return filtered;
    },

    // Phone Country Detection
    detectPhoneCountry: (phone) => {
        const clean = phone.replace(/[^\d+]/g, '');

        if (clean.startsWith('+381')) return 'SRB';
        if (clean.startsWith('+382')) return 'MNE';
        if (clean.startsWith('06') && clean.length === 9) return 'MNE';
        if (clean.startsWith('03') && clean.length === 9) return 'MNE';
        if (clean.startsWith('02') && clean.length === 9) return 'MNE';

        return null;
    },

    // Validiraj dužinu broja prema zemlji
    validatePhoneLengthByCountry: (phone, country) => {
        const clean = phone.replace(/[^\d]/g, '');
        const rules = CONFIG.validation.countryRules[country];

        if (!rules) return false;

        // Mobilni brojevi počinju sa 6
        const isMobile = clean.startsWith('6') || phone.includes('+3816') || phone.includes('+3826');

        const expectedLengths = isMobile ? rules.mobileLength : rules.landlineLength;
        return expectedLengths.includes(clean.length);
    },

    // Format phone number for display
    formatPhoneDisplay: (phone) => {
        if (!phone) return '';
        const clean = phone.replace(/[^\d+]/g, '');

        // INTERNACIONALNI FORMAT
        if (clean.startsWith('+382')) {
            // Fiksni brojevi: +382 32 123 456
            if (clean.startsWith('+3823')) {
                return clean.replace(/^(\+382)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
            }
            // Mobilni brojevi: +382 67 123 456  
            return clean.replace(/^(\+382)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
        }

        // INTERNACIONALNI SRBIJA
        if (clean.startsWith('+381')) {
            // Mobilni Srbija: +381 69 123 4567 (9-10 cifara)
            if (clean.startsWith('+3816')) {
                if (clean.length === 12) { // 9 cifara
                    return clean.replace(/^(\+381)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
                } else { // 10 cifara
                    return clean.replace(/^(\+381)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
                }
            }
            // Fiksni Srbija
            return clean.replace(/^(\+381)(\d{2})(\d{3})(\d{3,4})/, '$1 $2 $3 $4');
        }

        // FIKSNI BROJEVI CRNA GORA (032 123 456)
        if (clean.startsWith('03') && clean.length === 9) {
            return clean.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }

        // FIKSNI BROJEVI PODGORICA (020 123 456)
        if (clean.startsWith('020') && clean.length === 9) {
            return clean.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }

        // MOBILNI BROJEVI (06x xxx xxx)
        if (clean.startsWith('06') && clean.length === 9) {
            return clean.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }

        return phone;
    },

    // UI Management
    closeAllUIElements: (elements) => {
        if (elements.language) UTILS.addHidden(elements.language);
        if (elements.callOptions) UTILS.addHidden(elements.callOptions);
        if (elements.callUsImg) elements.callUsImg.classList.remove("callUs-is-open");
        if (elements.callUsIcon) elements.callUsIcon.classList.remove("open-callUs-remove");
    },

    // Price Formatting - UPDATED SAFE VERSION
    formatPrice: (priceData, currentLanguage) => {
        if (!priceData) return '0.00 €';

        let price = priceData.price?.toFixed(2) || '0.00';
        let result = `${price} €`;

        if (priceData.prefix) {
            const prefixTranslations = {
                'sr': 'od',
                'en': 'from',
                'ru': 'от'
            };
            const prefix = prefixTranslations[currentLanguage] || 'od';
            result = `${prefix} ${result}`;
        }

        if (priceData.plus) {
            result += '+';
        }

        return result;
    },

    // Safe HTML creation for pricing modal - FIXED VERSION
    createPricingContent: (pricesKey, currentPrices, currentLanguage, getTranslation) => {
        const container = document.createElement('div');
        container.className = 'pricing-modal-content-safe';

        const prices = currentPrices[pricesKey];
        const translations = getTranslation(`pricing.modal.prices.${pricesKey}`);

        if (!prices || !Array.isArray(prices) || prices.length === 0) {
            const noPrices = document.createElement('p');
            noPrices.className = 'pricing-no-prices';
            noPrices.textContent = 'Nema dostupnih cijena';
            container.appendChild(noPrices);
            return container;
        }

        prices.forEach((category, index) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'pricing-category';

            const title = document.createElement('h4');
            title.className = 'pricing-category-title';
            title.textContent = translations?.[index]?.name || category.name || 'Category';
            categoryEl.appendChild(title);

            const subitemsList = document.createElement('ul');
            subitemsList.className = 'pricing-subitems';

            if (category.subitems && Array.isArray(category.subitems)) {
                category.subitems.forEach((item, itemIndex) => {
                    const listItem = document.createElement('li');
                    listItem.className = 'pricing-subitem';

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'pricing-subitem-name';

                    // Safe text content - no innerHTML - FIXED: koristi UTILS.cleanBulletPoints
                    const translatedName = translations?.[index]?.subitems?.[itemIndex]?.name || item.name || '';
                    nameSpan.textContent = UTILS.cleanBulletPoints(translatedName);

                    const priceSpan = document.createElement('span');
                    priceSpan.className = 'pricing-subitem-price';
                    priceSpan.textContent = UTILS.formatPrice(item, currentLanguage);

                    listItem.appendChild(nameSpan);
                    listItem.appendChild(priceSpan);
                    subitemsList.appendChild(listItem);
                });
            }

            categoryEl.appendChild(subitemsList);
            container.appendChild(categoryEl);
        });

        return container;
    },

    // Helper to clean bullet points safely - FIXED: dodana funkcija
    cleanBulletPoints: (text) => {
        if (!text) return '';
        // Convert HTML entities to plain text safely
        return text.replace(/&#x2022;/g, '•')
            .replace(/&bull;/g, '•')
            .replace(/&[#\w]+;/g, '');
    }
};