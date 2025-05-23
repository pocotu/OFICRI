import axios from 'axios'

export function fetchForenseDigital(token) {
  return axios.get('/api/forensedigital', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// TODO: Add other Forense Digital related API functions (create, update, delete, etc.) 