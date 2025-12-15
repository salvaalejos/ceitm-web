import { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash } from 'lucide-react';
import { createConvenio, updateConvenio, uploadImage } from '../../../shared/services/api';
import type { Convenio } from '../../../shared/types'; // Asegúrate de importar el tipo

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  convenioToEdit?: Convenio | null; // <--- NUEVA PROP
}

export const ConvenioForm = ({ onClose, onSuccess, convenioToEdit }: Props) => {
  const [loading, setLoading] = useState(false);

  // Estado inicial dinámico
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    categoria: 'Comida',
    direccion: '',
    imagen_url: '',
    beneficios: [''] as string[],
    social_links: { facebook: '', instagram: '', web: '' }
  });

  // EFECTO: Si hay convenio para editar, llenamos el formulario al abrir
  useEffect(() => {
    if (convenioToEdit) {
      setFormData({
        nombre: convenioToEdit.nombre,
        descripcion_corta: convenioToEdit.descripcion_corta,
        descripcion_larga: convenioToEdit.descripcion_larga,
        categoria: convenioToEdit.categoria,
        direccion: convenioToEdit.direccion || '',
        imagen_url: convenioToEdit.imagen_url,
        beneficios: convenioToEdit.beneficios.length > 0 ? convenioToEdit.beneficios : [''],
        social_links: {
            facebook: convenioToEdit.social_links?.facebook || '',
            instagram: convenioToEdit.social_links?.instagram || '',
            web: convenioToEdit.social_links?.web || ''
        }
      });
    }
  }, [convenioToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSocialChange = (network: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        social_links: { ...prev.social_links, [network]: value }
    }));
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

  const handleBeneficioChange = (index: number, value: string) => {
    const newBeneficios = [...formData.beneficios];
    newBeneficios[index] = value;
    setFormData({ ...formData, beneficios: newBeneficios });
  };

  const addBeneficio = () => setFormData({ ...formData, beneficios: [...formData.beneficios, ''] });

  const removeBeneficio = (index: number) => {
    const newBeneficios = formData.beneficios.filter((_, i) => i !== index);
    setFormData({ ...formData, beneficios: newBeneficios });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const dataToSend = {
            ...formData,
            beneficios: formData.beneficios.filter(b => b.trim() !== '')
        };

        // LÓGICA DE EDICIÓN VS CREACIÓN
        if (convenioToEdit) {
            await updateConvenio(convenioToEdit.id, dataToSend);
        } else {
            await createConvenio(dataToSend);
        }

        onSuccess();
        onClose();
    } catch (error) {
        console.error(error);
        alert('Error guardando convenio');
    } finally {
        setLoading(false);
    }
  };

  // --- ESTILOS REUTILIZABLES ---
  const inputStyle = "w-full px-4 py-3 rounded-xl border border-gray-300 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-guinda-500 focus:border-transparent outline-none transition-all text-gray-700 dark:text-gray-200";
  const labelStyle = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide text-xs";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
            <div>
                {/* Título Dinámico */}
                <h2 className="text-2xl font-bold text-guinda-600">
                    {convenioToEdit ? 'Editar Convenio' : 'Nuevo Convenio'}
                </h2>
                <p className="text-sm text-gray-500">
                    {convenioToEdit ? 'Modifica los datos del aliado.' : 'Completa la información del aliado.'}
                </p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X />
            </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">

            {/* SECCIÓN 1: DATOS GENERALES */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelStyle}>Nombre del Negocio</label>
                        <input name="nombre" value={formData.nombre} placeholder="Ej. Tacos El Inge" className={inputStyle} required onChange={handleChange} />
                    </div>
                    <div>
                        <label className={labelStyle}>Categoría</label>
                        <div className="relative">
                            <select name="categoria" value={formData.categoria} className={`${inputStyle} appearance-none cursor-pointer`} onChange={handleChange}>
                                <option>Comida</option>
                                <option>Salud</option>
                                <option>Tecnología</option>
                                <option>Educación</option>
                                <option>Entretenimiento</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className={labelStyle}>Flyer Promocional</label>
                    <div className="flex items-center gap-6 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        {formData.imagen_url ? (
                            <img src={formData.imagen_url} alt="Preview" className="h-24 w-24 object-cover rounded-lg shadow-sm" />
                        ) : (
                            <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                Sin imagen
                            </div>
                        )}
                        <div>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all shadow-md">
                                <Upload size={18} />
                                {loading ? 'Subiendo...' : 'Cambiar Imagen'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                            <p className="text-xs text-gray-400 mt-2">Recomendado: Formato vertical .JPG o .PNG</p>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* SECCIÓN 2: DETALLES */}
            <div className="space-y-6">
                <div>
                    <label className={labelStyle}>Descripción Corta (Tarjeta)</label>
                    <input name="descripcion_corta" value={formData.descripcion_corta} placeholder="Resumen breve (máx 100 caracteres)" className={inputStyle} maxLength={100} required onChange={handleChange} />
                </div>
                <div>
                    <label className={labelStyle}>Descripción Completa</label>
                    <textarea
                        name="descripcion_larga"
                        value={formData.descripcion_larga}
                        placeholder="Detalla todo sobre el negocio, historia, etc..."
                        className={`${inputStyle} min-h-[120px] resize-y`}
                        required
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className={labelStyle}>Dirección</label>
                    <input name="direccion" value={formData.direccion} placeholder="Calle, Número y Colonia" className={inputStyle} onChange={handleChange} />
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* SECCIÓN 3: BENEFICIOS */}
            <div>
                <label className={labelStyle}>Lista de Beneficios</label>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl space-y-3">
                    {formData.beneficios.map((ben, index) => (
                        <div key={index} className="flex gap-3 items-center group">
                            <span className="text-guinda-500 font-bold text-lg">•</span>
                            <input
                                value={ben}
                                onChange={(e) => handleBeneficioChange(index, e.target.value)}
                                className={`${inputStyle} py-2 bg-white`}
                                placeholder="Ej: 15% de descuento en consumo total"
                            />
                            {formData.beneficios.length > 1 && (
                                <button type="button" onClick={() => removeBeneficio(index)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addBeneficio} className="mt-2 text-sm text-guinda-600 font-bold flex items-center gap-2 hover:bg-guinda-50 px-3 py-2 rounded-lg transition-colors">
                        <Plus size={18} /> Agregar otro beneficio
                    </button>
                </div>
            </div>

            {/* SECCIÓN 4: REDES */}
            <div>
                <label className={labelStyle}>Redes Sociales (Opcional)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input name="facebook" value={formData.social_links.facebook} placeholder="Facebook URL" className={inputStyle} onChange={e => handleSocialChange('facebook', e.target.value)} />
                    <input name="instagram" value={formData.social_links.instagram} placeholder="Instagram URL" className={inputStyle} onChange={e => handleSocialChange('instagram', e.target.value)} />
                    <input name="web" value={formData.social_links.web} placeholder="Sitio Web" className={inputStyle} onChange={e => handleSocialChange('web', e.target.value)} />
                </div>
            </div>

        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
            <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-white hover:shadow-sm rounded-xl transition-all">
                Cancelar
            </button>
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-guinda-600 hover:bg-guinda-700 text-white font-bold rounded-xl shadow-lg shadow-guinda-200/50 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Guardando...' : (convenioToEdit ? 'Guardar Cambios' : 'Crear Convenio')}
            </button>
        </div>
      </div>
    </div>
  );
};