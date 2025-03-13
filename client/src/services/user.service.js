/**
 * Servicio de Usuario
 * Proporciona funciones para obtener y gestionar información del usuario
 */

// Importamos directamente del archivo services para evitar dependencias circulares
import { sessionManager } from './services.js';
import * as errorHandler from '../utils/errorHandler.js';

class UserService {
    constructor() {
        // Ajustamos la URL base según el estándar común para APIs REST
        this.baseUrl = '/api';
        // Flag para determinar si las APIs están disponibles
        this.apisDisponibles = false;
        
        errorHandler.log('USER', 'Servicio de usuario inicializado', null, errorHandler.LOG_LEVEL.DEBUG);
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
            // Primero intentamos con el endpoint principal
            let response = await fetch(`${this.baseUrl}/status`, { 
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            // Si falla, intentamos con un endpoint alternativo
            if (!response.ok) {
                response = await fetch(`${this.baseUrl}/health`, { 
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
            }

            // Si ninguno funciona, intentamos con el endpoint de usuarios
            if (!response.ok) {
                response = await fetch(`${this.baseUrl}/usuarios`, { 
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
            }

            // Verificamos si la respuesta es válida
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && (contentType.includes('application/json') || contentType.includes('text/json'))) {
                    errorHandler.log('USER', 'APIs disponibles y funcionando', null, errorHandler.LOG_LEVEL.DEBUG);
                    this.apisDisponibles = true;
                    return true;
                }
            }

            // Si llegamos aquí, las APIs no están disponibles
            errorHandler.log('USER', 'APIs no disponibles o no devuelven JSON', null, errorHandler.LOG_LEVEL.WARN);
            this.apisDisponibles = false;
            return false;
        } catch (error) {
            errorHandler.handleError('USER', error, 'verificar APIs', false);
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
            const token = await sessionManager.obtenerToken();
            const user = await sessionManager.obtenerUsuarioActual();
            
            if (!token || !user) {
                throw new Error('No hay usuario autenticado');
            }

            // Verificar que el ID del usuario esté definido
            const userId = user.IDUsuario || user.id;
            if (!userId) {
                errorHandler.log('USER', 'Estructura del objeto usuario: ' + JSON.stringify(user), null, errorHandler.LOG_LEVEL.ERROR);
                throw new Error('El ID del usuario no está definido en la sesión');
            }
            
            errorHandler.log('USER', 'Usando IDUsuario: ' + userId, null, errorHandler.LOG_LEVEL.DEBUG);
            
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
                        errorHandler.log('USER', 'APIs de usuario no disponibles', null, errorHandler.LOG_LEVEL.WARN);
                        this.apisDisponibles = false;
                        return this.enriquecerUsuario(user);
                    }
                    
                    // Intentamos procesar la respuesta alternativa
                    const respText = await alternativeResponse.text();
                    if (this.esHTML(respText)) {
                        errorHandler.log('USER', 'API devuelve HTML en lugar de JSON', null, errorHandler.LOG_LEVEL.WARN);
                        this.apisDisponibles = false;
                        return this.enriquecerUsuario(user);
                    }
                    
                    const userData = JSON.parse(respText);
                    return this.procesarRespuestaUsuario(userData);
                }
                
                // Procesamos la respuesta principal
                const respText = await response.text();
                if (this.esHTML(respText)) {
                    errorHandler.log('USER', 'API devuelve HTML en lugar de JSON', null, errorHandler.LOG_LEVEL.WARN);
                    this.apisDisponibles = false;
                    return this.enriquecerUsuario(user);
                }
                
                const userData = JSON.parse(respText);
                return this.procesarRespuestaUsuario(userData);
            } catch (error) {
                errorHandler.handleError('USER', error, 'procesar respuesta de API', false);
                this.apisDisponibles = false;
                return this.enriquecerUsuario(user);
            }
        } catch (error) {
            errorHandler.handleError('USER', error, 'obtener detalles del usuario', false);
            return await sessionManager.obtenerUsuarioActual();
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
            Grado: user.Grado || user.grado,
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
            errorHandler.log('USER', `==== INICIO OBTENCIÓN ÁREA (ID: ${areaId}) ====`, null, errorHandler.LOG_LEVEL.DEBUG);
            
            const token = await sessionManager.obtenerToken();
            errorHandler.log('USER', `Token obtenido: ${token ? 'EXISTE' : 'NO EXISTE'}`, null, errorHandler.LOG_LEVEL.DEBUG);
            
            if (!token) {
                throw new Error('No hay usuario autenticado');
            }

            if (!areaId) {
                throw new Error('ID de área no especificado');
            }
            
            // Si sabemos que las APIs no están disponibles, devolvemos directamente datos simulados
            if (this.apisDisponibles === false) {
                errorHandler.log('USER', `APIs no disponibles, devolviendo área simulada`, null, errorHandler.LOG_LEVEL.WARN);
                return this.obtenerAreaSimulada(areaId);
            }

            try {
                // URL completa para facilitar la depuración
                const url = `${this.baseUrl}/areas/${areaId}`;
                errorHandler.log('USER', `Solicitando área a URL: ${url}`, null, errorHandler.LOG_LEVEL.DEBUG);
                
                // Mostrar headers completos
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };
                errorHandler.log('USER', `Headers: ${JSON.stringify(headers)}`, null, errorHandler.LOG_LEVEL.DEBUG);
                
                // Usar directamente la ruta correcta
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers
                });
                
