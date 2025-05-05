<template>
  <div class="widget-card">
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
  }
})
</script>

<style scoped>
.widget-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  padding: 2rem 1rem;
  text-align: center;
  min-width: 220px;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0.5rem;
}
.widget-value {
  font-size: 2.2rem;
  font-weight: bold;
  color: #0f492e;
}
.widget-label {
  font-size: 1.1rem;
  color: #263238;
  margin-top: 0.5rem;
  letter-spacing: 1px;
}
</style> 