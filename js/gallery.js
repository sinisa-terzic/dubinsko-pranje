/**
 * OPTIMIZOVANA GALERIJA - POBOLJŠANA PERFORMANSI I STABILNOST
 * Modernizovan kod sa boljim performansama i održivosti
 */

class GalleryManager {
    constructor() {
        this.config = {
            grid: {
                desktop: { rows: 2, gap: 6, minWidth: 300 },
                tablet: { rows: 2, gap: 4, minWidth: 200 },
                mobile: { rows: 2, gap: 4, minWidth: 150 }
            },
            swipe: { threshold: 50, maxSwipeTime: 300 },
            preload: { enabled: true, adjacentImages: 2 },
            shuffle: { enabled: true, persistSession: false },
            animation: { duration: 300, easing: 'ease-in-out' },
            rotation: { interval: 3000, enabled: true }
        };

        this.images = this.initializeImages();

        this.state = {
            currentIndex: 0,
            rotatingImages: [],
            currentRotatingIndex: 0,
            isAnimating: false,
            prevIndex: 0,
            swipeStartX: 0,
            swipeStartTime: 0,
            isSwiping: false,
            shuffledImages: [],
            isHistoryNavigation: false,
            resizeTimeout: null,
            rotationInterval: null,
            shouldPreventScroll: false,
            intersectionObserver: null
        };

        this.elements = {};
        this.isInitialized = false;
        this.eventListeners = new Map();

        this.bindEvents();
    }

    initializeImages() {
        return [
            {
                id: 1,
                src: "img/gallery/1200x800/1.webp",
                srcMobile: "img/gallery/800x600/1.webp",
                thumbnail: "img/gallery/400x300/1.webp",
                alt: "Profesionalno pranje poslovnog prostora",
                preloaded: false
            },
            {
                id: 2,
                src: "img/gallery/1200x800/2.webp",
                srcMobile: "img/gallery/800x600/2.webp",
                thumbnail: "img/gallery/400x300/2.webp",
                alt: "Dubinsko pranje tepiha u dnevnoj sobi",
                preloaded: false
            },
            {
                id: 3,
                src: "img/gallery/1200x800/3.webp",
                srcMobile: "img/gallery/800x600/3.webp",
                thumbnail: "img/gallery/400x300/3.webp",
                alt: "Kompletno dubinsko čišćenje unutrašnjosti automobila",
                preloaded: false
            },
            {
                id: 4,
                src: "img/gallery/1200x800/4.webp",
                srcMobile: "img/gallery/800x600/4.webp",
                thumbnail: "img/gallery/400x300/4.webp",
                alt: "Stolica s mrljama prije dubinskog pranja",
                preloaded: false
            },
            {
                id: 5,
                src: "img/gallery/1200x800/5.webp",
                srcMobile: "img/gallery/800x600/5.webp",
                thumbnail: "img/gallery/400x300/5.webp",
                alt: "Dubinsko pranje kauča u dnevnom boravku",
                preloaded: false
            },
            {
                id: 6,
                src: "img/gallery/1200x800/6.webp",
                srcMobile: "img/gallery/800x600/6.webp",
                thumbnail: "img/gallery/400x300/6.webp",
                alt: "Tkanina garniture nakon dubinskog pranja",
                preloaded: false
            },
            {
                id: 7,
                src: "img/gallery/1200x800/7.webp",
                srcMobile: "img/gallery/800x600/7.webp",
                thumbnail: "img/gallery/400x300/7.webp",
                alt: "Garnitura nakon profesionalnog čišćenja",
                preloaded: false
            },
            {
                id: 8,
                src: "img/gallery/1200x800/8.webp",
                srcMobile: "img/gallery/800x600/8.webp",
                thumbnail: "img/gallery/400x300/8.webp",
                alt: "Autosjedišta nakon dubinskog pranja",
                preloaded: false
            },
            {
                id: 9,
                src: "img/gallery/1200x800/9.webp",
                srcMobile: "img/gallery/800x600/9.webp",
                thumbnail: "img/gallery/400x300/9.webp",
                alt: "Dubinsko pranje vozačevog sjedišta automobila",
                preloaded: false
            },
            {
                id: 10,
                src: "img/gallery/1200x800/10.webp",
                srcMobile: "img/gallery/800x600/10.webp",
                thumbnail: "img/gallery/400x300/10.webp",
                alt: "Čišćenje naslona autosjedišta",
                preloaded: false
            },
            {
                id: 11,
                src: "img/gallery/1200x800/11.webp",
                srcMobile: "img/gallery/800x600/11.webp",
                thumbnail: "img/gallery/400x300/11.webp",
                alt: "Obnova i polimerizacija farova automobila",
                preloaded: false
            },
            {
                id: 12,
                src: "img/gallery/1200x800/12.webp",
                srcMobile: "img/gallery/800x600/12.webp",
                thumbnail: "img/gallery/400x300/12.webp",
                alt: "Dubinsko pranje stražnjih sjedišta automobila",
                preloaded: false
            },
            {
                id: 13,
                src: "img/gallery/1200x800/13.webp",
                srcMobile: "img/gallery/800x600/13.webp",
                thumbnail: "img/gallery/400x300/13.webp",
                alt: "Vanjsko pranje i sušenje vozila",
                preloaded: false
            },
            {
                id: 14,
                src: "img/gallery/1200x800/14.webp",
                srcMobile: "img/gallery/800x600/14.webp",
                thumbnail: "img/gallery/400x300/14.webp",
                alt: "Kompletno pranje automobila",
                preloaded: false
            }
        ];
    }

