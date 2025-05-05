<template>
  <div class="usuarios-view">
    <h1>Gestión de Usuarios</h1>
    <div v-if="!puedeVer">
      <div class="alert alert-danger">No tienes permisos para ver esta sección.</div>
    </div>
    <div v-else>
      <div class="usuarios-header">
        <button v-if="puedeCrear" class="btn btn-success" @click="abrirModalCrear">
          <i class="fa fa-user-plus"></i> Crear Usuario
        </button>
      </div>
      <div class="usuarios-table-wrapper">
        <table class="usuarios-table">
          <thead>
            <tr>
              <th>CIP</th>
              <th>Nombre</th>
              <th>Grado</th>
              <th>Área</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.IDUsuario">
              <td>{{ usuario.CodigoCIP }}</td>
              <td>{{ usuario.Nombres }} {{ usuario.Apellidos }}</td>
              <td>{{ usuario.Grado }}</td>
              <td>{{ usuario.NombreArea }}</td>
              <td>{{ usuario.NombreRol }}</td>
              <td>
                <span :class="usuario.Bloqueado ? 'text-danger' : 'text-success'">
                  {{ usuario.Bloqueado ? 'Bloqueado' : 'Activo' }}
                </span>
              </td>
              <td>
                <button v-if="puedeEditar" class="btn btn-edit" @click="abrirModalEditar(usuario)"><i class="fa fa-edit"></i></button>
                <button v-if="puedeEliminar && usuario.IDUsuario !== user.IDUsuario" class="btn btn-delete" @click="eliminarUsuario(usuario.IDUsuario)"><i class="fa fa-trash"></i></button>
                <button v-if="puedeResetear && usuario.IDUsuario !== user.IDUsuario" class="btn btn-reset" @click="resetearContrasena(usuario.IDUsuario)"><i class="fa fa-key"></i></button>
                <button v-if="puedeResetear && usuario.IDUsuario !== user.IDUsuario" class="btn btn-block" :class="usuario.Bloqueado ? 'btn-success' : 'btn-danger'" @click="toggleBloqueo(usuario)">
                  <i :class="usuario.Bloqueado ? 'fa fa-unlock' : 'fa fa-lock'" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Modales para crear/editar usuario -->
      <div v-if="modalCrear" class="modal">
        <!-- Formulario de creación de usuario -->
        <div class="modal-content">
          <h2>Crear Usuario</h2>
          <form @submit.prevent="crearUsuario">
            <input v-model="nuevoUsuario.cip" placeholder="CIP" required />
            <input v-model="nuevoUsuario.nombres" placeholder="Nombres" required />
            <input v-model="nuevoUsuario.apellidos" placeholder="Apellidos" required />
            <input v-model="nuevoUsuario.grado" placeholder="Grado" required />
            <select v-model="nuevoUsuario.idArea" required>
              <option v-for="area in areas" :value="area.IDArea" :key="area.IDArea">{{ area.NombreArea }}</option>
            </select>
            <select v-model="nuevoUsuario.idRol" required>
              <option v-for="rol in roles" :value="rol.IDRol" :key="rol.IDRol">{{ rol.NombreRol }}</option>
            </select>
            <input v-model="nuevoUsuario.password" type="password" placeholder="Contraseña" required />
            <div class="modal-actions">
              <button type="submit" class="btn btn-success">Crear</button>
              <button type="button" class="btn btn-cancel" @click="modalCrear = false">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
      <div v-if="modalEditar" class="modal">
        <!-- Formulario de edición de usuario -->
        <div class="modal-content">
          <h2>Editar Usuario</h2>
          <form @submit.prevent="editarUsuario">
            <input v-model="usuarioEditar.nombres" placeholder="Nombres" required />
            <input v-model="usuarioEditar.apellidos" placeholder="Apellidos" required />
            <input v-model="usuarioEditar.grado" placeholder="Grado" required />
            <select v-model="usuarioEditar.idArea" required>
              <option v-for="area in areas" :value="area.IDArea" :key="area.IDArea">{{ area.NombreArea }}</option>
            </select>
            <select v-model="usuarioEditar.idRol" required>
              <option v-for="rol in roles" :value="rol.IDRol" :key="rol.IDRol">{{ rol.NombreRol }}</option>
            </select>
            <div class="modal-actions">
              <button type="submit" class="btn btn-success">Guardar</button>
              <button type="button" class="btn btn-cancel" @click="modalEditar = false">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
      <!-- Modal para resetear contraseña -->
      <div v-if="modalResetear" class="modal">
        <div class="modal-content">
          <h2>Resetear Contraseña</h2>
          <form @submit.prevent="confirmarReset">
            <input v-model="resetPasswordData.password" type="password" placeholder="Nueva contraseña" required minlength="6" />
            <input v-model="resetPasswordData.confirm" type="password" placeholder="Confirmar contraseña" required minlength="6" />
            <div v-if="resetPasswordError" class="alert alert-danger">{{ resetPasswordError }}</div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-success">Resetear</button>
              <button type="button" class="btn btn-cancel" @click="cerrarModalReset">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { fetchUsers, createUser, updateUser, deleteUser, resetPassword, fetchActiveAreas } from '../api/userApi'
