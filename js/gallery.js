/**
 * MODERN GALLERY - OPTIMIZOVANA RESPONZIVNA GALERIJA
 * Osnovne funkcionalnosti: grid prikaz, modal sa navigacijom, touch/mouse swipe, responsive slike
 */

class GalleryManager {
    constructor() {
        // Konfiguracija galerije
        this.config = {
            grid: {
                desktop: { rows: 2, gap: 3, minWidth: 250 },   // Grid za desktop
                tablet: { rows: 2, gap: 4, minWidth: 200 },   // Grid za tablet
                mobile: { rows: 2, gap: 4, minWidth: 150 }    // Grid za mobile
            },
            swipe: { threshold: 50 },                          // Minimalni swipe distance
            preload: {
                enabled: true,                                 // Preload susednih slika
                adjacentImages: 1                              // Broj susednih slika za preload
            }
        };

        // Lista slika sa različitim rezolucijama za različite uređaje
        this.images = [
            {
                id: 1,
                src: "img/gallery/1200x800/1.webp",           // Desktop modal slika
                srcMobile: "img/gallery/800x600/1.webp",      // Mobile modal slika
                thumbnail: "img/gallery/400x300/1.webp",      // Thumbnail za grid
                alt: "Prekrasan prikaz prirode 1"
            },
            {
                id: 2,
                src: "img/gallery/1200x800/2.webp",
                srcMobile: "img/gallery/800x600/2.webp",
                thumbnail: "img/gallery/400x300/2.webp",
                alt: "Moderna arhitektura 2"
            },
            {
                id: 3,
                src: "img/gallery/1200x800/3.webp",
                srcMobile: "img/gallery/800x600/3.webp",
                thumbnail: "img/gallery/400x300/3.webp",
                alt: "Gradski vidik noću 3"
            },
            {
                id: 4,
                src: "img/gallery/1200x800/4.webp",
                srcMobile: "img/gallery/800x600/4.webp",
                thumbnail: "img/gallery/400x300/4.webp",
                alt: "Planinski pejzaž 4"
            },
            {
                id: 5,
                src: "img/gallery/1200x800/5.webp",
                srcMobile: "img/gallery/800x600/5.webp",
                thumbnail: "img/gallery/400x300/5.webp",
                alt: "Morska obala 5"
            },
            {
                id: 6,
                src: "img/gallery/1200x800/6.webp",
                srcMobile: "img/gallery/800x600/6.webp",
                thumbnail: "img/gallery/400x300/6.webp",
                alt: "Šumska staza 6"
            },
            {
                id: 7,
                src: "img/gallery/1200x800/7.webp",
                srcMobile: "img/gallery/800x600/7.webp",
                thumbnail: "img/gallery/400x300/7.webp",
                alt: "Gradska četvrt 7"
            },
            {
                id: 8,
                src: "img/gallery/1200x800/8.webp",
                srcMobile: "img/gallery/800x600/8.webp",
                thumbnail: "img/gallery/400x300/8.webp",
                alt: "Zimski pejzaž 8"
            },
            {
                id: 9,
                src: "img/gallery/1200x800/9.webp",
                srcMobile: "img/gallery/800x600/9.webp",
                thumbnail: "img/gallery/400x300/9.webp",
                alt: "Pustinjski krajolik 9"
            },
            {
                id: 10,
                src: "img/gallery/1200x800/10.webp",
                srcMobile: "img/gallery/800x600/10.webp",
                thumbnail: "img/gallery/400x300/10.webp",
                alt: "Jezerski vidik 10"
            },
            {
                id: 11,
                src: "img/gallery/1200x800/11.webp",
                srcMobile: "img/gallery/800x600/11.webp",
                thumbnail: "img/gallery/400x300/11.webp",
                alt: "Planinski vrh 11"
            },
            {
                id: 12,
                src: "img/gallery/1200x800/12.webp",
                srcMobile: "img/gallery/800x600/12.webp",
                thumbnail: "img/gallery/400x300/12.webp",
                alt: "Šumski potok 12"
            },
            {
                id: 13,
                src: "img/gallery/1200x800/13.webp",
                srcMobile: "img/gallery/800x600/13.webp",
                thumbnail: "img/gallery/400x300/13.webp",
                alt: "Poljski cvijet 13"
            },
            {
                id: 14,
                src: "img/gallery/1200x800/14.webp",
                srcMobile: "img/gallery/800x600/14.webp",
                thumbnail: "img/gallery/400x300/14.webp",
                alt: "Gradska noć 14"
            }
        ];

        // Stanje galerije - prati trenutnu poziciju i interakcije
        this.state = {
            currentIndex: 0,           // Trenutno aktivna slika u modalu
            rotatingImages: [],        // Slike za rotirajući element
            currentRotatingIndex: 0,   // Trenutna pozicija u rotaciji
            isAnimating: false,        // Da li je u toku animacija
            prevIndex: 0,              // Prethodni index za navigaciju
            swipeStartX: 0,            // Početna pozicija za swipe
            isSwiping: false,          // Da li je u toku swipe gest
            isLoading: false           // Da li se učitava slika
        };

        this.intervals = {};    // Čuva interval za rotaciju i resize
        this.elements = {};     // Cache DOM elemenata
        this.isInitialized = false;  // Da li je galerija inicijalizovana

        // Bind event handlers za održavanje context-a
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
    }

