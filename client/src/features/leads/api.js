import { request } from '../../shared/api.js';

export const createLead = (body) =>
  request('/api/leads', { method: 'POST', body: JSON.stringify(body) });
export const listLeads = () => request('/api/leads');
export const updateLead = (id, body) =>
  request(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteLead = (id) => request(`/api/leads/${id}`, { method: 'DELETE' });
export const getOutreach = (id, channel, style, cta) =>
  request(`/api/leads/${id}/outreach`, { method: 'POST', body: JSON.stringify({ channel, style, cta }) });
