/**
 * OFICRI Sistema de Permisos
 * Implementa el sistema de permisos basado en bits (0-7) para control de acceso a funcionalidades
 * Cumple con requisitos de seguridad ISO/IEC 27001 para control de acceso
 */

// Importar configuración
import { appConfig } from '../config/appConfig.js';

// Constantes de permisos (bits)
export const PERMISOS = {
  CREAR: 1,      // bit 0 (1)
  EDITAR: 2,     // bit 1 (2)
  ELIMINAR: 4,   // bit 2 (4)
  VER: 8,        // bit 3 (8)
  DERIVAR: 16,   // bit 4 (16)
  AUDITAR: 32,   // bit 5 (32)
  EXPORTAR: 64,  // bit 6 (64)
  BLOQUEAR: 128  // bit 7 (128)
};

// Constantes de roles predefinidos
export const ROLES = {
  ADMINISTRADOR: {
    id: 1,
    nombre: 'Administrador',
    permisos: 255, // Todos los permisos (bits 0-7)
    descripcion: 'Acceso completo a todas las funcionalidades'
  },
  MESA_PARTES: {
    id: 2,
    nombre: 'Mesa de Partes',
    permisos: 91,  // Bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
    descripcion: 'Gestión de expedientes entrantes y salientes'
  },
  RESPONSABLE_AREA: {
    id: 3,
    nombre: 'Responsable de Área',
    permisos: 91,  // Bits 0,1,3,4,6 (igual que Mesa de Partes)
    descripcion: 'Supervisión y gestión de documentos del área'
  }
};