import axios from 'axios'

const authStore = useAuthStore()
const user = computed(() => authStore.user || {})
const token = computed(() => authStore.token)

const usuarios = ref([])
const areas = ref([])
const roles = ref([])

const modalCrear = ref(false)
const modalEditar = ref(false)
const nuevoUsuario = ref({ cip: '', nombres: '', apellidos: '', grado: '', idArea: '', idRol: '', password: '' })
const usuarioEditar = ref({})
const modalResetear = ref(false)
const resetUserId = ref(null)
const resetPasswordData = ref({ password: '', confirm: '' })
const resetPasswordError = ref('')

const PERMISOS = {
  CREAR: 1,
  EDITAR: 2,
  ELIMINAR: 4,
  VER: 8,
  ADMIN: 128
}

const puedeCrear = computed(() => (user.value.Permisos & PERMISOS.ADMIN) === PERMISOS.ADMIN)
const puedeEditar = computed(() => (user.value.Permisos & PERMISOS.EDITAR) === PERMISOS.EDITAR || (user.value.Permisos & PERMISOS.ADMIN) === PERMISOS.ADMIN)
const puedeEliminar = computed(() => (user.value.Permisos & PERMISOS.ELIMINAR) === PERMISOS.ELIMINAR || (user.value.Permisos & PERMISOS.ADMIN) === PERMISOS.ADMIN)
const puedeVer = computed(() => (user.value.Permisos & PERMISOS.VER) === PERMISOS.VER || (user.value.Permisos & PERMISOS.ADMIN) === PERMISOS.ADMIN)
const puedeResetear = computed(() => (user.value.Permisos & PERMISOS.ADMIN) === PERMISOS.ADMIN)

async function cargarUsuarios() {
  const res = await fetchUsers(token.value)
  usuarios.value = res.data
}
async function cargarAreas() {
  const res = await fetchActiveAreas(token.value)
  areas.value = res.data
}
async function cargarRoles() {
  const res = await axios.get('/api/roles', { headers: { Authorization: `Bearer ${token.value}` } })
  roles.value = res.data
}

onMounted(async () => {
  if (puedeVer.value) {
    await Promise.all([cargarUsuarios(), cargarAreas(), cargarRoles()])
  }
})

function abrirModalCrear() {
  modalCrear.value = true
  nuevoUsuario.value = { cip: '', nombres: '', apellidos: '', grado: '', idArea: '', idRol: '', password: '' }
}

async function crearUsuario() {
  await createUser({
    cip: nuevoUsuario.value.cip,
    nombres: nuevoUsuario.value.nombres,
    apellidos: nuevoUsuario.value.apellidos,
    grado: nuevoUsuario.value.grado,
    idArea: nuevoUsuario.value.idArea,
    idRol: nuevoUsuario.value.idRol,
    password: nuevoUsuario.value.password
  }, token.value)
  modalCrear.value = false
  await cargarUsuarios()
}

function abrirModalEditar(usuario) {
  modalEditar.value = true
  usuarioEditar.value = { ...usuario }
}

async function editarUsuario() {
  await updateUser(usuarioEditar.value.IDUsuario, {
    nombres: usuarioEditar.value.Nombres,
    apellidos: usuarioEditar.value.Apellidos,
    grado: usuarioEditar.value.Grado,
    idArea: usuarioEditar.value.IDArea,
    idRol: usuarioEditar.value.IDRol
  }, token.value)
  modalEditar.value = false
  await cargarUsuarios()
}

async function eliminarUsuario(id) {
  if (confirm('¿Seguro que deseas eliminar este usuario?')) {
    await deleteUser(id, token.value)
    await cargarUsuarios()
  }
}

