# OFICRI - Sistema de Gestión Documental

Sistema de gestión documental para el Oficina Criminalística.

## Configuración de Entornos

El sistema soporta tres entornos de ejecución:

- **development**: Entorno de desarrollo local
- **testing**: Entorno de pruebas/QA
- **production**: Entorno de producción

### Variables de Entorno

Para configurar el entorno, copie el archivo `.env.example` a `.env` y ajuste los valores según sea necesario:

```bash
cp .env.example .env
```

La variable `NODE_ENV` determina el comportamiento del sistema. Por defecto está configurada como `development`.

### Consideraciones Importantes por Entorno

#### Entorno de Desarrollo

En el entorno de desarrollo (`NODE_ENV=development`):

- Se activan ayudas para facilitar el desarrollo y pruebas
- Se acepta la contraseña `admin123` para todos los usuarios, independientemente de la contraseña real almacenada
- Los mensajes de error son detallados para facilitar la depuración
- Los logs son más verbosos

**Usuarios de prueba en desarrollo**:

| Rol               | CodigoCIP | Contraseña  |
|-------------------|-----------|-------------|
| Administrador     | 12345678  | admin123    |
| Mesa de Partes    | 23456789  | admin123    |
| Responsable Área  | 34567890  | admin123    |
| Operador          | 67890123  | admin123    |

#### Entorno de Producción

En el entorno de producción (`NODE_ENV=production`):

- Se desactivan todas las ayudas de desarrollo
- Solo se aceptan contraseñas que coincidan con el hash almacenado en la base de datos
- Los mensajes de error son genéricos para mayor seguridad
- Se implementa rate limiting para prevenir ataques de fuerza bruta
- El nivel de logs se reduce para minimizar información sensible

## Instalación y Ejecución

### Requisitos Previos

- Node.js 16.x o superior
- MySQL 8.0 o superior
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env según su entorno

# Inicializar base de datos (solo primera vez)
npm run init-db

# Crear usuario administrador (solo primera vez)
npm run create-admin
```

### Ejecución

```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm run start
```

## Documentación

La documentación completa de la API está disponible en:

- [/api/docs](http://localhost:3000/api/docs) - Documentación Swagger de la API
- [server/docs/](./server/docs/) - Documentación técnica
- [docs/](./docs/) - Guías y ejemplos para desarrollo frontend

## Pruebas

```bash
# Ejecutar pruebas unitarias
npm run test

# Ejecutar pruebas de integración
npm run test:integration

# Ejecutar todas las pruebas
npm run test:all
```

## Características Principales

- **Sistema de Permisos Basado en Bits**: Implementación de permisos granulares utilizando operaciones a nivel de bits.
- **Permisos Contextuales**: Permisos dinámicos según el contexto (propietario, área, tiempo, etc.).
- **Gestión Documental**: Control completo del ciclo de vida de documentos.
- **Mesa de Partes**: Módulo de recepción y derivación de documentos.
- **Papelera de Reciclaje**: Recuperación de documentos eliminados.
- **Auditoría Completa**: Registro de todas las operaciones para cumplimiento normativo.
- **Exportación de Datos**: Generación de reportes en formatos Excel y PDF.
- **API RESTful**: Backend robusto con endpoints bien definidos siguiendo estándares ISO/IEC 27001.

## Estructura del Proyecto

```
OFICRI/
├── server/                 # Backend Node.js + Express
│   ├── controllers/        # Controladores de la API
│   ├── routes/             # Definición de rutas
│   ├── middleware/         # Middleware (auth, validación, etc.)
│   ├── services/           # Lógica de negocio
│   ├── models/             # Definición de modelos
│   ├── config/             # Configuración
│   ├── utils/              # Utilidades
│   └── tests/              # Pruebas
├── db/                     # Scripts de base de datos
├── uploads/                # Almacenamiento de archivos
│   ├── documents/          # Documentos cargados
│   └── avatars/            # Fotos de perfil
├── endpoints-config.md     # Documentación de endpoints
└── Tareas.md               # Seguimiento de tareas
```

## Sistema de Permisos

El sistema utiliza un enfoque basado en bits para gestionar los permisos:

| Bit | Valor | Descripción                         |
|-----|-------|-------------------------------------|
| 0   | 1     | Crear/Registrar                     |
| 1   | 2     | Editar/Modificar                    |
| 2   | 4     | Eliminar                            |
| 3   | 8     | Ver/Listar/Consultar                |
| 4   | 16    | Derivar (específico de documentos)  |
| 5   | 32    | Publicar/Ocultar                    |
| 6   | 64    | Exportar                            |
| 7   | 128   | Bloquear                            |

Estos permisos se pueden combinar sumando sus valores. Por ejemplo:
- Un valor de 11 (1+2+8) permite crear, editar y ver.
- Un valor de 31 (1+2+4+8+16) permite crear, editar, eliminar, ver y derivar.

## API y Endpoints

La documentación completa de los endpoints está disponible en el archivo [endpoints-config.md](endpoints-config.md). Los principales módulos incluyen:

- Autenticación y Usuarios (`/api/auth`, `/api/usuarios`)
- Gestión de Roles (`/api/roles`)
- Permisos Contextuales (`/api/permisos`)
- Documentos (`/api/documentos`)
- Mesa de Partes (`/api/mesa-partes`)
- Áreas (`/api/areas`)
- Logs y Auditoría (`/api/logs`)

## Usando la API desde el Frontend

Para consumir estos endpoints desde una aplicación frontend:

1. **Autenticación**: Usar el endpoint `/api/auth/login` para obtener un token JWT.
2. **Autorización**: Incluir el token en el encabezado `Authorization` como `Bearer {token}`.
3. **Manejo de Permisos**: El backend verificará automáticamente los permisos necesarios.

Ejemplo de uso con axios:

```javascript
// Login
const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    
    // Guardar token
    localStorage.setItem('token', token);
    
    // Configurar axios para usar el token en futuras peticiones
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return user;
  } catch (error) {
    console.error('Error de autenticación:', error);
    throw error;
  }
};

// Obtener documentos
const getDocuments = async () => {
  try {
    const response = await axios.get('/api/documentos');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error('No tiene permisos para ver documentos');
    }
    throw error;
  }
};
```

## Seguridad

El sistema implementa múltiples capas de seguridad:

1. **Autenticación JWT**: Tokens seguros con tiempo de expiración.
2. **Validación de Permisos**: Verificación por bits en cada operación.
3. **Permisos Contextuales**: Reglas dinámicas basadas en contexto.
4. **Validación de Datos**: Esquemas de validación para todas las entradas.
5. **Protección CSRF**: Tokens para prevenir ataques de falsificación.
6. **Rate Limiting**: Limitación de intentos para prevenir ataques de fuerza bruta.
7. **Auditoría**: Registro detallado de todas las operaciones.

## Contribución

Para contribuir a este proyecto:

1. Hacer fork del repositorio
2. Crear una rama para su funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Hacer commit de los cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Hacer push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 