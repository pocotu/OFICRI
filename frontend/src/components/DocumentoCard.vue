<template>
  <div class="documento-card" @click="$emit('show-details', documento)">
    <div class="card-header">
      <span class="nro-registro">#{{ documento.NroRegistro }}</span>
      <span class="fecha">{{ fechaDesglosada(documento.FechaDocumento) }}</span>
    </div>
    <div class="card-content">
      <div class="info-row">
        <span class="label">Tipo:</span>
        <span class="value">{{ documento.OrigenDocumento }}</span>
      </div>
      <div class="info-row">
        <span class="label">Nro:</span>
        <span class="value">{{ documento.NumeroOficioDocumento }}</span>
      </div>
      <div class="info-row">
        <span class="label">Procedencia:</span>
        <span class="value">{{ documento.Procedencia }}</span>
      </div>
      <div class="info-row">
        <span class="label">Área:</span>
        <span class="value">{{ nombreArea(documento.IDAreaActual) }}</span>
      </div>
      <div class="info-row">
        <span class="label">Obs.:</span>
        <span class="value obs-value" :title="documento.Observaciones">
          {{ documento.Observaciones && documento.Observaciones.length > 60 ? documento.Observaciones.slice(0, 60) + '…' : documento.Observaciones }}
        </span>
      </div>
    </div>
    <div class="card-footer">
      <button class="ver-detalles">
        <i class="fa-solid fa-eye"></i> Ver detalles
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  documento: {
    type: Object,
    required: true
  },
  areas: {
    type: Array,
    required: false,
    default: () => []
  }
})

function fechaDesglosada(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d)) return fecha
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function nombreArea(id) {
  return props.areas.find(a => a.IDArea == id)?.NombreArea || id
}
</script>

<style scoped>
.documento-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.07);
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.documento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e1e1e1;
}

.nro-registro {
  font-weight: bold;
  color: #14532d;
  font-size: 1.1rem;
}

.fecha {
  color: #666;
  font-size: 0.9rem;
}

.info-row {
  display: flex;
  margin-bottom: 0.5rem;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
}

.value {
  color: #263238;
  flex: 1;
}

.card-footer {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e1e1e1;
  text-align: right;
}

.ver-detalles {
  background: #14532d;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.ver-detalles:hover {
  background: #0f492e;
}

.obs-value {
  color: #b06d00;
  font-style: italic;
  white-space: pre-line;
  word-break: break-word;
}
</style> 