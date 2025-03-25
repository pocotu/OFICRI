# Guía de Integración para Frontend

Esta guía proporciona información específica para el equipo de frontend sobre cómo integrarse de manera efectiva con la API REST de OFICRI.

## Configuración Inicial

### Variables de Entorno

Recomendamos configurar variables de entorno en su aplicación frontend para facilitar el cambio entre ambientes:

```javascript
// config.js
const config = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
    version: 'v1'
  }
};

export default config;
```

### Interceptor de Axios

Para gestionar automáticamente los tokens JWT y manejar errores comunes, recomendamos configurar un interceptor en Axios:

```javascript
// apiClient.js
import axios from 'axios';
import config from './config';
import { getToken, refreshToken, logout } from './authService';

const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': config.api.version
  }
});

// Interceptor de solicitudes
apiClient.interceptors.request.use(
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si error 401 y no es una solicitud de refresh token
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('auth/refresh-token')) {
      
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Si no se puede renovar el token, logout
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Error handling centralizado
    if (error.response) {
      // Mostrar mensajes de error consistentes
      const errorMessage = error.response.data?.error?.message || 'Error en la solicitud';
      
      // Aquí puede integrar con su sistema de notificaciones
      // notificationService.showError(errorMessage);
      
      console.error('API Error:', errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Servicios API

Recomendamos estructurar su código con servicios dedicados para cada recurso:

```javascript
// authService.js
import apiClient from './apiClient';

export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    const { token, refreshToken, user } = response.data;
    
    // Guardar en localStorage o sessionStorage según su política de seguridad
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    // Limpiar almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const getToken = () => localStorage.getItem('token');

export const refreshToken = async () => {
  const currentRefreshToken = localStorage.getItem('refreshToken');
  
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await apiClient.post('/auth/refresh-token', {
      refreshToken: currentRefreshToken
    });
    
    const { token, refreshToken: newRefreshToken } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return token;
  } catch (error) {
    throw error;
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  // Verificar si el token ha expirado
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convertir a milisegundos
    
    return Date.now() < expiryTime;
  } catch (error) {
    return false;
  }
};
```

```javascript
// documentService.js
import apiClient from './apiClient';

