# Ejemplos de Integración Frontend - OFICRI

Este documento proporciona ejemplos prácticos de implementación en React para integrar el frontend con los endpoints definidos en `endpoints-config.md`.

## 1. Configuración Base

```javascript
// src/api/config.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME: `${API_BASE_URL}/auth/me`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },
  USERS: {
    BASE: `${API_BASE_URL}/users`,
    DETAIL: (id) => `${API_BASE_URL}/users/${id}`,
    BLOCK: (id) => `${API_BASE_URL}/users/${id}/block`,
  },
  // Continuar con otros endpoints...
};

// Configuración de Axios
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redireccionar a login o refrescar token
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 2. Autenticación

```javascript
// src/hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import api, { ENDPOINTS } from '../api/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadUserFromToken() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get(ENDPOINTS.AUTH.ME);
          setUser(response.data.user);
        } catch (error) {
          console.error('Error cargando usuario:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    }
    
    loadUserFromToken();
  }, []);
  
  const login = async (cip, password) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, { cip, password });
      const { token, user, redirectUrl } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return { success: true, redirectUrl };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error de autenticación' 
      };
    }
  };
  
  const logout = async () => {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/login';
    }
  };
  
  const hasPermission = (permBit) => {
    if (!user || !user.permisos) return false;
    return (user.permisos & permBit) !== 0;
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## 3. Página de Login

```jsx
// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const [cip, setCip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(cip, password);
    
    if (result.success) {
      navigate(result.redirectUrl || '/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="login-container">
      <div className="login-form">
        <h1>OFICRI</h1>
        <h2>Iniciar Sesión</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cip">CIP</label>
            <input
              type="text"
              id="cip"
              value={cip}
              onChange={(e) => setCip(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
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
    </div>
  );
}

export default LoginPage;
```

## 4. Componente de Ruta Protegida con Permisos

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const permissionBits = {
  CREATE: 1,    // bit 0
  EDIT: 2,      // bit 1
  DELETE: 4,    // bit 2
  VIEW: 8,      // bit 3
  DERIVE: 16,   // bit 4
  AUDIT: 32,    // bit 5
  EXPORT: 64,   // bit 6
  BLOCK: 128,   // bit 7
};

function ProtectedRoute({ 
  children, 
  requiredPermission = null,
  redirectTo = '/unauthorized'
}) {
  const { user, loading, hasPermission } = useAuth();
  
  // Esperando autenticación
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // No autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificación de permisos si se requiere
  if (requiredPermission !== null && !hasPermission(requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
}

export { ProtectedRoute, permissionBits };
```

## 5. Configuración de Rutas

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute, permissionBits } from './components/ProtectedRoute';

// Páginas
import LoginPage from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import UsersList from './pages/admin/UsersList';
import DocumentsList from './pages/admin/DocumentsList';
import MesaPartesInbox from './pages/mesaPartes/Inbox';
import AreaInbox from './pages/area/Inbox';
import UnauthorizedPage from './pages/Unauthorized';
// Más páginas...

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas protegidas para Administrador */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredPermission={permissionBits.VIEW}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requiredPermission={permissionBits.VIEW}>
                <UsersList />
              </ProtectedRoute>
            } 
          />
          
          {/* Rutas para Mesa de Partes */}
          <Route 
            path="/mesa-partes/documentos/recibidos" 
            element={
              <ProtectedRoute requiredPermission={permissionBits.VIEW}>
                <MesaPartesInbox />
              </ProtectedRoute>
            } 
          />
          
          {/* Rutas para Responsable de Área */}
          <Route 
            path="/area/documentos/recibidos" 
            element={
              <ProtectedRoute requiredPermission={permissionBits.VIEW}>
                <AreaInbox />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta para acceso no autorizado */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## 6. Ejemplo de Hook para Gestión de Usuarios

```javascript
// src/hooks/useUsers.js
import { useState, useCallback } from 'react';
import api, { ENDPOINTS } from '../api/config';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  
  const fetchUsers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(ENDPOINTS.USERS.BASE, { params });
      setUsers(response.data.data);
      setTotal(response.data.count);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar usuarios');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getUserById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(ENDPOINTS.USERS.DETAIL(id));
      return response.data.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar el usuario');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(ENDPOINTS.USERS.BASE, userData);
      return { success: true, data: response.data.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear usuario');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateUser = useCallback(async (id, userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(ENDPOINTS.USERS.DETAIL(id), userData);
      return { success: true, data: response.data.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar usuario');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);
  
  const deleteUser = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(ENDPOINTS.USERS.DETAIL(id));
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar usuario');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);
  
  const blockUser = useCallback(async (id, blocked) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(ENDPOINTS.USERS.BLOCK(id), { blocked });
      return { success: true, data: response.data.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Error al bloquear/desbloquear usuario');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    users,
    total,
    loading,
    error,
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    blockUser
  };
}
```

## 7. Componente para Tabla de Usuarios

```jsx
// src/components/admin/UsersTable.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { permissionBits } from '../ProtectedRoute';

function UsersTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('nombre');
  const [order, setOrder] = useState('asc');
  
  const { users, total, loading, error, fetchUsers, blockUser, deleteUser } = useUsers();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  
  // Permiso para editar y eliminar
  const canEdit = hasPermission(permissionBits.EDIT);
  const canDelete = hasPermission(permissionBits.DELETE);
  const canBlock = hasPermission(permissionBits.BLOCK);
  
  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers({
        offset: (page - 1) * limit,
        limit,
        search,
        sort,
        order
      });
    };
    
    loadUsers();
  }, [fetchUsers, page, limit, search, sort, order]);
  
  const handleEdit = (userId) => {
    navigate(`/admin/users/edit/${userId}`);
  };
  
  const handleDelete = async (userId) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      const result = await deleteUser(userId);
      if (result.success) {
        await fetchUsers({
          offset: (page - 1) * limit,
          limit,
          search,
          sort,
          order
        });
      }
    }
  };
  
  const handleBlock = async (userId, currentStatus) => {
    const result = await blockUser(userId, !currentStatus);
    if (result.success) {
      await fetchUsers({
        offset: (page - 1) * limit,
        limit,
        search,
        sort,
        order
      });
    }
  };
  
  return (
    <div className="users-table-container">
      <div className="table-filters">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>CIP</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={user.blocked ? 'blocked-row' : ''}>
                  <td>{user.cip}</td>
                  <td>{user.nombre}</td>
                  <td>{user.rolNombre}</td>
                  <td>{user.areaNombre}</td>
                  <td>{user.blocked ? 'Bloqueado' : 'Activo'}</td>
                  <td className="actions-cell">
                    {canEdit && (
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(user.id)}
                      >
                        Editar
                      </button>
                    )}
                    
                    {canBlock && (
                      <button
                        className={user.blocked ? 'unblock-btn' : 'block-btn'}
                        onClick={() => handleBlock(user.id, user.blocked)}
                      >
                        {user.blocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    )}
                    
                    {canDelete && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(user.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination">
            <span>
              Mostrando {users.length} de {total} usuarios
            </span>
            <div className="pagination-controls">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span>Página {page}</span>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UsersTable;
```

## 8. Formulario para Creación de Usuarios

```jsx
// src/components/admin/UserForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUsers } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import { useAreas } from '../../hooks/useAreas';

function UserForm() {
  const { id } = useParams();
  const isEditing = !!id;
  
  const initialFormState = {
    cip: '',
    nombre: '',
    email: '',
    telefono: '',
    idRol: '',
    idArea: '',
    permisos: 0,
    password: '',
    passwordConfirm: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  
  const { getUserById, createUser, updateUser } = useUsers();
  const { roles, fetchRoles } = useRoles();
  const { areas, fetchAreas } = useAreas();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchRoles(),
        fetchAreas()
      ]);
      
      if (isEditing) {
        const userData = await getUserById(id);
        if (userData) {
          setFormData({
            ...userData,
            password: '',
            passwordConfirm: ''
          });
        }
      }
    };
    
    loadData();
  }, [fetchRoles, fetchAreas, getUserById, id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al modificar campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cip) newErrors.cip = 'El CIP es obligatorio';
    if (!formData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.idRol) newErrors.idRol = 'Debe seleccionar un rol';
    if (!formData.idArea) newErrors.idArea = 'Debe seleccionar un área';
    
    if (!isEditing) {
      if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
      if (formData.password !== formData.passwordConfirm) {
        newErrors.passwordConfirm = 'Las contraseñas no coinciden';
      }
    } else if (formData.password && formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const userData = { ...formData };
    
    // Eliminar confirmación de contraseña
    delete userData.passwordConfirm;
    
    // Si no se proporciona contraseña en edición, eliminarla
    if (isEditing && !userData.password) {
      delete userData.password;
    }
    
    let result;
    if (isEditing) {
      result = await updateUser(id, userData);
    } else {
      result = await createUser(userData);
    }
    
    if (result.success) {
      navigate('/admin/users');
    } else if (result.error) {
      alert(result.error);
    }
  };
  
  return (
    <div className="user-form-container">
      <h2>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
      
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="cip">CIP *</label>
          <input
            type="text"
            id="cip"
            name="cip"
            value={formData.cip}
            onChange={handleChange}
          />
          {errors.cip && <span className="error">{errors.cip}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="nombre">Nombre Completo *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
          />
          {errors.nombre && <span className="error">{errors.nombre}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="text"
            id="telefono"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="idRol">Rol *</label>
          <select
            id="idRol"
            name="idRol"
            value={formData.idRol}
            onChange={handleChange}
          >
            <option value="">Seleccione un rol</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.nombre}
              </option>
            ))}
          </select>
          {errors.idRol && <span className="error">{errors.idRol}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="idArea">Área *</label>
          <select
            id="idArea"
            name="idArea"
            value={formData.idArea}
            onChange={handleChange}
          >
            <option value="">Seleccione un área</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
          {errors.idArea && <span className="error">{errors.idArea}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">{isEditing ? 'Nueva Contraseña' : 'Contraseña *'}</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="passwordConfirm">Confirmar Contraseña</label>
          <input
            type="password"
            id="passwordConfirm"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
          />
          {errors.passwordConfirm && (
            <span className="error">{errors.passwordConfirm}</span>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/admin/users')}
          >
            Cancelar
          </button>
          <button type="submit" className="submit-btn">
            {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;
```

## 9. Integración de Verificación de Permisos

```javascript
// src/utils/permissions.js
export const PERMISSION_BITS = {
  CREATE: 1,    // bit 0
  EDIT: 2,      // bit 1
  DELETE: 4,    // bit 2
  VIEW: 8,      // bit 3
  DERIVE: 16,   // bit 4
  AUDIT: 32,    // bit 5
  EXPORT: 64,   // bit 6
  BLOCK: 128,   // bit 7
};

export const PERMISSION_NAMES = {
  1: 'Crear',
  2: 'Editar',
  4: 'Eliminar',
  8: 'Ver',
  16: 'Derivar',
  32: 'Auditar',
  64: 'Exportar',
  128: 'Bloquear',
};

export function hasPermission(userPerms, permBit) {
  return (userPerms & permBit) !== 0;
}

export function calculatePermissionValue(permissionArray) {
  return permissionArray.reduce((total, permBit) => total | permBit, 0);
}

export function getPermissionArray(permissionValue) {
  const permissions = [];
  
  Object.keys(PERMISSION_BITS).forEach(key => {
    const bit = PERMISSION_BITS[key];
    if ((permissionValue & bit) !== 0) {
      permissions.push(bit);
    }
  });
  
  return permissions;
}

export function getPermissionNames(permissionValue) {
  return getPermissionArray(permissionValue)
    .map(bit => PERMISSION_NAMES[bit])
    .filter(Boolean);
}

// Para permisos contextuales más complejos
export async function checkContextualPermission(api, userId, permBit, resourceId, resourceType) {
  try {
    const response = await api.post('/api/permisos/verificar', {
      idUsuario: userId,
      permisoBit: permBit,
      recursoId: resourceId,
      tipoRecurso: resourceType
    });
    
    return response.data.tienePermiso;
  } catch (error) {
    console.error('Error verificando permiso:', error);
    return false;
  }
}
```

## 10. Componente de Dashboard Administrativo

```jsx
// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import api, { ENDPOINTS } from '../../api/config';
import { 
  LineChart, BarChart, PieChart, // Componentes de gráficos
  StatisticCard // Componente para mostrar estadísticas
} from '../../components/charts';
import AdminLayout from '../../layouts/AdminLayout';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState('semana');
  
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/api/dashboard/admin`, {
          params: { periodo }
        });
        setStats(response.data.data);
      } catch (err) {
        setError('Error cargando datos del dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [periodo]);
  
  if (loading) return <div className="loading">Cargando dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return null;
  
  const { 
    documentosStats, 
    usuariosStats, 
    areasActividad, 
    documentosProcesados 
  } = stats;
  
  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard Administrativo</h1>
          
          <div className="period-selector">
            <button 
              className={periodo === 'dia' ? 'active' : ''}
              onClick={() => setPeriodo('dia')}
            >
              Hoy
            </button>
            <button 
              className={periodo === 'semana' ? 'active' : ''}
              onClick={() => setPeriodo('semana')}
            >
              Última Semana
            </button>
            <button 
              className={periodo === 'mes' ? 'active' : ''}
              onClick={() => setPeriodo('mes')}
            >
              Último Mes
            </button>
          </div>
        </div>
        
        <div className="stats-cards">
          <StatisticCard 
            title="Documentos Totales" 
            value={documentosStats.total} 
            icon="document" 
          />
          <StatisticCard 
            title="Documentos Pendientes" 
            value={documentosStats.pendientes} 
            icon="pending" 
            color="orange"
          />
          <StatisticCard 
            title="Documentos Completados" 
            value={documentosStats.completados} 
            icon="complete" 
            color="green"
          />
          <StatisticCard 
            title="Usuarios Activos" 
            value={usuariosStats.activos} 
            icon="user" 
          />
        </div>
        
        <div className="charts-row">
          <div className="chart-container">
            <h3>Documentos Procesados</h3>
            <LineChart data={documentosProcesados} />
          </div>
          
          <div className="chart-container">
            <h3>Actividad por Área</h3>
            <BarChart data={areasActividad} />
          </div>
        </div>
        
        <div className="charts-row">
          <div className="chart-container">
            <h3>Distribución de Documentos</h3>
            <PieChart data={documentosStats.distribucion} />
          </div>
          
          <div className="stats-table">
            <h3>Solicitudes por Tipo</h3>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {documentosStats.tiposSolicitud.map((item, index) => (
                  <tr key={index}>
                    <td>{item.tipo}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.porcentaje}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
```

## Notas Técnicas

1. **Seguridad en el Frontend**: Aunque el frontend realiza verificación de permisos, siempre debe combinarse con verificaciones en el backend para cada solicitud.

2. **Manejo de Errores**: Las solicitudes a la API incluyen manejo de errores centralizado a través de interceptores y hooks personalizados.

3. **Gestión de Estado**: Para aplicaciones más complejas, considere usar Redux o Context API más avanzados para gestionar el estado global.

4. **Verificación de Permisos Contextuales**: Para permisos que dependen del contexto, utilice siempre la función `checkContextualPermission` que consulta al servidor.

5. **Optimización de Rendimiento**: Implemente:
   - Memorización (useMemo, useCallback)
   - Paginación para grandes conjuntos de datos
   - Carga diferida de componentes

6. **Consistencia de UI**: Utilice componentes reutilizables y un sistema de diseño consistente para toda la aplicación. 