import { useState } from 'react';
import { X, CheckCircle, XCircle, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { ApplicationStatus, type ScholarshipApplication } from '../../../shared/types';
import { updateApplicationStatus } from '../../../shared/services/api';

interface Props {
  application: ScholarshipApplication;
  onClose: () => void;
  onUpdate: () => void;
}

export const RevisionModal = ({ application, onClose, onUpdate }: Props) => {
  const [comment, setComment] = useState(application.admin_comments || '');
  const [loading, setLoading] = useState(false);

  // Mapeo de documentos
  const documents = [
    { label: 'Solicitud', url: application.doc_request },
    { label: 'Carta Motivos', url: application.doc_motivos },
    { label: 'Domicilio', url: application.doc_address },
    { label: 'Ingresos', url: application.doc_income },
    { label: 'INE', url: application.doc_ine },
    { label: 'Credencial', url: application.doc_school_id },
    { label: 'Horario', url: application.doc_schedule },
    { label: 'Extra', url: application.doc_extra },
  ].filter(doc => doc.url);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === ApplicationStatus.RECHAZADA && !comment.trim()) {
      return alert("Para rechazar, es obligatorio escribir un comentario.");
    }
    if (!confirm(`¿Confirmas cambiar el estatus a: ${newStatus}?`)) return;

    setLoading(true);
    try {
      await updateApplicationStatus(application.id, {
        status: newStatus,
        admin_comments: comment
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">

      {/* CARD BASE */}
      <div className="card-base w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="text-guinda-600 dark:text-guinda-400" /> Revisión de Solicitud
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {application.control_number} — {application.full_name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Info Básica: Grid de 2 columnas con tarjetas internas */}
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            {/* Columna Académica */}
            <div className="bg-gray-50 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <h3 className="form-label mb-3">Académico</h3>
                <div className="space-y-2 text-gray-700 dark:text-slate-300">
                    <p className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1">
                        <span className="font-semibold">Carrera:</span> <span>{application.career}</span>
                    </p>
                    <p className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1">
                        <span className="font-semibold">Semestre:</span> <span>{application.semester}</span>
                    </p>
                    {application.cle_control_number && (
                        <p className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1">
                            <span className="font-semibold">Control CLE:</span> <span>{application.cle_control_number}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Columna Socioeconómica */}
            <div className="bg-gray-50 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <h3 className="form-label mb-3">Socioeconómico</h3>
                <div className="space-y-2 text-gray-700 dark:text-slate-300">
                    <p className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1">
                        <span className="font-semibold">Dependencia:</span> <span>{application.economic_dependence}</span>
                    </p>
                    <p className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1">
                        <span className="font-semibold">Ingreso Fam:</span> <span>${application.family_income}</span>
                    </p>
                    <p className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-1">
                        <span className="font-semibold">Per Cápita:</span> <span>${application.income_per_capita}</span>
                    </p>
                </div>
            </div>
          </div>

          {/* Documentos */}
          <div>
            <h3 className="form-label mb-3">Documentación</h3>
            {/* Grid de documentos con mejor contraste */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {documents.map((doc, idx) => (
                <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-xl
                             border-gray-200 bg-white text-gray-600 hover:border-guinda-500 hover:text-guinda-700 hover:bg-guinda-50
                             dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-guinda-500 dark:hover:text-white dark:hover:bg-slate-700
                             transition-all text-sm font-medium group"
                >
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-guinda-600 dark:group-hover:text-guinda-400 transition-colors" />
                  <span className="truncate">{doc.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Motivos */}
          <div>
             <h3 className="form-label mb-2">Carta de Motivos</h3>
             <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 italic text-gray-600 dark:text-slate-300 text-sm leading-relaxed">
                "{application.motivos}"
             </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer flex-col items-stretch gap-4">
          <div>
            <label className="form-label">Comentarios / Retroalimentación</label>
            <textarea
                className="form-input h-20 resize-none text-sm"
                placeholder="Escribe aquí las observaciones para el alumno..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
                onClick={() => handleStatusChange(ApplicationStatus.RECHAZADA)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2
                           bg-red-50 text-red-700 hover:bg-red-100
                           dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
                <XCircle size={18} /> Rechazar
            </button>

            <button
                onClick={() => handleStatusChange(ApplicationStatus.DOCUMENTACION_FALTANTE)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2
                           bg-yellow-50 text-yellow-700 hover:bg-yellow-100
                           dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40"
            >
                <AlertTriangle size={18} /> Corregir
            </button>

            <button
                onClick={() => handleStatusChange(ApplicationStatus.APROBADA)}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
            >
                <CheckCircle size={18} /> Aprobar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};