import axios from 'axios'

export function fetchDosajes(token) {
  return axios.get('/api/dosaje', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function createDosaje(data, token) {
  return axios.post('/api/dosaje', data, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function updateDosaje(id, data, token) {
  return axios.put(`/api/dosaje/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function deleteDosaje(id, token) {
  return axios.delete(`/api/dosaje/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function fetchDosajesPendientes(token, idArea) {
  return axios.get(`/api/dosaje/pendientes?area=${idArea}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function fetchOperadores(token, idArea) {
  return axios.get(`/api/usuarios/operadores?area=${idArea}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function procesarDosaje(token, idDosaje, data) {
  return axios.post(`/api/dosaje/${idDosaje}/procesar`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
} 