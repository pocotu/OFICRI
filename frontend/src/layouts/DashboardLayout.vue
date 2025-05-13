<template>
  <div class="dashboard-layout">
    <Sidebar />
    <div class="dashboard-main">
      <Header />
      <div class="dashboard-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue'
import Header from '../components/Header.vue'
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}
.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.dashboard-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style> 