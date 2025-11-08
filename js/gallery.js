/**
 * OPTIMIZOVANA GALERIJA - STABILNA I BRZA
 * Sve funkcionalnosti ostaju iste, samo optimizovano za stabilnost
 */

class GalleryManager {
    constructor() {
        this.config = {
            grid: {
                desktop: { rows: 2, gap: 6, minWidth: 300 },
                tablet: { rows: 2, gap: 4, minWidth: 200 },
                mobile: { rows: 2, gap: 4, minWidth: 150 }
            },
            swipe: { threshold: 50 },
            preload: { enabled: true, adjacentImages: 1 },
            shuffle: { enabled: true, persistSession: false }
        };

        this.images = [
            {
                id: 1,
                src: "img/gallery/1200x800/1.webp",
                srcMobile: "img/gallery/800x600/1.webp",
                thumbnail: "img/gallery/400x300/1.webp",
                alt: "Profesionalno pranje poslovnog prostora"
            },
            {
                id: 2,
                src: "img/gallery/1200x800/2.webp",
                srcMobile: "img/gallery/800x600/2.webp",
                thumbnail: "img/gallery/400x300/2.webp",
                alt: "Dubinsko pranje tepiha u dnevnoj sobi"
            },
            {
                id: 3,
                src: "img/gallery/1200x800/3.webp",
                srcMobile: "img/gallery/800x600/3.webp",
                thumbnail: "img/gallery/400x300/3.webp",
                alt: "Kompletno dubinsko čišćenje unutrašnjosti automobila"
            },
            {
                id: 4,
                src: "img/gallery/1200x800/4.webp",
                srcMobile: "img/gallery/800x600/4.webp",
                thumbnail: "img/gallery/400x300/4.webp",
                alt: "Stolica s mrljama prije dubinskog pranja"
            },
            {
                id: 5,
                src: "img/gallery/1200x800/5.webp",
                srcMobile: "img/gallery/800x600/5.webp",
                thumbnail: "img/gallery/400x300/5.webp",
                alt: "Dubinsko pranje kauča u dnevnom boravku"
            },
            {
                id: 6,
                src: "img/gallery/1200x800/6.webp",
                srcMobile: "img/gallery/800x600/6.webp",
                thumbnail: "img/gallery/400x300/6.webp",
                alt: "Tkanina garniture nakon dubinskog pranja"
            },
            {
                id: 7,
                src: "img/gallery/1200x800/7.webp",
                srcMobile: "img/gallery/800x600/7.webp",
                thumbnail: "img/gallery/400x300/7.webp",
                alt: "Garnitura nakon profesionalnog čišćenja"
            },
            {
                id: 8,
                src: "img/gallery/1200x800/8.webp",
                srcMobile: "img/gallery/800x600/8.webp",
                thumbnail: "img/gallery/400x300/8.webp",
                alt: "Autosjedišta nakon dubinskog pranja"
            },
            {
                id: 9,
                src: "img/gallery/1200x800/9.webp",
                srcMobile: "img/gallery/800x600/9.webp",
                thumbnail: "img/gallery/400x300/9.webp",
                alt: "Dubinsko pranje vozačevog sjedišta automobila"
            },
            {
                id: 10,
                src: "img/gallery/1200x800/10.webp",
                srcMobile: "img/gallery/800x600/10.webp",
                thumbnail: "img/gallery/400x300/10.webp",
                alt: "Čišćenje naslona autosjedišta"
            },
            {
                id: 11,
                src: "img/gallery/1200x800/11.webp",
                srcMobile: "img/gallery/800x600/11.webp",
                thumbnail: "img/gallery/400x300/11.webp",
                alt: "Obnova i polimerizacija farova automobila"
            },
            {
                id: 12,
                src: "img/gallery/1200x800/12.webp",
                srcMobile: "img/gallery/800x600/12.webp",
                thumbnail: "img/gallery/400x300/12.webp",
                alt: "Dubinsko pranje stražnjih sjedišta automobila"
            },
            {
                id: 13,
                src: "img/gallery/1200x800/13.webp",
                srcMobile: "img/gallery/800x600/13.webp",
                thumbnail: "img/gallery/400x300/13.webp",
                alt: "Vanjsko pranje i sušenje vozila"
            },
            {
                id: 14,
                src: "img/gallery/1200x800/14.webp",
                srcMobile: "img/gallery/800x600/14.webp",
                thumbnail: "img/gallery/400x300/14.webp",
                alt: "Kompletno pranje automobila"
            }
        ];

        this.state = {
            currentIndex: 0,
            rotatingImages: [],
            currentRotatingIndex: 0,
            isAnimating: false,
            prevIndex: 0,
            swipeStartX: 0,
            isSwiping: false,
            isLoading: false,
            shuffledImages: [],
            isHistoryNavigation: false
        };

        this.intervals = {};
        this.elements = {};
        this.isInitialized = false;
        this.eventListeners = [];

        this.bindEvents();
    }

