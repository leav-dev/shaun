// Render functions

import { priorityColors, priorityLabels, statusColors, statusLabels } from './constants';
import { currentProject, filters, columns, draggedTaskId, projects, currentUser } from './state';
import { api } from './api';
import { show, hide, showScreen } from './ui';
import { openProject, loadProjects, openAddTaskToSprint } from './app';

// Filter tasks based on current filters
function filterTasks(tasks: any[]): any[] {
  return tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    return true;
  });
}

// Render task card HTML
export function renderTaskCard(task: any): string {
  const dueClass = task.due_date ? (new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-slate-500') : '';
  const dueText = task.due_date ? new Date(task.due_date).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : '';
  
  return `
    <div class="task-card bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing" 
         draggable="true"
         data-id="${task.id}" 
         data-column="${task.column_id}"
         ondragstart="window.orgnizador.onTaskDragStart(event, '${task.id}')"
         ondragend="window.orgnizador.onTaskDragEnd(event)">
      <div class="flex items-start justify-between gap-2 mb-2">
        <span class="font-medium text-slate-800 text-sm">${task.title}</span>
        <button class="p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                onclick="window.orgnizador.openTaskDetail('${task.id}'); event.stopPropagation();"
                title="Ver detalles">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
      ${task.description ? `<p class="text-xs text-slate-500 line-clamp-2 mb-3">${task.description}</p>` : ''}
      <div class="flex items-center gap-2 flex-wrap">
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}">${priorityLabels[task.priority]}</span>
        ${task.due_date ? `
          <span class="flex items-center gap-1 text-xs ${dueClass}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            ${dueText}
          </span>
        ` : ''}
        <div class="flex -space-x-2 ml-auto">
          ${(task.assignees || []).slice(0, 3).map((a: any) => `
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white" style="background: ${a.avatar_color}" title="${a.name}">
              ${a.name.charAt(0).toUpperCase()}
            </div>
          `).join('')}
          ${(task.assignees?.length || 0) > 3 ? `
            <div class="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xs font-semibold ring-2 ring-white">
              +${task.assignees.length - 3}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Render board HTML
export function renderBoard() {
  const board = document.getElementById('board');
  if (board == null) return 
  let html = columns.map(col => {
    const filteredTasks = filterTasks(col.tasks || []);
    const taskCount = filters.search || filters.priority ? `${filteredTasks.length}/${col.tasks?.length || 0}` : (col.tasks?.length || 0);
    
    return `
    <div class="flex-shrink-0 w-80 flex flex-col bg-slate-100 rounded-2xl max-h-full" data-id="${col.id}">
      <div class="p-4 flex items-center justify-between border-b border-slate-200/50">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" style="background: ${col.color}"></span>
          <h3 class="font-semibold text-slate-700">${col.name}</h3>
        </div>
        <span class="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">${taskCount}</span>
      </div>
      <div class="flex-1 overflow-y-auto p-3 space-y-2" data-column-id="${col.id}" 
           ondragover="window.orgnizador.onColumnDragOver(event)" 
           ondragleave="window.orgnizador.onColumnDragLeave(event)"
           ondrop="window.orgnizador.onColumnDrop(event, '${col.id}')">
        ${filteredTasks.map(task => renderTaskCard(task)).join('')}
        ${filteredTasks.length === 0 && (col.tasks?.length || 0) > 0 ? '<p class="text-sm text-slate-400 text-center py-4">No hay tareas que coincidan</p>' : ''}
      </div>
      <div class="p-3 border-t border-slate-200/50">
        <button class="w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors flex items-center justify-center gap-1" onclick="window.orgnizador.openNewTaskModal('${col.id}')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Agregar tarea
        </button>
      </div>
    </div>
  `}).join('');

  html += `
    <div class="flex-shrink-0 w-80">
      <button class="w-full h-14 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all flex items-center justify-center gap-2" onclick="window.orgnizador.addNewColumn()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Agregar columna
      </button>
    </div>
  `;

  board.innerHTML = html;
}

// Render projects grid
export function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  if (!grid) return;
  
  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <p class="text-slate-500">No tienes proyectos todavía.</p>
        <p class="text-slate-400 text-sm mt-1">Crea uno para comenzar</p>
      </div>
    `;
    return;
  }

  
  grid.innerHTML = projects.map((p: any) => `
    <div class="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/5 transition-all cursor-pointer group" onclick="window.orgnizador.openProject('${p.id}')">
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
          <span class="text-white font-bold text-lg">${p.name.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      <h3 class="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">${p.name}</h3>
      <p class="text-sm text-slate-500 mt-1 line-clamp-2">${p.description || 'Sin descripción'}</p>
      <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Actualizado ${new Date(p.updated_at).toLocaleDateString('es')}</span>
      </div>
    </div>
  `).join('');
}

// Render comments
export function renderComments(comments: any[]) {
  const list = document.getElementById('task-comments');
  if (!list) return;

  if (comments.length === 0) {
    list.innerHTML = '<p class="text-sm text-slate-400">Sin comentarios todavía.</p>';
    return;
  }

  list.innerHTML = comments.map(c => `
    <div class="flex gap-3">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0" style="background: ${c.user_avatar}">
        ${c.user_name.charAt(0).toUpperCase()}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-800 text-sm">${c.user_name}</span>
          <span class="text-xs text-slate-400">${new Date(c.created_at).toLocaleString('es')}</span>
        </div>
        <p class="text-sm text-slate-600 mt-0.5">${c.content}</p>
      </div>
    </div>
  `).join('');
}

// Render sprint tasks
export function renderSprintTasks(tasks: any[]) {
  const list = document.getElementById('sprint-tasks-list');
  if (!list) return;

  if (tasks.length === 0) {
    list.innerHTML = '<p class="text-sm text-slate-400">No hay tareas en este sprint.</p>';
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div class="flex items-center gap-3">
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[t.priority]}">${priorityLabels[t.priority]}</span>
        <span class="text-sm text-slate-700">${t.title}</span>
      </div>
      <button class="text-red-500 hover:text-red-700 text-sm font-medium" onclick="window.orgnizador.removeTaskFromSprint('${t.id}')">
        Quitar
      </button>
    </div>
  `).join('');
}
