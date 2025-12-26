import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Loader2, MessageSquare, FileText, Trash2 } from 'lucide-react';
import { type Complaint, ComplaintStatus } from '../../../shared/types';
import { resolveComplaint } from '../../../shared/services/api';
// NOTA: Ya no necesitamos 'uploadFile' aquí, se manda directo al resolver.

interface ComplaintModalProps {
    isOpen: boolean;
    onClose: () => void;
    complaint: Complaint | null;
    onSuccess: () => void;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({ isOpen, onClose, complaint, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);

    // Estados separados para tener control total antes del envío
    const [status, setStatus] = useState<string>(ComplaintStatus.RESUELTO);
    const [adminResponse, setAdminResponse] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Limpiar estados al abrir/cerrar
    useEffect(() => {
        if (isOpen) {
            setStatus(ComplaintStatus.RESUELTO);
            setAdminResponse('');
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    }, [isOpen]);

    if (!isOpen || !complaint) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Guardamos el archivo REAL para enviarlo después
        setSelectedFile(file);

        // Generamos preview local
        if (file.type.includes('image')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null); // Es PDF u otro
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!adminResponse.trim()) {
            alert("Es obligatorio escribir una respuesta oficial.");
            return;
        }

        setSubmitting(true);

        try {
            // --- SOLUCIÓN DEL ERROR 422 ---
            // En lugar de enviar JSON, enviamos FormData.
            // Esto permite mandar el archivo binario y el texto al mismo tiempo.
            const formData = new FormData();

            formData.append('status', status);
            formData.append('admin_response', adminResponse);

            // OJO: 'evidencia' debe coincidir con el nombre del parámetro en tu Backend (FastAPI/Flask/Express)
            // Si en tu backend se llama 'evidence_file', cámbialo aquí.
            if (selectedFile) {
                formData.append('evidencia', selectedFile);
            }

            // Enviamos el formData en lugar del objeto JSON
            // (Asegúrate que tu función resolveComplaint en api.ts acepte este segundo argumento tal cual)
            await resolveComplaint(complaint.id, formData);

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error("Error submit:", error);
            // Si sigue saliendo 422, imprime esto para ver qué campo falta
            console.log("Detalle error:", error.response?.data);
            alert("Error al guardar la resolución. Revisa la consola para detalles.");
        } finally {
            setSubmitting(false);
        }
    };

    const isPdf = selectedFile?.name.toLowerCase().endsWith('.pdf');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-guinda-600" />
                            Atender Folio <span className="font-mono text-gray-500 dark:text-gray-400 text-base ml-1">{complaint.tracking_code}</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

                    {/* Decisión */}
                    <div>
                        <label className="form-label mb-3 block">Dictamen del Consejo</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setStatus(ComplaintStatus.RESUELTO)}
                                className={`py-4 px-4 rounded-xl border-2 font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all
                                    ${status === ComplaintStatus.RESUELTO 
                                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 shadow-sm' 
                                        : 'border-gray-200 dark:border-slate-700 text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'}`}
                            >
                                <CheckCircle size={24} /> APROBAR / RESUELTO
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus(ComplaintStatus.RECHAZADO)}
                                className={`py-4 px-4 rounded-xl border-2 font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all
                                    ${status === ComplaintStatus.RECHAZADO 
                                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 shadow-sm' 
                                        : 'border-gray-200 dark:border-slate-700 text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'}`}
                            >
                                <AlertCircle size={24} /> RECHAZAR
                            </button>
                        </div>
                    </div>

                    {/* Respuesta */}
                    <div>
                        <label className="form-label">Respuesta Oficial <span className="text-red-500">*</span></label>
                        <textarea
                            required
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            className="form-input w-full h-32 resize-none text-sm"
                            placeholder="Describe la solución o la razón del rechazo. Este mensaje se enviará al estudiante..."
                        />
                    </div>

                    {/* Evidencia (PDF o Imagen) */}
                    <div>
                        <label className="form-label mb-2 block">Documento o Evidencia (Opcional)</label>

                        {!selectedFile ? (
                            // ESTADO: NO HAY ARCHIVO
                            <label className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-guinda-500 hover:bg-guinda-50 dark:border-slate-600 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors">
                                <Upload className="text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500 font-medium">Click para adjuntar (IMG o PDF)</span>
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} />
                            </label>
                        ) : (
                            // ESTADO: ARCHIVO SELECCIONADO
                            <div className="flex items-center justify-between p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 rounded-xl">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-green-100">
                                        {isPdf ? (
                                            <FileText className="text-red-500" size={20} />
                                        ) : previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <FileText className="text-gray-500" size={20} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-green-700 dark:text-green-400 truncate">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-500 truncate">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
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

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                            {submitting ? 'Guardando...' : 'Confirmar'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};