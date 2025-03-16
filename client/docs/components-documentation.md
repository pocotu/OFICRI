# Documentación de Componentes

## Índice
1. [Componentes Base](#componentes-base)
2. [Componentes de Layout](#componentes-de-layout)
3. [Componentes de Formularios](#componentes-de-formularios)
4. [Componentes de Tablas](#componentes-de-tablas)
5. [Componentes de Navegación](#componentes-de-navegación)

## Componentes Base

### Header
```javascript
class Header {
    /**
     * Inicializa el componente Header
     * @param {string} containerId - ID del contenedor
     */
    constructor(containerId)

    /**
     * Renderiza el header
     * @returns {void}
     */
    render()

    /**
     * Actualiza el estado del header
     * @param {Object} state - Nuevo estado
     * @returns {void}
     */
    updateState(state)
}
```

### Sidebar
```javascript
class Sidebar {
    /**
     * Inicializa el componente Sidebar
     * @param {string} containerId - ID del contenedor
     */
    constructor(containerId)

    /**
     * Renderiza el sidebar
     * @returns {void}
     */
    render()

    /**
     * Actualiza los permisos del sidebar
     * @param {Array} permissions - Lista de permisos
     * @returns {void}
     */
    updatePermissions(permissions)
}
```

## Componentes de Layout

### MainLayout
```javascript
class MainLayout {
    /**
     * Inicializa el layout principal
     * @param {Object} config - Configuración del layout
     */
    constructor(config)

    /**
     * Renderiza el layout
     * @returns {void}
     */
    render()

    /**
     * Actualiza el contenido principal
     * @param {string} content - Contenido HTML
     * @returns {void}
     */
    updateContent(content)
}
```

### FormLayout
```javascript
class FormLayout {
    /**
     * Inicializa el layout de formulario
     * @param {Object} config - Configuración del formulario
     */
    constructor(config)

    /**
     * Renderiza el formulario
     * @returns {void}
     */
    render()

    /**
     * Valida el formulario
     * @returns {boolean}
     */
    validate()
}
```

## Componentes de Formularios

### InputField
```javascript
class InputField {
    /**
     * Inicializa el campo de entrada
     * @param {Object} config - Configuración del campo
     */
    constructor(config)

    /**
     * Renderiza el campo
     * @returns {void}
     */
    render()

    /**
     * Obtiene el valor del campo
     * @returns {string}
     */
    getValue()

    /**
     * Establece el valor del campo
     * @param {string} value - Nuevo valor
     * @returns {void}
     */
    setValue(value)
}
```

### SelectField
```javascript
class SelectField {
    /**
     * Inicializa el campo de selección
     * @param {Object} config - Configuración del campo
     */
    constructor(config)

    /**
     * Renderiza el campo
     * @returns {void}
     */
    render()

    /**
     * Actualiza las opciones
     * @param {Array} options - Lista de opciones
     * @returns {void}
     */
    updateOptions(options)
}
```

## Componentes de Tablas

### DataTable
```javascript
class DataTable {
    /**
     * Inicializa la tabla de datos
     * @param {Object} config - Configuración de la tabla
     */
    constructor(config)

    /**
     * Renderiza la tabla
     * @returns {void}
     */
    render()

    /**
     * Actualiza los datos
     * @param {Array} data - Nuevos datos
     * @returns {void}
     */
    updateData(data)

    /**
     * Aplica filtros
     * @param {Object} filters - Filtros a aplicar
     * @returns {void}
     */
    applyFilters(filters)
}
```

### Pagination
```javascript
class Pagination {
    /**
     * Inicializa la paginación
     * @param {Object} config - Configuración de paginación
     */
    constructor(config)

    /**
     * Renderiza la paginación
     * @returns {void}
     */
    render()

    /**
     * Actualiza la página actual
     * @param {number} page - Número de página
     * @returns {void}
     */
    setCurrentPage(page)
}
```

## Componentes de Navegación

### Breadcrumb
```javascript
class Breadcrumb {
    /**
     * Inicializa el breadcrumb
     * @param {Object} config - Configuración del breadcrumb
     */
    constructor(config)

    /**
     * Renderiza el breadcrumb
     * @returns {void}
     */
    render()

    /**
     * Actualiza la ruta
     * @param {Array} path - Nueva ruta
     * @returns {void}
     */
    updatePath(path)
}
```

### NavigationMenu
```javascript
class NavigationMenu {
    /**
     * Inicializa el menú de navegación
     * @param {Object} config - Configuración del menú
     */
    constructor(config)

    /**
     * Renderiza el menú
     * @returns {void}
     */
    render()

    /**
     * Actualiza los permisos del menú
     * @param {Array} permissions - Lista de permisos
     * @returns {void}
     */
    updatePermissions(permissions)
}
```

## Uso de Componentes

### Ejemplo de Implementación

```javascript
// Inicialización de componentes
const header = new Header('header-container');
const sidebar = new Sidebar('sidebar-container');
const mainLayout = new MainLayout({
    header: header,
    sidebar: sidebar
});

// Renderizado
mainLayout.render();

// Actualización de estado
header.updateState({
    user: currentUser,
    notifications: notifications
});

// Actualización de permisos
sidebar.updatePermissions(userPermissions);
```

### Estilos y Temas

Los componentes utilizan Bootstrap para estilos y pueden ser personalizados mediante clases CSS:

```css
/* Ejemplo de personalización */
.custom-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}

.custom-sidebar {
    background-color: #343a40;
    color: #ffffff;
}
```

### Eventos y Callbacks

Los componentes emiten eventos que pueden ser escuchados:

```javascript
// Ejemplo de manejo de eventos
header.on('userUpdate', (user) => {
    console.log('Usuario actualizado:', user);
});

sidebar.on('menuClick', (item) => {
    console.log('Menú seleccionado:', item);
});
``` 