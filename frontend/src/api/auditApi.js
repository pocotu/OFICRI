import axios from 'axios';

export function fetchUsuarioLogs({ token, usuarioId, tipoEvento, fechaInicio, fechaFin, page = 1, pageSize = 20 }) {
  const params = {};
  if (usuarioId) params.usuarioId = usuarioId;
  if (tipoEvento) params.tipoEvento = tipoEvento;
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;
  params.page = page;
  params.pageSize = pageSize;
  return axios.get('/api/auditoria/usuario-log', {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
} 