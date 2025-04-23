<template>
  <slot v-if="hasPermission"></slot>
  <slot v-else name="fallback">
    <div class="permission-denied">
      <h3>Acceso Denegado</h3>
      <p>No tiene los permisos necesarios para acceder a este recurso.</p>
    </div>
  </slot>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/store'
import { permissionService } from '@/services/permissions'

const CONTEXT_TYPES = {
  DOCUMENTO: 'documento',
  EXPEDIENTE: 'expediente',
  USUARIO: 'usuario',
  ROL: 'rol',
  PERMISO: 'permiso',
  AUDITORIA: 'auditoria',
  REPORTE: 'reporte'
}

const props = defineProps({
  // Permiso único o array de permisos
  permission: {
    type: [String, Array],
    required: true
  },
  // Tipo de verificación: 'single', 'all', 'any'
  type: {
    type: String,
    default: 'single',
    validator: (value) => ['single', 'all', 'any'].includes(value)
  },
  // Tipo de contexto para verificación contextual
  contextType: {
    type: String,
    default: null,
    validator: (value) => !value || Object.values(CONTEXT_TYPES).includes(value)
  },
  // ID del recurso para verificación contextual
  contextId: {
    type: [String, Number],
    default: null
  },
  // Recurso completo para verificación contextual avanzada
  resource: {
    type: Object,
    default: null
  },
  // Acción para verificación contextual
  action: {
    type: String,
    default: null
  }
})

const authStore = useAuthStore()
const hasPermission = computed(async () => {
  if (!authStore.isAuthenticated) return false
  
  try {
    // Verificación contextual avanzada
    if (props.resource && props.contextType && props.action) {
      return await permissionService.checkContextualPermission(
        props.resource,
        props.contextType,
        props.action
      )
    }
    
    // Verificación contextual básica
    if (props.contextType && props.contextId) {
      return await permissionService.checkPermission(
        authStore.permissions,
        props.permission,
        props.contextType,
        props.contextId
      )
    }
    
    // Verificación de permisos según tipo
    const permissions = Array.isArray(props.permission) 
      ? props.permission 
      : [props.permission]
    
    switch (props.type) {
      case 'single':
        return permissions.some(p => 
          permissionService.hasPermission(authStore.permissions, p)
        )
      case 'all':
        return permissions.every(p => 
          permissionService.hasPermission(authStore.permissions, p)
        )
      case 'any':
        return permissions.some(p => 
          permissionService.hasPermission(authStore.permissions, p)
        )
      default:
        return false
    }
  } catch (error) {
    console.error('Error al verificar permisos:', error)
    return false
  }
})

// Observar cambios en el usuario autenticado
watch(() => authStore.user, () => {
  // La propiedad computada se actualizará automáticamente
}, { immediate: true })
</script>

<style scoped>
.permission-denied {
  padding: 1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  text-align: center;
}

.permission-denied h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.permission-denied p {
  margin: 0;
  font-size: 0.9rem;
}
</style> 