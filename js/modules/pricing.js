import { EventBus } from '../core/event-bus.js';
import { Utilities } from '../core/utilities.js';

export class PricingModule {
    constructor() {
        this.modal = null;
        this.modalTitle = null;
        this.modalPriceListItems = null;
        this.pricingPlans = null;
        this.translations = null;
        this.languageModule = null;
        this.isTranslationsReady = false;
        this.currentOpenPlanType = null;
        this.isInitialized = false;

        this.planConfig = {
            1: { type: 'deepCleaning', key: 'deep_cleaning' },
            2: { type: 'vehicles', key: 'vehicles_and_vessels' },
            3: { type: 'hotels', key: 'hotels_and_yachts' }
        };
    }

    async initialize(dependencies = {}) {
        if (this.isInitialized) return;

        this.eventBus = dependencies.eventBus || EventBus;
        this.config = dependencies.config || {};

        this.cacheDOMElements();
        this.setupEventListeners();
        this.bindEvents();

        await this.waitForLanguageReady();

        this.isInitialized = true;
        this.emit('pricing:ready');
    }

    async waitForLanguageReady() {
        return new Promise((resolve) => {
            const checkLanguage = () => {
                // Dobij language module preko event busa ili global app
                if (window.app?.getModule) {
                    this.languageModule = window.app.getModule('language');
                }

                if (this.languageModule?.translations &&
                    Object.keys(this.languageModule.translations).length > 0) {

                    this.translations = this.languageModule.translations;
                    this.isTranslationsReady = true;
                    resolve();
                } else {
                    setTimeout(checkLanguage, 100);
                }
            };
            checkLanguage();
        });
    }

    cacheDOMElements() {
        this.modal = document.getElementById('priceModal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalPriceListItems = document.getElementById('modal-price-list-items');
        this.pricingPlans = document.querySelectorAll('.pricing-plan');
    }

    setupEventListeners() {
        this.pricingPlans.forEach((plan, index) => {
            const planIndex = index + 1;
            const config = this.planConfig[planIndex];

            if (!config) return;

            // Radio button handleri
            const radios = document.querySelectorAll(`#checkboxes-${planIndex} input[type="radio"]`);
            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    this.updateOutput(planIndex);
                });
            });

