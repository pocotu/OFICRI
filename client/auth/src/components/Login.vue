<template>
  <div class="login-form-container">
    <div class="login-card">
      <div class="card-logo">
        <img src="/logoOficri2x2.png" alt="Logo OFICRI">
      </div>
      <h2 class="card-title">Sistema de Gestión OFICRI</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <div>CIP</div>
          <div class="input-field">
            <span class="input-icon">
              <i class="bi bi-person-badge"></i>
            </span>
            <input
              v-model="codigoCIP"
              type="text"
              placeholder="Ingrese su CIP"
              required
              pattern="[0-9]{8}"
              title="El código CIP debe tener 8 dígitos"
              :disabled="isLoading"
            />
          </div>
        </div>
        
        <div class="form-group">
          <div>Contraseña</div>
          <div class="input-field">
            <span class="input-icon">
              <i class="bi bi-lock"></i>
            </span>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Ingrese su contraseña"
              required
              :disabled="isLoading"
            />
            <button type="button" class="toggle-visibility" @click="togglePasswordVisibility">
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
        </div>
        
        <div v-if="error" class="error-alert">
          {{ error }}
        </div>
        
        <button type="submit" class="login-btn" :disabled="isLoading">
          <i v-if="!isLoading" class="bi bi-box-arrow-in-right"></i>
          <span v-if="isLoading" class="spinner"></span>
          Iniciar Sesión
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import { authService } from '../services'

const router = useRouter()
const authStore = useAuthStore()
const codigoCIP = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

const handleLogin = async () => {
  try {
    isLoading.value = true
    error.value = ''

    // Validar formato del código CIP
    if (!/^[0-9]{8}$/.test(codigoCIP.value)) {
      error.value = 'El código CIP debe tener 8 dígitos'
      isLoading.value = false;
      return
    }

    const response = await authService.login(codigoCIP.value, password.value)

    if (response.success) {
      console.log('Login exitoso:', response); // Log para depuración
      
      // Asegurarnos que los datos del usuario contengan los permisos
      const userData = response.user || {};
      
      // Establecer permisos mínimos si no existen (para poder navegar al dashboard)
      if (!userData.Permisos) {
        userData.Permisos = 8; // Permiso mínimo de visualización
      }
      
      // Almacenar datos en el store para actualizar la UI
      authStore.setUser(userData);
      authStore.setToken(response.token);
      
      // También almacenar en localStorage (como respaldo)
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Pequeño retraso para asegurar que los datos se establezcan
      setTimeout(() => {
        // Redirigir al dashboard
        router.push('/dashboard')
      }, 100);
    } else {
      error.value = response.message || 'Error al iniciar sesión'
    }
  } catch (err) {
    console.error("Error en handleLogin:", err);
    error.value = err.response?.data?.message || err.message || 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<style scoped>
.login-form-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.login-card {
  background-color: white;
  border-radius: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
}

.card-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.card-logo img {
  width: 80px;
  height: 80px;
}

.card-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 25px;
  font-weight: 500;
}

/* Formulario */
form {
  text-align: left;
}

.form-group {
  margin-bottom: 20px;
}

.form-group div:first-child {
  margin-bottom: 8px;
  font-weight: normal;
  color: #333;
}

.input-field {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 10px;
  color: #333;
  z-index: 1;
}

.input-field input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: none;
  background-color: #f0f7ff;
  border-radius: 0;
  font-size: 15px;
}

.toggle-visibility {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  z-index: 1;
}

.error-alert {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 0;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background-color: #0d4e25;
  color: white;
  border: none;
  border-radius: 0;
  font-size: 16px;
  font-weight: normal;
  cursor: pointer;
  gap: 8px;
}

.login-btn:hover {
  background-color: #0a3e1d;
}

.login-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 