import React, { useState, useEffect } from 'react';
import {
  Send, Upload, CheckCircle, Loader2,
  Search, FileText, MessageSquare, Clock, Check, AlertTriangle, ArrowRight, Trash2
} from 'lucide-react';
// Quitamos uploadImage porque ya no se usa por separado
import { createComplaint, trackComplaint, getCareers } from '../../../shared/services/api';
import { type Complaint, ComplaintStatus, type Career } from '../../../shared/types';

const SEMESTRES = [
    "1er Semestre", "2do Semestre", "3er Semestre", "4to Semestre",
    "5to Semestre", "6to Semestre", "7mo Semestre", "8vo Semestre",
    "9no Semestre", "Otro"
];

// --- COMPONENTE: TIMELINE LIMPIO ---
const StatusTimeline = ({ status, created_at, resolved_at }: { status: ComplaintStatus, created_at: string, resolved_at?: string }) => {
    const steps = [
        { label: 'Enviado', completed: true, date: created_at },
        { label: 'En Revisión', completed: status !== ComplaintStatus.PENDIENTE, date: null },
        { label: status === ComplaintStatus.RECHAZADO ? 'Rechazado' : 'Resuelto', completed: status === ComplaintStatus.RESUELTO || status === ComplaintStatus.RECHAZADO, date: resolved_at }
    ];

    return (
        <div className="relative w-full py-6">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-slate-700 -z-10 -translate-y-1/2 rounded-full" />
            <div className="flex justify-between w-full">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center group">
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                            ${step.completed 
                                ? 'bg-guinda-600 border-guinda-50 dark:border-slate-800 text-white shadow-lg scale-110' 
                                : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-300'
                            }
                        `}>
                            {step.completed ? <Check size={16} strokeWidth={3} /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-slate-600" />}
                        </div>
                        <div className="mt-3 text-center">
                            <span className={`block text-xs md:text-sm font-bold transition-colors ${step.completed ? 'text-guinda-700 dark:text-guinda-400' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                            {step.date && (
                                <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                                    {new Date(step.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const BuzonPage = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'track'>('create');
  const [careersList, setCareersList] = useState<Career[]>([]);

  // --- ESTADOS: CREACIÓN ---
  const [loading, setLoading] = useState(false);
  const [successFolio, setSuccessFolio] = useState<string | null>(null);

  // NUEVO: Estado para el archivo seleccionado (sin subir aún)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    control_number: '',
    phone_number: '',
    email: '',
    career: '',
    semester: '',
    type: 'Queja',
    description: '',
    // evidence_url ya no se usa aquí, se manda el archivo directo
  });

  // --- ESTADOS: RASTREO ---
  const [searchFolio, setSearchFolio] = useState('');
  const [trackingResult, setTrackingResult] = useState<Complaint | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchCareers = async () => {
        try {
            const data = await getCareers();
            setCareersList(data.filter((c: Career) => c.is_active));
        } catch (error) { console.error(error); }
    };
    fetchCareers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NUEVO: Solo guarda el archivo en memoria, no lo sube todavía
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
      setSelectedFile(null);
  };

  // NUEVO: Submit con FormData para enviar texto + archivo juntos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const data = new FormData();
        // Agregamos todos los campos de texto
        data.append('full_name', formData.full_name);
        data.append('control_number', formData.control_number);
        data.append('phone_number', formData.phone_number);
        data.append('email', formData.email);
        data.append('career', formData.career);
        data.append('semester', formData.semester);
        data.append('type', formData.type);
        data.append('description', formData.description);

        // Agregamos el archivo SI existe
        // IMPORTANTE: 'evidencia' debe coincidir con lo que pusimos en el backend (complaints.py)
        if (selectedFile) {
            data.append('evidencia', selectedFile);
        }

        // createComplaint ahora acepta FormData (según editamos api.ts)
        const res = await createComplaint(data); // Asegúrate que createComplaint acepte "any" o "FormData" en api.ts

        setSuccessFolio(res.tracking_code || 'REGISTRADO');
        window.scrollTo(0, 0);

        // Limpieza
        setSelectedFile(null);
        setFormData({ ...formData, description: '' });

    } catch (error) {
        console.error(error);
        alert("Error al enviar el reporte. Verifica tu conexión.");
    } finally {
        setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFolio.trim()) return;
    setIsSearching(true);
    setTrackingError(null);
    setTrackingResult(null);
    try {
      const res = await trackComplaint(searchFolio.trim());
      setTrackingResult(res);
    } catch {
      setTrackingError("No encontramos este folio. Verifica que esté bien escrito (Ej: CEITM-2025-001).");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in transition-colors duration-300">

      {/* HEADER */}
      <div className="bg-slate-900 text-white pt-12 pb-24 px-4 md:py-16 md:px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-guinda-600 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="relative z-10 container mx-auto max-w-4xl">
            <span className="inline-block py-1 px-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">
                Transparencia Estudiantil
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Buzón Digital</h1>
            <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto">
                Un espacio seguro para reportar incidencias o dar seguimiento a tus solicitudes.
            </p>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="container mx-auto max-w-3xl px-4 md:px-6 -mt-16 relative z-20">
        <div className="card-base shadow-2xl dark:shadow-none dark:border dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">

            {/* SWITCH PESTAÑAS */}
            <div className="grid grid-cols-2 p-2 bg-gray-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                <button
                    onClick={() => { setActiveTab('create'); setSuccessFolio(null); }}
                    className={`py-3 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                        ${activeTab === 'create' 
                        ? 'bg-white dark:bg-slate-800 text-guinda-700 dark:text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <Send size={16} /> Nuevo Reporte
                </button>
                <button
                    onClick={() => setActiveTab('track')}
                    className={`py-3 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                        ${activeTab === 'track' 
                        ? 'bg-white dark:bg-slate-800 text-guinda-700 dark:text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <Search size={16} /> Rastrear Folio
                </button>
            </div>

            {/* CONTENIDO */}
            <div className="p-6 md:p-10">

                {/* === MODO 1: CREAR === */}
                {activeTab === 'create' && (
                    successFolio ? (
                        <div className="text-center py-10 animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Reporte Enviado!</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                                Tu folio de seguimiento ha sido generado. Guárdalo para consultar el estatus.
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl mb-8 border border-dashed border-slate-300 dark:border-slate-700 relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(successFolio)}>
                                <span className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Folio Único</span>
                                <span className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-wider">
                                    {successFolio}
                                </span>
                                <div className="absolute inset-0 bg-slate-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                    <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm">Copiar</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                 <button onClick={() => { setSuccessFolio(null); setFormData({ ...formData, description: ''}); setSelectedFile(null); }} className="btn-secondary">
                                    Nuevo Reporte
                                </button>
                                <button onClick={() => { setActiveTab('track'); setSearchFolio(successFolio); }} className="btn-primary px-8">
                                    Ver Estatus <ArrowRight size={16} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-lg bg-guinda-100 dark:bg-guinda-900/30 text-guinda-600 flex items-center justify-center font-bold">1</div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Datos del Estudiante</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="form-label">Nombre Completo</label>
                                        <input name="full_name" required value={formData.full_name} onChange={handleChange} className="form-input w-full" placeholder="Tu nombre" />
                                    </div>
                                    <div>
                                        <label className="form-label">No. Control</label>
                                        <input name="control_number" required value={formData.control_number} onChange={handleChange} className="form-input w-full" placeholder="Ej. 19120145" />
                                    </div>
                                    <div>
                                        <label className="form-label">Carrera</label>
                                        <select name="career" required value={formData.career} onChange={handleChange} className="form-input w-full">
                                            <option value="">Selecciona...</option>
                                            {careersList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="form-label">Correo Electrónico</label>
                                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="form-input w-full" placeholder="Para notificarte el estatus" />
                                    </div>
                                    <div>
                                        <label className="form-label">Teléfono</label>
                                        <input name="phone_number" required value={formData.phone_number} onChange={handleChange} className="form-input w-full" type="tel" />
                                    </div>
                                    <div>
                                        <label className="form-label">Semestre</label>
                                        <select name="semester" required value={formData.semester} onChange={handleChange} className="form-input w-full">
                                            <option value="">Selecciona...</option>
                                            {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-lg bg-guinda-100 dark:bg-guinda-900/30 text-guinda-600 flex items-center justify-center font-bold">2</div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalle del Reporte</h3>
                                </div>
                                <div>
                                    <label className="form-label mb-3 block">Tipo</label>
                                    <div className="flex gap-3">
                                        {['Queja', 'Sugerencia', 'Ambas'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({...formData, type})}
                                                className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all
                                                    ${formData.type === type 
                                                        ? 'border-guinda-600 bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-white' 
                                                        : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-gray-300 dark:hover:border-slate-600'
                                                    }
                                                `}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Descripción</label>
                                    <textarea name="description" required value={formData.description} onChange={handleChange} className="form-input w-full h-32 resize-none p-4" placeholder="Describe la situación..."></textarea>
                                </div>

                                {/* SECCIÓN DE EVIDENCIA ACTUALIZADA */}
                                <div>
                                    <label className="form-label mb-2 block">Evidencia (Opcional)</label>

                                    {!selectedFile ? (
                                        // Estado: Sin archivo
                                        <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-guinda-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all">
                                            <div className="flex flex-col items-center">
                                                <Upload className="text-gray-400 mb-1" />
                                                <span className="text-xs text-gray-500 font-medium">Click para subir foto o PDF</span>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} />
                                        </label>
                                    ) : (
                                        // Estado: Archivo seleccionado (Listo para enviar)
                                        <div className="flex items-center justify-between p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 rounded-xl">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-green-100">
                                                    <CheckCircle className="text-green-500" size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-green-700 dark:text-green-400 truncate">
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-xs text-green-600 dark:text-green-500">
                                                        {(selectedFile.size / 1024).toFixed(1)} KB - Listo para enviar
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : null}
                                {loading ? 'Enviando...' : 'Enviar Reporte'}
                            </button>
                        </form>
                    )
                )}

                {/* === MODO 2: RASTREAR === (Se mantiene igual, solo wrapper) */}
                {activeTab === 'track' && (
                    <div className="animate-fade-in flex flex-col items-center">
                        <div className="text-center mb-8 max-w-md">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rastrea tu Solicitud</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                Introduce el código que recibiste al registrar tu queja para ver el progreso y la respuesta oficial.
                            </p>
                        </div>

                        <form onSubmit={handleTrack} className="flex gap-2 mb-10 w-full max-w-md">
                            <input
                                type="text"
                                value={searchFolio}
                                onChange={(e) => setSearchFolio(e.target.value)}
                                placeholder="CEITM-2025-..."
                                className="form-input flex-1 text-center font-mono uppercase tracking-widest text-lg py-3"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white px-6 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                            </button>
                        </form>

                        {trackingError && (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 max-w-md w-full animate-fade-in">
                                <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
                                <p className="text-red-600 dark:text-red-400 font-medium">{trackingError}</p>
                            </div>
                        )}

                        {trackingResult && (
                            <div className="w-full max-w-2xl bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 animate-fade-in-up">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 dark:border-slate-700">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Folio</span>
                                        <h3 className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{trackingResult.tracking_code}</h3>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                        trackingResult.status === 'Resuelto' ? 'bg-green-100 text-green-700 border-green-200' :
                                        trackingResult.status === 'Rechazado' ? 'bg-red-100 text-red-700 border-red-200' :
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                        {trackingResult.status}
                                    </div>
                                </div>

                                <StatusTimeline
                                    status={trackingResult.status}
                                    created_at={trackingResult.created_at}
                                    resolved_at={trackingResult.resolved_at}
                                />

                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                                        <MessageSquare size={16} className="text-guinda-600" /> Respuesta del Consejo
                                    </h4>

                                    {trackingResult.admin_response ? (
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-l-4 border-l-guinda-500 border-gray-100 dark:border-slate-700 shadow-sm">
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                                "{trackingResult.admin_response}"
                                            </p>

                                            {trackingResult.resolution_evidence_url && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                                    <a
                                                        href={trackingResult.resolution_evidence_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        <FileText size={16} />
                                                        Ver Evidencia Adjunta
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 opacity-70">
                                            <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">Tu reporte sigue en proceso de revisión.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};