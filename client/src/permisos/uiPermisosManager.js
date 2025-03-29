/**
 * OFICRI UI Permisos Manager
 * Gestiona la visualización condicional de elementos UI según permisos
 * Cumple con ISO/IEC 27001 para el principio de mínimo privilegio
 */

// Importar servicio de permisos
import { permisosService, PERMISOS } from './permisosService.js';

// Módulo UI Permisos Manager
const uiPermisosManager = (function() {
  'use strict';
  
  /**
   * Inicializa el gestor de UI en función de permisos
   * @param {Object} options - Opciones de configuración
   */
  const init = function(options = {}) {
    const defaults = {
      autoAplicar: true,     // Aplicar permisos automáticamente al cargar
      selector: '[data-permiso]'
    };
    
    // Combinar opciones
    const config = { ...defaults, ...options };
    
    // Aplicar permisos a la UI automáticamente
    if (config.autoAplicar) {
      // Esperar a que el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => aplicarPermisos(config));
      } else {
        aplicarPermisos(config);
      }
    }
    
    // Configurar MutationObserver para nuevos elementos del DOM si se especifica
    if (config.observarDom) {
      _configurarObservador();
    }
  };
  
  /**
   * Configura un MutationObserver para detectar nuevos elementos en el DOM y aplicar permisos
   * @private
   */
  const _configurarObservador = function() {
    // Crear observador para nuevos elementos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Verificar si los nuevos nodos tienen el atributo data-permiso
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Si el elemento tiene data-permiso
              if (node.hasAttribute('data-permiso')) {
                _aplicarPermisoAElemento(node);
              }
              
              // Verificar elementos hijos
              const elementosConPermiso = node.querySelectorAll('[data-permiso]');
              if (elementosConPermiso.length > 0) {
                elementosConPermiso.forEach(el => _aplicarPermisoAElemento(el));
              }
            }
          });
        }
      });
    });
    
    // Iniciar observación
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };
  
  /**
   * Aplica reglas de permisos a un elemento específico
   * @param {HTMLElement} elemento - Elemento a procesar
   * @private
   */
  const _aplicarPermisoAElemento = function(elemento) {
    // Obtener el valor del permiso
    const permisoValor = parseInt(elemento.getAttribute('data-permiso'), 10);
    
    // Si no es un número válido, salir
    if (isNaN(permisoValor)) return;
    
    // Verificar si el usuario tiene el permiso
    if (!permisosService.tienePermiso(permisoValor)) {
      // Si no tiene permisos, ocultar o deshabilitar
      const accion = elemento.getAttribute('data-permiso-accion') || 'ocultar';
      
      switch (accion) {
        case 'ocultar':
          elemento.style.display = 'none';
          break;
        case 'deshabilitar':
          elemento.disabled = true;
          elemento.classList.add('disabled');
          break;
        case 'mensaje':
          elemento.innerHTML = '<i class="fa fa-lock"></i> ' + 
            (elemento.getAttribute('data-permiso-mensaje') || 'No autorizado');
          elemento.classList.add('no-autorizado');
          break;
      }
    } else {
      // Tiene permisos, mostrar o habilitar
      if (elemento.style.display === 'none') {
        elemento.style.display = '';
      }
      elemento.disabled = false;
      elemento.classList.remove('disabled', 'no-autorizado');
    }
  };
  
  /**
   * Aplica permisos a todos los elementos con el atributo data-permiso
   * @param {Object} options - Opciones de configuración
   */
  const aplicarPermisos = function(options = {}) {
    const defaults = {
      selector: '[data-permiso]',
      scope: document
    };
    
    // Combinar opciones
    const config = { ...defaults, ...options };
    
    // Seleccionar todos los elementos con el atributo data-permiso
    const elementos = config.scope.querySelectorAll(config.selector);
    
    // Aplicar permisos a cada elemento
    elementos.forEach(elemento => _aplicarPermisoAElemento(elemento));
    
    // También aplicar a menús dinámicos
    _aplicarPermisosAMenus();
  };
  
  /**
   * Aplica permisos a elementos de menú basados en data-menu-permiso
   * @private
   */
  const _aplicarPermisosAMenus = function() {
    // Obtener todos los items de menú
    const menuItems = document.querySelectorAll('.nav-item, .menu-item, .sidebar-item');
    
    menuItems.forEach(item => {
      // Verificar si tiene el atributo data-menu-permiso
      if (item.hasAttribute('data-menu-permiso')) {
        const permisoValor = parseInt(item.getAttribute('data-menu-permiso'), 10);
        
        // Si no es un número válido, salir
        if (isNaN(permisoValor)) return;
        
        // Verificar si el usuario tiene el permiso
        if (!permisosService.tienePermiso(permisoValor)) {
          // No tiene permiso, ocultar
          item.style.display = 'none';
        } else {
          // Tiene permiso, mostrar
          item.style.display = '';
        }
      }
    });
  };
  
  /**
   * Construye un menú o sección dinámica basada en permisos
   * @param {Array} items - Array de items a mostrar
   * @param {Object} options - Opciones de configuración
   * @returns {DocumentFragment} Fragmento con los elementos
   */
  const construirMenuDinamico = function(items, options = {}) {
    const defaults = {
      template: null,    // Plantilla HTML para cada ítem
      container: null,   // Contenedor donde insertar los ítems
      clasePadre: 'menu-items',
      claseItem: 'menu-item',
      fnRender: null     // Función de renderizado personalizada
    };
    
    // Combinar opciones
    const config = { ...defaults, ...options };
    
    // Crear fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    // Filtrar items según permisos
    const itemsFiltrados = items.filter(item => {
      // Si no tiene propiedad 'permiso', mostrar siempre
      if (!item.permiso) return true;
      
      // Verificar permiso
      return permisosService.tienePermiso(item.permiso);
    });
    
    // Renderizar cada item
    itemsFiltrados.forEach(item => {
      let element;
      
      // Si hay función de renderizado personalizada, usarla
      if (config.fnRender && typeof config.fnRender === 'function') {
        element = config.fnRender(item);
      } 
      // Si hay plantilla, usarla
      else if (config.template) {
        const template = document.createElement('template');
        
        // Reemplazar variables en la plantilla
        let htmlTemplate = config.template
          .replace(/\${([^{}]*)}/g, (match, expr) => {
            return item[expr] || '';
          });
        
        template.innerHTML = htmlTemplate.trim();
        element = template.content.firstChild;
      } 
      // Crear elemento simple
      else {
        element = document.createElement('div');
        element.classList.add(config.claseItem);
        element.textContent = item.texto || item.nombre || '';
        
        if (item.url) {
          const link = document.createElement('a');
          link.href = item.url;
          link.textContent = element.textContent;
          element.textContent = '';
          element.appendChild(link);
        }
        
        if (item.icono) {
          const icono = document.createElement('i');
          icono.className = item.icono;
          element.insertBefore(icono, element.firstChild);
        }
      }
      
      // Añadir el elemento al fragmento
      fragment.appendChild(element);
    });
    
    // Si se especificó un contenedor, insertar los elementos
    if (config.container) {
      const container = typeof config.container === 'string' 
        ? document.querySelector(config.container) 
        : config.container;
      
      if (container) {
        container.innerHTML = '';
        container.appendChild(fragment);
      }
    }
    
    return fragment;
  };
  
  /**
   * Aplica permisos a un componente o página específica
   * @param {string} nombreComponente - Nombre del componente
   * @param {Object} config - Configuración específica del componente
   */
  const aplicarPermisosComponente = function(nombreComponente, config = {}) {
    // Mapeo de componentes a conjuntos de permisos requeridos
    const permisosComponentes = {
      'administracion-usuarios': PERMISOS.VER | PERMISOS.CREAR | PERMISOS.EDITAR,
      'modificar-usuario': PERMISOS.EDITAR,
      'crear-usuario': PERMISOS.CREAR,
      'eliminar-usuario': PERMISOS.ELIMINAR,
      'bloquear-usuario': PERMISOS.BLOQUEAR,
      'exportar-usuarios': PERMISOS.EXPORTAR,
      
      'administracion-documentos': PERMISOS.VER,
      'crear-documento': PERMISOS.CREAR,
      'modificar-documento': PERMISOS.EDITAR,
      'eliminar-documento': PERMISOS.ELIMINAR,
      'derivar-documento': PERMISOS.DERIVAR,
      'exportar-documentos': PERMISOS.EXPORTAR,
      
      'auditoria': PERMISOS.AUDITAR,
      'exportar-auditoria': PERMISOS.AUDITAR | PERMISOS.EXPORTAR,
      
      'dashboard': PERMISOS.VER
    };
    
    // Si el componente está en el mapeo, verificar los permisos
    if (nombreComponente in permisosComponentes) {
      const permisoRequerido = permisosComponentes[nombreComponente];
      
      // Verificar si tiene los permisos necesarios
      const tieneAcceso = permisosService.tienePermiso(permisoRequerido);
      
      // Si no tiene acceso, manejar según la configuración
      if (!tieneAcceso) {
        // Registrar intento de acceso no autorizado
        permisosService.registrarAccesoNoAutorizado(
          nombreComponente, 
          `No tiene los permisos requeridos (${permisosService.permisosATexto(permisoRequerido).join(', ')})`
        );
        
        // Acción a realizar si no tiene permisos
        const accion = config.accionNoAutorizado || 'ocultar';
        
        switch(accion) {
          case 'redirigir':
            // Redirigir a otra página
            window.location.href = config.urlRedireccion || '/';
            break;
          case 'mensaje':
            // Mostrar mensaje de error
            if (config.selectorContenedor) {
              const contenedor = document.querySelector(config.selectorContenedor);
              if (contenedor) {
                contenedor.innerHTML = config.mensajeNoAutorizado || 
                  '<div class="alert alert-danger">No tiene permisos para acceder a esta función</div>';
              }
            }
            break;
          case 'ocultar':
          default:
            // Ocultar el componente
            if (config.selectorComponente) {
              const componente = document.querySelector(config.selectorComponente);
              if (componente) {
                componente.style.display = 'none';
              }
            }
            break;
        }
        
        return false;
      }
      
      return true;
    }
    
    // Si el componente no está mapeado, permitir el acceso por defecto
    return true;
  };
  
  /**
   * Actualiza dinámicamente la UI cuando cambian los permisos
   * @param {number|null} nuevosPermisos - Nuevos permisos a aplicar
   */
  const actualizarUI = function(nuevosPermisos = null) {
    // Si se especificaron nuevos permisos, actualizar caché
    if (nuevosPermisos !== null) {
      // Invalidar la caché de permisos para forzar recarga
      permisosService.invalidarCache();
    }
    
    // Reaplicar permisos a todos los elementos
    aplicarPermisos();
  };
  
  // API pública
  return {
    init,
    aplicarPermisos,
    construirMenuDinamico,
    aplicarPermisosComponente,
    actualizarUI
  };
})();

// Exportar módulo
export { uiPermisosManager };

// Para compatibilidad con navegadores antiguos
window.OFICRI = window.OFICRI || {};
window.OFICRI.uiPermisosManager = uiPermisosManager; 