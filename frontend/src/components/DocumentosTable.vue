<template>
  <table class="table">
    <thead>
      <tr>
        <th>Nro Registro</th>
        <th>Fecha Ingreso<br/>doc entrada</th>
        <th>Tipo Doc Entrada<br/>Clase</th>
        <th>Tipo Doc Entrada<br/>Nro</th>
        <th>Fecha doc entrada</th>
        <th>Procedencia</th>
        <th>Área Derivado</th>
        <th>Contenido</th>
        <th>Tipo Doc Salida</th>
        <th>Fecha doc salida</th>
        <th>Observaciones</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="doc in documentos" :key="doc.IDDocumento">
        <td>{{ doc.NroRegistro }}</td>
        <td>{{ fechaDesglosada(doc.FechaDocumento) }}</td>
        <td>{{ doc.OrigenDocumento }}</td>
        <td>{{ doc.NumeroOficioDocumento }}</td>
        <td>{{ fechaDesglosada(doc.FechaDocumento) }}</td>
        <td>{{ doc.Procedencia }}</td>
        <td>{{ doc.IDAreaActual }}</td>
        <td>{{ doc.Contenido }}</td>
        <td>{{ doc.TipoDocumentoSalida }}</td>
        <td>{{ fechaDesglosada(doc.FechaDocumentoSalida) }}</td>
        <td>{{ doc.Observaciones }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
const props = defineProps({
  documentos: {
    type: Array,
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