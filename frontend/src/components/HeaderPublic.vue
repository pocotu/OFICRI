<template>
  <header class="header-public">
    <div class="header-left">
      <img :src="logoOficri" alt="Logo" class="logo" />
    </div>
    <div class="header-center">
      <span class="system-title">OFICRI</span>
    </div>
    <div class="header-right">
      <img :src="logoPolicia" alt="Policía Nacional del Perú" class="logo-pnp" />
    </div>
  </header>
</template>

<script setup>
import logoOficri from '../assets/img/logoOficri2x2.png'
import logoPolicia from '../assets/img/logoPolicia2x2.png'
</script>

<style scoped>
.header-public {
  width: 100%;
  background: #14532d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 2.5rem;
  min-height: 80px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.header-left, .header-right {
  display: flex;
  align-items: center;
  min-width: 140px;
  justify-content: center;
}
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.logo {
  width: 54px;
  height: 54px;
  object-fit: contain;
}
.logo-pnp {
  width: 120px;
  height: 48px;
  object-fit: contain;
}
.system-title {
  font-weight: bold;
  font-size: 1.35rem;
  letter-spacing: 1px;
  text-align: center;
}
@media (max-width: 600px) {
  .header-public {
    flex-direction: column;
    padding: 0.5rem 0.5rem;
    min-height: unset;
  }
  .header-center {
    margin: 0.5rem 0;
  }
  .logo {
    width: 38px;
    height: 38px;
  }
  .logo-pnp {
    width: 70px;
    height: 28px;
  }
}
</style> 