export const getDocuments = async (params = {}) => {
  try {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDocumentById = async (id) => {
  try {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDocument = async (documentData) => {
  try {
    const response = await apiClient.post('/documents', documentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDocument = async (id, documentData) => {
  try {
    const response = await apiClient.put(`/documents/${id}`, documentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const changeDocumentStatus = async (id, statusData) => {
  try {
    const response = await apiClient.patch(`/documents/${id}/estado`, statusData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deriveDocument = async (id, derivationData) => {
  try {
    const response = await apiClient.post(`/documents/${id}/derivar`, derivationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

## Manejo de Permisos en Frontend

Para implementar control de acceso basado en permisos en su interfaz:

```javascript
// permissionUtils.js
export const checkPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions) return false;
  
  // Conversión de los permisos textuales a valores de bit
  const permissionBits = {
    'crear': 1,      // Bit 0
    'editar': 2,     // Bit 1
    'eliminar': 4,   // Bit 2
    'ver': 8,        // Bit 3
    'derivar': 16,   // Bit 4
    'asignar': 32,   // Bit 5
    'exportar': 64,  // Bit 6
    'auditar': 128   // Bit 7
  };
  
  // Si es una cadena, convertir a valor de bit
  const requiredBit = typeof requiredPermission === 'string' 
    ? permissionBits[requiredPermission] 
    : requiredPermission;
  
  // Devolver verdadero si el usuario tiene el permiso
  return (userPermissions & requiredBit) === requiredBit;
};

// Componente de autorización
export const PermissionGuard = ({ children, permission, fallback = null }) => {
  const { user } = useAuth(); // Su hook de autenticación
  
  if (!user) return fallback;
  
  const hasPermission = checkPermission(user.permisos, permission);
  
  return hasPermission ? children : fallback;
};
```

Ejemplo de uso:

```jsx
<PermissionGuard permission="crear">
  <button onClick={handleCreate}>Crear Documento</button>
</PermissionGuard>
```

## Gestión de Carga de Archivos

Para subir archivos al servidor:

```javascript
// fileService.js
import apiClient from './apiClient';

export const uploadDocumentFile = async (documentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await apiClient.post(`/documents/${documentId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDocumentFiles = async (documentId) => {
  try {
    const response = await apiClient.get(`/documents/${documentId}/files`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadDocumentFile = async (documentId, fileId) => {
  try {
    const response = await apiClient.get(`/documents/${documentId}/files/${fileId}/download`, {
      responseType: 'blob'
    });
    
    // Crear URL del objeto blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Extraer nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }
    
    // Crear elemento <a> para descargar
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    throw error;
  }
};
```

## Integración con Redux Toolkit

Si está utilizando Redux Toolkit con React, aquí tiene un ejemplo de configuración:

```javascript
// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.logout();
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.error || 'Error de autenticación';
    });
    
    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
```

## Gestión de Estados en Tiempo Real

Para implementar actualizaciones en tiempo real (como notificaciones), recomendamos utilizar WebSockets:

```javascript
// websocketService.js
import { io } from 'socket.io-client';
import config from './config';
import { getToken } from './authService';

let socket = null;

export const initializeSocket = () => {
  if (socket) return socket;
  
  socket = io(config.api.baseUrl, {
    auth: {
      token: getToken()
    }
  });
  
  socket.on('connect', () => {
    console.log('WebSocket conectado');
  });
  
  socket.on('disconnect', () => {
    console.log('WebSocket desconectado');
  });
  
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Suscribirse a eventos del usuario actual
export const subscribeToUserEvents = (userId, callback) => {
  if (!socket) initializeSocket();
  
  socket.on(`user:${userId}:notification`, callback);
  
  return () => {
    socket.off(`user:${userId}:notification`, callback);
  };
};

// Suscribirse a eventos de un documento específico
export const subscribeToDocumentUpdates = (documentId, callback) => {
  if (!socket) initializeSocket();
  
  socket.on(`document:${documentId}:update`, callback);
  
  return () => {
    socket.off(`document:${documentId}:update`, callback);
  };
};
```

## Manejo de Paginación

Para implementar la paginación de manera eficiente:

```jsx
// components/PaginatedTable.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments } from '../store/slices/documentSlice';

const PaginatedTable = () => {
  const dispatch = useDispatch();
  const { 
    documents, 
    pagination, 
    loading,
    error 
  } = useSelector(state => state.documents);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    fechaInicio: '',
    fechaFin: ''
  });
  
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, filters]);
  
  const loadData = () => {
    dispatch(fetchDocuments({
      page: currentPage,
      limit: pageSize,
      ...filters
    }));
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Resetear a primera página al cambiar filtros
  };
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {/* Formulario de filtros */}
      <div className="filters">
        <input
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
        </select>
        {/* Más filtros... */}
      </div>
      
      {/* Tabla de datos */}
      <table>
        <thead>
          <tr>
            <th>Nro. Registro</th>
            <th>Nro. Oficio</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Área Actual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.IDDocumento}>
              <td>{doc.NroRegistro}</td>
              <td>{doc.NumeroOficioDocumento}</td>
              <td>{new Date(doc.FechaDocumento).toLocaleDateString()}</td>
              <td>{doc.Estado}</td>
              <td>{doc.NombreAreaActual}</td>
              <td>
                {/* Botones de acción */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Controles de paginación */}
      <div className="pagination">
        <button 
          disabled={!pagination.hasPrevious} 
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Anterior
        </button>
        
        <span>
          Página {pagination.currentPage} de {pagination.totalPages}
          ({pagination.totalItems} registros)
        </span>
        
        <button 
          disabled={!pagination.hasNext} 
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Siguiente
        </button>
        
        <select 
          value={pageSize} 
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
          <option value={100}>100 por página</option>
        </select>
      </div>
    </div>
  );
};

export default PaginatedTable;
```

## Validación de Datos

Para validación de formularios, recomendamos utilizar Yup junto con Formik:

```javascript
// schemas/documentSchema.js
import * as Yup from 'yup';

export const documentSchema = Yup.object().shape({
  NroRegistro: Yup.string()
    .required('El número de registro es obligatorio')
    .matches(/^REG-\d{4}-\d{3,}$/, 'Formato inválido. Debe ser REG-YYYY-XXX'),
  
  NumeroOficioDocumento: Yup.string()
    .required('El número de oficio es obligatorio')
    .matches(/^OF-\d{4}-\d{3,}$/, 'Formato inválido. Debe ser OF-YYYY-XXX'),
  
  FechaDocumento: Yup.date()
    .required('La fecha es obligatoria')
    .max(new Date(), 'La fecha no puede ser futura'),
  
  OrigenDocumento: Yup.string()
    .required('El origen es obligatorio')
    .oneOf(['INTERNO', 'EXTERNO'], 'Origen inválido'),
  
  IDMesaPartes: Yup.number()
    .required('La mesa de partes es obligatoria')
    .positive('ID inválido'),
  
  IDAreaActual: Yup.number()
    .required('El área es obligatoria')
    .positive('ID inválido'),
  
  Procedencia: Yup.string()
    .required('La procedencia es obligatoria')
    .max(255, 'Máximo 255 caracteres'),
  
  Contenido: Yup.string()
    .required('El contenido es obligatorio')
    .max(1000, 'Máximo 1000 caracteres')
});
```

## Consideraciones de Seguridad 

1. **Almacenamiento de Tokens**: 
   - Nunca almacene tokens JWT en localStorage si su aplicación maneja datos sensibles
   - Preferentemente use cookies HttpOnly o, como alternativa, almacenamiento en memoria

2. **XSS y CSRF**:
   - La API incluye protección CSRF para rutas mutantes (POST, PUT, DELETE)
   - Utilice siempre la sanitización y escape de datos en su frontend

3. **Política de Contraseñas**:
   - Implemente validación en frontend que coincida con los requisitos del backend:
     - Mínimo 8 caracteres
     - Al menos una letra mayúscula
     - Al menos una letra minúscula
     - Al menos un número
     - Al menos un carácter especial

## Datos de Prueba en Sandbox

Para facilitar el desarrollo, el entorno Sandbox incluye datos preconfigurados. Puede utilizar los siguientes usuarios para probar diferentes funcionalidades:

| Rol               | CodigoCIP | Contraseña  | Permisos          |
|-------------------|-----------|-------------|--------------------|
| Administrador     | 12345678  | admin123    | Todos (255)        |
| Mesa de Partes    | 23456789  | admin123    | Crear, Editar, Ver, Derivar, Exportar (91)|
| Responsable Área  | 34567890  | admin123    | Crear, Editar, Ver, Derivar, Exportar (91)|
| Operador          | 67890123  | admin123    | Crear, Editar, Ver (11) |

> **Nota**: En entorno de desarrollo, el sistema acepta "admin123" como contraseña válida para cualquier usuario para facilitar las pruebas. Este comportamiento está desactivado automáticamente en producción por seguridad.

## Soporte y Resolución de Problemas

Si encuentra problemas al integrar con la API, revise la siguiente lista de verificación:

1. **CORS**: Asegúrese de que su dominio esté en la lista de orígenes permitidos
2. **Autenticación**: Verifique que el token JWT sea válido y no haya expirado
3. **Permisos**: Confirme que el usuario tiene los permisos necesarios para la operación
4. **Validación**: Revise las reglas de validación del backend para asegurar que los datos enviados sean correctos

Para soporte adicional, contacte al equipo de backend a través de los canales oficiales mencionados en la documentación de la API. 