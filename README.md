# OFICRI Sistema de Gestión

Sistema de gestión documental para OFICRI Cusco con cumplimiento ISO/IEC 27001.

![OFICRI](https://via.placeholder.com/800x200?text=OFICRI+Sistema+de+Gestion)

## Descripción

OFICRI es un sistema integral de gestión documental y administrativa diseñado específicamente para cumplir con los estándares ISO/IEC 27001 sobre seguridad de la información. Permite gestionar documentos, usuarios, permisos y flujos de trabajo con un enfoque en seguridad, trazabilidad y auditoría.

## Características Principales

- **Gestión Documental**: Control completo del ciclo de vida de documentos
- **Sistema de Permisos Avanzado**: Permisos por bits y contextuales
- **Arquitectura Segura**: Implementación de controles ISO/IEC 27001
- **Auditoría Completa**: Registro detallado de todas las acciones
- **API RESTful**: Documentada con Swagger
- **Autenticación Segura**: JWT con rotación de tokens
- **Frontend Adaptativo**: Interfaz responsiva con controles de acceso

## Tecnologías

- **Backend**: Node.js, Express
- **Base de Datos**: MySQL
- **Frontend**: JavaScript, Bootstrap
- **Seguridad**: Helmet, rate-limiting, CSRF protection
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

## Requisitos del Sistema

- Node.js v16.0.0 o superior
- MySQL 5.7 o superior
- Navegador moderno (Chrome, Firefox, Edge)

## Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/oficri.git
   cd oficri
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   - Copiar el archivo `.env.example` a `.env`
   - Editar el archivo `.env` con las credenciales de base de datos y configuraciones

4. **Inicializar la base de datos**:
   ```bash
   npm run init
   ```
   Este comando ejecuta los siguientes pasos:
   - Creación de tablas (db:init)
   - Configuración de triggers para auditoría (db:triggers)
   - Configuración inicial del sistema (db:setup)

5. **Iniciar el servidor**:
   ```bash
   npm run dev
   ```

6. **Acceder al sistema**:
   - Abrir navegador en `http://localhost:3000`
   - Credenciales iniciales:
     - CIP: 12345678
     - Contraseña: Admin123!

## Estructura del Proyecto

```
oficri/
├── client/               # Código del cliente frontend
├── server/               # Código del servidor backend
│   ├── config/           # Configuraciones
│   ├── controllers/      # Controladores de la API
│   ├── middleware/       # Middleware Express
│   ├── models/           # Modelos de datos
│   ├── routes/           # Rutas de la API
│   ├── scripts/          # Scripts de utilidad
│   ├── services/         # Servicios de negocio
│   ├── tests/            # Pruebas unitarias e integración
│   └── utils/            # Utilidades
├── db/                   # Scripts SQL y migraciones
├── public/               # Archivos estáticos públicos
├── logs/                 # Logs del sistema
├── test/                 # Pruebas e2e
└── coverage/             # Informes de cobertura de pruebas
```

## Scripts Disponibles

- `npm start`: Inicia el servidor en modo producción
- `npm run dev`: Inicia el servidor en modo desarrollo
- `npm run dev:all`: Inicia servidor y cliente en desarrollo
- `npm run mock`: Inicia un servidor de mock para testing
- `npm test`: Ejecuta pruebas unitarias
- `npm run test:coverage`: Ejecuta pruebas con informe de cobertura
- `npm run db:init`: Inicializa la base de datos
- `npm run db:triggers`: Configura triggers de auditoría
- `npm run db:setup`: Configura datos iniciales
- `npm run backup`: Realiza copia de seguridad de la base de datos
- `npm run security-check`: Ejecuta análisis de seguridad

## Sistema de Permisos

OFICRI implementa un sistema de permisos avanzado en dos niveles:

### 1. Permisos Base por Bits (0-7)

El sistema utiliza un modelo de bits para definir permisos base a nivel de rol:

1. **bit 0** (1) = Crear
2. **bit 1** (2) = Editar
3. **bit 2** (4) = Eliminar
4. **bit 3** (8) = Ver
5. **bit 4** (16) = Derivar
6. **bit 5** (32) = Auditar
7. **bit 6** (64) = Exportar
8. **bit 7** (128) = Bloquear

#### Roles Principales y sus Permisos

- **Administrador**: Todos los bits (0-7) = 255
  - Acceso completo a todas las funcionalidades
  - Puede crear, editar, eliminar, ver, derivar, auditar, exportar y bloquear

- **Mesa de Partes**: Bits 0,1,3,4,6 = 91
  - Puede crear, editar, ver, derivar y exportar documentos
  - No puede eliminar (bit 2), auditar (bit 5) ni bloquear usuarios (bit 7)

- **Responsable de Área**: Bits 0,1,3,4,6 = 91
  - Mismos permisos que Mesa de Partes
  - Enfocado en documentos de su área específica

### 2. Permisos Contextuales

Definen reglas específicas basadas en el contexto de ejecución:

- **PROPIETARIO**: El usuario es el creador del recurso
  - Ejemplo: Un usuario puede eliminar un documento solo si lo creó

- **MISMA_AREA**: El recurso pertenece a la misma área del usuario
  - Ejemplo: Un usuario puede editar documentos que pertenecen a su área

- **ASIGNADO**: El recurso está asignado específicamente al usuario
  - Ejemplo: Un usuario puede ver documentos asignados a él, independientemente del área

### Interfaces según Roles

#### 1. Interfaz de Administrador (Bits 0-7)

El administrador tiene acceso completo a todas las funcionalidades:

- **Gestión de Usuarios**
  - Ver, crear, editar, eliminar y bloquear usuarios
- **Gestión de Roles**
  - Ver, crear, editar y eliminar roles
- **Gestión de Áreas**
  - Ver, crear, editar y eliminar áreas
  - Visión global de documentos por área
- **Gestión de Documentos**
  - Ver, crear, editar, eliminar y derivar documentos
  - Trazabilidad completa de documentos
- **Auditoría y Logs**
  - Ver logs de usuarios, documentos, áreas y roles
- **Exportación**
  - Exportar logs, documentos y reportes
- **Dashboard**
  - Ver estadísticas globales del sistema
- **Gestión de Permisos Contextuales**
  - Configurar reglas contextuales por rol y área

#### 2. Interfaz de Mesa de Partes (Bits 0,1,3,4,6)

- **Documentos Recibidos**
  - Ver expedientes
- **Registro de Expediente**
  - Crear nuevos documentos
- **Actualización de Expediente**
  - Editar documentos existentes
- **Transferencia/Derivación**
  - Derivar documentos a otras áreas
- **Trazabilidad**
  - Ver historial de documentos
- **Exportación**
  - Generar reportes de documentos
- **Papelera de Reciclaje**
  - Gestionar documentos eliminados temporalmente

#### 3. Interfaz de Responsable de Área (Bits 0,1,3,4,6)

- **Documentos Recibidos**
  - Ver expedientes de su área
- **Registro de Expediente/Informe**
  - Crear documentos internos
- **Edición de Documentos**
  - Actualizar información y resultados
- **Derivación**
  - Transferir documentos a otras áreas
- **Trazabilidad**
  - Ver historial de documentos
- **Exportación**
  - Generar informes específicos de su área
- **Papelera de Reciclaje**
  - Gestionar documentos eliminados de su área

### Implementación en Frontend

El sistema proporciona componentes React para control de acceso:

```jsx
// Verificación de permiso básico (por bits)
<ConPermiso permiso="crear">
  <button>Crear Documento</button>
</ConPermiso>

// Verificación de permiso contextual
<ConPermisoContextual 
  tipoRecurso="DOCUMENTO" 
  accion="ELIMINAR" 
  condicion="PROPIETARIO"
  idRecurso={123}
>
  <button>Eliminar</button>
</ConPermisoContextual>
```

### Lógica de Implementación

1. **Verificación de Permisos Base**
   ```javascript
   // Verificar si el usuario tiene un permiso específico
   function hasPermission(userPermBits, permissionBit) {
     return (userPermBits & permissionBit) !== 0;
   }
   ```

2. **Verificación de Permisos Contextuales**
   ```javascript
   // Verificar permisos contextuales (simplificado)
   async function verificarPermisoContextual(idUsuario, tipoRecurso, idRecurso, accion) {
     // Obtener permisos contextuales del usuario
     const permisosContextuales = await obtenerPermisosContextuales(idUsuario);
     
     // Comprobar si existe un permiso contextual para esta acción
     const tienePermiso = permisosContextuales.some(p => 
       p.tipoRecurso === tipoRecurso && 
       p.accion === accion
     );
     
     if (!tienePermiso) return false;
     
     // Verificar la condición específica (PROPIETARIO, MISMA_AREA, etc.)
     return await verificarCondicion(idUsuario, tipoRecurso, idRecurso, accion);
   }
   ```

3. **Gestión de Interfaces**
   - Cada componente verifica los permisos antes de renderizar opciones
   - Las rutas protegidas validan permisos antes de permitir acceso
   - Botones y controles se muestran/ocultan según permisos

Para más detalles sobre la implementación, consulte la sección de implementación detallada al final de este documento.

## API RESTful

La API sigue principios RESTful con los siguientes endpoints principales:

- `/api/auth`: Autenticación y gestión de sesiones
- `/api/documents`: Gestión de documentos
- `/api/users`: Gestión de usuarios
- `/api/areas`: Gestión de áreas
- `/api/roles`: Gestión de roles
- `/api/permisos`: Gestión de permisos

La documentación completa está disponible en `/api-docs` (solo en ambiente desarrollo).

## Configuración de Seguridad

El sistema implementa múltiples capas de seguridad:

1. **A nivel de red**:
   - Rate limiting
   - CORS configurado
   - Protección contra ataques comunes (XSS, CSRF)

2. **A nivel de aplicación**:
   - Validación de entradas
   - Sanitización de datos
   - Manejo seguro de sesiones

3. **A nivel de base de datos**:
   - Prepared statements
   - Triggers de auditoría
   - Control de acceso granular

## Tests y Calidad

- **Cobertura de pruebas**: Las pruebas se ejecutan con Jest
- **Linting**: ESLint con reglas de seguridad
- **CI/CD**: Configurado con informes de prueba automatizados

Para ejecutar todos los tests:
```bash
npm test
```

## Mantenimiento

### Backups

Para realizar una copia de seguridad de la base de datos:
```bash
npm run backup
```

Los backups se almacenan en `./server/backups` con marca de tiempo.

### Logs

El sistema utiliza Winston para logging:
- `logs/app.log`: Logs generales
- `logs/error.log`: Errores
- `logs/security.log`: Eventos de seguridad

## Contribución

1. Fork el repositorio
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza cambios y añade tests
4. Ejecuta las pruebas (`npm test`)
5. Commit los cambios (`git commit -m 'Agrega nueva funcionalidad'`)
6. Push a la rama (`git push origin feature/nueva-funcionalidad`)
7. Crea un Pull Request

## Licencia

Este proyecto es privado y está licenciado para uso exclusivo de OFICRI Cusco.

---

## Implementación detallada de Permisos para el Frontend

Para implementar correctamente el sistema de permisos en el frontend, se ha desarrollado un endpoint específico que proporciona toda la información necesaria para construir una interfaz de usuario basada en permisos:

### Obtener Información de Permisos

```
GET /api/permisos/info/{idUsuario}
```

Esta solicitud devuelve un objeto con la siguiente estructura:

```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "idRol": 1,
      "nombreRol": "Administrador",
      "idArea": 1,
      "nombreArea": "Dirección"
    },
    "permisosBits": {
      "valor": 255,
      "detalle": {
        "crear": true,
        "editar": true,
        "eliminar": true,
        "ver": true,
        "derivar": true,
        "auditar": true,
        "exportar": true,
        "bloquear": true
      }
    },
    "permisosContextuales": [
      {
        "id": 1,
        "tipoRecurso": "DOCUMENTO",
        "condicion": "PROPIETARIO",
        "accion": "ELIMINAR"
      },
      {
        "id": 2,
        "tipoRecurso": "DOCUMENTO",
        "condicion": "MISMA_AREA",
        "accion": "EDITAR"
      }
    ]
  }
}
```

### Implementación en el Frontend

Para integrar el sistema de permisos en el frontend, sigue estos pasos:

1. Al iniciar sesión, obtén la información de permisos del usuario y guárdala en el estado global (Context API, Redux, etc.):

```javascript
// Ejemplo usando Context API
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const PermisosContext = createContext();

export const PermisosProvider = ({ children }) => {
  const [permisos, setPermisos] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  useEffect(() => {
    const obtenerPermisos = async () => {
      try {
        const idUsuario = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        const respuesta = await axios.get(`/api/permisos/info/${idUsuario}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (respuesta.data.success) {
          setPermisos(respuesta.data.data);
        }
      } catch (error) {
        console.error('Error al obtener permisos:', error);
      } finally {
        setCargando(false);
      }
    };
    
    obtenerPermisos();
  }, []);
  
  return (
    <PermisosContext.Provider value={{ permisos, cargando }}>
      {children}
    </PermisosContext.Provider>
  );
};
```

2. Crea componentes condicionales basados en permisos para controlar la interfaz:

```javascript
import React, { useContext } from 'react';
import { PermisosContext } from './PermisosProvider';

