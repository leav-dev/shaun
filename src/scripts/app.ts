// Main application entry point

import { 
  currentUser, currentProject, projects, columns, currentSprint, draggedTaskId, filters,
  setCurrentUser, setCurrentProject, setProjects, setCurrentSprint, setDraggedTaskId
} from './state';
import * as api from './api';
import { show, hide, showScreen, hideAllModals, $ } from './ui';
import { renderBoard, renderProjects, renderComments, renderSprintTasks } from './render';
import { priorityColors, priorityLabels, statusColors, statusLabels } from './constants';

// ==================== AUTH ====================

export async function doCheckAuth() {
  console.log('Checking auth...');
  const result = await api.authCheck();
  if (result.user) {
    setCurrentUser(result.user);
    const userEl = document.getElementById('user-name');
    if (userEl) userEl.textContent = result.user.name;
    showScreen('projects-screen');
    await loadProjects();
  } else {
    showScreen('auth-screen');
  }
}

export async function doLogin(email: string) {
  const result = await api.authLogin(email);
  setCurrentUser(result.user);
  const userEl = document.getElementById('user-name');
  if (userEl) userEl.textContent = result.user.name;
  showScreen('projects-screen');
  await loadProjects();
}

export async function doLogout() {
  await api.authLogout();
  setCurrentUser(null);
  showScreen('auth-screen');
}

// ==================== PROJECTS ====================

export async function loadProjects() {
  if (!currentUser) return;
  const projectList = await api.getProjects(currentUser.id);
  setProjects(projectList);
  renderProjects();
}

export async function doCreateProject(data: any) {
  await api.createProject(data);
  await loadProjects();
}

export async function openProject(projectId: string) {
  const project = await api.getProject(projectId);
  setCurrentProject(project);
  
  const titleEl = document.getElementById('project-title');
  if (titleEl) titleEl.textContent = project.name;
  
  renderBoard();
  showScreen('board-screen');
}

// ==================== TASKS ====================

export async function doCreateTask(columnId: string, data: any) {
  await api.createTask(columnId, data);
  if (currentProject) {
    await openProject(currentProject.id);
  }
}

export async function doMoveTask(taskId: string, columnId: string, position: number) {
  // Verificamos en qué columna estaba antes la tarea para saber si es un cambio de estado
  const task = await api.getTask(taskId);
  
  // Solo pedimos comentario si la tarea está cambiando de columna (estado)
  if (task && task.column_id !== columnId) {
    const comment = prompt('Por favor, ingresa un comentario sobre este cambio de estado (Requerido):');
    if (!comment || !comment.trim()) {
      alert('El cambio de estado requiere un comentario. Operación cancelada.');
      // Refrescamos el tablero original para revertir el drag&drop visual
      if (currentProject) await openProject(currentProject.id);
      return;
    }
    
    // Obtenemos los nombres de las columnas para el texto
    const oldColumnName = columns.find(c => c.id === task.column_id)?.name || 'Anterior';
    const newColumnName = columns.find(c => c.id === columnId)?.name || 'Nueva';

    // Construimos el nuevo bloque de descripción
    const addedDescription = `\n\n[Traslado de '${oldColumnName}' a '${newColumnName}']:\n${comment.trim()}`;
    const newDescription = (task.description ? task.description + addedDescription : addedDescription.trim());

    // Si se procede, realizamos el movimiento y actualizamos la descripción
    await api.moveTask(taskId, columnId, position);
    await api.updateTask(taskId, { description: newDescription });
    await api.addComment(taskId, { user_id: currentUser?.id, content: comment.trim() });
  } else {
    // Es solo una reordenación en la misma columna
    await api.moveTask(taskId, columnId, position);
  }

  if (currentProject) {
    await openProject(currentProject.id);
  }
}

