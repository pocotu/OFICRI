# Guía de Integración API - OFICRI

Esta guía detalla cómo integrar los micro frontends con la API RESTful del backend de OFICRI, incluyendo ejemplos de código, manejo de autenticación y mejores prácticas.

## Configuración Básica

### 1. Cliente HTTP

Usaremos Axios como cliente HTTP para comunicarnos con la API:

```javascript
// shared/services/api/http-client.js
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import router from '../../router';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para añadir token a las peticiones
apiClient.interceptors.request.use(
  config => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const authStore = useAuthStore();
    
    // Si el error es 401 (Unauthorized) y tenemos refresh token
    if (error.response?.status === 401 && authStore.refreshToken) {
      try {
        // Intentar renovar el token
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          { refreshToken: authStore.refreshToken }
        );
        
        // Actualizar tokens en el store
        authStore.setToken(response.data.token);
        authStore.setRefreshToken(response.data.refreshToken);
        
        // Reintentar la petición original
        const originalRequest = error.config;
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Si falla la renovación, cerrar sesión
        authStore.logout();
        router.push('/login');
        return Promise.reject(error);
      }
    }
    
    // Manejar otros errores
    if (error.response?.status === 403) {
      router.push('/acceso-denegado');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Servicios API por Módulo

Cada micro frontend tendrá sus propios servicios para comunicarse con la API:

## Módulo de Autenticación

```javascript
// auth/services/auth-service.js
import apiClient from '@shared/services/api/http-client';

export default {
  /**
   * Iniciar sesión con CIP y contraseña
   * @param {string} codigoCIP - Código de Identificación Policial
   * @param {string} password - Contraseña
   * @returns {Promise} - Respuesta con token y datos de usuario
   */
  login(codigoCIP, password) {
    return apiClient.post('/auth/login', { codigoCIP, password });
  },
  
  /**
   * Cerrar sesión
   * @param {string} refreshToken - Token de refresco
   * @returns {Promise} - Respuesta de confirmación
   */
  logout(refreshToken) {
    return apiClient.post('/auth/logout', { refreshToken });
  },
  
  /**
   * Verificar validez del token actual
   * @returns {Promise} - Respuesta con información del usuario
   */
  verifyToken() {
    return apiClient.get('/auth/verificar-token');
  },
  
  /**
   * Renovar token usando refresh token
   * @param {string} refreshToken - Token de refresco
   * @returns {Promise} - Respuesta con nuevos tokens
   */
  refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh', { refreshToken });
  },
  
  /**
   * Cambiar contraseña del usuario actual
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise} - Respuesta de confirmación
   */
  changePassword(currentPassword, newPassword) {
    return apiClient.put('/auth/cambio-password', {
      passwordActual: currentPassword,
      passwordNueva: newPassword
    });
  }
};
```

## Módulo de Documentos

```javascript
// documents/services/document-service.js
import apiClient from '@shared/services/api/http-client';

