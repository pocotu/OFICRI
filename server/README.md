# OFICRI - Servidor

Este directorio contiene el código del lado del servidor para el Sistema de Gestión OFICRI.

## Estructura del Proyecto

```
server/
├── scripts/             # Scripts de utilidad
│   └── setup.js         # Script de configuración inicial
├── src/                 # Código fuente
│   ├── config/          # Configuraciones
│   │   ├── database.js  # Configuración de la base de datos
│   │   ├── session.js   # Configuración de sesiones
│   │   ├── cors.js      # Configuración de CORS
│   │   └── rateLimit.js # Configuración de rate limiting
│   ├── controllers/     # Controladores
│   │   ├── authController.js  # Controlador de autenticación
│   │   ├── userController.js  # Controlador de usuarios
│   │   └── index.js     # Exportación de controladores
│   ├── middleware/      # Middlewares
│   │   ├── auth.middleware.js # Middleware de autenticación
│   │   └── index.js     # Exportación de middlewares
│   ├── models/          # Modelos
│   │   └── BaseModel.js # Modelo base
│   ├── routes/          # Rutas
│   │   ├── auth.routes.js     # Rutas de autenticación
│   │   ├── user.routes.js     # Rutas de usuarios
│   │   ├── area.routes.js     # Rutas de áreas
│   │   └── mesaPartes.routes.js # Rutas de mesa de partes
│   ├── scripts/         # Scripts internos
│   │   └── init-database.js   # Inicialización de la base de datos
│   ├── services/        # Servicios
│   │   ├── authService.js     # Servicio de autenticación
│   │   ├── userService.js     # Servicio de usuarios
│   │   └── index.js     # Exportación de servicios
│   ├── utils/           # Utilidades
│   │   ├── logger.js    # Utilidad de logging
│   │   ├── errorHandler.js    # Manejo de errores
│   │   └── index.js     # Exportación de utilidades
│   ├── validators/      # Validadores
│   │   ├── authValidator.js   # Validador de autenticación
│   │   ├── userValidator.js   # Validador de usuarios
│   │   └── index.js     # Exportación de validadores
│   └── interfaces/      # Interfaces
│       └── BaseService.js     # Interfaz de servicio base
└── server.js            # Punto de entrada principal
```

## Arquitectura Modular

El proyecto está organizado siguiendo una arquitectura modular que separa claramente las responsabilidades:

### Controladores

Los controladores manejan las solicitudes HTTP y delegan la lógica de negocio a los servicios. Cada controlador:
- Recibe y valida los datos de entrada
- Llama a los servicios correspondientes
- Formatea y envía las respuestas

### Servicios

Los servicios contienen la lógica de negocio de la aplicación. Cada servicio:
- Implementa operaciones específicas del dominio
- Interactúa con la base de datos a través de modelos
- Maneja errores específicos del dominio

### Modelos

Los modelos representan las entidades de la base de datos y proporcionan métodos para interactuar con ellas.

### Rutas

Las rutas definen los endpoints de la API y conectan las solicitudes HTTP con los controladores correspondientes.

### Middlewares

Los middlewares procesan las solicitudes antes de que lleguen a los controladores. Se utilizan para:
- Autenticación y autorización
- Validación de datos
- Manejo de errores

### Validadores

Los validadores verifican que los datos de entrada cumplan con los requisitos antes de procesarlos.

### Utilidades

Las utilidades proporcionan funcionalidades comunes utilizadas en toda la aplicación, como logging y manejo de errores.

## Cómo Importar Módulos

Para importar módulos en otros archivos, sigue estos patrones:

### Importar Controladores

```javascript
const { authController, userController } = require('../controllers/controllersExport');
```

### Importar Servicios

```javascript
const { authService, userService } = require('../services/servicesExport');
```

### Importar Middlewares

```javascript
const { authMiddleware, hasPermission, hasRole } = require('../middleware/middlewareExport');
```

### Importar Utilidades

```javascript
const { logger, errorHandler } = require('../utils/utilsExport');
```

### Importar Validadores

```javascript
const { authValidator, userValidator } = require('../validators/validatorsExport');
```

## Agregar Nuevos Módulos

### 1. Agregar un Nuevo Controlador

1. Crear el archivo del controlador en `src/controllers/`
2. Implementar los métodos del controlador
3. Exportar el controlador en `src/controllers/index.js`

### 2. Agregar un Nuevo Servicio

1. Crear el archivo del servicio en `src/services/`
2. Implementar los métodos del servicio
3. Exportar el servicio en `src/services/index.js`

### 3. Agregar Nuevas Rutas

1. Crear el archivo de rutas en `src/routes/`
2. Definir los endpoints y conectarlos con los controladores
3. Importar y usar las rutas en `server.js`

### 4. Agregar un Nuevo Validador

1. Crear el archivo del validador en `src/validators/`
2. Implementar las funciones de validación
3. Exportar el validador en `src/validators/index.js` 