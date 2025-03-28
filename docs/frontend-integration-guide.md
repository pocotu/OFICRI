# Guía de Integración Frontend - OFICRI API

_Versión: 1.0.0 (Actualizado: Mayo 2024)_

## Introducción

Esta guía proporciona instrucciones detalladas para integrar la API REST de OFICRI con aplicaciones frontend. Está diseñada para complementar la documentación técnica principal de la API y facilitar el desarrollo de interfaces de usuario que consuman estos servicios.

## Configuración Inicial

### Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Conocimientos de JavaScript/TypeScript
- Familiaridad con Fetch API o Axios

### Variables de Entorno

Configura un archivo `.env` en tu aplicación frontend con las siguientes variables:

```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
```

Para producción, asegúrate de cambiar estos valores en tu pipeline de CI/CD.

## Autenticación

### Implementación del Login

```javascript
// auth.service.js
export async function login(codigoCIP, password) {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codigoCIP,
        password,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error de autenticación');
    }

    // Almacenar token y datos de usuario
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}
```

### Verificación del Token

```javascript
// auth.service.js
export async function verifyToken() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error al verificar token:', error);
    return false;
  }
}
```

### Logout

```javascript
// auth.service.js
export function logout() {
  // Eliminar token y datos de usuario
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Opcional: notificar al servidor del logout
  fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  }).catch(error => {
    console.error('Error en logout:', error);
  });
}
```

## Cliente HTTP Reutilizable

Para facilitar las llamadas a la API, puedes crear un cliente HTTP reutilizable:

```javascript
// api.client.js
export default class ApiClient {
  constructor(baseURL = process.env.REACT_APP_API_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Configuración por defecto
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Añadir token si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Verificar si el token ha expirado
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?expired=true';
        throw new Error('Sesión expirada');
      }
      
      const data = await response.json();
      
      if (!data.success && response.status !== 200 && response.status !== 201) {
        throw new Error(data.message || 'Error en la solicitud');
      }
      
      return data;
    } catch (error) {
      console.error(`Error en solicitud a ${endpoint}:`, error);
      throw error;
    }
  }

  // Métodos para diferentes tipos de solicitudes
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}
```

## Servicios para los recursos principales

### Servicio de Documentos

```javascript
// documento.service.js
import ApiClient from './api.client';

const api = new ApiClient();

export const documentoService = {
  // Obtener lista paginada de documentos
  async getDocumentos(page = 1, limit = 10, filters = {}) {
    // Construir parámetros de consulta
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    });
    
    return api.get(`/documentos?${queryParams}`);
  },

  // Obtener un documento por ID
  async getDocumentoById(id) {
    return api.get(`/documentos/${id}`);
  },

  // Crear nuevo documento
  async createDocumento(documento) {
    return api.post('/documentos', documento);
  },

  // Actualizar documento existente
  async updateDocumento(id, documento) {
    return api.put(`/documentos/${id}`, documento);
  },

  // Derivar documento
  async derivarDocumento(id, destino) {
    return api.post(`/documentos/${id}/derivar`, destino);
  }
};
```

### Servicio de Usuarios

```javascript
// usuario.service.js
import ApiClient from './api.client';

const api = new ApiClient();

export const usuarioService = {
  // Obtener lista de usuarios
  async getUsuarios() {
    return api.get('/users');
  },

  // Obtener usuario por ID
  async getUsuarioById(id) {
    return api.get(`/users/${id}`);
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('No hay usuario autenticado');
    }
    return JSON.parse(userData);
  }
};
```

### Servicio de Áreas

```javascript
// area.service.js
import ApiClient from './api.client';

const api = new ApiClient();

export const areaService = {
  // Obtener lista de áreas
  async getAreas() {
    return api.get('/areas');
  }
};
```

## Componentes de React para integración con la API

### Ejemplo de Hook para autenticación

```javascript
// useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { login, logout, verifyToken } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const isValid = await verifyToken();
        if (isValid) {
          const userData = localStorage.getItem('user');
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async (codigoCIP, password) => {
    try {
      setLoading(true);
      setError(null);
      const result = await login(codigoCIP, password);
      setUser(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login: handleLogin,
        logout: handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
```

### Componente de Login

```jsx
// LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [codigoCIP, setCodigoCIP] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login(codigoCIP, password);
      navigate('/dashboard');
    } catch (error) {
      // Error ya manejado por el hook useAuth
      console.error('Error en inicio de sesión');
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="codigoCIP">Código CIP:</label>
          <input
            type="text"
            id="codigoCIP"
            value={codigoCIP}
            onChange={(e) => setCodigoCIP(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
```

