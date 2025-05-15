import axios from 'axios'

export function fetchUsers(token) {
  return axios.get('/api/usuarios', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function createUser(data, token) {
  const payload = {
    CodigoCIP: data.cip,
    Nombres: data.nombres,
    Apellidos: data.apellidos,
    Grado: data.grado,
    Password: data.password,
    IDArea: data.idArea,
    IDRol: data.idRol
  };
  return axios.post('/api/usuarios', payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function updateUser(id, data, token) {
  return axios.put(`/api/usuarios/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function deleteUser(id, token) {
  return axios.delete(`/api/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function resetPassword(id, token, newPassword) {
  return axios.post(`/api/usuarios/${id}/reset-password`, { newPassword }, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function fetchActiveAreas(token) {
  return axios.get('/api/areas/activas', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function fetchRoles(token) {
  return axios.get('/api/roles', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function fetchPermisos(token) {
  return axios.get('/api/roles/permisos/all', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export function fetchAreas(token) {
  return axios.get('/api/areas', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createArea(data, token) {
  return axios.post('/api/areas', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function updateArea(id, data, token) {
  return axios.put(`/api/areas/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function deleteArea(id, token) {
  return axios.delete(`/api/areas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
} 