import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Home, FileText, Upload, CheckCircle,
    ArrowRight, ArrowLeft, AlertCircle, Loader2, Trash2, FileCheck
} from 'lucide-react';
import { getScholarships, submitScholarshipApplication, uploadFile } from '../../../shared/services/api';
import type {Scholarship} from '../../../shared/types';
import { CARRERAS } from '../../../shared/constants/carreras';

const STEPS = [
    { id: 1, title: 'Datos Personales', icon: User },
    { id: 2, title: 'Socioeconómico', icon: Home },
    { id: 3, title: 'Académico y Motivos', icon: FileText },
    { id: 4, title: 'Documentación', icon: Upload }
];

export const SolicitudPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [scholarship, setScholarship] = useState<Scholarship | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    // ESTADOS DE CARGA
    const [submitting, setSubmitting] = useState(false);
    const [uploadingInfo, setUploadingInfo] = useState<string>(''); // Mensaje: "Subiendo INE..."

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 📂 AQUÍ GUARDAMOS LOS ARCHIVOS EN MEMORIA (Aún no subidos)
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

    // ESTADO DEL FORMULARIO
    const [formData, setFormData] = useState({
        full_name: '', email: '', control_number: '', phone_number: '',
        career: '', semester: '',
        cle_control_number: '', level_to_enter: '',
        address: '', origin_address: '',
        economic_dependence: 'Padres', dependents_count: 0,
        family_income: 0, income_per_capita: 0,
        previous_scholarship: 'No', activities: '', motivos: '',
        // Las URLs se llenarán al final
        doc_request: '', doc_motivos: '', doc_address: '', doc_income: '',
        doc_ine: '', doc_school_id: '', doc_schedule: '', doc_extra: ''
    });

    useEffect(() => {
        const loadBeca = async () => {
            try {
                const becas = await getScholarships();
                const found = becas.find(b => b.id === Number(id));
                if (found) setScholarship(found);
                else navigate('/becas');
            } catch (e) {
                console.error(e);
            }
        };
        loadBeca();
    }, [id, navigate]);

    useEffect(() => {
        if (formData.family_income > 0 && formData.dependents_count > 0) {
            setFormData(prev => ({
                ...prev,
                income_per_capita: parseFloat((prev.family_income / prev.dependents_count).toFixed(2))
            }));
        }
    }, [formData.family_income, formData.dependents_count]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 1. SELECCIONAR (Solo guarda en memoria, NO SUBE)
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFiles(prev => ({ ...prev, [fieldName]: file }));
    };

    // 2. ELIMINAR (Quita de memoria)
    const handleRemoveFile = (fieldName: string) => {
        setSelectedFiles(prev => {
            const newState = { ...prev };
            delete newState[fieldName];
            return newState;
        });
    };

    // 3. PROCESO FINAL (Sube Archivos -> Envía Datos)
    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        setUploadingInfo('Preparando archivos...');

        try {
            // Copia de datos para inyectar URLs
            let finalData = { ...formData };

            // A) SUBIR ARCHIVOS UNO POR UNO
            const fileKeys = Object.keys(selectedFiles);

            for (const key of fileKeys) {
                const file = selectedFiles[key];
                // Actualizar mensaje visual
                setUploadingInfo(`Subiendo ${key.replace('doc_', '').toUpperCase()}...`);

                // Llamada real al backend
                const url = await uploadFile(file);
                finalData = { ...finalData, [key]: url };
            }

            setUploadingInfo('Registrando solicitud...');

            // B) ENVIAR FORMULARIO FINAL
            await submitScholarshipApplication({
                ...finalData,
                scholarship_id: Number(id),
                dependents_count: Number(finalData.dependents_count),
                family_income: Number(finalData.family_income),
                income_per_capita: Number(finalData.income_per_capita)
            });

            setSuccess(true);
            window.scrollTo(0,0);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Hubo un error al enviar tu solicitud. Verifica tu conexión.");
        } finally {
            setSubmitting(false);
            setUploadingInfo('');
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6 animate-fade-in">
                <div className="card-base max-w-lg w-full p-10 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Solicitud Enviada!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Tu trámite ha sido registrado correctamente con toda tu documentación.
                    </p>
                    <button onClick={() => navigate('/becas')} className="btn-primary w-full">Volver a Becas</button>
                </div>
            </div>
        );
    }

    if (!scholarship) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 pt-10 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* HEADER */}
                <div className="mb-8">
                    <button onClick={() => navigate('/becas')} className="text-gray-500 hover:text-guinda-600 mb-4 flex items-center gap-1 text-sm">
                        <ArrowLeft size={16} /> Volver a convocatorias
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{scholarship.name}</h1>
                </div>

                {/* INDICADOR DE PASOS */}
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded"></div>
                    {STEPS.map((step) => (
                        <div key={step.id} className={`flex flex-col items-center gap-2 bg-gray-50 dark:bg-slate-950 px-2 ${currentStep >= step.id ? 'text-guinda-600 dark:text-guinda-400' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= step.id ? 'border-guinda-600 bg-guinda-50 dark:bg-guinda-900/20' : 'border-gray-300 bg-white dark:bg-slate-800'}`}>
                                <step.icon size={18} />
                            </div>
                            <span className="text-xs font-bold hidden md:block">{step.title}</span>
                        </div>
                    ))}
                </div>

                {/* TARJETA FORMULARIO */}
                <div className="card-base p-6 md:p-10 shadow-xl animate-fade-in">

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}

                    {/* PASO 1: PERSONALES */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2 dark:border-slate-800">1. Información del Estudiante</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="form-label">Nombre Completo</label>
                                    <input name="full_name" value={formData.full_name} onChange={handleChange} className="form-input" />
                                </div>
                                <div>
                                    <label className="form-label">Correo Institucional</label>
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} className="form-input" />
                                </div>
                                <div>
                                    <label className="form-label">Número de Control</label>
                                    <input name="control_number" value={formData.control_number} onChange={handleChange} className="form-input" />
                                </div>
                                <div>
                                    <label className="form-label">Carrera</label>
                                    <select name="career" value={formData.career} onChange={handleChange} className="form-input">
                                        <option value="">Selecciona...</option>
                                        {CARRERAS.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Semestre</label>
                                    <select name="semester" value={formData.semester} onChange={handleChange} className="form-input">
                                        <option value="">Selecciona...</option>
                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={`${n}o Semestre`}>{n}o Semestre</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Celular</label>
                                    <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="form-input" />
                                </div>
                                {scholarship.type === 'CLE (Idiomas)' && (
                                    <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="form-label">No. Control CLE</label><input name="cle_control_number" value={formData.cle_control_number} onChange={handleChange} className="form-input" /></div>
                                            <div><label className="form-label">Nivel a Cursar</label><input name="level_to_enter" value={formData.level_to_enter} onChange={handleChange} className="form-input" /></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: SOCIOECONÓMICO */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2 dark:border-slate-800">2. Estudio Socioeconómico</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2"><label className="form-label">Domicilio en Morelia</label><input name="address" value={formData.address} onChange={handleChange} className="form-input" /></div>
                                <div className="md:col-span-2"><label className="form-label">Domicilio de Origen</label><input name="origin_address" value={formData.origin_address} onChange={handleChange} className="form-input" /></div>
                                <div><label className="form-label">Dependencia Económica</label><select name="economic_dependence" value={formData.economic_dependence} onChange={handleChange} className="form-input"><option value="Padres">Padres</option><option value="Madre">Solo Madre</option><option value="Padre">Solo Padre</option><option value="Tutor">Tutor</option><option value="Propio">Ingreso Propio</option></select></div>
                                <div><label className="form-label">Personas que dependen del ingreso</label><input type="number" name="dependents_count" value={formData.dependents_count} onChange={handleChange} className="form-input" /></div>
                                <div><label className="form-label">Ingreso Mensual Familiar ($)</label><input type="number" name="family_income" value={formData.family_income} onChange={handleChange} className="form-input" /></div>
                                <div><label className="form-label">Ingreso Per Cápita</label><input disabled value={formData.income_per_capita} className="form-input bg-gray-100 text-gray-500" /></div>
                            </div>
                        </div>
                    )}

                    {/* PASO 3: MOTIVOS */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2 dark:border-slate-800">3. Motivos y Antecedentes</h3>
                            <div><label className="form-label">¿Beca anterior?</label><select name="previous_scholarship" value={formData.previous_scholarship} onChange={handleChange} className="form-input"><option value="No">No</option><option value="Alimenticia">Sí, Alimenticia</option><option value="Reinscripción">Sí, Reinscripción</option></select></div>
                            <div><label className="form-label">Actividades Extra</label><input name="activities" value={formData.activities} onChange={handleChange} className="form-input" /></div>
                            <div><label className="form-label">Carta de Motivos</label><textarea name="motivos" value={formData.motivos} onChange={handleChange} className="form-input h-32" /></div>
                        </div>
                    )}

                    {/* PASO 4: DOCUMENTOS (Lógica Batch) */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold border-b pb-2 dark:border-slate-800">4. Documentación Digital</h3>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-400 flex gap-2">
                                <AlertCircle size={20} /> Selecciona tus archivos. Se subirán todos al finalizar.
                            </div>
                            <div className="grid gap-4">
                                {[
                                    { key: 'doc_request', label: 'Solicitud Firmada con Foto' },
                                    { key: 'doc_motivos', label: 'Carta de Motivos Firmada' },
                                    { key: 'doc_address', label: 'Comprobante de Domicilio' },
                                    { key: 'doc_income', label: 'Comprobante de Ingresos' },
                                    { key: 'doc_ine', label: 'Identificación Oficial' },
                                    { key: 'doc_school_id', label: 'Credencial ITM' },
                                    { key: 'doc_schedule', label: 'Horario o Kárdex' },
                                    { key: 'doc_extra', label: 'Documentos Extra (Opcional)' }
                                ].map((doc) => {
                                    const file = selectedFiles[doc.key];
                                    return (
                                        <div key={doc.key} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${file ? 'bg-guinda-100 text-guinda-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    {file ? <FileCheck size={20} /> : <FileText size={20} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm">{doc.label}</p>
                                                    {file ? <span className="text-xs text-guinda-600 font-bold truncate block">{file.name}</span> : <span className="text-xs text-gray-400">Sin archivo</span>}
                                                </div>
                                            </div>
                                            {file ? (
                                                <button onClick={() => handleRemoveFile(doc.key)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                            ) : (
                                                <label className={`btn-secondary text-xs px-3 py-2 cursor-pointer ${submitting ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <Upload size={16} /><span className="ml-2 hidden md:inline">Seleccionar</span>
                                                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileSelect(e, doc.key)} />
                                                </label>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* BOTONES */}
                    <div className="flex justify-between mt-10 pt-6 border-t border-gray-100 dark:border-slate-800">
                        <button disabled={currentStep === 1 || submitting} onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 disabled:opacity-50">
                            <ArrowLeft size={18} /> Anterior
                        </button>

                        {currentStep < 4 ? (
                            <button onClick={() => {
                                if (currentStep === 1 && (!formData.full_name || !formData.control_number)) return alert("Completa tus datos básicos");
                                setCurrentStep(prev => prev + 1);
                            }} className="btn-primary flex items-center gap-2 px-8">
                                Siguiente <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 px-8 disabled:opacity-70 disabled:cursor-wait">
                                {submitting ? <><Loader2 className="animate-spin" size={20} /> {uploadingInfo || 'Procesando...'}</> : 'Finalizar y Enviar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};