// Componente para renderizar condicionalmente basado en permisos por bits
export const ConPermiso = ({ permiso, children }) => {
  const { permisos, cargando } = useContext(PermisosContext);
  
  if (cargando || !permisos) return null;
  
  const tienePermiso = permisos.permisosBits.detalle[permiso];
  
  return tienePermiso ? children : null;
};

// Componente para renderizar condicionalmente basado en permisos contextuales
export const ConPermisoContextual = ({ tipoRecurso, accion, condicion, idRecurso, children }) => {
  const { permisos, cargando } = useContext(PermisosContext);
  
  if (cargando || !permisos) return null;
  
  // Verificar si existe un permiso contextual que coincida
  const tienePermiso = permisos.permisosContextuales.some(
    p => p.tipoRecurso === tipoRecurso && 
        p.accion === accion && 
        p.condicion === condicion
  );
  
  if (!tienePermiso) return null;
  
  // Para permisos que requieren verificación en tiempo real (PROPIETARIO, etc.)
  // se debe realizar una verificación adicional contra el backend
  if (idRecurso) {
    // Esta parte se implementaría según la lógica específica de la aplicación
    // Puede requerir una solicitud adicional al backend
    return <VerificadorPermisoContextual 
      tipoRecurso={tipoRecurso} 
      accion={accion} 
      idRecurso={idRecurso}
    >
      {children}
    </VerificadorPermisoContextual>;
  }
  
  return children;
};
```

3. Utiliza estos componentes para controlar el acceso a funcionalidades específicas:

```javascript
import React from 'react';
import { ConPermiso, ConPermisoContextual } from './PermisosComponents';

