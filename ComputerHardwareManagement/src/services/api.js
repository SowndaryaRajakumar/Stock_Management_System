import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for injecting JWT Bearer token and dynamic system routing
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stock_auth_token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Dynamic system-based API routing:
    // Auth endpoints (/auth/...) route to central auth (/api)
    // Inventory endpoints route to /api/electrical (5050) or /api/hardware (5051)
    const requestPath = config.url || '';
    if (!requestPath.startsWith('/auth')) {
      let activeSystem = (typeof config.headers?.get === 'function' ? config.headers.get('X-Active-System') : null) ||
        config.headers?.['X-Active-System'] ||
        config.headers?.['x-active-system'] ||
        null;
      if (!activeSystem && typeof window !== 'undefined' && window.location?.pathname) {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/electrical')) {
          activeSystem = 'electrical';
        } else if (path.includes('/hardware')) {
          activeSystem = 'hardware';
        }
      }
      if (!activeSystem && typeof localStorage !== 'undefined') {
        activeSystem = localStorage.getItem('stock_active_system');
      }

      if (String(activeSystem).toLowerCase() === 'electrical') {
        config.baseURL = '/api/electrical';
      } else {
        config.baseURL = '/api/hardware';
      }
    } else {
      config.baseURL = '/api';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('stock_auth_user');
      localStorage.removeItem('stock_auth_token');
      localStorage.removeItem('stock_active_system');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('auth_expired_notice', 'Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/auth/users');
    return res.data;
  }
};

