<template>
  <router-view v-if="hasAccess"></router-view>
  <div v-else class="access-denied">
    <h2>Acceso Denegado</h2>
    <p>No tiene los permisos necesarios para acceder a esta página.</p>
    <router-link to="/" class="btn btn-primary">Volver al inicio</router-link>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// Importar los servicios federados
import { permissionService } from 'shared/services/permissions/permissionService';
import { authService } from 'shared/services/auth/authService';

export default {
  name: 'ProtectedRoute',
  props: {
    // Permiso único o array de permisos requeridos
    permission: {
      type: [String, Array, Number],
      required: true
    },
    // Tipo de verificación: 'single', 'all', 'any'
    type: {
      type: String,
      default: 'single',
      validator: (value) => ['single', 'all', 'any'].includes(value)
    },
    // Ruta a la que redirigir si no hay acceso
    redirectTo: {
      type: String,
      default: '/'
    }
  },
  setup(props) {
    const router = useRouter();
    const hasAccess = ref(false);

    const checkAccess = async () => {
      try {
        // Obtener los permisos del usuario desde el token
        const user = authService.getStoredUser();
        if (!user || !user.permissions) {
          hasAccess.value = false;
          router.push(props.redirectTo);
          return;
        }
        
        const userPermissions = user.permissions;
        
        // Verificar permisos según el tipo de verificación
        switch (props.type) {
          case 'single':
            hasAccess.value = permissionService.hasPermission(userPermissions, props.permission);
            break;
          case 'all':
            hasAccess.value = permissionService.hasAllPermissions(userPermissions, props.permission);
            break;
          case 'any':
            hasAccess.value = permissionService.hasAnyPermission(userPermissions, props.permission);
            break;
        }

        // Redirigir si no hay acceso
        if (!hasAccess.value) {
          router.push(props.redirectTo);
        }
      } catch (error) {
        console.error('Error al verificar acceso:', error);
        hasAccess.value = false;
        router.push(props.redirectTo);
      }
    };

    onMounted(checkAccess);

    return {
      hasAccess
    };
  }
};
</script>

<style scoped>
.access-denied {
  text-align: center;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 600px;
}

.access-denied h2 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.access-denied p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #0056b3;
}
</style> 