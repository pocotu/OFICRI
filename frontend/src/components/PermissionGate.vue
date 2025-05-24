<template>
  <component 
    v-if="hasPermission" 
    :is="tag" 
    class="permission-gate"
    :class="additionalClass"
  >
    <slot></slot>
  </component>
  <component 
    v-else-if="fallback" 
    :is="tag" 
    class="permission-gate permission-gate--fallback"
    :class="additionalClass"
  >
    <slot name="fallback">
      <!-- Fallback por defecto -->
      <div class="permission-denied">
        <i class="fas fa-lock text-muted"></i>
        <span>Sin acceso</span>
      </div>
    </slot>
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const props = defineProps({
  permission: { // Número del bit de permiso (1, 2, 4, 8, 16, 32, 64, 128)
    type: Number,
    required: true
  },
  tag: { // Elemento HTML a renderizar
    type: String,
    default: 'div'
  },
  fallback: { // Si mostrar o no un fallback cuando no hay permiso
    type: Boolean,
    default: false
  },
  additionalClass: { // Clases adicionales
    type: String,
    default: ''
  },
  checkAll: { // Si se requiere que el usuario tenga TODOS los permisos especificados
    type: Boolean,
    default: false
  },
  contextual: { // Indica si es un permiso contextual
    type: Boolean,
    default: false
  },
  contextType: { // Tipo de contexto (solo si contextual = true)
    type: String,
    default: null
  },
  contextId: { // ID del recurso contextual (solo si contextual = true)
    type: [Number, String],
    default: null
  }
});

const authStore = useAuthStore();

const hasPermission = computed(() => {
  // Si el usuario no está autenticado, no tiene permisos
  if (!authStore.isAuthenticated || !authStore.user) {
    return false;
  }

  // Si tiene rol de administrador, tiene todos los permisos
  if (authStore.user.NombreRol?.toLowerCase().includes('admin')) {
    return true;
  }

  // Verificamos los permisos basados en bits
  const userPermisos = authStore.user.Permisos || 0;
  
  // Si checkAll es true, TODOS los bits deben estar presentes
  // Si checkAll es false, al menos UNO de los bits debe estar presente
  if (props.checkAll) {
    return (userPermisos & props.permission) === props.permission;
  } else {
    return (userPermisos & props.permission) > 0;
  }
});
</script>

<style scoped>
.permission-gate {
  display: contents;
}

.permission-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
  border-radius: 0.25rem;
  background-color: rgba(108, 117, 125, 0.05);
}

.permission-denied i {
  font-size: 1rem;
}
</style> 