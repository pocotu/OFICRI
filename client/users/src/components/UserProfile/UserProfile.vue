<template>
  <div class="user-profile">
    <div class="profile-header">
      <h2>Perfil de Usuario</h2>
      <div class="header-actions">
        <OfiButton
          v-if="canEditUser"
          variant="primary"
          @click="showEditForm = true"
        >
          Editar Perfil
        </OfiButton>
        <OfiButton
          v-if="canResetPassword"
          variant="secondary"
          @click="showResetPasswordModal = true"
        >
          Restablecer Contraseña
        </OfiButton>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-info">
        <div class="info-card">
          <div class="user-avatar">
            <OfiAvatar
              :name="user.name"
              :size="'xl'"
            />
          </div>
          <div class="user-details">
            <h3>{{ user.name }}</h3>
            <p class="user-cip">CIP: {{ user.cip }}</p>
            <p class="user-role">{{ user.role }}</p>
            <p class="user-area">{{ user.area }}</p>
            <OfiBadge
              :type="user.active ? 'success' : 'error'"
              :text="user.active ? 'Activo' : 'Inactivo'"
            />
          </div>
        </div>

        <div class="info-stats">
          <div class="stat-item">
            <OfiIcon name="document" size="lg" />
            <div class="stat-content">
              <span class="stat-value">{{ stats.documents }}</span>
              <span class="stat-label">Documentos</span>
            </div>
          </div>
          <div class="stat-item">
            <OfiIcon name="clock" size="lg" />
            <div class="stat-content">
              <span class="stat-value">{{ stats.lastLogin }}</span>
              <span class="stat-label">Último Acceso</span>
            </div>
          </div>
          <div class="stat-item">
            <OfiIcon name="activity" size="lg" />
            <div class="stat-content">
              <span class="stat-value">{{ stats.activities }}</span>
              <span class="stat-label">Actividades</span>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-sections">
        <OfiTabs>
          <OfiTab title="Actividad">
            <UserActivity
              :user-id="userId"
              :activities="activities"
            />
          </OfiTab>
          <OfiTab title="Permisos">
            <UserPermissions
              :user-id="userId"
              :user-permissions="permissions"
            />
          </OfiTab>
        </OfiTabs>
      </div>
    </div>

    <OfiModal
      v-model="showEditForm"
      title="Editar Perfil"
      size="lg"
      @close="handleEditModalClose"
    >
      <template #default>
        <UserEditForm
          :user="user"
          @save="handleSaveUser"
          @cancel="showEditForm = false"
        />
      </template>
    </OfiModal>

    <OfiModal
      v-model="showResetPasswordModal"
      title="Restablecer Contraseña"
      @close="showResetPasswordModal = false"
    >
      <template #default>
        <div class="reset-password-form">
          <OfiAlert
            type="warning"
            message="¿Está seguro que desea restablecer la contraseña de este usuario? Se enviará una nueva contraseña temporal al correo electrónico registrado."
          />
          <div class="form-actions">
            <OfiButton
              variant="secondary"
              @click="showResetPasswordModal = false"
            >
              Cancelar
            </OfiButton>
            <OfiButton
              variant="primary"
              :loading="resettingPassword"
              @click="handleResetPassword"
            >
              Restablecer
            </OfiButton>
          </div>
        </div>
      </template>
    </OfiModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useAuditStore } from '@/store/auditStore'
import OfiModal from '@shared/components/OfiModal.vue'
import OfiButton from '@shared/components/OfiButton.vue'
import OfiAvatar from '@shared/components/OfiAvatar.vue'
import OfiBadge from '@shared/components/OfiBadge.vue'
import OfiIcon from '@shared/components/OfiIcon.vue'
import OfiTabs from '@shared/components/OfiTabs.vue'
import OfiTab from '@shared/components/OfiTab.vue'
import OfiAlert from '@shared/components/OfiAlert.vue'
import UserEditForm from './UserEditForm.vue'
import UserActivity from './UserActivity.vue'
import UserPermissions from './UserPermissions.vue'

const route = useRoute()
const userStore = useUserStore()
const authStore = useAuthStore()
const auditStore = useAuditStore()

const userId = computed(() => route.params.id)
const user = ref({})
const stats = ref({
  documents: 0,
  lastLogin: 'Nunca',
  activities: 0
})
const activities = ref([])
const permissions = ref([])
const showEditForm = ref(false)
const showResetPasswordModal = ref(false)
const resettingPassword = ref(false)

const canEditUser = computed(() => {
  return authStore.hasPermission(2) || // Bit 2: Editar
         authStore.hasPermission(128) || // Bit 7: Administrar
         authStore.user.id === userId.value
})

const canResetPassword = computed(() => {
  return authStore.hasPermission(128) // Bit 7: Administrar
})

const loadUserData = async () => {
  try {
    const [userData, userStats, userActivities, userPermissions] = await Promise.all([
      userStore.getUserById(userId.value),
      userStore.getUserStats(userId.value),
      userStore.getUserActivities(userId.value),
      userStore.getUserPermissions(userId.value)
    ])

    user.value = userData
    stats.value = userStats
    activities.value = userActivities
    permissions.value = userPermissions
  } catch (err) {
    console.error('Error loading user data:', err)
  }
}

const handleEditModalClose = () => {
  showEditForm.value = false
  loadUserData()
}

const handleSaveUser = async (updatedUser) => {
  try {
    await userStore.updateUser(userId.value, updatedUser)
    await auditStore.logActivity({
      type: 'PROFILE_UPDATE',
      userId: userId.value,
      details: {
        changes: updatedUser
      }
    })
    showEditForm.value = false
    loadUserData()
  } catch (err) {
    console.error('Error saving user:', err)
  }
}

const handleResetPassword = async () => {
  try {
    resettingPassword.value = true
    await userStore.resetUserPassword(userId.value)
    await auditStore.logActivity({
      type: 'PASSWORD_RESET',
      userId: userId.value,
      details: {
        resetBy: authStore.user.id
      }
    })
    showResetPasswordModal.value = false
  } catch (err) {
    console.error('Error resetting password:', err)
  } finally {
    resettingPassword.value = false
  }
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.user-profile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-info {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-lg);
}

.info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
}

.user-avatar {
  margin-bottom: var(--spacing-md);
}

.user-details {
  text-align: center;
}

.user-details h3 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
}

.user-cip {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-secondary);
}

.user-role,
.user-area {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
}

.info-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.profile-sections {
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}

.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}
</style> 