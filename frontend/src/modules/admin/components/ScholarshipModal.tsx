import { useState, useEffect, useRef } from 'react';
import { X, Save, Calendar, Type, AlignLeft } from 'lucide-react';
import {
  type Scholarship,
  type ScholarshipCreate,
  ScholarshipType
} from '../../../shared/types';
import { createScholarship, updateScholarship } from '../../../shared/services/api';

interface Props {
  scholarship?: Scholarship | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScholarshipModal = ({ scholarship, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);

  // Refs para abrir el calendario manualmente si se clickea el icono
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ScholarshipCreate>({
    name: '',
    description: '',
    type: ScholarshipType.ALIMENTICIA,
    cycle: '',
    start_date: '',
    end_date: '',
    results_date: '',
    is_active: true
  });

  useEffect(() => {
    if (scholarship) {
      setFormData({
        name: scholarship.name,
        description: scholarship.description,
        type: scholarship.type,
        cycle: scholarship.cycle,
        start_date: scholarship.start_date.slice(0, 16),
        end_date: scholarship.end_date.slice(0, 16),
        results_date: scholarship.results_date.slice(0, 16),
        is_active: scholarship.is_active
      });
    }
  }, [scholarship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (scholarship) {
        await updateScholarship(scholarship.id, formData);
      } else {
        await createScholarship(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la convocatoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current && 'showPicker' in HTMLInputElement.prototype) {
        try { (ref.current as any).showPicker(); } catch {}
    } else {
        ref.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card-base w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* HEADER */}
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {scholarship ? 'Editar Convocatoria' : 'Nueva Convocatoria'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className="form-label">Nombre de la Beca</label>
                    <div className="relative group">
                        <input
                            required
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="form-input pl-10"
                            placeholder="Ej. Beca Alimenticia 2025"
                        />
                        <Type size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500 group-focus-within:text-guinda-500 transition-colors" />
                    </div>
                </div>

                <div>
                    <label className="form-label">Tipo de Apoyo</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="form-input">
                        {Object.values(ScholarshipType).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="form-label">Ciclo Escolar</label>
                    <input required name="cycle" value={formData.cycle} onChange={handleChange} className="form-input" placeholder="Ej. Ene-Jun 2025" />
                </div>
            </div>

            <div>
                <label className="form-label">Descripción</label>
                <div className="relative group">
                    <textarea
                        required
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="form-input pl-10 h-24 pt-3 resize-none"
                        placeholder="Breve descripción..."
                    />
                    <AlignLeft size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500 group-focus-within:text-guinda-500 transition-colors" />
                </div>
            </div>

            {/* FECHAS */}
            <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar size={14} /> Cronograma
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Apertura', name: 'start_date', ref: startRef, value: formData.start_date },
                        { label: 'Cierre', name: 'end_date', ref: endRef, value: formData.end_date },
                        { label: 'Resultados', name: 'results_date', ref: resultsRef, value: formData.results_date },
                    ].map((field, idx) => (
                        <div key={idx} className="relative cursor-pointer group" onClick={() => openPicker(field.ref as any)}>
                            <label className="form-label text-[10px] mb-1">{field.label}</label>

                            {/* INPUT CON ICONO NATIVO OCULTO */}
                            {/* [&::-webkit-calendar-picker-indicator]:hidden -> Oculta el icono nativo en Chrome/Edge */}
                            <input
                                ref={field.ref as any}
                                required
                                type="datetime-local"
                                name={field.name}
                                value={field.value}
                                onChange={handleChange}
                                className="form-input text-xs pl-9 cursor-pointer
                                           [&::-webkit-calendar-picker-indicator]:hidden
                                           [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />

                            {/* NUESTRO ICONO PERSONALIZADO */}
                            <Calendar
                                size={16}
                                className="absolute left-3 top-[34px] text-guinda-600 dark:text-guinda-400 pointer-events-none group-hover:text-guinda-700 dark:group-hover:text-guinda-300 transition-colors"
                            />
                        </div>
                    ))}
                </div>
            </div>

        </form>

        <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
            >
                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar'}
            </button>
        </div>

      </div>
    </div>
  );
};