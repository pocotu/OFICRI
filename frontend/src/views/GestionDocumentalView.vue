<template>
  <div class="gestion-documental-view">
    <h1 class="main-title"><i class="fas fa-file"></i> Gestión Documental</h1>
    
    <div v-if="loading">Cargando...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="areaComponent">
      <component :is="areaComponent"></component>
    </div>
    <div v-else>No se pudo determinar el área del usuario o no hay componente registrado para esta área.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { useAuthStore } from '../stores/auth'
// Import area-specific table components
import DosajeTable from '../components/dosaje/DosajeTable.vue'
import ForenseDigitalTable from '../components/forensedigital/ForenseDigitalTable.vue' // Import Forense Digital Table
// import QuimicaToxicologiaTable from '../components/quimicatoxicologia/QuimicaToxicologiaTable.vue' // TODO: Create this component

const authStore = useAuthStore()
const loading = ref(true)
const error = ref(null)
const areaComponent = ref(null)

// Map area IDs or names to component names
const areaComponentMap = {
  // TODO: Replace with actual area IDs from your database for other areas
  1: markRaw(DosajeTable), // Example mapping (can be removed if not needed)
  3: markRaw(DosajeTable), // Mapping for area ID 3 (assuming it's Dosaje)
  4: markRaw(ForenseDigitalTable), // Mapping for area ID 4 (assuming it's Forense Digital)
  // 'ID_FORENSE_DIGITAL': markRaw(ForenseDigitalTable), // TODO: Add mapping for Forense Digital area ID
  // 'ID_QUIMICA': markRaw(QuimicaToxicologiaTable), // TODO: Add mapping for Quimica Toxicologia area ID
}

onMounted(async () => {
  try {
    // Ensure user data is loaded
    await authStore.initialize();
    const userAreaId = authStore.user?.IDArea;

    console.log('User Area ID:', userAreaId);
    console.log('Area Component Map:', areaComponentMap);

    if (userAreaId) {
      // Find the corresponding component
      const component = areaComponentMap[userAreaId];
      if (component) {
        areaComponent.value = component;
      } else {
        error.value = 'No se encontró componente para el área del usuario.';
      }
    } else {
      error.value = 'No se pudo determinar el área del usuario.';
    }
  } catch (err) {
    error.value = 'Error al cargar datos del usuario: ' + err.message;
  } finally {
    loading.value = false;
  }
});


// Lógica específica de Gestión Documental general irá aquí
</script>

<style scoped>
.gestion-documental-view {
  padding: 2rem;
}
</style> 