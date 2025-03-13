/**
 * Servicios de metadatos para el módulo de usuarios
 * Funciones para obtener información de metadatos como áreas y roles
 */

import { getAuthHeaders } from './apiService.js';

/**
 * Obtiene todas las áreas disponibles
 * @returns {Promise<Array>} Lista de áreas
 */
export const getAllAreas = async () => {
    try {
        console.log('[USER-MODULE] Obteniendo todas las áreas...');
        
        const response = await fetch('/api/areas', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener áreas: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Procesar diferentes formatos de respuesta
        let areas = [];
        
        if (data.areas && Array.isArray(data.areas)) {
            areas = data.areas;
        } else if (data.data && Array.isArray(data.data)) {
            areas = data.data;
        } else if (data.results && Array.isArray(data.results)) {
            areas = data.results;
        } else if (Array.isArray(data)) {
            areas = data;
        } else {
            console.error('[USER-MODULE] No se pudo encontrar un array de áreas en los datos recibidos');
            console.log('[USER-MODULE] Estructura de datos:', JSON.stringify(data).substring(0, 200) + '...');
            
            // Datos de prueba en caso de error
            areas = [
                { 
                    IDArea: 1, 
                    NombreArea: 'Administración',
                    CodigoIdentificacion: 'ADMIN',
                    TipoArea: 'ADMIN',
                    Descripcion: 'Área administrativa del sistema',
                    IsActive: true
                },
                { 
                    IDArea: 2, 
                    NombreArea: 'Mesa de Partes',
                    CodigoIdentificacion: 'MP',
                    TipoArea: 'OPERATIVO',
                    Descripcion: 'Recepción y gestión de documentos',
                    IsActive: true
                },
                { 
                    IDArea: 3, 
                    NombreArea: 'Química y Toxicología',
                    CodigoIdentificacion: 'QT',
                    TipoArea: 'ESPECIALIZADO',
                    Descripcion: 'Análisis químico y toxicológico',
                    IsActive: true
                }
            ];
        }
        
        console.log('[USER-MODULE] Áreas procesadas:', areas.length);
        return areas;
    } catch (error) {
        console.error('[USER-MODULE] Error al obtener áreas:', error);
        
        // Datos de respaldo en caso de error
        return [
            { IDArea: 1, NombreArea: 'Administración' },
            { IDArea: 2, NombreArea: 'Mesa de Partes' }
        ];
    }
};

/**
 * Obtiene todos los roles disponibles
 * @returns {Promise<Array>} Lista de roles
 */
export const getAllRoles = async () => {
    try {
        console.log('[USER-MODULE] Obteniendo todos los roles...');
        
        const response = await fetch('/api/roles', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener roles: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Procesar diferentes formatos de respuesta
        let roles = [];
        
        if (data.roles && Array.isArray(data.roles)) {
            roles = data.roles;
        } else if (data.data && Array.isArray(data.data)) {
            roles = data.data;
        } else if (data.results && Array.isArray(data.results)) {
            roles = data.results;
        } else if (Array.isArray(data)) {
            roles = data;
        } else {
            console.error('[USER-MODULE] No se pudo encontrar un array de roles en los datos recibidos');
            console.log('[USER-MODULE] Estructura de datos:', JSON.stringify(data).substring(0, 200) + '...');
            
            // Datos de prueba en caso de error
            roles = [
                { 
                    IDRol: 1, 
                    NombreRol: 'Administrador',
                    Descripcion: 'Control total del sistema',
                    Permisos: 255 // Todos los permisos (11111111 en binario)
                },
                { 
                    IDRol: 2, 
                    NombreRol: 'Mesa de Partes',
                    Descripcion: 'Gestión de documentos entrantes y salientes',
                    Permisos: 91 // Bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
                },
                { 
                    IDRol: 3, 
                    NombreRol: 'Responsable de Área',
                    Descripcion: 'Responsable de un área especializada',
                    Permisos: 91 // Bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
                }
            ];
        }
        
        console.log('[USER-MODULE] Roles procesados:', roles.length);
        return roles;
    } catch (error) {
        console.error('[USER-MODULE] Error al obtener roles:', error);
        
        // Datos de respaldo en caso de error
        return [
            { IDRol: 1, NombreRol: 'Administrador' },
            { IDRol: 2, NombreRol: 'Usuario' }
        ];
    }
}; 