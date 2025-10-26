/*!
 * GALERIJA - POBOLJŠANA VERZIJA SA ISPRAVLJENIM DOUBLE-CLICK ZOOM RESET
 * ⚡ KORISTI CENTRALIZOVANU KONFIGURACIJU
 * © 2024 Perfect Shine. Sva prava zadržana.
 */

import { GALLERY_CONFIG } from '../config/index.js';
import { EventBus } from '../core/event-bus.js';
import { Utilities } from '../core/utilities.js';

class GalleryManager {
    constructor() {
        // KONFIGURACIJA IZ CENTRALNOG FAJLA
        this.config = {
            grid: GALLERY_CONFIG.grid,
            autoplay: GALLERY_CONFIG.features.autoplay,
            zoom: GALLERY_CONFIG.features.zoom,
            drag: GALLERY_CONFIG.features.drag,
            rotation: GALLERY_CONFIG.features.rotation
        };

        // Inicijalizuj zoom konfiguraciju
        this.config.zoom.currentScale = 1;

        // SLIKE IZ CENTRALNE KONFIGURACIJE
        this.images = GALLERY_CONFIG.images;

        // State management
        this.state = {
            currentIndex: 0,
            rotatingImages: [],
            currentRotatingIndex: 0,
            isZoomed: false,
            translateX: 0,
            translateY: 0,
            isDragging: false,
            startX: 0,
            currentX: 0,
            dragOffset: 0,
            isPanning: false,
            startPanX: 0,
            startPanY: 0,
            lastPanX: 0,
            lastPanY: 0,
            lastClickTime: 0,
            wasZoomedBeforeAutoplay: false,
            // Nova stanja za double-click zoom
            lastClickPosition: { x: 0, y: 0 },
            doubleClickTimeout: null,
            clickCount: 0
        };

        // Intervals & timeouts
        this.intervals = {
            rotation: null,
            autoplay: null,
            progress: null,
            resize: null
        };

        // DOM references
        this.elements = {};

        // Event listeners references for proper cleanup
        this.eventListeners = new Map();

        // Event bus integration
        this.eventBus = null;
        this.eventUnsubscribe = [];

        this.isInitialized = false;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    init() {
        if (this.isInitialized) {
            return;
        }

        try {
            this.connectToEventBus();
            this.cacheElements();
            this.createGallery();
            this.setupEventListeners();
            this.setupExternalEventListeners();

            this.isInitialized = true;

            this.emitEvent('gallery:initialized', {
                totalImages: this.images.length,
                features: ['autoplay', 'zoom', 'drag-navigation', 'rotation', 'container-pan', 'double-click-reset'],
                configSource: 'centralized'
            });

        } catch (error) {
            console.error('❌ Gallery initialization failed:', error);
            this.emitEvent('gallery:error', { error });
        }
    }

    connectToEventBus() {
        if (window.appEventBus) {
            this.eventBus = window.appEventBus;
        } else if (window.app && window.app.eventBus) {
            this.eventBus = window.app.eventBus;
        }
    }

    emitEvent(eventName, data = {}) {
        if (this.eventBus) {
            this.eventBus.emit(eventName, data);
        } else {
            window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
        }
    }

    setupExternalEventListeners() {
        if (!this.eventBus) return;

        const unsubscribeModalOpen = this.eventBus.on('modal:open', (data) => {
            if (data.type !== 'gallery' && this.isModalOpen()) {
                this.close();
            }
        });

        const unsubscribeAppReady = this.eventBus.on('app:initialized', () => {
            // console.log('🎯 Gallery: App initialized event received');
        });

        this.eventUnsubscribe.push(unsubscribeModalOpen, unsubscribeAppReady);
    }

    open(imageIndex = 0) {
        if (!this.validateIndex(imageIndex)) return;

        this.state.currentIndex = imageIndex;
        this.openModal();
    }

    close() {
        this.closeModal();
    }

    next() {
        this.navigate(1);
    }

    prev() {
        this.navigate(-1);
    }

    getState() {
        return {
            currentIndex: this.state.currentIndex,
            totalImages: this.images.length,
            isModalOpen: this.isModalOpen(),
            autoplayEnabled: this.config.autoplay.enabled,
            zoomLevel: this.config.zoom.currentScale,
            isInitialized: this.isInitialized,
            configSource: 'centralized'
        };
    }

    isModalOpen() {
        return this.elements.modal?.style.display === 'block';
    }

    destroy() {
        this.cleanup();
    }

    // =========================================================================
    // CORE FUNCTIONALITY
    // =========================================================================

    cacheElements() {
        const selectors = {
            gallery: '#gallery',
            modal: '#imageModal',
            modalImage: '#modalImage',
            modalImageContainer: '#modalImageContainer',
            closeBtn: '#closeBtn',
            prevBtn: '#prevBtn',
            nextBtn: '#nextBtn',
            imageIndicators: '#imageIndicators',
            autoplayBtn: '#autoplayBtn',
            autoplayProgressBar: '#autoplayProgressBar',
            zoomInBtn: '#zoomInBtn',
            zoomOutBtn: '#zoomOutBtn',
            zoomResetBtn: '#zoomResetBtn',
            zoomLevel: '#zoomLevel'
        };

        for (const [key, selector] of Object.entries(selectors)) {
            this.elements[key] = document.querySelector(selector);
        }

        if (!this.elements.gallery || !this.elements.modal || !this.elements.modalImage) {
            throw new Error('Required gallery elements not found');
        }
    }

    createGallery() {
        this.elements.gallery.innerHTML = '';
        const visibleCount = this.getVisibleItemsCount();

        this.stopRotation();
        const displayedImages = this.images.slice(0, visibleCount - 1);
        this.state.rotatingImages = this.images.slice(visibleCount - 1);

        displayedImages.forEach((image, index) => {
            const galleryItem = this.createGalleryItem(image, index);
            this.elements.gallery.appendChild(galleryItem);
        });

        if (this.state.rotatingImages.length > 0) {
            const rotatingItem = this.createRotatingItem();
            this.elements.gallery.appendChild(rotatingItem);

            if (this.state.rotatingImages.length > 1 && this.config.rotation.enabled) {
                this.startRotation();
            }
        }
    }

    createGalleryItem(image, index) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = image.thumbnail;
        img.alt = image.alt;
        img.loading = 'lazy';

        this.addEventListener(img, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.state.currentIndex = this.images.findIndex(img => img.id === image.id);
            this.openModal();
        });

