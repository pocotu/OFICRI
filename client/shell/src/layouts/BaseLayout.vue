<template>
  <div class="base-layout">
    <Navigation ref="navigationRef" />
    <main class="main-content" :class="{ 'content-shifted': isSidebarVisible }">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import Navigation from '@/components/Navigation.vue'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()
const navigationRef = ref(null)

// Acceso al estado del sidebar para poder desplazar el contenido principal
const isSidebarVisible = computed(() => {
  return navigationRef.value?.isSidebarVisible || false
})

onMounted(() => {
  // Verificar autenticación y permisos
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Configurar guard de rutas
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next('/login')
    } else if (to.meta.requiredPermission && !authStore.hasPermission(to.meta.requiredPermission)) {
      next('/access-denied')
    } else {
      next()
    }
  })
})
</script>

<style scoped>
.base-layout {
  display: flex;
  min-height: 100vh;
  height: auto;
  position: relative;
}

.main-content {
  flex: 1;
  background-color: #f5f5f7;
  padding: 1rem;
  overflow-y: auto;
  transition: all 0.3s ease;
  min-height: 100vh;
  width: 100%;
  position: relative;
}

/* Cuando el sidebar está abierto */
.content-shifted {
  margin-left: 280px;
  width: calc(100% - 280px);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .base-layout {
    flex-direction: column;
  }

  .main-content, .content-shifted {
    margin-left: 0;
    width: 100%;
    padding: 1rem 0.5rem 0.5rem 0.5rem;
    padding-top: 60px; /* Espacio para el botón de hamburguesa en la parte superior */
  }

  .content-wrapper {
    padding: 0.75rem;
  }
}
</style> 