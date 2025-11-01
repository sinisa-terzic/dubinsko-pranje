/**
 * GALERIJA - OPTIMIZOVANA VERZIJA
 */

class GalleryManager {
    constructor() {
        this.config = {
            grid: {
                desktop: { rows: 2, gap: 3, minWidth: 300 },
                tablet: { rows: 2, gap: 15, minWidth: 200 },
                mobile: { rows: 2, gap: 10, minWidth: 150 }
            },
            swipe: { threshold: 50 }
        };

        this.images = [
            { id: 1, src: "img/gallery/1200x800/1.webp", thumbnail: "img/gallery/1.webp", alt: "Prekrasan prikaz prirode 1" },
            { id: 2, src: "img/gallery/1200x800/2.webp", thumbnail: "img/gallery/2.webp", alt: "Moderna arhitektura 2" },
            { id: 3, src: "img/gallery/1200x800/3.webp", thumbnail: "img/gallery/3.webp", alt: "Gradski vidik noću 3" },
            { id: 4, src: "img/gallery/1200x800/4.webp", thumbnail: "img/gallery/4.webp", alt: "Planinski pejzaž 4" },
            { id: 5, src: "img/gallery/1200x800/5.webp", thumbnail: "img/gallery/5.webp", alt: "Morska obala 5" },
            { id: 6, src: "img/gallery/1200x800/6.webp", thumbnail: "img/gallery/6.webp", alt: "Šumska staza 6" },
            { id: 7, src: "img/gallery/1200x800/7.webp", thumbnail: "img/gallery/7.webp", alt: "Gradska četvrt 7" },
            { id: 8, src: "img/gallery/1200x800/8.webp", thumbnail: "img/gallery/8.webp", alt: "Zimski pejzaž 8" },
            { id: 9, src: "img/gallery/1200x800/9.webp", thumbnail: "img/gallery/9.webp", alt: "Pustinjski krajolik 9" },
            { id: 10, src: "img/gallery/1200x800/10.webp", thumbnail: "img/gallery/10.webp", alt: "Jezerski vidik 10" },
            { id: 11, src: "img/gallery/1200x800/11.webp", thumbnail: "img/gallery/11.webp", alt: "Planinski vrh 11" },
            { id: 12, src: "img/gallery/1200x800/12.webp", thumbnail: "img/gallery/12.webp", alt: "Šumski potok 12" },
            { id: 13, src: "img/gallery/1200x800/14.webp", thumbnail: "img/gallery/14.webp", alt: "Poljski cvijet 13" },
            { id: 14, src: "img/gallery/1200x800/13.webp", thumbnail: "img/gallery/13.webp", alt: "Gradska noć 14" }
        ];

        this.state = {
            currentIndex: 0,
            rotatingImages: [],
            currentRotatingIndex: 0,
            isAnimating: false,
            prevIndex: 0,
            swipeStartX: 0,
            isSwiping: false
        };

        this.intervals = {};
        this.elements = {};
        this.isInitialized = false;

        // Bind methods za event handlere
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

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

    open(imageIndex = 0) {
        if (imageIndex < 0 || imageIndex >= this.images.length) return;

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

    // =========================================================================
    // CORE FUNCTIONALITY
    // =========================================================================

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

    createGallery() {
        this.elements.gallery.innerHTML = '';
        this.stopRotation();

        const visibleCount = this.setupGridLayout();
        const displayedImages = this.images.slice(0, visibleCount - 1);
        this.state.rotatingImages = this.images.slice(visibleCount - 1);

        // Dodaj prikazane slike
        displayedImages.forEach((image, index) => {
            this.elements.gallery.appendChild(this.createGalleryItem(image));
        });

        // Dodaj rotirajući element ako ima slika
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
        img.src = image.thumbnail;
        img.alt = image.alt;
        img.loading = 'lazy';

        img.addEventListener('click', () => {
            this.state.currentIndex = this.images.findIndex(img => img.id === image.id);
            this.state.prevIndex = this.state.currentIndex;
            this.openModal();
        });

        item.appendChild(img);
        return item;
    }

    createRotatingItem() {
        const item = document.createElement('div');
        const hasMultipleImages = this.state.rotatingImages.length > 1;

        item.className = hasMultipleImages ?
            'gallery-item rotating-item' :
            'gallery-item rotating-item no-rotation';

        // Dodaj slike za rotaciju
        this.state.rotatingImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.thumbnail;
            img.alt = image.alt;
            img.dataset.imageId = image.id;

            if (hasMultipleImages) {
                img.className = `rotating-image ${index === 0 ? 'active' : ''}`;
            }

            item.appendChild(img);
        });

        // Dodaj tekst ako ima više slika
        if (hasMultipleImages) {
            const moreText = document.createElement('div');
            moreText.className = 'more-text';
            moreText.textContent = `+${this.state.rotatingImages.length - 1}`;
            item.appendChild(moreText);
        }

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
    // ROTATION
    // =========================================================================

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
        if (!rotatingItem) return;

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

    // =========================================================================
    // SWIPE FUNCTIONALITY
    // =========================================================================

    setupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        // Touch events
        container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        container.addEventListener('touchend', this.handleTouchEnd);

        // Mouse events
        container.addEventListener('mousedown', this.handleMouseDown);
        container.addEventListener('mousemove', this.handleMouseMove);
        container.addEventListener('mouseup', this.handleMouseUp);
        container.addEventListener('mouseleave', this.handleMouseUp);
        container.addEventListener('dragstart', (e) => e.preventDefault());
    }

