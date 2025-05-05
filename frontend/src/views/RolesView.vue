<template>
  <div class="roles-view">
    <h1 class="main-title"><i class="fa-solid fa-user-shield"></i> Gestión de Roles</h1>
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else>
      <div class="roles-grid">
        <div v-for="rol in roles" :key="rol.IDRol" class="role-card">
          <div class="role-header">
            <i class="fa-solid fa-users-cog role-icon" v-if="rol.NombreRol === 'Administrador'"></i>
            <i class="fa-solid fa-user-tie role-icon" v-else-if="rol.NombreRol.includes('Responsable')"></i>
            <i class="fa-solid fa-people-group role-icon" v-else></i>
            <div>
              <div class="role-title">{{ rol.NombreRol }}</div>
              <div class="role-desc">{{ rol.Descripcion }}</div>
            </div>
          </div>
          <div class="role-info">
            <span class="role-label">Nivel:</span> <span class="role-nivel">{{ rol.NivelAcceso }}</span>
          </div>
          <div class="role-permisos">
            <span class="role-label permiso-toggle" @click="togglePermisos(rol.IDRol)">
              Permisos:
              <i :class="['fa-solid', expandedPermisos[rol.IDRol] ? 'fa-chevron-up' : 'fa-chevron-down', 'chevron-icon']"></i>
            </span>
            <transition name="fade">
              <div v-if="expandedPermisos[rol.IDRol]" class="permisos-chips">
                <span v-for="permiso in rol.PermisosDetalle" :key="permiso.IDPermiso" class="permiso-chip" :title="permiso.Alcance">
                  <i class="fa-solid fa-check-circle"></i> {{ permiso.NombrePermiso }}
                </span>
              </div>
            </transition>
          </div>
        </div>
      </div>
      <h2 class="permisos-title"><i class="fa-solid fa-key"></i> Permisos Disponibles</h2>
      <div class="permisos-list">
        <button v-for="permiso in permisos" :key="permiso.IDPermiso" class="permiso-btn permiso-chip-lg" @click="mostrarDescripcion(permiso)">
          <i class="fa-solid fa-key"></i> {{ permiso.NombrePermiso }}
        </button>
      </div>
      <div v-if="permisoSeleccionado" class="modal-permiso" @click.self="cerrarDescripcion">
        <div class="modal-permiso-content">
          <h3><i class="fa-solid fa-key"></i> {{ permisoSeleccionado.NombrePermiso }}</h3>
          <p>{{ descripcionPermiso }}</p>
          <button class="btn-cerrar" @click="cerrarDescripcion">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { fetchRoles, fetchPermisos } from '../api/userApi'

const authStore = useAuthStore()
const token = authStore.token
const roles = ref([])
const permisos = ref([])
const loading = ref(true)
const expandedPermisos = ref({})
const permisoSeleccionado = ref(null)

const descripcionesPermisos = {
  GESTIONAR_USUARIOS: 'Permite crear, editar y eliminar usuarios del sistema.',
  VER_DOCUMENTOS: 'Permite visualizar todos los documentos asignados a su área.',
  DERIVAR_DOCUMENTOS: 'Permite derivar documentos a otras áreas o usuarios.',
  GESTIONAR_AREAS: 'Permite crear, editar y eliminar áreas dentro de la organización.',
  VER_AUDITORIA: 'Permite acceder al módulo de auditoría y ver los logs del sistema.',
  GESTIONAR_ROLES: 'Permite crear, editar y eliminar roles y asignar permisos.'
}

const descripcionPermiso = computed(() => {
  if (!permisoSeleccionado.value) return ''
  return descripcionesPermisos[permisoSeleccionado.value.NombrePermiso] || 'Sin descripción.'
})

function togglePermisos(id) {
  expandedPermisos.value[id] = !expandedPermisos.value[id]
}
function mostrarDescripcion(permiso) {
  permisoSeleccionado.value = permiso
}
function cerrarDescripcion() {
  permisoSeleccionado.value = null
}

onMounted(async () => {
  loading.value = true
  try {
    const [rolesRes, permisosRes] = await Promise.all([
      fetchRoles(token),
      fetchPermisos(token)
    ])
    roles.value = rolesRes.data
    permisos.value = permisosRes.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
.roles-view {
  padding: 24px 16px 18px 16px;
  background: #f7f9fa;
  /* min-height: 100vh; */
}
.main-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #184d2b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.2rem;
  margin-bottom: 2rem;
}
.role-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(44, 62, 80, 0.07);
  padding: 1rem 1.2rem;
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-left: 4px solid #2dc76d;
  transition: box-shadow 0.2s;
}
.role-card:hover {
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.13);
}
.role-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.3rem;
}
.role-icon {
  font-size: 1.8rem;
  color: #2dc76d;
  background: #e8f5e9;
  border-radius: 50%;
  padding: 8px;
}
.role-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #184d2b;
}
.role-desc {
  font-size: 0.9rem;
  color: #4b5c5e;
  margin-top: 2px;
}
.role-info {
  font-size: 0.95rem;
  color: #2dc76d;
  margin-bottom: 0.1rem;
}
.role-label {
  font-weight: 600;
  color: #184d2b;
  margin-right: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
}
.chevron-icon {
  margin-left: 6px;
  font-size: 0.95em;
  transition: transform 0.2s;
}
.role-nivel {
  background: #e8f5e9;
  color: #2dc76d;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.9em;
  margin-left: 2px;
}
.role-permisos {
  margin-top: 0.1rem;
}
.permisos-chips {
  margin-top: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.permiso-chip {
  display: inline-flex;
  align-items: center;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 10px;
  padding: 2px 8px 2px 6px;
  margin: 1px 1px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.permiso-chip i {
  margin-right: 4px;
  font-size: 0.9em;
}
.permiso-chip:hover {
  background: #c8e6c9;
  color: #184d2b;
}
.permiso-chip-lg {
  font-size: 0.95em;
  padding: 3px 12px 3px 8px;
  margin: 3px 4px;
}
.permisos-title {
  font-size: 1.2rem;
  color: #184d2b;
  margin: 2rem 0 0.8rem 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.permisos-list {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.loading {
  font-size: 1.2em;
  color: #888;
  margin-top: 2rem;
}
.permiso-btn {
  background: #e8f5e9;
  color: #2e7d32;
  border: none;
  border-radius: 10px;
  padding: 6px 18px 6px 12px;
  margin: 3px 4px;
  font-size: 0.95em;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px rgba(44, 62, 80, 0.04);
}
.permiso-btn:hover {
  background: #c8e6c9;
  color: #184d2b;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
}
.modal-permiso {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-permiso-content {
  background: #fff;
  padding: 2rem 2.2rem 1.5rem 2.2rem;
  border-radius: 16px;
  min-width: 260px;
  max-width: 350px;
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.13);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.modal-permiso-content h3 {
  margin: 0 0 1rem 0;
  color: #184d2b;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.modal-permiso-content p {
  color: #2e7d32;
  font-size: 1.05em;
  margin-bottom: 1.2rem;
}
.btn-cerrar {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  font-size: 1rem;
  align-self: flex-end;
}
.btn-cerrar:hover {
  background: #c0392b;
}
@media (max-width: 900px) {
  .roles-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.7rem;
  }
  .role-card {
    padding: 0.7rem 0.7rem;
    border-radius: 10px;
  }
}
@media (max-width: 600px) {
  .roles-view {
    padding: 8px 2px;
  }
  .roles-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  .role-card {
    padding: 0.5rem 0.3rem;
    border-radius: 8px;
  }
}
</style> 