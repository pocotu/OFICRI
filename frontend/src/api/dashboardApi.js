import axios from 'axios';

export function fetchDashboardMetrics(token) {
  return axios.get('/api/dashboard/metrics', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function fetchActividadReciente(token) {
  return axios.get('/api/dashboard/actividad-reciente', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function fetchDocumentosPendientes(token) {
  return axios.get('/api/dashboard/documentos-pendientes', {
    headers: { Authorization: `Bearer ${token}` }
  });
} 