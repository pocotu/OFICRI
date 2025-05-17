<template>
  <div class="dosaje-gestion-view">
    <h1 class="main-title"><i class="fa-solid fa-vial"></i> Gestión Documental de Dosaje</h1>
    <DosajeTable />
  </div>
</template>

<script setup>
import DosajeTable from '../../components/dosaje/DosajeTable.vue'
</script>

<style scoped>
.dosaje-gestion-view {
  padding: 2rem;
}
</style> 