<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Detalles del Documento #{{ documento.NroRegistro }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Fecha Ingreso:</span>
            <span class="value">{{ fechaDesglosada(documento.FechaDocumento) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Tipo Documento:</span>
            <span class="value">{{ documento.OrigenDocumento }}</span>
          </div>
          <div class="info-item">
            <span class="label">Número Oficio:</span>
            <span class="value">{{ documento.NumeroOficioDocumento }}</span>
          </div>
          <div class="info-item">
            <span class="label">Fecha Documento:</span>
            <span class="value">{{ fechaDesglosada(documento.FechaDocumento) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Procedencia:</span>
            <span class="value">{{ documento.Procedencia }}</span>
          </div>
          <div class="info-item">
            <span class="label">Área Derivado:</span>
            <span class="value">{{ documento.IDAreaActual }}</span>
          </div>
          <div class="info-item full-width">
            <span class="label">Contenido:</span>
            <span class="value">{{ documento.Contenido }}</span>
          </div>
          <div class="info-item">
            <span class="label">Tipo Doc Salida:</span>
            <span class="value">{{ documento.TipoDocumentoSalida }}</span>
          </div>
          <div class="info-item">
            <span class="label">Fecha Doc Salida:</span>
            <span class="value">{{ fechaDesglosada(documento.FechaDocumentoSalida) }}</span>
          </div>
          <div class="info-item full-width">
            <span class="label">Observaciones:</span>
            <span class="value">{{ documento.Observaciones }}</span>
          </div>
          <div class="info-item">
            <span class="label">Estado:</span>
            <span class="value">{{ documento.EstadoNombre || 'Desconocido' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  documento: {
    type: Object,
    required: true
  }
})

function fechaDesglosada(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e1e1e1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #14532d;
  font-size: 1.4rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #14532d;
}

.modal-body {
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.value {
  color: #263238;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style> 