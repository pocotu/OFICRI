# Arquitectura del Sistema OFICRI

## Introducción

El Sistema OFICRI está diseñado con una arquitectura moderna de tres capas que garantiza escalabilidad, seguridad y mantenibilidad. Este documento describe la arquitectura técnica, componentes principales y decisiones de diseño del sistema.

## Arquitectura General

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
├─────────────────────────────────────────────────────────────┤
│  Vue.js 3 SPA                                              │
│  ├── Components (Componentes reutilizables)                │
│  ├── Views (Vistas de páginas)                             │
│  ├── Router (Enrutamiento)                                 │
│  ├── Stores (Pinia - Estado global)                        │
│  └── Services (Servicios de API)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP/HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE APLICACIÓN                       │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express.js API REST                             │
│  ├── Routes (Rutas de API)                                 │
│  ├── Controllers (Lógica de negocio)                       │
│  ├── Middleware (Autenticación, CORS, etc.)                │
│  ├── Services (Servicios de negocio)                       │
│  └── Utils (Utilidades y helpers)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                          MySQL2
                              │
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE DATOS                          │
├─────────────────────────────────────────────────────────────┤
│  MySQL 8.0+ Database                                       │
│  ├── Tables (Tablas principales)                           │
│  ├── Stored Procedures (Procedimientos almacenados)        │
│  ├── Triggers (Disparadores de auditoría)                  │
│  ├── Events (Eventos programados)                          │
│  └── Indexes (Índices de rendimiento)                      │
└─────────────────────────────────────────────────────────────┘
```

## Capa de Presentación (Frontend)

### Tecnologías Principales

- **Vue.js 3**: Framework principal con Composition API
- **Pinia**: Gestión de estado global
- **Vue Router**: Enrutamiento SPA
- **Vite**: Build tool y desarrollo
- **Vue Toastification**: Notificaciones de usuario

### Estructura del Frontend

```
frontend/
├── src/
│   ├── api/              # Servicios de API
│   ├── assets/           # Recursos estáticos
│   ├── components/       # Componentes reutilizables
│   │   ├── common/       # Componentes comunes
│   │   ├── forms/        # Formularios
│   │   └── tables/       # Tablas de datos
│   ├── layouts/          # Layouts de página
│   ├── router/           # Configuración de rutas
│   ├── services/         # Servicios de negocio
│   ├── stores/           # Stores de Pinia
│   ├── utils/            # Utilidades
│   ├── views/            # Vistas de páginas
│   ├── App.vue           # Componente raíz
│   └── main.js           # Punto de entrada
├── public/               # Archivos públicos
└── package.json          # Dependencias
```

### Componentes Clave

#### Gestión de Estado (Pinia)

```javascript
// stores/auth.js
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    permissions: 0
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    hasPermission: (state) => (permission) => 
      (state.permissions & permission) === permission
  },
  
  actions: {
    async login(credentials) {
      // Lógica de autenticación
    }
  }
})
```

#### Servicios de API

```javascript
// services/api.js
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL
    this.token = localStorage.getItem('token')
  }
  
  async request(method, endpoint, data = null) {
    // Lógica de peticiones HTTP
  }
}
```

### Características de UI/UX

- **Responsive Design**: Adaptable a dispositivos móviles y desktop
- **Componentes Reutilizables**: Biblioteca de componentes consistente
- **Validación de Formularios**: Validación en tiempo real
- **Feedback Visual**: Toasts, loaders y estados de carga
- **Accesibilidad**: Cumple estándares WCAG 2.1

## Capa de Aplicación (Backend)

### Tecnologías Principales

- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web minimalista
- **MySQL2**: Driver de base de datos con soporte para promesas
- **JWT**: Autenticación basada en tokens
- **bcryptjs**: Hashing de contraseñas
- **Multer**: Manejo de archivos multipart

### Estructura del Backend

```
backend/
├── src/
│   ├── config/           # Configuraciones
│   │   └── index.js      # Configuración principal
│   ├── controllers/      # Controladores de rutas
│   ├── middleware/       # Middleware personalizado
│   ├── services/         # Servicios de negocio
│   ├── utils/            # Utilidades
│   └── index.js          # Punto de entrada
├── routes/               # Definición de rutas
├── uploads/              # Archivos subidos
├── db.js                 # Configuración de BD
└── package.json          # Dependencias
```

### Arquitectura de API REST

#### Estructura de Rutas

```javascript
// routes/documentoRoutes.js
const express = require('express');
const router = express.Router();

