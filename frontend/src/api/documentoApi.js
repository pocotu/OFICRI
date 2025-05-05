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