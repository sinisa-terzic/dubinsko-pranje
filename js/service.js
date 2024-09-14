fetch('js/services.json')
    .then(response => response.json())
    .then(data => {
        const servicesTitle = document.getElementById('services-title');
        const servicesContainer = document.getElementById('services-container');
        const servicesInfo = document.getElementById('services-info');
        const servicesFeature = document.getElementById('services-feature');

        // Dodaj naslovnu sekciju
        servicesTitle.innerHTML = `
            <div class="container">
                <span class="subheading">${data.title.subheading}</span>
                <h2 class="h2">${data.title.h2}</h2>
            </div>
        `;

        // Dodaj svaki servis
        data.services.forEach(service => {
            const serviceDiv = document.createElement('div');
            serviceDiv.classList.add('service');

            serviceDiv.innerHTML = `
            <div class="relative overflow-hidden">
                <div class="darkening-effect">
                    <img src="${service.image}" width="500" height="367" class="img service-photo" alt="${service.altText}" />
                    <img src="${service.bottomImage}" width="1680" height="95" class="img absolute img-bottom" alt="image bottom effect">
                </div>
                <div class="service-photo-link absolute flex-space-between">
                    <a href="#gallery">Galerija</a>
                    <a href="#pricing">Cijene</a>
                </div>
            </div>
            <div class="service-content">
                <div class="activities">
                    ${service.activities.map(activity => {
                const activityClass = getActivityClass(activity);
                return `<span class="activity p-sm ${activityClass}">${activity}</span>`;
            }).join('')}
                </div>
                <h3 class="service-title h3">${service.title}</h3>
                <ul class="activity-attributes">
                    ${service.attributes.map(attribute => `
                        <li class="activity-attribute p">
                            <ion-icon class="service-icon" name="${attribute.icon}"></ion-icon>
                            <a href="${attribute.link}"><span><strong>${attribute.name}</strong></span></a>
                        </li>
                    `).join('')}
                </ul>
            </div>
            `;

            servicesContainer.appendChild(serviceDiv);
        });

        // Dodaj info sadržaj
        servicesInfo.innerHTML = `
            <h3 class="h3-lg">${data.info.title}</h3>
            ${data.info.sections.map((section, index, array) => `
                <div class="flex info-service">
                    <img class="service-icon" width="30" height="30" alt="Info icon" src="${section.icon}">
                    <p class="p">${section.text}</p>
                </div>
                ${index < array.length - 1 ? '<img src="img/border/border-1-row.png" class="img border-1-row-p-15-0" alt="Border for page">' : ''}
            `).join('')}
        `;

        // Dodaj feature sekciju
        if (data.feature && servicesFeature) {
            data.feature.forEach(service => {
                const featureDiv = document.createElement('div');
                featureDiv.classList.add('feature');

                // Provjeri da li slika postoji
                if (service.image) {
                    featureDiv.innerHTML = `
                        <a href="#about">
                            <img src="${service.image}" width="550" height="367" class="img brand-photo" alt="${service.title}" />
                        </a>
                        <a href="#about">
                            <h3 class="feature-title h3">${service.title}</h3>
                        </a>
                        ${service.features.map(feature => `
                            <p class="feature-text flex p">
                                ${feature}
                            </p>
                        `).join('')}
                    `;
                } else {
                    featureDiv.innerHTML = `
                        <div class="service-list flex-column">
                            <a href="#services">
                                <h3 class="feature-title h3">${service.title}</h3>
                            </a>
                            ${service.features.map(feature => `
                                <p class="feature-text flex p">
                                    <ion-icon class="list-icon" name="checkmark-outline"></ion-icon>${feature}
                                </p>
                            `).join('')}
                        </div>
                    `;
                }

                servicesFeature.appendChild(featureDiv);
            });
        }
    })
    .catch(error => {
        console.error('Greška pri učitavanju JSON podataka:', error);
    });

// Funkcija za klasifikaciju aktivnosti
function getActivityClass(activity) {
    switch (activity.toLowerCase()) {
        case 'čišćenje':
            return 'activity-cleaning';
        case 'pranje':
            return 'activity-washing';
        case 'polimerizacija':
            return 'activity-polishing';
        case 'održavanje':
            return 'activity-upkeep';
        default:
            return '';
    }
}