// GET /api/documentos - Listar documentos
router.get('/', authMiddleware, getDocumentos);

// POST /api/documentos - Crear documento
router.post('/', authMiddleware, validatePermission(1), createDocumento);

// PUT /api/documentos/:id - Actualizar documento
router.put('/:id', authMiddleware, validatePermission(2), updateDocumento);

// DELETE /api/documentos/:id - Eliminar documento
router.delete('/:id', authMiddleware, validatePermission(4), deleteDocumento);
```

#### Middleware de Seguridad

```javascript
// middleware/auth.js
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
```

### Gestión de Archivos

```javascript
// config/multer.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});
```

## Capa de Datos (Base de Datos)

### Diseño de Base de Datos

#### Modelo Entidad-Relación Principal

```sql
-- Tablas principales
Usuario (IDUsuario, CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol)
Rol (IDRol, NombreRol, Descripcion, NivelAcceso, Permisos)
AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, TipoArea)
Documento (IDDocumento, NroRegistro, NumeroOficioDocumento, IDAreaActual, Estado)
Derivacion (IDDerivacion, IDDocumento, IDAreaOrigen, IDAreaDestino, FechaDerivacion)

-- Tablas de auditoría
UsuarioLog (IDLog, IDUsuario, TipoEvento, IPOrigen, FechaEvento)
DocumentoLog (IDDocumentoLog, IDDocumento, IDUsuario, TipoAccion, FechaEvento)
TrazabilidadDocumento (IDTrazabilidad, IDDocumento, Accion, Fecha)
```

#### Características de la Base de Datos

**Integridad Referencial**
- Claves foráneas con restricciones CASCADE/RESTRICT
- Índices optimizados para consultas frecuentes
- Constraints de validación de datos

**Auditoría Completa**
- Triggers automáticos para logging
- Trazabilidad de todos los cambios
- Geolocalización de accesos por IP

**Procedimientos Almacenados**
```sql
-- Ejemplo: Crear documento con derivación automática
DELIMITER $
CREATE PROCEDURE sp_crear_documento_derivacion(
    IN p_IDMesaPartes INT,
    IN p_IDAreaDestino INT,
    IN p_NroRegistro VARCHAR(50),
    -- ... otros parámetros
)
BEGIN
    START TRANSACTION;
    
    -- Insertar documento
    INSERT INTO Documento (...) VALUES (...);
    SET @documento_id = LAST_INSERT_ID();
    
    -- Crear derivación
    INSERT INTO Derivacion (...) VALUES (...);
    
    -- Registrar trazabilidad
    INSERT INTO TrazabilidadDocumento (...) VALUES (...);
    
    COMMIT;
