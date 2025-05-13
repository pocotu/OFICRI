import axios from 'axios';

export function login(cip, password) {
  return axios.post('/api/auth/login', { cip, password });
}
 
export function getMe(token) {
  return axios.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
} 

export function logout(token) {
  return axios.post('/api/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
} 