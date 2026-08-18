// REPLACE THIS with your actual cloud URL after deploying (e.g., https://event-connect-api.onrender.com)
const PRODUCTION_API_URL = 'https://event-connect-api-89id.onrender.com/api';

const isCapacitor =
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && !window.location.port) ||
  window.Capacitor;

const API_BASE = isCapacitor
  ? PRODUCTION_API_URL
  : '/api';

console.log('API_BASE detected as:', API_BASE);

const getHeaders = () => {
  const token = localStorage.getItem('eventconnect_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async get(url) {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: getHeaders(),
    });

    let data;
    try { data = await res.json(); } catch (e) { data = {}; }

    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  async post(url, body) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    let data;
    try { data = await res.json(); } catch (e) { data = {}; }

    if (!res.ok) {
      const err = new Error(data.error || data.message || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  async put(url, body) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    let data;
    try { data = await res.json(); } catch (e) { data = {}; }

    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  async delete(url) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    let data;
    try { data = await res.json(); } catch (e) { data = {}; }

    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
};
