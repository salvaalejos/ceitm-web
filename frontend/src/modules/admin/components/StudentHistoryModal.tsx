import React from 'react';
import {
  X, ClipboardCheck, Hash, Phone, Mail
} from 'lucide-react';
import type {ScholarshipApplication} from '../../../shared/types';

interface StudentHistoryModalProps {
  student: any;
  onClose: () => void;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({ student, onClose }) => {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">

        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Expediente: {student.full_name}
              </h2>
              {student.is_blacklisted && (
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">
                  Blacklisted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-mono mt-1">{student.control_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* 1. DATOS GENERALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
              <Mail size={18} className="text-blue-500" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Correo</p>
                <p className="text-sm dark:text-gray-200">{student.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
              <Phone size={18} className="text-green-500" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Teléfono</p>
                <p className="text-sm dark:text-gray-200">{student.phone_number}</p>
              </div>
            </div>
          </div>

          {/* 2. LÍNEA DE TIEMPO DE SOLICITUDES */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck size={18} className="text-guinda-600" />
              Historial de Solicitudes
            </h3>

            {student.applications && student.applications.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 dark:border-slate-800 ml-3 space-y-6 pb-2">
                {student.applications.map((app: ScholarshipApplication, index: number) => (
                  <div key={app.id} className="relative pl-8">
                    {/* Punto de la línea de tiempo */}
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ${
                      app.status === 'Aprobada' || app.status === 'Liberada' ? 'bg-green-500' : 
                      app.status === 'Rechazada' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />

                    <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                          {app.scholarship_name || 'Convocatoria CEITM'}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {/* Estatus */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            app.status === 'Aprobada' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                            app.status === 'Liberada' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                            app.status === 'Rechazada' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {app.status}
                        </span>

                        {/* Folio de liberación (Si existe) */}
                        {app.release_folio && (
                          <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200 dark:border-slate-600">
                            <Hash size={10} /> {app.release_folio}
                          </span>
                        )}
                      </div>

                      {/* Comentarios del Admin si los hay */}
                      {app.admin_comments && (
                        <div className="mt-2 text-[11px] text-gray-500 italic bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg">
                          " {app.admin_comments} "
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                <p className="text-sm text-gray-400 font-medium">No se registran solicitudes previas.</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};