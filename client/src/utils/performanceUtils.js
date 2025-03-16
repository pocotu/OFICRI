import { PERFORMANCE_CONFIG, PerformanceUtils as ConfigUtils } from '../config/performance.config';

/**
 * Utilidades para optimización de rendimiento
 * Implementa funciones para mejorar el rendimiento de la aplicación
 */

export class PerformanceUtils {
    constructor() {
        this.metrics = [];
        this.startTime = Date.now();
    }

    /**
     * Inicializa el monitoreo de rendimiento
     */
    initMonitoring() {
        setInterval(() => this.collectMetrics(), PERFORMANCE_CONFIG.MONITORING.METRICS_INTERVAL);
    }

    /**
     * Recolecta métricas de rendimiento
     */
    collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memory: window.performance.memory ? window.performance.memory.usedJSHeapSize : null,
            loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
            domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart
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
     * Optimiza el rendimiento de una lista grande
     * @param {Array} items - Lista de elementos
     * @param {number} pageSize - Tamaño de página
     * @param {number} currentPage - Página actual
     * @returns {Array} - Elementos optimizados
     */
    optimizeList(items, pageSize, currentPage) {
        return ConfigUtils.getVirtualPage(items, pageSize, currentPage);
    }

    /**
     * Optimiza el rendimiento de una función con debounce
     * @param {Function} func - Función a optimizar
     * @param {string} type - Tipo de debounce
     * @returns {Function} - Función optimizada
     */
    optimizeFunction(func, type) {
        const wait = PERFORMANCE_CONFIG[type.toUpperCase()].DEBOUNCE || 
                    PERFORMANCE_CONFIG.PAGINATION.SEARCH_DEBOUNCE;
        return ConfigUtils.debounce(func, wait);
    }

    /**
     * Optimiza el rendimiento de imágenes
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

        return ConfigUtils.optimizeImage(file);
    }

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
        ConfigUtils.clearCache(type);
    }

    /**
     * Limpia recursos no utilizados
     */
    cleanup() {
        // Limpiar caché expirada
        Object.keys(PERFORMANCE_CONFIG.CACHE).forEach(type => {
            ConfigUtils.clearCache(type);
        });

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
            averageLoadTime: this.metrics.reduce((acc, m) => acc + m.loadTime, 0) / this.metrics.length,
            memoryUsage: window.performance.memory ? window.performance.memory.usedJSHeapSize : null
        };
    }
} 