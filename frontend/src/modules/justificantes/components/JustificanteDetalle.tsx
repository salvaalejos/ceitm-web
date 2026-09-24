import { useEffect, useState } from 'react';
import { X, FileCheck2, Download, ExternalLink, Users } from 'lucide-react';
import type { Justificante } from '../../../shared/types';
import { downloadJustificantePdf } from '../../../shared/services/api';
import { JUSTIFICANTE_PUBLIC_URL } from '../../../shared/config/constants';
import { ESTADO_BADGE, ESTADO_LABEL, formatFecha, formatHora, TIPO_LABEL } from '../utils';

interface Props {
  justificante: Justificante;
  onClose: () => void;
}

export const JustificanteDetalle = ({ justificante: j, onClose }: Props) => {
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleDownload = async () => {
    setDescargando(true);
    try {
      await downloadJustificantePdf(j.id);
    } catch {
      alert('No se pudo descargar el PDF.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-base w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-guinda-100 dark:bg-guinda-900 flex items-center justify-center text-guinda-700 dark:text-guinda-400">
              <FileCheck2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Justificante #{j.id} - {TIPO_LABEL[j.tipo]}
              </h3>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full border ${ESTADO_BADGE[j.estado]}`}>
                {ESTADO_LABEL[j.estado]}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Folio</label>
                <p className="font-semibold text-gray-900 dark:text-white">{j.folio}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Fecha</label>
                <p className="font-semibold text-gray-900 dark:text-white">{formatFecha(j.fecha)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Horario</label>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatHora(j.hora_inicio)} a {formatHora(j.hora_fin)} hrs
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Creado por</label>
                <p className="font-semibold text-gray-900 dark:text-white">{j.creador || `Usuario #${j.created_by_id}`}</p>
              </div>
              {j.aprobador && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Aprobado por</label>
                  <p className="font-semibold text-gray-900 dark:text-white">{j.aprobador}</p>
                </div>
              )}
              {j.approved_at && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Hora de aprobación</label>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatFecha(j.approved_at.slice(0, 10))} · {formatHora(new Date(j.approved_at).toTimeString())} hrs
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Actividad realizada</label>
            <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed">{j.actividad}</p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
            <Users size={16} /> Participantes ({j.participantes.length})
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 uppercase text-xs border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Nombre</th>
                  <th className="px-4 py-2.5">Carrera</th>
                  <th className="px-4 py-2.5">No. de control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {j.participantes.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-white">{p.nombre}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{p.carrera}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-300">{p.numero_control}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {j.motivo_rechazo && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <label className="text-xs text-red-600 dark:text-red-300 uppercase tracking-wider font-bold">Motivo de rechazo</label>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{j.motivo_rechazo}</p>
            </div>
          )}

          {j.estado === 'aprobado' && j.sello_digital && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <label className="text-xs text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-bold">Sello digital</label>
              <p className="mt-1 font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300">{j.sello_digital}</p>
              {j.qr_token && (
                <a
                  href={JUSTIFICANTE_PUBLIC_URL(j.qr_token)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-guinda-600 hover:underline"
                >
                  <ExternalLink size={15} /> Ver página de verificación
                </a>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
          {j.estado === 'aprobado' && (
            <button onClick={handleDownload} disabled={descargando} className="btn-primary">
              <Download size={16} />
              {descargando ? 'Descargando...' : 'Descargar PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};