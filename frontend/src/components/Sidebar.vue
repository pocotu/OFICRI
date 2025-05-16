<template>
  <nav :class="['sidebar', { collapsed }]">
    <div class="sidebar-header">
      <button class="toggle-btn" @click="collapsed = !collapsed">
        <i :class="collapsed ? 'fa-solid fa-bars' : 'fa-solid fa-angle-left'"></i>
      </button>
      <span v-if="!collapsed" class="sidebar-title">Menú Principal</span>
    </div>
    <ul class="sidebar-menu">
      <li v-for="item in menu" :key="item.label" :class="{ active: $route.path === item.route }">
        <template v-if="!item.logout">
          <router-link :to="item.route">
            <i :class="item.icon"></i>
            <span v-if="!collapsed">{{ item.label }}</span>
          </router-link>
        </template>
        <template v-else>
          <a href="#" @click.prevent="handleLogout" class="logout-link">
            <i :class="item.icon"></i>
            <span v-if="!collapsed">{{ item.label }}</span>
          </a>
        </template>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { sidebarOptions } from './sidebarConfig'

const authStore = useAuthStore()
const collapsed = ref(false)
const user = computed(() => authStore.user || {})
const router = useRouter()

const menu = computed(() => {
  if (!authStore.user) return []
  const rol = authStore.user?.NombreRol?.toLowerCase() || ''
  if (rol.includes('admin')) return sidebarOptions.admin
  if (rol.includes('mesa')) return sidebarOptions.mesa
  if (rol.includes('responsable')) return sidebarOptions.responsable
  return sidebarOptions.mesa // fallback
})

function handleLogout() {
  authStore.logout().then(() => {
    router.push('/login')
  })
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: #263238;
  color: #fff;
  min-height: 100vh;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
}
.sidebar.collapsed {
  width: 70px;
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #1a2327;
}
.toggle-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: 1rem;
}
.sidebar-title {
  font-weight: bold;
  font-size: 1.1rem;
}
.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}
.sidebar-menu li {
  margin: 0.5rem 0;
}
.sidebar-menu li.active,
.sidebar-menu li:hover {
  background: #1a2327;
}
.sidebar-menu a {
  display: flex;
  align-items: center;
  color: #fff;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  transition: background 0.2s;
}
.sidebar-menu i {
  margin-right: 1rem;
  font-size: 1.1rem;
}
.sidebar.collapsed .sidebar-menu i {
  margin-right: 0;
  font-size: 1.3rem;
}
.sidebar.collapsed .sidebar-title,
.sidebar.collapsed .sidebar-menu span,
.sidebar.collapsed .sidebar-footer {
  display: none;
}
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #1a2327;
}
.logout-link {
  color: #fff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
}
.logout-link:hover {
  color: #e74c3c;
}
</style> 