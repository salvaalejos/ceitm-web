import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { createEvent, deleteEventApi, getEvents, updateEvent } from '../../../shared/services/api';
import type { CalendarEvent } from '../../../shared/types';

// Categorías del calendario (los valores coinciden con el enum del backend)
const EVENT_CATEGORIES = [
  { value: 'Pony Emprende', label: 'Pony Emprende', chip: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  { value: 'Oficial CEITM', label: 'Oficial CEITM', chip: 'bg-guinda-100 text-guinda-700 border-guinda-200 dark:bg-guinda-900/30 dark:text-guinda-300 dark:border-guinda-800' },
  { value: 'Oficial Carrera', label: 'Oficial Carrera', chip: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  { value: 'Aniversario', label: 'Aniversario', chip: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
];

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const categoryChip = (category: string) => {
  const found = EVENT_CATEGORIES.find((c) => c.value === category);
  return found?.chip ?? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
};

type ModalState = { dateKey: string } | null;

const emptyForm = () => ({
  title: '',
  description: '',
  start_time: '09:00',
  end_time: '',
  location: '',
  category: 'Oficial CEITM',
});

export const AdminCalendario = () => {
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents({
        month: viewDate.getMonth() + 1,
        year: viewDate.getFullYear(),
      });
      setEvents(data);
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los eventos del calendario.',
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]);

  const changeMonth = (delta: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToday = () => setViewDate(new Date());

  // Construir la cuadrícula (semana inicia en lunes)
  const grid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // lun=0
    const start = new Date(year, month, 1 - startOffset);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return cells;
  }, [viewDate]);

  const todayKey = toDateKey(new Date());

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const key = ev.event_date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const openDay = (dateKey: string) => {
    setEditingId(null);
    setForm(emptyForm());
    setModal({ dateKey });
  };

  const closeModal = () => {
    setModal(null);
    setEditingId(null);
  };

  const startEdit = (ev: CalendarEvent) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      start_time: ev.start_time ?? '09:00',
      end_time: ev.end_time ?? '',
      location: ev.location ?? '',
      category: ev.category,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: modal.dateKey,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location.trim() || null,
        category: form.category,
      };
      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }
      await loadEvents();
      setEditingId(null);
      setForm(emptyForm());
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el evento.',
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev: CalendarEvent) => {
    const isDark = document.documentElement.classList.contains('dark');
    const res = await Swal.fire({
      title: '¿Eliminar evento?',
      text: `Se eliminará "${ev.title}" permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000',
    });
    if (res.isConfirmed) {
      try {
        await deleteEventApi(ev.id);
        await loadEvents();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const modalDay = modal ? new Date(`${modal.dateKey}T00:00:00`) : null;
  const dayEvents = modal ? (eventsByDay[modal.dateKey] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendario Interno</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona las actividades y eventos del Concejo.
          </p>
        </div>

        {/* NAVEGACIÓN DEL MES */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="px-3 font-semibold text-gray-900 dark:text-white min-w-[10rem] text-center">
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={goToday}
            className="ml-1 px-3 py-2 rounded-lg text-sm font-medium text-guinda-600 dark:text-guinda-400 hover:bg-guinda-50 dark:hover:bg-guinda-900/20 transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500 dark:text-gray-400 font-medium">Categorías:</span>
        {EVENT_CATEGORIES.map((c) => (
          <span key={c.value} className={`px-2.5 py-1 rounded-full border ${c.chip}`}>
            {c.label}
          </span>
        ))}
      </div>

      {/* CALENDARIO */}
      <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600"></div>
          </div>
        )}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((cell) => {
            const key = toDateKey(cell);
            const inMonth = cell.getMonth() === viewDate.getMonth();
            const cellEvents = eventsByDay[key] ?? [];
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                onClick={() => openDay(key)}
                className={`
                  min-h-[7rem] border-b border-r border-gray-100 dark:border-slate-800 p-1.5 text-left
                  transition-colors hover:bg-guinda-50/50 dark:hover:bg-slate-800/50
                  ${inMonth ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-950'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold
                      ${isToday ? 'bg-guinda-600 text-white' : inMonth ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}
                    `}
                  >
                    {cell.getDate()}
                  </span>
                  {cellEvents.length > 0 && (
                    <Plus size={12} className="text-guinda-400 opacity-0 group-hover:opacity-100" />
                  )}
                </div>

                <div className="space-y-1">
                  {cellEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className={`px-1.5 py-0.5 rounded-md border text-[10px] leading-tight truncate ${categoryChip(ev.category)}`}
                      title={ev.title}
                    >
                      {ev.start_time ? `${ev.start_time.slice(0, 5)} ` : ''}
                      {ev.title}
                    </div>
                  ))}
                  {cellEvents.length > 3 && (
                    <div className="px-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      +{cellEvents.length - 3} más
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL DEL DÍA */}
      {modalDay && modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl custom-scrollbar">
            {/* Encabezado */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-guinda-100 dark:bg-guinda-900/40 flex items-center justify-center text-guinda-600 dark:text-guinda-400">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    {MONTHS[modalDay.getMonth()]} {modalDay.getDate()}, {modalDay.getFullYear()}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {WEEKDAYS[modalDay.getDay() === 0 ? 6 : modalDay.getDay() - 1]}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Eventos del día */}
              {dayEvents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Eventos del día
                  </h3>
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{ev.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-0.5 rounded-full border ${categoryChip(ev.category)}`}>
                            {ev.category}
                          </span>
                          {ev.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {ev.start_time.slice(0, 5)}
                              {ev.end_time ? ` - ${ev.end_time.slice(0, 5)}` : ''}
                            </span>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {ev.location}
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(ev)}
                          className="p-2 rounded-lg text-gray-500 hover:text-guinda-600 hover:bg-guinda-50 dark:hover:bg-guinda-900/20 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {editingId ? 'Editar evento' : 'Nuevo evento'}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej. Entrega de credenciales"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
                    >
                      {EVENT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Ej. Explanada"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Detalles del evento..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setForm(emptyForm()); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancelar edición
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.title.trim()}
                    className={`
                      flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white
                      ${saving || !form.title.trim()
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                        : 'bg-guinda-600 hover:bg-guinda-700'}
                      transition-colors
                    `}
                  >
                    {saving ? 'Guardando...' : <><Plus size={16} /> {editingId ? 'Guardar cambios' : 'Guardar evento'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};