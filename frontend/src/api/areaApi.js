import axios from 'axios';
 
export function fetchAreasActivas(token) {
  return axios.get('/api/areas/activas', {
    headers: { Authorization: `Bearer ${token}` }
  });
} 