export async function openTaskDetail(taskId: string) {
  const task = await api.getTask(taskId);
  if (!task) return;

  const titleEl = document.getElementById('task-detail-title');
  const descEl = document.getElementById('task-detail-desc');
  const priorityEl = document.getElementById('task-detail-priority') as HTMLSelectElement;
  const dueEl = document.getElementById('task-detail-due') as HTMLInputElement;
  
  if (titleEl) titleEl.textContent = task.title;
  if (descEl) descEl.textContent = task.description || 'Sin descripción';
  if (priorityEl) priorityEl.value = task.priority;
  if (dueEl) dueEl.value = task.due_date ? task.due_date.split('T')[0] : '';

  const statusSelect = document.getElementById('task-detail-status') as HTMLSelectElement;
  if (statusSelect) {
    statusSelect.innerHTML = columns.map(c => 
      `<option value="${c.id}" ${c.id === task.column_id ? 'selected' : ''}>${c.name}</option>`
    ).join('');
  }

  const assigneesDiv = document.getElementById('task-assignees');
  if (assigneesDiv) {
    if (task.assignees?.length > 0) {
      assigneesDiv.innerHTML = task.assignees.map((a: any) => `
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
          <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold" style="background: ${a.avatar_color}">
            ${a.name.charAt(0).toUpperCase()}
          </div>
          <span class="text-sm text-slate-700">${a.name}</span>
        </div>
      `).join('');
    } else {
      assigneesDiv.innerHTML = '<span class="text-sm text-slate-400">Sin asignar</span>';
    }
  }

  const comments = await api.getComments(taskId);
  renderComments(comments);

  const statusEl = document.getElementById('task-detail-status') as HTMLSelectElement;
  const prioritySelectEl = document.getElementById('task-detail-priority') as HTMLSelectElement;
  const dueInputEl = document.getElementById('task-detail-due') as HTMLInputElement;
  const deleteBtn = document.getElementById('delete-task-btn') as HTMLButtonElement;
  
  if (statusEl) statusEl.dataset.taskId = taskId;
  if (prioritySelectEl) prioritySelectEl.dataset.taskId = taskId;
  if (dueInputEl) dueInputEl.dataset.taskId = taskId;
  if (deleteBtn) deleteBtn.dataset.taskId = taskId;

  show('task-detail-modal');
}

export async function doDeleteTask(taskId: string) {
  await api.deleteTask(taskId);
  hide('task-detail-modal');
  if (currentProject) {
    await openProject(currentProject.id);
  }
}

export async function doAddComment(taskId: string, content: string) {
  await api.addComment(taskId, { user_id: currentUser?.id, content });
  const comments = await api.getComments(taskId);
  renderComments(comments);
}

// ==================== COLUMNS ====================

export async function doAddColumn() {
  const name = prompt('Nombre de la nueva columna:');
  if (!name || !name.trim() || !currentProject) return;

  await api.createColumn(currentProject.id, {
    name: name.trim(),
    color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
  });
  await openProject(currentProject.id);
}

// ==================== SPRINTS ====================

export async function loadSprints() {
  if (!currentProject) return;
  const sprints = await api.getSprints(currentProject.id);
  
  const list = document.getElementById('sprints-list');
  if (!list) return;
  
  if (sprints.length === 0) {
    list.innerHTML = '<p class="text-slate-400 text-sm">No hay sprints todavía.</p>';
    return;
  }

  list.innerHTML = sprints.map((s: any) => `
    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 cursor-pointer hover:border-primary-300" 
         data-sprint-id="${s.id}" onclick="window.orgnizador.openSprintDetail('${s.id}')">
      <div class="flex items-center justify-between mb-2">
        <span class="font-semibold text-slate-800">${s.name}</span>
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}">${statusLabels[s.status]}</span>
      </div>
      <p class="text-sm text-slate-500 mb-2">${s.goal || 'Sin objetivo definido'}</p>
      <div class="flex items-center justify-between text-xs text-slate-400">
        <span>${s.start_date ? new Date(s.start_date).toLocaleDateString('es') : 'Sin fecha'} - ${s.end_date ? new Date(s.end_date).toLocaleDateString('es') : 'Sin fecha'}</span>
        <span class="font-medium">${s.tasks?.length || 0} tareas</span>
      </div>
    </div>
  `).join('');

  // Add click handlers
  list.querySelectorAll('[data-sprint-id]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.addEventListener('click', () => openSprintDetail(htmlEl.dataset.sprintId!));
  });
}

