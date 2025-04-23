<template>
  <div class="access-denied">
    <div class="error-container">
      <div class="error-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h1>Acceso Denegado</h1>
      <p>No tiene los permisos necesarios para acceder a este recurso.</p>
      
      <div class="error-details" v-if="errorDetails">
        <h2>Detalles del Error</h2>
        <p><strong>Ruta:</strong> {{ errorDetails.path }}</p>
        <p><strong>Permiso Requerido:</strong> {{ errorDetails.requiredPermission }}</p>
        <p><strong>Permisos Actuales:</strong> {{ errorDetails.currentPermissions }}</p>
      </div>

      <div class="action-buttons">
        <button @click="goBack" class="btn btn-secondary">
          <i class="fas fa-arrow-left"></i> Volver
        </button>
        <button @click="goHome" class="btn btn-primary">
          <i class="fas fa-home"></i> Ir al Inicio
        </button>
      </div>

      <div class="contact-support" v-if="showContactSupport">
        <p>Si cree que esto es un error, por favor contacte al soporte técnico.</p>
        <button @click="contactSupport" class="btn btn-link">
          <i class="fas fa-envelope"></i> Contactar Soporte
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const errorDetails = ref(null)
const showContactSupport = ref(false)

onMounted(() => {
  // Obtener detalles del error de la ruta
  if (route.query.error) {
    try {
      errorDetails.value = JSON.parse(route.query.error)
    } catch (e) {
      console.error('Error al parsear detalles del error:', e)
    }
  }

  // Mostrar opción de contacto con soporte si el usuario está autenticado
  showContactSupport.value = authStore.isAuthenticated
})

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/dashboard')
}

const contactSupport = () => {
  // Aquí se podría implementar la lógica para contactar al soporte
  // Por ejemplo, abrir un modal o redirigir a una página de contacto
  console.log('Contactar soporte técnico')
}
</script>

<style scoped>
.access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 2rem;
}

.error-container {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

h1 {
  color: #dc3545;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 1.5rem;
}

.error-details {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.error-details h2 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.error-details p {
  margin-bottom: 0.5rem;
  color: #666;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #1a237e;
  color: white;
}

.btn-primary:hover {
  background-color: #0d1b6b;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-link {
  background: none;
  border: none;
  color: #1a237e;
  text-decoration: underline;
  padding: 0;
}

.btn-link:hover {
  color: #0d1b6b;
}

.contact-support {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.contact-support p {
  margin-bottom: 0.5rem;
}
</style> 