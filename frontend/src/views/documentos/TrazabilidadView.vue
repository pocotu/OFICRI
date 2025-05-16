<template>
  <div class="trazabilidad-view">
    <h1><i class="fa-solid fa-route"></i> Trazabilidad del Documento</h1>
    <div v-if="loading" class="loading">Cargando trazabilidad...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!eventos.length" class="no-eventos">No hay eventos de trazabilidad para este documento.</div>
    <Timeline v-else :eventos="eventos" />
    <button class="btn btn-primary" @click="$router.back()">Volver</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchTrazabilidad, formatTrazabilidadEvento } from '../../api/trazabilidadApi'
import Timeline from '../../components/Timeline.vue'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  documentoId: {
    type: [String, Number],
    required: true
  }
})

const eventos = ref([])
const loading = ref(true)
const error = ref('')
const authStore = useAuthStore()

const cargarTrazabilidad = async (idDoc) => {
  loading.value = true
  error.value = ''
  eventos.value = []
  try {
    const data = await fetchTrazabilidad(idDoc, authStore.token)
    eventos.value = data.map(formatTrazabilidadEvento)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!props.documentoId) {
    error.value = 'No se ha seleccionado un documento.'
    loading.value = false
    return
  }
  cargarTrazabilidad(props.documentoId)
})

watch(() => props.documentoId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    cargarTrazabilidad(newId)
  }
})
</script>

<style scoped>
.trazabilidad-view {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(20, 83, 45, 0.08);
  padding: 2.5rem 2rem;
}

.loading {
  color: #14532d;
  font-weight: bold;
  margin: 2rem 0;
}

.error {
  color: #e74c3c;
  font-weight: bold;
  margin: 2rem 0;
}

.no-eventos {
  color: #888;
  font-style: italic;
  margin: 2rem 0;
}

.btn {
  margin-top: 1rem;
}
</style> 