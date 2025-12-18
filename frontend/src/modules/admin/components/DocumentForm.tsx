import { useState } from 'react';
import { X, Upload, Save, FileText, Lock, Globe } from 'lucide-react';
import { createDocument, uploadFile } from '../../../shared/services/api';

const CATEGORIAS = [
    "Financiero",
    "Legal y Normativo",
    "Actas y Acuerdos",
    "Convocatorias",
    "Otros"
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentForm = ({ onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);

  // Estado para guardar el archivo EN MEMORIA antes de subirlo
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '', // Esta se llenará solita al final
    category: 'Legal y Normativo',
    is_public: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: val });
  };

  // 1. SOLO SELECCIONAR (No subir todavía)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
    }

    // Guardamos el archivo en memoria para mostrar el nombre
    setFileToUpload(file);
    // Limpiamos el input para permitir seleccionar el mismo archivo si se quita y pone
    e.target.value = '';
  };

  // 2. FUNCIÓN PARA QUITAR ARCHIVO SELECCIONADO
  const removeFile = () => {
    setFileToUpload(null);
  };

  // 3. SUBIR Y GUARDAR AL FINAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileToUpload) {
        alert("Debes seleccionar un archivo PDF");
        return;
    }

    setLoading(true);
    try {
        // PASO A: Subir el archivo ahora sí
        const url = await uploadFile(fileToUpload);

        // PASO B: Crear el registro en la BD con la URL que nos devolvió el servidor
        await createDocument({
            ...formData,
            file_url: url
        });

        onSuccess();
        onClose();
    } catch (error) {
        console.error(error);
        alert('Error al procesar el documento');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-base w-full max-w-2xl flex flex-col animate-fade-in">

        <div className="modal-header">
            <h2 className="text-xl font-bold text-guinda-600 dark:text-guinda-500 flex items-center gap-2">
                <FileText size={24} /> Subir Documento
            </h2>
            <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">

            {/* ZONA DE ARCHIVO (Lógica Nueva) */}
            <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors ${fileToUpload ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950/50 hover:bg-gray-100'}`}>

                {fileToUpload ? (
                    <div className="text-center w-full relative">
                        {/* Botón X para quitar archivo */}
                        <button
                            type="button"
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 p-1 bg-white dark:bg-slate-800 text-red-500 rounded-full shadow-md hover:bg-red-50 border border-gray-200"
                            title="Quitar archivo"
                        >
                            <X size={16} />
                        </button>

                        <FileText size={48} className="text-red-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate px-4">
                            {fileToUpload.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB • Listo para subir
                        </p>
                    </div>
                ) : (
                    <label className="cursor-pointer text-center w-full h-full block">
                        <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-500 font-medium">Click para seleccionar PDF</span>
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
                    </label>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="form-label">Título del Documento</label>
                    <input name="title" value={formData.title} onChange={handleChange} required className="form-input" placeholder="Ej. Informe Financiero Enero 2025" />
                </div>

                <div className="col-span-2">
                    <label className="form-label">Descripción (Opcional)</label>
                    <input name="description" value={formData.description} onChange={handleChange} className="form-input" placeholder="Breve descripción del contenido..." />
                </div>

                <div>
                    <label className="form-label">Categoría</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="form-input cursor-pointer">
                        {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div>
                    <label className="form-label">Visibilidad</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 ${formData.is_public ? 'border-guinda-500 bg-guinda-50 dark:bg-guinda-900/20 text-guinda-700 dark:text-guinda-400 font-bold' : 'border-gray-200 dark:border-slate-700 opacity-60'}`}>
                            <input type="radio" name="is_public" className="hidden" checked={formData.is_public} onChange={() => setFormData({...formData, is_public: true})} />
                            <Globe size={18} /> Público
                        </label>
                        <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 ${!formData.is_public ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold' : 'border-gray-200 dark:border-slate-700 opacity-60'}`}>
                            <input type="radio" name="is_public" className="hidden" checked={!formData.is_public} onChange={() => setFormData({...formData, is_public: false})} />
                            <Lock size={18} /> Privado
                        </label>
                    </div>
                </div>
            </div>

        </form>

        <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
                <Save size={18} /> {loading ? 'Subiendo...' : 'Guardar Documento'}
            </button>
        </div>

      </div>
    </div>
  );
};