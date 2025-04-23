<template>
  <div class="unauthorized-container">
    <div class="unauthorized-content">
      <h1>403</h1>
      <h2>Acceso Denegado</h2>
      <p>No tiene permisos para acceder a esta sección.</p>
      <router-link to="/" class="home-button">Volver al inicio</router-link>
    </div>
  </div>
</template>

<style scoped>
.unauthorized-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  text-align: center;
}

.unauthorized-content {
  max-width: 500px;
  padding: 40px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 6rem;
  color: #f39c12;
  margin: 0;
  line-height: 1.2;
}

h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 2rem;
}

.home-button {
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
}

.home-button:hover {
  background-color: #45a049;
}
</style> 