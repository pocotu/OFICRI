import { ref } from 'vue'
import { auditService } from '@shared/src/services/security/auditTrail'

// Estado global para tracking de assets
const assetState = ref({
  loaded: new Set(),
  loading: new Set(),
  failed: new Set(),
  cache: new Map()
})

// Estrategias de precarga
const preloadStrategies = {
  'eager': (asset) => loadAsset(asset),
  'lazy': (asset) => {
    if (isAssetVisible(asset)) {
      loadAsset(asset)
    }
  },
  'prefetch': (asset) => {
    if (navigator.connection?.effectiveType !== 'slow-2g') {
      prefetchAsset(asset)
    }
  }
}

// Tipos MIME permitidos según normativa
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  font: ['font/ttf', 'font/woff', 'font/woff2'],
  style: ['text/css'],
  script: ['application/javascript']
}

// Función principal para cargar assets
export async function loadAsset(asset) {
  // Validar tipo MIME
  if (!isValidMimeType(asset)) {
    throw new Error(`Tipo MIME no permitido para ${asset.type}`)
  }

  if (assetState.value.loaded.has(asset.url)) {
    return assetState.value.cache.get(asset.url)
  }

  // Registrar intento de carga en auditoría
  await auditService.logAssetLoad({
    type: asset.type,
    url: asset.url,
    timestamp: new Date()
  })

  if (assetState.value.loading.has(asset.url)) {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (assetState.value.loaded.has(asset.url)) {
          resolve(assetState.value.cache.get(asset.url))
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  assetState.value.loading.add(asset.url)

  try {
    const result = await loadAssetByType(asset)
    assetState.value.loaded.add(asset.url)
    assetState.value.cache.set(asset.url, result)
    
    // Registrar carga exitosa en auditoría
    await auditService.logAssetLoadSuccess({
      type: asset.type,
      url: asset.url,
      timestamp: new Date()
    })
    
    return result
  } catch (error) {
    assetState.value.failed.add(asset.url)
    
    // Registrar error en auditoría
    await auditService.logAssetLoadError({
      type: asset.type,
      url: asset.url,
      error: error.message,
      timestamp: new Date()
    })
    
    console.error(`Error loading asset ${asset.url}:`, error)
    throw error
  } finally {
    assetState.value.loading.delete(asset.url)
  }
}

// Carga específica por tipo de asset
async function loadAssetByType(asset) {
  switch (asset.type) {
    case 'image':
      return loadImage(asset)
    case 'script':
      return loadScript(asset)
    case 'style':
      return loadStyle(asset)
    case 'font':
      return loadFont(asset)
    default:
      throw new Error(`Unsupported asset type: ${asset.type}`)
  }
}

// Cargador de imágenes con lazy loading
async function loadImage(asset) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = asset.url
  })
}

// Cargador de scripts
async function loadScript(asset) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = asset.url
    script.async = true
    script.onload = () => resolve(script)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Cargador de estilos
async function loadStyle(asset) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = asset.url
    link.onload = () => resolve(link)
    link.onerror = reject
    document.head.appendChild(link)
  })
}

// Cargador de fuentes
async function loadFont(asset) {
  return new Promise((resolve, reject) => {
    const font = new FontFace(asset.name, `url(${asset.url})`)
    font.load()
      .then(loadedFont => {
        document.fonts.add(loadedFont)
        resolve(loadedFont)
      })
      .catch(reject)
  })
}

// Prefetch de assets
function prefetchAsset(asset) {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = asset.url
  document.head.appendChild(link)
}

// Verificación de visibilidad para lazy loading
function isAssetVisible(asset) {
  if (asset.element) {
    const rect = asset.element.getBoundingClientRect()
    return (
      rect.top <= window.innerHeight &&
      rect.bottom >= 0 &&
      rect.left <= window.innerWidth &&
      rect.right >= 0
    )
  }
  return true
}

// Directiva Vue para lazy loading de imágenes
export const vLazyImg = {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadAsset({
            type: 'image',
            url: binding.value
          })
          observer.unobserve(el)
        }
      })
    })
    observer.observe(el)
  }
}

// Plugin Vue para asset loading
export const AssetLoaderPlugin = {
  install(app) {
    app.directive('lazy-img', vLazyImg)
    app.provide('assetLoader', {
      load: loadAsset,
      preload: (asset) => preloadStrategies[asset.strategy || 'lazy'](asset),
      state: assetState
    })
  }
}

// Validación de tipos MIME
function isValidMimeType(asset) {
  if (!ALLOWED_MIME_TYPES[asset.type]) {
    return false
  }
  
  const mimeType = getMimeType(asset.url)
  return ALLOWED_MIME_TYPES[asset.type].includes(mimeType)
}

export default {
  load: loadAsset,
  preload: (asset) => preloadStrategies[asset.strategy || 'lazy'](asset),
  state: assetState,
  plugin: AssetLoaderPlugin
} 