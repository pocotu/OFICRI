/**
 * lazyLoadPlugin.js - Plugin Vue para gestionar lazy loading
 * 
 * Este plugin proporciona funcionalidades globales de lazy loading para la aplicación,
 * incluyendo directivas, componentes y utilidades para optimizar la carga.
 */

import { 
  lazyLoadComponent, 
  lazyLoadImage, 
  lazyLoadCSS, 
  lazyLoadScript, 
  prefetchRoute,
  lazyLoadRoute
} from '../utils/lazyLoadUtils';

// Componente de suspense para carga perezosa
const AsyncComponentWrapper = {
  name: 'AsyncComponentWrapper',
  props: {
    component: {
      type: [Function, Promise],
      required: true
    },
    fallback: {
      type: Object,
      default: () => ({ template: '<div class="ofi-loader">Cargando...</div>' })
    },
    error: {
      type: Object,
      default: () => ({ template: '<div class="ofi-error">Error al cargar componente</div>' })
    },
    timeout: {
      type: Number,
      default: 30000
    }
  },
  data() {
    return {
      loaded: null,
      loadError: null,
      isLoading: true
    };
  },
  computed: {
    currentComponent() {
      if (this.loadError) return this.error;
      if (this.isLoading) return this.fallback;
      return this.loaded;
    }
  },
  async created() {
    try {
      // Establecer un timeout para la carga
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout loading component')), this.timeout);
      });
      
      // Cargar el componente
      const componentPromise = typeof this.component === 'function' 
        ? this.component() 
        : this.component;
        
      // Esperar a que se cargue o timeout
      const loadedModule = await Promise.race([componentPromise, timeoutPromise]);
      
      // Obtener el componente (puede ser default export o no)
      this.loaded = loadedModule.default || loadedModule;
      this.isLoading = false;
    } catch (error) {
      console.error('Error cargando componente:', error);
      this.loadError = error;
      this.isLoading = false;
    }
  },
  render() {
    return this.$slots.default?.(this.currentComponent) || 
      this.currentComponent ? h(this.currentComponent) : null;
  }
};

// Directiva para lazy load imágenes
const lazyImageDirective = {
  mounted(el, binding) {
    const src = binding.value;
    const options = binding.modifiers || {};
    
    if (!src) return;
    
    // Placeholder mientras carga
    if (binding.arg === 'placeholder' && binding.modifiers.blur) {
      el.style.filter = 'blur(5px)';
      el.style.transition = 'filter 0.3s ease-out';
    }
    
    // IntersectionObserver para cargar cuando sea visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Si es una imagen
          if (el.tagName === 'IMG') {
            el.src = src;
            
            el.onload = () => {
              if (binding.modifiers.blur) {
                el.style.filter = 'blur(0)';
              }
            };
          } 
          // Si es un elemento con background-image
          else {
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              el.style.backgroundImage = `url(${src})`;
              
              if (binding.modifiers.blur) {
                el.style.filter = 'blur(0)';
              }
            };
          }
          
          observer.disconnect();
        }
      });
    }, {
      threshold: binding.modifiers.eager ? 0 : 0.1,
      rootMargin: binding.modifiers.eager ? '200px' : '50px'
    });
    
    observer.observe(el);
  }
};

// Directiva para prefetch de rutas
const prefetchDirective = {
  mounted(el, binding) {
    if (!binding.value) return;
    
    const handleMouseEnter = () => {
      const path = binding.value;
      prefetchRoute(path);
      
      // Remover event listener después del primer hover
      el.removeEventListener('mouseenter', handleMouseEnter);
    };
    
    // Prefetch en hover
    el.addEventListener('mouseenter', handleMouseEnter);
    
    // Limpiar al desmontar
    el._prefetchCleanup = () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
    };
  },
  unmounted(el) {
    if (el._prefetchCleanup) {
      el._prefetchCleanup();
    }
  }
};

// Plugin principal
const LazyLoadPlugin = {
  install(app, options = {}) {
    const {
      imageThreshold = 0.1,
      defaultTimeout = 30000,
      defaultLoadingComponent = null,
      defaultErrorComponent = null,
      enablePrefetching = true,
      enableIntersectionObserver = true,
      enableImportChunking = true
    } = options;
    
    // Registrar componente global
    app.component('AsyncComponent', AsyncComponentWrapper);
    
    // Registrar directivas
    app.directive('lazy-img', lazyImageDirective);
    app.directive('prefetch', prefetchDirective);
    
    // Añadir métodos globales
    app.config.globalProperties.$lazyLoad = {
      component: (importFn, opts = {}) => lazyLoadComponent(importFn, {
        loadingComponent: opts.loading || defaultLoadingComponent,
        errorComponent: opts.error || defaultErrorComponent,
        timeout: opts.timeout || defaultTimeout,
        ...opts
      }),
      image: lazyLoadImage,
      css: lazyLoadCSS,
      script: lazyLoadScript,
      route: (importFn, opts = {}) => lazyLoadRoute(importFn, opts),
      prefetch: prefetchRoute
    };
    
    // Extender router si existe
    if (options.router && enablePrefetching) {
      const router = options.router;
      
      // Interceptor para prefetch de rutas
      router.beforeEach((to, from, next) => {
        // Obtener todas las rutas que podrían ser relevantes para el usuario
        const linkedRoutes = router.getRoutes()
          .filter(route => {
            // Solo consideramos rutas que podrían ser visitadas desde la actual
            if (route.meta && route.meta.parent === to.name) return true;
            if (route.meta && route.meta.group === to.meta?.group) return true;
            return false;
          })
          .map(route => route.path);
        
        // Prefetch de rutas relacionadas
        linkedRoutes.forEach(route => {
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(() => prefetchRoute(route), { timeout: 2000 });
          } else {
            setTimeout(() => prefetchRoute(route), 1000);
          }
        });
        
        next();
      });
    }
    
    // Configurar sistema de chunks para la construcción
    if (enableImportChunking && typeof window !== 'undefined') {
      // Añadir soporte para análisis automático de chunks
      window.__OFICRI_CHUNKS_LOADED = window.__OFICRI_CHUNKS_LOADED || {};
      
      window.__loadChunk = async (chunkName, loader) => {
        if (window.__OFICRI_CHUNKS_LOADED[chunkName]) {
          return window.__OFICRI_CHUNKS_LOADED[chunkName];
        }
        
        try {
          const result = await loader();
          window.__OFICRI_CHUNKS_LOADED[chunkName] = result;
          return result;
        } catch (error) {
          console.error(`Error cargando chunk "${chunkName}":`, error);
          throw error;
        }
      };
    }
  }
};

export default LazyLoadPlugin; 