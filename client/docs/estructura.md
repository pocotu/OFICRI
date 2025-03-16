# Estructura del Proyecto OFICRI

Este documento describe la estructura de directorios y archivos del proyecto OFICRI, siguiendo una arquitectura modular y principios de seguridad ISO 27001.

## Estructura de Directorios

```
client/
├── public/                   # Archivos estáticos públicos
├── src/
│   ├── assets/               # Recursos estáticos (imágenes, iconos, etc.)
│   │   ├── base/             # Componentes base genéricos (botones, tarjetas, etc.)
│   │   ├── composite/        # Componentes compuestos por otros componentes
│   │   │   ├── Header/       # Componente de cabecera
│   │   │   ├── Sidebar/      # Componente de barra lateral
│   │   │   ├── UserProfile/  # Componente de perfil de usuario
│   │   │   └── ...          # Otros componentes compuestos
│   │   └── layout/           # Componentes de estructura/layout
│   ├── config/               # Configuraciones
│   │   ├── menu.config.js    # Configuración de menú (independiente de rol)
│   │   ├── roles.config.js   # Definición de roles y permisos
│   │   └── security.config.js # Configuraciones de seguridad ISO 27001
│   ├── contexts/             # Contextos y estados compartidos
│   │   ├── AuthContext.js    # Contexto de autenticación
│   │   ├── PermissionContext.js # Contexto de permisos
│   │   └── ...              # Otros contextos
│   ├── modules/              # Módulos funcionales
│   │   ├── auth/             # Módulo de autenticación
│   │   ├── user/             # Módulo de gestión de usuarios
│   │   ├── documents/        # Módulo de gestión de documentos
│   │   └── ...              # Otros módulos
│   ├── pages/                # Páginas de la aplicación
│   │   ├── auth/             # Páginas de autenticación
│   │   ├── admin/            # Páginas de administración
│   │   ├── user/             # Páginas de usuario estándar
│   │   └── shared/           # Páginas compartidas entre roles
│   ├── services/             # Servicios
│   │   ├── api/              # Servicios de API
│   │   │   ├── apiClient.js  # Cliente API base
│   │   │   ├── auth.api.js   # Endpoints de autenticación
│   │   │   └── ...          # Otros servicios API
│   │   ├── security/         # Servicios de seguridad (ISO 27001)
│   │   │   ├── crypto.js     # Funciones criptográficas
│   │   │   ├── logging.js    # Registro de eventos de seguridad
│   │   │   └── validation.js # Validación de datos
│   ├── styles/               # Estilos CSS
│   ├── utils/                # Utilidades
│   │   ├── permission.js     # Utilidades de permisos
│   │   ├── validation.js     # Validación de datos
│   │   ├── security.js       # Utilidades de seguridad
│   │   └── ...              # Otras utilidades
│   ├── constants/            # Constantes de la aplicación
│   │   ├── permissions.js    # Constantes de permisos
│   │   ├── securityPolicies.js # Políticas de seguridad ISO 27001
│   │   └── ...              # Otras constantes
│   └── index.js              # Punto de entrada
```

## Descripción de Directorios

### `/public`
- Contiene archivos estáticos públicos como `index.html`, favicon, etc.
- No requiere procesamiento por el bundler

### `/src/assets`
- Recursos estáticos como imágenes, iconos, fuentes, etc.
- Organizados por tipo de recurso

### `/src/components`
- **base/**: Componentes UI básicos reutilizables
- **composite/**: Componentes que combinan otros componentes
- **layout/**: Componentes de estructura y disposición

### `/src/config`
- Archivos de configuración centralizados
- Incluye configuraciones de menú, roles y seguridad

### `/src/contexts`
- Contextos de React para estado global
- Manejo de autenticación y permisos

### `/src/modules`
- Módulos funcionales independientes
- Cada módulo tiene su propia lógica y componentes

### `/src/pages`
- Componentes de página completos
- Organizados por área funcional

### `/src/services`
- Servicios para comunicación con API
- Implementaciones de seguridad

### `/src/utils`
- Funciones utilitarias
- Herramientas de validación y seguridad

### `/src/constants`
- Constantes y configuraciones globales
- Políticas de seguridad y permisos

## Convenciones de Nombrado

- **Archivos**: `camelCase.js`
- **Componentes**: `PascalCase.js`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Funciones**: `camelCase()`
- **Clases**: `PascalCase`

## Estructura de Componentes

Cada componente debe seguir esta estructura:

```
ComponentName/
├── index.js           # Exportación principal
├── ComponentName.js   # Lógica del componente
├── ComponentName.css  # Estilos (opcional)
└── __tests__/        # Pruebas unitarias
```

## Seguridad

- Todos los componentes deben seguir las políticas de seguridad ISO 27001
- Validación de entrada en todos los formularios
- Sanitización de datos para prevenir XSS
- Protección CSRF en todas las peticiones API
- Logging de eventos de seguridad 