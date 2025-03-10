/**
 * Módulo de auditoría
 * Proporciona funciones modulares para la gestión de logs y auditoría del sistema
 */

import AuthService from '../services/auth.service.js';
import * as permissionUtils from '../utils/permissions.js';

// URL base para las operaciones de auditoría
const BASE_URL = '/api/audit';

/**
 * Obtiene los headers con el token de autenticación
 * @returns {Object} - Headers con el token de autenticación
 */
export const getAuthHeaders = () => {
    const token = AuthService.getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES DE LOGS DE USUARIOS
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene logs de usuarios
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getUserLogs = async (filters = {}) => {
    try {
        let url = `${BASE_URL}/users`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs de usuarios: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error('Error en getUserLogs:', error);
        throw error;
    }
};

/**
 * Obtiene logs de un usuario específico
 * @param {number} userId - ID del usuario
 * @param {Object} filters - Filtros adicionales (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getLogsByUserId = async (userId, filters = {}) => {
    try {
        let url = `${BASE_URL}/users/${userId}`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs del usuario: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error(`Error en getLogsByUserId (ID: ${userId}):`, error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES DE LOGS DE DOCUMENTOS
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene logs de documentos
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getDocumentLogs = async (filters = {}) => {
    try {
        let url = `${BASE_URL}/documents`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs de documentos: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error('Error en getDocumentLogs:', error);
        throw error;
    }
};

/**
 * Obtiene logs de un documento específico
 * @param {number} documentId - ID del documento
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getLogsByDocumentId = async (documentId) => {
    try {
        const response = await fetch(`${BASE_URL}/documents/${documentId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs del documento: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error(`Error en getLogsByDocumentId (ID: ${documentId}):`, error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES DE LOGS DE ÁREAS
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene logs de áreas
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getAreaLogs = async (filters = {}) => {
    try {
        let url = `${BASE_URL}/areas`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs de áreas: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error('Error en getAreaLogs:', error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES DE LOGS DE ROLES Y PERMISOS
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene logs de roles
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getRoleLogs = async (filters = {}) => {
    try {
        let url = `${BASE_URL}/roles`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs de roles: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error('Error en getRoleLogs:', error);
        throw error;
    }
};

/**
 * Obtiene logs de permisos
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getPermissionLogs = async (filters = {}) => {
    try {
        let url = `${BASE_URL}/permissions`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs de permisos: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error('Error en getPermissionLogs:', error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES DE LOGS DE MESA DE PARTES
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene logs de mesa de partes
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de logs
 */
export const getMesaPartesLogs = async (filters = {}) => {
    try {
        let url = `${BASE_URL}/mesa-partes`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener logs de mesa de partes: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.logs || [];
    } catch (error) {
        console.error('Error en getMesaPartesLogs:', error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES DE EXPORTACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Exporta logs de usuarios a un archivo
 * @param {Object} filters - Filtros para los logs a exportar
 * @param {string} format - Formato de exportación ('pdf', 'excel', etc.)
 * @returns {Promise<Blob>} - Promesa que resuelve al blob con los datos exportados
 */
export const exportUserLogs = async (filters = {}, format = 'pdf') => {
    try {
        let url = `${BASE_URL}/export/users?format=${format}`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `&${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
                'Accept': 'application/octet-stream'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al exportar logs de usuarios: ${response.statusText}`);
        }
        
        return await response.blob();
    } catch (error) {
        console.error('Error en exportUserLogs:', error);
        throw error;
    }
};

/**
 * Exporta logs de documentos a un archivo
 * @param {Object} filters - Filtros para los logs a exportar
 * @param {string} format - Formato de exportación ('pdf', 'excel', etc.)
 * @returns {Promise<Blob>} - Promesa que resuelve al blob con los datos exportados
 */
export const exportDocumentLogs = async (filters = {}, format = 'pdf') => {
    try {
        let url = `${BASE_URL}/export/documents?format=${format}`;
        
        // Agregar filtros a la URL si existen
        if (Object.keys(filters).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `&${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
                'Accept': 'application/octet-stream'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al exportar logs de documentos: ${response.statusText}`);
        }
        
        return await response.blob();
    } catch (error) {
        console.error('Error en exportDocumentLogs:', error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE INTERFAZ DE USUARIO
// ════════════════════════════════════════════════════════════════

/**
 * Genera el HTML para la tabla de logs de usuarios
 * @param {Array} logs - Array de logs
 * @returns {string} - HTML para la tabla de logs
 */
export const renderUserLogsTable = (logs) => {
    let html = `
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Usuario</th>
                <th>Tipo de Evento</th>
                <th>Fecha y Hora</th>
                <th>IP Origen</th>
                <th>Estado</th>
                <th>Detalles</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    if (logs.length === 0) {
        html += `
            <tr>
                <td colspan="6" class="text-center">No hay logs disponibles</td>
            </tr>
        `;
    } else {
        logs.forEach(log => {
            const fecha = new Date(log.FechaEvento).toLocaleString();
            
            html += `
            <tr>
                <td>${log.NombreUsuario || 'Sistema'} ${log.ApellidoUsuario || ''}</td>
                <td>${log.TipoEvento}</td>
                <td>${fecha}</td>
                <td>${log.IPOrigen || '-'}</td>
                <td>
                    <span class="badge bg-${log.Exitoso ? 'success' : 'danger'}">
                        ${log.Exitoso ? 'Exitoso' : 'Fallido'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" 
                            data-bs-toggle="tooltip" 
                            title="${log.DispositivoInfo || 'Sin detalles'}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            </tr>
            `;
        });
    }
    
    html += `
        </tbody>
    </table>
    `;
    
    return html;
};

/**
 * Genera el HTML para la tabla de logs de documentos
 * @param {Array} logs - Array de logs
 * @returns {string} - HTML para la tabla de logs
 */
export const renderDocumentLogsTable = (logs) => {
    let html = `
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Documento</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Fecha y Hora</th>
                <th>IP Origen</th>
                <th>Detalles</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    if (logs.length === 0) {
        html += `
            <tr>
                <td colspan="6" class="text-center">No hay logs disponibles</td>
            </tr>
        `;
    } else {
        logs.forEach(log => {
            const fecha = new Date(log.FechaEvento).toLocaleString();
            
            html += `
            <tr>
                <td>${log.NroRegistro || log.IDDocumento}</td>
                <td>${log.NombreUsuario} ${log.ApellidoUsuario || ''}</td>
                <td>${log.TipoAccion}</td>
                <td>${fecha}</td>
                <td>${log.IPOrigen || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info view-log-details" 
                            data-details="${log.DetallesAccion ? log.DetallesAccion.replace(/"/g, '&quot;') : ''}"
                            data-bs-toggle="modal" 
                            data-bs-target="#log-details-modal">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
            `;
        });
    }
    
    html += `
        </tbody>
    </table>
    `;
    
    return html;
};

/**
 * Genera el HTML para la tabla de logs de áreas
 * @param {Array} logs - Array de logs
 * @returns {string} - HTML para la tabla de logs
 */
export const renderAreaLogsTable = (logs) => {
    let html = `
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Área</th>
                <th>Usuario</th>
                <th>Tipo de Evento</th>
                <th>Fecha y Hora</th>
                <th>Detalles</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    if (logs.length === 0) {
        html += `
            <tr>
                <td colspan="5" class="text-center">No hay logs disponibles</td>
            </tr>
        `;
    } else {
        logs.forEach(log => {
            const fecha = new Date(log.FechaEvento).toLocaleString();
            
            html += `
            <tr>
                <td>${log.NombreArea || log.IDArea}</td>
                <td>${log.NombreUsuario || 'Sistema'} ${log.ApellidoUsuario || ''}</td>
                <td>${log.TipoEvento}</td>
                <td>${fecha}</td>
                <td>${log.Detalles || '-'}</td>
            </tr>
            `;
        });
    }
    
    html += `
        </tbody>
    </table>
    `;
    
    return html;
};

/**
 * Genera el HTML para la tabla de logs de roles
 * @param {Array} logs - Array de logs
 * @returns {string} - HTML para la tabla de logs
 */
export const renderRoleLogsTable = (logs) => {
    let html = `
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Rol</th>
                <th>Usuario</th>
                <th>Tipo de Evento</th>
                <th>Fecha y Hora</th>
                <th>Detalles</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    if (logs.length === 0) {
        html += `
            <tr>
                <td colspan="5" class="text-center">No hay logs disponibles</td>
            </tr>
        `;
    } else {
        logs.forEach(log => {
            const fecha = new Date(log.FechaEvento).toLocaleString();
            
            html += `
            <tr>
                <td>${log.NombreRol || log.IDRol}</td>
                <td>${log.NombreUsuario || 'Sistema'} ${log.ApellidoUsuario || ''}</td>
                <td>${log.TipoEvento}</td>
                <td>${fecha}</td>
                <td>${log.Detalles || '-'}</td>
            </tr>
            `;
        });
    }
    
    html += `
        </tbody>
    </table>
    `;
    
    return html;
};

/**
 * Genera el formulario de filtros para logs
 * @param {string} tipo - Tipo de logs ('usuarios', 'documentos', etc.)
 * @returns {string} - HTML del formulario de filtros
 */
export const renderLogsFilterForm = (tipo) => {
    let tipoPlural = '';
    let opcionesAdicionales = '';
    
    switch (tipo) {
        case 'usuario':
            tipoPlural = 'usuarios';
            opcionesAdicionales = `
            <div class="mb-3">
                <label for="tipo-evento-usuario" class="form-label">Tipo de Evento</label>
                <select class="form-select" id="tipo-evento-usuario">
                    <option value="">Todos</option>
                    <option value="LOGIN">Inicio de sesión</option>
                    <option value="LOGOUT">Cierre de sesión</option>
                    <option value="PASSWORD_CHANGE">Cambio de contraseña</option>
                    <option value="ACCOUNT_LOCKED">Cuenta bloqueada</option>
                    <option value="ACCOUNT_UNLOCKED">Cuenta desbloqueada</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="exitoso" class="form-label">Estado</label>
                <select class="form-select" id="exitoso">
                    <option value="">Todos</option>
                    <option value="true">Exitoso</option>
                    <option value="false">Fallido</option>
                </select>
            </div>
            `;
            break;
            
        case 'documento':
            tipoPlural = 'documentos';
            opcionesAdicionales = `
            <div class="mb-3">
                <label for="tipo-accion" class="form-label">Tipo de Acción</label>
                <select class="form-select" id="tipo-accion">
                    <option value="">Todas</option>
                    <option value="CREACION">Creación</option>
                    <option value="EDICION">Edición</option>
                    <option value="ELIMINACION">Eliminación</option>
                    <option value="DERIVACION">Derivación</option>
                    <option value="VISUALIZACION">Visualización</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="nro-registro" class="form-label">Nro. Registro</label>
                <input type="text" class="form-control" id="nro-registro">
            </div>
            `;
            break;
            
        case 'area':
            tipoPlural = 'áreas';
            opcionesAdicionales = `
            <div class="mb-3">
                <label for="id-area" class="form-label">Área</label>
                <select class="form-select" id="id-area">
                    <option value="">Todas</option>
                    <!-- Las opciones se cargarán dinámicamente -->
                </select>
            </div>
            `;
            break;
            
        case 'rol':
            tipoPlural = 'roles';
            break;
            
        case 'permiso':
            tipoPlural = 'permisos';
            break;
            
        case 'mesaPartes':
            tipoPlural = 'mesa de partes';
            break;
    }
    
    return `
    <form id="filter-logs-form" class="mb-4">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Filtrar logs de ${tipoPlural}</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="fecha-inicio" class="form-label">Fecha Inicio</label>
                            <input type="date" class="form-control" id="fecha-inicio">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="fecha-fin" class="form-label">Fecha Fin</label>
                            <input type="date" class="form-control" id="fecha-fin">
                        </div>
                    </div>
                </div>
                
                ${opcionesAdicionales}
                
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" onclick="auditModule.resetFilters()">
                        <i class="fas fa-sync-alt"></i> Reiniciar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-search"></i> Filtrar
                    </button>
                    <button type="button" class="btn btn-success ms-2" onclick="auditModule.exportLogs('${tipo}')">
                        <i class="fas fa-file-export"></i> Exportar
                    </button>
                </div>
            </div>
        </div>
    </form>
    `;
};

/**
 * Genera el HTML para el modal de detalles de log
 * @returns {string} - HTML del modal
 */
export const renderLogDetailsModal = () => {
    return `
    <div class="modal fade" id="log-details-modal" tabindex="-1" aria-labelledby="log-details-modal-label" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="log-details-modal-label">Detalles del Log</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <pre id="log-details-content" class="p-3 bg-light rounded"></pre>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>
    `;
};

/**
 * Verifica los permisos del usuario para mostrar/ocultar elementos de la interfaz
 * @param {Object} user - Usuario actual
 * @returns {boolean} - true si tiene permiso para auditar, false en caso contrario
 */
export const canUserAudit = (user) => {
    if (!user) return false;
    
    const permissions = permissionUtils.getRolePermissions(user.IDRol);
    return permissionUtils.canAudit(permissions);
}; 