/**
 * Módulo de gestión de documentos
 * Proporciona funciones modulares para la gestión de documentos (CRUD)
 */

import AuthService from '../services/auth.service.js';
import * as permissionUtils from '../utils/permissions.js';

// URL base para las operaciones de documentos
const BASE_URL = '/api/documents';

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
 * Obtiene todos los documentos
 * @param {Object} filters - Filtros para la consulta (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de documentos
 */
export const getAllDocuments = async (filters = {}) => {
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
            throw new Error(`Error al obtener documentos: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.documents || [];
    } catch (error) {
        console.error('Error en getAllDocuments:', error);
        throw error;
    }
};

/**
 * Obtiene un documento por su ID
 * @param {number} documentId - ID del documento
 * @returns {Promise<Object>} - Promesa que resuelve al documento
 */
export const getDocumentById = async (documentId) => {
    try {
        const response = await fetch(`${BASE_URL}/${documentId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener documento: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.document || null;
    } catch (error) {
        console.error(`Error en getDocumentById (ID: ${documentId}):`, error);
        throw error;
    }
};

/**
 * Crea un nuevo documento
 * @param {Object} documentData - Datos del documento a crear
 * @returns {Promise<Object>} - Promesa que resuelve al documento creado
 */
export const createDocument = async (documentData) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al crear documento: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.document || null;
    } catch (error) {
        console.error('Error en createDocument:', error);
        throw error;
    }
};

/**
 * Actualiza un documento existente
 * @param {number} documentId - ID del documento a actualizar
 * @param {Object} documentData - Datos actualizados del documento
 * @returns {Promise<Object>} - Promesa que resuelve al documento actualizado
 */
