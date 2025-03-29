# Guía de Integración para Frontend - OFICRI API

_Versión: 1.0.0 (Actualizado: Junio 2024)_

Esta guía está diseñada para ayudar a los desarrolladores frontend a integrar sus aplicaciones con la API REST de OFICRI. Contiene ejemplos prácticos, patrones recomendados y soluciones para casos de uso comunes.

## Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Autenticación](#autenticación)
3. [Manejo de Permisos](#manejo-de-permisos)
4. [Flujos de Trabajo Comunes](#flujos-de-trabajo-comunes)
5. [Manejo de Errores](#manejo-de-errores)
6. [Optimización de Rendimiento](#optimización-de-rendimiento)
7. [Ejemplos de Código](#ejemplos-de-código)

## Configuración Inicial

### Configuración de Cliente HTTP

Recomendamos usar una instancia configurada de Axios para todas las llamadas a la API. Esto facilita añadir interceptores para el manejo de tokens y errores.

```javascript
// api/config.js
import axios from 'axios';

// URL base de la API según el entorno
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://oficri.gob.pe/api'
  : 'http://localhost:3000/api';

// Crear instancia de Axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Exportar cliente configurado
export default apiClient;
```

### Interceptores para Gestión de Tokens

Añada interceptores para incluir automáticamente el token en las peticiones y manejar errores de autenticación:

```javascript
// api/interceptors.js
import apiClient from './config';
import authService from '../services/authService';
import { notifyError } from '../utils/notifications';

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Si el error es 401 (no autorizado) y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Intentar refrescar el token
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          // Llamar al endpoint de refresh token
          const response = await apiClient.post('/auth/refresh-token', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Guardar los nuevos tokens
          authService.setTokens(token, newRefreshToken);
          
          // Reintento de la petición original con el nuevo token
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, redireccionar al login
        authService.logout();
        window.location.href = '/login';
        notifyError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Autenticación

### Flujo de Login

```javascript
// services/authService.js
import apiClient from '../api/config';

const AUTH_TOKEN_KEY = 'oficri_auth_token';
const REFRESH_TOKEN_KEY = 'oficri_refresh_token';
const USER_DATA_KEY = 'oficri_user_data';

const authService = {
  // Login de usuario
  async login(codigoCIP, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        codigoCIP,
        password
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Guardar tokens y datos de usuario
      this.setTokens(token, refreshToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },
  
  // Obtener token actual
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  
  // Obtener refresh token
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  // Guardar tokens
  setTokens(token, refreshToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  
  // Obtener datos del usuario
  getUser() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.getToken();
  },
  
  // Verificar si el token es válido
  async checkAuth() {
    try {
      const response = await apiClient.get('/auth/verificar-token');
      const { user } = response.data;
      
      // Actualizar datos de usuario si es necesario
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // Cerrar sesión
  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    }
  }
};

export default authService;
```

### Componente de Login

```jsx
// components/Login.jsx
import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [codigoCIP, setCodigoCIP] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login(codigoCIP, password);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 
                      'Error al iniciar sesión. Verifique sus credenciales.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
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

export default Login;
```

## Manejo de Permisos

### Verificación de Permisos por Bits

Cree un servicio dedicado a la gestión de permisos:

```javascript
// services/permissionService.js
import apiClient from '../api/config';
import authService from './authService';

// Códigos de bits de permisos
const PERMISSION_BITS = {
  CREAR: 1,         // Bit 0
  EDITAR: 2,        // Bit 1
  ELIMINAR: 4,      // Bit 2
  VER: 8,           // Bit 3
  DERIVAR: 16,      // Bit 4
  AUDITAR: 32,      // Bit 5
  EXPORTAR: 64,     // Bit 6
  ADMINISTRAR: 128  // Bit 7
};

const permissionService = {
  // Verificar si el usuario tiene un permiso por bit
  hasPermission(permission) {
    const user = authService.getUser();
    if (!user || !user.Permisos) return false;
    
    return (user.Permisos & permission) === permission;
  },
  
  // Verificar múltiples permisos (debe tener todos)
  hasAllPermissions(permissions) {
    const user = authService.getUser();
    if (!user || !user.Permisos) return false;
    
    const combinedPermission = permissions.reduce((acc, perm) => acc | perm, 0);
    return (user.Permisos & combinedPermission) === combinedPermission;
  },
  
  // Verificar si tiene al menos uno de los permisos
  hasAnyPermission(permissions) {
    const user = authService.getUser();
    if (!user || !user.Permisos) return false;
    
    const combinedPermission = permissions.reduce((acc, perm) => acc | perm, 0);
    return (user.Permisos & combinedPermission) !== 0;
  },
  
  // Verificar permiso contextual específico
  async verifyContextualPermission(resourceId, resourceType, action) {
    try {
      const user = authService.getUser();
      if (!user) return false;
      
      const response = await apiClient.post('/permisos/verificar', {
        idUsuario: user.IDUsuario,
        idRecurso: resourceId,
        tipoRecurso: resourceType,
        accion: action
      });
      
      return response.data.tienePermiso;
    } catch (error) {
      console.error('Error al verificar permiso contextual:', error);
      return false;
    }
  },
  
  // Retorna los bits de permisos
  getBits() {
    return PERMISSION_BITS;
  }
};

export default permissionService;
```

### Componente HOC Protector de Rutas

Cree un componente HOC (High Order Component) para proteger rutas basado en permisos:

```jsx
// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
import permissionService from '../services/permissionService';

function ProtectedRoute({ children, requiredPermission = null }) {
  // Verificar autenticación
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si no se requiere permiso específico, solo comprobar autenticación
  if (requiredPermission === null) {
    return children;
  }
  
  // Verificar permiso requerido
  const hasPermission = permissionService.hasPermission(requiredPermission);
  if (!hasPermission) {
    return <Navigate to="/acceso-denegado" replace />;
  }
  
  // Usuario autenticado y con permisos
  return children;
}

export default ProtectedRoute;
```

### Uso en React Router

```jsx
// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import permissionService from './services/permissionService';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documentos from './pages/Documentos';
import CrearDocumento from './pages/CrearDocumento';
import EditarDocumento from './pages/EditarDocumento';
import AccesoDenegado from './pages/AccesoDenegado';

const { CREAR, EDITAR, VER } = permissionService.getBits();

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/acceso-denegado" element={<AccesoDenegado />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/documentos" element={
          <ProtectedRoute requiredPermission={VER}>
            <Documentos />
          </ProtectedRoute>
        } />
        
        <Route path="/documentos/crear" element={
          <ProtectedRoute requiredPermission={CREAR}>
            <CrearDocumento />
          </ProtectedRoute>
        } />
        
        <Route path="/documentos/editar/:id" element={
          <ProtectedRoute requiredPermission={EDITAR}>
            <EditarDocumento />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Directiva Condicional para UI basada en Permisos

Cree un componente para mostrar u ocultar elementos basados en permisos:

```jsx
// components/PermissionGate.jsx
import React from 'react';
import permissionService from '../services/permissionService';

function PermissionGate({ permission, children, fallback = null }) {
  const hasPermission = permissionService.hasPermission(permission);
  
  return hasPermission ? children : fallback;
}

export default PermissionGate;
```

### Uso del componente PermissionGate

```jsx
// components/DocumentTable.jsx
import React from 'react';
import PermissionGate from './PermissionGate';
import permissionService from '../services/permissionService';

const { EDITAR, ELIMINAR, DERIVAR, EXPORTAR } = permissionService.getBits();

function DocumentTable({ documents }) {
  return (
    <div>
      <PermissionGate permission={EXPORTAR}>
        <button className="btn-export">Exportar a Excel</button>
      </PermissionGate>
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
                <tr key={doc.id}>
              <td>{doc.id}</td>
              <td>{doc.titulo}</td>
              <td>{doc.fecha}</td>
              <td>{doc.estado}</td>
              <td className="actions">
                <PermissionGate permission={EDITAR}>
                  <button className="btn-edit">Editar</button>
                </PermissionGate>
                
                <PermissionGate permission={ELIMINAR}>
                  <button className="btn-delete">Eliminar</button>
                </PermissionGate>
                
                <PermissionGate permission={DERIVAR}>
                  <button className="btn-forward">Derivar</button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;
```

## Flujos de Trabajo Comunes

### Servicio para Gestión de Documentos

```javascript
// services/documentService.js
import apiClient from '../api/config';

const documentService = {
  // Obtener lista paginada de documentos
  async getDocuments(page = 1, limit = 10, filters = {}) {
    const params = { page, limit, ...filters };
    const response = await apiClient.get('/documentos', { params });
    return response.data;
  },
  
  // Obtener documento por ID
  async getDocumentById(id) {
    const response = await apiClient.get(`/documentos/${id}`);
    return response.data.data;
  },
  
  // Crear nuevo documento
  async createDocument(documentData) {
    const response = await apiClient.post('/documentos', documentData);
    return response.data;
  },
  
  // Actualizar documento existente
  async updateDocument(id, documentData) {
    const response = await apiClient.put(`/documentos/${id}`, documentData);
    return response.data;
  },
  
  // Eliminar documento
  async deleteDocument(id) {
    const response = await apiClient.delete(`/documentos/${id}`);
    return response.data;
  },
  
  // Adjuntar archivo a documento
  async attachFile(documentId, file) {
    const formData = new FormData();
    formData.append('archivo', file);
    
    const response = await apiClient.post(
      `/documentos/${documentId}/archivo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  },
  
  // Derivar documento
  async forwardDocument(documentId, targetAreaId, observations) {
    const response = await apiClient.post(`/documentos/${documentId}/derivar`, {
      idAreaDestino: targetAreaId,
      observaciones: observations
    });
    
    return response.data;
  },
  
  // Buscar documentos
  async searchDocuments(searchTerm, filters = {}, page = 1, limit = 10) {
    const params = {
      search: searchTerm,
      page,
      limit,
      ...filters
    };
    
    const response = await apiClient.get('/documentos/buscar', { params });
    return response.data;
  },
  
  // Obtener documentos pendientes del usuario
  async getPendingDocuments(page = 1, limit = 10) {
    const response = await apiClient.get('/documentos/pendientes', {
      params: { page, limit }
    });
    
    return response.data;
  },
  
  // Exportar documentos
  async exportDocuments(filters = {}, format = 'excel') {
    const response = await apiClient.post('/documentos/exportar', {
      filters,
      formato: format
    }, {
      responseType: 'blob'
    });
    
    return response.data;
  }
};

export default documentService;
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

## Integración de Usuarios

### Obtener lista de usuarios

Endpoint para listar usuarios con paginación y filtros:

```javascript
// Ejemplo usando el servicio de usuarios
import { userService } from '@/services/user.service';

// Obtener usuarios con filtros
async function fetchUsers() {
  try {
    const params = {
      page: 1,
      limit: 10,
      search: 'Carlos', // Opcional: buscar por nombre, apellido o CIP
      IDRol: 2,         // Opcional: filtrar por rol
      IDArea: 3,        // Opcional: filtrar por área
      sort: 'Apellidos', // Opcional: campo para ordenar
      order: 'asc'      // Opcional: dirección de ordenamiento (asc, desc)
    };
    
    const response = await userService.getUsers(params);
    
    if (response.success) {
      const users = response.data;
      const totalCount = response.count;
      // Procesar la lista de usuarios
      console.log(`Se encontraron ${totalCount} usuarios`);
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    // Manejar el error apropiadamente
  }
}
```

### Obtener usuario por ID

```javascript
// Obtener un usuario por su ID
async function getUserDetails(userId) {
  try {
    const response = await userService.getUserById(userId);
    
    if (response.success) {
      const user = response.data;
      // Trabajar con los datos del usuario
      console.log(`Usuario: ${user.Nombres} ${user.Apellidos}`);
      
      // Verificar permisos específicos del usuario
      if (user.Permisos & 8) { // Verificar si tiene permiso de edición
        // Mostrar opciones de edición
        console.log('Este usuario tiene permisos de edición');
      }
    }
  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error);
    // Manejar el error
  }
}
```

### Buscar usuario por CIP

```javascript
// Buscar usuario por código CIP
async function searchUserByCIP(codigoCIP) {
  try {
    const response = await userService.getUserByCIP(codigoCIP);
    
    if (response.success) {
      const user = response.data;
      // Trabajar con los datos del usuario
      return user;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn('Usuario con CIP no encontrado');
      return null;
    }
    console.error('Error al buscar usuario por CIP:', error);
    throw error;
  }
}
```

### Crear un nuevo usuario

```javascript
// Crear un nuevo usuario
async function createUser(userData, avatarFile) {
  try {
    // Preparar FormData para envío con archivo
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      formData.append(key, userData[key]);
    });
    
    // Agregar avatar si existe
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    const response = await userService.createUser(formData);
    
    if (response.success) {
      console.log('Usuario creado exitosamente:', response.data);
      return response.data;
    }
  } catch (error) {
    // Manejo específico de errores
    if (error.response) {
      switch (error.response.status) {
        case 409:
          console.error('El código CIP ya está registrado');
          // Mostrar mensaje al usuario
          break;
        case 403:
          console.error('No tiene permisos para crear usuarios');
          // Redirigir o mostrar mensaje
          break;
        default:
          console.error('Error al crear usuario:', error);
      }
    }
    throw error;
  }
}
```

### Actualizar un usuario existente

```javascript
// Actualizar un usuario existente
async function updateUser(userId, userData, avatarFile) {
  try {
    // Preparar FormData para envío con archivo
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      formData.append(key, userData[key]);
    });
    
    // Agregar avatar si existe
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    const response = await userService.updateUser(userId, formData);
    
    if (response.success) {
      console.log('Usuario actualizado exitosamente:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    // Manejo de errores específicos
    throw error;
  }
}
```

### Cambiar contraseña de usuario

```javascript
// Cambiar contraseña de usuario
async function changePassword(userId, currentPassword, newPassword) {
  try {
    const passwordData = {
      currentPassword,
      newPassword
    };
    
    const response = await userService.changePassword(userId, passwordData);
    
    if (response.success) {
      console.log('Contraseña actualizada exitosamente');
      return true;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('Contraseña actual incorrecta');
      // Mostrar mensaje al usuario
      return false;
    }
    console.error('Error al cambiar contraseña:', error);
    throw error;
  }
}
```

### Activar/Desactivar usuario

```javascript
// Activar o desactivar un usuario
async function toggleUserStatus(userId, active) {
  try {
    const response = await userService.updateUserStatus(userId, { active });
    
    if (response.success) {
      const status = active ? 'activado' : 'desactivado';
      console.log(`Usuario ${status} exitosamente`);
      return response.data;
    }
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    throw error;
  }
}
```

### Servicio de Usuarios

A continuación se muestra un ejemplo de implementación del servicio para gestionar usuarios:

```javascript
// src/services/user.service.js
import axios from 'axios';
import { authService } from './auth.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const userService = {
  // Obtener lista de usuarios con filtros y paginación
  async getUsers(params = {}) {
    const response = await axios.get(`${API_URL}/usuarios`, {
      params,
      headers: authService.getAuthHeader()
    });
    return response.data;
  },
  
  // Obtener usuario por ID
  async getUserById(userId) {
    const response = await axios.get(`${API_URL}/usuarios/${userId}`, {
      headers: authService.getAuthHeader()
    });
    return response.data;
  },
  
  // Obtener usuario por CIP
  async getUserByCIP(codigoCIP) {
    const response = await axios.get(`${API_URL}/usuarios/cip/${codigoCIP}`, {
      headers: authService.getAuthHeader()
    });
    return response.data;
  },
  
  // Crear nuevo usuario
  async createUser(userData) {
    const response = await axios.post(`${API_URL}/usuarios`, userData, {
      headers: {
        ...authService.getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Actualizar usuario existente
  async updateUser(userId, userData) {
    const response = await axios.put(`${API_URL}/usuarios/${userId}`, userData, {
      headers: {
        ...authService.getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Cambiar contraseña
  async changePassword(userId, passwordData) {
    const response = await axios.put(`${API_URL}/usuarios/${userId}/password`, passwordData, {
      headers: authService.getAuthHeader()
    });
    return response.data;
  },
  
  // Activar/desactivar usuario
  async updateUserStatus(userId, statusData) {
    const response = await axios.patch(`${API_URL}/usuarios/${userId}/status`, statusData, {
      headers: authService.getAuthHeader()
    });
    return response.data;
  }
};
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