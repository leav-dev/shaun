// UI helpers

export function $(id: string) {
  return document.getElementById(id);
}

export function show(id: string) {
  document.getElementById(id)?.classList.remove('hidden');
}

export function hide(id: string) {
  document.getElementById(id)?.classList.add('hidden');
}

export function showScreen(screenId: string) {
  const screens = ['auth-screen', 'projects-screen', 'board-screen'];
  screens.forEach(s => {
    if (s === screenId) {
      show(s);
    } else {
      hide(s);
    }
  });
}

export function hideAllModals() {
  const modals = [
    'new-project-modal',
    'new-task-modal',
    'task-detail-modal',
    'sprint-modal',
    'new-sprint-modal',
    'sprint-detail-modal',
    'add-task-sprint-modal',
    'new-task-sprint-modal'
  ];
  modals.forEach(m => hide(m));
}