    bindEvents() {
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
    }

    // HISTORY MANAGEMENT - POJEDOSTAVLJENO
    setupGlobalHistoryHandler() {
        this.removeEventListener('popstate', this.handlePopState);
        window.addEventListener('popstate', this.handlePopState);
        this.eventListeners.push({ element: window, type: 'popstate', handler: this.handlePopState });
    }

    handlePopState(event) {
        if (this.state.isHistoryNavigation) return;

        const state = event.state;
        const isModalOpen = this.elements.modal?.style.display === 'block';

        if (!state || state.modal !== 'gallery') {
            if (isModalOpen) this.closeModalWithoutHistory();
            return;
        }

        this.state.isHistoryNavigation = true;

        if (isModalOpen) {
            if (state.index !== this.state.currentIndex) {
                this.state.prevIndex = this.state.currentIndex;
                this.state.currentIndex = state.index;
                this.updateModalImage();
            }
        } else {
            this.state.currentIndex = state.index;
            this.state.prevIndex = state.index;
            this.openModalWithoutHistory();
        }

        setTimeout(() => { this.state.isHistoryNavigation = false; }, 50);
    }

    pushHistoryState(index) {
        if (this.state.isHistoryNavigation) return;
        this.state.isHistoryNavigation = true;

        const state = { modal: 'gallery', index: index };
        window.history.pushState(state, '', `#gallery-${index}`);

        setTimeout(() => { this.state.isHistoryNavigation = false; }, 50);
    }

    replaceHistoryState(index) {
        if (this.state.isHistoryNavigation) return;
        this.state.isHistoryNavigation = true;

        const state = { modal: 'gallery', index: index };
        window.history.replaceState(state, '', `#gallery-${index}`);

        setTimeout(() => { this.state.isHistoryNavigation = false; }, 50);
    }

    setupHashHandler() {
        if (window.location.hash.startsWith('#gallery-')) {
            const index = parseInt(window.location.hash.split('-')[1]);
            if (!isNaN(index) && index >= 0 && index < this.images.length) {
                setTimeout(() => {
                    this.state.currentIndex = index;
                    this.state.prevIndex = index;
                    this.openModal();
                }, 100);
            }
        }
    }

    // SHUFFLE - POJEDOSTAVLJENO
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getImagesForGrid() {
        if (this.state.shuffledImages.length > 0) {
            return this.state.shuffledImages;
        }

        if (this.config.shuffle.persistSession) {
            const sessionKey = 'gallery_shuffled_order';
            const savedOrder = sessionStorage.getItem(sessionKey);
            if (savedOrder) {
                const order = JSON.parse(savedOrder);
                this.state.shuffledImages = order.map(id => this.images.find(img => img.id === id)).filter(Boolean);
                return this.state.shuffledImages;
            }
        }

        this.state.shuffledImages = this.config.shuffle.enabled ?
            this.shuffleArray(this.images) : [...this.images];

        if (this.config.shuffle.persistSession) {
            const sessionKey = 'gallery_shuffled_order';
            const order = this.state.shuffledImages.map(img => img.id);
            sessionStorage.setItem(sessionKey, JSON.stringify(order));
        }

        return this.state.shuffledImages;
    }

    getImagesForModal() {
        return this.images;
    }

