// Planning Studio - REST API Client
// Replaces Supabase direct calls with our Express backend

const api = {
  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),

  areas: {
    list: () => api.get('/areas'),
  },
  departments: {
    list: () => api.get('/departments'),
    create: (data) => api.post('/departments', data),
  },
  taskTypes: {
    list: () => api.get('/task-types'),
  },
  collaborators: {
    list: () => api.get('/collaborators'),
    create: (data) => api.post('/collaborators', data),
    update: (id, data) => api.put('/collaborators/' + id, data),
    delete: (id) => api.delete('/collaborators/' + id),
    addCapacity: (id, data) => api.post('/collaborators/' + id + '/capacities', data),
    removeCapacity: (id, taskTypeId) => api.delete('/collaborators/' + id + '/capacities/' + taskTypeId),
  },
  clients: {
    list: () => api.get('/clients'),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put('/clients/' + id, data),
    delete: (id) => api.delete('/clients/' + id),
  },
  jobs: {
    list: () => api.get('/jobs'),
    create: (data) => api.post('/jobs', data),
    update: (id, data) => api.put('/jobs/' + id, data),
    delete: (id) => api.delete('/jobs/' + id),
    phases: {
      list: (jobId) => api.get('/jobs/' + jobId + '/phases'),
      create: (jobId, data) => api.post('/jobs/' + jobId + '/phases', data),
      update: (jobId, id, data) => api.put('/jobs/' + jobId + '/phases/' + id, data),
      delete: (jobId, id) => api.delete('/jobs/' + jobId + '/phases/' + id),
    }
  }
};

console.log('✅ Planning Studio API Client loaded');
