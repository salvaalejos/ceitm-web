import { JustificanteEstado, JustificanteTipo } from '../../shared/types';

export const ESTADO_LABEL: Record<JustificanteEstado, string> = {
  [JustificanteEstado.PENDIENTE]: 'Pendiente',
  [JustificanteEstado.APROBADO]: 'Aprobado',
  [JustificanteEstado.RECHAZADO]: 'Rechazado',
};

export const ESTADO_BADGE: Record<JustificanteEstado, string> = {
  [JustificanteEstado.PENDIENTE]:
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  [JustificanteEstado.APROBADO]:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  [JustificanteEstado.RECHAZADO]:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

export const TIPO_LABEL: Record<JustificanteTipo, string> = {
  [JustificanteTipo.INDIVIDUAL]: 'Individual',
  [JustificanteTipo.COLECTIVO]: 'Colectivo',
};

export const formatFecha = (fecha: string) => {
  if (!fecha) return '-';
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const formatHora = (h: string | undefined | null) => (h ? h.slice(0, 5) : '-');