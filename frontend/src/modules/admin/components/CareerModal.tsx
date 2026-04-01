import { useState, useEffect } from 'react';
import { X, Save, Loader2, MessageCircle, Type, Link as LinkIcon } from 'lucide-react';
// Asegúrate de importar 'api' para poder hacer el POST
import { createCareer, updateCareer } from '../../../shared/services/api';
import type { Career } from '../../../shared/types';
import Swal from 'sweetalert2';

interface Props {
  career: Career | null;
  onClose: () => void;
  onSuccess: () => void;
  canEditStatus: boolean;
}

export const CareerModal = ({ career, onClose, onSuccess, canEditStatus }: Props) => {
  const [loading, setLoading] = useState(false);

  // Añadimos name y slug al estado inicial
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    whatsapp_url: '',
    is_active: true
  });

  // Si 'career' existe, estamos editando; si es null, estamos creando.
  const isEditing = !!career;

  useEffect(() => {
    if (career) {
      setFormData({
        name: career.name || '',
        slug: career.slug || '',
        whatsapp_url: career.whatsapp_url || '',
        is_active: career.is_active
      });
    }
  }, [career]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        // --- MODO EDICIÓN (PATCH) ---
        // Extraemos solo lo que se va a actualizar
        const updateData: any = {
            whatsapp_url: formData.whatsapp_url
        };

        // Si tiene permiso de Super Admin, enviamos el estatus y permitimos cambiar nombre/slug
        if (canEditStatus) {
            updateData.is_active = formData.is_active;
            updateData.name = formData.name;
            updateData.slug = formData.slug;
        }

        await updateCareer(career.id, updateData);

      } else {
        // --- MODO CREACIÓN (POST) ---
        await createCareer(formData);
      }

      Swal.fire({
        icon: 'success',
        title: isEditing ? 'Cambios guardados' : 'Carrera creada',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron guardar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para autogenerar el slug a partir del nombre (solo al crear)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!isEditing) {
        // Convierte "Ingeniería en Sistemas" a "ingenieria-en-sistemas"
        const autoSlug = newName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setFormData({ ...formData, name: newName, slug: autoSlug });
    } else {
        setFormData({ ...formData, name: newName });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Carrera' : 'Añadir Nueva Carrera'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {isEditing ? career.name : 'Completa los datos solicitados'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-700 dark:hover:text-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Formulario (Scrollable si es muy largo) */}
        <div className="overflow-y-auto custom-scrollbar p-6">
            <form id="career-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Nombre de la Carrera */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Nombre Oficial
                </label>
                <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    required
                    disabled={isEditing && !canEditStatus}
                    placeholder="Ej. Ingeniería en Sistemas..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 transition-all disabled:opacity-60"
                    value={formData.name}
                    onChange={handleNameChange}
                />
                </div>
            </div>

            {/* Slug (Identificador) */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Identificador (Slug)
                </label>
                <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    required
                    disabled={isEditing && !canEditStatus}
                    placeholder="ej. sistemas"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 transition-all font-mono text-sm disabled:opacity-60"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Usado para URLs y configuración interna.</p>
            </div>

            {/* Link de WhatsApp */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Enlace de Grupo de WhatsApp
                </label>
                <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    value={formData.whatsapp_url}
                    onChange={(e) => setFormData({...formData, whatsapp_url: e.target.value})}
                />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                    Pega aquí el enlace de invitación al grupo oficial.
                </p>
            </div>

            {/* Toggle Estatus (SOLO SI TIENE PERMISO) */}
            {canEditStatus && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 mt-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">
                        Mostrar Carrera en Catálogo
                    </span>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shadow-inner ${
                            formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                formData.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            )}

            </form>
        </div>

        {/* Footer / Botones */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex gap-3 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="career-form"
            disabled={loading}
            className="bg-guinda-600 hover:bg-guinda-700 text-white font-bold flex items-center gap-2 px-6 py-2 rounded-lg transition-all shadow-md shadow-guinda-900/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isEditing ? 'Guardar Cambios' : 'Crear Carrera'}
          </button>
        </div>

      </div>
    </div>
  );
};