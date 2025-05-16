<template>
  <div class="login-layout">
    <HeaderPublic />
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-avatar">
          <img src="../assets/img/logoOficri2x2.png" alt="OFICRI Logo" style="width: 140px; height: 140px;" />
        </div>
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
  background: #f7f9fa;
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
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.13);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  min-width: 350px;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
}
.login-card:hover {
  box-shadow: 0 8px 32px rgba(44, 62, 80, 0.18);
}
.login-avatar {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.login-avatar img {
  width: 140px;
  height: 140px;
  object-fit: contain;
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
  padding: 0.7rem 0.7rem 0.7rem 2.5rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 1rem;
  background: #fafbfa;
  transition: border 0.2s, box-shadow 0.2s;
}
.input-icon input:focus {
  border: 1.5px solid #2dc76d;
  box-shadow: 0 0 0 2px #2dc76d22;
}
.input-icon i:last-child {
  left: auto;
  right: 1rem;
  cursor: pointer;
  color: #0f492e;
}
.btn-login {
  background: #14532d;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 1rem;
  width: 100%;
  transition: background 0.2s, box-shadow 0.2s, filter 0.2s;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
}
.btn-login:hover {
  background: #218838;
  filter: brightness(1.08);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.13);
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
  color: #e74c3c;
  background: #fbe9e7;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 0.7rem;
  font-size: 0.98rem;
  text-align: center;
}
@media (max-width: 600px) {
  .login-card {
    min-width: 90vw;
    padding: 1.2rem 0.7rem 1rem 0.7rem;
  }
}
</style> 