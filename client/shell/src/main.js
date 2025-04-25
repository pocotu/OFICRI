import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import store from './store'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'vue-toastification/dist/index.css'
import Toast from 'vue-toastification'
import setupMonitoring from './utils/monitoring'
import assetLoader from './utils/assetLoader'
import dynamicImports from './utils/dynamicImports'
import { ApiCachePlugin } from './utils/apiCache'
import { BundleOptimizerPlugin } from './utils/bundleOptimizer'
import { TestUtilsPlugin } from './utils/testUtils'
import { AccessibilityPlugin } from '@shared/src/services/accessibility/accessibilityService'
import { auditService } from '@shared/src/services/security/auditTrail'
import axios from 'axios'

// Configuración para detección de rendimiento
const APP_START_TIME = performance.now()

// Configuración global de axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
// No modificar la configuración global para evitar interferir con código existente
// axios.defaults.baseURL = API_URL
console.log('URL de la API configurada:', API_URL)

// Crear una instancia de axios separada para uso general
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Aplicar los interceptores solo a esta instancia
apiClient.interceptors.request.use(
  config => {
    console.log(`Petición ${config.method.toUpperCase()} a ${config.url}`)
    return config
  },
  error => {
    console.error('Error en petición:', error)
    return Promise.reject(error)
  }
)

const app = createApp(App)
const pinia = createPinia()

// Configurar plugins
app.use(pinia)
app.use(router)
// app.use(store) // Redundante, pinia ya está instalado
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 3,
  newestOnTop: true
})
app.use(assetLoader.plugin)
app.use(dynamicImports.plugin)
app.use(ApiCachePlugin)
app.use(BundleOptimizerPlugin)
app.use(TestUtilsPlugin)
app.use(AccessibilityPlugin)

// Configurar monitoreo de rendimiento y errores
setupMonitoring(app)

// Configurar la ruta para usar en la app
app.config.globalProperties.$apiUrl = API_URL

// Función para cargar módulos remotos con priorización y manejo de errores
async function loadRemoteModules() {
  console.log('Skipping aggressive remote module loading for now...');
  // Comentando toda la lógica de carga activa de módulos remotos
  // La carga se manejará principalmente a través del router y los alias de Vite
  /*
  try {
    console.log('Cargando módulos remotos...')
    
    // Lista de módulos con prioridades (menor número = mayor prioridad)
    const modulesToLoad = [
      { name: 'auth', priority: 1 },
      { name: 'shared', priority: 2 },
      { name: 'dashboard', priority: 3 },
      { name: 'documents', priority: 4 },
      { name: 'mesaPartes', priority: 5 },
      { name: 'users', priority: 6 },
      { name: 'areas', priority: 7 },
      { name: 'security', priority: 8 }
    ]

    // Ordenar por prioridad
    modulesToLoad.sort((a, b) => a.priority - b.priority)
    
    // Registro de inicio para monitoreo
    const moduleLoadingStartTime = performance.now()

    for (const moduleInfo of modulesToLoad) {
      try {
        const moduleName = moduleInfo.name
        const moduleStartTime = performance.now()
        
        // Importación dinámica del módulo usando el nuevo sistema
        const module = await dynamicImports.load({
          name: moduleName,
          strategy: 'eager'
        })
        console.log(`Módulo cargado: ${moduleName}`)
        
        // Registrar rutas del módulo
        if (module.routes) {
          module.routes.forEach(route => {
            // Convertir componentes a lazy loading si aún no lo son
            if (route.component && typeof route.component !== 'function') {
              const originalComponent = route.component
              route.component = () => Promise.resolve(originalComponent)
            }
            
            // Lo mismo para componentes hijos
            if (route.children) {
              route.children.forEach(childRoute => {
                if (childRoute.component && typeof childRoute.component !== 'function') {
                  const originalChildComponent = childRoute.component
                  childRoute.component = () => Promise.resolve(originalChildComponent)
                }
              })
            }
            
            router.addRoute(route)
            
            // Precargar recursos asociados a la ruta
            if (route.meta?.preload) {
              dynamicImports.preloadRoute(route)
            }
          })
        }
        
        // Ejecutar función de inicialización del módulo si existe
        if (module.init) {
          module.init(app, router)
        }
        
        // Métricas de carga del módulo
        const moduleLoadTime = performance.now() - moduleStartTime
        console.log(`Tiempo de carga para ${moduleName}: ${moduleLoadTime.toFixed(2)}ms`)
      } catch (moduleError) {
        console.error(`Error al cargar módulo ${moduleInfo.name}:`, moduleError)
        // Continuar con el siguiente módulo
      }
    }
    
    // Métricas totales de carga de módulos
    const totalModuleLoadTime = performance.now() - moduleLoadingStartTime
    console.log(`Tiempo total de carga de módulos: ${totalModuleLoadTime.toFixed(2)}ms`)
    
  } catch (error) {
    console.error('Error al cargar módulos remotos:', error)
  }
  */
}

// Inicializar la aplicación después de cargar los módulos
loadRemoteModules().then(() => {
  app.mount('#app')
  const totalLoadTime = performance.now() - APP_START_TIME
  console.log(`Aplicación montada en ${totalLoadTime.toFixed(2)}ms`)

  // Monitorear caché de API
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      const stats = app.config.globalProperties.$apiCache.stats()
      await auditService.logPerformanceMetrics({
        type: 'apiCache',
        metrics: stats,
        timestamp: new Date()
      })
    }, 5 * 60 * 1000) // Cada 5 minutos

    // Monitorear optimización de bundles
    setInterval(async () => {
      const stats = app.config.globalProperties.$bundleOptimizer.stats()
      await auditService.logPerformanceMetrics({
        type: 'bundleOptimization',
        metrics: stats,
        timestamp: new Date()
      })
    }, 10 * 60 * 1000) // Cada 10 minutos

    // Monitorear pruebas
    setInterval(async () => {
      const stats = app.config.globalProperties.$testUtils.stats()
      await auditService.logPerformanceMetrics({
        type: 'tests',
        metrics: stats,
        timestamp: new Date()
      })
    }, 15 * 60 * 1000) // Cada 15 minutos
  }
})