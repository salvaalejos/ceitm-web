import { useState } from 'react';
import { Send, Upload, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
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
    type: 'Queja', // Valor por defecto
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
          <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6 animate-fade-in">
              <div className="card-base max-w-lg w-full p-10 text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Reporte Recibido!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                      Gracias por tu confianza. Tu reporte ha sido registrado y será revisado el próximo viernes.
                  </p>
                  <button onClick={() => window.location.href = '/'} className="btn-primary w-full">
                      Volver al Inicio
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

      {/* HEADER */}
      <div className="bg-slate-900 text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-guinda-600 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
        <div className="relative z-10 container mx-auto max-w-4xl">
            <span className="inline-block py-1 px-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">
                Tu Voz Cuenta
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Buzón de Quejas y Sugerencias</h1>
            <p className="text-slate-300 text-lg">
                Ayúdanos a mejorar. Tu reporte será tratado con seriedad y seguimiento.
            </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-6 -mt-8 relative z-20">
        <div className="card-base p-8 md:p-10 shadow-2xl">

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. DATOS PERSONALES */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-guinda-700 dark:text-guinda-400 border-b border-gray-100 dark:border-slate-800 pb-2">
                        1. Información del Estudiante
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="form-label">Nombre Completo</label>
                            <input name="full_name" required value={formData.full_name} onChange={handleChange} className="form-input" placeholder="Tu nombre" />
                        </div>
                        <div>
                            <label className="form-label">No. Control</label>
                            <input name="control_number" required value={formData.control_number} onChange={handleChange} className="form-input" placeholder="Ej. 19120145" />
                        </div>
                        <div>
                            <label className="form-label">No. Celular</label>
                            <input name="phone_number" required value={formData.phone_number} onChange={handleChange} className="form-input" placeholder="10 dígitos" />
                        </div>
                        <div>
                            <label className="form-label">Carrera</label>
                            <select name="career" required value={formData.career} onChange={handleChange} className="form-input">
                                <option value="">-- Selecciona --</option>
                                {CARRERAS.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Semestre</label>
                            <select name="semester" required value={formData.semester} onChange={handleChange} className="form-input">
                                <option value="">-- Selecciona --</option>
                                {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. DETALLE DEL REPORTE */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-guinda-700 dark:text-guinda-400 border-b border-gray-100 dark:border-slate-800 pb-2">
                        2. Detalle del Reporte
                    </h3>

                    <div>
                        <label className="form-label">¿Tienes una...?</label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                            {['Queja', 'Sugerencia', 'Ambas'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({...formData, type})}
                                    className={`py-3 px-4 rounded-xl border font-medium transition-all ${formData.type === type ? 'bg-guinda-600 text-white border-guinda-600 shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-guinda-500'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Escribe tu queja y/o sugerencia</label>
                        <p className="text-xs text-gray-500 mb-2">
                            De la forma más detallada posible (Ej. Prepotencia, Mala atención...). Opcional: Redactar posible solución.
                        </p>
                        <textarea
                            name="description"
                            required
                            value={formData.description}
                            onChange={handleChange}
                            className="form-input h-40 resize-none"
                            placeholder="Describe la situación aquí..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="form-label flex items-center gap-2">
                            Sube aquí tu evidencia <span className="text-xs text-gray-400 font-normal">(Opcional - Imagen)</span>
                        </label>
                        <div className="mt-2 flex items-center gap-4">
                            <label className={`cursor-pointer flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 hover:border-guinda-500 hover:text-guinda-600 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                                <span className="font-medium text-sm">{formData.evidence_url ? 'Cambiar Archivo' : 'Seleccionar Archivo'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                            {formData.evidence_url && (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle size={14} /> Archivo cargado
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. NOTAS INFORMATIVAS */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-6 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-amber-600 mt-1 shrink-0" size={20} />
                        <div className="text-sm text-amber-800 dark:text-amber-400 space-y-2 text-justify">
                            <p><strong>Nota Informativa:</strong> El buzón de quejas se estará revisando los viernes de cada semana.</p>
                            <p>La respuesta se estará haciendo llegar entre 1 a 5 días hábiles después de la revisión, dependiendo de la magnitud del problema emitido.</p>
                            <p>Si es un problema de interés común, también se estará presentando y respondiendo de manera general en el grupo de WhatsApp de la carrera.</p>
                            <p>Cualquier queja informal, favor de hacerla llegar por WhatsApp a tu concejal de confianza.</p>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading || uploading} className="btn-primary w-full py-4 text-lg shadow-lg flex items-center justify-center gap-2">
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