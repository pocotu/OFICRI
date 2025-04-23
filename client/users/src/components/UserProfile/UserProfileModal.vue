<template>
  <OfiModal
    :show="show"
    title="Perfil de Usuario"
    @close="handleClose"
  >
    <template #default>
      <UserProfile
        v-if="userId"
        :userId="userId"
      />
    </template>
  </OfiModal>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import UserProfile from './UserProfile.vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  userId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['close']);

const handleClose = () => {
  emit('close');
};
</script> 