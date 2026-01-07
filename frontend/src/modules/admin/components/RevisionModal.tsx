import { useState, useEffect } from 'react';
import {
    X, CheckCircle, XCircle, AlertTriangle,
    FileText, Download, User, Calendar, Loader2
} from 'lucide-react';
import { updateApplicationStatus, downloadExpediente } from '../../../shared/services/api'; // <--- IMPORTA downloadExpediente
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
                            className="btn-primary bg-blue-600 hover:bg-blue-700 border-none flex items-center gap-2 px-4 py-2 shadow-lg shadow-blue-900/20"
                        >
                            {downloading ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                            {downloading ? 'Generando...' : 'Descargar PDF'}
                        </button>
                    </div>

                    {/* DATOS RESUMIDOS */}
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
                    </div>

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