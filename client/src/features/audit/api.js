import { request } from '../../shared/api.js';

export const createAudit = (url, industry) =>
  request('/api/audits', { method: 'POST', body: JSON.stringify({ url, industry }) });
export const getFindingFix = (id, checkId) =>
  request(`/api/audits/${id}/fix`, { method: 'POST', body: JSON.stringify({ checkId }) });
export const getAudit = (id) => request(`/api/audits/${id}`);
export const listAudits = (search) => request(`/api/audits?search=${encodeURIComponent(search ?? '')}`);
export const deleteAudit = (id) => request(`/api/audits/${id}`, { method: 'DELETE' });
export const setFavorite = (id, favorite) =>
  request(`/api/audits/${id}/favorite`, { method: 'PATCH', body: JSON.stringify({ favorite }) });