export async function openSprintDetail(sprintId: string) {
  setCurrentSprint(await api.getSprint(sprintId));
  
  const nameEl = document.getElementById('sprint-detail-name');
  const goalEl = document.getElementById('sprint-detail-goal');
  const datesEl = document.getElementById('sprint-detail-dates');
  const statusEl = document.getElementById('sprint-detail-status') as HTMLSelectElement;
  
  if (nameEl) nameEl.textContent = currentSprint.name;
  if (goalEl) goalEl.textContent = currentSprint.goal || 'Sin objetivo definido';
  if (datesEl) {
    const start = currentSprint.start_date ? new Date(currentSprint.start_date).toLocaleDateString('es') : 'Sin fecha';
    const end = currentSprint.end_date ? new Date(currentSprint.end_date).toLocaleDateString('es') : 'Sin fecha';
    datesEl.textContent = `${start} - ${end}`;
  }
  if (statusEl) {
    statusEl.value = currentSprint.status;
    statusEl.dataset.sprintId = sprintId;
  }
  
  renderSprintTasks(currentSprint.tasks || []);
  
  hide('sprint-modal');
  show('sprint-detail-modal');
}

export async function doCreateSprint(data: any) {
  if (!currentProject) return;
  await api.createSprint(currentProject.id, data);
  await loadSprints();
  show('sprint-modal');
}

export async function doUpdateSprintStatus(sprintId: string, status: string) {
  await api.updateSprint(sprintId, { status });
  await loadSprints();
}

export async function removeTaskFromSprint(taskId: string) {
  if (!currentSprint) return;
  await api.removeTaskFromSprintApi(currentSprint.id, taskId);
  setCurrentSprint(await api.getSprint(currentSprint.id));
  renderSprintTasks(currentSprint.tasks || []);
  await loadSprints();
}

export async function openAddTaskToSprint() {
  if (!currentProject || !currentSprint) return;
  
  const allProject = await api.getProject(currentProject.id);
  const sprintTaskIds = (currentSprint.tasks || []).map((t: any) => t.id);
  const availableTasks = allProject.columns?.flatMap((c: any) => c.tasks || []).filter((t: any) => !sprintTaskIds.includes(t.id)) || [];

  const list = document.getElementById('available-tasks-list');
  if (!list) return;

  if (availableTasks.length === 0) {
    list.innerHTML = '<p class="text-sm text-slate-400">No hay tareas disponibles.</p>';
    return;
  }

  list.innerHTML = availableTasks.map((t: any) => `
    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary-300 cursor-pointer" 
         data-task-id="${t.id}" onclick="window.orgnizador.addTaskToSprint('${t.id}')">
      <div class="flex items-center gap-3">
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[t.priority]}">${priorityLabels[t.priority]}</span>
        <span class="text-sm text-slate-700">${t.title}</span>
      </div>
      <span class="text-primary-600 text-sm font-medium">Agregar</span>
    </div>
  `).join('');

  // Add click handlers
  list.querySelectorAll('[data-task-id]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.addEventListener('click', async () => {
      await api.addTaskToSprintApi(currentSprint.id, htmlEl.dataset.taskId!);
      setCurrentSprint(await api.getSprint(currentSprint.id));
      renderSprintTasks(currentSprint.tasks || []);
      await loadSprints();
      await openAddTaskToSprint();
    });
  });

  show('add-task-sprint-modal');
}

export async function addTaskToSprint(taskId: string) {
  if (!currentSprint) return;
  await api.addTaskToSprintApi(currentSprint.id, taskId);
  setCurrentSprint(await api.getSprint(currentSprint.id));
  renderSprintTasks(currentSprint.tasks || []);
  await loadSprints();
  await openAddTaskToSprint();
}

