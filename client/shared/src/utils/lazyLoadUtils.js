/**
 * lazyLoadUtils.js - Utilidades para implementar lazy loading en la aplicación
 * 
 * Proporciona funciones para cargar de forma perezosa componentes, rutas, módulos,
 * assets y servicios, optimizando el rendimiento inicial de la aplicación.
 */

/**
 * Carga perezosa de un componente con soporte para carga/error
 * @param {Function} importFunction - Función de importación dinámica 
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Componente Vue con soporte para lazy loading
 */
export const lazyLoadComponent = (importFunction, options = {}) => {
  const { 
    loadingComponent = null,
    errorComponent = null,
    delay = 200,
    timeout = 30000
  } = options;

  return () => ({
    component: importFunction(),
    loading: loadingComponent,
    error: errorComponent,
    delay,
    timeout
  });
};

/**
 * Carga perezosa de múltiples componentes en un chunk
 * @param {Array<Function>} importFunctions - Array de funciones de importación dinámica
 * @param {String} chunkName - Nombre del chunk (opcional, para debugging)
 * @returns {Promise<Array>} - Promise que resuelve a un array de componentes
 */
export const lazyLoadChunk = (importFunctions, chunkName = '') => {
  // Usar comentario webpackChunkName para identificar el chunk en dev tools
  return () => Promise.all(importFunctions.map(fn => fn()));
};

/**
 * Carga perezosa de una ruta con opciones avanzadas
 * @param {Function} importFunction - Función de importación dinámica de la vista
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Configuración de ruta para vue-router
 */
export const lazyLoadRoute = (importFunction, options = {}) => {
  const {
    prefetch = false,
    preload = false,
    chunkName = 'unknown',
  } = options;

  return {
    component: () => importFunction(),
    meta: {
      ...options.meta,
      prefetch,
      preload
    },
    // Datos adicionales para webpack/rollup
    ...(chunkName ? { chunkName } : {})
  };
};

/**
 * Prefetch de una ruta para cargarla en segundo plano
 * @param {String} routePath - Ruta a precargar
 */
export const prefetchRoute = (routePath) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  link.as = 'fetch';
  link.type = 'application/json';
  document.head.appendChild(link);
};

/**
 * Preload de un recurso (script, estilo, fuente, etc.)
 * @param {String} resourcePath - Ruta al recurso
 * @param {String} as - Tipo de recurso (script, style, font, image)
 * @param {Object} options - Opciones adicionales
 */
export const preloadResource = (resourcePath, as = 'script', options = {}) => {
  if (typeof window === 'undefined') return;
  
  const { importance = 'auto', crossorigin = false } = options;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = resourcePath;
  link.as = as;
  
  if (importance !== 'auto') {
    link.importance = importance;
  }
  
  if (crossorigin) {
    link.crossOrigin = typeof crossorigin === 'string' ? crossorigin : 'anonymous';
  }
  
  document.head.appendChild(link);
};

/**
 * Descubre y carga módulos dinámicamente basado en una condición
 * @param {Object} modules - Objeto con módulos disponibles para cargar
 * @param {Function} condition - Función que determina qué módulos cargar
 * @returns {Promise<Object>} - Promise que resuelve a un objeto con los módulos cargados
 */
export const lazyLoadModules = async (modules, condition) => {
  const result = {};
  const keys = Object.keys(modules);
  
  // Filtrar módulos según la condición
  const modulesToLoad = keys.filter(condition);
  
  // Cargar los módulos en paralelo
  await Promise.all(
    modulesToLoad.map(async (key) => {
      try {
        const moduleExports = await modules[key]();
        result[key] = moduleExports.default || moduleExports;
      } catch (error) {
        console.error(`Error cargando módulo ${key}:`, error);
      }
    })
  );
  
  return result;
};

/**
 * Carga perezosa con prioridad basada en visibilidad y tiempo
 * @param {Function} importFunction - Función de importación dinámica
 * @param {Object} options - Opciones de configuración
 * @returns {Promise} - Promise que resuelve al componente/módulo
 */
