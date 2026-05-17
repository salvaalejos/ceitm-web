import { useState, useEffect } from 'react';
import { X, CheckCircle, FileText } from 'lucide-react';
import { submitAdminScholarshipApplication, getScholarships, getCareers, getCafeterias } from '../../../shared/services/api';
import type { Scholarship, Career } from '../../../shared/types';
import Swal from 'sweetalert2';

interface ManualApplicationModalProps {
  scholarshipId: number; // default ID
  onClose: () => void;
  onSuccess: () => void;
}

export const ManualApplicationModal = ({ scholarshipId, onClose, onSuccess }: ManualApplicationModalProps) => {
  const [formData, setFormData] = useState({
    scholarship_id: scholarshipId,
    control_number: '',
    full_name: '',
    career: '',
    cafeteria_asignada_id: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [cafeterias, setCafeterias] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scholData, carData, cafData] = await Promise.all([
          getScholarships(true),
          getCareers(),
          getCafeterias()
        ]);
        setScholarships(scholData);
        setCareers(carData);
        setCafeterias(cafData);
      } catch (error) {
        console.error("Error al cargar datos", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitAdminScholarshipApplication({
        scholarship_id: formData.scholarship_id,
        control_number: formData.control_number,
        full_name: formData.full_name,
        career: formData.career,
        cafeteria_asignada_id: formData.cafeteria_asignada_id ? Number(formData.cafeteria_asignada_id) : null
      });
      Swal.fire('Éxito', 'Solicitud manual creada correctamente y aprobada automáticamente.', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.detail || 'No se pudo crear la solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedScholarship = scholarships.find(s => s.id === formData.scholarship_id);
  const isAlimenticia = selectedScholarship?.type === 'Alimenticia';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-guinda-600" /> Añadir Solicitud Manual
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {loadingData ? (
            <div className="p-8 text-center text-gray-500">Cargando datos...</div>
        ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Beca a registrar *</label>
                <select
                required
                className="form-input"
                value={formData.scholarship_id}
                onChange={e => setFormData({ ...formData, scholarship_id: Number(e.target.value) })}
                >
                <option value="">Selecciona una convocatoria...</option>
                {scholarships.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.period} {s.year})</option>
                ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Número de Control *</label>
                <input
                type="text"
                required
                placeholder="Ej. 21120000"
                className="form-input"
                value={formData.control_number}
                onChange={e => setFormData({ ...formData, control_number: e.target.value })}
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
                <input
                type="text"
                required
                placeholder="Ej. Juan Pérez"
                className="form-input"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Carrera *</label>
                <select
                required
                className="form-input"
                value={formData.career}
                onChange={e => setFormData({ ...formData, career: e.target.value })}
                >
                <option value="">Selecciona la carrera...</option>
                {careers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                </select>
            </div>

            {isAlimenticia && (
                <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Asignar Cafetería (Opcional)</label>
                <select
                    className="form-input"
                    value={formData.cafeteria_asignada_id}
                    onChange={e => setFormData({ ...formData, cafeteria_asignada_id: e.target.value })}
                >
                    <option value="">Sin Asignar</option>
                    {cafeterias.map(c => {
                        const libres = c.limite_becas - (c.becas_asignadas || 0);
                        return (
                            <option key={c.id} value={c.id}>
                                {c.nombre} - {c.campus} (Disp: {libres})
                            </option>
                        );
                    })}
                </select>
                </div>
            )}

            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 btn-secondary text-center py-2.5">
                Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary text-center py-2.5 flex items-center justify-center gap-2">
                <CheckCircle size={18} /> {loading ? 'Creando...' : 'Crear'}
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
};
