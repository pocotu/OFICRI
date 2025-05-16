<template>
  <div :class="['widget-card', color]">
    <i v-if="icon" :class="['fa', icon]"></i>
    <div class="widget-value">{{ value }}</div>
    <div class="widget-label">{{ label }}</div>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: [String, Number],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
.widget-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(44,62,80,0.08);
  padding: 1.5rem 1rem;
  text-align: center;
  flex: 1 1 180px;
  margin: 0 0.5rem;
  min-width: 160px;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.widget-card i {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}
.widget-value {
  font-size: 2.1rem;
  font-weight: 700;
  color: #14532d;
}
.widget-label {
  font-size: 1.1rem;
  color: #4b5563;
  margin-top: 0.2rem;
}
.widget-card.primary { border-top: 4px solid #14532d; }
.widget-card.warning { border-top: 4px solid #ffc107; }
.widget-card.success { border-top: 4px solid #28a745; }
.widget-card.info { border-top: 4px solid #17a2b8; }
</style> 