    // PUBLIC API
    init() {
        if (this.isInitialized) return;

        try {
            this.cacheElements();
            this.createGallery();
            this.setupEventListeners();
            this.setupGlobalHistoryHandler();
            this.setupHashHandler();
            this.isInitialized = true;
        } catch (error) {
            console.error('Gallery init failed:', error);
        }
    }

    open(imageIndex = 0) {
        if (imageIndex < 0 || imageIndex >= this.images.length) return;
        if (this.elements.modal?.style.display === 'block') return;

        this.state.currentIndex = imageIndex;
        this.state.prevIndex = imageIndex;
        this.openModal();
    }

    close() {
        this.closeModal();
    }

    closeModalWithoutHistory() {
        if (this.elements.modal?.style.display === 'none') return;

        this.elements.modal.classList.remove('active');

        setTimeout(() => {
            this.elements.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.cleanupModalEventListeners();
            this.cleanupSwipeEvents();

            if (this.state.rotatingImages.length > 1) {
                this.startRotation();
            }
        }, 150);
    }

    next() {
        if (this.state.isAnimating) return;
        this.navigate(1);
    }

    prev() {
        if (this.state.isAnimating) return;
        this.navigate(-1);
    }

    // RESPONSIVE IMAGE SYSTEM
    getResponsiveSource(image) {
        const width = window.innerWidth;
        return (width < 768 && image.srcMobile) ? image.srcMobile : image.src;
    }

    getThumbnailSource(image) {
        return image.thumbnail;
    }

    // PRELOAD SYSTEM
    preloadAdjacentImages(currentIndex) {
        if (!this.config.preload.enabled) return;

        const { adjacentImages } = this.config.preload;
        for (let i = 1; i <= adjacentImages; i++) {
            const prevIndex = (currentIndex - i + this.images.length) % this.images.length;
            const nextIndex = (currentIndex + i) % this.images.length;
            this.preloadSingleImage(this.images[prevIndex]);
            this.preloadSingleImage(this.images[nextIndex]);
        }
    }

    preloadSingleImage(image) {
        const src = this.getResponsiveSource(image);
        const img = new Image();
        img.src = src;
    }

    // CORE GALLERY FUNCTIONALITY
    cacheElements() {
        const selectors = {
            gallery: '#gallery',
            modal: '#gallery-modal',
            modalImage: '#gallery-modal-image',
            modalImageContainer: '#gallery-modal-image-container',
            closeBtn: '#gallery-close-btn',
            prevBtn: '#gallery-prev-btn',
            nextBtn: '#gallery-next-btn',
            imageIndicators: '#gallery-image-indicators'
        };

        for (const [key, selector] of Object.entries(selectors)) {
            this.elements[key] = document.querySelector(selector);
            if (!this.elements[key] && key !== 'imageIndicators') {
                console.warn(`Element not found: ${selector}`);
            }
        }
    }

    createGallery() {
        if (!this.elements.gallery) return;

        this.elements.gallery.innerHTML = '';
        this.stopRotation();

        const displayedImages = this.getImagesForGrid();
        const visibleCount = this.setupGridLayout();
        const gridImages = displayedImages.slice(0, visibleCount - 1);
        this.state.rotatingImages = displayedImages.slice(visibleCount - 1);

        gridImages.forEach((image) => {
            this.elements.gallery.appendChild(this.createGalleryItem(image));
        });

        if (this.state.rotatingImages.length > 0) {
            this.elements.gallery.appendChild(this.createRotatingItem());
            if (this.state.rotatingImages.length > 1) {
                this.startRotation();
            }
        }
    }

