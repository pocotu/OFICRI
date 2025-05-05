<template>
  <div class="login-layout">
    <HeaderPublic />
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-avatar">
          <img src="../assets/img/logoOficri2x2.png" alt="OFICRI Logo" />
        </div>
        <h2>Sistema de Gestión OFICRI</h2>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <div class="input-icon">
              <i class="fas fa-id-card"></i>
              <input 
                type="text" 
                id="cip" 
                v-model="credentials.cip" 
                required
                placeholder="Ingrese su CIP"
                autocomplete="off"
              >
            </div>
          </div>
          <div class="form-group">
            <div class="input-icon">
              <i class="fas fa-lock"></i>
              <input 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                v-model="credentials.password" 
                required
                placeholder="Ingrese su contraseña"
              >
              <i 
                class="fas" 
                :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
                @click="showPassword = !showPassword"
              ></i>
            </div>
          </div>
          <button 
            type="submit" 
            class="btn-login" 
            :disabled="loading"
            :class="{ 'loading': loading }"
          >
            <span v-if="!loading">Iniciar Sesión</span>
            <div v-else class="spinner"></div>
          </button>
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HeaderPublic from '../components/HeaderPublic.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()
const authStore = useAuthStore()

const credentials = ref({
  cip: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const success = await authStore.login(credentials.value)
    if (success) {
      router.push('/dashboard')
    } else {
      error.value = authStore.error || 'CIP o contraseña incorrectos'
    }
  } catch (err) {
    error.value = 'Error al iniciar sesión. Intente nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.login-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fa;
}
.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  min-width: 350px;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login-avatar {
  width: 80px;
  height: 80px;
  background: #2dc76d22;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #0f492e;
  margin-bottom: 1rem;
}
.login-avatar img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}
h2 {
  margin-bottom: 1.5rem;
  color: #0f492e;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.form-group {
  width: 100%;
}
.input-icon {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon i {
  position: absolute;
  left: 1rem;
  color: #0f492e;
}
.input-icon input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
}
.input-icon input:focus {
  border-color: #2dc76d;
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 199, 109, 0.1);
}
.input-icon i:last-child {
  left: auto;
  right: 1rem;
  cursor: pointer;
  color: #0f492e;
}
.btn-login {
  width: 100%;
  padding: 1rem;
  background: #2dc76d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}
.btn-login:hover:not(:disabled) {
  background: #0f492e;
  transform: translateY(-1px);
}
.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #d32f2f;
  font-size: 0.95rem;
  text-align: center;
}
</style> 