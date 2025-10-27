import { EventBus } from './event-bus.js';
import { ScrollManager } from './scroll-manager.js';
import { MODULES_CONFIG, PERFORMANCE_CONFIG } from '../config/index.js';

export class App {
    constructor() {
        this.modules = new Map();
        this.isInitialized = false;
        this.eventBus = EventBus;
        this.scrollManager = new ScrollManager();
        this.performance = PERFORMANCE_CONFIG;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            this.emit('app:initializing');

            // Inicijalizuj core sisteme
            await this.initCore();

            // Inicijalizuj module sa poboljšanom sinhronizacijom
            await this.initModules();

            this.isInitialized = true;
            this.emit('app:ready');

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.emit('app:error', { error });
            throw error;
        }
    }

    async initCore() {
        // Core sistemi koji moraju biti prvi
        this.emit('app:coreReady');
    }

    async initModules() {
        // POBOLJŠAN REDOSLJED - LOADER PRVI
        const moduleOrder = [
            'loader',      // PRVI - loader mora biti prvi
            'language',    // Drugi - kritičan za ostale module
            'navigation',  // Treći - navigacija
            'gallery',     // Četvrti
            'callus',      // Peti  
            'partners',    // Šesti
            'contact',     // Sedmi - zavisi od language modula
            'pricing'      // Osmi - zavisi od language modula
        ];

        // Učitaj module po definisanom redoslijedu
        for (const moduleName of moduleOrder) {
            const config = MODULES_CONFIG[moduleName];
            if (config && config.enabled) {
                try {
                    await this.loadModule(moduleName, config);

                    // Sačekaj da se modul potpuno inicijalizuje
                    const moduleInstance = this.modules.get(moduleName);
                    if (moduleInstance && typeof moduleInstance.waitForReady === 'function') {
                        await moduleInstance.waitForReady();
                    }

                    console.log(`✅ Module ${moduleName} fully ready`);

                } catch (error) {
                    console.error(`❌ Failed to load module ${moduleName}:`, error);

                    // Ako je kritičan modul, baci grešku
                    if (moduleName === 'loader' || moduleName === 'language') {
                        throw error;
                    }
                }
            }
        }

        this.emit('app:modulesReady');
    }

    async loadModule(moduleName, config) {
        try {
            const modulePath = `../modules/${moduleName}.js`;
            const module = await import(modulePath);

            // Pronađi klasu modula (podržava različite naming konvencije)
            const ModuleClass = module[`${this.capitalize(moduleName)}Module`] ||
                module[moduleName] ||
                module.default;

            if (!ModuleClass) {
                throw new Error(`Module class not found for ${moduleName}`);
            }

            const moduleInstance = new ModuleClass();
            this.modules.set(moduleName, moduleInstance);

            // Inicijalizuj modul sa dependencies
            await moduleInstance.initialize({
                eventBus: this.eventBus,
                scrollManager: this.scrollManager,
                config: config.options
            });

            this.emit('module:loaded', { moduleName, instance: moduleInstance });
            console.log(`✅ Module loaded: ${moduleName}`);

            return moduleInstance;

        } catch (error) {
            console.error(`❌ Failed to load module ${moduleName}:`, error);
            this.emit('module:error', { moduleName, error });
            throw error;
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getModule(moduleName) {
        return this.modules.get(moduleName);
    }

    hasModule(moduleName) {
        return this.modules.has(moduleName);
    }

    emit(event, data) {
        this.eventBus.emit(event, data);
    }

    on(event, callback) {
        return this.eventBus.on(event, callback);
    }

    start() {
        this.emit('app:start');
        document.documentElement.classList.add('app-loaded');
    }

    async destroy() {
        // Uništi module u obrnutom redoslijedu
        const modulesArray = Array.from(this.modules.entries());

        for (let i = modulesArray.length - 1; i >= 0; i--) {
            const [moduleName, module] = modulesArray[i];
            try {
                if (typeof module.destroy === 'function') {
                    await module.destroy();
                }
            } catch (error) {
                console.error(`Error destroying module ${moduleName}:`, error);
            }
        }

        this.scrollManager.destroy();
        this.modules.clear();
        this.isInitialized = false;
        this.emit('app:destroyed');
    }

    // Utility metode za debug
    getModuleStatus() {
        const status = {};
        for (const [name, module] of this.modules) {
            status[name] = {
                initialized: module.isInitialized,
                exists: true
            };
        }
        return status;
    }

    getPerformanceMetrics() {
        return {
            totalModules: this.modules.size,
            initializedModules: Array.from(this.modules.values())
                .filter(module => module.isInitialized).length,
            performanceConfig: this.performance
        };
    }
}