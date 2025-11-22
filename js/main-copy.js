// main.js - SAMO CALLUS OVERLAY DODAT, SVE OSTALO ORIGINALNO
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
    const callUsOverlay = document.querySelector('#callUsOverlay');
    const logo1 = document.querySelector(".logo");
    const logo2 = document.querySelector(".logo-sm");

    let currentLanguage = 'sr';
    let scrollTimeout;
    let pricingModalInitialized = false;
    let currentPrices = {};
    let translationCache = {};

    // ==================== CALL US DIALOG MANAGEMENT ====================

    /**
     * Otvara callUs dialog sa browser history management
     */
    function openCallUsDialog() {
        if (callUsImg && callUsIcon && callUsOverlay) {
            callUsOverlay.classList.add("active");
            callUsImg.classList.add("callUs-is-open");
            callUsIcon.classList.add("open-callUs-remove");
            body.classList.add("callUs-open");

            UTILS.addHidden(language);
            UTILS.addHidden(callOptions);

            const currentState = history.state;
            if (!currentState || currentState.modal !== 'callUs') {
                window.history.pushState({
                    modal: 'callUs'
                }, '', `#callUs`);
            }

            setupCallUsEventListeners();
        }
    }

    /**
     * Zatvara callUs dialog sa browser history management
     */
    function closeCallUsDialog() {
        if (callUsImg && callUsOverlay) {
            callUsOverlay.classList.remove("active");
            callUsImg.classList.remove("callUs-is-open");
            callUsIcon?.classList.remove("open-callUs-remove");
            body.classList.remove("callUs-open");

            const currentState = history.state;
            if (currentState && currentState.modal === 'callUs') {
                if (window.location.hash && window.location.hash === '#callUs') {
                    window.history.back();
                }
            }
        }
    }

    /**
     * Zatvara callUs dialog bez manipulacije browser history-ja
     */
    function closeCallUsDialogWithoutHistory() {
        if (callUsImg && callUsOverlay) {
            callUsOverlay.classList.remove("active");
            callUsImg.classList.remove("callUs-is-open");
            callUsIcon?.classList.remove("open-callUs-remove");
            body.classList.remove("callUs-open");
        }
    }

    /**
     * Postavlja event listenere za callUs dialog
     */
    function setupCallUsEventListeners() {
        if (callUsOverlay) {
            callUsOverlay.addEventListener('click', function (e) {
                if (e.target === callUsOverlay) {
                    closeCallUsDialog();
                }
            });
        }

        document.addEventListener('keydown', function callUsKeyHandler(e) {
            if (e.key === 'Escape' && callUsImg.classList.contains("callUs-is-open")) {
                closeCallUsDialog();
                document.removeEventListener('keydown', callUsKeyHandler);
            }
        });
    }

    /**
     * Postavlja globalni history handler za callUs
     */
    function setupCallUsHistoryHandler() {
        window.addEventListener('popstate', function (event) {
            const state = event.state;

            if (!state || state.modal !== 'callUs') {
                closeCallUsDialogWithoutHistory();
            }

            if (window.location.hash === '#callUs') {
                openCallUsDialog();
            }
        });
    }

    // ==================== ORIGINALNE FUNKCIJE (NETAKNUTE) ====================

    const closeAllUIElements = () => {
        UTILS.addHidden(language);
        UTILS.addHidden(callOptions);
        closeCallUsDialogWithoutHistory();
    };

    const stopPropagation = (e) => e?.stopPropagation?.();

    const debounce = UTILS.debounce;

    function showLanguageLoading(lang) {
        body.classList.add('language-changing');
        let loadingOverlay = document.querySelector('.language-loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'language-loading-overlay';
            document.body.appendChild(loadingOverlay);
        }

        const loadingTexts = {
            'sr': 'Učitavanje...',
            'en': 'Loading...',
            'ru': 'Загрузка...'
        };

        loadingOverlay.innerHTML = `
            <div class="language-loading-spinner"></div>
            <p class="language-loading-text">${loadingTexts[lang] || 'Loading...'}</p>
        `;

        loadingOverlay.classList.add('active');
        loadingOverlay.style.display = 'flex';
    }

    function hideLanguageLoading() {
        body.classList.remove('language-changing');
        const loadingOverlay = document.querySelector('.language-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
            loadingOverlay.style.display = 'none';
        }
    }

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
        closeCallUsDialogWithoutHistory();
    }

    function closePricingModalWithoutHistory() {
        const modal = document.getElementById('pricing-modal');
        if (!modal || modal.style.display === 'none') return;
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

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
        return UTILS.formatPrice(priceData, currentLanguage);
    }

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

    function resetHotelRadios() {
        const hotelRadios = document.querySelectorAll('#checkboxes-3 input[type="radio"]');
        hotelRadios.forEach(radio => {
            radio.checked = false;
        });

        const hotelOutput = document.getElementById('total-3');
        if (hotelOutput) {
            hotelOutput.innerHTML = '<span class="euro">€</span><span>0.00</span>';
        }
    }

    function updateRadioPriceDisplay(output, radioItem, sectionId) {
        if (sectionId === 2 && radioItem.price === 100.00) {
            const dryingText = getTranslation('pricing.dryingText') || 'sušenje';
            output.innerHTML = `
                <span class="euro">€</span><span>${radioItem.price?.toFixed(2) || '0.00'}</span>
                ${radioItem.plus ? '<span class="price-plus">+</span>' : ''}
                <p class="level"><span>${dryingText}</span> ~ 24<sup>h</sup></p>
            `;
        } else if (sectionId === 3) {
            const callUsText = getTranslation('pricing.callUsText') || 'pozovite nas!';
            output.innerHTML = `
                <span class="euro">€</span><span>${radioItem.price?.toFixed(2) || '0.00'}</span>
                <p class="level"><span class="call-us-trigger">${callUsText}</span></p>
            `;

            const callUsTrigger = output.querySelector('.call-us-trigger');
            if (callUsTrigger) {
                callUsTrigger.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openCallUsDialog();
                });

                setTimeout(() => {
                    callUsTrigger.classList.add('wiggle-animation');
                    setTimeout(() => {
                        callUsTrigger.classList.remove('wiggle-animation');
                    }, 1000);
                }, 100);
            }
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

    function checkStickyNavigation() {
        optimizedCheckStickyNavigation();
    }

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
            closeCallUsDialogWithoutHistory();
        });

        phoneNumber?.addEventListener("click", function (e) {
            stopPropagation(e);
            UTILS.toggleHidden(callOptions);
            UTILS.addHidden(language);
            closeCallUsDialogWithoutHistory();
        });

        callUsIcon?.addEventListener('click', function (e) {
            stopPropagation(e);
            openCallUsDialog();
        });

        callUsClose?.addEventListener('click', function (e) {
            stopPropagation(e);
            closeCallUsDialog();
        });

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

    function getTranslation(key) {
        if (window.currentTranslations) {
            return UTILS.getNestedValue(window.currentTranslations, key);
        }
        const element = document.querySelector(`[data-i18n="${key}"]`);
        return element ? element.textContent : null;
    }

    async function loadTranslations(lang) {
        if (translationCache[lang]) {
            return translationCache[lang];
        }

        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            const translations = await response.json();

            translationCache[lang] = translations;
            return translations;
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'sr') return loadTranslations('sr');
            return {};
        }
    }

    function updateHtmlLangAttribute(lang) {
        const htmlElement = document.documentElement;
        if (htmlElement) {
            htmlElement.setAttribute('lang', lang);
        }
    }

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

    function updateDynamicMetaTags(translations) {
        if (!translations) return;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && translations.pageDescription) {
            metaDescription.content = translations.pageDescription;
        }

        const pageTitle = document.querySelector('title');
        if (pageTitle && translations.pageTitle) {
            pageTitle.textContent = translations.pageTitle;
        }

        updateOpenGraphTags(translations);
        updateGeoTags(translations);
    }

    function updateOpenGraphTags(translations) {
        const ogLocaleMap = { 'sr': 'sr_RS', 'en': 'en_US', 'ru': 'ru_RU' };

        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', translations?.pageTitle || 'Perfect Shine - Dubinsko Pranje');

        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
            ogDescription = document.createElement('meta');
            ogDescription.setAttribute('property', 'og:description');
            document.head.appendChild(ogDescription);
        }
        ogDescription.setAttribute('content', translations?.pageDescription ||
            'Profesionalno dubinsko pranje automobila, garnitura, jahti i hotela na crnogorskom primorju.');

        let ogLocale = document.querySelector('meta[property="og:locale"]');
        if (!ogLocale) {
            ogLocale = document.createElement('meta');
            ogLocale.setAttribute('property', 'og:locale');
            document.head.appendChild(ogLocale);
        }
        ogLocale.setAttribute('content', ogLocaleMap[currentLanguage] || 'sr_RS');

        ensureOpenGraphTags();
    }

    function ensureOpenGraphTags() {
        const requiredOgTags = [
            { property: 'og:type', content: 'website' },
            { property: 'og:site_name', content: 'Perfect Shine' },
            { property: 'og:image', content: 'https://perfectshine.me/img/logo/logo.png' },
            { property: 'og:image:width', content: '200' },
            { property: 'og:image:height', content: '200' },
            { property: 'og:url', content: 'https://perfectshine.me/' }
        ];

        requiredOgTags.forEach(tag => {
            let element = document.querySelector(`meta[property="${tag.property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', tag.property);
                element.setAttribute('content', tag.content);
                document.head.appendChild(element);
            }
        });
    }

    function updateGeoTags(translations) {
        const geoData = {
            'sr': {
                region: 'ME',
                placename: 'Kotor',
                position: '42.369187;18.753562',
                ICBM: '42.369187, 18.753562'
            },
            'en': {
                region: 'ME',
                placename: 'Kotor',
                position: '42.369187;18.753562',
                ICBM: '42.369187, 18.753562'
            },
            'ru': {
                region: 'ME',
                placename: 'Котор',
                position: '42.369187;18.753562',
                ICBM: '42.369187, 18.753562'
            }
        };

        const currentGeo = geoData[currentLanguage] || geoData['sr'];

        let geoRegion = document.querySelector('meta[name="geo.region"]');
        if (!geoRegion) {
            geoRegion = document.createElement('meta');
            geoRegion.setAttribute('name', 'geo.region');
            document.head.appendChild(geoRegion);
        }
        geoRegion.setAttribute('content', currentGeo.region);

        let geoPlacename = document.querySelector('meta[name="geo.placename"]');
        if (!geoPlacename) {
            geoPlacename = document.createElement('meta');
            geoPlacename.setAttribute('name', 'geo.placename');
            document.head.appendChild(geoPlacename);
        }
        geoPlacename.setAttribute('content', currentGeo.placename);

        let geoPosition = document.querySelector('meta[name="geo.position"]');
        if (!geoPosition) {
            geoPosition = document.createElement('meta');
            geoPosition.setAttribute('name', 'geo.position');
            document.head.appendChild(geoPosition);
        }
        geoPosition.setAttribute('content', currentGeo.position);

        let icbm = document.querySelector('meta[name="ICBM"]');
        if (!icbm) {
            icbm = document.createElement('meta');
            icbm.setAttribute('name', 'ICBM');
            document.head.appendChild(icbm);
        }
        icbm.setAttribute('content', currentGeo.ICBM);
    }

    function applyTranslations(translations) {
        if (!translations) return;

        window.currentTranslations = translations;

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

        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const value = UTILS.getNestedValue(translations, key);
            if (value) element.innerHTML = value;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const value = UTILS.getNestedValue(translations, key);
            if (value) element.placeholder = value;
        });

        updateFormPlaceholders();
        updateDynamicMetaTags(translations);
    }

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

    async function loadAndApplyLanguage(lang) {
        currentLanguage = lang;
        updateHtmlLangAttribute(lang);

        const translations = await loadTranslations(lang);
        window.currentTranslations = translations;
        applyTranslations(translations);

        updateLanguageDisplay(lang);
        setupRadioPrices();
        localStorage.setItem('preferredLanguage', lang);
    }

    async function changeLanguage(lang) {
        if (lang === currentLanguage) return;

        showLanguageLoading(lang);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            updateHtmlLangAttribute(lang);
            await loadAndApplyLanguage(lang);
            UTILS.addHidden(language);
            headerEl.classList.remove("nav-open");
        } catch (error) {
            console.error('Error changing language:', error);
        } finally {
            hideLanguageLoading();
        }
    }

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

        const currentPlan = CONFIG.pricing.plans[planId];
        if (!currentPlan) return;

        const title = getTranslation(currentPlan.titleKey);
        modalTitle.textContent = title || 'Cjenovnik';
        modalContent.innerHTML = generatePricingContent(currentPlan.pricesKey);
        modal.style.display = 'block';

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
            container.style.animation = "none";

            const images = container.querySelectorAll('.ratio');
            const totalImages = images.length;
            for (let i = totalImages / 2; i < totalImages; i++) {
                images[i]?.remove();
            }
        } else {
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
    }

    async function loadAndInjectStructuredData() {
        if (typeof UTILS !== 'undefined' && UTILS.loadStructuredData) {
            try {
                const structuredData = await UTILS.loadStructuredData();
                UTILS.injectStructuredData(structuredData);
            } catch (error) {
                console.warn('Error loading structured data:', error);
            }
        }
    }

    function closeLoader() {
        const loaderWrapper = document.getElementById('loaderWrapper');
        if (loaderWrapper) {
            setTimeout(() => {
                loaderWrapper.style.opacity = '0';
                loaderWrapper.style.visibility = 'hidden';
                setTimeout(() => {
                    if (loaderWrapper.parentNode) {
                        loaderWrapper.parentNode.removeChild(loaderWrapper);
                    }
                }, 1000);
            }, 500);
        }
    }

    async function initializeApp() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'sr';

        await loadPrices();
        setupRadioPrices();
        updateLanguageDisplay(savedLanguage);
        await loadAndApplyLanguage(savedLanguage);
        checkStickyNavigation();

        await loadAndInjectStructuredData();

        setupGlobalHistoryHandler();
        setupPricingHistory();
        setupCallUsHistoryHandler();
        setupPricingModalEventListeners();
        setupPricingModalButtons();
        setupPartnersMarquee();

        closeLoader();
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