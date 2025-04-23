<template>
  <div class="sidebar-container">
    <!-- Botón hamburguesa en el header (visible solo cuando el sidebar está oculto) -->
    <button 
      v-if="!isSidebarVisible"
      @click="toggleSidebar" 
      class="hamburger-btn"
      aria-label="Abrir menú de navegación"
      :aria-expanded="false"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    
    <!-- Overlay para cerrar en móvil -->
    <div 
      class="sidebar-overlay" 
      :style="{ display: isSidebarVisible && isSmallScreen ? 'block' : 'none' }"
      @click="closeSidebar"
    ></div>
  
    <!-- Sidebar con navegación -->
    <nav class="navigation" :class="{ 'navigation-visible': isSidebarVisible }">
      <div class="header">
        <div class="logo">
          <img src="/logoOficri2x2.png" alt="Logo OFICRI" class="logo-img">
          <h1>Sistema de Gestión OFICRI</h1>
        </div>
        
        <!-- Botón para cerrar el sidebar (visible solo cuando el sidebar está abierto) -->
        <button 
          @click="toggleSidebar" 
          class="close-btn"
          aria-label="Cerrar menú de navegación"
          :aria-expanded="true"
        >
          <i class="fas fa-times"></i>
        </button>
        
        <div class="user-info" v-if="userFullName">
          <span class="user-name">{{ userFullName }}</span>
          <span class="user-role">{{ userRole }}</span>
        </div>
        <div v-else class="user-info">
          <span class="user-name">undefined undefined</span>
        </div>
      </div>

      <div class="menu-container">
        <div class="menu-section" v-for="(section, index) in menuSections" :key="index">
          <h3>{{ section.title }}</h3>
          <ul class="menu-list">
            <li v-for="item in section.items" :key="item.path">
              <router-link 
                :to="item.path" 
                :class="{ active: isActive(item.path) }"
                v-if="hasPermission(item.requiredPermission)"
                @click="closeSidebarOnMobile"
              >
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>&copy; {{ currentYear }} OFICRI - Policía Nacional del Perú</p>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { menuService } from '../services/menuService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Control del sidebar
const isSidebarVisible = ref(window.innerWidth > 768) // Visible en desktop por defecto, oculto en móvil
const isSmallScreen = ref(window.innerWidth <= 768)

// Exportar el estado de visibilidad para que pueda ser accedido por el BaseLayout
defineExpose({ isSidebarVisible })

// Manejar cambio de tamaño de pantalla
const handleResize = () => {
  isSmallScreen.value = window.innerWidth <= 768
  // Ocultar automáticamente en pantallas pequeñas
  if (isSmallScreen.value) {
    isSidebarVisible.value = false
  }
}

// Alternar visibilidad del sidebar
const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}

// Cerrar sidebar en móvil cuando se navega
const closeSidebarOnMobile = () => {
  if (isSmallScreen.value) {
    isSidebarVisible.value = false
  }
}

// Cerrar explícitamente el sidebar
const closeSidebar = () => {
  isSidebarVisible.value = false
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize() // Inicializar estado
})

// Limpiar event listener al desmontar
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const currentYear = new Date().getFullYear()
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

const userFullName = computed(() => {
  const user = authStore.user
  return user ? `${user.Nombres} ${user.Apellidos}` : ''
})

const userRole = computed(() => {
  const user = authStore.user
  return user ? user.NombreRol : ''
})

const hasPermission = (permission) => {
  if (!permission) return true
  return authStore.hasPermission(permission)
}

const isActive = (path) => {
  return route.path.startsWith(path)
}

const menuSections = computed(() => {
  const sections = [
    {
      title: 'Navegación Principal',
      items: [
        {
          path: '/dashboard',
          label: 'Dashboard',
          icon: 'fas fa-chart-line',
          requiredPermission: 8 // Ver
        },
        {
          path: '/documents',
          label: 'Documentos',
          icon: 'fas fa-file-alt',
          requiredPermission: 8 // Ver
        },
        {
          path: '/mesa-partes',
          label: 'Mesa de Partes',
          icon: 'fas fa-inbox',
          requiredPermission: 8 // Ver
        },
        {
          path: '/areas',
          label: 'Áreas',
          icon: 'fas fa-building',
          requiredPermission: 8 // Ver
        }
      ]
    }
  ]

  // Agregar sección de administración si el usuario tiene permisos
  if (authStore.hasPermission(128)) { // Administrar
    sections.push({
      title: 'Administración',
      items: [
        {
          path: '/users',
          label: 'Usuarios',
          icon: 'fas fa-users',
          requiredPermission: 128 // Administrar
        },
        {
          path: '/roles',
          label: 'Roles',
          icon: 'fas fa-user-shield',
          requiredPermission: 128 // Administrar
        },
        {
          path: '/audit',
          label: 'Auditoría',
          icon: 'fas fa-clipboard-list',
          requiredPermission: 32 // Auditar
        },
        {
          path: '/accessibility',
          label: 'Accesibilidad',
          icon: 'fas fa-universal-access',
          requiredPermission: 32 // Auditar
        }
      ]
    })
  }

  return sections
})
</script>

