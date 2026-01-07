import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Home, FileText, Upload, CheckCircle,
    ArrowRight, ArrowLeft, AlertCircle, Loader2, Trash2, FileCheck, HelpCircle, Image as ImageIcon
} from 'lucide-react';
import { getScholarships, submitScholarshipApplication, uploadFile } from '../../../shared/services/api';
import type { Scholarship, ScholarshipApplication } from '../../../shared/types';
import { CARRERAS } from '../../../shared/constants/carreras';

const STEPS = [
    { id: 1, title: 'Datos Personales', icon: User },
    { id: 2, title: 'Socioeconómico', icon: Home },
    { id: 3, title: 'Motivos e Historial', icon: FileText },
    { id: 4, title: 'Expediente', icon: Upload }
];

export const SolicitudPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [scholarship, setScholarship] = useState<Scholarship | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Estados de UI
    const [submitting, setSubmitting] = useState(false);
    const [uploadingInfo, setUploadingInfo] = useState<string>('');
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [success, setSuccess] = useState(false);

    // Archivos y Lógica Condicional
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
    const [isForeign, setIsForeign] = useState(false);
    const [otherScholarshipName, setOtherScholarshipName] = useState('');

    // Estado del Formulario (Inicializado según tipos)
    const [formData, setFormData] = useState<Partial<ScholarshipApplication>>({
        full_name: '', email: '', control_number: '', phone_number: '',
        career: '', semester: '',
        arithmetic_average: 0, certified_average: 0,
        cle_control_number: '', level_to_enter: '',
        address: '', origin_address: '',
        economic_dependence: 'Padres', dependents_count: 0,
        family_income: 0, income_per_capita: 0,
        previous_scholarship: 'No', release_folio: '',
        activities: '', motivos: '',
        // student_photo se llena al subir
        doc_address: '', doc_income: '',
        doc_ine: '', doc_kardex: '', doc_extra: ''
    });

    // Cargar Beca
    useEffect(() => {
        const loadBeca = async () => {
            try {
                const becas = await getScholarships();
                const found = becas.find(b => b.id === Number(id));
                if (found) setScholarship(found);
                else navigate('/becas');
            } catch (e) {
                console.error(e);
                setError("Error al cargar la información de la convocatoria.");
            }
        };
        loadBeca();
    }, [id, navigate]);

    // Cálculo automático de Ingreso Per Cápita
    useEffect(() => {
        const income = Number(formData.family_income) || 0;
        const deps = Number(formData.dependents_count) || 0;
        setFormData(prev => ({
            ...prev,
            income_per_capita: (income > 0 && deps > 0) ? parseFloat((income / deps).toFixed(2)) : 0
        }));
    }, [formData.family_income, formData.dependents_count]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Validación de Rangos Numéricos (0-100)
        if (type === 'number') {
            const numVal = parseFloat(value);
            if (name.includes('average')) {
                if (numVal > 100) return; // Bloqueo estricto
                if (numVal < 0) return;
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        setValidationError('');
    };

    // --- VALIDACIÓN DE PASOS ---
    const validateCurrentStep = (): boolean => {
        setValidationError('');

        // PASO 1: PERSONALES
        if (currentStep === 1) {
            if (!formData.full_name?.trim()) { setValidationError('El nombre completo es obligatorio.'); return false; }
            if (!formData.control_number?.trim()) { setValidationError('El número de control es obligatorio.'); return false; }
            if (!formData.email?.includes('@')) { setValidationError('Ingresa un correo válido.'); return false; }
            if (!formData.career) { setValidationError('Selecciona tu carrera.'); return false; }
            if (!formData.semester) { setValidationError('Selecciona tu semestre.'); return false; }
            if (!formData.phone_number?.trim()) { setValidationError('El teléfono es obligatorio.'); return false; }

            const aritmetico = Number(formData.arithmetic_average);
            const certificado = Number(formData.certified_average);

            if (isNaN(aritmetico) || aritmetico <= 0 || aritmetico > 100) {
                setValidationError('El Promedio Aritmético debe ser entre 0 y 100.'); return false;
            }
            if (isNaN(certificado) || certificado <= 0 || certificado > 100) {
                setValidationError('El Promedio Certificado debe ser entre 0 y 100.'); return false;
            }

            if (scholarship?.type === 'CLE (Idiomas)') {
                if (!formData.cle_control_number) { setValidationError('El No. Control CLE es requerido.'); return false; }
                if (!formData.level_to_enter) { setValidationError('El nivel a cursar es requerido.'); return false; }
            }
        }

        // PASO 2: SOCIOECONÓMICO
        if (currentStep === 2) {
            if (!formData.address?.trim()) { setValidationError('El domicilio actual es obligatorio.'); return false; }
            if (isForeign && !formData.origin_address?.trim()) { setValidationError('El domicilio de origen es obligatorio para foráneos.'); return false; }
            if (!formData.dependents_count || Number(formData.dependents_count) <= 0) { setValidationError('Indica el número de dependientes.'); return false; }
            if (!formData.family_income || Number(formData.family_income) <= 0) { setValidationError('El ingreso familiar debe ser mayor a 0.'); return false; }
        }

        // PASO 3: MOTIVOS
        if (currentStep === 3) {
            if (formData.previous_scholarship !== 'No') {
                if (!formData.release_folio?.trim()) { setValidationError('El Folio de Liberación es obligatorio si tuviste beca.'); return false; }
                if (formData.previous_scholarship === 'Otro' && !otherScholarshipName.trim()) { setValidationError('Debes especificar qué otra beca tuviste.'); return false; }
            }
            if (!formData.motivos?.trim() || formData.motivos.length < 50) { setValidationError('Tu carta de motivos es muy breve. Detalla más tu situación (mínimo 50 caracteres).'); return false; }
        }

        return true;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    // --- MANEJO DE ARCHIVOS ---
    const validateFile = (file: File, isPhoto = false): string | null => {
        if (file.size > 10 * 1024 * 1024) return "El archivo excede el límite de 10MB.";

        if (isPhoto) {
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) return "La foto debe ser imagen (JPG/PNG).";
        } else {
            if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) return "Solo se permiten archivos PDF o Imágenes.";
        }
        return null;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isPhoto = fieldName === 'student_photo';
        const msg = validateFile(file, isPhoto);

        if (msg) {
            alert(msg);
            e.target.value = ''; // Reset input
            return;
        }
        setSelectedFiles(prev => ({ ...prev, [fieldName]: file }));
    };

    const handleRemoveFile = (key: string) => {
        const newFiles = { ...selectedFiles };
        delete newFiles[key];
        setSelectedFiles(newFiles);
    };

    // --- ENVÍO FINAL ---
    const handleSubmit = async () => {
        setValidationError('');

        // 1. Validar Documentos Obligatorios
        const requiredDocs = ['student_photo', 'doc_ine', 'doc_kardex', 'doc_income', 'doc_address'];
        const missing = requiredDocs.filter(k => !selectedFiles[k]);

        if (missing.length > 0) return setValidationError(`Faltan documentos obligatorios. Revisa que hayas subido tu FOTO y todas las evidencias.`);

        setSubmitting(true);
        setUploadingInfo('Subiendo evidencias...');

        try {
            // Clonamos data
            let finalData: any = { ...formData };

            // Concatenar "Otro" si aplica
            if (finalData.previous_scholarship === 'Otro') {
                finalData.previous_scholarship = `Otro: ${otherScholarshipName}`;
            }

            // 2. Subir Archivos a Cloudinary (Secuencial)
            for (const key of Object.keys(selectedFiles)) {
                setUploadingInfo(`Subiendo ${key === 'student_photo' ? 'FOTO' : key.replace('doc_', '').toUpperCase()}...`);
                const url = await uploadFile(selectedFiles[key]);
                finalData[key] = url; // Asignamos la URL retornada al campo correspondiente
            }

            // 3. Limpiar campos generados (Backend los ignora o recibe null)
            finalData['doc_request'] = null;
            finalData['doc_motivos'] = null;

            setUploadingInfo('Registrando expediente...');

            // 4. Enviar Payload al Backend
            await submitScholarshipApplication({
                ...finalData,
                scholarship_id: Number(id),
                // Conversión explícita a números para evitar error 422
                arithmetic_average: Number(finalData.arithmetic_average),
                certified_average: Number(finalData.certified_average),
                dependents_count: Number(finalData.dependents_count),
                family_income: Number(finalData.family_income),
                income_per_capita: Number(finalData.income_per_capita),
                origin_address: isForeign ? finalData.origin_address : 'N/A'
            } as ScholarshipApplication);

            setSuccess(true);
            window.scrollTo(0,0);

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'object' ? JSON.stringify(err.response.data.detail) : err.response.data.detail)
                : err.message;
            setError(msg || "Error al enviar la solicitud.");
            setSubmitting(false);
        }
    };

    if (success) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6 animate-fade-in">
            <div className="card-base max-w-lg w-full p-10 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Expediente Generado!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Tu información ha sido recibida exitosamente. El sistema generará tu solicitud oficial y serás notificado cuando inicie el proceso de revisión.
                </p>
                <button onClick={() => navigate('/becas')} className="btn-primary w-full">Volver a Becas</button>
            </div>
        </div>
    );

    if (!scholarship) return <div className="min-h-screen flex items-center justify-center dark:text-white"><Loader2 className="animate-spin mr-2"/> Cargando convocatoria...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 pt-10 px-4 transition-colors duration-300">
            <div className="container mx-auto max-w-4xl">

                {/* HEADER */}
                <button onClick={() => navigate('/becas')} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-guinda-600 dark:text-gray-400 transition-colors">
                    <ArrowLeft size={18} /> Cancelar trámite
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{scholarship.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Completa todos los pasos para registrar tu candidatura.</p>

                {/* STEPS */}
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded"></div>
                    {STEPS.map((step) => (
                        <div key={step.id} className={`flex flex-col items-center bg-gray-50 dark:bg-slate-950 px-2 transition-colors ${currentStep >= step.id ? 'text-guinda-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= step.id ? 'border-guinda-600 bg-white' : 'border-gray-300 bg-white dark:bg-slate-800'}`}>
                                <step.icon size={18} />
                            </div>
                            <span className="text-xs font-bold mt-1 hidden md:block">{step.title}</span>
                        </div>
                    ))}
                </div>

                <div className="card-base p-6 md:p-10 shadow-xl animate-fade-in">

                    {validationError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 flex items-center gap-3 animate-pulse">
                            <AlertCircle size={24} />
                            <span className="font-bold">{validationError}</span>
                        </div>
                    )}

                    {error && (
                         <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg">
                            Error: {error}
                         </div>
                    )}

                    {/* --- PASO 1: PERSONALES --- */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-slate-800">Datos Personales y Académicos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="form-label">Nombre Completo</label>
                                    <input name="full_name" value={formData.full_name} onChange={handleChange} className="form-input" placeholder="Apellido Paterno Materno Nombres" />
                                </div>
                                <div><label className="form-label">No. Control</label><input name="control_number" value={formData.control_number} onChange={handleChange} className="form-input" /></div>
                                <div><label className="form-label">Correo Institucional</label><input name="email" value={formData.email} onChange={handleChange} className="form-input" /></div>
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
                                        {[...Array(12)].map((_, i) => <option key={i} value={`${i+1}o Semestre`}>{i+1}o Semestre</option>)}
                                    </select>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label text-guinda-600 dark:text-guinda-400">Promedio Aritmético (0-100)</label>
                                        <input type="number" name="arithmetic_average" value={formData.arithmetic_average} onChange={handleChange} className="form-input" min="0" max="100" step="0.1" />
                                    </div>
                                    <div>
                                        <label className="form-label text-guinda-600 dark:text-guinda-400">Promedio Certificado (0-100)</label>
                                        <input type="number" name="certified_average" value={formData.certified_average} onChange={handleChange} className="form-input" min="0" max="100" step="0.1" />
                                    </div>
                                </div>
                                <div><label className="form-label">Celular</label><input name="phone_number" value={formData.phone_number} onChange={handleChange} className="form-input" /></div>

                                {scholarship?.type === 'CLE (Idiomas)' && (
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <div><label className="form-label">Control CLE</label><input name="cle_control_number" value={formData.cle_control_number} onChange={handleChange} className="form-input" /></div>
                                        <div><label className="form-label">Nivel a Cursar</label><input name="level_to_enter" value={formData.level_to_enter} onChange={handleChange} className="form-input" /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- PASO 2: SOCIOECONÓMICO --- */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-slate-800">Estudio Socioeconómico</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2"><label className="form-label">Domicilio actual (Morelia)</label><input name="address" value={formData.address} onChange={handleChange} className="form-input" /></div>

                                <div className="md:col-span-2 flex items-center gap-3 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                    <input type="checkbox" id="foreign" checked={isForeign} onChange={e => setIsForeign(e.target.checked)} className="w-5 h-5 text-guinda-600 rounded focus:ring-guinda-500" />
                                    <label htmlFor="foreign" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">¿Eres foráneo?</label>
                                </div>

                                {isForeign && <div className="md:col-span-2 animate-fade-in-down"><label className="form-label text-guinda-600 dark:text-guinda-400">Domicilio de Origen</label><input name="origin_address" value={formData.origin_address} onChange={handleChange} className="form-input" /></div>}

                                <div>
                                    <label className="form-label">Dependencia Económica</label>
                                    <select name="economic_dependence" value={formData.economic_dependence} onChange={handleChange} className="form-input">
                                        <option value="Padres">Ambos Padres</option>
                                        <option value="Madre">Solo Madre</option>
                                        <option value="Padre">Solo Padre</option>
                                        <option value="Tutor">Tutor</option>
                                        <option value="Propio">Ingreso Propio</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div><label className="form-label">No. Dependientes</label><input type="number" name="dependents_count" value={formData.dependents_count} onChange={handleChange} className="form-input" /></div>
                                <div><label className="form-label">Ingreso Familiar Mensual ($)</label><input type="number" name="family_income" value={formData.family_income} onChange={handleChange} className="form-input" /></div>
                                <div><label className="form-label">Per Cápita (Calculado)</label><input disabled value={formData.income_per_capita} className="form-input bg-gray-200 dark:bg-slate-800 cursor-not-allowed text-gray-500" /></div>
                            </div>
                        </div>
                    )}

                    {/* --- PASO 3: ANTECEDENTES --- */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-slate-800">Antecedentes</h3>

                            <div className="p-5 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/50 rounded-xl space-y-4">
                                <div>
                                    <label className="form-label text-orange-800 dark:text-orange-400">¿Contaste con beca el semestre anterior?</label>
                                    <select name="previous_scholarship" value={formData.previous_scholarship} onChange={handleChange} className="form-input">
                                        <option value="No">No</option>
                                        <option value="Alimenticia">Sí, Alimenticia</option>
                                        <option value="Reinscripción">Sí, Reinscripción</option>
                                        <option value="CLE">Sí, CLE</option>
                                        <option value="Otro">Otro (Especificar)</option>
                                    </select>
                                </div>

                                {formData.previous_scholarship !== 'No' && (
                                    <div className="animate-fade-in-down space-y-4">
                                        {formData.previous_scholarship === 'Otro' && (
                                            <div>
                                                <label className="form-label text-guinda-600 dark:text-guinda-400">Especifique cuál beca:</label>
                                                <input value={otherScholarshipName} onChange={(e) => setOtherScholarshipName(e.target.value)} className="form-input" placeholder="Ej: Beca de Transporte" />
                                            </div>
                                        )}
                                        <div>
                                            <label className="form-label text-guinda-600 dark:text-guinda-400 font-bold flex items-center gap-2">
                                                <AlertCircle size={16}/> Folio de Liberación (OBLIGATORIO)
                                            </label>
                                            <input name="release_folio" value={formData.release_folio} onChange={handleChange} className="form-input border-2 border-guinda-500 dark:border-guinda-600" placeholder="Ingresa el folio de tu servicio becario" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div><label className="form-label">Actividades Extraescolares</label><input name="activities" value={formData.activities} onChange={handleChange} className="form-input" /></div>
                            <div>
                                <label className="form-label">Carta de Motivos (Detallada)</label>
                                <textarea name="motivos" value={formData.motivos} onChange={handleChange} className="form-input h-32" placeholder="Escribe aquí tus motivos (Mínimo 50 caracteres). Se usarán para generar tu solicitud oficial." />
                            </div>
                        </div>
                    )}

                    {/* --- PASO 4: DOCUMENTOS (FOTO + EVIDENCIAS) --- */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-slate-800">Documentación</h3>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                <HelpCircle className="inline mr-2"/>
                                <strong>Nota Importante:</strong> Ya no necesitas subir la Solicitud ni la Carta de Motivos en PDF.
                                El sistema las generará automáticamente con la información que acabas de llenar y la foto que subas aquí.
                            </div>

                            <div className="grid gap-4 mt-2">
                                {/* FOTO DEL ALUMNO - PRIMER LUGAR */}
                                <div className={`flex flex-col md:flex-row justify-between items-center p-4 border-2 border-dashed rounded-xl transition-colors ${selectedFiles['student_photo'] ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-guinda-200 dark:border-guinda-900 bg-guinda-50 dark:bg-guinda-900/10'}`}>
                                    <div className="flex items-center gap-4 mb-3 md:mb-0">
                                        <div className={`p-3 rounded-full ${selectedFiles['student_photo'] ? 'bg-green-100 text-green-600' : 'bg-white text-guinda-600 shadow-sm'}`}>
                                            {selectedFiles['student_photo'] ? <CheckCircle size={28} /> : <ImageIcon size={28} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-lg">Fotografía Infantil Digital *</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Rostro despejado, fondo blanco. (Solo JPG/PNG)</p>
                                            {selectedFiles['student_photo'] && <span className="text-xs text-green-600 dark:text-green-400 font-bold block mt-1">Archivo listo: {selectedFiles['student_photo'].name}</span>}
                                        </div>
                                    </div>
                                    {selectedFiles['student_photo'] ?
                                        <button onClick={() => handleRemoveFile('student_photo')} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"><Trash2 size={24}/></button> :
                                        <label className="btn-primary text-sm px-6 py-2 cursor-pointer shadow-none">
                                            Seleccionar Foto <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={(e) => handleFileSelect(e, 'student_photo')} />
                                        </label>
                                    }
                                </div>

                                {/* RESTO DE DOCUMENTOS */}
                                {['doc_ine', 'doc_kardex', 'doc_income', 'doc_address', 'doc_extra'].map((key) => {
                                    const labels: Record<string, string> = {
                                        'doc_ine': 'INE / Credencial Escolar',
                                        'doc_kardex': 'Kardex o Constancia',
                                        'doc_income': 'Comprobante de Ingresos (Máx 3 meses)',
                                        'doc_address': 'Comprobante de Domicilio',
                                        'doc_extra': 'Documento Extra (Opcional)'
                                    };
                                    const required = key !== 'doc_extra';
                                    const file = selectedFiles[key];

                                    return (
                                        <div key={key} className="flex justify-between items-center p-3 border rounded-lg border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${file ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                                                    {file ? <FileCheck size={20} /> : <FileText size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-200">{labels[key]} {required && <span className="text-red-500">*</span>}</p>
                                                    {file ? <span className="text-xs text-green-600 dark:text-green-400 font-bold">{file.name}</span> : <span className="text-xs text-gray-400 dark:text-gray-500">Pendiente</span>}
                                                </div>
                                            </div>
                                            {file ?
                                                <button onClick={() => handleRemoveFile(key)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"><Trash2 size={18}/></button> :
                                                <label className="btn-secondary text-xs px-3 py-2 cursor-pointer">
                                                    Subir <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileSelect(e, key)} />
                                                </label>
                                            }
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Footer Nav */}
                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button disabled={currentStep === 1 || submitting} onClick={() => setCurrentStep(p => p - 1)} className="btn-secondary">Anterior</button>

                        {currentStep < 4 ? (
                            <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                                Siguiente <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-700 border-green-600">
                                {submitting ? <><Loader2 className="animate-spin inline mr-2"/> {uploadingInfo}</> : 'Finalizar y Enviar'}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};