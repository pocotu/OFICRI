/**
 * Servicio de accesibilidad para mejorar la experiencia de usuarios con discapacidades
 */

// Estado de las opciones de accesibilidad
const accessibilityState = {
  highContrast: false,
  fontSize: 'normal', // 'small', 'normal', 'large', 'xlarge'
  screenReader: false,
  reducedMotion: false,
  keyboardNavigation: true
}

// Valores de tamaño de fuente en píxeles
const FONT_SIZES = {
  small: 14,
  normal: 16,
  large: 18,
  xlarge: 20
}

/**
 * Servicio de accesibilidad
 */
export const accessibilityService = {
  /**
   * Inicializa las opciones de accesibilidad
   */
  init() {
    // Cargar preferencias guardadas
    const savedSettings = localStorage.getItem('accessibilitySettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        Object.assign(accessibilityState, settings)
      } catch (error) {
        console.error('Error al cargar configuraciones de accesibilidad:', error)
      }
    }
    
    // Aplicar configuraciones
    this.applySettings()
    
    // Detectar preferencias del sistema
    this.detectSystemPreferences()
  },
  
  /**
   * Detecta preferencias del sistema
   */
  detectSystemPreferences() {
    // Detectar preferencia de movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.setReducedMotion(true)
    }
    
    // Detectar preferencia de alto contraste
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      this.setHighContrast(true)
    }
  },
  
  /**
   * Aplica todas las configuraciones de accesibilidad
   */
  applySettings() {
    // Aplicar alto contraste
    if (accessibilityState.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
    
    // Aplicar tamaño de fuente
    document.documentElement.style.setProperty(
      '--base-font-size', 
      `${FONT_SIZES[accessibilityState.fontSize]}px`
    )
    
    // Aplicar movimiento reducido
    if (accessibilityState.reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }
    
    // Aplicar navegación por teclado
    if (accessibilityState.keyboardNavigation) {
      document.documentElement.classList.add('keyboard-navigation')
    } else {
      document.documentElement.classList.remove('keyboard-navigation')
    }
    
    // Guardar configuraciones
    this.saveSettings()
  },
  
  /**
   * Guarda las configuraciones en localStorage
   * @private
   */
  saveSettings() {
    localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilityState))
  },
  
  /**
   * Configura el modo de alto contraste
   * @param {boolean} enabled - Si debe habilitarse el alto contraste
   */
  setHighContrast(enabled) {
    accessibilityState.highContrast = enabled
    this.applySettings()
  },
  
  /**
   * Configura el tamaño de fuente
   * @param {string} size - Tamaño de fuente ('small', 'normal', 'large', 'xlarge')
   */
  setFontSize(size) {
    if (FONT_SIZES[size]) {
      accessibilityState.fontSize = size
      this.applySettings()
    }
  },
  
  /**
   * Configura el modo de lector de pantalla
   * @param {boolean} enabled - Si debe habilitarse el lector de pantalla
   */
  setScreenReader(enabled) {
    accessibilityState.screenReader = enabled
    this.applySettings()
  },
  
  /**
   * Configura el modo de movimiento reducido
   * @param {boolean} enabled - Si debe habilitarse el movimiento reducido
   */
  setReducedMotion(enabled) {
    accessibilityState.reducedMotion = enabled
    this.applySettings()
  },
  
  /**
   * Configura la navegación por teclado
   * @param {boolean} enabled - Si debe habilitarse la navegación por teclado
   */
  setKeyboardNavigation(enabled) {
    accessibilityState.keyboardNavigation = enabled
    this.applySettings()
  },
  
  /**
   * Obtiene el estado actual de las configuraciones de accesibilidad
   * @returns {Object} Estado actual
   */
  getState() {
    return { ...accessibilityState }
  },
  
  /**
   * Restablece todas las configuraciones a los valores predeterminados
   */
  resetToDefaults() {
    accessibilityState.highContrast = false
    accessibilityState.fontSize = 'normal'
    accessibilityState.screenReader = false
    accessibilityState.reducedMotion = false
    accessibilityState.keyboardNavigation = true
    this.applySettings()
  }
}

/**
 * Plugin Vue para el servicio de accesibilidad
 */
export const AccessibilityPlugin = {
  install(app) {
    // Inicializar servicio
    accessibilityService.init()
    
    // Proporcionar servicio a los componentes
    app.provide('accessibility', accessibilityService)
    
    // Directiva para enfoque visible
    app.directive('a11y-focus', {
      mounted(el) {
        el.addEventListener('focus', () => {
          if (accessibilityState.keyboardNavigation) {
            el.classList.add('focus-visible')
          }
        })
        el.addEventListener('blur', () => {
          el.classList.remove('focus-visible')
        })
      }
    })
  }
}

export default {
  service: accessibilityService,
  plugin: AccessibilityPlugin
} 