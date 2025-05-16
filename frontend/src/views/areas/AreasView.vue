<template>
  <div class="areas-modern-card">
    <div class="areas-header-modern">
      <div class="header-left">
        <div class="icon-bg">
          <i class="fa-solid fa-building"></i>
        </div>
        <h1>Gestión de Áreas</h1>
      </div>
      <div class="areas-actions-modern">
        <button class="btn-nueva-area-modern" @click="nuevaArea">
          <i class="fa-solid fa-plus"></i> Nueva Área
        </button>
      </div>
    </div>
    <div class="areas-cards-wrapper">
      <transition-group name="fade-card" tag="div" class="areas-cards-list">
        <div v-for="area in areas" :key="area.IDArea" class="area-card">
          <div class="area-card-header">
            <span class="area-card-title">{{ area.NombreArea }}</span>
            <AreaStatusBadge :activa="area.IsActive" large />
          </div>
          <div class="area-card-body">
            <div class="area-card-row"><strong>Código:</strong> {{ area.CodigoIdentificacion }}</div>
            <div class="area-card-row"><strong>Tipo:</strong> {{ area.TipoArea }}</div>
            <div class="area-card-row"><strong>Descripción:</strong> {{ area.Descripcion }}</div>
          </div>
          <div class="area-card-actions">
            <TableActions
              @edit="editarArea(area)"
              @delete="eliminarArea(area)"
            />
          </div>
        </div>
        <div v-if="areas.length === 0" key="no-data" class="no-data-modern">No se encontraron áreas</div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchAreas } from '../../api/userApi'
import AreaStatusBadge from '../../components/AreaStatusBadge.vue'
import TableActions from '../../components/TableActions.vue'

const areas = ref([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetchAreas(token)
    areas.value = res.data
  } catch (e) {
    areas.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.areas-modern-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e8f5e9 100%);
  border-radius: 22px;
  box-shadow: 0 6px 32px rgba(44, 62, 80, 0.13);
  padding: 2.5rem 2.7rem 2.2rem 2.7rem;
  max-width: 1200px;
  width: 100%;
  min-height: 100%;
  margin: 0 auto;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}
.areas-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.2rem;
  flex-wrap: wrap;
  gap: 1.2rem;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}
.icon-bg {
  background: linear-gradient(135deg, #16c784 0%, #2dc76d 100%);
  color: #fff;
  border-radius: 50%;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 2px 12px rgba(44, 62, 80, 0.09);
}
.areas-header-modern h1 {
  font-size: 2.1rem;
  font-weight: 800;
  color: #184d2b;
  margin: 0;
}
.areas-actions-modern {
  display: flex;
  gap: 1.2rem;
  align-items: center;
}
.btn-nueva-area-modern {
  background: linear-gradient(90deg, #16c784 0%, #2dc76d 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.8rem 1.7rem;
  font-weight: 700;
  font-size: 1.08rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  box-shadow: 0 2px 12px rgba(22,199,132,0.10);
  transition: background 0.2s, transform 0.15s;
  cursor: pointer;
}
.btn-nueva-area-modern:hover {
  background: linear-gradient(90deg, #13a06b 0%, #16c784 100%);
  transform: scale(1.04);
}
.areas-cards-wrapper {
  flex: 1 1 auto;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.areas-cards-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  width: 100%;
  flex: 1 1 auto;
}
.area-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(44, 62, 80, 0.10);
  padding: 1.7rem 1.5rem 1.2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  transition: box-shadow 0.18s, transform 0.18s;
  position: relative;
  min-width: 0;
  animation: fadeInCard 0.5s;
  height: 100%;
}
.area-card:hover {
  box-shadow: 0 8px 32px rgba(44, 62, 80, 0.18);
  transform: translateY(-4px) scale(1.025);
}
.area-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
}
.area-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #184d2b;
}
.area-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 1.05rem;
  color: #263238;
}
.area-card-row strong {
  color: #16c784;
  font-weight: 600;
  margin-right: 0.4em;
}
.area-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7em;
}
.fade-card-enter-active, .fade-card-leave-active {
  transition: all 0.4s cubic-bezier(.4,0,.2,1);
}
.fade-card-enter-from, .fade-card-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
.no-data-modern {
  grid-column: 1/-1;
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 2rem 0;
  font-size: 1.1rem;
}
@media (max-width: 1200px) {
  .areas-modern-card {
    max-width: 98vw;
    padding: 2rem 1.2rem 1.2rem 1.2rem;
  }
  .areas-cards-list {
    gap: 1.2rem;
  }
}
@media (max-width: 900px) {
  .areas-modern-card {
    padding: 1.2rem 0.5rem 1rem 0.5rem;
  }
  .areas-header-modern h1 {
    font-size: 1.4rem;
  }
  .areas-cards-list {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
  .area-card {
    padding: 1.1rem 0.8rem 0.8rem 0.8rem;
  }
}
@media (max-width: 600px) {
  .areas-modern-card {
    padding: 0.5rem 0.1rem 0.5rem 0.1rem;
    border-radius: 0;
    box-shadow: none;
  }
  .areas-header-modern {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
  }
}
</style> 