const GestionDocumentos = () => {
  return (
    <div className="seccion-documentos">
      <h2>Gestión de Documentos</h2>
      
      <ConPermiso permiso="ver">
        <button className="btn-accion">Ver Documentos</button>
      </ConPermiso>
      
      <ConPermiso permiso="crear">
        <button className="btn-accion">Nuevo Documento</button>
      </ConPermiso>
      
      <ConPermiso permiso="editar">
        <button className="btn-accion">Editar Documento</button>
      </ConPermiso>
      
      <ConPermiso permiso="eliminar">
        <ConPermisoContextual 
          tipoRecurso="DOCUMENTO" 
          accion="ELIMINAR" 
          condicion="PROPIETARIO"
          idRecurso={123} // ID del documento actual
        >
          <button className="btn-accion">Eliminar Documento</button>
        </ConPermisoContextual>
      </ConPermiso>
      
      <ConPermiso permiso="derivar">
        <button className="btn-accion">Derivar Documento</button>
      </ConPermiso>
      
      <ConPermiso permiso="exportar">
        <button className="btn-accion">Exportar Documentos</button>
      </ConPermiso>
    </div>
  );
};

export default GestionDocumentos;
```

4. Implementa rutas protegidas basadas en permisos:

```javascript
import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { PermisosContext } from './PermisosProvider';

