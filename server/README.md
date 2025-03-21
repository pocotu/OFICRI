# OFICRI API Server

API del Sistema de Gestión OFICRI que cumple con los estándares de seguridad ISO/IEC 27001.

## Arquitectura

La arquitectura del servidor sigue las mejores prácticas de seguridad y escalabilidad:

```
server/
├── config/                       # Configuración
│   ├── database.js               # Conexión a base de datos
│   ├── security.js               # Configuración de seguridad
│   ├── logger.js                 # Configuración de registros
│   └── ...                       # Otras configuraciones
│
├── middleware/                   # Middlewares personalizados
│   ├── auth/                     # Middleware de autenticación
│   ├── security/                 # Middleware de seguridad
│   ├── validation/               # Validación de datos
│   └── ...                       # Otros middlewares
│
├── models/                       # Modelos de datos
│   ├── user/                     # Modelos de usuario
│   ├── document/                 # Modelos de documentos
│   ├── security/                 # Modelos de seguridad
│   └── ...                       # Otros modelos
│
├── services/                     # Lógica de negocio
│   ├── auth/                     # Servicios de autenticación
│   ├── user/                     # Servicios de usuario
│   ├── document/                 # Servicios de documentos
│   └── ...                       # Otros servicios
│
├── controllers/                  # Controladores de rutas
│   ├── auth.controller.js        # Controlador de autenticación
│   ├── user.controller.js        # Controlador de usuarios
│   └── ...                       # Otros controladores
│
├── routes/                       # Rutas API
│   ├── auth.routes.js            # Rutas de autenticación
│   ├── user.routes.js            # Rutas de usuarios
│   └── ...                       # Otras rutas
│
├── utils/                        # Utilidades
│   ├── logger/                   # Utilidades de registro
│   ├── validation/               # Utilidades de validación
│   └── ...                       # Otras utilidades
│
├── scripts/                      # Scripts de mantenimiento
│   ├── init-database.js          # Inicialización de datos
│   ├── run-sql-file.js           # Ejecutor de scripts SQL
│   ├── setup.js                  # Configuración inicial
│   └── ...                       # Otros scripts
│
├── tests/                        # Pruebas automatizadas
├── docs/                         # Documentación
├── server.js                     # Punto de entrada
└── package.json                  # Dependencias
```

## Requisitos del Sistema

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm >= 7.0.0

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd oficri
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita el archivo .env con los valores correctos
# Asegúrate de incluir la configuración de la base de datos:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=tupassword
# DB_NAME=Oficri_sistema
```

4. Inicializa la base de datos:
```bash
# Proceso completo de inicialización
npm run init

# O paso a paso:
# 1. Crear estructura de la base de datos
npm run db:init

# 2. Configurar datos iniciales
npm run db:setup
```

Después de la inicialización, puedes acceder al sistema con:
- **CIP**: 12345678
- **Contraseña**: Admin123!

⚠️ **IMPORTANTE**: Por razones de seguridad, cambia inmediatamente la contraseña predeterminada después del primer inicio de sesión.

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Desarrollo con Mock Server
```bash
npm run mock
```

### Desarrollo (Frontend + Backend)
```bash
npm run dev:all
```

### Desarrollo (Frontend + Mock Server)
```bash
npm run dev:mock
```

### Producción
```bash
npm start
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cierre de sesión
- `GET /api/auth/check` - Verificar autenticación
- `POST /api/auth/refresh-token` - Refrescar token de acceso
- `POST /api/auth/password/reset-request` - Solicitar reinicio de contraseña
- `POST /api/auth/password/reset` - Reiniciar contraseña
- `POST /api/auth/password/change` - Cambiar contraseña

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `PATCH /api/users/:id/status` - Activar/desactivar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Roles y Permisos
- `GET /api/roles` - Obtener todos los roles
- `GET /api/roles/:id` - Obtener rol por ID
- `POST /api/roles` - Crear nuevo rol
- `PUT /api/roles/:id` - Actualizar rol
- `DELETE /api/roles/:id` - Eliminar rol

