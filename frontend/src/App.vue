<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  background-color: var(--background-color);
}
</style>