    bindEvents() {
        // Koristimo arrow funkcije da očuvamo this kontekst
        this.handleKeyDown = (e) => this.onKeyDown(e);
        this.handleResize = () => this.onResize();
        this.handleTouchStart = (e) => this.onTouchStart(e);
        this.handleTouchMove = (e) => this.onTouchMove(e);
        this.handleTouchEnd = (e) => this.onTouchEnd(e);
        this.handleMouseDown = (e) => this.onMouseDown(e);
        this.handleMouseMove = (e) => this.onMouseMove(e);
        this.handleMouseUp = (e) => this.onMouseUp(e);
        this.handlePopState = (e) => this.onPopState(e);
        this.handleIntersection = (entries) => this.onIntersection(entries);
    }

    // HISTORY MANAGEMENT - OPTIMIZOVANO
    setupGlobalHistoryHandler() {
        this.removeEventListener(window, 'popstate', this.handlePopState);
        this.addEventListener(window, 'popstate', this.handlePopState);
    }

    onPopState(event) {
        if (this.state.isHistoryNavigation) return;

        const state = event.state;
        const isModalOpen = this.elements.modal?.classList.contains('active');

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

        const state = { modal: 'gallery', index: index };
        window.history.pushState(state, '', `#gallery-${index}`);
    }

    replaceHistoryState(index) {
        if (this.state.isHistoryNavigation) return;

        const state = { modal: 'gallery', index: index };
        window.history.replaceState(state, '', `#gallery-${index}`);
    }

    setupHashHandler() {
        const hash = window.location.hash;
        if (hash.startsWith('#gallery-')) {
            const index = parseInt(hash.split('-')[1]);
            if (!isNaN(index) && index >= 0 && index < this.images.length) {
                requestAnimationFrame(() => {
                    this.state.currentIndex = index;
                    this.state.prevIndex = index;
                    this.openModal();
                });
            }
        }
    }