// ==================== FILTERS ====================

export function applyFilters() {
  renderBoard();
}

// ==================== DRAG & DROP ====================

export function onTaskDragStart(e: DragEvent, taskId: string) {
  setDraggedTaskId(taskId);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }
  const target = e.currentTarget as HTMLElement;
  setTimeout(() => target.classList.add('opacity-50'), 0);
}

export function onTaskDragEnd(e: DragEvent) {
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('opacity-50');
  setDraggedTaskId(null);
}

export function onColumnDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  const target = e.currentTarget as HTMLElement;
  target.classList.add('bg-primary-50/50');
}

export function onColumnDragLeave(e: DragEvent) {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('bg-primary-50/50');
}

export function onColumnDrop(e: DragEvent, columnId: string) {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('bg-primary-50/50');
  
  const taskId = draggedTaskId || (e.dataTransfer?.getData('text/plain'));
  if (!taskId || !columnId) return;
  
  const position = target.querySelectorAll('.task-card').length;
  
  doMoveTask(taskId, columnId, position);
}

// ==================== INIT ====================

export function initEventListeners() {
  // Auth
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    await doLogin(email);
  });

  document.getElementById('logout-btn')?.addEventListener('click', doLogout);

  // Projects
  document.getElementById('new-project-btn')?.addEventListener('click', () => show('new-project-modal'));
  document.getElementById('cancel-project-btn')?.addEventListener('click', () => hide('new-project-modal'));
  
  document.getElementById('new-project-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('project-name') as HTMLInputElement).value;
    const slug = (document.getElementById('project-slug') as HTMLInputElement).value;
    const description = (document.getElementById('project-desc') as HTMLTextAreaElement).value;
    
    await doCreateProject({ name, slug, description, owner_id: currentUser?.id });
    hide('new-project-modal');
    (e.target as HTMLFormElement).reset();
  });

  document.getElementById('project-slug')?.addEventListener('input', (e) => {
    (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  });

  // Tasks
  document.getElementById('cancel-task-btn')?.addEventListener('click', () => hide('new-task-modal'));
  document.getElementById('close-task-detail')?.addEventListener('click', () => hide('task-detail-modal'));

  document.getElementById('new-task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const colId = (document.getElementById('task-column-id') as HTMLInputElement).value;
    const title = (document.getElementById('task-title') as HTMLInputElement).value;
    const description = (document.getElementById('task-desc') as HTMLTextAreaElement).value;
    const priority = (document.getElementById('task-priority') as HTMLSelectElement).value;
    const due_date = (document.getElementById('task-due-date') as HTMLInputElement).value;

    await doCreateTask(colId, {
      title,
      description,
      priority,
      due_date: due_date || null,
      created_by: currentUser?.id
    });

    hide('new-task-modal');
    (e.target as HTMLFormElement).reset();
  });

  document.getElementById('task-detail-status')?.addEventListener('change', async (e) => {
    const taskId = (e.target as HTMLElement).dataset.taskId;
    const columnId = (e.target as HTMLSelectElement).value;
    await doMoveTask(taskId!, columnId, 0);
    if (currentProject) await openProject(currentProject.id);
  });

  document.getElementById('task-detail-priority')?.addEventListener('change', async (e) => {
    const taskId = (e.target as HTMLElement).dataset.taskId;
    await api.updateTask(taskId!, { priority: (e.target as HTMLSelectElement).value });
  });

  document.getElementById('task-detail-due')?.addEventListener('change', async (e) => {
    const taskId = (e.target as HTMLElement).dataset.taskId;
    await api.updateTask(taskId!, { due_date: (e.target as HTMLInputElement).value || null });
  });

  document.getElementById('delete-task-btn')?.addEventListener('click', async (e) => {
    const taskId = (e.target as HTMLElement).dataset.taskId;
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      await doDeleteTask(taskId!);
    }
  });

  document.getElementById('add-comment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('task-detail-status') as HTMLSelectElement;
    const taskId = statusEl?.dataset.taskId;
    const content = (document.getElementById('comment-content') as HTMLInputElement).value;
    
    if (!taskId || !content.trim()) return;

    await doAddComment(taskId, content);
    (document.getElementById('comment-content') as HTMLInputElement).value = '';
  });

  // Sprint
  document.getElementById('sprint-btn')?.addEventListener('click', async () => {
    await loadSprints();
    show('sprint-modal');
  });

  document.getElementById('close-sprint-modal')?.addEventListener('click', () => hide('sprint-modal'));
  document.getElementById('new-sprint-btn')?.addEventListener('click', () => {
    hide('sprint-modal');
    show('new-sprint-modal');
  });
  document.getElementById('cancel-sprint-btn')?.addEventListener('click', () => {
    hide('new-sprint-modal');
    show('sprint-modal');
  });

  document.getElementById('new-sprint-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('sprint-name') as HTMLInputElement).value;
    const goal = (document.getElementById('sprint-goal') as HTMLTextAreaElement).value;
    const start_date = (document.getElementById('sprint-start') as HTMLInputElement).value;
    const end_date = (document.getElementById('sprint-end') as HTMLInputElement).value;

    await doCreateSprint({
      name,
      goal,
      start_date: start_date || null,
      end_date: end_date || null
    });

    hide('new-sprint-modal');
    (e.target as HTMLFormElement).reset();
  });

  document.getElementById('close-sprint-detail')?.addEventListener('click', () => {
    hide('sprint-detail-modal');
    show('sprint-modal');
  });

  document.getElementById('sprint-detail-status')?.addEventListener('change', async (e) => {
    const sprintId = (e.target as HTMLElement).dataset.sprintId;
    await doUpdateSprintStatus(sprintId!, (e.target as HTMLSelectElement).value);
  });

  document.getElementById('add-task-to-sprint-btn')?.addEventListener('click', () => {
    openAddTaskToSprint();
  });

  document.getElementById('close-add-task-sprint')?.addEventListener('click', () => {
    hide('add-task-sprint-modal');
  });

  document.getElementById('add-column-btn-header')?.addEventListener('click', doAddColumn);

  // Filters
  document.getElementById('task-search')?.addEventListener('input', (e) => {
    filters.search = (e.target as HTMLInputElement).value;
    applyFilters();
  });

  document.getElementById('filter-priority')?.addEventListener('change', (e) => {
    filters.priority = (e.target as HTMLSelectElement).value;
    applyFilters();
  });

  // Close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideAllModals();
  });

  document.querySelectorAll('.fixed.inset-0').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideAllModals();
    });
  });
}