    handleTouchStart(e) {
        if (this.state.isAnimating) return;
        this.state.swipeStartX = e.touches[0].clientX;
        this.state.isSwiping = true;
    }

    handleTouchMove(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;
        const touch = e.touches[0];
        const swipeX = touch.clientX - this.state.swipeStartX;
        if (Math.abs(swipeX) > 10) e.preventDefault();
    }

    handleTouchEnd(e) {
        if (!this.state.isSwiping || this.state.isAnimating) return;
        const touch = e.changedTouches[0];
        this.processSwipe(touch.clientX - this.state.swipeStartX);
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
        this.processSwipe(e.clientX - this.state.swipeStartX);
        this.state.isSwiping = false;
        document.body.style.userSelect = '';
    }

    processSwipe(swipeX) {
        if (Math.abs(swipeX) > this.config.swipe.threshold) {
            swipeX > 0 ? this.prev() : this.next();
        }
    }

    cleanupSwipeEvents() {
        const container = this.elements.modalImageContainer;
        if (!container) return;

        const events = ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mousemove', 'mouseup', 'mouseleave'];
        events.forEach(event => {
            container.removeEventListener(event, this[`handle${event.charAt(0).toUpperCase() + event.slice(1)}`]);
        });
    }

    // =========================================================================
    // MODAL FUNCTIONALITY
    // =========================================================================

    openModal() {
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

    navigate(direction) {
        if (this.state.isAnimating) return;
        this.state.prevIndex = this.state.currentIndex;
        this.state.currentIndex = (this.state.currentIndex + direction + this.images.length) % this.images.length;
        this.updateModalImage();
    }

    updateModalImage(skipAnimation = false) {
        const currentImage = this.images[this.state.currentIndex];

        if (skipAnimation) {
            this.elements.modalImage.src = currentImage.src;
            this.elements.modalImage.alt = currentImage.alt;
            this.updateIndicators();
            return;
        }

        this.state.isAnimating = true;
        const direction = this.getNavigationDirection();

        // Animacija izlaska
        this.elements.modalImage.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

        setTimeout(() => {
            this.elements.modalImage.classList.remove('slide-out-left', 'slide-out-right');
            this.elements.modalImage.src = currentImage.src;
            this.elements.modalImage.alt = currentImage.alt;

            // Animacija ulaska
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
            indicator.addEventListener('click', () => {
                if (this.state.isAnimating) return;
                this.state.prevIndex = this.state.currentIndex;
                this.state.currentIndex = index;
                this.updateModalImage();
            });
            this.elements.imageIndicators.appendChild(indicator);
        });
    }

    updateIndicators() {
        const indicators = document.querySelectorAll('.gallery-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.state.currentIndex);
        });
    }

    // =========================================================================
    // GRID SYSTEM
    // =========================================================================

    setupGridLayout() {
        const config = this.getCurrentConfig();
        const containerWidth = this.elements.gallery.parentElement.clientWidth;
        const maxColumns = Math.floor(containerWidth / config.minWidth);
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

    // =========================================================================
    // EVENT MANAGEMENT
    // =========================================================================

    setupEventListeners() {
        // Modal controls
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) this.closeModal();
            });
        }

        // Navigation
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

        // Resize
        window.addEventListener('resize', this.handleResize);
    }

    handleResize() {
        clearTimeout(this.intervals.resize);
        this.intervals.resize = setTimeout(() => {
            this.createGallery();
        }, 250);
    }

    setupModalEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'Escape': this.closeModal(); break;
            case 'ArrowLeft': this.prev(); break;
            case 'ArrowRight': this.next(); break;
        }
    }

    cleanupModalEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

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
// GLOBAL INITIALIZATION
// =============================================================================

if (!window.galleryManager) {
    window.galleryManager = new GalleryManager();
}

// Auto-initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.galleryManager.init(), 100);
    });
} else {
    setTimeout(() => window.galleryManager.init(), 100);
}