<template>
  <div class="home-container">
    <h1>Sistema de Gestión Documental OFICRI</h1>
    <p>Bienvenido al sistema de gestión documental para la Oficina Criminalística.</p>
    
    <div class="dashboard-preview" v-if="isAuthenticated">
      <h2>Panel de Control</h2>
      <div class="quick-access">
        <div class="quick-access-item" v-if="hasPermission(8)"> <!-- Permiso para ver (bit 3) -->
          <h3>Documentos Recientes</h3>
          <p>Cargando...</p>
        </div>
        <div class="quick-access-item" v-if="hasPermission(8)"> <!-- Permiso para ver (bit 3) -->
          <h3>Pendientes</h3>
          <p>Cargando...</p>
        </div>
      </div>
    </div>
    
    <div class="auth-prompt" v-else>
      <p>Por favor, inicie sesión para acceder al sistema.</p>
      <router-link to="/login" class="login-button">Iniciar Sesión</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../store/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const hasPermission = (permission) => authStore.hasPermission(permission)
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 2rem;
}

.dashboard-preview {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.quick-access {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 1rem;
}

.quick-access-item {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.quick-access-item h3 {
  font-size: 1.2rem;
  color: #444;
  margin-bottom: 10px;
}

.auth-prompt {
  text-align: center;
  margin-top: 2rem;
}

.login-button {
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #45a049;
}
</style> 