    // SHUFFLE - OPTIMIZOVANO
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
            try {
                const savedOrder = sessionStorage.getItem(sessionKey);
                if (savedOrder) {
                    const order = JSON.parse(savedOrder);
                    this.state.shuffledImages = order.map(id =>
                        this.images.find(img => img.id === id)
                    ).filter(Boolean);

                    if (this.state.shuffledImages.length === this.images.length) {
                        return this.state.shuffledImages;
                    }
                }
            } catch (e) {
                console.warn('Failed to load shuffled order from sessionStorage:', e);
            }
        }

        this.state.shuffledImages = this.config.shuffle.enabled
            ? this.shuffleArray(this.images)
            : [...this.images];

        if (this.config.shuffle.persistSession) {
            const sessionKey = 'gallery_shuffled_order';
            try {
                const order = this.state.shuffledImages.map(img => img.id);
                sessionStorage.setItem(sessionKey, JSON.stringify(order));
            } catch (e) {
                console.warn('Failed to save shuffled order to sessionStorage:', e);
            }
        }

        return this.state.shuffledImages;
    }

    // PUBLIC API
    init() {
        if (this.isInitialized) return;

        try {
            this.cacheElements();
            this.setupIntersectionObserver();
            this.createGallery();
            this.setupEventListeners();
            this.setupGlobalHistoryHandler();
            this.setupHashHandler();
            this.preloadCriticalImages();
            this.isInitialized = true;
        } catch (error) {
            console.error('Gallery initialization failed:', error);
        }
    }

    open(imageIndex = 0) {
        if (imageIndex < 0 || imageIndex >= this.images.length) return;
        if (this.elements.modal?.classList.contains('active')) return;

        this.state.currentIndex = imageIndex;
        this.state.prevIndex = imageIndex;
        this.openModal();
    }

    close() {
        this.closeModal();
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

    // PRELOAD SYSTEM - POBOLJŠANO
    preloadCriticalImages() {
        // Preload prve 3 slike odmah
        this.images.slice(0, 3).forEach(image => {
            this.preloadSingleImage(image);
        });
    }

    preloadAdjacentImages(currentIndex) {
        if (!this.config.preload.enabled) return;

        const { adjacentImages } = this.config.preload;
        const indicesToPreload = new Set();

        for (let i = 1; i <= adjacentImages; i++) {
            indicesToPreload.add((currentIndex - i + this.images.length) % this.images.length);
            indicesToPreload.add((currentIndex + i) % this.images.length);
        }

        indicesToPreload.forEach(index => {
            const image = this.images[index];
            if (image && !image.preloaded) {
                this.preloadSingleImage(image);
            }
        });
    }

    preloadSingleImage(image) {
        if (image.preloaded) return;

        const src = this.getResponsiveSource(image);
        const img = new Image();
        img.onload = () => {
            image.preloaded = true;
        };
        img.src = src;
    }

    // INTERSECTION OBSERVER ZA LAZY LOADING
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.state.intersectionObserver = new IntersectionObserver(
                this.handleIntersection,
                {
                    rootMargin: '50px 0px',
                    threshold: 0.1
                }
            );
        }
    }

    onIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const imageId = parseInt(img.dataset.imageId);
                const image = this.images.find(img => img.id === imageId);

                if (image && !image.preloaded) {
                    this.preloadSingleImage(image);
                }

                this.state.intersectionObserver.unobserve(img);
            }
        });
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
                console.warn(`Gallery element not found: ${selector}`);
            }
        }
    }

    createGallery() {
        if (!this.elements.gallery) return;

        // Koristimo DocumentFragment za bolje performanse
        const fragment = document.createDocumentFragment();
        this.stopRotation();

        const displayedImages = this.getImagesForGrid();
        const visibleCount = this.setupGridLayout();
        const gridImages = displayedImages.slice(0, visibleCount - 1);
        this.state.rotatingImages = displayedImages.slice(visibleCount - 1);

        gridImages.forEach((image, index) => {
            fragment.appendChild(this.createGalleryItem(image, index));
        });

        if (this.state.rotatingImages.length > 0) {
            fragment.appendChild(this.createRotatingItem());
            if (this.state.rotatingImages.length > 1 && this.config.rotation.enabled) {
                this.startRotation();
            }
        }

        this.elements.gallery.innerHTML = '';
        this.elements.gallery.appendChild(fragment);
    }

    createGalleryItem(image, index) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Pogledaj sliku: ${image.alt}`);

        const img = document.createElement('img');
        img.src = this.getThumbnailSource(image);
        img.alt = image.alt;
        img.loading = 'lazy';
        img.dataset.imageId = image.id;

        // Dodajemo data-src za lazy loading
        img.dataset.src = this.getResponsiveSource(image);

        if (this.state.intersectionObserver && index > 2) {
            this.state.intersectionObserver.observe(img);
        }

        const clickHandler = () => {
            const originalIndex = this.images.findIndex(img => img.id === image.id);
            if (originalIndex !== -1) {
                this.state.currentIndex = originalIndex;
                this.state.prevIndex = originalIndex;
                this.openModal();
            }
        };

        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler();
            }
        };

        this.addEventListener(img, 'click', clickHandler);
        this.addEventListener(item, 'keydown', keyHandler);

        item.appendChild(img);
        return item;
    }

    createRotatingItem() {
        const item = document.createElement('div');
        const hasMultipleImages = this.state.rotatingImages.length > 1;

        item.className = hasMultipleImages
            ? 'gallery-item rotating-item'
            : 'gallery-item rotating-item no-rotation';

        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', 'Pogledaj dodatne slike');

        this.state.rotatingImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = this.getThumbnailSource(image);
            img.alt = image.alt;
            img.dataset.imageId = image.id;
            img.dataset.src = this.getResponsiveSource(image);

            if (hasMultipleImages) {
                img.className = `rotating-image ${index === 0 ? 'active' : ''}`;
            }

            item.appendChild(img);
        });

        if (hasMultipleImages) {
            const moreText = document.createElement('div');
            moreText.className = 'more-text';
            moreText.textContent = `+${this.state.rotatingImages.length - 1}`;
            moreText.setAttribute('aria-hidden', 'true');
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

        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler();
            }
        };

        this.addEventListener(item, 'click', clickHandler);
        this.addEventListener(item, 'keydown', keyHandler);

        return item;
    }

    // IMAGE ROTATION SYSTEM
    startRotation() {
        this.stopRotation();
        if (this.config.rotation.enabled && this.state.rotatingImages.length > 1) {
            this.state.rotationInterval = setInterval(
                () => this.rotateImages(),
                this.config.rotation.interval
            );
        }
    }

    stopRotation() {
        if (this.state.rotationInterval) {
            clearInterval(this.state.rotationInterval);
            this.state.rotationInterval = null;
        }
    }

    rotateImages() {
        const rotatingItem = this.elements.gallery?.querySelector('.rotating-item');
        if (!rotatingItem) {
            this.stopRotation();
            return;
        }

        const images = rotatingItem.querySelectorAll('.rotating-image');
        if (images.length === 0) {
            this.stopRotation();
            return;
        }

        requestAnimationFrame(() => {
            const currentActive = rotatingItem.querySelector('.rotating-image.active');
            if (currentActive) currentActive.classList.remove('active');

            this.state.currentRotatingIndex = (this.state.currentRotatingIndex + 1) % images.length;
            images[this.state.currentRotatingIndex].classList.add('active');
        });
    }

    // SWIPE & DRAG FUNCTIONALITY - POBOLJŠANO I ISPRAVLJENO
    setupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        const events = [
            { type: 'touchstart', handler: this.handleTouchStart, options: { passive: true } },
            { type: 'touchmove', handler: this.handleTouchMove, options: { passive: false } }, // ISPRAVLJENO: passive: false
            { type: 'touchend', handler: this.handleTouchEnd, options: { passive: true } },
            { type: 'mousedown', handler: this.handleMouseDown, options: { passive: true } },
            { type: 'mousemove', handler: this.handleMouseMove, options: { passive: true } },
            { type: 'mouseup', handler: this.handleMouseUp, options: { passive: true } },
            { type: 'mouseleave', handler: this.handleMouseUp, options: { passive: true } },
            { type: 'dragstart', handler: (e) => e.preventDefault(), options: { passive: false } }
        ];

        events.forEach(({ type, handler, options }) => {
            this.addEventListener(container, type, handler, options);
        });
    }

    onTouchStart(e) {
        if (this.state.isAnimating) return;
        this.state.swipeStartX = e.touches[0].clientX;
        this.state.swipeStartTime = Date.now();
        this.state.isSwiping = true;
    }

    onTouchMove(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;

        const touch = e.touches[0];
        const swipeX = touch.clientX - this.state.swipeStartX;

        // SAMO visual feedback BEZ preventDefault() - ovo je rešenje za grešku
        if (Math.abs(swipeX) > this.config.swipe.threshold) {
            this.elements.modalImageContainer?.classList.add('swipe-active');
        } else {
            this.elements.modalImageContainer?.classList.remove('swipe-active');
        }
    }

    onTouchEnd(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;

        const touch = e.changedTouches[0];
        const swipeX = touch.clientX - this.state.swipeStartX;
        const swipeTime = Date.now() - this.state.swipeStartTime;

        this.elements.modalImageContainer?.classList.remove('swipe-active');

        // Proveravamo i vreme trajanja swipa za bolje uočavanje namerne akcije
        const isIntentionalSwipe = Math.abs(swipeX) > this.config.swipe.threshold &&
            swipeTime < this.config.swipe.maxSwipeTime;

        if (isIntentionalSwipe) {
            swipeX > 0 ? this.prev() : this.next();
        }

        this.state.isSwiping = false;
        this.state.shouldPreventScroll = false;
    }

    onMouseDown(e) {
        if (this.state.isAnimating || e.button !== 0) return;
        this.state.swipeStartX = e.clientX;
        this.state.swipeStartTime = Date.now();
        this.state.isSwiping = true;
        document.body.style.userSelect = 'none';
    }

    onMouseMove(e) {
        // Samo prati kretanje, glavna logika je u touch move
    }

    onMouseUp(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;

        const swipeX = e.clientX - this.state.swipeStartX;
        const swipeTime = Date.now() - this.state.swipeStartTime;

        const isIntentionalSwipe = Math.abs(swipeX) > this.config.swipe.threshold &&
            swipeTime < this.config.swipe.maxSwipeTime;

        if (isIntentionalSwipe) {
            swipeX > 0 ? this.prev() : this.next();
        }

        this.state.isSwiping = false;
        document.body.style.userSelect = '';
    }

    cleanupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        const swipeEvents = ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mousemove', 'mouseup', 'mouseleave', 'dragstart'];
        swipeEvents.forEach(type => {
            this.removeEventListener(container, type);
        });
    }

    // MODAL FUNCTIONALITY - OPTIMIZOVANO
    openModal() {
        if (!this.elements.modal || this.elements.modal.classList.contains('active')) return;

        this.stopRotation();
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        const currentState = history.state;
        if (!currentState || currentState.modal !== 'gallery') {
            this.pushHistoryState(this.state.currentIndex);
        }

        requestAnimationFrame(() => {
            this.elements.modal.classList.add('active');
        });

        this.createIndicators();
        this.updateModalImage(true);
        this.setupSwipeEvents();
        this.setupModalEventListeners();
    }

    openModalWithoutHistory() {
        if (!this.elements.modal || this.elements.modal.classList.contains('active')) return;

        this.stopRotation();
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            this.elements.modal.classList.add('active');
        });

        this.createIndicators();
        this.updateModalImage(true);
        this.setupSwipeEvents();
        this.setupModalEventListeners();
    }

    closeModal() {
        if (!this.elements.modal || !this.elements.modal.classList.contains('active')) return;

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

            if (this.state.rotatingImages.length > 1 && this.config.rotation.enabled) {
                this.startRotation();
            }
        }, this.config.animation.duration);
    }

    closeModalWithoutHistory() {
        if (!this.elements.modal || !this.elements.modal.classList.contains('active')) return;

        this.elements.modal.classList.remove('active');

        setTimeout(() => {
            this.elements.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.cleanupModalEventListeners();
            this.cleanupSwipeEvents();

            if (this.state.rotatingImages.length > 1 && this.config.rotation.enabled) {
                this.startRotation();
            }
        }, this.config.animation.duration);
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
        if (!currentImage || !this.elements.modalImage) return;

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
            }, this.config.animation.duration);
        }, this.config.animation.duration);
    }

    getNavigationDirection() {
        const diff = this.state.currentIndex - this.state.prevIndex;
        return (diff === 1 || diff === -(this.images.length - 1)) ? 'next' : 'prev';
    }

    createIndicators() {
        if (!this.elements.imageIndicators) return;

        const fragment = document.createDocumentFragment();

        this.images.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `gallery-indicator ${index === this.state.currentIndex ? 'active' : ''}`;
            indicator.setAttribute('aria-label', `Pogledaj sliku ${index + 1}`);
            indicator.setAttribute('type', 'button');

            const clickHandler = () => {
                if (this.state.isAnimating) return;
                this.state.prevIndex = this.state.currentIndex;
                this.state.currentIndex = index;
                this.replaceHistoryState(index);
                this.updateModalImage();
            };

            this.addEventListener(indicator, 'click', clickHandler);
            fragment.appendChild(indicator);
        });

        this.elements.imageIndicators.innerHTML = '';
        this.elements.imageIndicators.appendChild(fragment);
    }

    updateIndicators() {
        const indicators = this.elements.imageIndicators?.querySelectorAll('.gallery-indicator');
        indicators?.forEach((indicator, index) => {
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

    // EVENT MANAGEMENT - POBOLJŠANO
    setupEventListeners() {
        const elements = [
            { element: this.elements.closeBtn, type: 'click', handler: () => this.closeModal() },
            {
                element: this.elements.modal, type: 'click', handler: (e) => {
                    if (e.target === this.elements.modal) this.closeModal();
                }
            },
            {
                element: this.elements.prevBtn, type: 'click', handler: (e) => {
                    e.stopPropagation();
                    this.prev();
                }
            },
            {
                element: this.elements.nextBtn, type: 'click', handler: (e) => {
                    e.stopPropagation();
                    this.next();
                }
            }
        ];

        elements.forEach(({ element, type, handler }) => {
            if (element) {
                this.addEventListener(element, type, handler);
            }
        });

        this.addEventListener(window, 'resize', this.handleResize);
    }

    onResize() {
        if (this.state.resizeTimeout) {
            cancelAnimationFrame(this.state.resizeTimeout);
        }

        this.state.resizeTimeout = requestAnimationFrame(() => {
            this.createGallery();
        });
    }

    setupModalEventListeners() {
        this.addEventListener(document, 'keydown', this.handleKeyDown);
    }

    onKeyDown(e) {
        if (!this.elements.modal?.classList.contains('active')) return;

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
        this.removeEventListener(document, 'keydown');
    }

    // POBOLJŠANI EVENT MANAGEMENT
    addEventListener(element, type, handler, options) {
        if (!element) return;

        try {
            // Osigurajte da su options uvek definisani
            const eventOptions = options || { passive: true };
            element.addEventListener(type, handler, eventOptions);

            const key = `${type}-${Math.random().toString(36).substr(2, 9)}`;
            this.eventListeners.set(key, { element, type, handler, options: eventOptions });
        } catch (error) {
            console.warn(`Failed to add event listener for ${type}:`, error);
        }
    }

    removeEventListener(element, type, handler) {
        if (!element) return;

        try {
            if (type && handler) {
                element.removeEventListener(type, handler);
                // Uklanjanje iz mape
                this.eventListeners.forEach((value, key) => {
                    if (value.element === element && value.type === type && value.handler === handler) {
                        this.eventListeners.delete(key);
                    }
                });
            } else if (type) {
                // Uklanjanje svih listenera određenog tipa
                this.eventListeners.forEach((value, key) => {
                    if (value.element === element && value.type === type) {
                        element.removeEventListener(value.type, value.handler);
                        this.eventListeners.delete(key);
                    }
                });
            } else {
                // Uklanjanje svih listenera za element
                this.eventListeners.forEach((value, key) => {
                    if (value.element === element) {
                        element.removeEventListener(value.type, value.handler);
                        this.eventListeners.delete(key);
                    }
                });
            }
        } catch (error) {
            console.warn('Error removing event listener:', error);
        }
    }

    // SHUFFLE MANAGEMENT
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

    // CLEANUP
    cleanup() {
        this.stopRotation();

        // Cleanup intervals and timeouts
        if (this.state.resizeTimeout) {
            cancelAnimationFrame(this.state.resizeTimeout);
        }

        // Cleanup intersection observer
        if (this.state.intersectionObserver) {
            this.state.intersectionObserver.disconnect();
        }

        // Safe cleanup all event listeners
        this.eventListeners.forEach(({ element, type, handler, options }) => {
            try {
                if (element && handler) {
                    element.removeEventListener(type, handler, options);
                }
            } catch (error) {
                console.warn('Error removing event listener:', error);
            }
        });
        this.eventListeners.clear();

        this.isInitialized = false;
    }
}

// GLOBAL INITIALIZATION
if (!window.galleryManager) {
    window.galleryManager = new GalleryManager();
}

// Modern initialization with better error handling
const initializeGallery = () => {
    try {
        if (window.galleryManager && !window.galleryManager.isInitialized) {
            setTimeout(() => window.galleryManager.init(), 100);
        }
    } catch (error) {
        console.error('Failed to initialize gallery:', error);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGallery);
} else {
    initializeGallery();
}

// Export za module sistem
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GalleryManager;
}