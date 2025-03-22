# OFICRI Sistema

Sistema de Gestión para OFICRI Cusco - Cumplimiento ISO/IEC 27001

## Implementación de Permisos para el Frontend

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