export default {
  /**
   * Obtener lista paginada de documentos
   * @param {Object} params - Parámetros de paginación y filtros
   * @returns {Promise} - Respuesta con lista de documentos
   */
  getDocuments(params = {}) {
    return apiClient.get('/documents', { params });
  },
  
  /**
   * Obtener un documento por su ID
   * @param {number} id - ID del documento
   * @returns {Promise} - Respuesta con datos del documento
   */
  getDocument(id) {
    return apiClient.get(`/documents/${id}`);
  },
  
  /**
   * Crear un nuevo documento
   * @param {Object} document - Datos del documento
   * @returns {Promise} - Respuesta con documento creado
   */
  createDocument(document) {
    return apiClient.post('/documents', document);
  },
  
  /**
   * Actualizar un documento existente
   * @param {number} id - ID del documento
   * @param {Object} document - Datos actualizados
   * @returns {Promise} - Respuesta con documento actualizado
   */
  updateDocument(id, document) {
    return apiClient.put(`/documents/${id}`, document);
  },
  
  /**
   * Eliminar un documento
   * @param {number} id - ID del documento
   * @returns {Promise} - Respuesta de confirmación
   */
  deleteDocument(id) {
    return apiClient.delete(`/documents/${id}`);
  },
  
  /**
   * Derivar un documento a otra área
   * @param {number} id - ID del documento
   * @param {Object} derivation - Datos de derivación
   * @returns {Promise} - Respuesta con estado de derivación
   */
  deriveDocument(id, derivation) {
    return apiClient.post(`/documents/${id}/derivar`, derivation);
  },
  
  /**
   * Obtener historial de derivaciones
   * @param {number} id - ID del documento
   * @returns {Promise} - Respuesta con historial
   */
  getDocumentHistory(id) {
    return apiClient.get(`/documents/${id}/historico`);
  },
  
  /**
   * Adjuntar archivo a un documento
   * @param {number} id - ID del documento
   * @param {FormData} formData - FormData con el archivo
   * @returns {Promise} - Respuesta con datos del archivo adjunto
   */
  attachFile(id, formData) {
    return apiClient.post(`/documents/${id}/archivo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  /**
   * Descargar archivo adjunto
   * @param {number} id - ID del documento
   * @param {number} fileId - ID del archivo
   * @returns {Promise} - Respuesta con el archivo
   */
  downloadFile(id, fileId) {
    return apiClient.get(`/documents/${id}/archivo/${fileId}`, {
      responseType: 'blob'
    });
  }
};
```

## Módulo de Mesa de Partes

```javascript
// mesa-partes/services/mesa-partes-service.js
import apiClient from '@shared/services/api/http-client';

export default {
  /**
   * Obtener todas las mesas de partes
   * @returns {Promise} - Respuesta con lista de mesas de partes
   */
  getMesasPartes() {
    return apiClient.get('/mesa-partes');
  },
  
  /**
   * Registrar recepción de documento
   * @param {Object} recepcion - Datos de recepción
   * @returns {Promise} - Respuesta con documento registrado
   */
  registrarRecepcion(recepcion) {
    return apiClient.post('/mesa-partes/recepcion', recepcion);
  },
  
  /**
   * Obtener documentos pendientes de derivar
   * @param {Object} params - Parámetros de paginación y filtros
   * @returns {Promise} - Respuesta con documentos pendientes
   */
  getDocumentosPendientes(params = {}) {
    return apiClient.get('/mesa-partes/pendientes', { params });
  },
  
  /**
   * Obtener estadísticas de mesa de partes
   * @param {Object} params - Parámetros de filtros
   * @returns {Promise} - Respuesta con estadísticas
   */
  getEstadisticas(params = {}) {
    return apiClient.get('/mesa-partes/estadisticas', { params });
  }
};
```

## Gestión de Permisos

Para verificar permisos en la UI, usaremos un servicio compartido:

```javascript
// shared/services/permissions/permission-service.js
import apiClient from '../api/http-client';

export const PERMISSION_BITS = {
  CREAR: 1,      // bit 0
  EDITAR: 2,     // bit 1
  ELIMINAR: 4,   // bit 2
  VER: 8,        // bit 3
  DERIVAR: 16,   // bit 4
  AUDITAR: 32,   // bit 5
  EXPORTAR: 64,  // bit 6
  ADMINISTRAR: 128 // bit 7
};

export default {
  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {number} permissionBit - Bit de permiso a verificar
   * @returns {boolean} - True si tiene permiso, false en caso contrario
   */
  hasPermission(permissionBit) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.Permisos) {
      return false;
    }
    return (user.Permisos & permissionBit) === permissionBit;
  },
  
  /**
   * Verificar permiso contextual
   * @param {number} resourceId - ID del recurso
   * @param {string} resourceType - Tipo de recurso (DOCUMENTO, USUARIO, etc.)
   * @param {string} action - Acción a verificar
   * @returns {Promise<boolean>} - Promise que resuelve a true si tiene permiso
   */
  async checkContextualPermission(resourceId, resourceType, action) {
    try {
      const response = await apiClient.post('/permisos/verificar', {
        idRecurso: resourceId,
        tipoRecurso: resourceType,
        accion: action
      });
      return response.data.tienePermiso;
    } catch (error) {
      console.error('Error verificando permiso contextual', error);
      return false;
    }
  }
};
```

## Ejemplos de Uso en Componentes

### Componente de Login

```vue
<!-- auth/components/LoginForm.vue -->
<template>
  <div class="login-form">
    <h1>Inicio de Sesión OFICRI</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="codigoCIP">Código CIP</label>
        <input
          id="codigoCIP"
          v-model="codigoCIP"
          type="text"
          placeholder="Ingrese su Código CIP"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="password">Contraseña</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Ingrese su contraseña"
          required
        />
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/auth-service';
import { useAuthStore } from '@shared/services/store/auth';

const codigoCIP = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const response = await authService.login(codigoCIP.value, password.value);
    
    // Guardar datos de autenticación
    authStore.setUser(response.data.user);
    authStore.setToken(response.data.token);
    authStore.setRefreshToken(response.data.refreshToken);
    
    // Redirigir a dashboard
    router.push('/dashboard');
  } catch (err) {
    console.error('Error de login:', err);
    error.value = err.response?.data?.message || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
};
</script>
```

### Componente de Listado de Documentos con Permisos

```vue
<!-- documents/components/DocumentList.vue -->
<template>
  <div class="document-list">
    <div class="header">
      <h1>Documentos</h1>
      
      <PermissionGate :permission="PERMISSION_BITS.CREAR">
        <button @click="navigateToCreate">Nuevo Documento</button>
      </PermissionGate>
    </div>
    
    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar documentos..."
        @input="handleSearch"
      />
      
      <select v-model="selectedStatus" @change="fetchDocuments">
        <option value="">Todos los estados</option>
        <option value="RECIBIDO">Recibido</option>
        <option value="EN_PROCESO">En Proceso</option>
        <option value="FINALIZADO">Finalizado</option>
      </select>
      
      <PermissionGate :permission="PERMISSION_BITS.EXPORTAR">
        <button @click="exportDocuments">Exportar</button>
      </PermissionGate>
    </div>
    
    <OfiTable
      :data="documents"
      :columns="columns"
      :loading="loading"
      :total="totalDocuments"
      :page="currentPage"
      :limit="pageSize"
      @page-change="handlePageChange"
    >
      <template #actions="{ row }">
        <div class="actions">
          <PermissionGate :permission="PERMISSION_BITS.VER">
            <button @click="viewDocument(row.ID)">Ver</button>
          </PermissionGate>
          
          <PermissionGate :permission="PERMISSION_BITS.EDITAR">
            <button @click="editDocument(row.ID)">Editar</button>
          </PermissionGate>
          
          <PermissionGate :permission="PERMISSION_BITS.DERIVAR">
            <button @click="deriveDocument(row.ID)">Derivar</button>
          </PermissionGate>
          
          <PermissionGate :permission="PERMISSION_BITS.ELIMINAR">
            <button @click="confirmDeleteDocument(row.ID)">Eliminar</button>
          </PermissionGate>
        </div>
      </template>
    </OfiTable>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import documentService from '../services/document-service';
import OfiTable from '@shared/components/OfiTable/OfiTable.vue';
import PermissionGate from '@shared/components/PermissionGate/PermissionGate.vue';
import { PERMISSION_BITS } from '@shared/services/permissions/permission-service';

const router = useRouter();
const documents = ref([]);
const loading = ref(false);
const totalDocuments = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const selectedStatus = ref('');

const columns = [
  { key: 'Numero', title: 'Número' },
  { key: 'Asunto', title: 'Asunto' },
  { key: 'FechaRegistro', title: 'Fecha Registro' },
  { key: 'Estado', title: 'Estado' },
  { key: 'AreaActual', title: 'Área Actual' },
  { key: 'actions', title: 'Acciones' }
];

const fetchDocuments = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      estado: selectedStatus.value
    };
    
    const response = await documentService.getDocuments(params);
    documents.value = response.data.documents;
    totalDocuments.value = response.data.total;
  } catch (error) {
    console.error('Error fetching documents:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchDocuments();
};

const handleSearch = () => {
  currentPage.value = 1; // Reset to first page on new search
  fetchDocuments();
};

const viewDocument = (id) => {
  router.push(`/documentos/${id}`);
};

const editDocument = (id) => {
  router.push(`/documentos/${id}/editar`);
};

const deriveDocument = (id) => {
  router.push(`/documentos/${id}/derivar`);
};

const navigateToCreate = () => {
  router.push('/documentos/crear');
};

const confirmDeleteDocument = async (id) => {
  if (confirm('¿Está seguro de eliminar este documento?')) {
    try {
      await documentService.deleteDocument(id);
      fetchDocuments(); // Refresh list after deletion
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }
};

const exportDocuments = async () => {
  try {
    const params = {
      search: searchQuery.value,
      estado: selectedStatus.value
    };
    
    const response = await documentService.exportDocuments(params);
    
    // Create download link for blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'documentos.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error exporting documents:', error);
  }
};

onMounted(() => {
  fetchDocuments();
});
</script>
```

## Mejores Prácticas

### 1. Manejo de Errores

Implementar un servicio centralizado para manejo de errores:

```javascript
// shared/services/error-handler.js
import { useNotificationStore } from '../store/notification';

export default {
  handleApiError(error, customMessage = null) {
    const notificationStore = useNotificationStore();
    
    // Extraer mensaje de error
    let errorMessage = customMessage;
    
    if (!errorMessage) {
      if (error.response) {
        // Error de respuesta del servidor
        errorMessage = error.response.data?.message || 
                       `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Error de red (sin respuesta)
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
      } else {
        // Error de configuración
        errorMessage = error.message || 'Error desconocido';
      }
    }
    
    // Mostrar notificación de error
    notificationStore.showError(errorMessage);
    
    // Registrar error en consola
    console.error('API Error:', error);
    
    return errorMessage;
  }
};
```

### 2. Cacheo de Respuestas

Implementar un sistema de caché para reducir peticiones:

```javascript
// shared/services/api/cache-service.js
const cache = new Map();
const DEFAULT_EXPIRATION = 5 * 60 * 1000; // 5 minutos