        galleryItem.appendChild(img);
        return galleryItem;
    }

    createRotatingItem() {
        const galleryItem = document.createElement('div');
        const hasMultipleImages = this.state.rotatingImages.length > 1;

        galleryItem.className = hasMultipleImages ?
            'gallery-item rotating-item' :
            'gallery-item rotating-item no-rotation';

        this.state.rotatingImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.thumbnail;
            img.alt = image.alt;

            if (hasMultipleImages) {
                img.className = `rotating-image ${index === 0 ? 'active' : ''}`;
            }

            img.dataset.imageId = image.id;
            galleryItem.appendChild(img);
        });

        if (hasMultipleImages && this.state.rotatingImages.length > 1) {
            const overlay = document.createElement('div');
            overlay.className = 'more-overlay';
            const moreText = document.createElement('div');
            moreText.className = 'more-text';
            moreText.textContent = `+${this.state.rotatingImages.length - 1}`;
            overlay.appendChild(moreText);
            galleryItem.appendChild(overlay);
        }

        this.addEventListener(galleryItem, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleRotatingItemClick(galleryItem, hasMultipleImages);
        });

        return galleryItem;
    }

    handleRotatingItemClick(galleryItem, hasMultipleImages) {
        let imageId;

        if (hasMultipleImages) {
            const activeImage = galleryItem.querySelector('.rotating-image.active');
            imageId = activeImage ? parseInt(activeImage.dataset.imageId) : null;
        } else {
            const singleImage = galleryItem.querySelector('img');
            imageId = singleImage ? parseInt(singleImage.dataset.imageId) : null;
        }

        if (imageId) {
            this.state.currentIndex = this.images.findIndex(img => img.id === imageId);
            this.openModal();
        }
    }

    // =========================================================================
    // ROTATION FUNCTIONALITY
    // =========================================================================

    startRotation() {
        this.stopRotation();
        this.intervals.rotation = setInterval(() => this.rotateImages(), this.config.rotation.interval);
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
    // MODAL FUNCTIONALITY
    // =========================================================================

    openModal() {
        this.coordinateWithOtherModals();
        this.stopRotation();
        this.stopAutoplay();
        this.resetZoom();

        this.elements.modal.style.display = 'block';
        this.elements.modal.style.animation = 'fadeIn 0.3s ease-out forwards';
        document.body.style.overflow = 'hidden';

        this.createIndicators();
        this.updateModalContent(true);

        this.setupModalEventListeners();

        this.emitEvent('gallery:open', {
            imageIndex: this.state.currentIndex,
            totalImages: this.images.length
        });

        this.emitEvent('modal:open', { type: 'gallery' });
    }

    closeModal() {
        this.elements.modal.style.animation = 'fadeOut 0.3s ease-out forwards';

        this.emitEvent('gallery:closing', {
            imageIndex: this.state.currentIndex
        });

        setTimeout(() => {
            this.elements.modal.style.display = 'none';
            this.elements.modal.style.animation = '';
            document.body.style.overflow = 'auto';

            this.state.isDragging = false;
            this.state.isPanning = false;
            this.resetImageTransform();
            this.cleanupModalEventListeners();
            this.stopAutoplay();
            this.resetZoom();

            if (this.state.rotatingImages.length > 1 && this.config.rotation.enabled) {
                this.startRotation();
            }

            this.emitEvent('gallery:closed');
        }, 300);
    }

    createIndicators() {
        if (!this.elements.imageIndicators) return;

        this.elements.imageIndicators.innerHTML = '';
        this.images.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `indicator ${index === this.state.currentIndex ? 'active' : ''}`;

            this.addEventListener(indicator, 'click', () => {
                this.handleUserNavigation();
                this.state.currentIndex = index;
                this.updateModalContent();
            });

            this.elements.imageIndicators.appendChild(indicator);
        });
    }

    updateModalContent(skipTransition = false, direction = 0) {
        if (!this.elements.modalImage) return;

        const currentImage = this.images[this.state.currentIndex];

        if (!skipTransition && direction !== 0) {
            const exitClass = direction === 1 ? 'modal-image-slide-out-left' : 'modal-image-slide-out-right';
            this.elements.modalImage.classList.add(exitClass);

            setTimeout(() => {
                this.elements.modalImage.classList.remove(exitClass);
                this.elements.modalImage.src = currentImage.src;
                this.elements.modalImage.alt = currentImage.alt;

                this.elements.modalImage.onload = () => {
                    const enterClass = direction === 1 ? 'modal-image-slide-in-right' : 'modal-image-slide-in-left';
                    this.elements.modalImage.classList.add(enterClass);

                    setTimeout(() => {
                        this.elements.modalImage.classList.remove(enterClass);
                    }, 500);
                };
            }, 500);
        } else {
            this.elements.modalImage.src = currentImage.src;
            this.elements.modalImage.alt = currentImage.alt;
        }

        this.updateIndicators();

        if (this.config.autoplay.enabled) {
            this.resetZoomForAutoplay();
        } else if (!skipTransition) {
            this.resetZoom();
        }

        this.emitEvent('gallery:imageChanged', {
            index: this.state.currentIndex,
            image: currentImage
        });
    }

    updateIndicators() {
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.state.currentIndex);
        });
    }

    navigate(direction, isAutoplay = false) {
        if (!isAutoplay) {
            this.handleUserNavigation();
        }

        this.state.currentIndex = (this.state.currentIndex + direction + this.images.length) % this.images.length;
        this.updateModalContent();

        if (this.config.autoplay.enabled && isAutoplay) {
            this.startProgressBar();
        }
    }

    // =========================================================================
    // AUTOPLAY FUNCTIONALITY
    // =========================================================================

    startAutoplay() {
        this.state.wasZoomedBeforeAutoplay = this.config.zoom.currentScale !== 1;
        this.resetZoomForAutoplay();

        this.stopAutoplay();

        this.config.autoplay.enabled = true;

        if (this.elements.autoplayBtn) {
            this.elements.autoplayBtn.classList.remove('play');
            this.elements.autoplayBtn.classList.add('pause');
            this.elements.autoplayBtn.title = 'Zaustavi autoplay';
        }

        this.startProgressBar();

        this.intervals.autoplay = setInterval(() => {
            if (this.config.autoplay.enabled) {
                if (this.config.zoom.currentScale !== 1) {
                    this.stopAutoplay();
                    return;
                }

                this.navigate(1, true);
            }
        }, this.config.autoplay.interval);

        this.emitEvent('gallery:autoplayStarted');
    }

    stopAutoplay() {
        if (this.intervals.autoplay) {
            clearInterval(this.intervals.autoplay);
            this.intervals.autoplay = null;
        }

        if (this.intervals.progress) {
            clearInterval(this.intervals.progress);
            this.intervals.progress = null;
        }

        this.config.autoplay.enabled = false;
        if (this.elements.autoplayBtn) {
            this.elements.autoplayBtn.classList.remove('pause');
            this.elements.autoplayBtn.classList.add('play');
            this.elements.autoplayBtn.title = 'Pokreni autoplay';
        }

        if (this.elements.autoplayProgressBar) {
            this.elements.autoplayProgressBar.style.width = '0%';
        }

        this.emitEvent('gallery:autoplayStopped');
    }

    toggleAutoplay(e) {
        if (e) e.stopPropagation();

        if (this.config.autoplay.enabled) {
            this.stopAutoplay();
        } else {
            this.startAutoplay();
        }
    }

    startProgressBar() {
        if (this.intervals.progress) clearInterval(this.intervals.progress);

        if (!this.elements.autoplayProgressBar) return;

        this.autoplayStartTime = Date.now();
        this.elements.autoplayProgressBar.style.width = '0%';

        this.intervals.progress = setInterval(() => {
            const elapsed = Date.now() - this.autoplayStartTime;
            const progress = (elapsed / this.config.autoplay.interval) * 100;
            this.elements.autoplayProgressBar.style.width = `${Math.min(progress, 100)}%`;
        }, 50);
    }

    // =========================================================================
    // ZOOM FUNCTIONALITY
    // =========================================================================

    resetZoomForAutoplay() {
        this.config.zoom.currentScale = 1;
        this.resetPan();
        this.applyZoom();
    }

    handleZoomChange() {
        if (this.config.autoplay.enabled && this.config.zoom.currentScale !== 1) {
            this.stopAutoplay();
        }
    }

    // =========================================================================
    // USER INTERACTIONS
    // =========================================================================

    handleUserNavigation() {
        if (this.config.autoplay.enabled) {
            this.stopAutoplay();
        }
    }

    handleUserZoomInteraction() {
        this.handleZoomChange();
    }

    // =========================================================================
    // DRAG NAVIGATION FUNCTIONALITY
    // =========================================================================

    startDrag(e) {
        if (this.state.isZoomed || e.button !== 0) return;

        e.preventDefault();
        this.state.isDragging = true;
        this.state.startX = e.clientX;
        this.state.currentX = e.clientX;
        this.state.dragOffset = 0;

        if (this.elements.modalImage) {
            this.elements.modalImage.style.cursor = 'grabbing';
        }

        this.addEventListener(document, 'mousemove', (e) => this.onDragMove(e));
        this.addEventListener(document, 'mouseup', () => this.endDrag());
    }

    startDragTouch(e) {
        if (this.state.isZoomed) return;

        e.preventDefault();
        this.state.isDragging = true;
        this.state.startX = e.touches[0].clientX;
        this.state.currentX = e.touches[0].clientX;
        this.state.dragOffset = 0;

        this.addEventListener(document, 'touchmove', (e) => this.onDragMoveTouch(e), { passive: false });
        this.addEventListener(document, 'touchend', () => this.endDrag());
    }

    onDragMove(e) {
        if (!this.state.isDragging) return;

        e.preventDefault();
        this.state.currentX = e.clientX;
        this.state.dragOffset = this.state.currentX - this.state.startX;

        this.applyDragTransform();
    }

    onDragMoveTouch(e) {
        if (!this.state.isDragging) return;

        e.preventDefault();
        this.state.currentX = e.touches[0].clientX;
        this.state.dragOffset = this.state.currentX - this.state.startX;

        this.applyDragTransform();
    }

    applyDragTransform() {
        if (!this.elements.modalImage) return;

        const dragPercentage = this.state.dragOffset / window.innerWidth;
        const maxTransform = 100;

        this.elements.modalImage.style.transform = `translateX(${this.state.dragOffset * 0.3}px)`;
        this.updateDragOverlay();
    }

    updateDragOverlay() {
        const direction = this.state.dragOffset > 0 ? 'next' : 'prev';
        const intensity = Math.min(Math.abs(this.state.dragOffset) / 200, 0.3);

        if (this.elements.modalImage) {
            if (Math.abs(this.state.dragOffset) > this.config.drag.threshold) {
                this.elements.modalImage.style.opacity = `${1 - intensity}`;
            } else {
                this.elements.modalImage.style.opacity = '1';
            }
        }
    }

    endDrag() {
        if (!this.state.isDragging) return;

        const dragDistance = Math.abs(this.state.dragOffset);
        const dragDirection = this.state.dragOffset > 0 ? 'right' : 'left';

        if (this.elements.modalImage) {
            this.elements.modalImage.style.transform = 'translateX(0)';
            this.elements.modalImage.style.opacity = '1';
            this.elements.modalImage.style.cursor = 'grab';
        }

        if (dragDistance > this.config.drag.threshold) {
            this.handleUserNavigation();

            if (dragDirection === 'left') {
                this.navigate(-1);
            } else {
                this.navigate(1);
            }
        }

        this.state.isDragging = false;
        this.state.startX = 0;
        this.state.currentX = 0;
        this.state.dragOffset = 0;

        this.removeDragEventListeners();
    }

    removeDragEventListeners() {
        const dragListeners = Array.from(this.eventListeners.entries())
            .filter(([_, { event }]) =>
                event === 'mousemove' || event === 'mouseup' ||
                event === 'touchmove' || event === 'touchend'
            );

        dragListeners.forEach(([key, { element, event, handler, options }]) => {
            if (event === 'mousemove' && handler.toString().includes('onDragMove')) {
                element.removeEventListener(event, handler, options);
                this.eventListeners.delete(key);
            }
            if (event === 'touchmove' && handler.toString().includes('onDragMoveTouch')) {
                element.removeEventListener(event, handler, options);
                this.eventListeners.delete(key);
            }
            if ((event === 'mouseup' || event === 'touchend') && handler.toString().includes('endDrag')) {
                element.removeEventListener(event, handler, options);
                this.eventListeners.delete(key);
            }
        });
    }

    // =========================================================================
    // ZOOM & PAN FUNCTIONALITY - POBOLJŠANO
    // =========================================================================

    calculatePanBounds() {
        if (!this.elements.modalImage || !this.elements.modalImageContainer) {
            return { maxX: 0, maxY: 0 };
        }

        const containerRect = this.elements.modalImageContainer.getBoundingClientRect();
        const imgRect = this.elements.modalImage.getBoundingClientRect();
        const scale = this.config.zoom.currentScale;

        const imgWidth = this.elements.modalImage.naturalWidth || imgRect.width;
        const imgHeight = this.elements.modalImage.naturalHeight || imgRect.height;

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);

        return {
            maxX: maxTranslateX,
            maxY: maxTranslateY,
            scaledWidth,
            scaledHeight,
            containerWidth: containerRect.width,
            containerHeight: containerRect.height
        };
    }

    clampPan(value, maxDelta) {
        if (maxDelta <= 0) return 0;
        return Math.max(Math.min(value, maxDelta), -maxDelta);
    }

    applyZoom() {
        const scale = this.config.zoom.currentScale;

        if (scale > 1) {
            const bounds = this.calculatePanBounds();

            this.state.translateX = this.clampPan(this.state.translateX, bounds.maxX);
            this.state.translateY = this.clampPan(this.state.translateY, bounds.maxY);

            if (bounds.maxX === 0) this.state.translateX = 0;
            if (bounds.maxY === 0) this.state.translateY = 0;
        } else {
            this.resetPan();
        }

        this.elements.modalImage.style.transform =
            `scale(${scale}) translate(${this.state.translateX}px, ${this.state.translateY}px)`;

        if (this.elements.zoomLevel) {
            this.elements.zoomLevel.textContent = `${Math.round(scale * 100)}%`;
        }

        if (scale > 1) {
            this.elements.modalImageContainer.classList.add('zoomed');
            this.elements.modalImageContainer.style.cursor = 'grab';
            this.elements.modalImage.style.cursor = 'grab';
            this.state.isZoomed = true;
        } else {
            this.elements.modalImageContainer.classList.remove('zoomed');
            this.elements.modalImageContainer.style.cursor = 'default';
            this.elements.modalImage.style.cursor = 'grab';
            this.state.isZoomed = false;
        }

        this.showZoomLevel();
    }

    zoomIn() {
        this.handleUserZoomInteraction();

        if (this.config.zoom.currentScale < this.config.zoom.maxScale) {
            this.config.zoom.currentScale += this.config.zoom.scaleStep;
            this.applyZoom();
        }
    }

    zoomOut() {
        this.handleUserZoomInteraction();

        if (this.config.zoom.currentScale > this.config.zoom.minScale) {
            this.config.zoom.currentScale -= this.config.zoom.scaleStep;
            this.applyZoom();
        }
    }

    resetZoom() {

        if (this.config.autoplay.enabled) {
            this.stopAutoplay();
        }

        this.config.zoom.currentScale = 1;
        this.resetPan();
        this.applyZoom();

        this.emitEvent('gallery:zoomReset', { scale: 1 });
    }

    resetPan() {
        this.state.translateX = 0;
        this.state.translateY = 0;
        this.state.lastPanX = 0;
        this.state.lastPanY = 0;
    }

    showZoomLevel() {
        if (!this.elements.zoomLevel) return;

        this.elements.zoomLevel.classList.add('show');
        clearTimeout(this.elements.zoomLevel.timeout);
        this.elements.zoomLevel.timeout = setTimeout(() => {
            this.elements.zoomLevel.classList.remove('show');
        }, 2000);
    }

    // =========================================================================
    // POBOLJŠANI PAN KONTROLE - RADI NA CELOM CONTAINERU
    // =========================================================================

    startPan(e) {
        if (!this.state.isZoomed || e.button !== 0) return;

        this.handleUserZoomInteraction();

        e.preventDefault();
        this.state.isPanning = true;
        this.state.startPanX = e.clientX;
        this.state.startPanY = e.clientY;
        this.state.lastPanX = this.state.translateX;
        this.state.lastPanY = this.state.translateY;

        this.elements.modalImageContainer.style.cursor = 'grabbing';
        this.elements.modalImage.style.cursor = 'grabbing';
        this.elements.modalImage.classList.add('panning');
    }

    startPanTouch(e) {
        if (!this.state.isZoomed || e.touches.length !== 1) return;

        this.handleUserZoomInteraction();

        e.preventDefault();
        this.state.isPanning = true;
        this.state.startPanX = e.touches[0].clientX;
        this.state.startPanY = e.touches[0].clientY;
        this.state.lastPanX = this.state.translateX;
        this.state.lastPanY = this.state.translateY;

        this.elements.modalImageContainer.style.cursor = 'grabbing';
        this.elements.modalImage.style.cursor = 'grabbing';
        this.elements.modalImage.classList.add('panning');
    }

    onPan(e) {
        if (!this.state.isPanning) return;

        e.preventDefault();
        const deltaX = e.clientX - this.state.startPanX;
        const deltaY = e.clientY - this.state.startPanY;

        this.state.translateX = this.state.lastPanX + deltaX;
        this.state.translateY = this.state.lastPanY + deltaY;

        this.applyZoom();
    }

    onPanTouch(e) {
        if (!this.state.isPanning || e.touches.length !== 1) return;

        e.preventDefault();
        const deltaX = e.touches[0].clientX - this.state.startPanX;
        const deltaY = e.touches[0].clientY - this.state.startPanY;

        this.state.translateX = this.state.lastPanX + deltaX;
        this.state.translateY = this.state.lastPanY + deltaY;

        this.applyZoom();
    }

    endPan() {
        if (!this.state.isPanning) return;

        this.state.isPanning = false;
        this.elements.modalImageContainer.style.cursor = this.state.isZoomed ? 'grab' : 'default';
        this.elements.modalImage.style.cursor = this.state.isZoomed ? 'grab' : 'grab';
        this.elements.modalImage.classList.remove('panning');

        this.applyZoom();
    }

    // =========================================================================
    // DOUBLE-CLICK ZOOM RESET - ISPRAVLJENO
    // =========================================================================

    handleDoubleClick(e) {
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        // Direktno resetuj zoom bez kompleksne detekcije
        this.handleUserZoomInteraction();
        this.resetZoom();
    }

    handleClick(e) {
        if (e.button !== 0) return;

        const currentTime = new Date().getTime();
        const timeSinceLastClick = currentTime - this.state.lastClickTime;

        // Ako je prošlo manje od 300ms od poslednjeg klika, smatra se double-click
        if (timeSinceLastClick < 300 && this.state.clickCount === 1) {
            this.handleUserZoomInteraction();
            this.resetZoom();
            this.state.clickCount = 0;
            this.state.lastClickTime = 0;
        } else {
            // Single click - povećaj brojač i postavi vreme
            this.state.clickCount = 1;
            this.state.lastClickTime = currentTime;

            // Resetuj brojač nakon 300ms
            setTimeout(() => {
                if (this.state.clickCount === 1) {
                    this.state.clickCount = 0;
                    this.state.lastClickTime = 0;
                }
            }, 300);
        }
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    handleKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.closeModal();
                break;
            case 'ArrowLeft':
                this.handleUserNavigation();
                this.navigate(-1);
                break;
            case 'ArrowRight':
                this.handleUserNavigation();
                this.navigate(1);
                break;
            case ' ':
                e.preventDefault();
                this.toggleAutoplay();
                break;
            case '0':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.resetZoom();
                }
                break;
            default:
                if (e.ctrlKey) {
                    this.handleZoomShortcuts(e);
                }
                break;
        }
    }

    handleZoomShortcuts(e) {
        e.preventDefault();
        this.handleUserZoomInteraction();

        switch (e.key) {
            case '+':
            case '=':
                this.zoomIn();
                break;
            case '-':
                this.zoomOut();
                break;
            case '0':
                this.resetZoom();
                break;
        }
    }

    handleWheel(e) {
        if (this.elements.modal.style.display !== 'block') return;
        e.preventDefault();

        this.handleUserZoomInteraction();

        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    getCurrentConfig() {
        const width = window.innerWidth;
        if (width >= 1200) return { type: 'desktop', ...this.config.grid.desktop };
        if (width >= 768) return { type: 'tablet', ...this.config.grid.tablet };
        return { type: 'mobile', ...this.config.grid.mobile };
    }

    getVisibleItemsCount() {
        return Math.min(this.setupGridLayout(), this.images.length);
    }

    setupGridLayout() {
        const config = this.getCurrentConfig();
        const containerWidth = this.elements.gallery.parentElement.clientWidth;

        const maxColumns = Math.floor(containerWidth / config.minWidth);
        const itemsPerRow = Math.min(maxColumns, Math.ceil(this.images.length / config.rows));

        this.elements.gallery.style.gridTemplateColumns = `repeat(${itemsPerRow}, 1fr)`;
        this.elements.gallery.style.gap = `${config.gap}px`;

        return itemsPerRow * config.rows;
    }

    validateIndex(index) {
        return index >= 0 && index < this.images.length;
    }

    resetImageTransform() {
        if (this.elements.modalImage) {
            this.elements.modalImage.style.transform = 'translate(0, 0) scale(1)';
            this.elements.modalImage.classList.remove('transitioning');
            this.elements.modalImage.style.opacity = '1';
            this.elements.modalImage.style.cursor = 'grab';
        }
    }

    coordinateWithOtherModals() {
        this.emitEvent('gallery:opening');

        if (window.pricingManager) {
            const pricingState = window.pricingManager.getState?.();
            if (pricingState?.isModalOpen) {
                window.pricingManager.closeModal();
            }
        }

        if (window.app?.getModule) {
            const callUsModule = window.app.getModule('callUsDialog');
            if (callUsModule?.closeDialog) {
                callUsModule.closeDialog();
            }

            const dropdownModule = window.app.getModule('dropdownMenus');
            if (dropdownModule?.closeAllMenus) {
                dropdownModule.closeAllMenus();
            }
        }
    }

    // =========================================================================
    // EVENT MANAGEMENT
    // =========================================================================

    addEventListener(element, event, handler, options = {}) {
        if (!element) return;

        element.addEventListener(event, handler, options);

        const key = `${event}-${Math.random().toString(36).substr(2, 9)}`;
        this.eventListeners.set(key, { element, event, handler, options });
    }

    removeEventListeners() {
        for (const [key, { element, event, handler, options }] of this.eventListeners) {
            element.removeEventListener(event, handler, options);
        }
        this.eventListeners.clear();
    }

    setupEventListeners() {
        if (this.elements.zoomInBtn) {
            this.addEventListener(this.elements.zoomInBtn, 'click', () => {
                this.handleUserZoomInteraction();
                this.zoomIn();
            });
        }
        if (this.elements.zoomOutBtn) {
            this.addEventListener(this.elements.zoomOutBtn, 'click', () => {
                this.handleUserZoomInteraction();
                this.zoomOut();
            });
        }
        if (this.elements.zoomResetBtn) {
            this.addEventListener(this.elements.zoomResetBtn, 'click', () => {
                this.handleUserZoomInteraction();
                this.resetZoom();
            });
        }

        if (this.elements.closeBtn) {
            this.addEventListener(this.elements.closeBtn, 'click', () => this.closeModal());
        }
        if (this.elements.autoplayBtn) {
            this.addEventListener(this.elements.autoplayBtn, 'click', (e) => this.toggleAutoplay(e));
        }
        if (this.elements.modal) {
            this.addEventListener(this.elements.modal, 'click', (e) => {
                if (e.target === this.elements.modal) this.closeModal();
            });
        }

        if (this.elements.prevBtn) {
            this.addEventListener(this.elements.prevBtn, 'click', (e) => {
                e.stopPropagation();
                this.handleUserNavigation();
                this.navigate(-1);
            });
        }
        if (this.elements.nextBtn) {
            this.addEventListener(this.elements.nextBtn, 'click', (e) => {
                e.stopPropagation();
                this.handleUserNavigation();
                this.navigate(1);
            });
        }

        this.addEventListener(window, 'resize', () => {
            clearTimeout(this.intervals.resize);
            this.intervals.resize = setTimeout(() => {
                if (this.intervals.autoplay) this.stopAutoplay();
                this.createGallery();
                if (this.elements.modal?.style.display === 'block') this.applyZoom();
            }, 250);
        });
    }

    setupModalEventListeners() {
        // DRAG NAVIGATION - samo na sliku kada nije zumirano
        if (this.elements.modalImage) {
            this.addEventListener(this.elements.modalImage, 'mousedown', (e) => this.startDrag(e));
            this.addEventListener(this.elements.modalImage, 'touchstart', (e) => this.startDragTouch(e));
        }

        // PAN KONTROLE - na celom containeru kada je zumirano
        if (this.elements.modalImageContainer) {
            this.addEventListener(this.elements.modalImageContainer, 'mousedown', (e) => this.startPan(e));
            this.addEventListener(this.elements.modalImageContainer, 'touchstart', (e) => this.startPanTouch(e));

            // DOUBLE-CLICK ZOOM RESET - radi na celom containeru
            this.addEventListener(this.elements.modalImageContainer, 'dblclick', (e) => this.handleDoubleClick(e));

            // DODATNO: Regular click za backup double-click detection
            this.addEventListener(this.elements.modalImageContainer, 'click', (e) => this.handleClick(e));
        }

        // Globalni event listeneri za pan
        this.addEventListener(document, 'mousemove', (e) => this.onPan(e));
        this.addEventListener(document, 'mouseup', () => this.endPan());
        this.addEventListener(document, 'touchmove', (e) => this.onPanTouch(e), { passive: false });
        this.addEventListener(document, 'touchend', () => this.endPan());

        // Keyboard i wheel controls
        this.addEventListener(document, 'keydown', (e) => this.handleKeyDown(e));
        this.addEventListener(document, 'wheel', (e) => this.handleWheel(e), { passive: false });
    }

    cleanupModalEventListeners() {
        const modalListeners = Array.from(this.eventListeners.entries())
            .filter(([_, { event }]) =>
                event === 'keydown' || event === 'wheel' ||
                event === 'mousemove' || event === 'touchmove' ||
                event === 'mouseup' || event === 'touchend'
            );

        modalListeners.forEach(([key, { element, event, handler, options }]) => {
            element.removeEventListener(event, handler, options);
            this.eventListeners.delete(key);
        });
    }

    // =========================================================================
    // CLEANUP & DESTRUCTION
    // =========================================================================

    cleanup() {
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });

        if (this.state.doubleClickTimeout) {
            clearTimeout(this.state.doubleClickTimeout);
        }

        this.removeEventListeners();

        this.eventUnsubscribe.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.eventUnsubscribe = [];

        this.state = {
            currentIndex: 0,
            rotatingImages: [],
            currentRotatingIndex: 0,
            isZoomed: false,
            translateX: 0,
            translateY: 0,
            isDragging: false,
            startX: 0,
            currentX: 0,
            dragOffset: 0,
            isPanning: false,
            startPanX: 0,
            startPanY: 0,
            lastPanX: 0,
            lastPanY: 0,
            lastClickTime: 0,
            wasZoomedBeforeAutoplay: false,
            lastClickPosition: { x: 0, y: 0 },
            doubleClickTimeout: null,
            clickCount: 0
        };

        this.config.autoplay.enabled = false;
        this.config.zoom.currentScale = 1;

        this.elements = {};
        this.isInitialized = false;

        this.emitEvent('gallery:destroyed');
    }

    // =========================================================================
    // DEBUG & DEVELOPMENT
    // =========================================================================

    debug() {
        return {
            version: '4.3.1',
            state: this.getState(),
            config: this.config,
            elements: Object.keys(this.elements).filter(key => this.elements[key]),
            eventListeners: this.eventListeners.size,
            intervals: Object.keys(this.intervals).filter(key => this.intervals[key]),
            eventBus: !!this.eventBus,
            configSource: 'centralized',
            features: {
                dragNavigation: true,
                zoom: true,
                autoplay: true,
                rotation: true,
                keyboard: true,
                smoothPanning: true,
                doubleClickReset: true,
                boundsProtection: true,
                autoplayStopOnUserNavigation: true,
                autoplayStopOnZoomChange: true,
                autoplayContinuesAt100PercentZoom: true,
                eventBusIntegration: true,
                centralizedConfig: true,
                containerPanning: true,
                universalDoubleClickReset: true,
                doubleClickMethods: ['dblclick-event', 'click-counter'] // Dve metode za double-click
            }
        };
    }
}

