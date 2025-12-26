import { useState, useEffect } from 'react';
import { X, Save, Loader2, MessageCircle } from 'lucide-react';
import { updateCareer } from '../../../shared/services/api';
import type { Career } from '../../../shared/types';

interface Props {
  career: Career | null;
  onClose: () => void;
  onSuccess: () => void;
  canEditStatus: boolean; // 👇 NUEVA PROP: Controla si puede moverle al estatus
}

export const CareerModal = ({ career, onClose, onSuccess, canEditStatus }: Props) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp_url: '',
    is_active: true
  });

  useEffect(() => {
    if (career) {
      setFormData({
        whatsapp_url: career.whatsapp_url || '',
        is_active: career.is_active
      });
    }
  }, [career]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!career) return;

    setLoading(true);
    try {
      // Si no puede editar estatus, nos aseguramos de enviar el que ya tenía (por seguridad)
      const dataToSend = canEditStatus
        ? formData
        : { ...formData, is_active: career.is_active };

      await updateCareer(career.id, dataToSend);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar cambios");
    } finally {
      setLoading(false);
    }
  };

  if (!career) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Editar Carrera
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {career.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Link de WhatsApp (SIEMPRE VISIBLE) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Enlace de Grupo de WhatsApp
            </label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                className="form-input pl-10 w-full"
                value={formData.whatsapp_url}
                onChange={(e) => setFormData({...formData, whatsapp_url: e.target.value})}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
                Pega aquí el enlace de invitación al grupo oficial.
            </p>
          </div>

          {/* Toggle Estatus (SOLO SI TIENE PERMISO) */}
          {canEditStatus && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/30">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Mostrar Carrera en Catálogo
                </span>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
          )}

          {/* Botones */}
          <div className="pt-2 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};