services / storage.js
/**
 * STORAGE SERVICE - UPRAVLJANJE LOCALSTORAGE I SESSIONSTORAGE
 * Jednostavan API za rad sa browser storage sa error handlingom
 */

export class StorageService {
    constructor() {
        // Prefix za sve ključeve (sprečava collision sa drugim aplikacijama)
        this.prefix = 'app_';
    }

    /**
     * ČUVA PODATAK U STORAGE
     * @param {string} key - Ključ podatka
     * @param {*} value - Vrijednost za čuvanje
     * @returns {boolean} - Uspješnost operacije
     */
    set(key, value) {
        try {
            // Serializacija vrijednosti
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * DOHVAĆA PODATAK IZ STORAGE-A
     * @param {string} key - Ključ podatka
     * @param {*} defaultValue - Default vrijednost ako podatak ne postoji
     * @returns {*} - Vrijednost ili defaultValue
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    /**
     * UKLANJA PODATAK IZ STORAGE-A
     * @param {string} key - Ključ podatka
     * @returns {boolean} - Uspješnost operacije
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * ČISTI SVE PODATKE APLIKACIJE IZ STORAGE-A
     * @returns {boolean} - Uspješnost operacije
     */
    clear() {
        try {
            // Uklanja samo ključeve koji počinju sa app_ prefixom
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * ČUVA PODATAK U SESSIONSTORAGE
     * @param {string} key - Ključ podatka
     * @param {*} value - Vrijednost za čuvanje
     * @returns {boolean} - Uspješnost operacije
     */
    setSession(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            sessionStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            console.error('Session storage set error:', error);
            return false;
        }
    }

    /**
     * DOHVAĆA PODATAK IZ SESSIONSTORAGE-A
     * @param {string} key - Ključ podatka
     * @param {*} defaultValue - Default vrijednost
     * @returns {*} - Vrijednost ili defaultValue
     */
    getSession(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Session storage get error:', error);
            return defaultValue;
        }
    }
}

// Export Singleton instance
export default new StorageService();