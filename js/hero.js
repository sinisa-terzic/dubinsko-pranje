// Debounce funkcija
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Fetch podaci i kreiranje elemenata
fetch('js/hero.json')
    .then(response => response.json())
    .then(data => {
        const heroTextBox = document.querySelector('.hero-text-box');

        // Postavi naslov
        const heroTitle = document.createElement('h1');
        heroTitle.classList.add('h1');
        heroTitle.textContent = data.hero.title;
        heroTextBox.appendChild(heroTitle);

        // Postavi paragraf za usluge sa ikonama
        const servicesParagraph = document.createElement('p');
        servicesParagraph.innerHTML = data.hero.services.map((service, index, array) => `
            ${service.name}
            ${index < array.length - 1 ? `
            <span class="hero-text-box-icon">
                &nbsp;
                <img class="header-icon" src="${service.icon}" alt="${service.name} icon">
                &nbsp;
            </span>` : ''}
        `).join('');
        heroTextBox.appendChild(servicesParagraph);

        // Dodaj call-to-action sekciju
        const callUsDiv = document.createElement('div');
        callUsDiv.classList.add('call-us', 'top-left-radius', 'width-100');
        callUsDiv.innerHTML = `
            <span class="call-us-text">${data.hero.callToAction.text}</span>
            <span class="call-us-icon">☎&nbsp;</span>
            <button class="phone-number">
                ${data.hero.callToAction.phoneNumber}
            </button>
            <div class="call-options flex noneDisplay" id="callOptions">
                ${data.hero.callToAction.options.map(option => `
                    <a href="${option.link}" class="call-option flex g-10 y_center">
                        <img src="${option.icon}" alt="${option.platform}" width="128" height="128">
                        ${option.platform}
                    </a>
                `).join('')}
            </div>
        `;
        heroTextBox.appendChild(callUsDiv);

        // Dodaj strelicu za skrolovanje
        const scrollDownArrow = document.createElement('a');
        scrollDownArrow.id = 'scroll-down-arrow';
        scrollDownArrow.href = data.hero.scrollDownLink;
        scrollDownArrow.innerHTML = `<span class="scroll-down-arrow">${data.hero.scrollDownText}</span>`;
        heroTextBox.appendChild(scrollDownArrow);

        // Event listener za prikazivanje/skrivanje opcija poziva
        const phoneNumber = document.querySelector(".phone-number");
        const callOptions = document.getElementById("callOptions");

        phoneNumber.addEventListener("click", (event) => {
            event.stopPropagation(); // Spreči propagaciju eventa dalje na document
            callOptions.classList.toggle("noneDisplay"); // Ukloni ili dodaj klasu noneDisplay
        });

        // Klik bilo gde drugde na dokumentu da se sakrije callOptions
        document.addEventListener('click', (event) => {
            if (!callOptions.classList.contains('noneDisplay') && !phoneNumber.contains(event.target)) {
                callOptions.classList.add('noneDisplay');
            }
        });

        // Debounced scroll event listener
        const handleScroll = () => {
            callOptions.classList.add('noneDisplay'); // Dodaj klasu bez obzira na visinu skrolovanja
        };

        const debouncedHandleScroll = debounce(handleScroll, 15); // 15ms debounce delay

        window.addEventListener('scroll', debouncedHandleScroll);
    })
    .catch(error => {
        console.error('Greška pri učitavanju hero podataka:', error);
    });
