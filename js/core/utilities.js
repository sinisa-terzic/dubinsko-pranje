import { PERFORMANCE_CONFIG } from '../config/index.js';

export class Utilities {
    static throttle(func, limit = PERFORMANCE_CONFIG.throttleDelay) {
        let inThrottle;
        let lastResult;

        return function (...args) {
            if (!inThrottle) {
                lastResult = func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
            return lastResult;
        };
    }

    static debounce(func, wait = PERFORMANCE_CONFIG.debounceDelay, immediate = false) {
        let timeout;
        let result;

        return function (...args) {
            const context = this;
            const later = function () {
                timeout = null;
                if (!immediate) result = func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) result = func.apply(context, args);
            return result;
        };
    }

    static generateId(prefix = 'id') {
        return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static preloadImages(urls) {
        return Promise.all(
            urls.map(url => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                });
            })
        );
    }

    static isElementInViewport(el, offset = 0) {
        if (!el) return false;

        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.top >= -offset &&
            rect.left >= -offset &&
            rect.bottom <= (windowHeight + offset) &&
            rect.right <= (windowWidth + offset)
        );
    }

    static formatPrice(amount, currency = '€', decimals = 2) {
        const formattedAmount = parseFloat(amount).toFixed(decimals);
        return `${currency} ${formattedAmount}`;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static deepMerge(target, source) {
        const output = Object.assign({}, target);

        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }

        return output;
    }

    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    static createDeferred() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    }

    static async loadScript(src, attributes = {}) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;

            Object.entries(attributes).forEach(([key, value]) => {
                script.setAttribute(key, value);
            });

            script.onload = resolve;
            script.onerror = reject;

            document.head.appendChild(script);
        });
    }

    static async loadStylesheet(href, attributes = {}) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;

            Object.entries(attributes).forEach(([key, value]) => {
                link.setAttribute(key, value);
            });

            link.onload = resolve;
            link.onerror = reject;

            document.head.appendChild(link);
        });
    }

    static sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    static parseHTML(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return doc.body.firstChild;
    }

    static getScrollParent(element) {
        if (!element) return document.documentElement;

        let style = getComputedStyle(element);
        const excludeStaticParent = style.position === "absolute";
        const overflowRegex = /(auto|scroll)/;

        if (style.position === "fixed") return document.documentElement;

        for (let parent = element; (parent = parent.parentElement);) {
            style = getComputedStyle(parent);
            if (excludeStaticParent && style.position === "static") {
                continue;
            }
            if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
                return parent;
            }
        }

        return document.documentElement;
    }

    static animateValue(start, end, duration, onUpdate, easing = 'linear') {
        const startTime = performance.now();
        const change = end - start;

        const easingFunctions = {
            linear: t => t,
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        };

        const ease = easingFunctions[easing] || easingFunctions.linear;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = ease(progress);
            const currentValue = start + change * easedProgress;

            onUpdate(currentValue);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }
}