    createGalleryItem(image) {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = this.getThumbnailSource(image);
        img.alt = image.alt;
        img.loading = 'lazy';
        img.dataset.imageId = image.id;

        const clickHandler = () => {
            const originalIndex = this.images.findIndex(img => img.id === image.id);
            if (originalIndex !== -1) {
                this.state.currentIndex = originalIndex;
                this.state.prevIndex = originalIndex;
                this.openModal();
            }
        };

        img.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: img, type: 'click', handler: clickHandler });

        item.appendChild(img);
        return item;
    }

    createRotatingItem() {
        const item = document.createElement('div');
        const hasMultipleImages = this.state.rotatingImages.length > 1;

        item.className = hasMultipleImages ?
            'gallery-item rotating-item' :
            'gallery-item rotating-item no-rotation';

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

        if (hasMultipleImages) {
            const moreText = document.createElement('div');
            moreText.className = 'more-text';
            moreText.textContent = `+${this.state.rotatingImages.length - 1}`;
            item.appendChild(moreText);
        }

        const clickHandler = () => {
            const activeImage = item.querySelector('.rotating-image.active') || item.querySelector('img');
            if (activeImage) {
                const imageId = parseInt(activeImage.dataset.imageId);
                const originalIndex = this.images.findIndex(img => img.id === imageId);
                if (originalIndex !== -1) {
                    this.state.currentIndex = originalIndex;
                    this.state.prevIndex = originalIndex;
                    this.openModal();
                }
            }
        };

        item.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: item, type: 'click', handler: clickHandler });

        return item;
    }

    // IMAGE ROTATION SYSTEM
    startRotation() {
        this.stopRotation();
        this.intervals.rotation = setInterval(() => this.rotateImages(), 2500);
    }

    stopRotation() {
        if (this.intervals.rotation) {
            clearInterval(this.intervals.rotation);
            this.intervals.rotation = null;
        }
    }

    rotateImages() {
        const rotatingItem = document.querySelector('.rotating-item');
        if (!rotatingItem) {
            this.stopRotation();
            return;
        }

        const images = rotatingItem.querySelectorAll('.rotating-image');
        if (images.length === 0) {
            this.stopRotation();
            return;
        }

        const currentActive = rotatingItem.querySelector('.rotating-image.active');
        if (currentActive) currentActive.classList.remove('active');

        this.state.currentRotatingIndex = (this.state.currentRotatingIndex + 1) % images.length;
        images[this.state.currentRotatingIndex].classList.add('active');
    }

    // SWIPE & DRAG FUNCTIONALITY - FIXED TOUCHMOVE
    setupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        const events = [
            { type: 'touchstart', handler: this.handleTouchStart, options: { passive: true } },
            { type: 'touchmove', handler: this.handleTouchMove, options: { passive: true } },
            { type: 'touchend', handler: this.handleTouchEnd, options: { passive: true } },
            { type: 'mousedown', handler: this.handleMouseDown },
            { type: 'mousemove', handler: this.handleMouseMove },
            { type: 'mouseup', handler: this.handleMouseUp },
            { type: 'mouseleave', handler: this.handleMouseUp },
            { type: 'dragstart', handler: (e) => e.preventDefault() }
        ];

        events.forEach(({ type, handler, options }) => {
            container.addEventListener(type, handler, options);
            this.eventListeners.push({ element: container, type, handler, options });
        });
    }

    handleTouchStart(e) {
        if (this.state.isAnimating) return;
        this.state.swipeStartX = e.touches[0].clientX;
        this.state.isSwiping = true;
    }

    handleTouchMove(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;

        // Uklonjen preventDefault() jer uzrokuje warning
        // Samo prati kretanje bez blokiranja scrolla
        const touch = e.touches[0];
        const swipeX = touch.clientX - this.state.swipeStartX;

        // Možemo dodati visual feedback bez blokiranja scrolla
        if (Math.abs(swipeX) > this.config.swipe.threshold) {
            // Dodajemo CSS klasu za feedback ali ne blokiramo scroll
            this.elements.modalImageContainer.classList.add('swipe-active');
        } else {
            this.elements.modalImageContainer.classList.remove('swipe-active');
        }
    }

    handleTouchEnd(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;

        // Ukloni visual feedback
        this.elements.modalImageContainer.classList.remove('swipe-active');

        const touch = e.changedTouches[0];
        const swipeX = touch.clientX - this.state.swipeStartX;

        // Procesuiraj swipe samo ako je dovoljno velik
        if (Math.abs(swipeX) > this.config.swipe.threshold) {
            swipeX > 0 ? this.prev() : this.next();
        }

        this.state.isSwiping = false;
    }

    handleMouseDown(e) {
        if (this.state.isAnimating || e.button !== 0) return;
        this.state.swipeStartX = e.clientX;
        this.state.isSwiping = true;
        document.body.style.userSelect = 'none';
    }

    handleMouseMove(e) {
        // Samo prati kretanje
    }

    handleMouseUp(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;

        const swipeX = e.clientX - this.state.swipeStartX;

        if (Math.abs(swipeX) > this.config.swipe.threshold) {
            swipeX > 0 ? this.prev() : this.next();
        }

        this.state.isSwiping = false;
        document.body.style.userSelect = '';
    }

    cleanupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        this.eventListeners = this.eventListeners.filter(listener => {
            if (listener.element === container &&
                ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mousemove', 'mouseup', 'mouseleave', 'dragstart'].includes(listener.type)) {
                container.removeEventListener(listener.type, listener.handler);
                return false;
            }
            return true;
        });
    }

    // MODAL FUNCTIONALITY
    openModal() {
        if (!this.elements.modal || this.elements.modal.style.display === 'block') return;

        this.stopRotation();
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        const currentState = history.state;
        if (!currentState || currentState.modal !== 'gallery') {
            this.pushHistoryState(this.state.currentIndex);
        }

        setTimeout(() => {
            this.elements.modal.classList.add('active');
        }, 10);

        this.createIndicators();
        this.updateModalImage(true);
        this.setupSwipeEvents();
        this.setupModalEventListeners();
    }

    openModalWithoutHistory() {
        if (!this.elements.modal || this.elements.modal.style.display === 'block') return;

        this.stopRotation();
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            this.elements.modal.classList.add('active');
        }, 10);

        this.createIndicators();
        this.updateModalImage(true);
        this.setupSwipeEvents();
        this.setupModalEventListeners();
    }

    closeModal() {
        if (!this.elements.modal || this.elements.modal.style.display === 'none') return;

        this.elements.modal.classList.remove('active');

        setTimeout(() => {
            this.elements.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.cleanupModalEventListeners();
            this.cleanupSwipeEvents();

            const currentState = history.state;
            if (currentState && currentState.modal === 'gallery') {
                this.state.isHistoryNavigation = true;
                window.history.back();
                setTimeout(() => { this.state.isHistoryNavigation = false; }, 50);
            }

            if (this.state.rotatingImages.length > 1) {
                this.startRotation();
            }
        }, 150);
    }

    navigate(direction) {
        if (this.state.isAnimating) return;
        this.state.prevIndex = this.state.currentIndex;
        this.state.currentIndex = (this.state.currentIndex + direction + this.images.length) % this.images.length;
        this.replaceHistoryState(this.state.currentIndex);
        this.updateModalImage();
    }

    updateModalImage(skipAnimation = false) {
        const currentImage = this.images[this.state.currentIndex];
        if (!currentImage) return;

        const responsiveSrc = this.getResponsiveSource(currentImage);
        this.preloadAdjacentImages(this.state.currentIndex);

        if (skipAnimation) {
            this.elements.modalImage.src = responsiveSrc;
            this.elements.modalImage.alt = currentImage.alt;
            this.updateIndicators();
            return;
        }

        this.state.isAnimating = true;
        const direction = this.getNavigationDirection();

        this.elements.modalImage.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

        setTimeout(() => {
            this.elements.modalImage.classList.remove('slide-out-left', 'slide-out-right');
            this.elements.modalImage.src = responsiveSrc;
            this.elements.modalImage.alt = currentImage.alt;

            this.elements.modalImage.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
            this.updateIndicators();

            setTimeout(() => {
                this.elements.modalImage.classList.remove('slide-in-left', 'slide-in-right');
                this.state.isAnimating = false;
            }, 250);
        }, 250);
    }

    getNavigationDirection() {
        const diff = this.state.currentIndex - this.state.prevIndex;
        return (diff === 1 || diff === -(this.images.length - 1)) ? 'next' : 'prev';
    }

    createIndicators() {
        if (!this.elements.imageIndicators) return;

        this.elements.imageIndicators.innerHTML = '';
        this.images.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `gallery-indicator ${index === this.state.currentIndex ? 'active' : ''}`;

            const clickHandler = () => {
                if (this.state.isAnimating) return;
                this.state.prevIndex = this.state.currentIndex;
                this.state.currentIndex = index;
                this.replaceHistoryState(index);
                this.updateModalImage();
            };

            indicator.addEventListener('click', clickHandler);
            this.eventListeners.push({ element: indicator, type: 'click', handler: clickHandler });

            this.elements.imageIndicators.appendChild(indicator);
        });
    }

    updateIndicators() {
        const indicators = document.querySelectorAll('.gallery-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.state.currentIndex);
        });
    }

    // GRID SYSTEM
    setupGridLayout() {
        if (!this.elements.gallery?.parentElement) return 0;

        const config = this.getCurrentConfig();
        const containerWidth = this.elements.gallery.parentElement.clientWidth;
        const maxColumns = Math.max(1, Math.floor(containerWidth / config.minWidth));
        const itemsPerRow = Math.min(maxColumns, Math.ceil(this.images.length / config.rows));

        this.elements.gallery.style.gridTemplateColumns = `repeat(${itemsPerRow}, 1fr)`;
        this.elements.gallery.style.gap = `${config.gap}px`;

        return itemsPerRow * config.rows;
    }

    getCurrentConfig() {
        const width = window.innerWidth;
        if (width >= 1200) return this.config.grid.desktop;
        if (width >= 768) return this.config.grid.tablet;
        return this.config.grid.mobile;
    }

    // EVENT MANAGEMENT
    setupEventListeners() {
        const elements = [
            { element: this.elements.closeBtn, type: 'click', handler: () => this.closeModal() },
            { element: this.elements.modal, type: 'click', handler: (e) => { if (e.target === this.elements.modal) this.closeModal(); } },
            { element: this.elements.prevBtn, type: 'click', handler: (e) => { e.stopPropagation(); this.prev(); } },
            { element: this.elements.nextBtn, type: 'click', handler: (e) => { e.stopPropagation(); this.next(); } }
        ];

        elements.forEach(({ element, type, handler }) => {
            if (element) {
                element.addEventListener(type, handler);
                this.eventListeners.push({ element, type, handler });
            }
        });

        window.addEventListener('resize', this.handleResize);
        this.eventListeners.push({ element: window, type: 'resize', handler: this.handleResize });
    }

    handleResize() {
        clearTimeout(this.intervals.resize);
        this.intervals.resize = setTimeout(() => {
            this.createGallery();
        }, 250);
    }

    setupModalEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
        this.eventListeners.push({ element: document, type: 'keydown', handler: this.handleKeyDown });
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.closeModal();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowRight':
                this.next();
                break;
        }
    }

    cleanupModalEventListeners() {
        this.eventListeners = this.eventListeners.filter(listener => {
            if (listener.type === 'keydown') {
                document.removeEventListener(listener.type, listener.handler);
                return false;
            }
            return true;
        });
    }

    removeEventListener(element, type, handler) {
        if (element && handler) {
            element.removeEventListener(type, handler);
        }
    }

    resetShuffle() {
        this.state.shuffledImages = [];
        if (this.config.shuffle.persistSession) {
            sessionStorage.removeItem('gallery_shuffled_order');
        }
        this.createGallery();
    }

    setShuffleEnabled(enabled) {
        this.config.shuffle.enabled = enabled;
        this.resetShuffle();
    }

    cleanup() {
        this.stopRotation();

        // Cleanup all event listeners
        this.eventListeners.forEach(({ element, type, handler }) => {
            if (element && handler) {
                element.removeEventListener(type, handler);
            }
        });
        this.eventListeners = [];

        // Cleanup intervals
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearTimeout(interval);
        });
        this.intervals = {};

        this.isInitialized = false;
    }
}

// GLOBAL INITIALIZATION
if (!window.galleryManager) {
    window.galleryManager = new GalleryManager();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.galleryManager?.init(), 100);
    });
} else {
    setTimeout(() => window.galleryManager?.init(), 100);
}