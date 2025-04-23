<template>
  <div class="user-permissions">
    <div class="permissions-header">
      <h3>Permisos del Usuario</h3>
      <OfiButton
        v-if="canEditPermissions"
        variant="primary"
        @click="showEditModal = true"
      >
        Editar Permisos
      </OfiButton>
    </div>

    <div class="permissions-grid">
      <div
        v-for="(permissions, module) in groupedPermissions"
        :key="module"
        class="permission-module"
      >
        <h4>{{ getModuleLabel(module) }}</h4>
        <div class="permission-list">
          <div
            v-for="permission in permissions"
            :key="permission.id"
            class="permission-item"
          >
            <OfiCheckbox
              :model-value="hasPermission(permission.id)"
              disabled
            />
            <span class="permission-label">{{ permission.name }}</span>
            <OfiTooltip
              v-if="permission.description"
              :text="permission.description"
            >
              <OfiIcon name="info" size="sm" />
            </OfiTooltip>
          </div>
        </div>
      </div>
    </div>

    <OfiModal
      v-model="showEditModal"
      title="Editar Permisos"
      @close="handleModalClose"
    >
      <template #default>
        <div class="edit-permissions">
          <div
            v-for="(permissions, module) in groupedPermissions"
            :key="module"
            class="permission-module"
          >
            <h4>{{ getModuleLabel(module) }}</h4>
            <div class="permission-list">
              <div
                v-for="permission in permissions"
                :key="permission.id"
                class="permission-item"
              >
                <OfiCheckbox
                  v-model="selectedPermissions[permission.id]"
                  :label="permission.name"
                  :disabled="!canEditPermission(permission)"
                />
                <OfiTooltip
                  v-if="permission.description"
                  :text="permission.description"
                >
                  <OfiIcon name="info" size="sm" />
                </OfiTooltip>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="modal-footer">
          <OfiButton
            variant="secondary"
            @click="showEditModal = false"
          >
            Cancelar
          </OfiButton>
          <OfiButton
            variant="primary"
            :loading="saving"
            :disabled="!hasChanges"
            @click="savePermissions"
          >
            Guardar Cambios
          </OfiButton>
        </div>
      </template>
    </OfiModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useAuditStore } from '@/store/auditStore'
import OfiModal from '@shared/components/OfiModal.vue'
import OfiButton from '@shared/components/OfiButton.vue'
import OfiCheckbox from '@shared/components/OfiCheckbox.vue'
import OfiTooltip from '@shared/components/OfiTooltip.vue'
import OfiIcon from '@shared/components/OfiIcon.vue'

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  userPermissions: {
    type: Array,
    required: true
  }
})

const userStore = useUserStore()
const authStore = useAuthStore()
const auditStore = useAuditStore()
const showEditModal = ref(false)
const saving = ref(false)
const selectedPermissions = ref({})
const contextualPermissions = ref({})

const canEditPermissions = computed(() => {
  return authStore.hasPermission(128) // Bit 7: Administrar
})

const groupedPermissions = computed(() => {
  const groups = {}
  props.userPermissions.forEach(permission => {
    const module = permission.module || 'general'
    if (!groups[module]) {
      groups[module] = []
    }
    groups[module].push(permission)
  })
  return groups
})

const hasPermission = (permissionId) => {
  return props.userPermissions.some(p => p.id === permissionId)
}

const canEditPermission = (permission) => {
  // Verificar permisos contextuales
  if (contextualPermissions.value[permission.id] === false) {
    return false
  }
  
  // Verificar bits de permisos
  const requiredBit = getPermissionBit(permission.id)
  return authStore.hasPermission(requiredBit)
}

const getPermissionBit = (permissionId) => {
  // Mapeo de permisos a bits según la documentación
  const permissionBits = {
    CREATE: 1,
    EDIT: 2,
    DELETE: 4,
    VIEW: 8,
    DERIVE: 16,
    AUDIT: 32,
    EXPORT: 64,
    ADMIN: 128
  }
  return permissionBits[permissionId] || 0
}

const hasChanges = computed(() => {
  return Object.entries(selectedPermissions.value).some(([id, value]) => {
    return value !== hasPermission(id)
  })
})

const getModuleLabel = (module) => {
  const labels = {
    general: 'General',
    documents: 'Documentos',
    users: 'Usuarios',
    areas: 'Áreas',
    reports: 'Reportes',
    settings: 'Configuración'
  }
  return labels[module] || module
}

const loadContextualPermissions = async () => {
  try {
    const response = await userStore.getContextualPermissions(props.userId)
    contextualPermissions.value = response
  } catch (err) {
    console.error('Error loading contextual permissions:', err)
  }
}

const initializeSelectedPermissions = () => {
  selectedPermissions.value = {}
  props.userPermissions.forEach(permission => {
    selectedPermissions.value[permission.id] = true
  })
}

const handleModalClose = () => {
  showEditModal.value = false
  initializeSelectedPermissions()
}

const savePermissions = async () => {
  try {
    saving.value = true
    const permissions = Object.entries(selectedPermissions.value)
      .filter(([_, value]) => value)
      .map(([id]) => id)

    await userStore.updateUserPermissions(props.userId, permissions)
    await auditStore.logActivity({
      type: 'PERMISSIONS_UPDATE',
      userId: props.userId,
      details: {
        permissions: permissions
      }
    })
    showEditModal.value = false
  } catch (err) {
    console.error('Error saving permissions:', err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  initializeSelectedPermissions()
  loadContextualPermissions()
})
</script>

<style scoped>
.user-permissions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.permissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.permission-module {
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}

.permission-module h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.permission-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.permission-label {
  flex: 1;
  color: var(--color-text-primary);
}

.edit-permissions {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: var(--spacing-md);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}
</style> 