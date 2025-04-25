<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import mockAuthService from '../services/mockAuthService'

// Variable para controlar si estamos en modo desarrollo
const isDevelopment = false // Cambiar a false para producción

const router = useRouter()
const isLoading = ref(false)
const error = ref('')
const success = ref(false)
const formData = ref({
  CodigoCIP: '',
  password: ''
})

// Redireccionar si ya hay una sesión activa
onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    if (isDevelopment) {
      // En modo desarrollo, verificar con el servicio simulado
      const verification = mockAuthService.verifyToken(token)
      if (verification.success) {
        router.push('/dashboard')
      }
    } else {
      // En producción, verificar token en el servidor
      verifyToken(token)
    }
  }
})

const verifyToken = async (token) => {
  try {
    const response = await axios.post('http://localhost:3000/api/verificar', { token })
    if (response.data.success) {
      router.push('/dashboard')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  } catch (error) {
    console.error('Error al verificar token:', error)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  error.value = ''
  success.value = false
  
  try {
    if (isDevelopment) {
      // Usar servicio simulado en desarrollo
      try {
        const result = mockAuthService.login(formData.value.CodigoCIP, formData.value.password)
        success.value = true
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } catch (err) {
        error.value = err.message || 'Error al iniciar sesión'
      }
    } else {
      // Usar API real en producción
      const response = await axios.post('http://localhost:3000/api/login', formData.value)
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        success.value = true
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        error.value = response.data.message || 'Credenciales incorrectas'
      }
    }
  } catch (err) {
    console.error('Error de inicio de sesión:', err)
    error.value = err.response?.data?.message || 'Error al conectarse al servidor'
  } finally {
    isLoading.value = false
  }
}
</script> 