import axios from 'axios';

export function fetchDocumentos(token) {
  return axios.get('/api/documentos', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createDocumento(data, token) {
  return axios.post('/api/documentos', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function updateDocumento(id, data, token) {
  return axios.put(`/api/documentos/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function eliminarDocumento(id, token) {
  return axios.delete(`/api/documentos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function fetchDocumentosPapelera(token) {
  return axios.get('/api/documentos/papelera/listar', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function restaurarDocumento(id, token) {
  return axios.post(`/api/documentos/papelera/restaurar/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function eliminarDocumentoPermanente(id, token) {
  return axios.delete(`/api/documentos/papelera/eliminar/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
} 