// Módulo de permisos
const permisosService = (function() {
  'use strict';
  
  // Caché de permisos del usuario actual
  let _permisosUsuario = null;
  let _rolUsuario = null;
  
  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {number} permiso - Bit de permiso a verificar (usar constantes PERMISOS)
   * @param {number|null} permisosBitwise - Opcional: Usar permisos específicos en lugar de los del usuario actual
   * @returns {boolean} True si tiene el permiso, false en caso contrario
   */
  const tienePermiso = function(permiso, permisosBitwise = null) {
    // Si no se especifican permisos, usar los del usuario actual
    const permisos = permisosBitwise !== null ? permisosBitwise : obtenerPermisosUsuario();
    
    // Si no hay permisos, devolver false
    if (permisos === null) return false;
    
    // Verificar bit de permiso mediante operación bitwise AND
    return (permisos & permiso) === permiso;
  };
  
  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param {Array<number>} permisos - Array de bits de permisos a verificar
   * @returns {boolean} True si tiene todos los permisos, false en caso contrario
   */
  const tieneTodosLosPermisos = function(permisos) {
    // Convertir array a valor bitwise si es necesario
    if (Array.isArray(permisos)) {
      const permisoBitwise = permisos.reduce((total, p) => total | p, 0);
      return tienePermiso(permisoBitwise);
    }
    
    return tienePermiso(permisos);
  };
  
  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   * @param {Array<number>} permisos - Array de bits de permisos a verificar
   * @returns {boolean} True si tiene al menos uno de los permisos, false en caso contrario
   */
  const tieneAlgunPermiso = function(permisos) {
    const permisosUsuario = obtenerPermisosUsuario();
    
    // Si no hay permisos, devolver false
    if (permisosUsuario === null) return false;
    
    // Verificar cada permiso
    for (const permiso of permisos) {
      if ((permisosUsuario & permiso) === permiso) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Obtiene el valor bitwise de los permisos del usuario actual
   * @returns {number|null} Valor numérico de permisos o null si no hay sesión
   */
  const obtenerPermisosUsuario = function() {
    // Si ya tenemos los permisos en caché, devolverlos
    if (_permisosUsuario !== null) {
      return _permisosUsuario;
    }
    
    // Obtener usuario y su rol desde el servicio de autenticación
    const usuario = window.OFICRI.authService.getUser();
    
    // Si no hay usuario autenticado, devolver null
    if (!usuario || !usuario.rol || !usuario.permisos) {
      return null;
    }
    
    // Guardar en caché
    _permisosUsuario = usuario.permisos;
    _rolUsuario = usuario.rol;
    
    return _permisosUsuario;
  };
  
  /**
   * Obtiene el nombre del rol del usuario actual
   * @returns {string|null} Nombre del rol o null si no hay sesión
   */
  const obtenerRolUsuario = function() {
    // Si ya tenemos el rol en caché, devolverlo
    if (_rolUsuario !== null) {
      return _rolUsuario;
    }
    
    // Obtener usuario desde el servicio de autenticación
    const usuario = window.OFICRI.authService.getUser();
    
    // Si no hay usuario autenticado, devolver null
    if (!usuario || !usuario.rol) {
      return null;
    }
    
    // Guardar en caché
    _rolUsuario = usuario.rol;
    
    return _rolUsuario;
  };
  
  /**
   * Convierte un valor bitwise de permisos a un array de nombres de permisos
   * Útil para debugging y visualización
   * @param {number} permisoBitwise - Valor bitwise de permisos
   * @returns {Array<string>} Array con nombres de permisos
   */
  const permisosATexto = function(permisoBitwise) {
    const resultado = [];
    
    if ((permisoBitwise & PERMISOS.CREAR) === PERMISOS.CREAR) resultado.push('Crear');
    if ((permisoBitwise & PERMISOS.EDITAR) === PERMISOS.EDITAR) resultado.push('Editar');
    if ((permisoBitwise & PERMISOS.ELIMINAR) === PERMISOS.ELIMINAR) resultado.push('Eliminar');
    if ((permisoBitwise & PERMISOS.VER) === PERMISOS.VER) resultado.push('Ver');
    if ((permisoBitwise & PERMISOS.DERIVAR) === PERMISOS.DERIVAR) resultado.push('Derivar');
    if ((permisoBitwise & PERMISOS.AUDITAR) === PERMISOS.AUDITAR) resultado.push('Auditar');
    if ((permisoBitwise & PERMISOS.EXPORTAR) === PERMISOS.EXPORTAR) resultado.push('Exportar');
    if ((permisoBitwise & PERMISOS.BLOQUEAR) === PERMISOS.BLOQUEAR) resultado.push('Bloquear');
    
    return resultado;
  };
  
  /**
   * Invalida la caché de permisos
   * Debe llamarse después de iniciar sesión o cambiar permisos
   */
  const invalidarCache = function() {
    _permisosUsuario = null;
    _rolUsuario = null;
    console.log('[PERMISOS] Caché de permisos invalidada');
  };
  
  /**
   * Valida permisos y muestra/oculta elementos según los permisos del usuario
   * @param {Object} options - Opciones de configuración
   */
  const aplicarPermisosUI = function(options = {}) {
    const defaults = {
      aplicarAutomaticamente: true,  // Aplicar automáticamente al DOM
      selector: '[data-permiso]',    // Selector de elementos a verificar
      mostrarNoAutorizado: false     // Mostrar mensaje "No autorizado" en lugar de ocultar
    };
    
    // Combinar opciones con defaults
    const config = { ...defaults, ...options };
    
    // Si no se debe aplicar automáticamente, salir
    if (!config.aplicarAutomaticamente) return;
    
    // Obtener permisos del usuario
    const permisos = obtenerPermisosUsuario();
    
    // Si no hay permisos, ocultar todos los elementos
    if (permisos === null) {
      document.querySelectorAll(config.selector).forEach(el => {
        el.style.display = 'none';
      });
      return;
    }
    
    // Para cada elemento con atributo data-permiso
    document.querySelectorAll(config.selector).forEach(el => {
      const permisoRequerido = parseInt(el.getAttribute('data-permiso'), 10);
      
      // Si no se puede parsear el permiso o es 0, mostrar siempre
      if (isNaN(permisoRequerido) || permisoRequerido === 0) {
        el.style.display = '';
        return;
      }
      
      // Verificar permiso
      if (tienePermiso(permisoRequerido)) {
        el.style.display = '';
      } else {
        if (config.mostrarNoAutorizado) {
          el.innerHTML = '<i class="fa fa-lock"></i> No autorizado';
          el.classList.add('no-autorizado');
        } else {
          el.style.display = 'none';
        }
      }
    });
  };
  
  /**
   * Redirige al usuario a la página correspondiente según su rol
   * Útil después del login o al acceder a una página no autorizada
   */
  const redirigirSegunRol = function() {
    const rol = obtenerRolUsuario();
    
    if (!rol) {
      // Si no hay rol, redirigir a login
      window.location.href = '/';
      return;
    }
    
    // Redirigir según rol
    switch (rol) {
      case 'Administrador':
        window.location.href = '/admin.html';
        break;
      case 'Mesa de Partes':
        window.location.href = '/mesapartes.html';
        break;
      case 'Responsable de Área':
        window.location.href = '/area.html';
        break;
      default:
        // Rol desconocido, redirigir a login
        window.location.href = '/';
    }
  };
  
  /**
   * Verifica si el usuario está autorizado para acceder a la página actual
   * @param {Array<string>} rolesPermitidos - Array de nombres de roles permitidos
   * @returns {boolean} True si está autorizado, false en caso contrario
   */
  const verificarAccesoPagina = function(rolesPermitidos) {
    const rol = obtenerRolUsuario();
    
    // Si no hay rol, no está autorizado
    if (!rol) {
      return false;
    }
    
    // Verificar si el rol actual está en la lista de permitidos
    return rolesPermitidos.includes(rol);
  };
  
  /**
   * Registra un evento de acceso no autorizado en el log de auditoría
   * Cumple con ISO/IEC 27001 para registro de eventos de seguridad
   * @param {string} recurso - Recurso al que se intentó acceder
   * @param {string} razon - Razón del rechazo
   */
  const registrarAccesoNoAutorizado = function(recurso, razon) {
    console.warn(`[SEGURIDAD] Acceso no autorizado a ${recurso}. Razón: ${razon}`);
    
    // Enviar al servidor solo si está en producción
    if (appConfig.environment.isProduction) {
      window.OFICRI.apiClient.post('/auditoria/acceso', {
        recurso,
        razon,
        timestamp: new Date().toISOString(),
        ip: null, // El servidor completará esta información
        usuario: window.OFICRI.authService.getUser()?.username || 'anónimo'
      }).catch(err => {
        console.error('Error al registrar evento de seguridad:', err);
      });
    }
  };
  
  // API pública
  return {
    tienePermiso,
    tieneTodosLosPermisos,
    tieneAlgunPermiso,
    obtenerPermisosUsuario,
    obtenerRolUsuario,
    permisosATexto,
    invalidarCache,
    aplicarPermisosUI,
    redirigirSegunRol,
    verificarAccesoPagina,
    registrarAccesoNoAutorizado
  };
})();

// Exportar módulo
export { permisosService };

// Para compatibilidad con navegadores antiguos
window.OFICRI = window.OFICRI || {};
window.OFICRI.permisosService = permisosService; 