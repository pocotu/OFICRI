<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-avatar">
        <i class="fa fa-user-circle"></i>
      </div>
      <div class="profile-info">
        <h2>Perfil de Usuario</h2>
        <ul>
          <li><span>Nombre:</span> {{ user.Nombres }} {{ user.Apellidos }}</li>
          <li><span>CIP:</span> {{ user.CodigoCIP }}</li>
          <li><span>Grado:</span> {{ user.Grado }}</li>
          <li><span>Rol:</span> {{ user.NombreRol }}</li>
          <li><span>Área:</span> {{ user.NombreArea }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user || {})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  background: #f7f9fb;
}
.profile-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(44,62,80,0.08);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  display: flex;
  align-items: center;
  gap: 2.5rem;
  transition: box-shadow 0.2s;
}
.profile-card:hover {
  box-shadow: 0 4px 24px rgba(44,62,80,0.13);
}
.profile-avatar {
  font-size: 4.5rem;
  color: #2d3e50;
  background: #e9ecef;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-info h2 {
  font-size: 1.7rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  color: #1a3c2b;
}
.profile-info ul {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}
.profile-info li {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.profile-info span {
  font-weight: 600;
  color: #2d3e50;
  margin-right: 0.5rem;
}
.edit-btn {
  background: #e9ecef;
  color: #2d3e50;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.edit-btn:hover {
  background: #d1d5db;
}
@media (max-width: 700px) {
  .profile-card {
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
    max-width: 98vw;
  }
}
</style> 