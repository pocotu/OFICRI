<template>
  <div class="user-form">
    <OfiForm @submit="handleSubmit" :loading="loading">
      <template #header>
        <h2>{{ isEditing ? 'Editar Usuario' : 'Crear Usuario' }}</h2>
      </template>

      <template #default>
        <OfiInput
          v-model="formData.codigoCIP"
          label="Código CIP"
          :rules="[required, validateCIP]"
          :disabled="isEditing"
        />

        <OfiInput
          v-model="formData.nombres"
          label="Nombres"
          :rules="[required]"
        />

        <OfiInput
          v-model="formData.apellidos"
          label="Apellidos"
          :rules="[required]"
        />

        <OfiInput
          v-model="formData.grado"
          label="Grado"
          :rules="[required]"
        />

        <OfiSelect
          v-model="formData.idArea"
          label="Área"
          :options="areas"
          option-label="nombreArea"
          option-value="idArea"
          :rules="[required]"
        />

        <OfiSelect
          v-model="formData.idRol"
          label="Rol"
          :options="roles"
          option-label="nombreRol"
          option-value="idRol"
          :rules="[required]"
        />

        <template v-if="!isEditing">
          <OfiInput
            v-model="formData.password"
            label="Contraseña"
            type="password"
            :rules="[required, validatePassword]"
          />

          <OfiInput
            v-model="formData.confirmPassword"
            label="Confirmar Contraseña"
            type="password"
            :rules="[required, validateConfirmPassword]"
          />
        </template>
      </template>

      <template #footer>
        <OfiButton type="button" variant="secondary" @click="$emit('cancel')">
          Cancelar
        </OfiButton>
        <OfiButton type="submit" :loading="loading">
          {{ isEditing ? 'Guardar Cambios' : 'Crear Usuario' }}
        </OfiButton>
      </template>
    </OfiForm>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../../store/userStore';
import { useAreaStore } from '@areas/store/areaStore';
import { useRoleStore } from '@roles/store/roleStore';
import { usePermissionStore } from '@permissions/store/permissionStore';
import { useNotification } from '@shared/composables/useNotification';
import { useCIPValidator } from '@shared/composables/useCIPValidator';
import { usePasswordValidator } from '@shared/composables/usePasswordValidator';

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

const userStore = useUserStore();
const areaStore = useAreaStore();
const roleStore = useRoleStore();
const permissionStore = usePermissionStore();
const notification = useNotification();
const { validateCIP } = useCIPValidator();
const { validatePassword } = usePasswordValidator();

const loading = ref(false);
const areas = ref([]);
const roles = ref([]);

const isEditing = computed(() => !!props.user);

const formData = ref({
  codigoCIP: '',
  nombres: '',
  apellidos: '',
  grado: '',
  idArea: null,
  idRol: null,
  password: '',
  confirmPassword: ''
});

const required = (value) => !!value || 'Este campo es requerido';

const validateConfirmPassword = (value) => {
  return value === formData.value.password || 'Las contraseñas no coinciden';
};

const loadAreas = async () => {
  try {
    await areaStore.fetchAreas();
    areas.value = areaStore.areas;
  } catch (error) {
    notification.error('Error al cargar áreas');
  }
};

const loadRoles = async () => {
  try {
    await roleStore.fetchRoles();
    roles.value = roleStore.roles;
  } catch (error) {
    notification.error('Error al cargar roles');
  }
};

const handleSubmit = async () => {
  try {
    loading.value = true;
    
    if (isEditing.value) {
      await userStore.updateUser(props.user.idUsuario, formData.value);
      notification.success('Usuario actualizado correctamente');
    } else {
      await userStore.createUser(formData.value);
      notification.success('Usuario creado correctamente');
    }
    
    emit('submit');
  } catch (error) {
    notification.error(error.message || 'Error al guardar usuario');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadAreas(), loadRoles()]);
  
  if (isEditing.value) {
    formData.value = {
      ...props.user,
      password: '',
      confirmPassword: ''
    };
  }
});
</script>

<style scoped>
.user-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.user-form h2 {
  margin-bottom: 20px;
  color: var(--primary-color);
}
</style> 