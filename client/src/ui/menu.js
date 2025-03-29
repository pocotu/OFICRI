/**
 * OFICRI Menu Module
 * Gestiona la creación dinámica de menús basados en permisos
 * Cumple con ISO/IEC 27001 para control de acceso y seguridad
 */

// Importar módulos necesarios
import { permisosService, PERMISOS } from '../permisos/permisosService.js';
import { uiPermisosManager } from '../permisos/uiPermisosManager.js';

// Namespace para compatibilidad
window.OFICRI = window.OFICRI || {};

// Módulo de Menu
const menuManager = (function() {
  'use strict';
  
  // Datos de menús
  const _menuConfigs = {
    // Configuración del menú de administrador
    admin: [
      {
        id: 'dashboard',
        texto: 'Dashboard',
        icono: 'fas fa-tachometer-alt',
        url: '#dashboard',
        permiso: PERMISOS.VER,
        activo: true
      },
      {
        id: 'usuarios',
        texto: 'Gestión de Usuarios',
        icono: 'fas fa-users',
        url: '#usuarios',
        permiso: PERMISOS.VER | PERMISOS.CREAR | PERMISOS.EDITAR,
        submenu: [
          { 
            id: 'usuarios-ver', 
            texto: 'Ver Usuarios', 
            url: '#usuarios/ver',
            permiso: PERMISOS.VER
          },
          { 
            id: 'usuarios-crear', 
            texto: 'Crear Usuario', 
            url: '#usuarios/crear',
            permiso: PERMISOS.CREAR
          },
          { 
            id: 'usuarios-bloquear', 
            texto: 'Bloquear/Desbloquear', 
            url: '#usuarios/bloquear',
            permiso: PERMISOS.BLOQUEAR
          }
        ]
      },
      {
        id: 'roles',
        texto: 'Gestión de Roles',
        icono: 'fas fa-user-tag',
        url: '#roles',
        permiso: PERMISOS.VER | PERMISOS.CREAR | PERMISOS.EDITAR,
        submenu: [
          { 
            id: 'roles-ver', 
            texto: 'Ver Roles', 
            url: '#roles/ver',
            permiso: PERMISOS.VER
          },
          { 
            id: 'roles-crear', 
            texto: 'Crear/Editar Roles', 
            url: '#roles/crear',
            permiso: PERMISOS.CREAR | PERMISOS.EDITAR
          }
        ]
      },
      {
        id: 'areas',
        texto: 'Gestión de Áreas',
        icono: 'fas fa-building',
        url: '#areas',
        permiso: PERMISOS.VER | PERMISOS.CREAR | PERMISOS.EDITAR,
        submenu: [
          { 
            id: 'areas-ver', 
            texto: 'Ver Áreas', 
            url: '#areas/ver',
            permiso: PERMISOS.VER
          },
          { 
            id: 'areas-crear', 
            texto: 'Crear/Editar Áreas', 
            url: '#areas/crear',
            permiso: PERMISOS.CREAR | PERMISOS.EDITAR
          },
          { 
            id: 'areas-historial', 
            texto: 'Historial por Área', 
            url: '#areas/historial',
            permiso: PERMISOS.VER
          }
        ]
      },
      {
        id: 'documentos',
        texto: 'Gestión de Documentos',
        icono: 'fas fa-file-alt',
        url: '#documentos',
        permiso: PERMISOS.VER,
        submenu: [
          { 
            id: 'documentos-ver', 
            texto: 'Ver Documentos', 
            url: '#documentos/ver',
            permiso: PERMISOS.VER
          },
          { 
            id: 'documentos-crear', 
            texto: 'Crear Documento', 
            url: '#documentos/crear',
            permiso: PERMISOS.CREAR
          },
          { 
            id: 'documentos-derivar', 
            texto: 'Derivar Documentos', 
            url: '#documentos/derivar',
            permiso: PERMISOS.DERIVAR
          },
          { 
            id: 'documentos-papelera', 
            texto: 'Papelera', 
            url: '#documentos/papelera',
            permiso: PERMISOS.ELIMINAR
          }
        ]
      },
      {
        id: 'auditoria',
        texto: 'Auditoría',
        icono: 'fas fa-history',
        url: '#auditoria',
        permiso: PERMISOS.AUDITAR,
        submenu: [
          { 
            id: 'auditoria-usuarios', 
            texto: 'Logs de Usuarios', 
            url: '#auditoria/usuarios',
            permiso: PERMISOS.AUDITAR
          },
          { 
            id: 'auditoria-documentos', 
            texto: 'Logs de Documentos', 
            url: '#auditoria/documentos',
            permiso: PERMISOS.AUDITAR
          },
          { 
            id: 'auditoria-sistema', 
            texto: 'Logs del Sistema', 
            url: '#auditoria/sistema',
            permiso: PERMISOS.AUDITAR
          }
        ]
      },
      {
        id: 'exportar',
        texto: 'Exportar',
        icono: 'fas fa-file-export',
        url: '#exportar',
        permiso: PERMISOS.EXPORTAR,
        submenu: [
          { 
            id: 'exportar-logs', 
            texto: 'Exportar Logs', 
            url: '#exportar/logs',
            permiso: PERMISOS.EXPORTAR | PERMISOS.AUDITAR
          },
          { 
            id: 'exportar-documentos', 
            texto: 'Exportar Documentos', 
            url: '#exportar/documentos',
            permiso: PERMISOS.EXPORTAR
          },
          { 
            id: 'exportar-backup', 
            texto: 'Backup BD', 
            url: '#exportar/backup',
            permiso: PERMISOS.EXPORTAR
          }
        ]
      }
    ],
    
    // Configuración del menú de Mesa de Partes
    mesaPartes: [
      {
        id: 'dashboard',
        texto: 'Dashboard',
        icono: 'fas fa-tachometer-alt',
        url: '#dashboard',
        permiso: PERMISOS.VER
      },
      {
        id: 'documentos-recibidos',
        texto: 'Documentos Recibidos',
        icono: 'fas fa-inbox',
        url: '#documentos/recibidos',
        permiso: PERMISOS.VER
      },
      {
        id: 'registrar-expediente',
        texto: 'Registrar Expediente',
        icono: 'fas fa-file-medical',
        url: '#documentos/registrar',
        permiso: PERMISOS.CREAR
      },
      {
        id: 'actualizar-expediente',
        texto: 'Actualizar Expediente',
        icono: 'fas fa-edit',
        url: '#documentos/actualizar',
        permiso: PERMISOS.EDITAR
      },
      {
        id: 'derivar',
        texto: 'Derivar',
        icono: 'fas fa-share',
        url: '#documentos/derivar',
        permiso: PERMISOS.DERIVAR
      },
      {
        id: 'trazabilidad',
        texto: 'Trazabilidad',
        icono: 'fas fa-project-diagram',
        url: '#documentos/trazabilidad',
        permiso: PERMISOS.VER
      },
      {
        id: 'documentos-en-proceso',
        texto: 'Documentos en Proceso',
        icono: 'fas fa-hourglass-half',
        url: '#documentos/en-proceso',
        permiso: PERMISOS.VER
      },
      {
        id: 'documentos-completados',
        texto: 'Documentos Completados',
        icono: 'fas fa-check-circle',
        url: '#documentos/completados',
        permiso: PERMISOS.VER
      },
      {
        id: 'exportar-reportes',
        texto: 'Exportar Reportes',
        icono: 'fas fa-file-export',
        url: '#exportar/reportes',
        permiso: PERMISOS.EXPORTAR
      }
    ],
    
    // Configuración del menú de Responsable de Área
    area: [
      {
        id: 'dashboard',
        texto: 'Dashboard',
        icono: 'fas fa-tachometer-alt',
        url: '#dashboard',
        permiso: PERMISOS.VER
      },
      {
        id: 'documentos-recibidos',
        texto: 'Documentos Recibidos',
        icono: 'fas fa-inbox',
        url: '#documentos/recibidos',
        permiso: PERMISOS.VER
      },
      {
        id: 'registrar-informe',
        texto: 'Registrar Informe',
        icono: 'fas fa-file-medical',
        url: '#informes/registrar',
        permiso: PERMISOS.CREAR
      },
      {
        id: 'editar-resultados',
        texto: 'Editar Resultados',
        icono: 'fas fa-edit',
        url: '#informes/editar',
        permiso: PERMISOS.EDITAR
      },
      {
        id: 'derivar',
        texto: 'Derivar',
        icono: 'fas fa-share',
        url: '#documentos/derivar',
        permiso: PERMISOS.DERIVAR
      },
      {
        id: 'trazabilidad',
        texto: 'Trazabilidad',
        icono: 'fas fa-project-diagram',
        url: '#documentos/trazabilidad',
        permiso: PERMISOS.VER
      },
      {
        id: 'documentos-en-proceso',
        texto: 'Documentos en Proceso',
        icono: 'fas fa-hourglass-half',
        url: '#documentos/en-proceso',
        permiso: PERMISOS.VER
      },
      {
        id: 'documentos-completados',
        texto: 'Documentos Completados',
        icono: 'fas fa-check-circle',
        url: '#documentos/completados',
        permiso: PERMISOS.VER
      },
      {
        id: 'exportar',
        texto: 'Exportar',
        icono: 'fas fa-file-export',
        url: '#exportar',
        permiso: PERMISOS.EXPORTAR
      }
    ]
  };
  
  /**
   * Inicializa el gestor de menús
   * @param {Object} options - Opciones de configuración
   */
  const init = function(options = {}) {
    // Opciones por defecto
    const defaults = {
      autoRender: true,
      tipoMenu: 'admin',
      classMenu: 'sidebar-menu',
      classItem: 'sidebar-item',
      classSubmenu: 'submenu',
      classActive: 'active',
      containerSelector: '.sidebar-nav'
    };
    
    // Combinar opciones
    const config = { ...defaults, ...options };
    
    // Si se debe renderizar automáticamente
    if (config.autoRender) {
      renderMenu(config);
    }
    
    // Configurar manejador de eventos para navegación
    _setupNavigation();
  };
  
  /**
   * Renderiza un menú según permisos del usuario
   * @param {Object} options - Opciones de configuración
   */
  const renderMenu = function(options = {}) {
    // Opciones por defecto
    const defaults = {
      tipoMenu: 'admin',
      classMenu: 'sidebar-menu',
      classItem: 'sidebar-item',
      classSubItem: 'submenu-item',
      classSubmenu: 'submenu',
      classActive: 'active',
      containerSelector: '.sidebar-nav'
    };
    
    // Combinar opciones
    const config = { ...defaults, ...options };
    
    // Obtener el contenedor
    const container = document.querySelector(config.containerSelector);
    if (!container) {
      console.error(`[MENU] No se encontró el contenedor: ${config.containerSelector}`);
      return;
    }
    
    // Obtener la configuración del menú
    const menuConfig = _menuConfigs[config.tipoMenu];
    if (!menuConfig) {
      console.error(`[MENU] No se encontró la configuración para el menú: ${config.tipoMenu}`);
      return;
    }
    
    // Crear fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    // Crear elemento de lista principal
    const menuList = document.createElement('ul');
    menuList.className = config.classMenu;
    
    // Filtrar y construir menú
    menuConfig.forEach(item => {
      // Verificar permisos del item
      if (item.permiso && !permisosService.tienePermiso(item.permiso)) {
        return; // No tiene permiso, omitir item
      }
      
      // Crear elemento de menú
      const menuItem = document.createElement('li');
      menuItem.className = config.classItem;
      menuItem.id = `menu-${item.id}`;
      menuItem.setAttribute('data-menu-id', item.id);
      
      if (item.activo) {
        menuItem.classList.add(config.classActive);
      }
      
      // Crear enlace principal
      const link = document.createElement('a');
      link.href = item.url || '#';
      
      // Crear icono si existe
      if (item.icono) {
        const icon = document.createElement('i');
        icon.className = item.icono;
        link.appendChild(icon);
      }
      
      // Crear texto
      const text = document.createElement('span');
      text.textContent = item.texto;
      link.appendChild(text);
      
      // Si tiene submenú, agregar indicador
      if (item.submenu && item.submenu.length > 0) {
        const hasPermittedSubmenu = item.submenu.some(subItem => 
          !subItem.permiso || permisosService.tienePermiso(subItem.permiso)
        );
        
        if (hasPermittedSubmenu) {
          const indicator = document.createElement('i');
          indicator.className = 'fas fa-angle-down submenu-indicator';
          link.appendChild(indicator);
        }
      }
      
      menuItem.appendChild(link);
      
      // Crear submenú si existe
      if (item.submenu && item.submenu.length > 0) {
        const submenuList = document.createElement('ul');
        submenuList.className = config.classSubmenu;
        
        // Filtrar y construir submenú
        item.submenu.forEach(subItem => {
          // Verificar permisos del subitem
          if (subItem.permiso && !permisosService.tienePermiso(subItem.permiso)) {
            return; // No tiene permiso, omitir subitem
          }
          
          // Crear elemento de submenú
          const submenuItem = document.createElement('li');
          submenuItem.className = config.classSubItem;
          submenuItem.id = `menu-${subItem.id}`;
          submenuItem.setAttribute('data-menu-id', subItem.id);
          
          // Crear enlace
          const subLink = document.createElement('a');
          subLink.href = subItem.url || '#';
          
          // Crear icono si existe
          if (subItem.icono) {
            const subIcon = document.createElement('i');
            subIcon.className = subItem.icono;
            subLink.appendChild(subIcon);
          }
          
          // Crear texto
          const subText = document.createElement('span');
          subText.textContent = subItem.texto;
          subLink.appendChild(subText);
          
          submenuItem.appendChild(subLink);
          submenuList.appendChild(submenuItem);
        });
        
        // Solo agregar submenú si tiene elementos
        if (submenuList.children.length > 0) {
          menuItem.appendChild(submenuList);
        }
      }
      
      menuList.appendChild(menuItem);
    });
    
    // Agregar lista al fragmento
    fragment.appendChild(menuList);
    
    // Limpiar contenedor y agregar fragmento
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // Configurar comportamiento de menú desplegable
    _setupDropdowns(config);
  };
  
  /**
   * Configura el comportamiento de los menús desplegables
   * @param {Object} config - Configuración
   * @private
   */
  const _setupDropdowns = function(config) {
    // Seleccionar todos los items con submenú
    const menuItems = document.querySelectorAll(`.${config.classItem}`);
    
    menuItems.forEach(item => {
      const link = item.querySelector('a');
      const submenu = item.querySelector(`.${config.classSubmenu}`);
      
      if (link && submenu) {
        // Agregar evento click al enlace principal
        link.addEventListener('click', function(e) {
          // Prevenir navegación
          e.preventDefault();
          
          // Toggle clase active
          item.classList.toggle(config.classActive);
          
          // Toggle submenu visibility
          if (submenu.style.maxHeight) {
            submenu.style.maxHeight = null;
          } else {
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
          }
        });
      }
    });
  };
  
  /**
   * Configura la navegación del menú
   * @private
   */
  const _setupNavigation = function() {
    // Manejar cambios de hash
    window.addEventListener('hashchange', _handleNavigation);
    
    // Manejar carga inicial
    document.addEventListener('DOMContentLoaded', () => {
      _handleNavigation();
    });
  };
  
  /**
   * Maneja la navegación por hash
   * @private
   */
  const _handleNavigation = function() {
    // Obtener hash actual
    const hash = window.location.hash || '#dashboard';
    
    // Activar item correspondiente
    _activateMenuItem(hash);
  };
  
  /**
   * Activa un item de menú según el hash
   * @param {string} hash - Hash de la URL
   * @private
   */
  const _activateMenuItem = function(hash) {
    // Seleccionar todos los items
    const menuItems = document.querySelectorAll('.sidebar-item, .submenu-item');
    
    // Desactivar todos
    menuItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Buscar el item que coincide con el hash
    let targetItem = null;
    
    menuItems.forEach(item => {
      const link = item.querySelector('a');
      if (link && link.getAttribute('href') === hash) {
        targetItem = item;
      }
    });
    
    // Si no se encontró coincidencia exacta, buscar parcial
    if (!targetItem) {
      const hashParts = hash.split('/');
      const baseHash = hashParts[0];
      
      menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('href') === baseHash) {
          targetItem = item;
        }
      });
    }
    
    // Activar item encontrado
    if (targetItem) {
      targetItem.classList.add('active');
      
      // Si es un submenu-item, activar también el parent
      if (targetItem.classList.contains('submenu-item')) {
        const parent = targetItem.closest('.sidebar-item');
        if (parent) {
          parent.classList.add('active');
          
          // Expandir submenu
          const submenu = parent.querySelector('.submenu');
          if (submenu) {
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
          }
        }
      }
    }
  };
  
  /**
   * Obtiene configuración de un menú específico
   * @param {string} tipoMenu - Tipo de menú
   * @returns {Array} Configuración del menú
   */
  const getMenuConfig = function(tipoMenu) {
    return _menuConfigs[tipoMenu] || [];
  };
  
  /**
   * Añade una nueva configuración de menú
   * @param {string} nombre - Nombre de la configuración
   * @param {Array} config - Configuración del menú
   */
  const addMenuConfig = function(nombre, config) {
    if (!nombre || !Array.isArray(config)) {
      return false;
    }
    
    _menuConfigs[nombre] = config;
    return true;
  };
  
  // API pública
  return {
    init,
    renderMenu,
    getMenuConfig,
    addMenuConfig
  };
})();

// Exportar para ES modules
export { menuManager };

// Para compatibilidad con navegadores antiguos
window.OFICRI.menuManager = menuManager; 