    // =========================================================================
    // PUBLIC API - METODE ZA KORIŠĆENJE GALERIJE IZVAN KLASE
    // =========================================================================

    /**
     * Inicijalizacija galerije - mora se pozvati prilikom učitavanja stranice
     */
    init() {
        if (this.isInitialized) return;

        try {
            this.cacheElements();
            this.createGallery();
            this.setupEventListeners();
            this.isInitialized = true;
        } catch (error) {
            console.error('Gallery init failed:', error);
        }
    }

    /**
     * Otvara modal sa određenom slikom
     * @param {number} imageIndex - Index slike za prikaz (0-based)
     */
    open(imageIndex = 0) {
        if (imageIndex < 0 || imageIndex >= this.images.length) return;

        this.state.currentIndex = imageIndex;
        this.state.prevIndex = imageIndex;
        this.openModal();
    }

    /**
     * Zatvara modal
     */
    close() {
        this.closeModal();
    }

    /**
     * Prelazi na sledeću sliku
     */
    next() {
        if (this.state.isAnimating) return;
        this.navigate(1);
    }

    /**
     * Prelazi na prethodnu sliku
     */
    prev() {
        if (this.state.isAnimating) return;
        this.navigate(-1);
    }

    // =========================================================================
    // RESPONSIVE IMAGE SYSTEM - ODABIR OPTIMALNE SLIKE ZA UREĐAJ
    // =========================================================================

    /**
     * Vraća odgovarajuću verziju slike na osnovu veličine ekrana
     * @param {Object} image - Objekat slike sa src i srcMobile property-jima
     * @returns {string} Putanja do optimalne slike
     */
    getResponsiveSource(image) {
        const width = window.innerWidth;
        const isMobile = width < 768;

        // Na mobilnim uređajima koristi mobile verziju ako postoji
        if (isMobile && image.srcMobile) {
            return image.srcMobile;
        }

        // Na desktop i tablet uređajima koristi desktop verziju
        return image.src;
    }

    /**
     * Vraća thumbnail sliku (uvek ista za sve uređaje)
     * @param {Object} image - Objekat slike
     * @returns {string} Putanja do thumbnail slike
     */
    getThumbnailSource(image) {
        return image.thumbnail;
    }

    // =========================================================================
    // PRELOAD SYSTEM - PREDUZIMANJE SLIKA ZA BRŽU NAVIGACIJU
    // =========================================================================

