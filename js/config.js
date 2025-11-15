// config.js
const CONFIG = {
    languages: {
        'sr': { flag: 'img/flag/mne+.svg', name: 'Crnogorski' },
        'en': { flag: 'img/flag/eng+.svg', name: 'English' },
        'ru': { flag: 'img/flag/rus+.svg', name: 'Русский' }
    },

    validation: {
        phonePatterns: [
            // CRNA GORA - samo 9 cifara
            /^06[0-9]\d{6}$/,
            /^06[0-9][\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^\+382[\s\-]?6[0-9][\s\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^03[0-9]\d{5}$/,
            /^03[0-9][\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^\+382[\s\-]?3[0-9][\s\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^020[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^031[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^032[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^033[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^040[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^041[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,
            /^050[\s\/\-]?\d{3}[\s\/\-]?\d{3}$/,

            // SRBIJA - 9-10 cifara
            /^\+381[\s\-]?6[0-9][\s\-]?\d{6,7}$/,
            /^\+381[\s\-]?6[0-9][\s\-]?\d{3}[\s\/\-]?\d{3,4}$/,
            /^\+381[\s\-]?1[1-9][\s\-]?\d{6,7}$/,
            /^\+381[\s\-]?[2-3][0-9][\s\-]?\d{6,7}$/
        ],

        countryRules: {
            'SRB': { mobileLength: [9, 10], landlineLength: [9, 10] },
            'MNE': { mobileLength: [9], landlineLength: [9] }
        },

        keyboardPatterns: [
            /qwerty|asdfgh|zxcvbn|123456|abcdef/i,
            /qazwsx|edcrfv|tgbnhy|yhnujm|ikm,|ol.|p;|['\]]/i,
            /mnbvcxz|lkjhgfdsa|poiuytrewq/i
        ],

        sequentialPatterns: [
            /123|234|345|456|567|678|789|987|876|765|654|543|432|321/,
            /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i
        ],

        legitimateDoubleWords: new Set([
            'address', 'class', 'glass', 'pass', 'book', 'look', 'food', 'good',
            'door', 'floor', 'feel', 'keep', 'deep', 'meet', 'pool', 'room', 'soon',
            'add', 'egg', 'inn', 'off', 'well', 'will', 'ball', 'call', 'fall'
        ])
    },

    pricing: {
        plans: {
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
        },

        radioSections: [
            { sectionId: 1, planKey: 'dubinsko_pranje' },
            { sectionId: 2, planKey: 'vozila_i_plovila' },
            { sectionId: 3, planKey: 'hoteli_i_jahte' }
        ]
    },

    selectors: {
        body: 'body',
        header: '.header',
        btnMobileNav: '.btn-mobile-nav',
        languageImg: '#languageImg',
        language: '.language',
        phoneNumber: '.phone-number',
        callOptions: '.call-options',
        callUsImg: '.callUs',
        callUsClose: '.callUs-close',
        callUsIcon: '.open-callUs',
        logo1: '.logo',
        logo2: '.logo-sm',
        year: '.year'
    }
};