                errorHandler.log('USER', `Respuesta recibida: ${response.status} ${response.statusText}`, null, errorHandler.LOG_LEVEL.DEBUG);
                
                if (!response.ok) {
                    errorHandler.log('USER', `Error al obtener área: ${response.status} ${response.statusText}`, null, errorHandler.LOG_LEVEL.WARN);
                    
                    // Intentar obtener más detalles del error
                    try {
                        const errorText = await response.text();
                        errorHandler.log('USER', `Detalles del error: ${errorText}`, null, errorHandler.LOG_LEVEL.WARN);
                    } catch (e) {
                        errorHandler.log('USER', `No se pudieron leer detalles del error`, null, errorHandler.LOG_LEVEL.WARN);
                    }
                    
                    this.apisDisponibles = false;
                    return this.obtenerAreaSimulada(areaId);
                }
                
                // Procesamos la respuesta
                const respText = await response.text();
                errorHandler.log('USER', `Texto de respuesta recibido: ${respText}`, null, errorHandler.LOG_LEVEL.DEBUG);
                
                if (this.esHTML(respText)) {
                    errorHandler.log('USER', 'API de área devuelve HTML en lugar de JSON', null, errorHandler.LOG_LEVEL.WARN);
                    this.apisDisponibles = false;
                    return this.obtenerAreaSimulada(areaId);
                }
                
                try {
                    const areaData = JSON.parse(respText);
                    errorHandler.log('USER', `Datos de área parseados: ${JSON.stringify(areaData)}`, null, errorHandler.LOG_LEVEL.DEBUG);
                    errorHandler.log('USER', `==== FIN OBTENCIÓN ÁREA (ÉXITO) ====`, null, errorHandler.LOG_LEVEL.DEBUG);
                    return areaData;
                } catch (parseError) {
                    errorHandler.log('USER', `Error al parsear JSON: ${parseError.message}`, null, errorHandler.LOG_LEVEL.ERROR);
                    this.apisDisponibles = false;
                    return this.obtenerAreaSimulada(areaId);
                }
            } catch (error) {
                errorHandler.log('USER', `Error en la petición: ${error.message}`, null, errorHandler.LOG_LEVEL.ERROR);
                errorHandler.handleError('USER', error, 'obtener detalles del área', false);
                return this.obtenerAreaSimulada(areaId);
            }
        } catch (error) {
            errorHandler.log('USER', `Error general: ${error.message}`, null, errorHandler.LOG_LEVEL.ERROR);
            errorHandler.handleError('USER', error, 'obtener detalles del área', false);
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
        errorHandler.log('USER', `Generando área simulada para ID: ${areaId}`, null, errorHandler.LOG_LEVEL.WARN);
        
        // Para depurar, devolvemos información sobre por qué estamos usando un área simulada
        const razon = this.apisDisponibles === false 
            ? "APIs marcadas como no disponibles" 
            : "Error al obtener datos del área";
        
        return {
            IDArea: areaId,
            NombreArea: `Área no disponible [${razon}]`,
            CodigoIdentificacion: `DEBUG-${Date.now()}`,
            TipoArea: 'SIMULADO',
            Descripcion: `La información del área no pudo ser cargada. 
                Posible causa: ${razon}. 
                ID solicitado: ${areaId}. 
                Timestamp: ${new Date().toISOString()}`,
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
            const token = await sessionManager.obtenerToken();
            
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
                        errorHandler.log('USER', 'APIs de rol no disponibles', null, errorHandler.LOG_LEVEL.WARN);
                        this.apisDisponibles = false;
                        return this.obtenerRolSimulado(rolId);
                    }
                    
                    // Intentamos procesar la respuesta alternativa
                    const respText = await alternativeResponse.text();
                    if (this.esHTML(respText)) {
                        errorHandler.log('USER', 'API de rol devuelve HTML en lugar de JSON', null, errorHandler.LOG_LEVEL.WARN);
                        this.apisDisponibles = false;
                        return this.obtenerRolSimulado(rolId);
                    }
                    
                    return JSON.parse(respText);
                }
                
                // Procesamos la respuesta principal
                const respText = await response.text();
                if (this.esHTML(respText)) {
                    errorHandler.log('USER', 'API de rol devuelve HTML en lugar de JSON', null, errorHandler.LOG_LEVEL.WARN);
                    this.apisDisponibles = false;
                    return this.obtenerRolSimulado(rolId);
                }
                
                return JSON.parse(respText);
            } catch (error) {
                errorHandler.handleError('USER', error, 'obtener detalles del rol', false);
                return this.obtenerRolSimulado(rolId);
            }
        } catch (error) {
            errorHandler.handleError('USER', error, 'obtener detalles del rol', false);
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
            const token = await sessionManager.obtenerToken();
            
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
                    errorHandler.log('USER', 'API de estadísticas no encontrada', null, errorHandler.LOG_LEVEL.WARN);
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
            errorHandler.handleError('USER', error, 'obtener estadísticas del usuario', false);
            // Devolver estadísticas vacías para evitar errores en la UI
            return {
                documentosCreados: 0,
                documentosProcesados: 0,
                documentosPendientes: 0
            };
        }
    }
}

// Crear una única instancia del servicio
const userService = new UserService();
export default userService; 