            // Full price button handler
            const fullPriceButton = document.getElementById(`showFullPrice-${planIndex}`);
            if (fullPriceButton) {
                fullPriceButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showFullPrice(config.type);
                });
            }
        });

        this.setupModalEvents();
    }

    setupModalEvents() {
        if (!this.modal) return;

        const closeModal = this.modal.querySelector('.close');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    bindEvents() {
        // Language change handler
        this.eventBus.on('language:changed', (data) => {
            this.translations = data.translations;
            this.isTranslationsReady = true;
            this.refreshPrices();

            setTimeout(() => {
                this.refreshModalContent();
            }, 50);
        });

        // Modal coordination
        this.eventBus.on('modal:open', (data) => {
            if (data.type !== 'pricing' && this.isModalOpen()) {
                this.closeModal();
            }
        });
    }

    updateOutput(planIndex) {
        const radios = document.querySelectorAll(`#checkboxes-${planIndex} input[type="radio"]`);
        const output = document.getElementById(`total-${planIndex}`);
        const levelElement = document.querySelector(`#checkboxes-${planIndex}`)?.closest('.pricing-plan')?.querySelector('.level');

        let selectedValue = '0.00';
        let isDeepWashingSelected = false;

        radios.forEach(radio => {
            if (radio.checked) {
                selectedValue = radio.value;
                isDeepWashingSelected = (radio.id === 'deepWashing');
            }
        });

        if (levelElement) {
            levelElement.classList.toggle('hidden', !isDeepWashingSelected);
        }

        if (output) {
            output.innerHTML = `<span class="euro">€</span><span>${selectedValue}</span>`;
        }
    }

    showFullPrice(planType) {
        if (!this.modal || !this.modalTitle || !this.modalPriceListItems) {
            return;
        }

        if (!this.isTranslationsReady) {
            setTimeout(() => this.showFullPrice(planType), 100);
            return;
        }

        const priceKey = this.planConfig[Object.keys(this.planConfig).find(key =>
            this.planConfig[key].type === planType
        )]?.key;

        if (!priceKey) {
            return;
        }

        this.currentOpenPlanType = planType;
        this.setModalTitle(planType);
        this.populateModalContent(priceKey);
        this.openModal();
    }

    setModalTitle(planType) {
        if (!this.isTranslationsReady) return;

        const translationKey = `pricing.plans.${planType}.modalTitle`;
        const translatedTitle = this.getTranslation(translationKey);

        if (translatedTitle) {
            this.modalTitle.textContent = translatedTitle;
        } else {
            // Fallback na osnovu planType
            const fallbackTitles = {
                'deepCleaning': 'Cjenovnik za dubinsko pranje',
                'vehicles': 'Cjenovnik za vozila i plovila',
                'hotels': 'Cjenovnik za hotele i jahte'
            };
            this.modalTitle.textContent = fallbackTitles[planType] || 'Cjenovnik';
        }
    }

    populateModalContent(priceKey) {
        if (!this.isTranslationsReady) {
            this.showFallbackContent();
            return;
        }

        const priceData = this.getTranslatedPriceData(priceKey);

        if (priceData && priceData.length > 0) {
            this.modalPriceListItems.innerHTML = this.renderTranslatedPriceData(priceData);
        } else {
            this.showFallbackContent();
        }
    }

    getTranslatedPriceData(priceKey) {
        return this.translations?.pricing?.modal?.prices?.[priceKey] || null;
    }

    renderTranslatedPriceData(priceData) {
        if (!Array.isArray(priceData)) {
            return this.getFallbackContent();
        }

        return priceData.map((category) => {
            const categoryName = this.decodeHtmlEntities(category.name);

            return `
                <div class="price-category">
                    <h5 class="priceDetalisTitle flex align-center">
                        <img class="details-icon" src="img/border/play.svg" alt="icon" width="16" height="16">
                        <span>${categoryName}</span>
                    </h5>
                    ${category.subitems && category.subitems.length > 0 ? `
                        <ul class="price-subitems">
                            ${category.subitems.map((subitem) => {
                const itemName = this.decodeHtmlEntities(subitem.name);
                const itemValue = this.decodeHtmlEntities(subitem.value);

                return `
                                    <li class="price-item flex justify-between item-row">
                                        <p class="item-name">${itemName}</p>
                                        <div class="dots"></div>
                                        <p class="item-value">${itemValue}</p>
                                    </li>
                                `;
            }).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    decodeHtmlEntities(text) {
        if (typeof text !== 'string') return text;
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }

    openModal() {
        if (!this.modal) return;

        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        this.emit('pricing:modalOpened');
        this.emit('modal:open', { type: 'pricing' });

        // Zatvori sve menue
        const navigationModule = window.app?.getModule('navigation');
        if (navigationModule?.closeAllMenus) {
            navigationModule.closeAllMenus();
        }
    }

    closeModal() {
        if (!this.modal) return;

        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentOpenPlanType = null;
        this.emit('pricing:modalClosed');
    }

    isModalOpen() {
        return this.modal?.style.display === 'block';
    }

    refreshPrices() {
        if (this.isInitialized) {
            this.pricingPlans.forEach((plan, index) => {
                this.updateOutput(index + 1);
            });
            this.emit('pricing:pricesRefreshed');
        }
    }

    refreshModalContent() {
        if (this.isModalOpen() && this.currentOpenPlanType) {
            const priceKey = this.planConfig[Object.keys(this.planConfig).find(key =>
                this.planConfig[key].type === this.currentOpenPlanType
            )]?.key;

            if (priceKey) {
                this.setModalTitle(this.currentOpenPlanType);
                const priceData = this.getTranslatedPriceData(priceKey);
                if (priceData && priceData.length > 0) {
                    this.modalPriceListItems.innerHTML = this.renderTranslatedPriceData(priceData);
                }
            }
        }
    }

    getTranslation(key) {
        if (!this.translations) return undefined;

        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    }

    translate(key) {
        return this.languageModule ? this.languageModule.translate(key) : key;
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    destroy() {
        // Cleanup event listeners
        this.eventBus.off('language:changed');
        this.eventBus.off('modal:open');
    }
}