END$
DELIMITER ;
```

### Optimización de Rendimiento

#### Índices Estratégicos

```sql
-- Índices para consultas frecuentes
CREATE INDEX idx_documento_area_estado ON Documento(IDAreaActual, Estado);
CREATE INDEX idx_usuario_cip ON Usuario(CodigoCIP);
CREATE INDEX idx_derivacion_fecha ON Derivacion(FechaDerivacion);
CREATE INDEX idx_usuariolog_tipo_fecha ON UsuarioLog(TipoEvento, FechaEvento);
```

#### Particionamiento de Tablas

```sql
-- Particionamiento por fecha para logs
ALTER TABLE UsuarioLog 
PARTITION BY RANGE (YEAR(FechaEvento)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

## Seguridad

### Autenticación y Autorización

#### JWT (JSON Web Tokens)

```javascript
// Estructura del token JWT
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "IDUsuario": 123,
    "CodigoCIP": "PNP123456",
    "IDRol": 2,
    "Permisos": 91,
    "IDArea": 5,
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

#### Sistema de Permisos por Bits

```javascript
// Constantes de permisos
const PERMISSIONS = {
  CREAR: 1,      // bit 0
  EDITAR: 2,     // bit 1
  ELIMINAR: 4,   // bit 2
  VER: 8,        // bit 3
  DERIVAR: 16,   // bit 4
  AUDITAR: 32,   // bit 5
  EXPORTAR: 64,  // bit 6
  ADMINISTRAR: 128 // bit 7
};

// Verificación de permisos
const hasPermission = (userPermissions, requiredPermission) => {
  return (userPermissions & requiredPermission) === requiredPermission;
};
```

### Medidas de Seguridad

#### Protección contra Ataques

- **SQL Injection**: Uso de prepared statements
- **XSS**: Sanitización de inputs y CSP headers
- **CSRF**: Tokens CSRF en formularios
- **Rate Limiting**: Límites de peticiones por IP
- **CORS**: Configuración restrictiva de dominios

#### Logging de Seguridad

```javascript
// Middleware de logging de seguridad
const securityLogger = (req, res, next) => {
  const logData = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  };
  
  // Log de accesos sospechosos
  if (isSuspiciousActivity(req)) {
    logSecurityEvent('SUSPICIOUS_ACCESS', logData);
  }
  
  next();
};
```

## Despliegue y Infraestructura

### Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 NGINX (Reverse Proxy)                      │
│  ├── SSL Termination                                       │
│  ├── Static File Serving                                   │
│  ├── Load Balancing                                        │
│  └── Rate Limiting                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 PM2 Process Manager                        │
│  ├── oficri-backend (Node.js App)                         │
│  ├── Auto-restart on failure                              │
│  ├── Cluster mode (if needed)                             │
│  └── Log management                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 MySQL Database                             │
│  ├── InnoDB Storage Engine                                 │
│  ├── Automated backups                                     │
│  ├── Replication (if needed)                              │
│  └── Performance monitoring                                │
└─────────────────────────────────────────────────────────────┘
```

### Configuración de Producción

#### PM2 Ecosystem

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'oficri-backend',
    script: 'backend/src/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/oficri-backend-error.log',
    out_file: '/var/log/pm2/oficri-backend-out.log',
    log_file: '/var/log/pm2/oficri-backend.log'
  }]
};
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name oficri.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name oficri.example.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location / {
        root /var/www/oficri/public;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Monitoreo y Logging

### Sistema de Logs

#### Estructura de Logs

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'oficri-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Métricas de Rendimiento

#### Monitoreo de Base de Datos

```sql
-- Consultas de monitoreo
SELECT 
    table_name,
    table_rows,
    data_length,
    index_length,
    (data_length + index_length) as total_size
FROM information_schema.tables 
WHERE table_schema = 'oficri_db'
ORDER BY total_size DESC;
```

## Escalabilidad y Futuras Mejoras

### Consideraciones de Escalabilidad

#### Horizontal Scaling
- **Load Balancing**: Múltiples instancias de la aplicación
- **Database Sharding**: Particionamiento de datos por área
- **CDN**: Distribución de contenido estático
- **Microservicios**: Separación de funcionalidades específicas

#### Vertical Scaling
- **Optimización de consultas**: Índices y query optimization
- **Caching**: Redis para sesiones y datos frecuentes
- **Connection Pooling**: Gestión eficiente de conexiones DB

### Roadmap Técnico

#### Corto Plazo (3-6 meses)
- Implementación de cache con Redis
- Optimización de consultas de base de datos
- Mejoras en la interfaz de usuario
- Tests automatizados

#### Mediano Plazo (6-12 meses)
- API GraphQL para consultas complejas
- Notificaciones en tiempo real (WebSockets)
- Aplicación móvil nativa
- Integración con sistemas externos

#### Largo Plazo (1-2 años)
- Arquitectura de microservicios
- Machine Learning para análisis predictivo
- Blockchain para trazabilidad inmutable
- Integración con IoT para evidencia digital

---

**Nota**: Esta arquitectura está diseñada para ser robusta, segura y escalable, cumpliendo con los requerimientos específicos del entorno policial y criminalístico.