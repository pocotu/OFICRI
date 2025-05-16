import axios from 'axios'

const API_URL = '/api'

export const fetchTrazabilidad = async (documentoId, token) => {
  try {
    const response = await axios.get(`${API_URL}/documentos/${documentoId}/trazabilidad`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener la trazabilidad del documento')
  }
}

export const formatTrazabilidadEvento = (evento) => {
  return {
    accion: evento.Accion || evento.accion || 'Evento',
    observacion: evento.Observacion || evento.observacion || '',
    fecha: evento.Fecha || evento.fecha || '',
    areaOrigen: evento.AreaOrigen || evento.areaOrigen || null,
    areaDestino: evento.AreaDestino || evento.areaDestino || null,
    usuario: evento.Usuario || evento.usuario || null
  }
} 