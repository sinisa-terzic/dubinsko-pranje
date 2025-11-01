document.addEventListener('DOMContentLoaded', function () {

    // Simple price calculator
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

            // Set initial value
            const checked = document.querySelector(`#checkboxes-${section.id} input[type="radio"]:checked`);
            if (checked) {
                updatePriceDisplay(output, checked.value, section.id);
            }
        });
    }

    function updatePriceDisplay(output, value, sectionId) {
        let html = `<span class="euro">€</span><span>${value}</span>`;

        // Add drying time for deep washing
        if (sectionId === 2 && value === '100.00') {
            const dryingText = getTranslation('pricing.dryingText') || 'sušenje';
            html += ` <p class="level"><span>${dryingText}</span> ~ 24<sup>h</sup></p>`;
        }

        output.innerHTML = html;
    }

    // Pomocna funkcija za nested keys
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    function getTranslation(key) {
        if (window.currentTranslations) {
            return getNestedValue(window.currentTranslations, key);
        }

        // Fallback: pokušaj pronaći prevedeni tekst u DOM-u
        const element = document.querySelector(`[data-i18n="${key}"]`);
        if (element) {
            return element.textContent;
        }

        return null;
    }

    // Modal handling
    function setupModals() {
        const modal = document.getElementById('priceModal');
        const closeBtn = modal?.querySelector('.close');

        // Show modal buttons
        document.querySelectorAll('[id^="showFullPrice-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const planId = this.id.split('-')[1];
                showPriceModal(planId);
            });
        });

        // Close modal
        closeBtn?.addEventListener('click', function () {
            modal.style.display = 'none';
        });

        // Close on outside click
        modal?.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }

    function showPriceModal(planId) {
        const modal = document.getElementById('priceModal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        const planData = {
            '1': {
                titleKey: 'pricing.plans.deepCleaning.modalTitle',
                pricesKey: 'deep_cleaning'
            },
            '2': {
                titleKey: 'pricing.plans.vehicles.modalTitle',
                pricesKey: 'vehicles_and_vessels'
            },
            '3': {
                titleKey: 'pricing.plans.hotels.modalTitle',
                pricesKey: 'hotels_and_yachts'
            }
        };

        const currentPlan = planData[planId];
        if (!currentPlan) return;

        // Set modal title from translations
        const title = getTranslation(currentPlan.titleKey);
        modalTitle.textContent = title || 'Cjenovnik';

        // Generate pricing content
        modalContent.innerHTML = generatePricingContent(currentPlan.pricesKey);

        modal.style.display = 'block';
    }

    function generatePricingContent(pricesKey) {
        const prices = getTranslation(`pricing.modal.prices.${pricesKey}`);

        if (!prices || !Array.isArray(prices) || prices.length === 0) {
            return '<p class="no-prices">Nema dostupnih cijena</p>';
        }

        let html = '';

        prices.forEach(category => {
            html += `
                <div class="price-category">
                    <h4 class="price-category-title">${category.name}</h4>
                    <ul class="price-subitems">
            `;

            if (category.subitems && Array.isArray(category.subitems)) {
                category.subitems.forEach(item => {
                    html += `
                        <li class="price-subitem">
                            <span class="subitem-name">${item.name}</span>
                            <span class="subitem-price">${item.value}</span>
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

    // Initialize pricing
    function initPricing() {
        setupPricing();
        setupModals();
    }

    // Wait for the main script to load translations
    function waitForTranslations() {
        if (window.currentTranslations) {
            initPricing();
        } else {
            setTimeout(waitForTranslations, 100);
        }
    }

    // Start waiting for translations
    waitForTranslations();
});