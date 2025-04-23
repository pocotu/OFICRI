import { ref } from 'vue'
import { auditService } from '@shared/src/services/security/auditTrail'
import { permissionService, PERMISSIONS } from '@shared/src/services/permissions/permissionService.js'
import { useAuthStore } from '@/store/auth'

// Estado global para tracking de módulos
const moduleState = ref({
  loaded: new Set(),
  loading: new Set(),
  failed: new Set(),
  cache: new Map(),
  dependencies: new Map()
})

// Estrategias de precarga
const preloadStrategies = {
  'eager': (module) => loadModule(module),
  'lazy': (module) => {
    if (isModuleNeeded(module)) {
      loadModule(module)
    }
  },
  'prefetch': (module) => {
    if (navigator.connection?.effectiveType !== 'slow-2g') {
      prefetchModule(module)
    }
  }
}

// Función principal para cargar módulos
export async function loadModule(moduleInfo) {
  if (moduleState.value.loaded.has(moduleInfo.name)) {
    return moduleState.value.cache.get(moduleInfo.name)
  }

  // Registrar intento de carga en auditoría
  await auditService.logModuleLoad({
    name: moduleInfo.name,
    context: moduleInfo.context,
    timestamp: new Date()
  })

  if (moduleState.value.loading.has(moduleInfo.name)) {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (moduleState.value.loaded.has(moduleInfo.name)) {
          resolve(moduleState.value.cache.get(moduleInfo.name))
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  moduleState.value.loading.add(moduleInfo.name)

  try {
    const result = await loadModuleByType(moduleInfo)
    moduleState.value.loaded.add(moduleInfo.name)
    moduleState.value.cache.set(moduleInfo.name, result)
    
    // Registrar carga exitosa en auditoría
    await auditService.logModuleLoadSuccess({
      name: moduleInfo.name,
      context: moduleInfo.context,
      timestamp: new Date()
    })
    
    return result
  } catch (error) {
    moduleState.value.failed.add(moduleInfo.name)
    
    // Registrar error en auditoría
    await auditService.logModuleLoadError({
      name: moduleInfo.name,
      context: moduleInfo.context,
      error: error.message,
      timestamp: new Date()
    })
    
    console.error(`Error loading module ${moduleInfo.name}:`, error)
    throw error
  } finally {
    moduleState.value.loading.delete(moduleInfo.name)
  }
}

// Prefetch de módulos
function prefetchModule(module) {
  if (!moduleState.value.prefetched.has(module.path)) {
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = module.path
    document.head.appendChild(link)
    moduleState.value.prefetched.add(module.path)
  }
}

// Verificación de necesidad de módulo
function isModuleNeeded(module) {
  if (module.route) {
    return window.location.pathname.startsWith(module.route)
  }
  return true
}

// Función para precargar rutas
export function preloadRoute(route) {
  const module = {
    path: route.component,
    route: route.path,
    strategy: 'prefetch'
  }
  preloadStrategies.prefetch(module)
}

// Función para precargar recursos
export function preloadResource(resource) {
  const module = {
    path: resource.path,
    type: resource.type,
    strategy: 'prefetch'
  }
  preloadStrategies.prefetch(module)
}

// Plugin Vue para imports dinámicos
export const DynamicImportsPlugin = {
  install(app) {
    app.provide('dynamicImports', {
      load: loadModule,
      preload: (module) => preloadStrategies[module.strategy || 'lazy'](module),
      state: moduleState,
      preloadRoute,
      preloadResource
    })
  }
}

export default {
  load: loadModule,
  preload: (module) => preloadStrategies[module.strategy || 'lazy'](module),
  state: moduleState,
  preloadRoute,
  preloadResource,
  plugin: DynamicImportsPlugin
}

// Carga específica por tipo de módulo
async function loadModuleByType(moduleInfo) {
  try {
    // Usar alias y ruta estándar (ej: @auth/src/index.js)
    const modulePath = `@${moduleInfo.name}/src/index.js`; 
    console.log(`Importando módulo desde: ${modulePath}`);
    return await import(/* @vite-ignore */ modulePath);

    /* // Lógica anterior basada en /remoteEntry.js o path
    if (moduleInfo.path) {
      // Importación dinámica basada en la ruta
      return await import(/* @vite-ignore * / moduleInfo.path);
    } else if (moduleInfo.name) {
      // Importación por nombre de módulo (para módulos federados)
      const moduleUrl = typeof moduleInfo.name === 'string' 
        ? `/${moduleInfo.name}/remoteEntry.js` 
        : moduleInfo.name;
      
      // Registrar inicio de importación
      console.log(`Importando módulo: ${moduleUrl}`);
      
      // Importar el módulo
      return await import(/* @vite-ignore * / moduleUrl);
    } else {
      throw new Error('Se requiere path o name para cargar el módulo');
    }
    */
  } catch (error) {
    console.error(`Error al cargar el módulo:`, error);
    throw error;
  }
} 