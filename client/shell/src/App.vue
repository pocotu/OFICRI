<template>
  <div class="app-container">
    <!-- Layout para pantalla de login (cuando no está autenticado) -->
    <template v-if="!isAuthenticated">
      <header class="login-header">
        <div class="header-content">
          <div class="logo-container">
            <img src="/logoOficri2x2.png" alt="Logo OFICRI" class="logo-oficri">
            <span class="logo-text">OFICRI</span>
          </div>
          <div class="header-title">OFICINA DE CRIMINALÍSTICA CUSCO</div>
          <div class="logo-container right">
            <img src="/logoPolicia2x2.png" alt="Logo Policía" class="logo-policia">
          </div>
        </div>
      </header>
      
      <main class="login-content">
        <router-view></router-view>
      </main>
      
      <footer class="login-footer">
        <p>&copy; {{ currentYear }} OFICRI Cusco - Todos los derechos reservados</p>
      </footer>
    </template>
    
    <!-- Layout para dashboard (cuando está autenticado) -->
    <template v-else>
      <header class="dashboard-header">
        <div class="logo-container">
          <img src="/logoOficri2x2.png" alt="Logo OFICRI" class="logo-small">
          <span class="system-name">Sistema de Gestión OFICRI</span>
        </div>
        <div class="user-actions">
          <span class="username">{{ user?.Nombres || 'Usuario' }}</span>
          <button class="logout-button" @click="logout">Cerrar Sesión</button>
        </div>
      </header>
      
      <main class="dashboard-content">
        <router-view></router-view>
      </main>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './store/auth';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);
const currentYear = new Date().getFullYear();

const hasPermission = (permission) => {
  return authStore.hasPermission(permission);
};

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
/* Estilos generales */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Estilos para el layout de login */
.login-header {
  background-color: #0d4e25;
  color: white;
  padding: 10px 0;
  width: 100%;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-container.right {
  justify-content: flex-end;
}

.logo-oficri, .logo-policia {
  height: 40px;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  margin-left: 10px;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}

.login-content {
  flex: 1;
  background-color: #f2f2f2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-footer {
  background-color: #0d4e25;
  color: white;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
}

/* Estilos para el layout del dashboard */
.dashboard-header {
  background-color: #0d4e25;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.logo-small {
  height: 30px;
  margin-right: 10px;
}

.system-name {
  font-size: 18px;
  font-weight: 500;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  font-weight: 500;
}

.logout-button {
  background-color: transparent;
  border: 1px solid white;
  color: white;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-button:hover {
  background-color: rgba(255,255,255,0.2);
}

.dashboard-content {
  flex: 1;
  padding: 20px;
  background-color: #f8f9fa;
  overflow-y: auto;
}

/* Responsive para login */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .logo-container.right {
    justify-content: center;
  }
  
  .header-title {
    order: 2;
  }
}
</style> 