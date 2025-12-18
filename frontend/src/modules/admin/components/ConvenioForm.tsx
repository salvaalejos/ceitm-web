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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-base w-full max-w-3xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header */}
        <div className="modal-header">
            <div>
                <h2 className="text-xl font-bold text-guinda-600 dark:text-guinda-500">
                    {convenioToEdit ? 'Editar Convenio' : 'Nuevo Convenio'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Datos del aliado comercial.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><X /></button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">

            {/* SECCIÓN 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="form-label">Nombre del Negocio</label>
                    <input name="nombre" value={formData.nombre} className="form-input" required onChange={handleChange} />
                </div>
                <div>
                    <label className="form-label">Categoría</label>
                    <select name="categoria" value={formData.categoria} className="form-input cursor-pointer" onChange={handleChange}>
                        <option>Comida</option>
                        <option>Salud</option>
                        <option>Tecnología</option>
                        <option>Educación</option>
                        <option>Entretenimiento</option>
                    </select>
                </div>
            </div>

            {/* Imagen */}
            <div>
                <label className="form-label">Flyer Promocional</label>
                <div className="flex items-center gap-6 p-4 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950/50">
                    {formData.imagen_url ? (
                        <img src={formData.imagen_url} alt="Preview" className="h-20 w-20 object-cover rounded-lg shadow-sm" />
                    ) : (
                        <div className="h-20 w-20 bg-gray-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-gray-500">Sin img</div>
                    )}
                    <label className="btn-secondary cursor-pointer flex items-center gap-2 text-sm py-2">
                        <Upload size={16} /> Subir
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                </div>
            </div>

            {/* SECCIÓN 2 */}
            <div className="space-y-6">
                <div>
                    <label className="form-label">Descripción Corta</label>
                    <input name="descripcion_corta" value={formData.descripcion_corta} className="form-input" maxLength={100} required onChange={handleChange} />
                </div>
                <div>
                    <label className="form-label">Descripción Larga</label>
                    <textarea
                        name="descripcion_larga"
                        value={formData.descripcion_larga}
                        className="form-input min-h-[100px] resize-y"
                        required
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* BENEFICIOS */}
            <div>
                <label className="form-label">Lista de Beneficios</label>
                <div className="space-y-3">
                    {formData.beneficios.map((ben, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                value={ben}
                                onChange={(e) => handleBeneficioChange(index, e.target.value)}
                                className="form-input py-2"
                                placeholder="Ej: 15% de descuento..."
                            />
                            {formData.beneficios.length > 1 && (
                                <button type="button" onClick={() => removeBeneficio(index)} className="text-gray-400 hover:text-red-500 p-2">
                                    <Trash size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addBeneficio} className="text-sm text-guinda-600 font-bold hover:underline flex items-center gap-1 mt-2">
                        <Plus size={16} /> Agregar otro beneficio
                    </button>
                </div>
            </div>

            {/* REDES - Grid de 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* ...inputs de redes usando className="form-input"... */}
                 <input name="facebook" value={formData.social_links.facebook} placeholder="Facebook" className="form-input" onChange={e => handleSocialChange('facebook', e.target.value)} />
                 <input name="instagram" value={formData.social_links.instagram} placeholder="Instagram" className="form-input" onChange={e => handleSocialChange('instagram', e.target.value)} />
                 <input name="web" value={formData.social_links.web} placeholder="Sitio Web" className="form-input" onChange={e => handleSocialChange('web', e.target.value)} />
            </div>

        </form>

        {/* Footer */}
        <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                {loading ? 'Guardando...' : 'Guardar Convenio'}
            </button>
        </div>
      </div>
    </div>
  );
};