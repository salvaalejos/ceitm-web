import { useState, useEffect } from 'react';
import { X, Upload, Save, FileText, Youtube, Tag } from 'lucide-react';
import { createNews, updateNews, uploadImage } from '../../../shared/services/api';
import { COORDINACIONES } from '../../../shared/constants/coordinaciones';

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  imagen_url: string;
  video_url: string;
  category: string;
  is_published: boolean;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  newsToEdit?: NewsItem | null;
}

export const NewsForm = ({ onClose, onSuccess, newsToEdit }: Props) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    imagen_url: '',
    video_url: '',
    category: 'GENERAL',
    is_published: true
  });

  useEffect(() => {
    if (newsToEdit) {
      setFormData({
        title: newsToEdit.title,
        excerpt: newsToEdit.excerpt,
        content: newsToEdit.content,
        imagen_url: newsToEdit.imagen_url || '',
        video_url: newsToEdit.video_url || '',
        category: newsToEdit.category || 'GENERAL',
        is_published: newsToEdit.is_published
      });
    }
  }, [newsToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: val });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
        const url = await uploadImage(file);
        setFormData(prev => ({ ...prev, imagen_url: url }));
    } catch (error) {
        alert('Error subiendo imagen');
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (newsToEdit) {
            await updateNews(newsToEdit.id, formData);
        } else {
            await createNews(formData);
        }
        onSuccess();
        onClose();
    } catch (error) {
        console.error(error);
        alert('Error guardando noticia');
    } finally {
        setLoading(false);
    }
  };

  const categoriesOptions = COORDINACIONES.filter(
      c => c.type === 'directiva' || c.type === 'operativa'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-base w-full max-w-4xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header */}
        <div className="modal-header">
            <h2 className="text-xl font-bold text-guinda-600 dark:text-guinda-500 flex items-center gap-2">
                <FileText size={24} />
                {newsToEdit ? 'Editar Noticia' : 'Redactar Noticia'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><X /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">

            {/* 1. Título y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Título */}
                <div className="md:col-span-2">
                    <label className="form-label">Título de la Noticia</label>
                    <input name="title" value={formData.title} onChange={handleChange} required className="form-input text-lg font-bold" placeholder="Ej. ¡Bienvenidos al Semestre 2026!" />
                </div>

                {/* Categoría */}
                <div>
                    <label className="form-label flex items-center gap-2">
                        <Tag size={16} className="text-guinda-600" /> Categoría
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="form-input font-medium cursor-pointer"
                    >
                        <option value="GENERAL">📢 General / Institucional</option>
                        {categoriesOptions.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Video */}
                <div className="md:col-span-3">
                    <label className="form-label flex items-center gap-2">
                        <Youtube size={16} className="text-red-600" /> Link de Video (Opcional)
                    </label>
                    <input
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Ej. https://www.facebook.com/watch/?v=..."
                    />
                </div>
            </div>

            {/* 2. Imagen Principal */}
            <div>
                <label className="form-label">Imagen de Portada</label>
                <div className="flex items-center gap-6 p-4 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950/50">
                    {formData.imagen_url ? (
                        <img src={formData.imagen_url} alt="Preview" className="h-32 w-auto object-cover rounded-lg shadow-sm" />
                    ) : (
                        <div className="h-32 w-32 bg-gray-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-gray-400">
                            <FileText size={32} />
                        </div>
                    )}
                    <div>
                        <label className="btn-secondary cursor-pointer flex items-center gap-2">
                            <Upload size={18} /> Subir Imagen
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">Recomendado: 1200x630px (Horizontal)</p>
                    </div>
                </div>
            </div>

            {/* 3. Contenido Texto */}
            <div className="space-y-6">
                <div>
                    <label className="form-label">Resumen (Excerpt)</label>
                    <textarea
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleChange}
                        maxLength={200}
                        required
                        className="form-input h-24 resize-none"
                        placeholder="Breve introducción que aparecerá en la tarjeta de la noticia..."
                    />
                </div>
                <div>
                    <label className="form-label">Contenido Completo</label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        className="form-input min-h-[300px] font-sans leading-relaxed"
                        placeholder="Escribe aquí toda la noticia. Puedes usar saltos de línea..."
                    />
                </div>
            </div>

            {/* 4. Estado */}
            <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 cursor-pointer hover:border-guinda-500/30 transition-colors">
                    <input
                        type="checkbox"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleChange}
                        className="w-5 h-5 text-guinda-600 rounded focus:ring-guinda-500 accent-guinda-600"
                    />
                    <span className="form-check-label">
                        Publicar inmediatamente
                    </span>
                </label>
            </div>

        </form>

        {/* Footer */}
        <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
                {/* 👇 CAMBIO: Texto actualizado */}
                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Noticia'}
            </button>
        </div>

      </div>
    </div>
  );
};