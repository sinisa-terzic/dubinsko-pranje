document.addEventListener('DOMContentLoaded', () => {
    fetch('js/pricing.json')
        .then(response => response.json())
        .then(data => {
            const pricingContainer = document.querySelector('.section-pricing .container.grid');
            const pricingTitle = document.getElementById('pricing-title');

            // Dodaj naslovnu sekciju
            pricingTitle.innerHTML = `
                <div class="container">
                    <span class="subheading">${data.pricing.subheading}</span>
                    <h2 class="h2">${data.pricing.h2}</h2>
                </div>
            `;

            data.pricing.plans.forEach((plan, index) => {
                const pricingPlan = document.createElement('div');
                pricingPlan.classList.add('pricing-plan', 'price-list');

                pricingPlan.innerHTML = `
                    <div class="price-list-border-top"></div>
                    <header class="price-list-header">
                        <h3 class="price-list-title h3-sm">${plan.title}</h3>
                        <output id="total-${index + 1}" class="price-list-sum">
                            <span class="euro">€</span><span>0.00</span>
                        </output>
                        <p class="price-list-text">Izaberite servis</p>
                    </header>
                    <ul id="checkboxes-${index + 1}" class="checkboxes p">
                        ${plan.items.map(item => `
                            <li>
                                <label for="${item.id}" class="label-pricing flex-center">
                                    <input type="radio" id="${item.id}" name="${index === 0 ? 'furnitureType' : index === 1 ? 'washingType' : 'service'}" value="${item.value}" ${item.checked ? 'checked' : ''}>
                                    <span class="chtext">${item.name}</span>
                                    <span class="checkmark"></span>
                                </label>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="price-list-footer">
                        <p>${plan.footerText}</p>
                        <button id="showFullPrice-${index + 1}">${plan.buttonText}</button>
                    </div>
                `;

                pricingContainer.appendChild(pricingPlan);

                // Ažuriraj output tag pri inicijalnom učitavanju stranice
                function updateOutput() {
                    const radios = document.querySelectorAll(`#checkboxes-${index + 1} input[type="radio"]`);
                    const output = document.getElementById(`total-${index + 1}`);
                    let selectedValue = '0.00';
                    let additionalText = '';

                    radios.forEach(radio => {
                        if (radio.checked) {
                            selectedValue = radio.value;

                            // Dodaj nivo sušenja za dubinsko pranje u sekciji "Vozila i plovila"
                            if (plan.title === 'vozila i plovila' && radio.id === 'deepWashing') {
                                additionalText = ' <span class="level">sušenje ~ 24<sup>h</sup></span>';
                            }
                        }
                    });

                    output.innerHTML = `<span class="euro">€</span><span>${selectedValue}</span>${additionalText}`;
                }

                // Ažuriraj output pri učitavanju stranice
                updateOutput();

                // Dodaj događaj promene za radio dugmad
                const radios = document.querySelectorAll(`#checkboxes-${index + 1} input[type="radio"]`);
                radios.forEach(radio => {
                    radio.addEventListener('change', () => {
                        updateOutput();
                    });
                });

                // Funkcija za prikazivanje kompletnog cenovnika u modal prozoru
                function showFullPrice(planTitle) {
                    const modal = document.getElementById('priceModal');
                    const modalTitle = document.getElementById('modal-title');
                    const modalPriceItems = document.getElementById('modal-price-items');

                    // Dohvati cjenovnik iz JSON-a
                    const priceDetails = data.priceDetails[planTitle];

                    // Proveri da li priceDetails za planTitle postoji
                    if (priceDetails && Array.isArray(priceDetails)) {
                        // Postavi naslov modalnog prozora
                        if (planTitle === 'Hoteli & Jahte') {
                            modalTitle.innerText = 'Cjenovnik za hotele i jahte';
                        } else {
                            modalTitle.innerText = `Cjenovnik za ${planTitle}`;
                        }
                        modalPriceItems.innerHTML = `
                ${priceDetails.map((item, index) => `
                    <div class="priceDetalis">
                        <span class="details-icon" id="detail-icon-${index}">🔍</span>
                        <span>${item.name}</span>:
                        <!-- <span class="price">${item.value} €</span> -->
                        <div id="details-${index}" class="price-details" style="display: none;">
                            ${item.details}
                            <span class="close-details-icon" id="close-detail-icon-${index}">✖️</span>
                        </div>
                        ${item.subitems ? `
                        <div class="subitem-list">
                            ${item.subitems.map(subitem => `
                            <p>
                                <span>${subitem.name}</span>: <span class="price">${subitem.value} €</span>
                            </p>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            `;




                        // prikaži detalje stavke
                        priceDetails.forEach((item, index) => {
                            const detailIcon = document.getElementById(`detail-icon-${index}`);
                            const detailsDiv = document.getElementById(`details-${index}`);
                            const closeDetailIcon = document.getElementById(`close-detail-icon-${index}`);

                            // Otvori detalje na klik ikone 🔍
                            detailIcon.addEventListener('click', () => {
                                detailsDiv.style.display = 'block';
                            });

                            // Zatvori detalje na klik ikone ✖️
                            closeDetailIcon.addEventListener('click', () => {
                                detailsDiv.style.display = 'none';
                            });
                        });

                        // automatski zatvara otvorene div tagove sa detaljima, gornji kod otvara sve detalje
                        /*  priceDetails.forEach((item, index) => {
                             const detailIcon = document.getElementById(`detail-icon-${index}`);
                             const detailsDiv = document.getElementById(`details-${index}`);
                             const closeDetailIcon = document.getElementById(`close-detail-icon-${index}`);
 
                             // Funkcija za zatvaranje svih detalja
                             function closeAllDetails() {
                                 priceDetails.forEach((_, idx) => {
                                     const otherDetailsDiv = document.getElementById(`details-${idx}`);
                                     otherDetailsDiv.style.display = 'none';
                                 });
                             }
 
                             // Otvori detalje na klik ikone 🔍
                             detailIcon.addEventListener('click', () => {
                                 // Prvo zatvori sve druge detalje
                                 closeAllDetails();
                                 // Onda otvori trenutni div sa detaljima
                                 detailsDiv.style.display = 'block';
                             });
 
                             // Zatvori detalje na klik ikone ✖️
                             closeDetailIcon.addEventListener('click', () => {
                                 detailsDiv.style.display = 'none';
                             });
                         }); */

                        // Prikazi modal
                        modal.style.display = 'block';
                    } else {
                        console.error(`Nema podataka za plan: ${planTitle}`);
                    }
                }

                // Dodaj event listener za dugme za prikaz cjenovnika
                const fullPriceButton = document.getElementById(`showFullPrice-${index + 1}`);
                fullPriceButton.addEventListener('click', () => {
                    showFullPrice(plan.title);  // Prosledi naslov plana
                });
            });

            // Dodaj događaj za zatvaranje modala
            const modal = document.getElementById('priceModal');
            const closeModal = document.querySelector('.modal .close');

            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Zatvori modal kada kliknemo van njega
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });

        })
        .catch(error => {
            console.error('Greška pri učitavanju pricing podataka:', error);
        });
});
