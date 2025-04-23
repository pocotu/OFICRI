<template>
  <div class="notificaciones-mesa-partes">
    <div class="header">
      <h2>Notificaciones</h2>
      <div class="actions">
        <button 
          class="btn-marcar-todas" 
          @click="marcarTodasComoLeidas"
          :disabled="isLoading || !notificaciones.length"
        >
          Marcar todas como leídas
        </button>
        <button 
          class="btn-configurar" 
          @click="mostrarConfiguracion = true"
        >
          Configurar
        </button>
      </div>
    </div>
    
    <!-- Lista de Notificaciones -->
    <div class="notificaciones-list" v-if="notificaciones.length">
      <div 
        v-for="notificacion in notificaciones" 
        :key="notificacion.id"
        class="notificacion"
        :class="{ 'no-leida': !notificacion.leida }"
      >
        <div class="notificacion-header">
          <span class="tipo" :class="notificacion.tipo">
            {{ notificacion.tipo }}
          </span>
          <span class="fecha">
            {{ formatFecha(notificacion.fecha) }}
          </span>
        </div>
        
        <div class="notificacion-content">
          <p class="mensaje">{{ notificacion.mensaje }}</p>
          
          <div class="documento-info" v-if="notificacion.documento">
            <span class="numero">Documento: {{ notificacion.documento.numero }}</span>
            <span class="area">Área: {{ notificacion.documento.area }}</span>
          </div>
        </div>
        
        <div class="notificacion-actions">
          <button 
            v-if="!notificacion.leida"
            class="btn-marcar-leida"
            @click="marcarComoLeida(notificacion.id)"
          >
            Marcar como leída
          </button>
          <button 
            class="btn-eliminar"
            @click="eliminarNotificacion(notificacion.id)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="no-notificaciones">
      No hay notificaciones
    </div>
    
    <!-- Modal de Configuración -->
    <div class="modal" v-if="mostrarConfiguracion">
      <div class="modal-content">
        <h3>Configuración de Notificaciones</h3>
        
        <div class="config-section">
          <h4>Tipos de Notificaciones</h4>
          <div class="checkbox-group">
            <label v-for="tipo in tiposNotificaciones" :key="tipo.value">
              <input 
                type="checkbox" 
                v-model="configuracion.tipos"
                :value="tipo.value"
              >
              {{ tipo.label }}
            </label>
          </div>
        </div>
        
        <div class="config-section">
          <h4>Frecuencia de Notificaciones</h4>
          <select v-model="configuracion.frecuencia">
            <option value="INMEDIATA">Inmediata</option>
            <option value="DIARIA">Diaria</option>
            <option value="SEMANAL">Semanal</option>
          </select>
        </div>
        
        <div class="config-section">
          <h4>Notificaciones por Correo</h4>
          <label>
            <input 
              type="checkbox" 
              v-model="configuracion.notificarPorCorreo"
            >
            Recibir notificaciones por correo
          </label>
        </div>
        
        <div class="modal-actions">
          <button 
            class="btn-cancelar"
            @click="mostrarConfiguracion = false"
          >
            Cancelar
          </button>
          <button 
            class="btn-guardar"
            @click="guardarConfiguracion"
            :disabled="isLoading"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import notificacionesService from '../../shared/src/services/mesa-partes/notificacionesService';

// Estado
const notificaciones = ref([]);
const isLoading = ref(false);
const mostrarConfiguracion = ref(false);
const configuracion = ref({
  tipos: [],
  frecuencia: 'INMEDIATA',
  notificarPorCorreo: false
});

const tiposNotificaciones = [
  { value: 'DOCUMENTO_RECIBIDO', label: 'Documento Recibido' },
  { value: 'DOCUMENTO_DERIVADO', label: 'Documento Derivado' },
  { value: 'DOCUMENTO_PENDIENTE', label: 'Documento Pendiente' },
  { value: 'DOCUMENTO_VENCIDO', label: 'Documento por Vencer' },
  { value: 'ALERTA_SISTEMA', label: 'Alertas del Sistema' }
];

// Métodos
const cargarNotificaciones = async () => {
  isLoading.value = true;
  try {
    const response = await notificacionesService.getNotificaciones();
    notificaciones.value = response.data;
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  } finally {
    isLoading.value = false;
  }
};

const marcarComoLeida = async (id) => {
  try {
    await notificacionesService.marcarComoLeida(id);
    await cargarNotificaciones();
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
  }
};

const marcarTodasComoLeidas = async () => {
  try {
    await notificacionesService.marcarTodasComoLeidas();
    await cargarNotificaciones();
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
  }
};

const eliminarNotificacion = async (id) => {
  if (!confirm('¿Está seguro de eliminar esta notificación?')) return;
  
  try {
    await notificacionesService.eliminarNotificacion(id);
    await cargarNotificaciones();
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
  }
};

const cargarConfiguracion = async () => {
  try {
    const response = await notificacionesService.getConfiguracionNotificaciones();
    configuracion.value = response.data;
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
};

const guardarConfiguracion = async () => {
  isLoading.value = true;
  try {
    await notificacionesService.actualizarConfiguracionNotificaciones(configuracion.value);
    mostrarConfiguracion.value = false;
  } catch (error) {
    console.error('Error al guardar configuración:', error);
  } finally {
    isLoading.value = false;
  }
};

const formatFecha = (fecha) => {
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Suscripción a notificaciones en tiempo real
let unsubscribe = null;

onMounted(async () => {
  await Promise.all([
    cargarNotificaciones(),
    cargarConfiguracion()
  ]);
  
  // Suscribirse a notificaciones en tiempo real
  unsubscribe = notificacionesService.suscribirANotificaciones((notificacion) => {
    notificaciones.value.unshift(notificacion);
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.notificaciones-mesa-partes {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-marcar-todas,
.btn-configurar {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-marcar-todas {
  background-color: #2196F3;
  color: white;
}

.btn-marcar-todas:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-configurar {
  background-color: #4CAF50;
  color: white;
}

.notificaciones-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notificacion {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notificacion.no-leida {
  border-left: 4px solid #2196F3;
}

.notificacion-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tipo {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.tipo.DOCUMENTO_RECIBIDO {
  background-color: #E3F2FD;
  color: #1976D2;
}

.tipo.DOCUMENTO_DERIVADO {
  background-color: #E8F5E9;
  color: #388E3C;
}

.tipo.DOCUMENTO_PENDIENTE {
  background-color: #FFF3E0;
  color: #F57C00;
}

.tipo.DOCUMENTO_VENCIDO {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.tipo.ALERTA_SISTEMA {
  background-color: #F3E5F5;
  color: #7B1FA2;
}

.fecha {
  color: #666;
  font-size: 0.9rem;
}

.notificacion-content {
  margin-bottom: 10px;
}

.mensaje {
  margin: 0;
  color: #333;
}

.documento-info {
  margin-top: 10px;
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #666;
}

.notificacion-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-marcar-leida,
.btn-eliminar {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-marcar-leida {
  background-color: #E3F2FD;
  color: #1976D2;
}

.btn-eliminar {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.no-notificaciones {
  text-align: center;
  padding: 40px;
  color: #666;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.config-section {
  margin-bottom: 20px;
}

.config-section h4 {
  margin: 0 0 10px;
  color: #333;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancelar,
.btn-guardar {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancelar {
  background-color: #f5f5f5;
  color: #333;
}

.btn-guardar {
  background-color: #4CAF50;
  color: white;
}

.btn-guardar:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 