# Sistema de Permisos OFICRI

## Descripción

Este sistema implementa un control de acceso basado en permisos mediante operaciones de bits, siguiendo las directrices de seguridad del estándar ISO/IEC 27001. Permite controlar de forma granular el acceso a diversas funcionalidades del sistema según el rol del usuario.

## Estructura de Módulos

El sistema está organizado en varios módulos independientes pero relacionados:

```
client/src/
  ├── permisos/
  │   ├── permisosService.js       # Core del sistema de permisos (lógica de bits)
  │   └── uiPermisosManager.js     # Gestión de UI según permisos
  ├── services/
  │   └── authService.js           # Autenticación y sesión de usuario
  ├── utils/
  │   └── validators.js            # Validaciones de entrada
  ├── ui/
  │   ├── menu.js                  # Gestor de menús basados en permisos
  │   └── notifications.js         # Sistema de notificaciones
  └── api/
      └── apiClient.js             # Cliente API con soporte para autenticación
```

## Sistema de Bits para Permisos

El sistema utiliza 8 bits (0-7) para representar permisos específicos:

1. **bit 0** (1) = Crear
2. **bit 1** (2) = Editar
3. **bit 2** (4) = Eliminar
4. **bit 3** (8) = Ver
5. **bit 4** (16) = Derivar
6. **bit 5** (32) = Auditar
7. **bit 6** (64) = Exportar
8. **bit 7** (128) = Bloquear

## Roles Predefinidos

- **Administrador**: bits 0-7 (valor 255) - Acceso completo a todas las funcionalidades.
- **Mesa de Partes**: bits 0,1,3,4,6 (valor 91) - Crear, Editar, Ver, Derivar, Exportar.
- **Responsable de Área**: bits 0,1,3,4,6 (valor 91) - Mismos permisos que Mesa de Partes.

## Uso de la API de Permisos

### Verificar un Permiso Específico

```javascript
// Verificar si el usuario tiene permiso para crear
if (permisosService.tienePermiso(PERMISOS.CREAR)) {
  // Código para crear un nuevo recurso
}
```

### Verificar Múltiples Permisos

```javascript
// Verificar si tiene todos los permisos
if (permisosService.tieneTodosLosPermisos([PERMISOS.EDITAR, PERMISOS.ELIMINAR])) {
  // Código que requiere ambos permisos
}

// Verificar si tiene al menos un permiso
if (permisosService.tieneAlgunPermiso([PERMISOS.VER, PERMISOS.AUDITAR])) {
  // Código que requiere al menos uno de los permisos
}
```

### Integración con HTML

Usar atributos data para controlar elementos según permisos:

```html
<!-- Este botón solo se mostrará si el usuario tiene permiso para crear -->
<button data-permiso="1" class="btn btn-primary">Crear Nuevo</button>

<!-- Este enlace se deshabilitará si no tiene permiso para eliminar -->
<a href="#" data-permiso="4" data-permiso-accion="deshabilitar">Eliminar</a>
```

En JavaScript, aplicar los permisos a la UI:

```javascript
// Aplicar permisos a todos los elementos con el atributo data-permiso
uiPermisosManager.aplicarPermisos();
```

### Construcción de Menús

```javascript
// Inicializar menú según rol del usuario
menuManager.init({
  tipoMenu: 'admin', // o 'mesaPartes', 'area'
  containerSelector: '#menu-container'
});
```

## Seguridad y Cumplimiento ISO/IEC 27001

El sistema implementa varios controles de seguridad conforme al estándar ISO/IEC 27001:

1. **Control de Acceso (A.9)**: Implementación de permisos granulares y basados en roles.
2. **Gestión de Identidad (A.9.2)**: Autenticación y gestión segura de sesiones.
3. **Validación de Entradas (A.14.2)**: Validación y sanitización de todas las entradas de usuario.
4. **Auditoría (A.12.4)**: Registro detallado de eventos de seguridad y accesos.
5. **Segregación de Responsabilidades (A.9.2.3)**: Separación clara de funciones por rol.

## Integración con Componentes

Para integrar un nuevo componente con el sistema de permisos:

```javascript
// 1. Importar los módulos necesarios
import { permisosService, PERMISOS } from './permisos/permisosService.js';

// 2. Verificar permisos antes de realizar operaciones sensibles
function eliminarUsuario(id) {
  if (!permisosService.tienePermiso(PERMISOS.ELIMINAR)) {
    notifications.error('No tiene permisos para eliminar usuarios');
    return;
  }
  
  // Código para eliminar usuario
}

// 3. Aplicar permisos a la UI del componente
function initComponent() {
  uiPermisosManager.aplicarPermisosComponente('administracion-usuarios', {
    selectorComponente: '#usuario-container',
    accionNoAutorizado: 'mensaje',
    mensajeNoAutorizado: 'No tiene permisos para acceder a esta sección'
  });
}
```

## Mejores Prácticas

1. **Verificación Doble**: Siempre validar permisos tanto en frontend como en backend.
2. **Principio de Mínimo Privilegio**: Asignar solo los permisos necesarios a cada rol.
3. **Auditoría**: Registrar eventos importantes relacionados con cambios de permisos.
4. **No Confiar en el Cliente**: La validación final siempre debe ocurrir en el servidor.
5. **Tiempo de Sesión**: Implementar timeouts de sesión adecuados.

## Mantenimiento y Extensión

Para añadir nuevos permisos al sistema:

1. Modificar las constantes en `permisosService.js` agregando el nuevo bit.
2. Actualizar las funciones relevantes para manejar el nuevo permiso.
3. Actualizar la documentación para reflejar el nuevo permiso.
4. Asegurarse de que los roles existentes tengan valores adecuados para el nuevo permiso.

---

Para más detalles sobre la implementación, consultar los archivos de código fuente en el directorio `/client/src/permisos/`. 