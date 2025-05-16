import axios from 'axios';
import { useAuthStore } from '../stores/auth';

// Constantes de permisos por bits (igual que en el backend)
export const PERMISSION_BITS = {
  CREAR: 1,      // bit 0
  EDITAR: 2,     // bit 1
  ELIMINAR: 4,   // bit 2
  VER: 8,        // bit 3
  DERIVAR: 16,   // bit 4
  AUDITAR: 32,   // bit 5
  EXPORTAR: 64,  // bit 6
  ADMIN: 128     // bit 7
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {number} permissionBit - Bit de permiso a verificar
 * @param {boolean} checkAll - Si se requieren todos los bits (para permisos múltiples)
 * @returns {boolean} - True si tiene permiso, false si no
 */
export function hasPermission(permissionBit, checkAll = false) {
  const authStore = useAuthStore();
  
  // Si el usuario no está autenticado, no tiene permisos
  if (!authStore.isAuthenticated || !authStore.user) {
    return false;
  }
  
  // Si es administrador, tiene todos los permisos
  if (authStore.user.NombreRol?.toLowerCase().includes('admin')) {
    return true;
  }
  
  // Verificamos los permisos basados en bits
  const userPermisos = authStore.user.Permisos || 0;
  
  // Si checkAll es true, TODOS los bits deben estar presentes
  if (checkAll) {
    return (userPermisos & permissionBit) === permissionBit;
  } else {
    return (userPermisos & permissionBit) > 0;
  }
}

/**
 * Verifica si un usuario tiene un permiso contextual
 * @param {string} tipoRecurso - Tipo de recurso (DOCUMENTO, USUARIO, AREA, etc)
 * @param {number} idRecurso - ID del recurso sobre el que se verifica el permiso
 * @param {string} accion - Acción a verificar (CREAR, EDITAR, ELIMINAR, VER, etc)
 * @returns {Promise<boolean>} - True si tiene permiso, false si no
 */
export async function hasContextualPermission(tipoRecurso, idRecurso, accion) {
  const authStore = useAuthStore();
  
  // Si el usuario no está autenticado, no tiene permisos
  if (!authStore.isAuthenticated) {
    return false;
  }
  
  // Si es administrador, tiene todos los permisos
  if (authStore.user?.NombreRol?.toLowerCase().includes('admin')) {
    return true;
  }
  
  try {
    // Primero verificamos los permisos basados en bits
    let bitPermission;
    
    switch (accion) {
      case 'CREAR': bitPermission = PERMISSION_BITS.CREAR; break;
      case 'EDITAR': bitPermission = PERMISSION_BITS.EDITAR; break;
      case 'ELIMINAR': bitPermission = PERMISSION_BITS.ELIMINAR; break;
      case 'VER': bitPermission = PERMISSION_BITS.VER; break;
      case 'DERIVAR': bitPermission = PERMISSION_BITS.DERIVAR; break;
      case 'AUDITAR': bitPermission = PERMISSION_BITS.AUDITAR; break;
      case 'EXPORTAR': bitPermission = PERMISSION_BITS.EXPORTAR; break;
      case 'ADMIN': bitPermission = PERMISSION_BITS.ADMIN; break;
      default: bitPermission = 0;
    }
    
    const bitResult = hasPermission(bitPermission);
    
    // Si tiene el permiso por bit, no necesitamos verificar permisos contextuales
    if (bitResult) {
      return true;
    }
    
    // Verificar permisos contextuales en el backend
    const response = await axios.post('/api/permisos/verificar', {
      tipoRecurso,
      idRecurso,
      accion
    }, {
      headers: { 
        Authorization: `Bearer ${authStore.token}` 
      }
    });
    
    return response.data.tienePermiso === true;
  } catch (error) {
    console.error('Error verificando permiso contextual:', error);
    return false;
  }
}

/**
 * Verifica si el usuario puede eliminar un documento
 * @param {number} documentoId - ID del documento
 * @returns {Promise<boolean>} - True si puede eliminar, false si no
 */
export async function canDeleteDocument(documentoId) {
  return hasContextualPermission('DOCUMENTO', documentoId, 'ELIMINAR');
}

/**
 * Verifica si el usuario puede eliminar un usuario (solo admins)
 * @returns {boolean} - True si puede eliminar usuarios, false si no
 */
export function canDeleteUser() {
  return hasPermission(PERMISSION_BITS.ADMIN);
}

/**
 * Verifica si el usuario puede eliminar un área (solo admins)
 * @returns {boolean} - True si puede eliminar áreas, false si no
 */
export function canDeleteArea() {
  return hasPermission(PERMISSION_BITS.ADMIN);
}

/**
 * Verifica si el usuario puede eliminar un documento (bitwise/contextual, local)
 * @param {object} user - Usuario autenticado
 * @param {object} doc - Documento
 * @returns {boolean}
 */
export function canDeleteDocumentLocal(user, doc) {
  if (!user || !doc) return false;
  // Admin
  if (user.NombreRol?.toLowerCase().includes('admin')) return true;
  // Bitwise
  const canDelete = (user.Permisos & PERMISSION_BITS.ELIMINAR) > 0;
  // Contextual: creador o área
  const isOwner = doc.IDUsuarioCreador === user.IDUsuario;
  const isArea = doc.IDAreaActual === user.IDArea;
  return canDelete && (isOwner || isArea);
}

/**
 * Verifica si el usuario puede editar un documento (bitwise/contextual, local)
 * @param {object} user - Usuario autenticado
 * @param {object} doc - Documento
 * @returns {boolean}
 */
export function canEditDocumentLocal(user, doc) {
  if (!user || !doc) return false;
  // Admin
  if (user.NombreRol?.toLowerCase().includes('admin')) return true;
  // Bitwise
  const canEdit = (user.Permisos & PERMISSION_BITS.EDITAR) > 0;
  // Contextual: creador o área
  const isOwner = doc.IDUsuarioCreador === user.IDUsuario;
  const isSameArea = doc.IDAreaActual === user.IDArea;
  return canEdit || isOwner || isSameArea;
}

/**
 * Verifica si el usuario puede derivar un documento (bitwise/contextual, local)
 * @param {object} user - Usuario autenticado
 * @param {object} doc - Documento
 * @returns {boolean}
 */
export function canDeriveDocumentLocal(user, doc) {
  if (!user || !doc) return false;
  // Admin
  if (user.NombreRol?.toLowerCase().includes('admin')) return true;
  // Bitwise
  const canDerive = (user.Permisos & PERMISSION_BITS.DERIVAR) > 0;
  // Contextual: creador o área
  const isOwner = doc.IDUsuarioCreador === user.IDUsuario;
  const isSameArea = doc.IDAreaActual === user.IDArea;
  return canDerive || isOwner || isSameArea;
}

/**
 * Verifica si el usuario puede ver la trazabilidad de documentos
 * @param {object} user - Usuario autenticado
 * @returns {boolean}
 */
export function canViewTrazabilidad(user) {
  if (!user) return false;
  
  // Admin siempre puede ver trazabilidad
  if (user.NombreRol?.toLowerCase().includes('admin')) return true;
  
  // Mesa de partes puede ver trazabilidad
  if (user.NombreRol?.toLowerCase().includes('mesa de partes')) return true;
  
  // Otros roles necesitan el permiso de auditoría
  return (user.Permisos & PERMISSION_BITS.AUDITAR) > 0;
} 