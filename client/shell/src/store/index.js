import { createPinia } from 'pinia'

// Crear y exportar la instancia de Pinia
const pinia = createPinia()

// Crear un plugin para Pinia que sincronizará el estado con localStorage
pinia.use(({ store }) => {
  // Intentar cargar el estado anterior del almacenamiento local
  const storedState = localStorage.getItem(`oficri-${store.$id}`)
  
  if (storedState) {
    try {
      store.$patch(JSON.parse(storedState))
    } catch (error) {
      console.error(`Error al cargar el estado para ${store.$id}:`, error)
      // Si hay un error, eliminar el estado corrupto
      localStorage.removeItem(`oficri-${store.$id}`)
    }
  }
  
  // Suscribirse a los cambios y actualizar localStorage
  store.$subscribe((mutation, state) => {
    // Solo guardar en localStorage si no es estado temporal o sensible
    if (!store.$temporary) {
      localStorage.setItem(`oficri-${store.$id}`, JSON.stringify(state))
    }
  })
})

export default pinia 