### Componente para listar documentos

```jsx
// DocumentosList.jsx
import { useState, useEffect } from 'react';
import { documentoService } from '../services/documento.service';

function DocumentosList() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    estado: ''
  });

  useEffect(() => {
    loadDocumentos();
  }, [currentPage, filters]);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      const response = await documentoService.getDocumentos(currentPage, 10, filters);
      setDocumentos(response.data.documents);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      setError('Error al cargar documentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Reiniciar a primera página al buscar
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="documentos-container">
      <h2>Documentos</h2>
      
      <div className="filters-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            name="search"
            placeholder="Buscar..."
            value={filters.search}
            onChange={handleFilterChange}
          />
          
          <select
            name="estado"
            value={filters.estado}
            onChange={handleFilterChange}
          >
            <option value="">Todos los estados</option>
            <option value="RECIBIDO">Recibido</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="ARCHIVADO">Archivado</option>
          </select>
          
          <button type="submit">Buscar</button>
        </form>
      </div>
      
      {loading ? (
        <p>Cargando documentos...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <table className="documentos-table">
            <thead>
              <tr>
                <th>Nro. Registro</th>
                <th>Nro. Oficio</th>
                <th>Procedencia</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.nroRegistro}</td>
                  <td>{doc.numeroOficio}</td>
                  <td>{doc.procedencia}</td>
                  <td>
                    <span className={`estado-badge ${doc.estado.toLowerCase()}`}>
                      {doc.estado}
                    </span>
                  </td>
                  <td>{new Date(doc.fecha).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => navigate(`/documentos/${doc.id}`)}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Anterior
            </button>
            
            <span>
              Página {currentPage} de {totalPages}
            </span>
            
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DocumentosList;
```

## Manejo de Errores

### Interceptor global para errores de API

```javascript
// errorHandling.js
export function setupErrorHandlers() {
  // Interceptor global para errores de red
  window.addEventListener('unhandledrejection', function(event) {
    // Verificar si es un error de red
    if (event.reason.message === 'Failed to fetch' || 
        event.reason.message === 'Network request failed') {
      // Mostrar mensaje amigable al usuario
      alert('Error de conexión. Por favor, verifica tu conexión a internet.');
      
      // Opcional: enviar a servicio de monitoreo
      console.error('Error de red detectado:', event.reason);
    }
  });
}

// Clase para manejar errores específicos de la API
export class ApiError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
  
  // Mensaje formateado para mostrar al usuario
  get userMessage() {
    switch (this.statusCode) {
      case 400:
        return 'Los datos enviados son incorrectos. Por favor, revísalos.';
      case 401:
        return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 500:
        return 'Ha ocurrido un error en el servidor. Por favor, intenta más tarde.';
      default:
        return this.message || 'Ha ocurrido un error inesperado.';
    }
  }
}
```

## Consideraciones sobre el rendimiento

### Caching de datos

```javascript
// cacheService.js
import ApiClient from './api.client';

const api = new ApiClient();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos en milisegundos

class CacheService {
  constructor() {
    this.cache = new Map();
  }
  
  async get(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cachedItem = this.cache.get(cacheKey);
    
    // Si existe en caché y no ha expirado, devolverlo
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_EXPIRY) {
      console.log(`Usando datos en caché para ${cacheKey}`);
      return cachedItem.data;
    }
    
    // Si no está en caché o ha expirado, hacer la solicitud
    console.log(`Obteniendo datos frescos para ${cacheKey}`);
    const response = await api.get(endpoint, { params });
    
    // Almacenar en caché con timestamp
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  }
  
  // Borrar un item específico de la caché
  invalidate(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    this.cache.delete(cacheKey);
  }
  
  // Borrar toda la caché
  clear() {
    this.cache.clear();
  }
  
  // Generar clave única para la caché basada en la URL y parámetros
  getCacheKey(endpoint, params) {
    const queryString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
      
    return `${endpoint}${queryString ? `?${queryString}` : ''}`;
  }
}

export default new CacheService();
```

## Procesamiento de Datos

### Transformadores para respuestas de la API

