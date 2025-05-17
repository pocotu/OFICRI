<template>
  <form class="dosaje-process-form" @submit.prevent="handleProcesarDosaje">
    <h2>Procesar Dosaje</h2>
    <div class="form-group">
      <label>Asignar Operador</label>
      <select v-model="form.IDUsuarioAsignado" required>
        <option value="" disabled>Seleccione un operador</option>
        <option v-for="op in operadores" :key="op.IDUsuario" :value="op.IDUsuario">
          {{ op.Nombres }} {{ op.Apellidos }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label>Estado</label>
      <select v-model="form.Estado" required>
        <option value="En trámite">En trámite</option>
        <option value="Finalizado">Finalizado</option>
        <option value="Observado">Observado</option>
      </select>
    </div>
    <div class="form-group">
      <label>Resultado / Conclusión</label>
      <textarea v-model="form.Resultado" rows="3" placeholder="Ingrese resultado o conclusión..." />
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Guardar Procesamiento</button>
      <button type="button" class="btn btn-secondary" @click="$emit('cancelar')">Cancelar</button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchOperadores, procesarDosaje as procesarDosajeApi } from '../../api/dosajeApi'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({ dosaje: Object })
const emit = defineEmits(['procesado', 'cancelar'])
const form = ref({
  IDUsuarioAsignado: '',
  Estado: '',
  Resultado: ''
})
const operadores = ref([])
const authStore = useAuthStore()

onMounted(async () => {
  const res = await fetchOperadores(authStore.token, authStore.user.IDArea)
  operadores.value = res.data
})

watch(() => props.dosaje, (nuevo) => {
  if (nuevo) {
    form.value = {
      IDUsuarioAsignado: nuevo.IDUsuarioAsignado || '',
      Estado: nuevo.Estado || 'En trámite',
      Resultado: nuevo.Resultado || ''
    }
  }
}, { immediate: true })

async function handleProcesarDosaje() {
  await procesarDosajeApi(authStore.token, props.dosaje.IDDosaje, form.value)
  emit('procesado')
}
</script>

<style scoped>
.dosaje-process-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 320px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style> 