    /**
     * Preload susednih slika trenutno aktivne slike
     * @param {number} currentIndex - Index trenutne slike
     */
    preloadAdjacentImages(currentIndex) {
        if (!this.config.preload.enabled) return;

        const { adjacentImages } = this.config.preload;

        // Preload slika sa obe strane trenutne slike
        for (let i = 1; i <= adjacentImages; i++) {
            const prevIndex = (currentIndex - i + this.images.length) % this.images.length;
            const nextIndex = (currentIndex + i) % this.images.length;

            this.preloadSingleImage(this.images[prevIndex]);
            this.preloadSingleImage(this.images[nextIndex]);
        }
    }

    /**
     * Preload pojedinačne slike
     * @param {Object} image - Slika za preload
     */
    preloadSingleImage(image) {
        const src = this.getResponsiveSource(image);
        const img = new Image();
        img.src = src;
    }

    /**
     * Prikazuje loading indicator dok se slika učitava
     */
    showLoading() {
        this.state.isLoading = true;
        this.elements.modalImage.classList.add('loading');

        let spinner = document.querySelector('.gallery-loading-spinner');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.className = 'gallery-loading-spinner';
            this.elements.modalImageContainer.appendChild(spinner);
        }
        spinner.classList.add('active');
    }

    /**
     * Skriva loading indicator
     */
    hideLoading() {
        this.state.isLoading = false;
        this.elements.modalImage.classList.remove('loading');

        const spinner = document.querySelector('.gallery-loading-spinner');
        if (spinner) {
            spinner.classList.remove('active');
        }
    }

    // =========================================================================
    // CORE GALLERY FUNCTIONALITY - KREIRANJE I UPRAVLJANJE GALERIJOM
    // =========================================================================

    /**
     * Keširanje DOM elemenata za brži pristup
     */
    cacheElements() {
        const elements = {
            gallery: '#gallery',
            modal: '#gallery-modal',
            modalImage: '#gallery-modal-image',
            modalImageContainer: '#gallery-modal-image-container',
            closeBtn: '#gallery-close-btn',
            prevBtn: '#gallery-prev-btn',
            nextBtn: '#gallery-next-btn',
            imageIndicators: '#gallery-image-indicators'
        };

        for (const [key, selector] of Object.entries(elements)) {
            this.elements[key] = document.querySelector(selector);
            if (!this.elements[key] && key !== 'imageIndicators') {
                throw new Error(`Element not found: ${selector}`);
            }
        }
    }

    /**
     * Kreira grid galeriju sa svim slikama
     */
    createGallery() {
        this.elements.gallery.innerHTML = '';
        this.stopRotation();

        const visibleCount = this.setupGridLayout();
        const displayedImages = this.images.slice(0, visibleCount - 1);
        this.state.rotatingImages = this.images.slice(visibleCount - 1);

        // Dodaj prikazane slike u grid
        displayedImages.forEach((image, index) => {
            this.elements.gallery.appendChild(this.createGalleryItem(image));
        });

        // Dodaj rotirajući element ako ima viška slika
        if (this.state.rotatingImages.length > 0) {
            this.elements.gallery.appendChild(this.createRotatingItem());
            if (this.state.rotatingImages.length > 1) {
                this.startRotation();
            }
        }
    }

    /**
     * Kreira pojedinačni element u gridu
     * @param {Object} image - Slika za prikaz
     * @returns {HTMLElement} Gallery item element
     */
    createGalleryItem(image) {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = this.getThumbnailSource(image);
        img.alt = image.alt;
        img.loading = 'lazy'; // Browser optimizacija za učitavanje

        // Klik otvara modal sa tom slikom
        img.addEventListener('click', () => {
            this.state.currentIndex = this.images.findIndex(img => img.id === image.id);
            this.state.prevIndex = this.state.currentIndex;
            this.openModal();
        });

        item.appendChild(img);
        return item;
    }

    /**
     * Kreira rotirajući element koji prikazuje više slika u jednom slotu
     * @returns {HTMLElement} Rotating item element
     */
    createRotatingItem() {
        const item = document.createElement('div');
        const hasMultipleImages = this.state.rotatingImages.length > 1;

        item.className = hasMultipleImages ?
            'gallery-item rotating-item' :
            'gallery-item rotating-item no-rotation';

        // Dodaj sve slike za rotaciju
        this.state.rotatingImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = this.getThumbnailSource(image);
            img.alt = image.alt;
            img.dataset.imageId = image.id;

            if (hasMultipleImages) {
                img.className = `rotating-image ${index === 0 ? 'active' : ''}`;
            }

            item.appendChild(img);
        });

        // Dodaj tekst koji pokazuje broj preostalih slika
        if (hasMultipleImages) {
            const moreText = document.createElement('div');
            moreText.className = 'more-text';
            moreText.textContent = `+${this.state.rotatingImages.length - 1}`;
            item.appendChild(moreText);
        }

        // Klik otvara modal sa trenutno aktivnom slikom
        item.addEventListener('click', () => {
            const activeImage = item.querySelector('.rotating-image.active') || item.querySelector('img');
            if (activeImage) {
                const imageId = parseInt(activeImage.dataset.imageId);
                this.state.currentIndex = this.images.findIndex(img => img.id === imageId);
                this.state.prevIndex = this.state.currentIndex;
                this.openModal();
            }
        });

        return item;
    }

    // =========================================================================
    // IMAGE ROTATION SYSTEM - AUTOMATSKA ROTACIJA SLIKA U ROTATING ELEMENTU
    // =========================================================================

    /**
     * Pokreće automatsku rotaciju slika
     */
    startRotation() {
        this.stopRotation();
        this.intervals.rotation = setInterval(() => this.rotateImages(), 2500);
    }

    /**
     * Zaustavlja rotaciju slika
     */
    stopRotation() {
        if (this.intervals.rotation) {
            clearInterval(this.intervals.rotation);
            this.intervals.rotation = null;
        }
    }

    /**
     * Rotira slike u rotating elementu
     */
    rotateImages() {
        const rotatingItem = document.querySelector('.rotating-item');
        if (!rotatingItem) return;

        const images = rotatingItem.querySelectorAll('.rotating-image');
        if (images.length === 0) {
            this.stopRotation();
            return;
        }

        // Ukloni aktivnu klasu sa trenutne slike
        const currentActive = rotatingItem.querySelector('.rotating-image.active');
        if (currentActive) currentActive.classList.remove('active');

        // Postavi sledeću sliku kao aktivnu
        this.state.currentRotatingIndex = (this.state.currentRotatingIndex + 1) % images.length;
        images[this.state.currentRotatingIndex].classList.add('active');
    }

    // =========================================================================
    // SWIPE & DRAG FUNCTIONALITY - TOUCH I MOUSE NAVIGACIJA
    // =========================================================================

    /**
     * Postavlja event listenere za swipe i drag
     */
    setupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        // Touch events za mobilne uređaje
        container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        container.addEventListener('touchend', this.handleTouchEnd);

        // Mouse events za desktop
        container.addEventListener('mousedown', this.handleMouseDown);
        container.addEventListener('mousemove', this.handleMouseMove);
        container.addEventListener('mouseup', this.handleMouseUp);
        container.addEventListener('mouseleave', this.handleMouseUp);
        container.addEventListener('dragstart', (e) => e.preventDefault());
    }

    /**
     * Početak touch swipe gesta
     */
    handleTouchStart(e) {
        if (this.state.isAnimating) return;
        this.state.swipeStartX = e.touches[0].clientX;
        this.state.isSwiping = true;
    }

    /**
     * Kretanje tokom touch swipe gesta
     */
    handleTouchMove(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;
        const touch = e.touches[0];
        const swipeX = touch.clientX - this.state.swipeStartX;
        if (Math.abs(swipeX) > 10) e.preventDefault();
    }

    /**
     * Kraj touch swipe gesta
     */
    handleTouchEnd(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;
        const touch = e.changedTouches[0];
        this.processSwipe(touch.clientX - this.state.swipeStartX);
        this.state.isSwiping = false;
    }

    /**
     * Početak mouse drag gesta
     */
    handleMouseDown(e) {
        if (this.state.isAnimating || e.button !== 0) return;
        this.state.swipeStartX = e.clientX;
        this.state.isSwiping = true;
        document.body.style.userSelect = 'none';
    }

    /**
     * Kretanje tokom mouse drag gesta
     */
    handleMouseMove(e) {
        // Samo prati kretanje - processing se radi u handleMouseUp
    }

    /**
     * Kraj mouse drag gesta
     */
    handleMouseUp(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;
        this.processSwipe(e.clientX - this.state.swipeStartX);
        this.state.isSwiping = false;
        document.body.style.userSelect = '';
    }

    /**
     * Procesuira swipe/drag gest i navigira ako je dovoljno dug
     * @param {number} swipeX - Razlika u X koordinati
     */
    processSwipe(swipeX) {
        if (Math.abs(swipeX) > this.config.swipe.threshold) {
            swipeX > 0 ? this.prev() : this.next();
        }
    }

    /**
     * Uklanja swipe event listenere
     */
    cleanupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        const events = [
            'touchstart', 'touchmove', 'touchend',
            'mousedown', 'mousemove', 'mouseup', 'mouseleave'
        ];

        events.forEach(event => {
            container.removeEventListener(event, this[`handle${event.charAt(0).toUpperCase() + event.slice(1)}`]);
        });
    }

    // =========================================================================
    // MODAL FUNCTIONALITY - UPRAVLJANJE MODAL PROZOROM
    // =========================================================================

    /**
     * Otvara modal sa trenutnom slikom
     */
    openModal() {
        this.stopRotation();
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Mali delay za CSS transition
        setTimeout(() => {
            this.elements.modal.classList.add('active');
        }, 10);

        this.createIndicators();
        this.updateModalImage(true);
        this.setupSwipeEvents();
        this.setupModalEventListeners();
    }

    /**
     * Zatvara modal
     */
    closeModal() {
        this.elements.modal.classList.remove('active');

        setTimeout(() => {
            this.elements.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.cleanupModalEventListeners();
            this.cleanupSwipeEvents();

            // Ponovo pokreni rotaciju ako postoji
            if (this.state.rotatingImages.length > 1) {
                this.startRotation();
            }
        }, 150);
    }

    /**
     * Navigira kroz slike u modalu
     * @param {number} direction - Smer navigacije (1 = next, -1 = prev)
     */
    navigate(direction) {
        if (this.state.isAnimating) return;
        this.state.prevIndex = this.state.currentIndex;
        this.state.currentIndex = (this.state.currentIndex + direction + this.images.length) % this.images.length;
        this.updateModalImage();
    }

    /**
     * Ažurira prikaz slike u modalu sa animacijom
     * @param {boolean} skipAnimation - Da li preskočiti animaciju
     */
    updateModalImage(skipAnimation = false) {
        const currentImage = this.images[this.state.currentIndex];
        const responsiveSrc = this.getResponsiveSource(currentImage);

        // Preload susedne slike za bržu navigaciju
        this.preloadAdjacentImages(this.state.currentIndex);

        if (skipAnimation) {
            // Direktno postavi sliku bez animacije (prvo otvaranje)
            this.elements.modalImage.src = responsiveSrc;
            this.elements.modalImage.alt = currentImage.alt;
            this.updateIndicators();
            return;
        }

        this.state.isAnimating = true;
        const direction = this.getNavigationDirection();

        // Animacija izlaska trenutne slike
        this.elements.modalImage.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

        setTimeout(() => {
            this.elements.modalImage.classList.remove('slide-out-left', 'slide-out-right');
            this.elements.modalImage.src = responsiveSrc;
            this.elements.modalImage.alt = currentImage.alt;

            // Animacija ulaska nove slike
            this.elements.modalImage.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
            this.updateIndicators();

            setTimeout(() => {
                this.elements.modalImage.classList.remove('slide-in-left', 'slide-in-right');
                this.state.isAnimating = false;
            }, 250);
        }, 250);
    }

    /**
     * Određuje smer navigacije za animacije
     * @returns {string} 'next' ili 'prev'
     */
    getNavigationDirection() {
        const diff = this.state.currentIndex - this.state.prevIndex;
        return (diff === 1 || diff === -(this.images.length - 1)) ? 'next' : 'prev';
    }

    /**
     * Kreira indikatore (tačkice) za navigaciju
     */
    createIndicators() {
        if (!this.elements.imageIndicators) return;

        this.elements.imageIndicators.innerHTML = '';
        this.images.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `gallery-indicator ${index === this.state.currentIndex ? 'active' : ''}`;
            indicator.addEventListener('click', () => {
                if (this.state.isAnimating) return;
                this.state.prevIndex = this.state.currentIndex;
                this.state.currentIndex = index;
                this.updateModalImage();
            });
            this.elements.imageIndicators.appendChild(indicator);
        });
    }

    /**
     * Ažurira aktivni indikator
     */
    updateIndicators() {
        const indicators = document.querySelectorAll('.gallery-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.state.currentIndex);
        });
    }

    // =========================================================================
    // GRID SYSTEM - RESPONZIVNI GRID LAYOUT
    // =========================================================================

    /**
     * Postavlja grid layout na osnovu veličine ekrana
     * @returns {number} Broj elemenata koji mogu da stanu u grid
     */
    setupGridLayout() {
        const config = this.getCurrentConfig();
        const containerWidth = this.elements.gallery.parentElement.clientWidth;
        const maxColumns = Math.floor(containerWidth / config.minWidth);
        const itemsPerRow = Math.min(maxColumns, Math.ceil(this.images.length / config.rows));

        this.elements.gallery.style.gridTemplateColumns = `repeat(${itemsPerRow}, 1fr)`;
        this.elements.gallery.style.gap = `${config.gap}px`;

        return itemsPerRow * config.rows;
    }

    /**
     * Vraća konfiguraciju za trenutnu veličinu ekrana
     * @returns {Object} Grid konfiguracija
     */
    getCurrentConfig() {
        const width = window.innerWidth;
        if (width >= 1200) return this.config.grid.desktop;
        if (width >= 768) return this.config.grid.tablet;
        return this.config.grid.mobile;
    }

    // =========================================================================
    // EVENT MANAGEMENT - UPRAVLJANJE EVENT LISTENERIMA
    // =========================================================================

    /**
     * Postavlja osnovne event listenere
     */
    setupEventListeners() {
        // Dugme za zatvaranje modala
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Klik van slike zatvara modal
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) this.closeModal();
            });
        }

        // Navigaciona dugmad
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prev();
            });
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.next();
            });
        }

        // Resize event za responzivnost
        window.addEventListener('resize', this.handleResize);
    }

    /**
     * Rukuje resize eventom sa debounce-om
     */
    handleResize() {
        clearTimeout(this.intervals.resize);
        this.intervals.resize = setTimeout(() => {
            this.createGallery();
        }, 250);
    }

    /**
     * Postavlja event listenere specifične za modal
     */
    setupModalEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Rukuje keyboard navigacijom
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'Escape': this.closeModal(); break;
            case 'ArrowLeft': this.prev(); break;
            case 'ArrowRight': this.next(); break;
        }
    }

    /**
     * Uklanja modal event listenere
     */
    cleanupModalEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Čišćenje resursa
     */
    cleanup() {
        this.stopRotation();
        this.cleanupModalEventListeners();
        this.cleanupSwipeEvents();

        if (this.intervals.resize) {
            clearTimeout(this.intervals.resize);
        }

        this.isInitialized = false;
    }
}

// =============================================================================
// GLOBAL INITIALIZATION - AUTOMATSKA INICIJALIZACIJA GALERIJE
// =============================================================================

// Kreiraj globalni instance ako ne postoji
if (!window.galleryManager) {
    window.galleryManager = new GalleryManager();
}

// Auto-inicijalizacija kada se DOM učita
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.galleryManager.init(), 100);
    });
} else {
    setTimeout(() => window.galleryManager.init(), 100);
}