export const updateDocument = async (documentId, documentData) => {
    try {
        const response = await fetch(`${BASE_URL}/${documentId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al actualizar documento: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.document || null;
    } catch (error) {
        console.error(`Error en updateDocument (ID: ${documentId}):`, error);
        throw error;
    }
};

/**
 * Elimina un documento
 * @param {number} documentId - ID del documento a eliminar
 * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
 */
export const deleteDocument = async (documentId) => {
    try {
        const response = await fetch(`${BASE_URL}/${documentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al eliminar documento: ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Error en deleteDocument (ID: ${documentId}):`, error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// OPERACIONES ESPECÍFICAS DE DOCUMENTOS
// ════════════════════════════════════════════════════════════════

/**
 * Deriva un documento a otra área
 * @param {number} documentId - ID del documento a derivar
 * @param {Object} derivacionData - Datos de la derivación
 * @returns {Promise<Object>} - Promesa que resuelve a la derivación creada
 */
export const deriveDocument = async (documentId, derivacionData) => {
    try {
        const response = await fetch(`${BASE_URL}/${documentId}/derive`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(derivacionData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al derivar documento: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.derivacion || null;
    } catch (error) {
        console.error(`Error en deriveDocument (ID: ${documentId}):`, error);
        throw error;
    }
};

/**
 * Obtiene el historial de derivaciones de un documento
 * @param {number} documentId - ID del documento
 * @returns {Promise<Array>} - Promesa que resuelve a un array de derivaciones
 */
export const getDocumentHistory = async (documentId) => {
    try {
        const response = await fetch(`${BASE_URL}/${documentId}/history`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener historial: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error(`Error en getDocumentHistory (ID: ${documentId}):`, error);
        throw error;
    }
};

/**
 * Obtiene documentos filtrados por estado
 * @param {string} estado - Estado del documento
 * @returns {Promise<Array>} - Promesa que resuelve a un array de documentos
 */
export const getDocumentsByStatus = async (estado) => {
    return getAllDocuments({ estado });
};

/**
 * Obtiene documentos asignados al área del usuario
 * @param {number} areaId - ID del área
 * @returns {Promise<Array>} - Promesa que resuelve a un array de documentos
 */
export const getDocumentsByArea = async (areaId) => {
    return getAllDocuments({ idAreaActual: areaId });
};

/**
 * Obtiene documentos recibidos por el usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} - Promesa que resuelve a un array de documentos
 */
export const getDocumentsAssignedToUser = async (userId) => {
    return getAllDocuments({ idUsuarioAsignado: userId });
};

/**
 * Exporta documentos a un formato específico
 * @param {Object} filters - Filtros para los documentos a exportar
 * @param {string} format - Formato de exportación ('pdf', 'excel', etc.)
 * @returns {Promise<Blob>} - Promesa que resuelve al blob con los datos exportados
 */
export const exportDocuments = async (filters = {}, format = 'pdf') => {
    try {
        let url = `${BASE_URL}/export?format=${format}`;
        
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
            throw new Error(`Error al exportar documentos: ${response.statusText}`);
        }
        
        return await response.blob();
    } catch (error) {
        console.error('Error en exportDocuments:', error);
        throw error;
    }
};

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE INTERFAZ DE USUARIO
// ════════════════════════════════════════════════════════════════

/**
 * Genera el HTML para la tabla de documentos
 * @param {Array} documents - Array de documentos
 * @param {number} userPermissions - Permisos del usuario
 * @returns {string} - HTML para la tabla de documentos
 */
export const renderDocumentsTable = (documents, userPermissions) => {
    const canEditDoc = permissionUtils.canEdit(userPermissions);
    const canDeleteDoc = permissionUtils.canDelete(userPermissions);
    const canDeriveDoc = permissionUtils.canDerive(userPermissions);
    
    let html = `
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Nro. Registro</th>
                <th>Oficio</th>
                <th>Fecha</th>
                <th>Origen</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    if (documents.length === 0) {
        html += `
            <tr>
                <td colspan="6" class="text-center">No hay documentos disponibles</td>
            </tr>
        `;
    } else {
        documents.forEach(doc => {
            const fechaFormateada = new Date(doc.FechaDocumento).toLocaleDateString();
            
            html += `
            <tr>
                <td>${doc.NroRegistro}</td>
                <td>${doc.NumeroOficioDocumento}</td>
                <td>${fechaFormateada}</td>
                <td>${doc.OrigenDocumento}</td>
                <td><span class="badge bg-${getEstadoBadgeClass(doc.Estado)}">${doc.Estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary view-document" data-id="${doc.IDDocumento}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-info ${permissionUtils.showIfHasPermission(userPermissions, permissionUtils.PERMISSION.DERIVE)}" 
                            data-id="${doc.IDDocumento}" 
                            onclick="documentModule.showDeriveModal(${doc.IDDocumento})">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="btn btn-sm btn-warning ${permissionUtils.showIfHasPermission(userPermissions, permissionUtils.PERMISSION.EDIT)}" 
                            data-id="${doc.IDDocumento}" 
                            onclick="documentModule.showEditForm(${doc.IDDocumento})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger ${permissionUtils.showIfHasPermission(userPermissions, permissionUtils.PERMISSION.DELETE)}" 
                            data-id="${doc.IDDocumento}" 
                            onclick="documentModule.confirmDeleteDocument(${doc.IDDocumento})">
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
 * Obtiene la clase CSS para el badge de estado
 * @param {string} estado - Estado del documento
 * @returns {string} - Clase CSS para el badge
 */
export const getEstadoBadgeClass = (estado) => {
    switch (estado?.toUpperCase()) {
        case 'RECIBIDO': return 'info';
        case 'EN PROCESO': return 'warning';
        case 'COMPLETADO': return 'success';
        case 'ARCHIVADO': return 'secondary';
        case 'RECHAZADO': return 'danger';
        case 'PENDIENTE': return 'primary';
        default: return 'secondary';
    }
};

/**
 * Genera el formulario para crear/editar documentos
 * @param {Object} document - Documento existente (null para crear nuevo)
 * @returns {string} - HTML del formulario
 */
export const renderDocumentForm = (document = null) => {
    const isEdit = document !== null;
    
    return `
    <form id="document-form" class="needs-validation" novalidate>
        <input type="hidden" id="document-id" value="${isEdit ? document.IDDocumento : ''}">
        
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="nro-registro" class="form-label">Nro. de Registro</label>
                <input type="text" class="form-control" id="nro-registro" value="${isEdit ? document.NroRegistro : ''}" required>
                <div class="invalid-feedback">El número de registro es obligatorio</div>
            </div>
            <div class="col-md-6">
                <label for="nro-oficio" class="form-label">Número de Oficio</label>
                <input type="text" class="form-control" id="nro-oficio" value="${isEdit ? document.NumeroOficioDocumento : ''}" required>
                <div class="invalid-feedback">El número de oficio es obligatorio</div>
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="fecha-documento" class="form-label">Fecha</label>
                <input type="date" class="form-control" id="fecha-documento" 
                    value="${isEdit && document.FechaDocumento ? new Date(document.FechaDocumento).toISOString().split('T')[0] : ''}" required>
                <div class="invalid-feedback">La fecha es obligatoria</div>
            </div>
            <div class="col-md-6">
                <label for="origen-documento" class="form-label">Origen</label>
                <select class="form-select" id="origen-documento" required>
                    <option value="" disabled selected>Seleccionar origen</option>
                    <option value="INTERNO" ${isEdit && document.OrigenDocumento === 'INTERNO' ? 'selected' : ''}>Interno</option>
                    <option value="EXTERNO" ${isEdit && document.OrigenDocumento === 'EXTERNO' ? 'selected' : ''}>Externo</option>
                </select>
                <div class="invalid-feedback">El origen es obligatorio</div>
            </div>
        </div>
        
        <div class="mb-3">
            <label for="procedencia" class="form-label">Procedencia</label>
            <input type="text" class="form-control" id="procedencia" value="${isEdit ? document.Procedencia || '' : ''}">
        </div>
        
        <div class="mb-3">
            <label for="contenido" class="form-label">Contenido</label>
            <textarea class="form-control" id="contenido" rows="3" required>${isEdit ? document.Contenido || '' : ''}</textarea>
            <div class="invalid-feedback">El contenido es obligatorio</div>
        </div>
        
        <div class="mb-3">
            <label for="observaciones" class="form-label">Observaciones</label>
            <textarea class="form-control" id="observaciones" rows="2">${isEdit ? document.Observaciones || '' : ''}</textarea>
        </div>
        
        <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-secondary me-2" onclick="documentModule.cancelForm()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Documento</button>
        </div>
    </form>
    `;
};

/**
 * Genera el modal para derivar documento
 * @param {number} documentId - ID del documento a derivar
 * @returns {string} - HTML del modal
 */
export const renderDeriveModal = (documentId) => {
    return `
    <div class="modal fade" id="derive-modal" tabindex="-1" aria-labelledby="derive-modal-label" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="derive-modal-label">Derivar Documento</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="derive-form">
                        <input type="hidden" id="derive-document-id" value="${documentId}">
                        
                        <div class="mb-3">
                            <label for="area-destino" class="form-label">Área Destino</label>
                            <select class="form-select" id="area-destino" required>
                                <option value="" disabled selected>Seleccionar área</option>
                                <!-- Las opciones se cargarán dinámicamente -->
                            </select>
                            <div class="invalid-feedback">El área destino es obligatoria</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="observacion-derivacion" class="form-label">Observación</label>
                            <textarea class="form-control" id="observacion-derivacion" rows="3"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btn-confirmar-derivacion">Derivar</button>
                </div>
            </div>
        </div>
    </div>
    `;
};

/**
 * Genera el HTML para mostrar el historial de un documento
 * @param {Array} history - Historial de derivaciones
 * @returns {string} - HTML del historial
 */
export const renderDocumentHistory = (history) => {
    if (!history || history.length === 0) {
        return '<div class="alert alert-info">No hay historial disponible para este documento.</div>';
    }
    
    let html = `
    <div class="timeline">
    `;
    
    history.forEach((item, index) => {
        const fecha = new Date(item.FechaDerivacion).toLocaleString();
        
        html += `
        <div class="timeline-item">
            <div class="timeline-badge bg-${index === history.length - 1 ? 'success' : 'primary'}">
                <i class="fas fa-${index === 0 ? 'file' : 'share'}"></i>
            </div>
            <div class="timeline-content">
                <h5 class="timeline-title">
                    ${item.NombreAreaOrigen} → ${item.NombreAreaDestino}
                </h5>
                <p class="timeline-date">${fecha}</p>
                <p>
                    <strong>Derivado por:</strong> ${item.NombreUsuarioDeriva} ${item.ApellidoUsuarioDeriva}<br>
                    <strong>Estado:</strong> <span class="badge bg-${item.EstadoDerivacion === 'COMPLETADO' ? 'success' : 'warning'}">${item.EstadoDerivacion}</span>
                    ${item.FechaRecepcion ? `<br><strong>Recepción:</strong> ${new Date(item.FechaRecepcion).toLocaleString()}` : ''}
                    ${item.NombreUsuarioRecibe ? `<br><strong>Recibido por:</strong> ${item.NombreUsuarioRecibe} ${item.ApellidoUsuarioRecibe}` : ''}
                </p>
                ${item.Observacion ? `<p class="timeline-observation">${item.Observacion}</p>` : ''}
            </div>
        </div>
        `;
    });
    
    html += `
    </div>
    `;
    
    return html;
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