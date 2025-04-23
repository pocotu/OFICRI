import { ref } from 'vue'
import { auditService } from '@shared/src/services/security/auditTrail'
import { permissionService } from '@shared/src/services/permissions/permissionService.js'

// Estrategias de caché
const CACHE_STRATEGIES = {
  MEMORY: 'memory',
  SESSION: 'session',
  LOCAL: 'local'
}

// Estado del caché
const cacheState = ref({
  memory: new Map(),
  hits: 0,
  misses: 0,
  size: 0,
  lastCleanup: Date.now()
})

// Configuración del caché
const cacheConfig = {
  maxSize: 100, // Número máximo de entradas
  ttl: 5 * 60 * 1000, // 5 minutos
  cleanupInterval: 10 * 60 * 1000 // 10 minutos
}

// Función para obtener la clave del caché
function getCacheKey(endpoint, params) {
  return `${endpoint}:${JSON.stringify(params)}`
}

// Función para limpiar el caché
function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of cacheState.value.memory) {
    if (now - value.timestamp > cacheConfig.ttl) {
      cacheState.value.memory.delete(key)
      cacheState.value.size--
    }
  }
  cacheState.value.lastCleanup = now
}

// Función para verificar permisos de caché
async function checkCachePermission(endpoint) {
  return await permissionService.checkContextualPermission({
    module: 'apiCache',
    action: 'access',
    context: endpoint
  })
}

// Función principal para obtener datos del caché
export async function getFromCache(endpoint, params, strategy = CACHE_STRATEGIES.MEMORY) {
  if (!await checkCachePermission(endpoint)) {
    throw new Error('No tiene permisos para acceder al caché')
  }

  const key = getCacheKey(endpoint, params)
  
  // Limpiar caché si es necesario
  if (Date.now() - cacheState.value.lastCleanup > cacheConfig.cleanupInterval) {
    cleanupCache()
  }

  const cached = cacheState.value.memory.get(key)
  
  if (cached && Date.now() - cached.timestamp < cacheConfig.ttl) {
    cacheState.value.hits++
    await auditService.logCacheHit({
      endpoint,
      key,
      timestamp: new Date()
    })
    return cached.data
  }

  cacheState.value.misses++
  await auditService.logCacheMiss({
    endpoint,
    key,
    timestamp: new Date()
  })
  return null
}

// Función para guardar en caché
export async function setInCache(endpoint, params, data, strategy = CACHE_STRATEGIES.MEMORY) {
  if (!await checkCachePermission(endpoint)) {
    throw new Error('No tiene permisos para modificar el caché')
  }

  const key = getCacheKey(endpoint, params)
  
  // Verificar tamaño máximo
  if (cacheState.value.size >= cacheConfig.maxSize) {
    cleanupCache()
  }

  cacheState.value.memory.set(key, {
    data,
    timestamp: Date.now()
  })
  cacheState.value.size++

  await auditService.logCacheSet({
    endpoint,
    key,
    size: JSON.stringify(data).length,
    timestamp: new Date()
  })
}

// Función para obtener estadísticas del caché
export function getCacheStats() {
  return {
    hits: cacheState.value.hits,
    misses: cacheState.value.misses,
    size: cacheState.value.size,
    hitRate: cacheState.value.hits / (cacheState.value.hits + cacheState.value.misses) || 0,
    lastCleanup: new Date(cacheState.value.lastCleanup)
  }
}

// Plugin Vue para el caché
export const ApiCachePlugin = {
  install(app) {
    app.provide('apiCache', {
      get: getFromCache,
      set: setInCache,
      stats: getCacheStats,
      strategies: CACHE_STRATEGIES
    })
  }
}

export default {
  get: getFromCache,
  set: setInCache,
  stats: getCacheStats,
  strategies: CACHE_STRATEGIES,
  plugin: ApiCachePlugin
} 