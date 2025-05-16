<template>
  <div class="responsive-wrapper">
    <DocumentosTable v-if="!isMobile" :documentos="documentos" :areas="areas" :estados="estados" @show-details="showDetails" @nuevo-documento="$emit('nuevo-documento')" @editar="$emit('editar', $event)" />
    <div v-else class="documentos-cards">
      <DocumentoCard
        v-for="doc in documentos"
        :key="doc.IDDocumento"
        :documento="doc"
        :areas="areas"
        @show-details="showDetails"
      />
    </div>
    <DocumentoModal v-if="selectedDoc" :documento="selectedDoc" @close="selectedDoc = null" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DocumentosTable from './DocumentosTable.vue'
import DocumentoCard from './DocumentoCard.vue'
import DocumentoModal from './DocumentoModal.vue'

const props = defineProps({
  documentos: {
    type: Array,
    required: true
  },
  areas: {
    type: Array,
    required: false,
    default: () => []
  },
  estados: {
    type: Array,
    required: false,
    default: () => []
  }
})

const isMobile = ref(window.innerWidth < 768)
const selectedDoc = ref(null)

function handleResize() {
  isMobile.value = window.innerWidth < 768
}

function showDetails(doc) {
  selectedDoc.value = doc
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.responsive-wrapper {
  width: 100%;
  overflow-x: auto;
}

.documentos-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}
</style> 