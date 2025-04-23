<template>
  <OfiModal
    :show="show"
    :title="isEditing ? 'Editar Usuario' : 'Crear Usuario'"
    @close="handleClose"
  >
    <UserForm
      :user="user"
      @submit="handleSubmit"
      @cancel="handleClose"
    />
  </OfiModal>
</template>

<script setup>
import { computed } from 'vue';
import UserForm from './UserForm.vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  user: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:show', 'submit']);

const isEditing = computed(() => !!props.user);

const handleClose = () => {
  emit('update:show', false);
};

const handleSubmit = () => {
  emit('submit');
  handleClose();
};
</script> 