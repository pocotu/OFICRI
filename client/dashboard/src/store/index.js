import { createPinia } from 'pinia';
import { useDashboardStore } from './dashboardStore';

// Crear instancia de Pinia
const pinia = createPinia();

// Plugin para persistencia
const piniaLocalStorage = {
  key: 'dashboard-store',
  paths: ['uiConfig', 'filters'],

  // Hook que se ejecuta cuando se instala el plugin
  install(pinia) {
    // Cargar estado desde localStorage
    try {
      const fromStorage = localStorage.getItem(this.key);
      if (fromStorage) {
        pinia.state.value = JSON.parse(fromStorage);
      }
    } catch (error) {
      console.error('Error al cargar estado persistente:', error);
    }

    // Suscribirse a cambios en el estado para guardar en localStorage
    pinia.subscribe((mutation) => {
      try {
        const toStore = {};
        
        // Solo guardar los paths especificados
        for (const storeName in pinia.state.value) {
          toStore[storeName] = {};
          for (const path of this.paths) {
            if (pinia.state.value[storeName][path]) {
              toStore[storeName][path] = pinia.state.value[storeName][path];
            }
          }
        }
        
        localStorage.setItem(this.key, JSON.stringify(toStore));
      } catch (error) {
        console.error('Error al guardar estado persistente:', error);
      }
    });
  }
};

// Añadir plugins
pinia.use(piniaLocalStorage);

// Exportar tiendas y configuración
export {
  pinia,
  useDashboardStore
}; 