### Áreas
- `GET /api/areas` - Obtener todas las áreas
- `GET /api/areas/:id` - Obtener área por ID
- `POST /api/areas` - Crear nueva área
- `PUT /api/areas/:id` - Actualizar área
- `DELETE /api/areas/:id` - Eliminar área

### Mesa de Partes
- `GET /api/mesa-partes` - Obtener todas las mesas de partes
- `GET /api/mesa-partes/:id` - Obtener mesa de partes por ID
- `POST /api/mesa-partes` - Crear nueva mesa de partes
- `PUT /api/mesa-partes/:id` - Actualizar mesa de partes
- `DELETE /api/mesa-partes/:id` - Eliminar mesa de partes

### Documentos
- `GET /api/documents` - Obtener todos los documentos
- `GET /api/documents/:id` - Obtener documento por ID
- `POST /api/documents` - Crear nuevo documento
- `PUT /api/documents/:id` - Actualizar documento
- `PATCH /api/documents/:id/status` - Actualizar estado del documento
- `DELETE /api/documents/:id` - Eliminar documento
- `GET /api/documents/:id/history` - Obtener historial del documento
- `POST /api/documents/:id/derive` - Derivar documento

### Dashboard
- `GET /api/dashboard/summary` - Obtener resumen del dashboard
- `GET /api/dashboard/documents/stats` - Obtener estadísticas de documentos
- `GET /api/dashboard/users/stats` - Obtener estadísticas de usuarios

## Seguridad ISO/IEC 27001

Esta API implementa las siguientes medidas de seguridad según ISO/IEC 27001:

1. **Control de Acceso**
   - Autenticación basada en JWT con tokens de corta duración
   - Control de acceso basado en roles (RBAC)
   - Gestión de sesiones con expiración automática
   - Políticas estrictas de contraseñas

2. **Protección de Datos**
   - Cifrado de datos sensibles
   - Parametrización de consultas SQL
   - Validación y sanitización de entradas
   - Protección contra SQL Injection

3. **Seguridad en Comunicaciones**
   - HTTPS obligatorio en producción
   - Protección CSRF
   - Configuración estricta de CORS
   - Headers de seguridad HTTP

4. **Auditoría y Monitoreo**
   - Registro detallado de eventos
   - Auditoría de actividades críticas
   - Detección de intrusiones
   - Monitoreo de actividad sospechosa

5. **Gestión de Vulnerabilidades**
   - Limitación de tasa de solicitudes
   - Protección contra ataques de fuerza bruta
   - Validación de datos de entrada
   - Manejo seguro de errores

## Pruebas Automatizadas

Este proyecto incluye un conjunto completo de pruebas automatizadas para garantizar la funcionalidad y seguridad:

### Pruebas Generales
```bash
# Ejecutar todas las pruebas
npm test

# Ver cobertura de pruebas
npm run test:coverage
```

### Pruebas Específicas
```bash
# Pruebas de autenticación
npm run test:auth

# Pruebas de API
npm run test:api

# Pruebas de base de datos
npm run test:db

# Pruebas de integración
npm run test:integration
```

### Pruebas de Entidades de Base de Datos
Estas pruebas verifican las operaciones CRUD para las entidades principales del sistema:

```bash
# Ejecutar todas las pruebas de entidades
npm run test:entity

# Pruebas específicas por entidad
npm run test:entity:usuario     # Pruebas de la entidad Usuario
npm run test:entity:area        # Pruebas de la entidad AreaEspecializada
npm run test:entity:documento   # Pruebas de la entidad Documento
npm run test:entity:derivacion  # Pruebas de la entidad Derivacion
```

Las pruebas de entidades comprueban:
- Creación de registros
- Lectura y búsqueda por diferentes criterios
- Actualización de propiedades
- Eliminación de registros
- Verificación de relaciones entre entidades
- Manejo de errores y casos límite

## Licencia

Este proyecto es de uso privado y no se permite su redistribución sin autorización explícita.

© 2024 OFICRI - Oficina de Criminalística Cusco 