export function init() {
  console.log('Initializing Orgnizador...');
  initEventListeners();
  doCheckAuth();
}

declare global {
  interface Window {
    orgnizador: any;
  }
}

// Global exports
window.orgnizador = {
  openNewTaskModal: (columnId: string) => {
    const el = document.getElementById('task-column-id') as HTMLInputElement;
    if (el) el.value = columnId;
    show('new-task-modal');
  },
  addNewColumn: () => doAddColumn(),
  openTaskDetail: (taskId: string) => openTaskDetail(taskId),
  onTaskDragStart: (e: DragEvent, taskId: string) => onTaskDragStart(e, taskId),
  onTaskDragEnd: (e: DragEvent) => onTaskDragEnd(e),
  onColumnDragOver: (e: DragEvent) => onColumnDragOver(e),
  onColumnDragLeave: (e: DragEvent) => onColumnDragLeave(e),
  onColumnDrop: (e: DragEvent, columnId: string) => onColumnDrop(e, columnId),
  openProject: (projectId: string) => openProject(projectId),
  doLogout: () => doLogout(),
  openSprintDetail: (sprintId: string) => openSprintDetail(sprintId),
  addTaskToSprint: (taskId: string) => addTaskToSprint(taskId),
  removeTaskFromSprint: (taskId: string) => removeTaskFromSprint(taskId)
};

export default { init };
