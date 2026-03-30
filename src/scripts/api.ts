// API helpers

export const api = {
  async get(endpoint: string) {
    const res = await fetch(endpoint);
    return res.json();
  },
  
  async post(endpoint: string, data: any) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  async put(endpoint: string, data: any) {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  async delete(endpoint: string) {
    const res = await fetch(endpoint, { method: 'DELETE' });
    return res.json();
  }
};

// Auth
export async function authCheck() {
  return api.get('/api/auth/me');
}

export async function authLogin(email: string) {
  return api.post('/api/auth/login', { email });
}

export async function authLogout() {
  return api.post('/api/auth/logout', {});
}

// Projects
export async function getProjects(userId: string) {
  return api.get(`/api/projects?userId=${userId}`);
}

export async function getProject(projectId: string) {
  return api.get(`/api/projects/${projectId}`);
}

export async function healthCheck() {
  return { status: 200, data: 'OK' };
}

export async function createProject(data: any) {
  return api.post('/api/projects', data);
}

// Tasks
export async function createTask(columnId: string, data: any) {
  return api.post(`/api/columns/${columnId}/tasks`, data);
}

export async function moveTask(taskId: string, columnId: string, position: number) {
  return api.post(`/api/tasks/${taskId}/move`, { columnId, position });
}

export async function updateTask(taskId: string, data: any) {
  return api.put(`/api/tasks/${taskId}`, data);
}

export async function deleteTask(taskId: string) {
  return api.delete(`/api/tasks/${taskId}`);
}

export async function getTask(taskId: string) {
  return api.get(`/api/tasks/${taskId}`);
}

// Columns
export async function createColumn(projectId: string, data: any) {
  return api.post(`/api/projects/${projectId}/columns`, data);
}

// Comments
export async function getComments(taskId: string) {
  return api.get(`/api/tasks/${taskId}/comments`);
}

export async function addComment(taskId: string, data: any) {
  return api.post(`/api/tasks/${taskId}/comments`, data);
}

// Sprints
export async function getSprints(projectId: string) {
  return api.get(`/api/projects/${projectId}/sprints`);
}

export async function getSprint(sprintId: string) {
  return api.get(`/api/sprints/${sprintId}`);
}

export async function createSprint(projectId: string, data: any) {
  return api.post(`/api/projects/${projectId}/sprints`, data);
}

export async function updateSprint(sprintId: string, data: any) {
  return api.put(`/api/sprints/${sprintId}`, data);
}

export async function addTaskToSprintApi(sprintId: string, taskId: string) {
  return api.post(`/api/sprints/${sprintId}/tasks`, { task_id: taskId });
}

export async function removeTaskFromSprintApi(sprintId: string, taskId: string) {
  return api.delete(`/api/sprints/${sprintId}/tasks/${taskId}`);
}
