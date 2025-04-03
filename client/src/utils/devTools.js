/**
 * OFICRI Dev Tools
 * Herramientas para desarrollo y pruebas
 * 
 * ADVERTENCIA: Este archivo debe usarse únicamente en entorno de desarrollo.
 * No incluir en producción.
 */

// Crear namespace
window.OFICRI = window.OFICRI || {};

// Dev Tools Module
const devTools = (function() {
  'use strict';
  
  /**
   * Activa o desactiva el modo de mock API
   * @param {boolean} enable - Si true, activa el mock
   */
  const enableMockApi = function(enable = true) {
    if (window.OFICRI && window.OFICRI.mockApiResponses) {
      window.OFICRI.mockApiResponses.setEnabled(enable);
      
      // Mostrar información en consola
      console.info(`[DEV TOOLS] Mock API ${enable ? 'ACTIVADO' : 'DESACTIVADO'}`);
      
      // Mostrar notificación si el componente está disponible
      if (window.OFICRI.notificationManager) {
        window.OFICRI.notificationManager.showInfo(
          'Modo Desarrollo', 
          `Mock API ${enable ? 'activado' : 'desactivado'}`
        );
      }
      
      return true;
    } else {
      console.error('[DEV TOOLS] No se encontró el componente mockApiResponses');
      return false;
    }
  };
  
  /**
   * Muestra información detallada del usuario actual
   */
  const showCurrentUser = function() {
    if (window.OFICRI && window.OFICRI.authService) {
      const user = window.OFICRI.authService.getUser();
      console.log('[DEV TOOLS] Usuario actual:', user);
      return user;
    } else {
      console.error('[DEV TOOLS] No se encontró el servicio de autenticación');
      return null;
    }
  };
  
  /**
   * Simula un fallo en la API para pruebas de errores
   * @param {number} status - Código de estado HTTP
   * @param {string} message - Mensaje de error
   */
  const simulateApiError = function(status = 500, message = 'Error simulado para pruebas') {
    // Guardar referencia al fetch original
    const originalFetch = window.fetch;
    
    // Reemplazar fetch para la próxima llamada
    window.fetch = function(url, options) {
      // Restaurar el fetch original inmediatamente
      window.fetch = originalFetch;
      
      // Mostrar mensaje informativo
      console.info(`[DEV TOOLS] Simulando error ${status} en la próxima petición a ${url}`);
      
      // Devolver una promesa rechazada o respuesta con error según el código
      if (status >= 500) {
        return Promise.reject(new Error(message));
      } else {
        return Promise.resolve(new Response(
          JSON.stringify({ success: false, message: message }),
          { status: status, headers: { 'Content-Type': 'application/json' } }
        ));
      }
    };
    
    // Notificar al usuario
    if (window.OFICRI.notificationManager) {
      window.OFICRI.notificationManager.showWarning(
        'Modo Desarrollo', 
        `Se simulará un error ${status} en la próxima petición`
      );
    }
  };
  
  /**
   * Genera un perfil de usuario aleatorio para pruebas
   * @returns {Object} Datos de usuario aleatorio
   */
  const generateRandomProfile = function() {
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Luisa'];
    const apellidos = ['Pérez', 'Gómez', 'Rodríguez', 'López', 'García', 'Martínez'];
    const grados = ['Teniente', 'Capitán', 'Mayor', 'Coronel', 'General'];
    const areas = [
      { IDArea: 1, NombreArea: 'Administración', CodigoArea: 'ADM' },
      { IDArea: 2, NombreArea: 'Operaciones', CodigoArea: 'OPS' },
      { IDArea: 3, NombreArea: 'Logística', CodigoArea: 'LOG' },
      { IDArea: 4, NombreArea: 'Inteligencia', CodigoArea: 'INT' }
    ];
    const roles = [
      { IDRol: 1, NombreRol: 'Administrador', Permisos: 255 },
      { IDRol: 2, NombreRol: 'Operador', Permisos: 15 },
      { IDRol: 3, NombreRol: 'Visualizador', Permisos: 8 }
    ];
    
    // Seleccionar valores aleatorios
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    const grado = grados[Math.floor(Math.random() * grados.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const rol = roles[Math.floor(Math.random() * roles.length)];
    
    // Generar código CIP aleatorio
    const codigoCIP = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Crear perfil
    const profile = {
      IDUsuario: Math.floor(Math.random() * 100) + 1,
      CodigoCIP: codigoCIP,
      Nombres: nombre,
      Apellidos: apellido,
      Grado: grado,
      IDArea: area.IDArea,
      area: area,
      IDRol: rol.IDRol,
      rol: rol,
      UltimoAcceso: new Date().toISOString(),
      Bloqueado: false
    };
    
    // Actualizar el mock con este perfil
    if (window.OFICRI && window.OFICRI.mockApiResponses) {
      // Crear copia del objeto para evitar modificar el original
      const mockResponse = window.OFICRI.mockApiResponses.getMockUserProfile();
      mockResponse.data = profile;
      
      // Opcional: actualizar inmediatamente el usuario en localStorage
      if (window.localStorage) {
        try {
          localStorage.setItem('oficri_user', JSON.stringify(profile));
        } catch (error) {
          console.error('[DEV TOOLS] Error al actualizar usuario en localStorage:', error);
        }
      }
    }
    
    // Mostrar en consola
    console.log('[DEV TOOLS] Perfil aleatorio generado:', profile);
    
    return profile;
  };
  
  // Public API
  return {
    enableMockApi,
    showCurrentUser,
    simulateApiError,
    generateRandomProfile
  };
})();

// Asignar al namespace global
window.OFICRI.devTools = devTools;

// Exportar para ES modules
export { devTools };

// Mensaje de inicialización
console.log('%c OFICRI DEV TOOLS CARGADAS', 'background: #126D47; color: white; padding: 4px; border-radius: 4px;');
console.log('%c Usar window.OFICRI.devTools para acceder a las herramientas', 'color: #126D47;');
console.log('%c Ejemplo: window.OFICRI.devTools.enableMockApi(true)', 'color: #126D47;'); 