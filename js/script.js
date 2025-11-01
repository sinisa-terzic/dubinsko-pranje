document.addEventListener('DOMContentLoaded', function () {

    // Cache DOM elements
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

    // Internationalization
    const languageData = {
        'sr': { flag: 'img/flag/mne+.svg', name: 'Crnogorski' },
        'en': { flag: 'img/flag/eng+.svg', name: 'English' },
        'ru': { flag: 'img/flag/rus+.svg', name: 'Русский' }
    };

    let currentLanguage = 'sr';

    // Zatvori sve otvorene elemente
    function closeAllOpenElements() {
        language.classList.add('hidden');
        callOptions.classList.add('hidden');
        callUsImg.classList.remove("callUs-is-open");
        callUsIcon.classList.remove("open-callUs-remove");
    }

    // Vrati sve na početno stanje
    function resetAllElements() {
        language.classList.add('hidden');
        callOptions.classList.add('hidden');
        callUsImg.classList.remove("callUs-is-open");
        callUsIcon.classList.remove("open-callUs-remove");
    }

    // Sticky navigation + zatvaranje elemenata pri skrolu
    let scrollTimeout;
    function checkStickyNavigation() {
        const heroRect = document.querySelector(".hero-text-box").getBoundingClientRect();

        // Logo toggle
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

    window.addEventListener('scroll', function () {
        // Zatvori sve otvorene elemente kada počne skrol
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

    // Close mobile naviagtion
    const allLinks = document.querySelectorAll("a:link");

    allLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
            // Close mobile naviagtion
            if (link.classList.contains("main-nav-link"))
                headerEl.classList.toggle("nav-open");
        });
    });

    // Language toggle
    languageImg?.addEventListener("click", function (e) {
        e.stopPropagation();
        language.classList.toggle("hidden");
        // Zatvori ostale
        callOptions.classList.add('hidden');
        callUsImg.classList.remove("callUs-is-open");
        callUsIcon.classList.remove("open-callUs-remove"); // Vrati ikonu
    });

    // Call options toggle  
    phoneNumber?.addEventListener("click", function (e) {
        e.stopPropagation();
        callOptions.classList.toggle("hidden");
        // Zatvori ostale
        language.classList.add('hidden');
        callUsImg.classList.remove("callUs-is-open");
        callUsIcon.classList.remove("open-callUs-remove"); // Vrati ikonu
    });

    // Call Us dialog - kada klikneš na ikonicu
    callUsIcon?.addEventListener('click', function (e) {
        e.stopPropagation();
        callUsImg.classList.add("callUs-is-open");
        this.classList.add("open-callUs-remove");
        // Zatvori ostale
        language.classList.add('hidden');
        callOptions.classList.add('hidden');
    });

    callUsClose?.addEventListener('click', function () {
        resetAllElements(); // Koristi reset umesto close
    });

    // Klik bilo gde da zatvori sve
    document.addEventListener('click', function () {
        resetAllElements(); // Koristi reset umesto close
    });

    // Spreči zatvaranje kada klikneš na sam element
    language?.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    callOptions?.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    callUsImg?.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Set current year
    document.querySelector(".year").textContent = new Date().getFullYear();

    // INTERNATIONALIZATION FUNCTIONS

    // Učitaj prevode
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback - pokušaj učitati default jezik
            if (lang !== 'sr') {
                console.log('Falling back to Serbian...');
                return loadTranslations('sr');
            }
            return {};
        }
    }

    // Primijeni prevode
    function applyTranslations(translations) {
        // Prevodi sa data-i18n atributom
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const value = getNestedValue(translations, key);
            if (value) element.textContent = value;
        });

        // Prevodi sa data-i18n-html atributom
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const value = getNestedValue(translations, key);
            if (value) element.innerHTML = value;
        });

        // Ažuriraj HTML lang atribut
        document.documentElement.lang = currentLanguage;

        // Ažuriraj meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && translations.pageDescription) {
            metaDescription.content = translations.pageDescription;
        }

        // Ažuriraj page title
        const pageTitle = document.querySelector('title');
        if (pageTitle && translations.pageTitle) {
            pageTitle.textContent = translations.pageTitle;
        }

        // Ažuriraj meta keywords ako postoji u prevodima
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords && translations.pageKeywords) {
            metaKeywords.content = translations.pageKeywords;
        }
    }

    // Pomocna funkcija za nested keys
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Ažuriraj prikaz jezika
    function updateLanguageDisplay(lang) {
        const languageImg = document.querySelector('#languageImg img');
        const languageDropdown = document.querySelector('.language');

        // Ažuriraj glavno dugme
        if (languageImg) {
            languageImg.src = languageData[lang].flag;
            languageImg.alt = languageData[lang].name;
        }

        // Ažuriraj padajući meni - prikaži samo ostale jezike (ukloni trenutni)
        const availableLanguages = Object.keys(languageData).filter(l => l !== lang);
        const flagLinks = languageDropdown.querySelectorAll('.flagLink');

        // Sakrij sve linkove prvo
        flagLinks.forEach(link => {
            link.style.display = 'none';
        });

        // Prikaži samo dostupne jezike
        availableLanguages.forEach((langCode, index) => {
            if (flagLinks[index]) {
                flagLinks[index].style.display = 'flex';
                flagLinks[index].setAttribute('data-lang-code', langCode);
                flagLinks[index].querySelector('.flag').src = languageData[langCode].flag.replace('+', '');
                flagLinks[index].querySelector('.flag').alt = languageData[langCode].name;
                // Pronađi tekstualni element unutar buttona (posljednji child node)
                const textNode = flagLinks[index].childNodes[2];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = ' ' + languageData[langCode].name;
                } else {
                    // Ako nema text node, dodaj tekst
                    flagLinks[index].appendChild(document.createTextNode(' ' + languageData[langCode].name));
                }
            }
        });
    }

    // UČITAJ I PRIMIJENI PREVODE - OVA FUNKCIJA SE POZIVA I ZA INICIJALNO UČITAVANJE
    async function loadAndApplyLanguage(lang) {
        currentLanguage = lang;
        const translations = await loadTranslations(lang);

        // POSTAVI GLOBALNU VARIJABLU ZA PRISTUP
        window.currentTranslations = translations;

        applyTranslations(translations);
        updateLanguageDisplay(lang);

        // Sačuvaj izbor u localStorage
        localStorage.setItem('preferredLanguage', lang);
    }

    // Promijeni jezik
    async function changeLanguage(lang) {
        if (lang === currentLanguage) return;

        await loadAndApplyLanguage(lang);

        // Zatvori padajući meni
        document.querySelector('.language').classList.add('hidden');

        // Zatvori mobile navigation ako je otvorena
        headerEl.classList.remove("nav-open");
    }

    // Event listener za padajući meni
    document.querySelector('.language').addEventListener('click', function (e) {
        e.stopPropagation();
        const flagLink = e.target.closest('.flagLink');
        if (flagLink) {
            const langCode = flagLink.getAttribute('data-lang-code');
            changeLanguage(langCode);
        }
    });

    // Inicijalizacija - odmah učitaj jezik
    async function initLanguage() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'sr';

        // Odmah ažuriraj prikaz jezika prije nego što se učitaju prevodi
        updateLanguageDisplay(savedLanguage);

        // ODMAN UČITAJ I PRIMIJENI PREVODE - ovo je ključna promjena
        await loadAndApplyLanguage(savedLanguage);

        // Sada kada su prevodi učitani, provjeri sticky navigation
        checkStickyNavigation();
    }

    // Loader - zatvori kada se stranica učita i inicijalizuj jezik
    window.addEventListener('load', function () {
        body.classList.add("loaded");
    });

    // Pokreni inicijalizaciju jezika odmah
    initLanguage();
});