```javascript
// transformers.js

// Transformador para documentos
export function transformDocumento(doc) {
  return {
    id: doc.IDDocumento,
    nroRegistro: doc.NroRegistro,
    numeroOficio: doc.NumeroOficioDocumento,
    fecha: new Date(doc.FechaDocumento),
    fechaRegistro: new Date(doc.FechaRegistro),
    estado: doc.Estado,
    procedencia: doc.Procedencia,
    contenido: doc.Contenido,
    observaciones: doc.Observaciones,
    
    // Información relacionada
    mesaPartes: doc.MesaPartes ? {
      id: doc.MesaPartes.IDMesaPartes,
      descripcion: doc.MesaPartes.Descripcion,
      codigo: doc.MesaPartes.CodigoIdentificacion
    } : null,
    
    areaActual: doc.AreaActual ? {
      id: doc.AreaActual.IDArea,
      nombre: doc.AreaActual.NombreArea,
      codigo: doc.AreaActual.CodigoIdentificacion
    } : null,
    
    creador: doc.UsuarioCreador ? {
      id: doc.UsuarioCreador.IDUsuario,
      nombre: `${doc.UsuarioCreador.Nombres} ${doc.UsuarioCreador.Apellidos}`,
      codigoCIP: doc.UsuarioCreador.CodigoCIP,
      grado: doc.UsuarioCreador.Grado
    } : null,
    
    asignado: doc.UsuarioAsignado ? {
      id: doc.UsuarioAsignado.IDUsuario,
      nombre: `${doc.UsuarioAsignado.Nombres} ${doc.UsuarioAsignado.Apellidos}`,
      codigoCIP: doc.UsuarioAsignado.CodigoCIP,
      grado: doc.UsuarioAsignado.Grado
    } : null,
    
    archivos: doc.Archivos ? doc.Archivos.map(archivo => ({
      id: archivo.IDArchivo,
      nombre: archivo.NombreArchivo,
      tipo: archivo.TipoArchivo,
      fechaSubida: new Date(archivo.FechaSubida),
      ruta: archivo.RutaArchivo
    })) : [],
    
    derivaciones: doc.Derivaciones ? doc.Derivaciones.map(derivacion => ({
      id: derivacion.IDDerivacion,
      fecha: new Date(derivacion.FechaDerivacion),
      origen: derivacion.AreaOrigen,
      destino: derivacion.AreaDestino,
      estado: derivacion.Estado
    })) : []
  };
}
```

## Seguridad en Frontend

### Protección de Rutas

```jsx
// ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ requiredPermissions = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  // Si la autenticación está cargando, muestra un loading
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si no está autenticado, redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si se requieren permisos específicos, verificarlos
  if (requiredPermissions.length > 0) {
    // Suponiendo que user.permissions contiene el valor numérico de los permisos
    const userPermissions = user.permissions || 0;
    
    // Verificar cada permiso requerido usando operaciones de bits
    const hasAllPermissions = requiredPermissions.every(permissionBit => {
      const bitValue = 1 << permissionBit;
      return (userPermissions & bitValue) === bitValue;
    });
    
    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Si pasa todas las verificaciones, renderiza el contenido protegido
  return <Outlet />;
}

export default ProtectedRoute;
```

### Configuración de rutas con protección

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import DocumentosList from './components/DocumentosList';
import DocumentoDetail from './components/DocumentoDetail';
import NotFound from './components/NotFound';
import Unauthorized from './components/Unauthorized';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Rutas protegidas - solo requieren autenticación */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documentos" element={<DocumentosList />} />
            <Route path="/documentos/:id" element={<DocumentoDetail />} />
          </Route>
          
          {/* Rutas protegidas con permisos específicos */}
          <Route element={<ProtectedRoute requiredPermissions={[0]} />}> {/* Bit 0 = Crear */}
            <Route path="/documentos/nuevo" element={<DocumentoForm />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredPermissions={[1]} />}> {/* Bit 1 = Editar */}
            <Route path="/documentos/:id/editar" element={<DocumentoForm />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredPermissions={[7]} />}> {/* Bit 7 = Administrar */}
            <Route path="/admin/*" element={<AdminPanel />} />
          </Route>
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

## Conclusión

Esta guía proporciona las herramientas y componentes necesarios para comenzar a integrar la API REST de OFICRI con tu aplicación frontend. Siguiendo estas pautas, podrás:

1. Gestionar la autenticación de usuarios
2. Realizar solicitudes a los endpoints de la API
3. Manejar errores de forma efectiva
4. Implementar protección de rutas basada en permisos
5. Optimizar el rendimiento con cachés

Para consultas adicionales o asistencia, contacta al equipo de desarrollo de OFICRI a través de:
- Email: desarrollo@oficri.gob.pe
- Jira: https://oficri.atlassian.net/ 