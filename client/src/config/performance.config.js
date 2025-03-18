/**
 * Configuración de optimización de rendimiento
 * Este archivo contiene configuraciones y constantes para optimizar el rendimiento
 * de la aplicación siguiendo las mejores prácticas y requisitos de seguridad ISO 27001
 */

export const PERFORMANCE_CONFIG = {
    // Configuración de caché
    CACHE: {
        // Tiempo máximo de caché para documentos (en minutos)
        DOCUMENT_CACHE_TTL: 30,
        // Tiempo máximo de caché para listas (en minutos)
        LIST_CACHE_TTL: 15,
        // Tiempo máximo de caché para datos de usuario (en minutos)
        USER_CACHE_TTL: 60,
        // Tamaño máximo de caché (en MB)
        MAX_CACHE_SIZE: 50
    },

    // Configuración de paginación
    PAGINATION: {
        // Tamaño de página por defecto
        DEFAULT_PAGE_SIZE: 20,
        // Tamaño máximo de página permitido
        MAX_PAGE_SIZE: 100,
        // Tiempo de debounce para búsquedas (en ms)
        SEARCH_DEBOUNCE: 300
    },

    // Configuración de carga de recursos
    RESOURCES: {
        // Tamaño máximo de archivos adjuntos (en MB)
        MAX_ATTACHMENT_SIZE: 10,
        // Tipos de archivos permitidos
        ALLOWED_FILE_TYPES: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ],
        // Compresión de imágenes
        IMAGE_COMPRESSION: {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080
        }
    },

    // Configuración de rendimiento de red
    NETWORK: {
        // Tiempo máximo de espera para peticiones (en ms)
        REQUEST_TIMEOUT: 30000,
        // Número máximo de reintentos
        MAX_RETRIES: 3,
        // Tiempo entre reintentos (en ms)
        RETRY_DELAY: 1000,
        // Tamaño máximo de respuesta (en MB)
        MAX_RESPONSE_SIZE: 5
    },

    // Configuración de seguridad y rendimiento
    SECURITY: {
        // Tamaño máximo de datos encriptados (en MB)
        MAX_ENCRYPTED_SIZE: 2,
        // Tiempo máximo de sesión (en minutos)
        SESSION_TIMEOUT: 30,
        // Tiempo de expiración de tokens (en minutos)
        TOKEN_EXPIRY: 60,
        // Tamaño máximo de logs (en MB)
        MAX_LOG_SIZE: 100
    },

    // Configuración de optimización de DOM
    DOM: {
        // Tamaño máximo de elementos en listas virtuales
        VIRTUAL_LIST_SIZE: 100,
        // Tiempo de debounce para actualizaciones de UI (en ms)
        UI_UPDATE_DEBOUNCE: 100,
        // Tamaño máximo de elementos en caché de DOM
        DOM_CACHE_SIZE: 1000
    },

    // Configuración de monitoreo
    MONITORING: {
        // Intervalo de recolección de métricas (en ms)
        METRICS_INTERVAL: 60000,
        // Tamaño máximo de buffer de métricas
        METRICS_BUFFER_SIZE: 1000,
        // Umbral de rendimiento (en ms)
        PERFORMANCE_THRESHOLD: 200
    }
};

/**
 * Funciones de utilidad para optimización de rendimiento
 * IMPORTANTE: Esta es la implementación canónica de PerformanceUtils.
 * No duplicar esta clase en otras partes del código.
 */
