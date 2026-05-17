import { useState, useEffect } from 'react';
import {
    X, CheckCircle, XCircle, AlertTriangle,
    FileText, Download, User, Calendar, Loader2, Edit, Save, Upload, Trash2
} from 'lucide-react';
import { updateApplicationStatus, downloadExpediente, uploadFile, uploadImage } from '../../../shared/services/api'; // <--- IMPORTA uploadFile y uploadImage
import type { ScholarshipApplication, ApplicationStatus } from '../../../shared/types';

interface RevisionModalProps {
    application: ScholarshipApplication | null;
    onClose: () => void;
    onUpdate: () => void;
}

export const RevisionModal = ({ application, onClose, onUpdate }: RevisionModalProps) => {
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false); // Estado para el botón de descarga

    useEffect(() => {
        if (application?.admin_comments) {
            setComments(application.admin_comments);
        } else {
            setComments('');
        }
    }, [application]);

    const isManual = application?.student_photo === 'N/A';
    const [editMode, setEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({
        arithmetic_average: application?.arithmetic_average || 0,
        certified_average: application?.certified_average || 0,
        family_income: application?.family_income || 0,
        income_per_capita: application?.income_per_capita || 0,
        address: application?.address === 'N/A' ? '' : (application?.address || ''),
        origin_address: application?.origin_address === 'N/A' ? '' : (application?.origin_address || ''),
        economic_dependence: application?.economic_dependence === 'N/A' ? '' : (application?.economic_dependence || ''),
        dependents_count: application?.dependents_count || 0,
        motivos: application?.motivos === 'Solicitud agregada manualmente por administrador.' ? '' : (application?.motivos || '')
    });

    const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
    const [uploadingInfo, setUploadingInfo] = useState('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFiles(prev => ({ ...prev, [fieldName]: file }));
    };

    const handleRemoveFile = (key: string) => {
        const newFiles = { ...selectedFiles };
        delete newFiles[key];
        setSelectedFiles(newFiles);
    };

    const handleSaveManualEdit = async () => {
        setLoading(true);
        try {
            const payload: any = { ...editFormData };
            
            for (const key of Object.keys(selectedFiles)) {
                setUploadingInfo(`Subiendo ${key}...`);
                if (key === 'student_photo') {
                    payload[key] = await uploadImage(selectedFiles[key]);
                } else {
                    payload[key] = await uploadFile(selectedFiles[key]);
                }
            }

            setUploadingInfo('Guardando datos...');
            await updateApplicationStatus(application!.id!, payload);
            setEditMode(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar la solicitud");
        } finally {
            setLoading(false);
            setUploadingInfo('');
        }
    };

    if (!application) return null;

    const handleStatusChange = async (newStatus: ApplicationStatus) => {
        if (!confirm(`¿Estás seguro de cambiar el estatus a ${newStatus}?`)) return;

        setLoading(true);
        try {
            await updateApplicationStatus(application.id!, {
                status: newStatus,
                admin_comments: comments
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar la solicitud");
        } finally {
            setLoading(false);
        }
    };

    // --- FUNCIÓN PARA EL BOTÓN DE DESCARGA ---
    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            await downloadExpediente(application.id!, application.control_number);
        } catch (error) {
            alert("No se pudo descargar el expediente. Intenta de nuevo.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start bg-gray-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User size={20} className="text-guinda-600"/>
                            {application.full_name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {application.career} • {application.semester} • Control: {application.control_number}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* BOTÓN DE DESCARGA DEL EXPEDIENTE */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                <FileText size={18}/> Expediente Digital Unificado
                            </h3>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Contiene solicitud, carta de motivos y todas las evidencias probatorias.
                            </p>
                        </div>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="btn-primary bg-blue-600 hover:bg-blue-700 border-none flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            {downloading ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                            {downloading ? 'Generando...' : 'Descargar PDF'}
                        </button>
                    </div>

                    {/* DATOS RESUMIDOS */}
                    {editMode ? (
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl border border-gray-100 dark:border-slate-800 space-y-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                                <Edit size={18} className="text-guinda-600"/> Completar Expediente Manual
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Promedio Aritmético</label>
                                    <input type="number" step="0.01" className="form-input" value={editFormData.arithmetic_average} onChange={e => setEditFormData({...editFormData, arithmetic_average: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Promedio Certificado</label>
                                    <input type="number" step="0.01" className="form-input" value={editFormData.certified_average} onChange={e => setEditFormData({...editFormData, certified_average: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Ingreso Mensual Familiar</label>
                                    <input type="number" step="0.01" className="form-input" value={editFormData.family_income} onChange={e => setEditFormData({...editFormData, family_income: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Ingreso Per Cápita</label>
                                    <input type="number" step="0.01" className="form-input" value={editFormData.income_per_capita} onChange={e => setEditFormData({...editFormData, income_per_capita: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Dependencia Económica</label>
                                    <input type="text" className="form-input" placeholder="Ej. Padre y Madre" value={editFormData.economic_dependence} onChange={e => setEditFormData({...editFormData, economic_dependence: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Dependientes Económicos</label>
                                    <input type="number" className="form-input" value={editFormData.dependents_count} onChange={e => setEditFormData({...editFormData, dependents_count: parseInt(e.target.value) || 0})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Domicilio Local</label>
                                    <input type="text" className="form-input" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Domicilio Origen</label>
                                    <input type="text" className="form-input" value={editFormData.origin_address} onChange={e => setEditFormData({...editFormData, origin_address: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Motivos</label>
                                    <textarea className="form-input" rows={3} value={editFormData.motivos} onChange={e => setEditFormData({...editFormData, motivos: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="mt-4 border-t dark:border-slate-700 pt-4">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Upload size={16}/> Subir Documentos (Opcional)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['student_photo', 'doc_ine', 'doc_kardex', 'doc_income', 'doc_address'].map(key => {
                                        const labels: Record<string, string> = {
                                            'student_photo': 'Foto Infantil', 'doc_ine': 'INE / Escolar',
                                            'doc_kardex': 'Kardex', 'doc_income': 'Ingresos', 'doc_address': 'Domicilio'
                                        };
                                        const file = selectedFiles[key];
                                        return (
                                            <div key={key} className="flex justify-between items-center p-2 border border-gray-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900">
                                                <span className="text-gray-600 dark:text-gray-400">{labels[key]}</span>
                                                {file ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-green-600 truncate max-w-[100px]">{file.name}</span>
                                                        <button onClick={() => handleRemoveFile(key)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                                    </div>
                                                ) : (
                                                    <label className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-2 py-1 rounded cursor-pointer transition-colors dark:text-gray-300">
                                                        Seleccionar <input type="file" className="hidden" accept={key === 'student_photo' ? 'image/*' : '.pdf,image/*'} onChange={(e) => handleFileSelect(e, key)} />
                                                    </label>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-4">
                                <button onClick={() => setEditMode(false)} className="px-4 py-2 btn-secondary text-sm">Cancelar</button>
                                <button onClick={handleSaveManualEdit} disabled={loading} className="px-4 py-2 btn-primary text-sm flex items-center gap-2">
                                    {loading ? <><Loader2 className="animate-spin" size={16}/> {uploadingInfo || 'Guardando...'}</> : <><Save size={16}/> Guardar</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white border-b dark:border-slate-800 pb-2">Información Académica</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500">Promedio Aritmético</span>
                                        <span className="font-medium dark:text-gray-200">{application.arithmetic_average}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Promedio Certificado</span>
                                        <span className="font-medium dark:text-gray-200">{application.certified_average}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white border-b dark:border-slate-800 pb-2">Socioeconómico</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500">Ingreso Mensual</span>
                                        <span className="font-medium dark:text-gray-200">${application.family_income}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Per Cápita</span>
                                        <span className="font-medium dark:text-gray-200">${application.income_per_capita}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-gray-500">Domicilio</span>
                                        <span className="font-medium dark:text-gray-200">{application.address}</span>
                                    </div>
                                </div>
                            </div>

                            {isManual && (
                                <div className="col-span-1 md:col-span-2 flex justify-end">
                                    <button 
                                        onClick={() => setEditMode(true)}
                                        className="btn-secondary border border-gray-300 dark:border-slate-700 px-4 py-2 flex items-center gap-2 text-sm font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                        <Edit size={16}/> Completar Expediente Manualmente
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* EVIDENCIAS INDIVIDUALES (Por si quiere verlas rápido sin descargar PDF) */}
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white border-b dark:border-slate-800 pb-2 mb-4">Evidencias Adjuntas</h3>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: 'Foto', url: application.student_photo },
                                { label: 'INE', url: application.doc_ine },
                                { label: 'Kardex', url: application.doc_kardex },
                                { label: 'Ingresos', url: application.doc_income },
                                { label: 'Domicilio', url: application.doc_address },
                            ].map((doc, i) => doc.url ? (
                                <a key={i} href={doc.url} target="_blank" rel="noreferrer"
                                   className="px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors dark:text-gray-300">
                                    <FileText size={14}/> {doc.label}
                                </a>
                            ) : null)}
                        </div>
                    </div>

                    {/* ÁREA DE DICTAMEN */}
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl border border-gray-100 dark:border-slate-800">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Dictamen del Comité</h3>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Observaciones (Se enviarán por correo al alumno)</label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-guinda-500 outline-none dark:text-white"
                                rows={3}
                                placeholder="Ej: Falta sello en el kardex, promedio no coincide..."
                            />
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => handleStatusChange('Documentación Faltante')}
                                disabled={loading}
                                className="px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <AlertTriangle size={16}/> Solicitar Corrección
                            </button>

                            <button
                                onClick={() => handleStatusChange('Rechazada')}
                                disabled={loading}
                                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <XCircle size={16}/> Rechazar
                            </button>

                            <button
                                onClick={() => handleStatusChange('Aprobada')}
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-900/20 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                                Aprobar Beca
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};