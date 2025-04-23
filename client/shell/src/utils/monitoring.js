import { onErrorCaptured } from 'vue'

export default function setupMonitoring(app) {
  // Configurar captura de errores globales
  app.config.errorHandler = (err, instance, info) => {
    console.error('Error global:', err)
    console.error('Componente:', instance)
    console.error('Info:', info)
    
    // Aquí podrías enviar el error a un servicio de monitoreo
    // como Sentry, LogRocket, etc.
  }

  /* // La función onErrorCaptured solo se puede usar dentro de setup()
  // Configurar captura de errores en componentes
  onErrorCaptured((err, instance, info) => {
    console.error('Error capturado:', err)
    console.error('Instancia:', instance)
    console.error('Info:', info)
    return false // Permitir que el error se propague
  })
  */

  // Monitoreo de rendimiento
  if (window.performance) {
    // Registrar métricas de carga inicial
    window.addEventListener('load', () => {
      const timing = performance.timing
      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseEnd - timing.requestStart,
        dom: timing.domComplete - timing.domLoading,
        total: timing.loadEventEnd - timing.navigationStart
      }
      
      console.log('Métricas de rendimiento:', metrics)
    })
  }

  // Monitoreo de memoria
  if (window.performance && window.performance.memory) {
    setInterval(() => {
      const memory = performance.memory
      console.log('Uso de memoria:', {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize
      })
    }, 30000) // Cada 30 segundos
  }

  // Monitoreo de rutas
  app.config.globalProperties.$router.afterEach((to, from) => {
    console.log(`Navegación de ${from.path} a ${to.path}`)
    
    // Registrar métricas de navegación
    const navigationStart = performance.now()
    window.addEventListener('load', () => {
      const navigationTime = performance.now() - navigationStart
      console.log(`Tiempo de navegación: ${navigationTime.toFixed(2)}ms`)
    })
  })
} 