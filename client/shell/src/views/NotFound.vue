<template>
  <div class="not-found">
    <div class="container">
      <h1>404</h1>
      <h2>Página No Encontrada</h2>
      <p>Lo sentimos, la página que está buscando no existe o ha sido movida.</p>
      <router-link to="/" class="btn btn-primary">Volver al Inicio</router-link>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';

export default {
  name: 'NotFound',
  setup() {
    onMounted(() => {
      document.title = 'Página No Encontrada | OFICRI';
    });
  }
};
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-color: #f8f9fa;
}

.container {
  max-width: 600px;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 5rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

h2 {
  font-size: 2rem;
  color: #343a40;
  margin-bottom: 1.5rem;
}

p {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  font-size: 1rem;
}

.btn-primary:hover {
  background-color: #0056b3;
}
</style> 