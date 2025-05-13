<template>
  <header class="header">
    <div class="header-left">
      <img src="/logoOficri2x2.png" alt="Logo" class="logo" />
      <span class="system-title">{{ systemTitle }}</span>
    </div>
    <div class="header-right">
      <div class="header-user">
        <button class="user-btn" @click="toggleMenu">
          <i class="fa fa-user"></i>
          <span>{{ userName }}</span>
          <i class="fa fa-caret-down"></i>
        </button>
        <div v-if="showMenu" class="user-menu">
          <router-link to="/perfil">Perfil</router-link>
          <a @click="logout">Cerrar sesión</a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const userName = computed(() => {
  if (!authStore.user) return ''
  return `${authStore.user.Nombres} ${authStore.user.Apellidos}`
})
const areaActual = computed(() => authStore.user?.NombreArea || '')
const systemTitle = computed(() =>
  areaActual.value
    ? `Sistema de Gestión OFICRI - ${areaActual.value}`
    : 'Sistema de Gestión OFICRI'
)
const showMenu = ref(false)
function toggleMenu() { showMenu.value = !showMenu.value }
function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  width: 100%;
  background: #14532d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  min-height: 56px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.system-title {
  font-weight: bold;
  font-size: 1.2rem;
  letter-spacing: 1px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}
.header-user {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}
.user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #20422e;
  color: #e0e0e0;
  border: none;
  border-radius: 20px;
  padding: 0.4rem 1.2rem;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  transition: background 0.2s, color 0.2s;
}
.user-btn:hover {
  background: #14532d;
  color: #fff;
}
.user-btn i.fa-user {
  font-size: 1.2rem;
  color: #b0c4b1;
}
.user-menu {
  position: absolute;
  top: 110%;
  right: 0;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.13);
  min-width: 140px;
  z-index: 10;
  display: flex;
  flex-direction: column;
}
.user-menu a, .user-menu .router-link-active {
  padding: 0.8rem 1.2rem;
  color: #20422e;
  text-decoration: none;
  font-size: 1rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  cursor: pointer;
}
.user-menu a:last-child, .user-menu .router-link-active:last-child {
  border-bottom: none;
}
.user-menu a:hover, .user-menu .router-link-active:hover {
  background: #e6f2ee;
  color: #14532d;
}
</style> 