export default {
  /**
   * Obtener datos de caché
   * @param {string} key - Clave de caché
   * @returns {any|null} - Datos almacenados o null si no existen o han expirado
   */
  get(key) {
    const cached = cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.expiration) {
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  },
  
  /**
   * Almacenar datos en caché
   * @param {string} key - Clave de caché
   * @param {any} data - Datos a almacenar
   * @param {number} [expiration=DEFAULT_EXPIRATION] - Tiempo de expiración en ms
   */
  set(key, data, expiration = DEFAULT_EXPIRATION) {
    cache.set(key, {
      data,
      expiration: Date.now() + expiration
    });
  },
  
  /**
   * Invalidar una entrada de caché
   * @param {string} key - Clave de caché
   */
  invalidate(key) {
    cache.delete(key);
  },
  
  /**
   * Invalidar todas las entradas que coincidan con un patrón
   * @param {RegExp} pattern - Patrón para coincidencia
   */
  invalidatePattern(pattern) {
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  },
  
  /**
   * Limpiar toda la caché
   */
  clear() {
    cache.clear();
  }
};
```

### 3. Optimización de Peticiones

Implementar peticiones optimizadas para reducir tráfico:

```javascript
// shared/services/api/optimized-api.js
import apiClient from './http-client';
import cacheService from './cache-service';

/**
 * Realiza una petición GET con soporte de caché
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de la petición
 * @param {boolean} options.useCache - Si se debe usar caché
 * @param {number} options.cacheExpiration - Tiempo de expiración en ms
 * @param {Object} options.params - Parámetros de query
 * @returns {Promise} - Promesa con los datos
 */
export const getCached = async (url, options = {}) => {
  const {
    useCache = true,
    cacheExpiration = 5 * 60 * 1000, // 5 minutos por defecto
    params = {}
  } = options;
  
  // Crear clave de caché
  const cacheKey = `${url}_${JSON.stringify(params)}`;
  
  // Verificar caché si está habilitada
  if (useCache) {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }
  }
  
  // Realizar petición
  const response = await apiClient.get(url, { params });
  
  // Almacenar en caché
  if (useCache) {
    cacheService.set(cacheKey, response.data, cacheExpiration);
  }
  
  return { data: response.data, fromCache: false };
};

/**
 * Invalidar caché después de mutaciones
 * @param {string} pattern - Patrón de clave para invalidar
 */
export const invalidateCache = (pattern) => {
  cacheService.invalidatePattern(new RegExp(pattern));
};
``` 