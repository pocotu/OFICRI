/**
 * Servicio de Usuario
 * Proporciona funciones para obtener y gestionar información del usuario
 */

import * as sessionManager from './sessionManager.js';

class UserService {
    constructor() {
        // Ajustamos la URL base según el estándar común para APIs REST
        this.baseUrl = '/api';
        // Flag para determinar si las APIs están disponibles
        this.apisDisponibles = false;
    }

    /**
     * Verifica si la respuesta es HTML en lugar de JSON
     * @param {string} text - El texto de la respuesta
     * @returns {boolean} - true si parece HTML, false en caso contrario
     */
    esHTML(text) {
        return text.trim().startsWith('<!DOCTYPE') || 
               text.trim().startsWith('<html') || 
               text.trim().includes('</html>');
    }

    /**
     * Verifica el estado de las APIs mediante un ping
     * @returns {Promise<boolean>} - true si las APIs están disponibles, false en caso contrario
     */
    async verificarAPIs() {
        try {
            // Intenta hacer una solicitud simple para verificar si las APIs existen
            const response = await fetch(`${this.baseUrl}/status`, { 
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            // Si obtenemos una respuesta JSON, asumimos que las APIs están disponibles
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                console.log('APIs disponibles');
                this.apisDisponibles = true;
                return true;
            }

            console.warn('APIs no disponibles o no devuelven JSON');
            this.apisDisponibles = false;
            return false;
        } catch (error) {
            console.warn('Error al verificar APIs:', error);
            this.apisDisponibles = false;
            return false;
        }
    }

    /**
     * Obtiene los datos completos del usuario actual desde el servidor
     * @returns {Promise<Object>} Datos completos del usuario
     */
    async getCurrentUserDetails() {
        try {
            const token = sessionManager.obtenerToken();
            const user = sessionManager.obtenerUsuarioActual();
            
            if (!token || !user) {
                throw new Error('No hay usuario autenticado');
            }

            // Verificar que el ID del usuario esté definido
            const userId = user.IDUsuario || user.id;
            if (!userId) {
                console.error("Estructura del objeto usuario:", JSON.stringify(user));
                throw new Error('El ID del usuario no está definido en la sesión');
            }
            
            console.log("Usando IDUsuario:", userId);
            
            // Si sabemos que las APIs no están disponibles, devolvemos directamente el usuario de sesión
            if (this.apisDisponibles === false) {
                return this.enriquecerUsuario(user);
            }
            
            // Intentamos obtener los datos del usuario
            try {
                // API GET /api/usuario/{id} - basada en la tabla Usuario de db.sql
                const response = await fetch(`${this.baseUrl}/usuario/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                // También probamos con usuarios (plural) como alternativa
                if (!response.ok) {
                    const alternativeResponse = await fetch(`${this.baseUrl}/usuarios/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!alternativeResponse.ok) {
                        // Si ninguna ruta funciona, usamos los datos de sesión
                        console.warn('APIs de usuario no disponibles');
                        this.apisDisponibles = false;
                        return this.enriquecerUsuario(user);
                    }
                    
                    // Intentamos procesar la respuesta alternativa
                    const respText = await alternativeResponse.text();
                    if (this.esHTML(respText)) {
                        console.warn('API devuelve HTML en lugar de JSON');
                        this.apisDisponibles = false;
                        return this.enriquecerUsuario(user);
                    }
                    
                    const userData = JSON.parse(respText);
                    return this.procesarRespuestaUsuario(userData);
                }
                
                // Procesamos la respuesta principal
                const respText = await response.text();
                if (this.esHTML(respText)) {
                    console.warn('API devuelve HTML en lugar de JSON');
                    this.apisDisponibles = false;
                    return this.enriquecerUsuario(user);
                }
                
                const userData = JSON.parse(respText);
                return this.procesarRespuestaUsuario(userData);
            } catch (error) {
                console.error('Error al procesar la respuesta:', error);
                this.apisDisponibles = false;
                return this.enriquecerUsuario(user);
            }
        } catch (error) {
            console.error('Error al obtener detalles del usuario:', error);
            return sessionManager.obtenerUsuarioActual();
        }
    }
    
    /**
     * Procesa diferentes formatos de respuesta de usuario
     * @param {Object} data - Datos de la respuesta
     * @returns {Object} - Datos del usuario normalizados
     */
    procesarRespuestaUsuario(data) {
        // Manejar diferentes formatos de respuesta posibles
        if (data.success && data.user) return data.user;
        if (data.usuario) return data.usuario;
        if (data.data) return data.data;
        return data;
    }
    
