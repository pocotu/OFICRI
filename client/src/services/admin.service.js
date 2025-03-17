/**
 * Servicio de Administración
 * Maneja todas las operaciones relacionadas con la administración del sistema
 */

import { apiClient } from './apiClient.js';
import { sessionService } from './sessionService.js';
import { errorHandler } from '../utils/errorHandler.js';

export class AdminService {
    constructor() {
        this.baseUrl = '/api/admin';
    }

    /**
     * Obtiene todas las estadísticas del sistema
     * @returns {Promise<Object>} Estadísticas del sistema
     */
    async getSystemStats() {
        try {
            const response = await apiClient.get(`${this.baseUrl}/stats`);
            return response.data.stats;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al obtener estadísticas:', error);
            throw error;
        }
    }

    /**
     * Obtiene la configuración actual del sistema
     * @returns {Promise<Object>} Configuración del sistema
     */
    async getSystemConfig() {
        try {
            const response = await apiClient.get(`${this.baseUrl}/config`);
            return response.data.config;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al obtener configuración:', error);
            throw error;
        }
    }

    /**
     * Actualiza la configuración del sistema
     * @param {Object} config - Nueva configuración
     * @returns {Promise<Object>} Configuración actualizada
     */
    async updateSystemConfig(config) {
        try {
            const response = await apiClient.put(`${this.baseUrl}/config`, config);
            return response.data.config;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al actualizar configuración:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial de actividad del sistema
     * @param {Object} filters - Filtros para el historial
     * @returns {Promise<Array>} Historial de actividad
     */
    async getActivityHistory(filters = {}) {
        try {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }

            const response = await apiClient.get(`${this.baseUrl}/activity?${params.toString()}`);
            return response.data.history;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al obtener historial:', error);
            throw error;
        }
    }

    /**
     * Obtiene los logs del sistema
     * @param {Object} filters - Filtros para los logs
     * @returns {Promise<Array>} Logs del sistema
     */
    async getSystemLogs(filters = {}) {
        try {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }

            const response = await apiClient.get(`${this.baseUrl}/logs?${params.toString()}`);
            return response.data.logs;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al obtener logs:', error);
            throw error;
        }
    }

    /**
     * Realiza una copia de seguridad del sistema
     * @returns {Promise<Object>} Información de la copia de seguridad
     */
    async createBackup() {
        try {
            const response = await apiClient.post(`${this.baseUrl}/backup`);
            return response.data.backup;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al crear copia de seguridad:', error);
            throw error;
        }
    }

    /**
     * Restaura una copia de seguridad
     * @param {string} backupId - ID de la copia de seguridad
     * @returns {Promise<Object>} Resultado de la restauración
     */
    async restoreBackup(backupId) {
        try {
            const response = await apiClient.post(`${this.baseUrl}/backup/${backupId}/restore`);
            return response.data.restore;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al restaurar copia de seguridad:', error);
            throw error;
        }
    }

    /**
     * Obtiene las copias de seguridad disponibles
     * @returns {Promise<Array>} Lista de copias de seguridad
     */
    async getBackups() {
        try {
            const response = await apiClient.get(`${this.baseUrl}/backup`);
            return response.data.backups;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al obtener copias de seguridad:', error);
            throw error;
        }
    }

    /**
     * Elimina una copia de seguridad
     * @param {string} backupId - ID de la copia de seguridad
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async deleteBackup(backupId) {
        try {
            await apiClient.delete(`${this.baseUrl}/backup/${backupId}`);
            return true;
        } catch (error) {
            console.error('[ADMIN-SERVICE] Error al eliminar copia de seguridad:', error);
            throw error;
        }
    }
}

// Exportar instancia única
export const adminService = new AdminService();

// Exportar clase para pruebas
export default AdminService; 