export const RutaProtegida = ({ component: Component, permiso, ...rest }) => {
  const { permisos, cargando } = useContext(PermisosContext);
  
  return (
    <Route
      {...rest}
      render={(props) => {
        // Esperar a que los permisos se carguen
        if (cargando) {
          return <div>Cargando...</div>;
        }
        
        // Verificar si el usuario tiene el permiso necesario
        if (!permisos || !permisos.permisosBits.detalle[permiso]) {
          return <Redirect to="/acceso-denegado" />;
        }
        
        // Si tiene permiso, renderizar el componente
        return <Component {...props} />;
      }}
    />
  );
};
```

5. Configura las rutas de la aplicación según los permisos:

```javascript
import React from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';
import { PermisosProvider } from './PermisosProvider';
import { RutaProtegida } from './RutaProtegida';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GestionUsuarios from './pages/GestionUsuarios';
import GestionDocumentos from './pages/GestionDocumentos';
import AccesoDenegado from './pages/AccesoDenegado';

const App = () => {
  return (
    <BrowserRouter>
      <PermisosProvider>
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route exact path="/acceso-denegado" component={AccesoDenegado} />
          
          <RutaProtegida exact path="/" permiso="ver" component={Dashboard} />
          <RutaProtegida path="/usuarios" permiso="bloquear" component={GestionUsuarios} />
          <RutaProtegida path="/documentos" permiso="ver" component={GestionDocumentos} />
        </Switch>
      </PermisosProvider>
    </BrowserRouter>
  );
};

export default App;
```

Con esta implementación, la interfaz de usuario se adaptará automáticamente a los permisos del usuario autenticado, mostrando u ocultando funcionalidades según corresponda. 