    /**
     * Enriquece el objeto usuario con datos predeterminados
     * @param {Object} user - Objeto usuario
     * @returns {Object} - Usuario enriquecido
     */
    enriquecerUsuario(user) {
        // Normalizar los datos del usuario según la estructura de la tabla Usuario en db.sql
        return {
            ...user,
            // Asegurar que tengamos las propiedades con nombres consistentes
            IDUsuario: user.IDUsuario || user.id,
            Nombres: user.Nombres || user.nombres,
            Apellidos: user.Apellidos || user.apellidos,
            Rango: user.Rango || user.rango,
            CodigoCIP: user.CodigoCIP || user.codigoCIP || user.cip,
            IDArea: user.IDArea || user.idArea || user.areaId,
            IDRol: user.IDRol || user.idRol || user.rolId,
            UltimoAcceso: user.UltimoAcceso || user.ultimoAcceso || new Date().toISOString()
        };
    }

    /**
     * Obtiene información del área a la que pertenece el usuario
     * @param {number} areaId - ID del área
     * @returns {Promise<Object>} Datos del área
     */
    async getUserAreaDetails(areaId) {
        try {
            const token = sessionManager.obtenerToken();
            
            if (!token) {
                throw new Error('No hay usuario autenticado');
            }

            if (!areaId) {
                throw new Error('ID de área no especificado');
            }
            
            // Si sabemos que las APIs no están disponibles, devolvemos directamente datos simulados
            if (this.apisDisponibles === false) {
                return this.obtenerAreaSimulada(areaId);
            }

            try {
                // API GET /api/area/{id} - basada en la tabla AreaEspecializada de db.sql
                const response = await fetch(`${this.baseUrl}/area/${areaId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                // También probamos con areas (plural) como alternativa
                if (!response.ok) {
                    const alternativeResponse = await fetch(`${this.baseUrl}/areas/${areaId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!alternativeResponse.ok) {
                        // Si ninguna ruta funciona, usamos datos simulados
                        console.warn('APIs de área no disponibles');
                        this.apisDisponibles = false;
                        return this.obtenerAreaSimulada(areaId);
                    }
                    
                    // Intentamos procesar la respuesta alternativa
                    const respText = await alternativeResponse.text();
                    if (this.esHTML(respText)) {
                        console.warn('API de área devuelve HTML en lugar de JSON');
                        this.apisDisponibles = false;
                        return this.obtenerAreaSimulada(areaId);
                    }
                    
                    return JSON.parse(respText);
                }
                
                // Procesamos la respuesta principal
                const respText = await response.text();
                if (this.esHTML(respText)) {
                    console.warn('API de área devuelve HTML en lugar de JSON');
                    this.apisDisponibles = false;
                    return this.obtenerAreaSimulada(areaId);
                }
                
                return JSON.parse(respText);
            } catch (error) {
                console.error('Error al obtener detalles del área:', error);
                return this.obtenerAreaSimulada(areaId);
            }
        } catch (error) {
            console.error('Error al obtener detalles del área:', error);
            return this.obtenerAreaSimulada(areaId);
        }
    }
    
    /**
     * Obtiene un área simulada según el ID
     * @param {number} areaId - ID del área
     * @returns {Object} - Datos simulados del área
     */
    obtenerAreaSimulada(areaId) {
        // Según la estructura de la tabla AreaEspecializada en db.sql
        return {
            IDArea: areaId,
            NombreArea: 'Área no disponible',
            CodigoIdentificacion: '',
            TipoArea: '',
            Descripcion: 'La información del área no pudo ser cargada.',
            IsActive: true
        };
    }

