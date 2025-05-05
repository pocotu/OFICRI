<template>
  <div>Cerrando sesión...</div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  authStore.logout()
  router.replace('/login')
})
</script> 