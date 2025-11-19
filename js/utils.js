// utils.js - CLEANED VERSION (ALL FORM VALIDATION REMOVED)
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

    // UI Management
    closeAllUIElements: (elements) => {
        if (elements.language) UTILS.addHidden(elements.language);
        if (elements.callOptions) UTILS.addHidden(elements.callOptions);
        if (elements.callUsImg) elements.callUsImg.classList.remove("callUs-is-open");
        if (elements.callUsIcon) elements.callUsIcon.classList.remove("open-callUs-remove");
    },

    // Price Formatting
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

    // Safe HTML creation for pricing modal
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

    // Helper to clean bullet points safely
    cleanBulletPoints: (text) => {
        if (!text) return '';
        // Convert HTML entities to plain text safely
        return text.replace(/&#x2022;/g, '•')
            .replace(/&bull;/g, '•')
            .replace(/&[#\w]+;/g, '');
    },

    // Structured Data Functions - NOVO DODANO
    loadStructuredData: async () => {
        try {
            const response = await fetch('data/structured-data.json');
            if (!response.ok) throw new Error('Failed to load structured data');
            return await response.json();
        } catch (error) {
            console.warn('Using fallback structured data:', error);
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
                    "geoRadius": 50000
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
    },

    injectStructuredData: (structuredData) => {
        // Ukloni postojeće structured data skripte
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => {
            if (script.textContent.includes('Perfect Shine') ||
                script.textContent.includes('LocalBusiness')) {
                script.remove();
            }
        });

        // Ubaci novu structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }
};