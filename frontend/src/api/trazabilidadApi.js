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
    tipo: evento.tipo || 'log',
    titulo: evento.titulo || 'Evento sin título',
    detalle: evento.detalle || '',
    fecha: new Date(evento.fecha).toLocaleString(),
    area: evento.area || null,
    usuario: evento.usuario || null
  }
} 