// Constants

export const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

export const statusColors: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-600',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700'
};

export const statusLabels: Record<string, string> = {
  planning: 'Planificación',
  active: 'Activo',
  completed: 'Completado'
};