// =============================================================================
// GLOBAL INITIALIZATION & EXPORTS
// =============================================================================

if (!window.galleryManager) {
    window.galleryManager = new GalleryManager();
}

const initGalleryManager = () => {
    const init = () => {
        if (window.app && !window.app.isInitialized) {
            window.addEventListener('app:ready', () => {
                setTimeout(() => window.galleryManager.init(), 50);
            });
        } else {
            setTimeout(() => window.galleryManager.init(), 100);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
};

initGalleryManager();

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('externalModule:ready', {
            detail: {
                name: 'galleryManager',
                version: '4.3.1',
                instance: window.galleryManager,
                configSource: 'centralized'
            }
        }));
    }, 200);
});

export class GalleryModule {
    constructor() {
        this.galleryManager = window.galleryManager;
    }

    async initialize(dependencies = {}) {
        if (!this.galleryManager) {
            window.galleryManager = new GalleryManager();
            this.galleryManager = window.galleryManager;
        }

        this.eventBus = dependencies.eventBus;
        this.config = dependencies.config || {};

        // Sačekaj da se DOM učita
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        this.galleryManager.init();
        this.isInitialized = true;

        return true;
    }

    open(imageIndex = 0) {
        if (this.galleryManager) {
            this.galleryManager.open(imageIndex);
        }
    }

    close() {
        if (this.galleryManager) {
            this.galleryManager.close();
        }
    }

    getState() {
        return this.galleryManager ? this.galleryManager.getState() : {
            initialized: false,
            configSource: 'centralized'
        };
    }

    destroy() {
        if (this.galleryManager) {
            this.galleryManager.destroy();
        }
        this.isInitialized = false;
    }
}

export default GalleryModule;