<style scoped>
/* Contenedor del sidebar y botón hamburguesa */
.sidebar-container {
  position: relative;
}

/* Botón hamburguesa (fuera del sidebar) */
.hamburger-btn {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1050; /* Mayor z-index para asegurar visibilidad por encima de todo */
  width: 50px;
  height: 50px;
  background-color: #0d4e25;
  border: none;
  border-radius: 10px; /* Esquinas redondeadas pero no circular */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  outline: 3px solid rgba(255, 255, 255, 0.2); /* Contorno sutil para mayor visibilidad */
}

.hamburger-btn:hover {
  transform: scale(1.08);
  background-color: #116b33;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
}

.hamburger-btn span {
  display: block;
  width: 28px;
  height: 3px; /* Líneas más gruesas */
  background-color: white;
  border-radius: 3px;
  transition: all 0.3s ease;
}

/* Botón X para cerrar el sidebar (dentro del sidebar) */
.close-btn {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 1050;
  width: 50px;
  height: 50px;
  background-color: #0d4e25;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  outline: 3px solid rgba(255, 255, 255, 0.2);
}

.close-btn i {
  font-size: 28px;
  color: white;
}

.close-btn:hover {
  transform: scale(1.08);
  background-color: #116b33;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
}

/* Overlay para cerrar el sidebar en móvil */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
  backdrop-filter: blur(2px);
}

/* Sidebar principal */
.navigation {
  width: 280px;
  background: linear-gradient(135deg, #cfe2f3 0%, #e3f2fd 100%);
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  transform: translateX(-100%);
  overflow-y: auto;
}

/* Cuando el sidebar es visible */
.navigation-visible {
  transform: translateX(0);
}

/* Cabecera del sidebar */
.header {
  padding: 1rem;
  background-color: #0d4e25;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative; /* Para posicionar el botón de cierre */
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-right: 30px; /* Espacio para el botón X */
}

.logo-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.logo h1 {
  font-size: 1rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.user-info {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.user-name {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.user-role {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Contenedor del menú */
.menu-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.menu-section {
  margin-bottom: 1.5rem;
}

.menu-section h3 {
  color: #0d4e25;
  font-size: 0.8rem;
  text-transform: uppercase;
  padding: 0.5rem 0.25rem;
  border-bottom: 1px solid rgba(13, 78, 37, 0.1);
  margin-bottom: 0.75rem;
  font-weight: 600;
  text-align: left;
  letter-spacing: 1px;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-list li {
  margin-bottom: 0.35rem;
}

.menu-list a {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #2c3e50;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.menu-list a:hover {
  background-color: rgba(13, 78, 37, 0.08);
  transform: translateX(3px);
}

.menu-list a.active {
  background-color: #0d4e25;
  color: white;
  box-shadow: 0 2px 4px rgba(13, 78, 37, 0.3);
}

.menu-list i {
  font-size: 1rem;
  width: 24px;
  margin-right: 0.75rem;
  text-align: center;
}

/* Footer */
.footer {
  padding: 1rem;
  background-color: rgba(13, 78, 37, 0.05);
  text-align: center;
  color: #666;
  font-size: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* Media queries para responsive */
@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
  }
  
  .navigation {
    width: 260px;
  }
  
  /* El botón hamburguesa se oculta cuando el sidebar está abierto en móvil */
  .hamburger-btn, .close-btn {
    width: 55px;
    height: 55px;
    top: 10px;
    left: 10px;
  }
  
  .hamburger-btn span {
    width: 30px;
    height: 3px;
  }
  
  .close-btn i {
    font-size: 30px;
  }
}

@media (min-width: 769px) {
  /* El botón siempre permanece visible en la misma posición */
  .hamburger-btn.menu-open {
    opacity: 1;
    pointer-events: auto;
  }
}
</style> 