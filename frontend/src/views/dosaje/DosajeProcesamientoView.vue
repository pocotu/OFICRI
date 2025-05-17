<template>
  <div class="dosaje-procesamiento-view">
    <h1 class="main-title"><i class="fa-solid fa-vials"></i> Procesamiento de Dosaje</h1>
    <DosajeProcesamientoTable @procesar="abrirModalProcesar" />
    <Modal v-if="mostrarModal" @close="cerrarModal">
      <DosajeProcessForm :dosaje="dosajeActual" @procesado="cerrarModal" />
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DosajeProcesamientoTable from '../../components/dosaje/DosajeProcesamientoTable.vue'
import Modal from '../../components/Modal.vue'
import DosajeProcessForm from '../../components/dosaje/DosajeProcessForm.vue'

const mostrarModal = ref(false)
const dosajeActual = ref(null)

function abrirModalProcesar(dosaje) {
  dosajeActual.value = dosaje
  mostrarModal.value = true
}
function cerrarModal() {
  mostrarModal.value = false
  dosajeActual.value = null
}
</script>

<style scoped>
.dosaje-procesamiento-view {
  padding: 2rem;
}
</style> 