export const facultyApi = {
  getFaculty: async (params = {}) => {
    const res = await api.get('/faculty', { params });
    return res.data;
  },
  getFacultyById: async (id) => {
    const res = await api.get(`/faculty/${id}`);
    return res.data;
  },
  createFaculty: async (data) => {
    const res = await api.post('/faculty', data);
    return res.data;
  },
  updateFaculty: async (id, data) => {
    const res = await api.put(`/faculty/${id}`, data);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/faculty/${id}/status`, { status });
    return res.data;
  },
  deleteFaculty: async (id) => {
    const res = await api.delete(`/faculty/${id}`);
    return res.data;
  }
};

export const masterDataApi = {
  getDepartments: async (params = {}) => {
    const res = await api.get('/departments', { params });
    return res.data;
  },
  getDepartmentById: async (id) => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },
  createDepartment: async (data) => {
    const res = await api.post('/departments', data);
    return res.data;
  },
  updateDepartment: async (id, data) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },
  updateDepartmentStatus: async (id, active) => {
    const res = await api.patch(`/departments/${id}/status`, { active });
    return res.data;
  },
  deactivateDepartment: async (id) => {
    const res = await api.patch(`/departments/${id}/status`, { active: false });
    return res.data;
  },
  deleteDepartment: async (id, params = {}) => {
    const res = await api.delete(`/departments/${id}`, { params });
    return res.data;
  },
  getCategories: async (params = {}) => {
    const res = await api.get('/categories', { params });
    return res.data;
  },
  getCategoryById: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },
  updateCategoryStatus: async (id, active) => {
    const res = await api.patch(`/categories/${id}/status`, { active });
    return res.data;
  },
  deactivateCategory: async (id) => {
    const res = await api.patch(`/categories/${id}/status`, { active: false });
    return res.data;
  },
  deleteCategory: async (id, params = {}) => {
    const res = await api.delete(`/categories/${id}`, { params });
    return res.data;
  },
  getUnits: async (params = {}) => {
    const res = await api.get('/units', { params });
    return res.data;
  },
  getUnitById: async (id) => {
    const res = await api.get(`/units/${id}`);
    return res.data;
  },
  createUnit: async (data) => {
    const res = await api.post('/units', data);
    return res.data;
  },
  updateUnit: async (id, data) => {
    const res = await api.put(`/units/${id}`, data);
    return res.data;
  },
  updateUnitStatus: async (id, active) => {
    const res = await api.patch(`/units/${id}/status`, { active });
    return res.data;
  },
  deactivateUnit: async (id) => {
    const res = await api.patch(`/units/${id}/status`, { active: false });
    return res.data;
  },
  deleteUnit: async (id, params = {}) => {
    const res = await api.delete(`/units/${id}`, { params });
    return res.data;
  },
  getStockDocuments: async (params = {}) => {
    const res = await api.get('/stock-documents', { params });
    return res.data;
  },
  createStockDocument: async (data) => {
    const res = await api.post('/stock-documents', data);
    return res.data;
  },
  updateStockDocument: async (id, data) => {
    const res = await api.put(`/stock-documents/${id}`, data);
    return res.data;
  },
  deleteStockDocument: async (id, params = {}) => {
    const res = await api.delete(`/stock-documents/${id}`, { params });
    return res.data;
  },
  updateStockDocumentStatus: async (id, active) => {
    const res = await api.patch(`/stock-documents/${id}/status`, { active });
    return res.data;
  },
  deactivateStockDocument: async (id) => {
    const res = await api.patch(`/stock-documents/${id}/status`, { active: false });
    return res.data;
  }
};

export const productApi = {
  getProducts: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  getProductDetails: async (id) => {
    const res = await api.get(`/products/${id}/details`);
    return res.data;
  },
  createProduct: async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
  },
  updateProduct: async (id, productData) => {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
  getReferences: async (id) => {
    const res = await api.get(`/products/${id}/references`);
    return res.data;
  },
  createReference: async (id, refData) => {
    const res = await api.post(`/products/${id}/references`, refData);
    return res.data;
  },
  updateReference: async (id, refId, refData) => {
    const res = await api.put(`/products/${id}/references/${refId}`, refData);
    return res.data;
  },
  deleteReference: async (id, refId) => {
    const res = await api.delete(`/products/${id}/references/${refId}`);
    return res.data;
  },
  getRemarks: async (id) => {
    const res = await api.get(`/products/${id}/remarks`);
    return res.data;
  },
  addRemark: async (id, remarkData) => {
    const res = await api.post(`/products/${id}/remarks`, remarkData);
    return res.data;
  }
};

export const stockApi = {
  incoming: async (stockData) => {
    const res = await api.post('/stock/incoming', stockData);
    return res.data;
  },
  outgoing: async (stockData) => {
    const res = await api.post('/stock/outgoing', stockData);
    return res.data;
  },
  getHistory: async (params = {}) => {
    const res = await api.get('/stock/history', { params });
    return res.data;
  },
  getLowStock: async () => {
    const res = await api.get('/stock/low-stock');
    return res.data;
  }
};

export const purchaseApi = {
  getPurchases: async (params = {}) => {
    const res = await api.get('/purchases', { params });
    return res.data;
  },
  recordPurchase: async (purchaseData) => {
    const res = await api.post('/purchases', purchaseData);
    return res.data;
  }
};

export const transferApi = {
  getTransfers: async (params = {}) => {
    const res = await api.get('/transfers', { params });
    return res.data;
  },
  issueTransfer: async (transferData) => {
    const res = await api.post('/transfers', transferData);
    return res.data;
  }
};

export const indentApi = {
  getIndents: async (params = {}) => {
    const res = await api.get('/indents', { params });
    return res.data;
  },
  getIndentById: async (id) => {
    const res = await api.get(`/indents/${id}`);
    return res.data;
  },
  createIndent: async (indentData) => {
    const res = await api.post('/indents', indentData);
    return res.data;
  },
  updateIndent: async (id, indentData) => {
    const res = await api.put(`/indents/${id}`, indentData);
    return res.data;
  },
  deleteIndent: async (id) => {
    const res = await api.delete(`/indents/${id}`);
    return res.data;
  },
  submitIndent: async (id) => {
    const res = await api.post(`/indents/${id}/submit`);
    return res.data;
  },
  recommendIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/recommend`, data);
    return res.data;
  },
  approveIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/approve`, data);
    return res.data;
  },
  rejectIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/reject`, data);
    return res.data;
  },
  issueIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/issue`, data);
    return res.data;
  },
  reviewIndent: async (id, reviewData) => {
    const res = await api.post(`/indents/${id}/review`, reviewData);
    return res.data;
  },
  completeIndent: async (id) => {
    const res = await api.post(`/indents/${id}/complete`);
    return res.data;
  }
};

export const historyApi = {
  getStockHistory: async (params = {}) => {
    const res = await api.get('/history', { params });
    return res.data;
  }
};

export const notificationApi = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  }
};

export const analyticsApi = {
  getDashboardStats: async (system = null) => {
    const headers = system ? { 'X-Active-System': system } : {};
    const res = await api.get('/dashboard', { headers });
    return res.data;
  },
  getAnalyticsOverview: async (params = {}) => {
    const res = await api.get('/analytics/overview', { params });
    return res.data;
  }
};

export const reportApi = {
  getReportData: async (params = {}) => {
    const res = await api.get('/reports', { params });
    return res.data;
  }
};

export default api;
