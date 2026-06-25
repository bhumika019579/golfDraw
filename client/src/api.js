import axios from 'axios';

// Create standard axios instance config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor to inject stored JWT token to outgoing headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name, email, password, charityId, charityPercent, role) => {
    const res = await api.post('/auth/register', { name, email, password, charityId, charityPercent, role });
    return res.data;
  },
  updateProfile: async (charityId, charityPercent) => {
    const res = await api.put('/auth/profile', { charityId, charityPercent });
    return res.data;
  }
};

export const scoresAPI = {
  getScores: async () => {
    const res = await api.get('/scores');
    return res.data;
  },
  addScore: async (value, date) => {
    const res = await api.post('/scores', { value, date });
    return res.data;
  },
  updateScore: async (id, value, date) => {
    const res = await api.put(`/scores/${id}`, { value, date });
    return res.data;
  },
  deleteScore: async (id) => {
    const res = await api.delete(`/scores/${id}`);
    return res.data;
  }
};

export const charitiesAPI = {
  getCharities: async () => {
    const res = await api.get('/charities');
    return res.data;
  },
  addCharity: async (name, description, imageUrl) => {
    const res = await api.post('/charities', { name, description, imageUrl });
    return res.data;
  },
  updateCharity: async (id, name, description, imageUrl) => {
    const res = await api.put(`/charities/${id}`, { name, description, imageUrl });
    return res.data;
  },
  deleteCharity: async (id) => {
    const res = await api.delete(`/charities/${id}`);
    return res.data;
  }
};

export const subscriptionAPI = {
  createCheckout: async (plan) => {
    const res = await api.post('/subscribe/create-checkout', { plan });
    return res.data;
  },
  confirm: async (plan) => {
    const res = await api.post('/subscribe/confirm', { plan });
    return res.data;
  }
};

export const drawAPI = {
  getLatestDraw: async () => {
    const res = await api.get('/draw/latest');
    return res.data;
  },
  runDraw: async (month) => {
    const res = await api.post('/draw/run', { month });
    return res.data;
  },
  getWinnings: async () => {
    const res = await api.get('/draw/winnings');
    return res.data;
  }
};

export const adminAPI = {
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  toggleUserSubscription: async (id, isSubscribed, plan) => {
    const res = await api.put(`/admin/users/${id}/subscribe`, { isSubscribed, plan });
    return res.data;
  },
  getWinners: async () => {
    const res = await api.get('/admin/winners');
    return res.data;
  },
  verifyWinner: async (winnerId, status) => {
    const res = await api.put(`/admin/verify/${winnerId}`, { status });
    return res.data;
  },
  publishDraw: async (drawId) => {
    const res = await api.put(`/admin/draws/${drawId}/publish`);
    return res.data;
  },
  uploadWinnerProof: async (winnerId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post(`/admin/winners/${winnerId}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};

export default api;
