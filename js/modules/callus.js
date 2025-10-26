import { EventBus } from '../core/event-bus.js';

export class CallusModule {
    constructor() {
        this.callUsDialog = null;
        this.openCallUsBtn = null;
        this.closeCallUsBtn = null;
        this.phoneNumberBtn = null;
        this.callOptions = null;
        this.isCallUsOpen = false;
        this.isCallOptionsOpen = false;
        this.keydownHandler = null;
    }

    async initialize(dependencies = {}) {
        this.eventBus = dependencies.eventBus || EventBus;
        this.scrollManager = dependencies.scrollManager;
        this.config = dependencies.config || {};

        this.cacheDOMElements();
        this.bindEvents();
        this.checkStickyStatusOnLoad();

        this.scrollHandlerId = this.scrollManager.addHandler(() => {
            this.handleScroll();
        }, 1);

        this.emit('callus:ready');
    }

    handleScroll() {
        this.closeAll(); // Zatvori sve callus elemente pri skrolu
    }

    // OSTALE METODE OSTAJU ISTE...
    cacheDOMElements() {
        this.callUsDialog = document.querySelector('.callUs');
        this.openCallUsBtn = document.querySelector('.open-callUs');
        this.closeCallUsBtn = document.querySelector('.callUs-close');
        this.phoneNumberBtn = document.querySelector('.phone-number');
        this.callOptions = document.getElementById('callOptions');
    }

    bindEvents() {
        if (this.openCallUsBtn) {
            this.openCallUsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCallUs();
            });
        }

        if (this.closeCallUsBtn) {
            this.closeCallUsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeCallUs();
            });
        }

        if (this.phoneNumberBtn) {
            this.phoneNumberBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCallOptions();
            });
        }

        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        this.keydownHandler = (e) => this.handleKeydown(e);
        document.addEventListener('keydown', this.keydownHandler);

        this.eventBus.on('navigation:stickyEnabled', () => this.showCallUsButton());
        this.eventBus.on('navigation:stickyDisabled', () => this.hideCallUsButton());
        this.eventBus.on('callus:opened', () => this.closeCallOptions());

        // Dodano: Zatvori pri skrolu kada navigation emituje event
        this.eventBus.on('navigation:closeAllMenus', () => {
            this.closeAll();
        });
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.closeAll();
        }
    }

    closeAll() {
        if (this.isCallUsOpen) {
            this.closeCallUs();
        }
        if (this.isCallOptionsOpen) {
            this.closeCallOptions();
        }
    }

    toggleCallOptions() {
        if (this.isCallOptionsOpen) {
            this.closeCallOptions();
        } else {
            this.openCallOptions();
        }
    }

    openCallOptions() {
        if (!this.callOptions || this.isCallOptionsOpen) return;

        this.callOptions.classList.remove('hidden');
        this.isCallOptionsOpen = true;

        if (this.isCallUsOpen) {
            this.closeCallUs();
        }

        this.emit('callus:optionsOpened');
    }

    closeCallOptions() {
        if (!this.callOptions || !this.isCallOptionsOpen) return;

        this.callOptions.classList.add('hidden');
        this.isCallOptionsOpen = false;
        this.emit('callus:optionsClosed');
    }

    openCallUs() {
        if (!this.callUsDialog || this.isCallUsOpen) return;

        this.callUsDialog.classList.add('callUs-is-open');
        this.isCallUsOpen = true;
        this.hideCallUsButton();

        if (this.isCallOptionsOpen) {
            this.closeCallOptions();
        }

        this.emit('callus:opened');
    }

    closeCallUs() {
        if (!this.callUsDialog || !this.isCallUsOpen) return;

        this.callUsDialog.classList.remove('callUs-is-open');
        this.isCallUsOpen = false;

        const navigationModule = window.app?.getModule('navigation');
        if (navigationModule?.isSticky) {
            this.showCallUsButton();
        }

        this.emit('callus:closed');
    }

    handleOutsideClick(e) {
        if (this.isCallOptionsOpen &&
            !e.target.closest('.call-options') &&
            !e.target.closest('.phone-number')) {
            this.closeCallOptions();
        }

        if (this.isCallUsOpen &&
            !e.target.closest('.callUs') &&
            !e.target.closest('.open-callUs')) {
            this.closeCallUs();
        }
    }

    showCallUsButton() {
        if (this.openCallUsBtn && !this.isCallUsOpen) {
            this.openCallUsBtn.style.display = 'block';
        }
    }

    hideCallUsButton() {
        if (this.openCallUsBtn) {
            this.openCallUsBtn.style.display = 'none';
        }
    }

    checkStickyStatusOnLoad() {
        const navigationModule = window.app?.getModule('navigation');
        if (navigationModule?.isSticky) {
            this.showCallUsButton();
        } else {
            this.hideCallUsButton();
        }
    }

    emit(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    destroy() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.scrollHandlerId) {
            this.scrollManager.removeHandler(this.scrollHandlerId);
        }
    }
}