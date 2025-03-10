# OFICRI - Cliente

Este directorio contiene el código del lado del cliente para el Sistema de Gestión OFICRI.

## Estructura del Proyecto

```
client/
├── public/              # Archivos estáticos públicos
│   ├── assets/          # Recursos (imágenes, fuentes, etc.)
│   ├── index.html       # Página principal (login)
│   └── admin.html       # Página de administración
├── src/                 # Código fuente
│   ├── components/      # Componentes reutilizables
│   │   ├── Header/      # Componente de cabecera
│   │   └── Sidebar/     # Componente de barra lateral
│   ├── config/          # Configuraciones
│   ├── pages/           # Páginas de la aplicación
│   │   ├── admin/       # Páginas de administración
│   │   └── auth/        # Páginas de autenticación
│   ├── services/        # Servicios (API, autenticación, etc.)
│   ├── styles/          # Estilos CSS
│   │   ├── components/  # Estilos de componentes
│   │   ├── layouts/     # Estilos de layouts
│   │   └── pages/       # Estilos de páginas
│   ├── utils/           # Utilidades y helpers
│   └── index.js         # Punto de entrada principal
└── README.md            # Documentación
```

## Arquitectura Modular

El proyecto está organizado de manera modular para facilitar la reutilización de código y la mantenibilidad:

### Módulos CSS

Los estilos están organizados en módulos CSS que se importan en el archivo principal `main.css`:

- **components/**: Estilos para componentes reutilizables (header, sidebar, forms, buttons, cards, tables)
- **layouts/**: Estilos para layouts generales (grid, containers)
- **pages/**: Estilos específicos para páginas (login, admin, dashboard)

### Módulos JavaScript

El código JavaScript está organizado en módulos que se importan y exportan a través de archivos index:

- **components/**: Componentes reutilizables (Header, Sidebar)
- **services/**: Servicios para comunicación con el backend (AuthService)
- **utils/**: Utilidades y helpers (navigation)

## Cómo Importar Módulos

Para importar módulos en nuevos archivos HTML, sigue estos pasos:

### 1. Importar Estilos

```html
<link rel="stylesheet" href="/src/styles/main.css">
```

### 2. Importar JavaScript

Puedes importar los módulos de dos maneras:

#### Opción 1: Importación a través del módulo principal (para nuevos archivos HTML)

```html
<script type="module">
  import { components, services, utils } from '/src/index.js';
  
  // Usar componentes
  const { Header, Sidebar } = components;
  const header = new Header();
  
  // Usar servicios
  const { AuthService } = services;
  
  // Usar utilidades
  const { navigation } = utils;
</script>
```

#### Opción 2: Importación directa (recomendada para componentes y servicios)

```html
<script type="module">
  // Importar componentes directamente
  import Header from '/src/components/Header/Header.js';
  import Sidebar from '/src/components/Sidebar/Sidebar.js';
  
  // Importar servicios directamente
  import AuthService from '/src/services/auth.service.js';
  
  // Importar utilidades directamente
  import * as navigation from '/src/utils/navigation.js';
  
  // Usar los módulos importados
  const header = new Header();
</script>
```

## Agregar Nuevos Módulos

### 1. Agregar un Nuevo Componente

1. Crear el directorio del componente en `src/components/`
2. Crear el archivo JavaScript del componente
3. Crear el archivo CSS en `src/styles/components/`
4. Importar el CSS en `src/styles/main.css`
5. Exportar el componente en `src/components/index.js`

### 2. Agregar un Nuevo Servicio

1. Crear el archivo del servicio en `src/services/`
2. Importar y exportar el servicio en `src/services/services.js`

### 3. Agregar una Nueva Página

1. Crear el directorio de la página en `src/pages/`
2. Crear el archivo JavaScript de la página
3. Crear el archivo CSS en `src/styles/pages/`
4. Importar el CSS en `src/styles/main.css`
5. Crear el archivo HTML en `public/` 