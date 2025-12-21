import { useState } from 'react';
import { Send, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { createComplaint, uploadImage } from '../../../shared/services/api';
import { CARRERAS } from '../../../shared/constants/carreras';

const SEMESTRES = [
    "1er Semestre", "2do Semestre", "3er Semestre", "4to Semestre",
    "5to Semestre", "6to Semestre", "7mo Semestre", "8vo Semestre",
    "9no Semestre", "Otro"
];

export const BuzonPage = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    control_number: '',
    phone_number: '',
    career: '',
    semester: '',
    type: 'Queja',
    description: '',
    evidence_url: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const url = await uploadImage(file);
        setFormData(prev => ({ ...prev, evidence_url: url }));
    } catch (error) {
        console.error(error);
        alert("Error al subir evidencia. Intenta con un archivo más ligero.");
    } finally {
        setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await createComplaint(formData);
        setSuccess(true);
        window.scrollTo(0, 0);
    } catch (error) {
        console.error(error);
        alert("Hubo un error al enviar tu reporte. Inténtalo de nuevo.");
    } finally {
        setLoading(false);
    }
  };

  if (success) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 animate-fade-in">
              <div className="card-base max-w-lg w-full p-8 md:p-10 text-center shadow-2xl dark:shadow-none border dark:border-slate-800">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Reporte Recibido!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm md:text-base">
                      Gracias por tu confianza. Tu reporte ha sido registrado y será revisado el próximo viernes.
                  </p>
                  <button onClick={() => window.location.href = '/'} className="btn-primary w-full shadow-lg">
                      Volver al Inicio
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

      {/* HEADER: Ajustado padding y altura para móvil */}
      <div className="bg-slate-900 text-white pt-12 pb-20 px-4 md:py-16 md:px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-guinda-600 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 md:-mr-20 md:-mt-20 pointer-events-none"></div>
        <div className="relative z-10 container mx-auto max-w-4xl">
            <span className="inline-block py-1 px-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">
                Tu Voz Cuenta
            </span>
            <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight">Buzón de Quejas y Sugerencias</h1>
            <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto px-2">
                Ayúdanos a mejorar. Tu reporte será tratado con seriedad y seguimiento por parte del Consejo Estudiantil.
            </p>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: Ajuste de márgenes y padding para evitar cortes */}
      <div className="container mx-auto max-w-3xl px-4 md:px-6 -mt-12 md:-mt-10 relative z-20">
        <div className="card-base p-6 md:p-10 shadow-2xl dark:shadow-none dark:border dark:border-slate-800">

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

                {/* 1. DATOS PERSONALES */}
                <div className="space-y-5 md:space-y-6">
                    <h3 className="text-lg font-bold text-guinda-700 dark:text-guinda-400 border-b border-gray-100 dark:border-slate-800 pb-2">
                        1. Información del Estudiante
                    </h3>

                    {/* GRID RESPONSIVO: 1 columna en móvil, 2 en escritorio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        {/* Usamos flex-col gap-1.5 en cada campo para evitar superposición */}
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                            <label className="form-label">Nombre Completo</label>
                            <input name="full_name" required value={formData.full_name} onChange={handleChange} className="form-input w-full" placeholder="Tu nombre completo" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">No. Control</label>
                            <input name="control_number" required value={formData.control_number} onChange={handleChange} className="form-input w-full" placeholder="Ej. 19120145" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">No. Celular</label>
                            <input name="phone_number" required value={formData.phone_number} onChange={handleChange} className="form-input w-full" placeholder="10 dígitos" type="tel" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">Carrera</label>
                            <select name="career" required value={formData.career} onChange={handleChange} className="form-input w-full">
                                <option value="" className="dark:bg-slate-900">-- Selecciona --</option>
                                {CARRERAS.map(c => (
                                    <option key={c.id} value={c.nombre} className="dark:bg-slate-900">
                                        {c.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">Semestre</label>
                            <select name="semester" required value={formData.semester} onChange={handleChange} className="form-input w-full">
                                <option value="" className="dark:bg-slate-900">-- Selecciona --</option>
                                {SEMESTRES.map(s => (
                                    <option key={s} value={s} className="dark:bg-slate-900">
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. DETALLE DEL REPORTE */}
                <div className="space-y-5 md:space-y-6">
                    <h3 className="text-lg font-bold text-guinda-700 dark:text-guinda-400 border-b border-gray-100 dark:border-slate-800 pb-2">
                        2. Detalle del Reporte
                    </h3>

                    <div className="flex flex-col gap-2">
                        <label className="form-label">¿Qué deseas enviar?</label>
                        <div className="grid grid-cols-3 gap-2 md:gap-4 mt-1">
                            {['Queja', 'Sugerencia', 'Ambas'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({...formData, type})}
                                    className={`
                                        py-2 md:py-3 px-2 rounded-xl border font-medium text-sm md:text-base transition-all duration-200
                                        ${formData.type === type 
                                            ? 'bg-guinda-600 text-white border-guinda-600 shadow-lg shadow-guinda-900/20' 
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-guinda-500 dark:hover:border-guinda-500'
                                        }
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="form-label">Descripción</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Por favor detalla la situación (Ej. Prepotencia, Mala atención, Instalaciones).
                        </p>
                        <textarea
                            name="description"
                            required
                            value={formData.description}
                            onChange={handleChange}
                            className="form-input w-full h-32 md:h-40 resize-none p-3"
                            placeholder="Escribe aquí los detalles..."
                        ></textarea>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="form-label flex items-center gap-2">
                            Evidencia <span className="text-xs text-gray-400 font-normal">(Opcional - Imagen)</span>
                        </label>

                        <label className={`
                            group cursor-pointer flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 
                            p-5 md:p-6 rounded-xl border-2 border-dashed transition-all duration-300
                            ${uploading 
                                ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 opacity-70 pointer-events-none' 
                                : 'bg-gray-50 dark:bg-slate-800/50 border-gray-300 dark:border-slate-700 hover:border-guinda-500 dark:hover:border-guinda-500 hover:bg-guinda-50 dark:hover:bg-guinda-900/10'
                            }
                        `}>
                            <div className={`
                                p-3 rounded-full transition-colors shrink-0
                                ${uploading 
                                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-400' 
                                    : 'bg-white dark:bg-slate-700 text-guinda-600 dark:text-guinda-400 shadow-sm group-hover:scale-110 group-hover:bg-guinda-600 group-hover:text-white'
                                }
                            `}>
                                {uploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                            </div>

                            <div className="text-center md:text-left">
                                <span className={`font-semibold block text-sm md:text-base ${uploading ? 'text-gray-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-guinda-700 dark:group-hover:text-guinda-400'}`}>
                                    {uploading ? 'Subiendo archivo...' : (formData.evidence_url ? 'Cambiar archivo seleccionado' : 'Toca para seleccionar archivo')}
                                </span>
                                {!uploading && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 block mt-1">
                                        Formatos: JPG, PNG (Máx 5MB)
                                    </span>
                                )}
                            </div>

                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>

                        {formData.evidence_url && !uploading && (
                            <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg w-fit animate-fade-in">
                                <CheckCircle size={14} />
                                <span>Evidencia cargada</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. NOTAS INFORMATIVAS */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 md:p-6 rounded-xl flex items-start gap-3 md:gap-4">
                    <AlertCircle className="text-amber-600 dark:text-amber-500 mt-1 shrink-0 w-5 h-5 md:w-6 md:h-6" />
                    <div className="text-xs md:text-sm text-amber-800 dark:text-amber-400 space-y-2 text-justify leading-relaxed">
                        <p><strong>Nota Informativa:</strong> El buzón de quejas se revisa todos los viernes.</p>
                        <p>La respuesta se emitirá entre 1 a 5 días hábiles posteriores a la revisión.</p>
                        <p>Los temas de interés común se publicarán en el grupo de WhatsApp de la carrera.</p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="btn-primary w-full py-3 md:py-4 text-base md:text-lg shadow-lg shadow-guinda-900/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform active:scale-95"
                >
                    {loading ? 'Enviando...' : (
                        <>Enviar Reporte <Send size={20} /></>
                    )}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
};