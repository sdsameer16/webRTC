export const API_BASE = 'http://localhost:5000/api';
export function setToken(token) { localStorage.setItem('token', token); }
export function getToken() { return localStorage.getItem('token'); }
export function setUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
export function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
export function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); }
