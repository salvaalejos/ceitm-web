import { useEffect, useState } from 'react';
import { X, Check, XCircle, Download, ExternalLink, ShieldCheck, UserCheck } from 'lucide-react';
import type { Justificante } from '../../../shared/types';
import {
  aprobarJustificante,
  downloadJustificantePdf,
  getMiFirma,
  rechazarJustificante,
} from '../../../shared/services/api';
import { JUSTIFICANTE_PUBLIC_URL } from '../../../shared/config/constants';
import { formatFecha, formatHora, TIPO_LABEL } from '../utils';
import { FirmaUpload } from './FirmaUpload';

interface Props {
  justificante: Justificante;
  onClose: () => void;
  onSuccess: () => void;
}

export const AprobacionModal = ({ justificante: j, onClose, onSuccess }: Props) => {
  const [firma, setFirma] = useState<{ imagen_url: string | null }>({ imagen_url: null });
  const [loadingFirma, setLoadingFirma] = useState(true);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [aprobado, setAprobado] = useState<Justificante | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    getMiFirma().then(setFirma).catch(() => setFirma({ imagen_url: null })).finally(() => setLoadingFirma(false));
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleAprobar = async () => {
    if (!firma.imagen_url) {
      alert('Primero sube tu firma digital para poder aprobar.');
      return;
    }
    setProcesando(true);
    try {
      const res = await aprobarJustificante(j.id);
      setAprobado(res);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      alert(detail || 'No se pudo aprobar el justificante.');
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivo.trim()) {
      alert('Debes indicar el motivo del rechazo.');
      return;
    }
    setProcesando(true);
    try {
      await rechazarJustificante(j.id, motivo.trim());
      onSuccess();
      onClose();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      alert(detail || 'No se pudo rechazar el justificante.');
    } finally {
      setProcesando(false);
    }
  };

  if (aprobado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="card-base w-full max-w-lg flex flex-col max-h-[90vh] animate-fade-in">
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Justificante aprobado</h3>
                <p className="text-sm text-gray-500">Sello digital generado correctamente.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
              <label className="text-xs text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-bold">Sello digital</label>
              <p className="mt-1 font-mono font-bold text-emerald-800 dark:text-emerald-300 break-all">{aprobado.sello_digital}</p>
              <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                Aprobado el {formatFecha(aprobado.approved_at?.slice(0, 10) || '')} a las {formatHora(new Date(aprobado.approved_at || '').toTimeString())} hrs
              </p>
            </div>

            {aprobado.qr_token && (
              <div className="text-center">
                <a
                  href={JUSTIFICANTE_PUBLIC_URL(aprobado.qr_token)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-guinda-200 dark:border-guinda-800 text-guinda-700 dark:text-guinda-300 font-medium text-sm hover:bg-guinda-50 dark:hover:bg-guinda-900/20 transition-colors"
                >
                  <ExternalLink size={16} /> Abrir página de verificación
                </a>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">Cerrar</button>
            <button
              onClick={async () => { try { await downloadJustificantePdf(j.id); } catch { alert('No se pudo descargar el PDF.'); } }}
              className="btn-primary"
            >
              <Download size={16} /> Descargar PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-base w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-guinda-100 dark:bg-guinda-900 flex items-center justify-center text-guinda-700 dark:text-guinda-400">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Revisar justificante #{j.id} ({TIPO_LABEL[j.tipo]})
              </h3>
              <p className="text-sm text-gray-500">Solicitado por {j.creador || `Usuario #${j.created_by_id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Folio</label>
              <p className="font-semibold text-gray-900 dark:text-white">{j.folio}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Fecha</label>
              <p className="font-semibold text-gray-900 dark:text-white">{formatFecha(j.fecha)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Horario</label>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatHora(j.hora_inicio)} a {formatHora(j.hora_fin)} hrs
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Participantes</label>
              <p className="font-semibold text-gray-900 dark:text-white">{j.participantes.length}</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Actividad realizada</label>
            <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed">{j.actividad}</p>
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

          {!rechazando && (
            <>
              {loadingFirma ? (
                <div className="animate-pulse h-24 rounded-xl bg-gray-100 dark:bg-slate-800" />
              ) : (
                <FirmaUpload existingUrl={firma.imagen_url} onUploaded={(url) => setFirma({ imagen_url: url })} />
              )}
            </>
          )}

          {rechazando && (
            <div>
              <label className="form-label">Motivo del rechazo</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Indica el motivo por el cual se rechaza el justificante..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500 text-sm"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          {!rechazando ? (
            <>
              <button
                onClick={() => setRechazando(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <XCircle size={16} /> Rechazar
              </button>
              <button onClick={handleAprobar} disabled={procesando} className="btn-primary">
                <Check size={16} />
                {procesando ? 'Aprobando...' : 'Aprobar y sellar'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setRechazando(false); setMotivo(''); }} className="btn-secondary">Volver</button>
              <button onClick={handleRechazar} disabled={procesando} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                <XCircle size={16} />
                {procesando ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};