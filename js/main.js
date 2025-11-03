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

    // ==================== MODAL HISTORY MANAGEMENT ====================
    function setupGlobalHistoryHandler() {
        window.addEventListener('popstate', function (event) {
            const state = event.state;

            if (!state) {
                // Zatvori sve modale kada se vratimo na osnovno stanje
                closeAllModals();

                // OSIGURAJ DA JE MARQUEE PONOVO POKRENUT
                setTimeout(() => {
                    if (window.manageMarqueeDuringModals) {
                        window.manageMarqueeDuringModals();
                    }
                }, 200);
                return;
            }

            if (state.modal === 'gallery') {
                // Ako smo se vratili na gallery state, ponovo otvori galeriju
                if (window.galleryManager && window.galleryManager.elements.modal.style.display === 'none') {
                    window.galleryManager.open(state.index);
                }
            } else if (state.modal === 'pricing') {
                // Ponovo otvori pricing modal samo ako nije već otvoren
                const pricingModal = document.getElementById('pricing-modal');
                if (pricingModal && pricingModal.style.display === 'none') {
                    showPricingModal(state.planId);
                }
            }
        });
    }

    function closeAllModals() {
        // Zatvori galeriju
        const galleryModal = document.getElementById('gallery-modal');
        if (galleryModal && galleryModal.style.display === 'block') {
            if (window.galleryManager) {
                window.galleryManager.closeModalWithoutHistory();
            }
        }

        // Zatvori pricing modal
        closePricingModalWithoutHistory();

        // OSIGURAJ DA JE MARQUEE PONOVO POKRENUT
        setTimeout(() => {
            if (window.manageMarqueeDuringModals) {
                window.manageMarqueeDuringModals();
            }
        }, 200);
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

    // ==================== PRICING MODAL MANAGEMENT ====================
    function setupPricingHistory() {
        // Proveri URL pri učitavanju stranice
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

        if (!modal) return;

        // Spriječi duplo otvaranje
        if (modal.style.display === 'block') return;

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

        // PAUZIRAJ MARQUEE KADA SE OTvORI MODAL
        if (window.manageMarqueeDuringModals) {
            window.manageMarqueeDuringModals();
        }

        // DODAJ U HISTORY SAMO AKO VEĆ NIJE DODATO
        const currentState = history.state;
        if (!currentState || currentState.modal !== 'pricing' || currentState.planId !== planId) {
            window.history.pushState({
                modal: 'pricing',
                planId: planId
            }, '', `#pricing-${planId}`);
        }

        // PONOVO POSTAVI EVENT LISTENERE nakon promene jezika
        setupPricingModalEventListeners();
    }

    function closePricingModal() {
        const modal = document.getElementById('pricing-modal');
        if (!modal) return;

        // Spriječi duplo zatvaranje
        if (modal.style.display === 'none') return;

        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // NASTAVI MARQUEE KADA SE ZATVORI MODAL
        setTimeout(() => {
            if (window.manageMarqueeDuringModals) {
                window.manageMarqueeDuringModals();
            }
        }, 100);

        // UKLONI HASH IZ URL-A SAMO AKO JE KORISNIK EKSPLICITNO ZATVORIO MODAL
        const currentState = history.state;
        if (currentState && currentState.modal === 'pricing') {
            // Ovo znači da je korisnik zatvorio modal (ESC, klik van modala, X dugme)
            if (window.location.hash && window.location.hash.startsWith('#pricing-')) {
                window.history.back();
            }
        }
    }

    function closePricingModalWithoutHistory() {
        const modal = document.getElementById('pricing-modal');
        if (!modal) return;

        // Spriječi duplo zatvaranje
        if (modal.style.display === 'none') return;

        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // NASTAVI MARQUEE KADA SE ZATVORI MODAL
        setTimeout(() => {
            if (window.manageMarqueeDuringModals) {
                window.manageMarqueeDuringModals();
            }
        }, 100);

        // NE DIRAJ HISTORY - ovo je pozvano zbog browser back dugmeta
    }

    function setupPricingModalEventListeners() {
        const modal = document.getElementById('pricing-modal');
        const closeBtn = modal?.querySelector('.pricing-modal-close');

        // Ukloni postojeće event listenere da ne bi bilo duplikata
        if (closeBtn) {
            closeBtn.replaceWith(closeBtn.cloneNode(true));
        }

        // Ponovo postavi event listenere
        const newCloseBtn = modal?.querySelector('.pricing-modal-close');

        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                closePricingModal();
            });
        }

        // Klik van modala
        if (modal) {
            // Ukloni postojeći event listener
            modal.removeEventListener('click', handleModalClick);

            // Dodaj novi event listener
            modal.addEventListener('click', handleModalClick);
        }

        function handleModalClick(e) {
            if (e.target === modal) {
                closePricingModal();
            }
        }

        // Escape key handler - globalni, ne mora da se resetuje
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
        // Postavi event listenere za dugmad koja otvaraju modal
        document.querySelectorAll('[id^="showFullPrice-"]').forEach(btn => {
            // Ukloni postojeće event listenere
            btn.replaceWith(btn.cloneNode(true));
        });

        // Ponovo postavi event listenere na nova dugmad
        document.querySelectorAll('[id^="showFullPrice-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const planId = this.id.split('-')[1];
                showPricingModal(planId);
            });
        });
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
        const wrapper = document.querySelector(".marquee-wrapper");

        if (!container || !wrapper) return;

        // Reset stanja prije ponovne inicijalizacije
        container.style.transform = "translateX(0px)";

        // Oznaci wrapper za kasnije referenciranje
        wrapper.dataset.marqueeInitialized = "false";

        if (prefersReducedMotion) {
            setupStaticPartnersLayout(container);
            return;
        }

        setupAnimatedMarquee(container, wrapper);
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

        // Ukloni duplikate za reduced motion
        for (let i = totalImages / 2; i < totalImages; i++) {
            images[i]?.remove();
        }
    }

    function setupAnimatedMarquee(container, wrapper) {
        // Kloniraj sadržaj za seamless loop
        const clones = container.cloneNode(true);
        container.appendChild(clones);

        let scrollAmount = 0;
        let isPaused = false;
        let animationFrameId;
        let isAnimating = true;

        // Resetuj transformaciju prije početka
        container.style.transform = "translateX(0px)";

        function marqueeScroll() {
            if (!isAnimating || !isPaused) {
                scrollAmount += 1;
                container.style.transform = `translateX(-${scrollAmount}px)`;

                // Reset kada pređe pola širine (originalni sadržaj)
                if (scrollAmount >= container.scrollWidth / 2) {
                    scrollAmount = 0;
                    container.style.transform = `translateX(0px)`;
                }
            }

            if (isAnimating) {
                animationFrameId = requestAnimationFrame(marqueeScroll);
            }
        }

        // Pokreni animaciju
        marqueeScroll();

        // Pause na hover/focus za bolje korisničko iskustvo
        setupMarqueeInteractions(wrapper, () => isPaused = true, () => isPaused = false);

        // Upravljanje vidljivošću stranice
        setupVisibilityManagement(() => {
            isAnimating = !document.hidden;
            if (isAnimating && !animationFrameId) {
                marqueeScroll();
            }
        });

        // Čuvanje reference za cleanup
        wrapper.dataset.marqueeInitialized = "true";
        wrapper._marqueeAnimation = {
            stop: () => {
                isAnimating = false;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            },
            start: () => {
                if (!isAnimating) {
                    isAnimating = true;
                    marqueeScroll();
                }
            },
            reset: () => {
                scrollAmount = 0;
                container.style.transform = "translateX(0px)";
            }
        };
    }

    function setupMarqueeInteractions(wrapper, onPause, onResume) {
        if (!wrapper) return;

        wrapper.addEventListener("mouseenter", onPause);
        wrapper.addEventListener("mouseleave", onResume);

        const logos = wrapper.querySelectorAll('.ratio');
        logos.forEach(logo => {
            logo.addEventListener('focus', onPause);
            logo.addEventListener('blur', onResume);
        });
    }

    function setupVisibilityManagement(callback) {
        document.addEventListener('visibilitychange', function () {
            callback();
        });
    }

    // NOVA FUNKCIJA: Pauziranje marquee efekta kada su modali otvoreni
    function manageMarqueeDuringModals() {
        const wrapper = document.querySelector(".marquee-wrapper");
        if (!wrapper || !wrapper._marqueeAnimation) return;

        const galleryModal = document.getElementById('gallery-modal');
        const pricingModal = document.getElementById('pricing-modal');

        const isAnyModalOpen =
            (galleryModal && galleryModal.style.display === 'block') ||
            (pricingModal && pricingModal.style.display === 'block');

        if (isAnyModalOpen) {
            // Pauziraj marquee kada su modali otvoreni
            wrapper._marqueeAnimation.stop();
            wrapper.style.opacity = '0.7'; // Vizuelni indikator pauze
        } else {
            // Nastavi marquee kada su modali zatvoreni
            wrapper._marqueeAnimation.start();
            wrapper.style.opacity = '1';

            // Reset pozicije ako je došlo do rasipanja
            setTimeout(() => {
                wrapper._marqueeAnimation.reset();
            }, 100);
        }
    }

    // NOVA FUNKCIJA: Cleanup marquee animacije
    function cleanupMarquee() {
        const wrapper = document.querySelector(".marquee-wrapper");
        if (!wrapper || !wrapper._marqueeAnimation) return;

        wrapper._marqueeAnimation.stop();
        delete wrapper._marqueeAnimation;
        wrapper.dataset.marqueeInitialized = "false";
    }

    // ==================== MAIN INITIALIZATION ====================
    async function loadAndApplyLanguage(lang) {
        currentLanguage = lang;
        const translations = await loadTranslations(lang);

        window.currentTranslations = translations;
        applyTranslations(translations);
        updateLanguageDisplay(lang);

        // ZATVORI SVE MODALE PRI PROMENI JEZIKA
        closeAllModals();

        // RE-INICIJALIZUJ PRICING MODAL EVENT LISTENERE
        setupPricing();
        setupPricingModalButtons();
        setupPartnersMarquee();

        localStorage.setItem('preferredLanguage', lang);
    }

    async function initializeApp() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'sr';

        updateLanguageDisplay(savedLanguage);
        await loadAndApplyLanguage(savedLanguage);
        checkStickyNavigation();
        setupGlobalHistoryHandler();
        setupPricingHistory();

        // INICIJALIZUJ PRICING MODAL EVENT LISTENERE
        setupPricingModalEventListeners();
        setupPricingModalButtons();

        // POSTAVI GLOBALNE FUNKCIJE ZA MARQUEE MANAGEMENT
        window.manageMarqueeDuringModals = manageMarqueeDuringModals;
        window.cleanupMarquee = cleanupMarquee;
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

    // Cleanup prije ponovnog učitavanja stranice
    window.addEventListener('beforeunload', function () {
        if (window.cleanupMarquee) {
            window.cleanupMarquee();
        }
    });

    initializeApp();
});