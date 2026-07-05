import { request } from '../../shared/api.js';

export const registerRequest = (body) =>
  request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const loginRequest = (body) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });

export const logoutRequest = () => request('/api/auth/logout', { method: 'POST' });

export const meRequest = () => request('/api/auth/me');
