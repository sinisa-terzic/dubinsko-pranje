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

    // ==================== UTILITY FUNCTIONS ====================
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    function getTranslation(key) {
        if (window.currentTranslations) {
            return getNestedValue(window.currentTranslations, key);
        }
        const element = document.querySelector(`[data-i18n="${key}"]`);
        return element ? element.textContent : null;
    }

    // ==================== UI MANAGEMENT ====================
    function closeAllOpenElements() {
        language.classList.add('hidden');
        callOptions.classList.add('hidden');
        callUsImg.classList.remove("callUs-is-open");
        callUsIcon.classList.remove("open-callUs-remove");
    }

    function resetAllElements() {
        language.classList.add('hidden');
        callOptions.classList.add('hidden');
        callUsImg.classList.remove("callUs-is-open");
        callUsIcon.classList.remove("open-callUs-remove");
    }

    function checkStickyNavigation() {
        const heroRect = document.querySelector(".hero-text-box").getBoundingClientRect();

        if (heroRect.bottom < 200) {
            body.classList.add("sticky");
            logo1.classList.add("hidden");
            logo2.classList.remove("hidden");
        } else {
            body.classList.remove("sticky");
            logo1.classList.remove("hidden");
            logo2.classList.add("hidden");
        }
    }

    // ==================== EVENT HANDLERS ====================
    function setupEventListeners() {
        // Scroll handling
        window.addEventListener('scroll', function () {
            closeAllOpenElements();
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
        const allLinks = document.querySelectorAll("a:link");
        allLinks.forEach(function (link) {
            link.addEventListener("click", function (e) {
                if (link.classList.contains("main-nav-link")) {
                    headerEl.classList.toggle("nav-open");
                }
            });
        });

        // Language toggle
        languageImg?.addEventListener("click", function (e) {
            e.stopPropagation();
            language.classList.toggle("hidden");
            callOptions.classList.add('hidden');
            callUsImg.classList.remove("callUs-is-open");
            callUsIcon.classList.remove("open-callUs-remove");
        });

        // Call options toggle  
        phoneNumber?.addEventListener("click", function (e) {
            e.stopPropagation();
            callOptions.classList.toggle("hidden");
            language.classList.add('hidden');
            callUsImg.classList.remove("callUs-is-open");
            callUsIcon.classList.remove("open-callUs-remove");
        });

        // Call Us dialog
        callUsIcon?.addEventListener('click', function (e) {
            e.stopPropagation();
            callUsImg.classList.add("callUs-is-open");
            this.classList.add("open-callUs-remove");
            language.classList.add('hidden');
            callOptions.classList.add('hidden');
        });

        callUsClose?.addEventListener('click', resetAllElements);
        document.addEventListener('click', resetAllElements);

        // Prevent closing when clicking inside elements
        [language, callOptions, callUsImg].forEach(element => {
            element?.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        });
    }

    // ==================== INTERNATIONALIZATION ====================
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'sr') {
                return loadTranslations('sr');
            }
            return {};
        }
    }

    function applyTranslations(translations) {
        // Text translations
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const value = getNestedValue(translations, key);
            if (value) element.textContent = value;
        });

        // HTML translations
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const value = getNestedValue(translations, key);
            if (value) element.innerHTML = value;
        });

        // Update meta tags
        document.documentElement.lang = currentLanguage;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && translations.pageDescription) {
            metaDescription.content = translations.pageDescription;
        }

        const pageTitle = document.querySelector('title');
        if (pageTitle && translations.pageTitle) {
            pageTitle.textContent = translations.pageTitle;
        }

        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords && translations.pageKeywords) {
            metaKeywords.content = translations.pageKeywords;
        }
    }

    function updateLanguageDisplay(lang) {
        const languageImg = document.querySelector('#languageImg img');
        const languageDropdown = document.querySelector('.language');

        // Update main button
        if (languageImg) {
            languageImg.src = languageData[lang].flag;
            languageImg.alt = languageData[lang].name;
        }

        // Update dropdown menu
        const availableLanguages = Object.keys(languageData).filter(l => l !== lang);
        const flagLinks = languageDropdown.querySelectorAll('.flagLink');

        flagLinks.forEach(link => link.style.display = 'none');

        availableLanguages.forEach((langCode, index) => {
            if (flagLinks[index]) {
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
        document.querySelector('.language').classList.add('hidden');
        headerEl.classList.remove("nav-open");
    }

    // ==================== PRICING SYSTEM ====================
    function setupPricing() {
        const priceSections = [
            { id: 1 },
            { id: 2 },
            { id: 3 }
        ];

        priceSections.forEach(section => {
            const radios = document.querySelectorAll(`#checkboxes-${section.id} input[type="radio"]`);
            const output = document.getElementById(`total-${section.id}`);

            radios.forEach(radio => {
                radio.addEventListener('change', function () {
                    if (this.checked) {
                        updatePriceDisplay(output, this.value, section.id);
                    }
                });
            });

            const checked = document.querySelector(`#checkboxes-${section.id} input[type="radio"]:checked`);
            if (checked) {
                updatePriceDisplay(output, checked.value, section.id);
            }
        });
    }

    function updatePriceDisplay(output, value, sectionId) {
        let html = `<span class="euro">€</span><span>${value}</span>`;

        if (sectionId === 2 && value === '100.00') {
            const dryingText = getTranslation('pricing.dryingText') || 'sušenje';
            html += ` <p class="level"><span>${dryingText}</span> ~ 24<sup>h</sup></p>`;
        }

        output.innerHTML = html;
    }

    function setupPricingModals() {
        const modal = document.getElementById('pricing-modal');
        const closeBtn = modal?.querySelector('.pricing-modal-close');

        document.querySelectorAll('[id^="showFullPrice-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const planId = this.id.split('-')[1];
                showPricingModal(planId);
            });
        });

        closeBtn?.addEventListener('click', function () {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        modal?.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    function showPricingModal(planId) {
        const modal = document.getElementById('pricing-modal');
        const modalTitle = document.getElementById('pricing-modal-title');
        const modalContent = document.getElementById('pricing-modal-content');
        document.body.style.overflow = 'hidden';

        const planData = {
            '1': { titleKey: 'pricing.plans.deepCleaning.modalTitle', pricesKey: 'deep_cleaning' },
            '2': { titleKey: 'pricing.plans.vehicles.modalTitle', pricesKey: 'vehicles_and_vessels' },
            '3': { titleKey: 'pricing.plans.hotels.modalTitle', pricesKey: 'hotels_and_yachts' }
        };

        const currentPlan = planData[planId];
        if (!currentPlan) return;

        const title = getTranslation(currentPlan.titleKey);
        modalTitle.textContent = title || 'Cjenovnik';
        modalContent.innerHTML = generatePricingContent(currentPlan.pricesKey);
        modal.style.display = 'block';
    }

    function generatePricingContent(pricesKey) {
        const prices = getTranslation(`pricing.modal.prices.${pricesKey}`);

        if (!prices || !Array.isArray(prices) || prices.length === 0) {
            return '<p class="pricing-no-prices">Nema dostupnih cijena</p>';
        }

        let html = '';

        prices.forEach(category => {
            html += `
            <div class="pricing-category">
                <h4 class="pricing-category-title">${category.name}</h4>
                <ul class="pricing-subitems">
        `;

            if (category.subitems && Array.isArray(category.subitems)) {
                category.subitems.forEach(item => {
                    html += `
                    <li class="pricing-subitem">
                        <span class="pricing-subitem-name">${item.name}</span>
                        <span class="pricing-subitem-price">${item.value}</span>
                    </li>
                `;
                });
            }

            html += `
                </ul>
            </div>
        `;
        });

        return html;
    }

    // ==================== PARTNERS MARQUEE ====================
    function setupPartnersMarquee() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const container = document.querySelector(".marquee-inner");

        if (!container) return;

        if (prefersReducedMotion) {
            container.style.transform = "none";
            container.style.flexWrap = "wrap";
            container.style.justifyContent = "center";
            container.style.gap = "2rem";
            container.style.padding = "2rem";

            const images = container.querySelectorAll('.ratio');
            const totalImages = images.length;
            for (let i = totalImages / 2; i < totalImages; i++) {
                images[i]?.remove();
            }
            return;
        }

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

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                cancelAnimationFrame(animationFrameId);
            } else {
                animationFrameId = requestAnimationFrame(marqueeScroll);
            }
        });
    }

    // ==================== MAIN INITIALIZATION ====================
    async function loadAndApplyLanguage(lang) {
        currentLanguage = lang;
        const translations = await loadTranslations(lang);

        window.currentTranslations = translations;
        applyTranslations(translations);
        updateLanguageDisplay(lang);

        // Initialize modules after translations
        setupPricing();
        setupPricingModals();
        setupPartnersMarquee();

        localStorage.setItem('preferredLanguage', lang);
    }

    async function initializeApp() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'sr';

        updateLanguageDisplay(savedLanguage);
        await loadAndApplyLanguage(savedLanguage);
        checkStickyNavigation();
    }

    // ==================== START APPLICATION ====================
    setupEventListeners();

    // Set current year
    document.querySelector(".year").textContent = new Date().getFullYear();

    // Language dropdown event
    document.querySelector('.language').addEventListener('click', function (e) {
        e.stopPropagation();
        const flagLink = e.target.closest('.flagLink');
        if (flagLink) {
            const langCode = flagLink.getAttribute('data-lang-code');
            changeLanguage(langCode);
        }
    });

    // Initialize when page loads
    window.addEventListener('load', function () {
        body.classList.add("loaded");
    });

    initializeApp();
});