export const priorityLoad = (importFunction, options = {}) => {
  const {
    timeout = 5000,      // Tiempo antes de cargar sin importar visibilidad
    visibilityCheck = true,  // Verificar si el usuario está viendo la página
    idleLoad = true,     // Cargar durante tiempo inactivo del navegador
    lowPriority = false  // Indicar baja prioridad (útil para recursos no críticos)
  } = options;
  
  return new Promise((resolve) => {
    // Variable para controlar si ya se cargó
    let isLoaded = false;
    
    // Función para realizar la carga
    const doLoad = () => {
      if (isLoaded) return;
      isLoaded = true;
      
      // Si es baja prioridad y el navegador soporta hints de fetch
      if (lowPriority && 'fetchPriority' in HTMLImageElement.prototype) {
        importFunction().then(resolve);
      } else {
        importFunction().then(resolve);
      }
    };
    
    // Cargar después de un timeout
    const timeoutId = setTimeout(doLoad, timeout);
    
    // Cargar cuando la página sea visible (si está configurado)
    if (visibilityCheck && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          doLoad();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    // Cargar durante tiempo inactivo (si está configurado y el navegador lo soporta)
    if (idleLoad && typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        doLoad();
      }, { timeout: timeout + 500 });
    } else if (idleLoad && typeof window !== 'undefined') {
      // Fallback para navegadores que no soportan requestIdleCallback
      setTimeout(doLoad, 1000);
    }
    
    // Limpiar timeout si la carga ya se realizó por otro medio
    return () => {
      clearTimeout(timeoutId);
    };
  });
};

/**
 * Carga imágenes de forma perezosa con observador de intersección
 * @param {String} src - URL de la imagen
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<HTMLImageElement>} - Promise que resuelve a la imagen cargada
 */
export const lazyLoadImage = (src, options = {}) => {
  const {
    rootMargin = '200px 0px',
    threshold = 0.1,
    lowPriority = true
  } = options;
  
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }
    
    const img = new Image();
    
    if (lowPriority && 'fetchPriority' in HTMLImageElement.prototype) {
      img.fetchPriority = 'low';
    }
    
    if ('loading' in HTMLImageElement.prototype) {
      // Usar lazy loading nativo si está disponible
      img.loading = 'lazy';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    } else {
      // Fallback a IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              img.src = src;
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
              observer.disconnect();
            }
          });
        },
        { rootMargin, threshold }
      );
      
      observer.observe(img);
    }
  });
};

/**
 * Carga un conjunto de estilos CSS de forma perezosa
 * @param {String} href - URL del archivo CSS
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<HTMLLinkElement>} - Promise que resuelve al elemento link
 */
export const lazyLoadCSS = (href, options = {}) => {
  const {
    media = 'all',
    id = null,
    onload = null
  } = options;
  
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    
    // Verificar si ya existe el stylesheet
    if (id && document.getElementById(id)) {
      resolve(document.getElementById(id));
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print'; // Inicialmente no bloquea renderizado
    
    if (id) {
      link.id = id;
    }
    
    link.onload = () => {
      link.media = media; // Cambiar a media correcto una vez cargado
      if (onload) onload(link);
      resolve(link);
    };
    
    link.onerror = () => {
      console.error(`Error cargando CSS: ${href}`);
      resolve(null);
    };
    
    document.head.appendChild(link);
  });
};

/**
 * Carga un script de forma perezosa
 * @param {String} src - URL del script
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<HTMLScriptElement>} - Promise que resuelve al elemento script
 */
export const lazyLoadScript = (src, options = {}) => {
  const {
    async = true,
    defer = true,
    id = null,
    onload = null,
    attrs = {}
  } = options;
  
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    
    // Verificar si ya existe el script
    if (id && document.getElementById(id)) {
      resolve(document.getElementById(id));
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    
    if (id) {
      script.id = id;
    }
    
    // Agregar atributos adicionales
    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    
    script.onload = () => {
      if (onload) onload(script);
      resolve(script);
    };
    
    script.onerror = () => {
      console.error(`Error cargando script: ${src}`);
      resolve(null);
    };
    
    document.body.appendChild(script);
  });
};

export default {
  lazyLoadComponent,
  lazyLoadChunk,
  lazyLoadRoute,
  prefetchRoute,
  preloadResource,
  lazyLoadModules,
  priorityLoad,
  lazyLoadImage,
  lazyLoadCSS,
  lazyLoadScript
}; 