export const PerformanceUtils = {
    /**
     * Limpia la caché según la configuración
     * @param {string} type - Tipo de caché a limpiar
     */
    clearCache(type) {
        const cacheKey = `cache_${type}`;
        const cacheData = localStorage.getItem(cacheKey);
        if (cacheData) {
            const { timestamp } = JSON.parse(cacheData);
            const ttl = PERFORMANCE_CONFIG.CACHE[`${type.toUpperCase()}_CACHE_TTL`];
            if (Date.now() - timestamp > ttl * 60000) {
                localStorage.removeItem(cacheKey);
            }
        }
    },

    /**
     * Optimiza el tamaño de una imagen
     * @param {File} file - Archivo de imagen
     * @returns {Promise<Blob>} - Imagen optimizada
     */
    async optimizeImage(file) {
        if (!PERFORMANCE_CONFIG.RESOURCES.ALLOWED_FILE_TYPES.includes(file.type)) {
            throw new Error('Tipo de archivo no permitido');
        }

        if (file.size > PERFORMANCE_CONFIG.RESOURCES.MAX_ATTACHMENT_SIZE * 1024 * 1024) {
            throw new Error('Archivo demasiado grande');
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                
                // Ajustar dimensiones según configuración
                if (width > PERFORMANCE_CONFIG.RESOURCES.IMAGE_COMPRESSION.maxWidth) {
                    height = (height * PERFORMANCE_CONFIG.RESOURCES.IMAGE_COMPRESSION.maxWidth) / width;
                    width = PERFORMANCE_CONFIG.RESOURCES.IMAGE_COMPRESSION.maxWidth;
                }
                
                if (height > PERFORMANCE_CONFIG.RESOURCES.IMAGE_COMPRESSION.maxHeight) {
                    width = (width * PERFORMANCE_CONFIG.RESOURCES.IMAGE_COMPRESSION.maxHeight) / height;
                    height = PERFORMANCE_CONFIG.RESOURCES.IMAGE_COMPRESSION.maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => resolve(blob),
                    file.type,
                    PERFORMANCE_CONFIG.RESOURCES.IMAGE_COMPRESSION.quality
                );
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Implementa paginación virtual para listas grandes
     * @param {Array} items - Lista completa de elementos
     * @param {number} pageSize - Tamaño de página
     * @param {number} currentPage - Página actual
     * @returns {Array} - Elementos de la página actual
     */
    getVirtualPage(items, pageSize, currentPage) {
        const start = currentPage * pageSize;
        return items.slice(start, start + pageSize);
    },

    /**
     * Implementa debounce para funciones
     * @param {Function} func - Función a debounce
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} - Función con debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Optimiza el rendimiento de una función con debounce
     * @param {Function} func - Función a optimizar
     * @param {string} type - Tipo de debounce
     * @returns {Function} - Función optimizada
     */
    optimizeFunction(func, type) {
        const wait = PERFORMANCE_CONFIG[type.toUpperCase()]?.DEBOUNCE || 
                    PERFORMANCE_CONFIG.PAGINATION.SEARCH_DEBOUNCE;
        return this.debounce(func, wait);
    },

    /**
     * Gestiona la caché de la aplicación
     * @param {string} key - Clave de caché
     * @param {Object} data - Datos a cachear
     * @param {string} type - Tipo de caché
     */
    manageCache(key, data, type) {
        const cacheData = {
            data,
            timestamp: Date.now()
        };

        localStorage.setItem(key, JSON.stringify(cacheData));
        this.clearCache(type);
    },

    /**
     * Crea una nueva instancia de monitoreo de rendimiento
     * @returns {PerformanceMonitor} - Nueva instancia de monitor
     */
    createMonitor() {
        return new PerformanceMonitor();
    }
};

/**
 * Clase para monitoreo de rendimiento
 * Esta clase complementa a PerformanceUtils y mantiene estado
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.startTime = Date.now();
        this.intervalId = null;
    }

    /**
     * Inicializa el monitoreo de rendimiento
     */
    initMonitoring() {
        if (this.intervalId) return;
        this.intervalId = setInterval(
            () => this.collectMetrics(), 
            PERFORMANCE_CONFIG.MONITORING.METRICS_INTERVAL
        );
    }

    /**
     * Detiene el monitoreo de rendimiento
     */
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Recolecta métricas de rendimiento
     */
    collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memory: window.performance.memory ? window.performance.memory.usedJSHeapSize : null,
            loadTime: window.performance.timing?.loadEventEnd - window.performance.timing?.navigationStart || 0,
            domContentLoaded: window.performance.timing?.domContentLoadedEventEnd - window.performance.timing?.navigationStart || 0
        };

        this.metrics.push(metrics);
        if (this.metrics.length > PERFORMANCE_CONFIG.MONITORING.METRICS_BUFFER_SIZE) {
            this.metrics.shift();
        }

        this.checkPerformanceThreshold(metrics);
    }

    /**
     * Verifica si se excede el umbral de rendimiento
     * @param {Object} metrics - Métricas actuales
     */
    checkPerformanceThreshold(metrics) {
        if (metrics.loadTime > PERFORMANCE_CONFIG.MONITORING.PERFORMANCE_THRESHOLD) {
            console.warn('Performance threshold exceeded:', metrics);
            // Aquí se podría implementar un sistema de notificación
        }
    }

    /**
     * Limpia recursos no utilizados
     */
    cleanup() {
        // Limpiar métricas antiguas
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
        this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    }

    /**
     * Obtiene estadísticas de rendimiento
     * @returns {Object} - Estadísticas de rendimiento
     */
    getPerformanceStats() {
        return {
            uptime: Date.now() - this.startTime,
            metricsCount: this.metrics.length,
            averageLoadTime: this.metrics.length > 0 
                ? this.metrics.reduce((acc, m) => acc + m.loadTime, 0) / this.metrics.length 
                : 0,
            memoryUsage: window.performance.memory ? window.performance.memory.usedJSHeapSize : null
        };
    }
} 