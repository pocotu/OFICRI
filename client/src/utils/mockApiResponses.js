/**
 * OFICRI - Mock API Responses
 * Proporciona respuestas simuladas para pruebas y desarrollo
 * 
 * Este archivo debe usarse únicamente en entorno de desarrollo
 */

// Crear namespace
window.OFICRI = window.OFICRI || {};

// MockAPI Service Module
const mockApiResponses = (function() {
  'use strict';
  
  // Determinar si el mock está habilitado
  let _enabled = false;
  
  /**
   * Habilita/deshabilita las respuestas simuladas
   * @param {boolean} status - Estado de habilitación
   */
  const setEnabled = function(status) {
    _enabled = !!status;
    console.log(`[MOCK API] ${_enabled ? 'Habilitado' : 'Deshabilitado'}`);
  };
  
  /**
   * Verifica si el mock está habilitado
   * @returns {boolean} True si está habilitado
   */
  const isEnabled = function() {
    return _enabled;
  };
  
  /**
   * Verifica si una URL debería ser simulada
   * @param {string} url - URL de la petición
   * @returns {boolean} True si la URL debería ser simulada
   */
  const shouldMockUrl = function(url) {
    if (!_enabled) return false;
    
    // Endpoints que se van a simular
    const mockedEndpoints = [
      '/api/users/', 
      '/api/logs/usuario/'
    ];
    
    // Verificar si la URL coincide con algún endpoint simulado
    return mockedEndpoints.some(endpoint => url.includes(endpoint));
  };
  
  /**
   * Genera una respuesta simulada para una URL
   * @param {string} url - URL de la petición
   * @param {Object} options - Opciones de fetch
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta simulada
   */
  const getMockResponse = function(url, options) {
    // Simular latencia de red
    return new Promise(resolve => {
      setTimeout(() => {
        if (url.includes('/api/users/')) {
          resolve(getMockUserProfile());
        } else if (url.includes('/api/logs/usuario/')) {
          resolve(getMockUserActivity());
        } else {
          // Endpoint no simulado
          resolve({
            success: false,
            message: 'Endpoint no simulado en mockApiResponses.js'
          });
        }
      }, 500); // 500ms de latencia simulada
    });
  };
  
  /**
   * Obtiene un perfil de usuario simulado
   * @returns {Object} Perfil de usuario simulado
   */
  const getMockUserProfile = function() {
    return {
      success: true,
      data: {
        IDUsuario: 1,
        CodigoCIP: "12345678",
        Nombres: "Jan",
        Apellidos: "Perez",
        Grado: "Teniente",
        IDArea: 1,
        area: {
          IDArea: 1,
          NombreArea: "Administración",
          CodigoArea: "ADM"
        },
        IDRol: 1,
        rol: {
          IDRol: 1,
          NombreRol: "Administrador",
          Permisos: 255
        },
        UltimoAcceso: "2025-04-01T10:30:00Z",
        Bloqueado: false
      },
      message: "Usuario obtenido correctamente (SIMULADO)"
    };
  };
  
  /**
   * Obtiene actividad de usuario simulada
   * @returns {Object} Actividad simulada del usuario
   */
  const getMockUserActivity = function() {
    return {
      success: true,
      data: [
        {
          IDLog: 1,
          IDUsuario: 1,
          FechaEvento: new Date().toISOString(),
          TipoEvento: "LOGIN",
          Detalles: "Login exitoso",
          DireccionIP: "192.168.1.1"
        },
        {
          IDLog: 2,
          IDUsuario: 1,
          FechaEvento: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 día atrás
          TipoEvento: "VER_DOCUMENTO",
          Detalles: "Documento #12345",
          DireccionIP: "192.168.1.1"
        },
        {
          IDLog: 3,
          IDUsuario: 1,
          FechaEvento: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2 días atrás
          TipoEvento: "EDITAR_DOCUMENTO",
          Detalles: "Documento #12345",
          DireccionIP: "192.168.1.1"
        }
      ],
      message: "Actividad obtenida correctamente (SIMULADA)"
    };
  };
  
  /**
   * Obtiene lista de usuarios simulada para la tabla de administración
   * @returns {Object} Lista de usuarios simulada
   */
  const getMockUsersList = function() {
    return {
      success: true,
      data: [
        {
          IDUsuario: 1,
          CodigoCIP: "12345678",
          Nombres: "Jan",
          Apellidos: "Perez",
          Grado: "Teniente",
          IDArea: 1,
          NombreArea: "Administración",
          IDRol: 1,
          NombreRol: "Administrador",
          Permisos: 255,
          Estado: "ACTIVO"
        },
        {
          IDUsuario: 2,
          CodigoCIP: "23456789",
          Nombres: "María",
          Apellidos: "López",
          Grado: "Capitán",
          IDArea: 2,
          NombreArea: "Operaciones",
          IDRol: 2,
          NombreRol: "Operador",
          Permisos: 15,
          Estado: "ACTIVO"
        },
        {
          IDUsuario: 3,
          CodigoCIP: "34567890",
          Nombres: "Carlos",
          Apellidos: "Gómez",
          Grado: "Mayor",
          IDArea: 3,
          NombreArea: "Inteligencia",
          IDRol: 3,
          NombreRol: "Analista",
          Permisos: 11,
          Estado: "ACTIVO"
        }
      ],
      meta: {
        total: 3,
        page: 1,
        pages: 1,
        limit: 10
      },
      message: "Usuarios obtenidos correctamente (SIMULADO)"
    };
  };
  
  // Interceptar fetch para mock
  const setupFetchInterceptor = function() {
    // Guardar referencia al fetch original
    const originalFetch = window.fetch;
    
    // Reemplazar fetch con nuestra versión
    window.fetch = function(url, options = {}) {
      // Verificar si deberíamos simular esta URL
      if (shouldMockUrl(url)) {
        console.log(`[MOCK API] Interceptando llamada a: ${url}`);
        return Promise.resolve(new Response(
          JSON.stringify(getMockResponse(url, options)),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        ));
      }
      
      // Comprobar si es una llamada a la lista de usuarios
      if (_enabled && url.includes('/api/users') && !url.includes('/api/users/')) {
        console.log(`[MOCK API] Interceptando llamada a lista de usuarios: ${url}`);
        return Promise.resolve(new Response(
          JSON.stringify(getMockUsersList()),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        ));
      }
      
      // Si no es una URL simulada, usar fetch original
      return originalFetch(url, options);
    };
    
    console.log('[MOCK API] Interceptor de fetch configurado');
  };
  
  // Inicializar interceptor
  setupFetchInterceptor();
  
  // Public API
  return {
    setEnabled,
    isEnabled,
    getMockUserProfile,
    getMockUserActivity,
    getMockUsersList
  };
})();

// Asignar al namespace global
window.OFICRI.mockApiResponses = mockApiResponses;

// Exportar para ES modules
export { mockApiResponses }; 