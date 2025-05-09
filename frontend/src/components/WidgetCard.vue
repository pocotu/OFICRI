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
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(44, 62, 80, 0.07);
  padding: 1.5rem 1.2rem;
  text-align: center;
  min-width: 220px;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0.5rem;
  transition: box-shadow 0.2s, transform 0.2s;
}
.widget-card:hover {
  box-shadow: 0 6px 24px rgba(44, 62, 80, 0.13);
  transform: translateY(-2px) scale(1.02);
}
.widget-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #14532d;
  margin-bottom: 0.3rem;
}
.widget-label {
  font-size: 1.1rem;
  color: #263238;
  margin-top: 0.5rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 600;
}
</style> 