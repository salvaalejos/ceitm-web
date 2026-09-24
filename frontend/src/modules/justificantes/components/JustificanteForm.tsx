import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Users, User, FileText, CalendarDays, Clock } from 'lucide-react';
import type { JustificanteParticipante } from '../../../shared/types';
import { JustificanteTipo } from '../../../shared/types';
import { createJustificante } from '../../../shared/services/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  tipo: JustificanteTipo;
  folio: string;
  actividad: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  participantes: JustificanteParticipante[];
}

const participantEmpty = (): JustificanteParticipante => ({ nombre: '', numero_control: '', carrera: '' });

export const JustificanteForm = ({ onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    tipo: JustificanteTipo.INDIVIDUAL,
    folio: '',
    actividad: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    participantes: [participantEmpty()],
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const changeTipo = (tipo: JustificanteTipo) => {
    setFormData((prev) => ({
      ...prev,
      tipo,
      participantes: tipo === JustificanteTipo.INDIVIDUAL
        ? [prev.participantes[0] || participantEmpty()]
        : prev.participantes,
    }));
  };

  const handleParticipante = (index: number, field: keyof JustificanteParticipante, value: string) => {
    const list = [...formData.participantes];
    list[index] = { ...list[index], [field]: value };
    setFormData({ ...formData, participantes: list });
  };

  const addParticipante = () => {
    setFormData({ ...formData, participantes: [...formData.participantes, participantEmpty()] });
  };

  const removeParticipante = (index: number) => {
    setFormData({
      ...formData,
      participantes: formData.participantes.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const participantes = formData.participantes
        .map(p => ({ ...p, nombre: p.nombre.trim(), numero_control: p.numero_control.trim(), carrera: p.carrera.trim() }))
        .filter(p => p.nombre || p.numero_control || p.carrera);

      if (!formData.actividad.trim()) throw new Error('La actividad realizada es obligatoria.');
      if (!formData.folio.trim()) throw new Error('El folio (número de oficio) es obligatorio.');
      if (!formData.fecha) throw new Error('La fecha es obligatoria.');
      if (!formData.hora_inicio || !formData.hora_fin) throw new Error('El rango de horas es obligatorio.');
      if (formData.hora_inicio >= formData.hora_fin) throw new Error('La hora de inicio debe ser anterior a la hora final.');
      if (participantes.some(p => !p.nombre || !p.numero_control || !p.carrera))
        throw new Error('Todos los participantes deben tener nombre, número de control y carrera.');
      if (participantes.length === 0) throw new Error('Debes registrar al menos un participante.');

      await createJustificante({
        tipo: formData.tipo,
        folio: formData.folio.trim(),
        actividad: formData.actividad.trim(),
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        participantes,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const detail = (err as { message?: string; response?: { data?: { detail?: string } } }).response?.data?.detail;
      alert((err as { message?: string })?.message || detail || 'Error al guardar el justificante.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-base w-full max-w-3xl flex flex-col max-h-[90vh] animate-fade-in">
        <div className="modal-header">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo justificante</h3>
            <p className="text-sm text-gray-500">Se enviará para aprobación de Estructura.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* TIPO */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: JustificanteTipo.INDIVIDUAL, label: 'Individual', icon: User },
              { value: JustificanteTipo.COLECTIVO, label: 'Colectivo', icon: Users },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => changeTipo(value)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  formData.tipo === value
                    ? 'border-guinda-600 bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-guinda-300'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>

          {/* FOLIO */}
          <div>
            <label className="form-label">Número de oficio (folio)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="folio"
                value={formData.folio}
                onChange={handleChange}
                placeholder="Ej. 001 EJ 2026"
                className={inputCls}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Formato: número, semestre (EJ o AD) y año. Ej. 002 AD 2026</p>
          </div>

          {/* ACTIVIDAD */}
          <div>
            <label className="form-label">Actividad realizada</label>
            <textarea
              name="actividad"
              value={formData.actividad}
              onChange={handleChange}
              rows={3}
              placeholder="Describe la actividad, evento o comisión..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 text-sm"
            />
          </div>

          {/* FECHA Y HORARIO */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Fecha</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="fecha" type="date" value={formData.fecha} onChange={handleChange} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="form-label">Hora de inicio</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="hora_inicio" type="time" value={formData.hora_inicio} onChange={handleChange} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="form-label">Hora final</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="hora_fin" type="time" value={formData.hora_fin} onChange={handleChange} className={inputCls} />
              </div>
            </div>
          </div>

          {/* PARTICIPANTES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Participantes</label>
              {formData.tipo === JustificanteTipo.COLECTIVO && (
                <button
                  type="button"
                  onClick={addParticipante}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-guinda-600 hover:bg-guinda-50 dark:hover:bg-guinda-900/20 transition-colors"
                >
                  <Plus size={16} /> Agregar participante
                </button>
              )}
            </div>

            {formData.participantes.map((p, index) => (
              <div key={index} className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {formData.tipo === JustificanteTipo.INDIVIDUAL ? 'Alumno' : `Participante ${index + 1}`}
                  </span>
                  {formData.tipo === JustificanteTipo.COLECTIVO && formData.participantes.length > 1 && (
                    <button type="button" onClick={() => removeParticipante(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    placeholder="Nombre completo"
                    value={p.nombre}
                    onChange={(e) => handleParticipante(index, 'nombre', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 text-sm"
                  />
                  <input
                    placeholder="Carrera"
                    value={p.carrera}
                    onChange={(e) => handleParticipante(index, 'carrera', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 text-sm"
                  />
                  <input
                    placeholder="No. de control"
                    value={p.numero_control}
                    onChange={(e) => handleParticipante(index, 'numero_control', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 text-sm font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Enviar para aprobación'}
          </button>
        </div>
      </div>
    </div>
  );
};