function resetearContrasena(id) {
  resetUserId.value = id
  resetPasswordData.value = { password: '', confirm: '' }
  resetPasswordError.value = ''
  modalResetear.value = true
}

function cerrarModalReset() {
  modalResetear.value = false
  resetUserId.value = null
  resetPasswordData.value = { password: '', confirm: '' }
  resetPasswordError.value = ''
}

async function confirmarReset() {
  if (resetPasswordData.value.password.length < 6) {
    resetPasswordError.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (resetPasswordData.value.password !== resetPasswordData.value.confirm) {
    resetPasswordError.value = 'Las contraseñas no coinciden.'
    return
  }
  try {
    await resetPassword(resetUserId.value, token.value, resetPasswordData.value.password)
    cerrarModalReset()
    alert('Contraseña actualizada correctamente.')
    await cargarUsuarios()
  } catch (e) {
    resetPasswordError.value = e.response?.data?.message || 'Error al resetear la contraseña.'
  }
}

async function toggleBloqueo(usuario) {
  try {
    const accion = usuario.Bloqueado ? 'desbloquear' : 'bloquear';
    await axios.patch(`/api/usuarios/${usuario.IDUsuario}/bloqueo`, { bloquear: !usuario.Bloqueado }, {
      headers: { Authorization: `Bearer ${token.value}` }
    });
    await cargarUsuarios();
    alert(`Usuario ${accion === 'bloquear' ? 'bloqueado' : 'habilitado'} correctamente.`);
  } catch (e) {
    alert(e.response?.data?.message || 'Error al cambiar el estado de bloqueo.');
  }
}
</script>

<style scoped>
.usuarios-view {
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  width: 100%;
  max-width: none;
  margin: 0;
}
.usuarios-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1.2rem;
}
.usuarios-table-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  padding: 1.5rem 1rem;
}
.usuarios-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 0;
  font-size: 1rem;
}
.usuarios-table th, .usuarios-table td {
  border-bottom: 1px solid #e1e1e1;
  padding: 0.75rem 1.2rem;
  text-align: left;
}
.usuarios-table th {
  background: #f7f7f7;
  font-weight: bold;
  color: #263238;
}
.usuarios-table tr:last-child td {
  border-bottom: none;
}
.btn {
  margin-right: 0.3rem;
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.btn-success {
  background: #2dc76d;
  color: #fff;
}
.btn-success:hover {
  background: #1e9e4a;
}
.btn-edit {
  background: #f7c948;
  color: #fff;
}
.btn-edit:hover {
  background: #e1b200;
}
.btn-delete {
  background: #e74c3c;
  color: #fff;
}
.btn-delete:hover {
  background: #c0392b;
}
.btn-reset {
  background: #2980b9;
  color: #fff;
}
.btn-reset:hover {
  background: #145a86;
}
.btn-cancel {
  background: #b0b0b0;
  color: #fff;
}
.btn-cancel:hover {
  background: #888;
}
.alert-danger {
  background: #fee2e2;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 2.5rem 2rem 2rem 2rem;
  border-radius: 18px;
  min-width: 340px;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.13);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.modal-content h2 {
  margin-bottom: 1.5rem;
  color: #263238;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}
.modal-content form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.modal-content input,
.modal-content select {
  padding: 0.7rem 1rem;
  border: 1.5px solid #e1e1e1;
  border-radius: 8px;
  font-size: 1rem;
  background: #f9f9f9;
  transition: border 0.2s, box-shadow 0.2s;
}
.modal-content input:focus,
.modal-content select:focus {
  border-color: #2dc76d;
  outline: none;
  box-shadow: 0 0 0 2px rgba(45, 199, 109, 0.13);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.2rem;
}
.btn-success {
  background: #2dc76d;
  color: #fff;
  font-size: 1.1rem;
  padding: 0.7rem 2.2rem;
  border-radius: 8px;
}
.btn-cancel {
  background: #b0b0b0;
  color: #fff;
  font-size: 1.1rem;
  padding: 0.7rem 2.2rem;
  border-radius: 8px;
}
.btn-success:hover {
  background: #1e9e4a;
}
.btn-cancel:hover {
  background: #888;
}
@media (max-width: 900px) {
  .usuarios-view {
    padding: 1rem;
  }
  .usuarios-table-wrapper {
    padding: 0.5rem;
  }
  .modal-content {
    min-width: 90vw;
    max-width: 98vw;
    padding: 1.2rem 0.5rem;
  }
}
</style> 