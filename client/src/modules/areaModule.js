/**
 * Módulo de gestión de áreas
 * Proporciona funciones modulares para la gestión de áreas especializadas (CRUD)
 */

import AuthService from '../services/auth.service.js';
import * as permissionUtils from '../utils/permissions.js';

// URL base para las operaciones de áreas
const BASE_URL = '/api/areas';

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
// OPERACIONES CRUD BÁSICAS
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene todas las áreas
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de áreas
 */
export const getAllAreas = async (filters = {}) => {
    try {
        let url = BASE_URL;
        
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
            throw new Error(`Error al obtener áreas: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.areas || [];
    } catch (error) {
        console.error('Error en getAllAreas:', error);
        throw error;
    }
};

/**
 * Obtiene un área por su ID
 * @param {number} areaId - ID del área
 * @returns {Promise<Object>} - Promesa que resuelve al área
 */
export const getAreaById = async (areaId) => {
    try {
        const response = await fetch(`${BASE_URL}/${areaId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener área: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.area || null;
    } catch (error) {
        console.error(`Error en getAreaById (ID: ${areaId}):`, error);
        throw error;
    }
};

/**
 * Crea una nueva área
 * @param {Object} areaData - Datos del área a crear
 * @returns {Promise<Object>} - Promesa que resuelve al área creada
 */
export const createArea = async (areaData) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(areaData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al crear área: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.area || null;
    } catch (error) {
        console.error('Error en createArea:', error);
        throw error;
    }
};

/**
 * Actualiza un área existente
 * @param {number} areaId - ID del área a actualizar
 * @param {Object} areaData - Datos actualizados del área
 * @returns {Promise<Object>} - Promesa que resuelve al área actualizada
 */
export const updateArea = async (areaId, areaData) => {
    try {
        const response = await fetch(`${BASE_URL}/${areaId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(areaData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al actualizar área: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.area || null;
    } catch (error) {
        console.error(`Error en updateArea (ID: ${areaId}):`, error);
        throw error;
    }
};

/**
 * Elimina un área
 * @param {number} areaId - ID del área a eliminar
 * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
 */
export const deleteArea = async (areaId) => {
    try {
        const response = await fetch(`${BASE_URL}/${areaId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al eliminar área: ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Error en deleteArea (ID: ${areaId}):`, error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES ESPECÍFICAS DE ÁREAS
// ════════════════════════════════════════════════════════════════

/**
 * Obtiene las áreas activas
 * @returns {Promise<Array>} - Promesa que resuelve a un array de áreas activas
 */
export const getActiveAreas = async () => {
    return getAllAreas({ isActive: true });
};

/**
 * Obtiene los documentos de un área específica
 * @param {number} areaId - ID del área
 * @returns {Promise<Array>} - Promesa que resuelve a un array de documentos
 */
export const getDocumentsByArea = async (areaId) => {
    try {
        const response = await fetch(`${BASE_URL}/${areaId}/documents`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener documentos del área: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.documents || [];
    } catch (error) {
        console.error(`Error en getDocumentsByArea (ID: ${areaId}):`, error);
        throw error;
    }
};

/**
 * Obtiene el historial de un área específica
 * @param {number} areaId - ID del área
 * @returns {Promise<Array>} - Promesa que resuelve a un array con el historial del área
 */
export const getAreaHistory = async (areaId) => {
    try {
        const response = await fetch(`${BASE_URL}/${areaId}/history`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener historial del área: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error(`Error en getAreaHistory (ID: ${areaId}):`, error);
        throw error;
    }
};

/**
 * Obtiene estadísticas de un área específica
 * @param {number} areaId - ID del área
 * @returns {Promise<Object>} - Promesa que resuelve a un objeto con estadísticas
 */
export const getAreaStats = async (areaId) => {
    try {
        const response = await fetch(`${BASE_URL}/${areaId}/stats`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener estadísticas del área: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.stats || {};
    } catch (error) {
        console.error(`Error en getAreaStats (ID: ${areaId}):`, error);
        throw error;
    }
};

/**
 * Exporta datos de un área específica
 * @param {number} areaId - ID del área
 * @param {Object} options - Opciones de exportación
 * @returns {Promise<Blob>} - Promesa que resuelve al blob con los datos exportados
 */
export const exportAreaData = async (areaId, options = {}) => {
    try {
        let url = `${BASE_URL}/${areaId}/export`;
        
        // Agregar opciones a la URL si existen
        if (Object.keys(options).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(options)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
                'Accept': 'application/octet-stream'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error al exportar datos del área: ${response.statusText}`);
        }
        
        return await response.blob();
    } catch (error) {
        console.error(`Error en exportAreaData (ID: ${areaId}):`, error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE INTERFAZ DE USUARIO
// ════════════════════════════════════════════════════════════════

/**
 * Genera el HTML para la tabla de áreas
 * @param {Array} areas - Array de áreas
 * @param {number} userPermissions - Permisos del usuario
 * @returns {string} - HTML para la tabla de áreas
 */
export const renderAreasTable = (areas, userPermissions) => {
    const canEditArea = permissionUtils.canEdit(userPermissions);
    const canDeleteArea = permissionUtils.canDelete(userPermissions);
    const canViewHistory = permissionUtils.canView(userPermissions);
    const canAudit = permissionUtils.canAudit(userPermissions);
    
    let html = `
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    if (areas.length === 0) {
        html += `
            <tr>
                <td colspan="5" class="text-center">No hay áreas disponibles</td>
            </tr>
        `;
    } else {
        areas.forEach(area => {
            html += `
            <tr>
                <td>${area.CodigoIdentificacion || '-'}</td>
                <td>${area.NombreArea}</td>
                <td>${area.TipoArea || '-'}</td>
                <td>
                    <span class="badge bg-${area.IsActive ? 'success' : 'danger'}">
                        ${area.IsActive ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary view-area" data-id="${area.IDArea}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-info ${permissionUtils.showIfHasPermission(userPermissions, permissionUtils.PERMISSION.VIEW)}" 
                            data-id="${area.IDArea}" 
                            onclick="areaModule.viewAreaHistory(${area.IDArea})">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-sm btn-warning ${permissionUtils.showIfHasPermission(userPermissions, permissionUtils.PERMISSION.EDIT)}" 
                            data-id="${area.IDArea}" 
                            onclick="areaModule.showEditForm(${area.IDArea})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger ${permissionUtils.showIfHasPermission(userPermissions, permissionUtils.PERMISSION.DELETE)}" 
                            data-id="${area.IDArea}" 
                            onclick="areaModule.confirmDeleteArea(${area.IDArea})">
                        <i class="fas fa-trash"></i>
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
 * Genera el formulario para crear/editar áreas
 * @param {Object} area - Área existente (null para crear nueva)
 * @returns {string} - HTML del formulario
 */
export const renderAreaForm = (area = null) => {
    const isEdit = area !== null;
    
    return `
    <form id="area-form" class="needs-validation" novalidate>
        <input type="hidden" id="area-id" value="${isEdit ? area.IDArea : ''}">
        
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="nombre-area" class="form-label">Nombre del Área</label>
                <input type="text" class="form-control" id="nombre-area" value="${isEdit ? area.NombreArea : ''}" required>
                <div class="invalid-feedback">El nombre del área es obligatorio</div>
            </div>
            <div class="col-md-6">
                <label for="codigo-area" class="form-label">Código de Identificación</label>
                <input type="text" class="form-control" id="codigo-area" value="${isEdit ? area.CodigoIdentificacion || '' : ''}">
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="tipo-area" class="form-label">Tipo de Área</label>
                <select class="form-select" id="tipo-area">
                    <option value="" ${isEdit && !area.TipoArea ? 'selected' : ''}>Seleccionar tipo</option>
                    <option value="OPERATIVA" ${isEdit && area.TipoArea === 'OPERATIVA' ? 'selected' : ''}>Operativa</option>
                    <option value="ADMINISTRATIVA" ${isEdit && area.TipoArea === 'ADMINISTRATIVA' ? 'selected' : ''}>Administrativa</option>
                    <option value="FORENSE" ${isEdit && area.TipoArea === 'FORENSE' ? 'selected' : ''}>Forense</option>
                    <option value="TECNICA" ${isEdit && area.TipoArea === 'TECNICA' ? 'selected' : ''}>Técnica</option>
                </select>
            </div>
            <div class="col-md-6">
                <label for="estado-area" class="form-label">Estado</label>
                <select class="form-select" id="estado-area" required>
                    <option value="true" ${isEdit && area.IsActive ? 'selected' : ''}>Activo</option>
                    <option value="false" ${isEdit && !area.IsActive ? 'selected' : ''}>Inactivo</option>
                </select>
            </div>
        </div>
        
        <div class="mb-3">
            <label for="descripcion-area" class="form-label">Descripción</label>
            <textarea class="form-control" id="descripcion-area" rows="3">${isEdit ? area.Descripcion || '' : ''}</textarea>
        </div>
        
        <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-secondary me-2" onclick="areaModule.cancelForm()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Área</button>
        </div>
    </form>
    `;
};

/**
 * Genera el HTML para mostrar el historial de un área
 * @param {Array} history - Historial del área
 * @param {Object} area - Información del área
 * @returns {string} - HTML del historial
 */
export const renderAreaHistory = (history, area) => {
    if (!history || history.length === 0) {
        return '<div class="alert alert-info">No hay historial disponible para esta área.</div>';
    }
    
    let html = `
    <div class="card mb-4">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Historial del Área: ${area.NombreArea}</h5>
        </div>
        <div class="card-body">
            <div class="timeline">
    `;
    
    history.forEach((item, index) => {
        const fecha = new Date(item.FechaEvento).toLocaleString();
        
        html += `
        <div class="timeline-item">
            <div class="timeline-badge bg-${getEventBadgeClass(item.TipoEvento)}">
                <i class="fas fa-${getEventIcon(item.TipoEvento)}"></i>
            </div>
            <div class="timeline-content">
                <h5 class="timeline-title">${item.TipoEvento}</h5>
                <p class="timeline-date">${fecha}</p>
                <p>
                    ${item.NombreUsuario ? `<strong>Usuario:</strong> ${item.NombreUsuario} ${item.ApellidoUsuario || ''}<br>` : ''}
                    ${item.Detalles ? `<strong>Detalles:</strong> ${item.Detalles}` : ''}
                </p>
            </div>
        </div>
        `;
    });
    
    html += `
            </div>
        </div>
    </div>
    `;
    
    return html;
};

/**
 * Obtiene la clase CSS para el badge de evento
 * @param {string} tipoEvento - Tipo de evento
 * @returns {string} - Clase CSS para el badge
 */
export const getEventBadgeClass = (tipoEvento) => {
    switch (tipoEvento?.toUpperCase()) {
        case 'CREATE':
        case 'INSERT': return 'success';
        case 'UPDATE': return 'warning';
        case 'DELETE': return 'danger';
        case 'VIEW': return 'info';
        default: return 'secondary';
    }
};

/**
 * Obtiene el icono para el tipo de evento
 * @param {string} tipoEvento - Tipo de evento
 * @returns {string} - Nombre del icono
 */
export const getEventIcon = (tipoEvento) => {
    switch (tipoEvento?.toUpperCase()) {
        case 'CREATE':
        case 'INSERT': return 'plus';
        case 'UPDATE': return 'edit';
        case 'DELETE': return 'trash';
        case 'VIEW': return 'eye';
        default: return 'info-circle';
    }
};

/**
 * Genera el HTML para mostrar estadísticas del área
 * @param {Object} stats - Estadísticas del área
 * @param {Object} area - Información del área
 * @returns {string} - HTML de estadísticas
 */
export const renderAreaStats = (stats, area) => {
    return `
    <div class="card mb-4">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Estadísticas: ${area.NombreArea}</h5>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-4">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <div class="stat-card-icon bg-primary">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="stat-card-info">
                                <h5>Total Documentos</h5>
                                <h2>${stats.totalDocuments || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <div class="stat-card-icon bg-warning">
                                <i class="fas fa-hourglass-half"></i>
                            </div>
                            <div class="stat-card-info">
                                <h5>En Proceso</h5>
                                <h2>${stats.documentsInProgress || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <div class="stat-card-icon bg-success">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-card-info">
                                <h5>Completados</h5>
                                <h2>${stats.documentsCompleted || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <div class="stat-card-icon bg-info">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="stat-card-info">
                                <h5>Este Mes</h5>
                                <h2>${stats.documentsThisMonth || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <div class="stat-card-icon bg-secondary">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-card-info">
                                <h5>Tiempo Promedio (días)</h5>
                                <h2>${stats.averageProcessingTime !== undefined ? stats.averageProcessingTime.toFixed(1) : 'N/A'}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

/**
 * Verifica los permisos del usuario para mostrar/ocultar elementos de la interfaz
 * @param {Object} user - Usuario actual
 * @returns {Object} - Objeto con banderas de permisos para la interfaz
 */
export const getUserPermissionsForUI = (user) => {
    if (!user) return {
        create: false,
        edit: false,
        delete: false,
        view: false,
        derive: false,
        audit: false,
        export: false,
        block: false
    };
    
    const permissions = permissionUtils.getRolePermissions(user.IDRol);
    
    return {
        create: permissionUtils.canCreate(permissions),
        edit: permissionUtils.canEdit(permissions),
        delete: permissionUtils.canDelete(permissions),
        view: permissionUtils.canView(permissions),
        derive: permissionUtils.canDerive(permissions),
        audit: permissionUtils.canAudit(permissions),
        export: permissionUtils.canExport(permissions),
        block: permissionUtils.canBlock(permissions)
    };
}; 