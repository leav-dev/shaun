// State management

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assignees?: any[];
}

export interface Column {
  id: string;
  project_id: string;
  name: string;
  position: number;
  color: string;
  tasks?: Task[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  owner_id: string;
  columns?: Column[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
}

export interface Filters {
  search: string;
  priority: string;
}

// Global state
export let currentUser: User | null = null;
export let currentProject: Project | null = null;
export let projects: Project[] = [];
export let columns: Column[] = [];
export let currentSprint: any = null;
export let draggedTaskId: string | null = null;

export const filters: Filters = {
  search: '',
  priority: ''
};

// State setters
export function setCurrentUser(user: User | null) {
  currentUser = user;
}

export function setCurrentProject(project: Project | null) {
  currentProject = project;
  columns = project?.columns || [];
}

export function setProjects(projectList: Project[]) {
  projects = projectList;
}

export function refreshCurrentProject() {
  currentProject = null;
}

export function setCurrentSprint(sprint: any) {
  currentSprint = sprint;
}

export function setDraggedTaskId(taskId: string | null) {
  draggedTaskId = taskId;
}