    /**
     * Obtiene información del rol del usuario
     * @param {number} rolId - ID del rol
     * @returns {Promise<Object>} Datos del rol
     */
    async getUserRoleDetails(rolId) {
        try {
            const token = sessionManager.obtenerToken();
            
            if (!token) {
                throw new Error('No hay usuario autenticado');
            }

            if (!rolId) {
                throw new Error('ID de rol no especificado');
            }
            
            // Si sabemos que las APIs no están disponibles, devolvemos directamente datos simulados
            if (this.apisDisponibles === false) {
                return this.obtenerRolSimulado(rolId);
            }

            try {
                // API GET /api/rol/{id} - basada en la tabla Rol de db.sql
                const response = await fetch(`${this.baseUrl}/rol/${rolId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                // También probamos con roles (plural) como alternativa
                if (!response.ok) {
                    const alternativeResponse = await fetch(`${this.baseUrl}/roles/${rolId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!alternativeResponse.ok) {
                        // Si ninguna ruta funciona, usamos datos simulados
                        console.warn('APIs de rol no disponibles');
                        this.apisDisponibles = false;
                        return this.obtenerRolSimulado(rolId);
                    }
                    
                    // Intentamos procesar la respuesta alternativa
                    const respText = await alternativeResponse.text();
                    if (this.esHTML(respText)) {
                        console.warn('API de rol devuelve HTML en lugar de JSON');
                        this.apisDisponibles = false;
                        return this.obtenerRolSimulado(rolId);
                    }
                    
                    return JSON.parse(respText);
                }
                
                // Procesamos la respuesta principal
                const respText = await response.text();
                if (this.esHTML(respText)) {
                    console.warn('API de rol devuelve HTML en lugar de JSON');
                    this.apisDisponibles = false;
                    return this.obtenerRolSimulado(rolId);
                }
                
                return JSON.parse(respText);
            } catch (error) {
                console.error('Error al obtener detalles del rol:', error);
                return this.obtenerRolSimulado(rolId);
            }
        } catch (error) {
            console.error('Error al obtener detalles del rol:', error);
            return this.obtenerRolSimulado(rolId);
        }
    }
    
    /**
     * Obtiene un rol simulado según el ID
     * @param {number} rolId - ID del rol
     * @returns {Object} - Datos simulados del rol
     */
    obtenerRolSimulado(rolId) {
        // Permisos según los bits definidos en la tabla Rol de db.sql
        const permisos = {
            CREAR: 1,      // bit 0: Crear (1)
            EDITAR: 2,     // bit 1: Editar (2)
            ELIMINAR: 4,   // bit 2: Eliminar (4)
            VER: 8,        // bit 3: Ver (8)
            DERIVAR: 16,   // bit 4: Derivar (16)
            AUDITAR: 32,   // bit 5: Auditar (32)
            EXPORTAR: 64,  // bit 6: Exportar (64)
            BLOQUEAR: 128  // bit 7: Bloquear (128)
        };
        
        // Diferentes roles según el ID
        let nombreRol = 'Rol no disponible';
        let descripcion = 'La información del rol no pudo ser cargada.';
        let permisoValue = 0;
        
        if (rolId === 1) {
            nombreRol = 'Administrador';
            descripcion = 'Acceso completo al sistema';
            permisoValue = 255; // Todos los permisos
        } else if (rolId === 2) {
            nombreRol = 'Operador';
            descripcion = 'Operaciones básicas del sistema';
            permisoValue = permisos.CREAR | permisos.EDITAR | permisos.VER | permisos.DERIVAR;
        } else if (rolId === 3) {
            nombreRol = 'Consulta';
            descripcion = 'Solo consulta de información';
            permisoValue = permisos.VER;
        }
        
        // Según la estructura de la tabla Rol en db.sql
        return {
            IDRol: rolId,
            NombreRol: nombreRol,
            Descripcion: descripcion,
            Permisos: permisoValue
        };
    }

    /**
     * Obtiene estadísticas de actividad del usuario basadas en sus documentos
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} Estadísticas de actividad
     */
    async getUserActivityStats(userId) {
        try {
            const token = sessionManager.obtenerToken();
            
            if (!token) {
                throw new Error('No hay usuario autenticado');
            }

            if (!userId) {
                throw new Error('ID de usuario no especificado para estadísticas');
            }

            // API GET /api/usuarios/{id}/estadisticas - basada en la tabla Documento
            const response = await fetch(`${this.baseUrl}/usuarios/${userId}/estadisticas`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('API de estadísticas no encontrada');
                    return null;
                }
                
                throw new Error(`Error del servidor: ${response.status}`);
            }

            // Verificar que la respuesta sea JSON válido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta no es JSON válido');
            }

            const statsData = await response.json();
            return statsData;
        } catch (error) {
            console.error('Error al obtener estadísticas del usuario:', error);
            // Devolver estadísticas vacías para evitar errores en la UI
            return {
                documentosCreados: 0,
                documentosProcesados: 0,
                documentosPendientes: 0
            };
        }
    }
}

export default new UserService(); 