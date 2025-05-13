<template>
  <div class="profile-rect-wide">
    <div class="profile-col profile-col-info">
      <div class="profile-avatar-rect">
        <i class="fa-solid fa-user"></i>
      </div>
      <h2>Perfil de Usuario</h2>
      <div class="profile-info">
        <div><strong>Nombre:</strong> {{ user.Nombres }} {{ user.Apellidos }}</div>
        <div><strong>CIP:</strong> {{ user.CodigoCIP }}</div>
        <div><strong>Grado:</strong> {{ user.Grado }}</div>
        <div><strong>Rol:</strong> {{ user.NombreRol }}</div>
        <div><strong>Área:</strong> {{ user.NombreArea }}</div>
      </div>
    </div>
    <div class="profile-col profile-col-permisos">
      <h3><i class="fa-solid fa-key"></i> Permisos</h3>
      <div class="permisos-chips-rect">
        <span v-for="permiso in permisosActivos" :key="permiso.label" class="permiso-chip-rect">
          <i class="fa-solid fa-check-circle"></i> {{ permiso.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user || {})

const PERMISOS = [
  { bit: 0, label: 'Crear/Registrar' },
  { bit: 1, label: 'Editar/Modificar' },
  { bit: 2, label: 'Eliminar' },
  { bit: 3, label: 'Ver/Listar/Consultar' },
  { bit: 4, label: 'Derivar' },
  { bit: 5, label: 'Auditar' },
  { bit: 6, label: 'Exportar' },
  { bit: 7, label: 'Administrar' },
]

const permisosActivos = computed(() => {
  const bits = user.value.Permisos || 0
  return PERMISOS.filter(p => (bits & (1 << p.bit)) !== 0)
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
.profile-rect-wide {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(44, 62, 80, 0.09);
  padding: 2.2rem 2.5rem 2rem 2.5rem;
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 2.5rem;
}
.profile-col {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.profile-col-info {
  flex: 1.2;
  min-width: 220px;
}
.profile-col-permisos {
  flex: 1;
  min-width: 180px;
  align-items: flex-start;
}
.profile-avatar-rect {
  width: 70px;
  height: 70px;
  background: #e8f5e9;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.3rem;
  color: #0f492e;
  margin-bottom: 1.1rem;
}
.profile-info > div {
  margin-bottom: 0.4rem;
  font-size: 1.08rem;
}
.profile-col-permisos h3 {
  margin-bottom: 0.7rem;
  color: #184d2b;
  font-size: 1.13rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.permisos-chips-rect {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.permiso-chip-rect {
  display: inline-flex;
  align-items: center;
  background: #e8f5e9;
  color: #2dc76d;
  border-radius: 10px;
  padding: 4px 16px 4px 10px;
  font-size: 1em;
  font-weight: 600;
  gap: 7px;
  box-shadow: 0 1px 2px rgba(44, 62, 80, 0.04);
}
.permiso-chip-rect i {
  font-size: 1em;
}
@media (max-width: 700px) {
  .profile-rect-wide {
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
    max-width: 98vw;
  }
  .profile-col-permisos {
    margin-top: 1.2rem;
  }
  .permisos-chips-rect {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style> 