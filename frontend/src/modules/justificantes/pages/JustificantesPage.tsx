import { useCallback, useEffect, useState } from 'react';
import { Plus, FileCheck2, Eye, Download, ClipboardCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { getAprobaciones, getMisJustificantes, downloadJustificantePdf } from '../../../shared/services/api';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import type { Justificante } from '../../../shared/types';
import { JustificanteEstado } from '../../../shared/types';
import { JustificanteForm } from '../components/JustificanteForm';
import { JustificanteDetalle } from '../components/JustificanteDetalle';
import { AprobacionModal } from '../components/AprobacionModal';
import { ESTADO_BADGE, ESTADO_LABEL, formatFecha, formatHora, TIPO_LABEL } from '../utils';

type Tab = 'mis' | 'aprobaciones';

export const JustificantesPage = () => {
  const { canAprobarJustificantes } = usePermissions();

  const [tab, setTab] = useState<Tab>('mis');
  const [mios, setMios] = useState<Justificante[]>([]);
  const [aprobaciones, setAprobaciones] = useState<Justificante[]>([]);
  const [filtroMios, setFiltroMios] = useState<string>('');
  const [filtroAprob, setFiltroAprob] = useState<string>('pendiente');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [detalle, setDetalle] = useState<Justificante | null>(null);
  const [revision, setRevision] = useState<Justificante | null>(null);

  const cargarMios = useCallback(async () => {
    try {
      const res = await getMisJustificantes({ estado: filtroMios || undefined, limit: 200 });
      setMios(res.items);
    } catch (err) {
      console.error(err);
    }
  }, [filtroMios]);

  const cargarAprobaciones = useCallback(async () => {
    try {
      const res = await getAprobaciones({ estado: filtroAprob || undefined, limit: 200 });
      setAprobaciones(res.items);
    } catch (err) {
      console.error(err);
    }
  }, [filtroAprob]);

  useEffect(() => {
    Promise.resolve()
      .then(async () => {
        await cargarMios();
        if (canAprobarJustificantes) await cargarAprobaciones();
      })
      .then(() => setLoading(false));
  }, [cargarMios, cargarAprobaciones, canAprobarJustificantes]);

  const recargar = () => {
    cargarMios();
    if (canAprobarJustificantes) cargarAprobaciones();
  };

  const handleDownload = async (j: Justificante) => {
    try {
      await downloadJustificantePdf(j.id);
    } catch {
      alert('No se pudo descargar el PDF.');
    }
  };

  const estados = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobado', label: 'Aprobados' },
    { value: 'rechazado', label: 'Rechazados' },
  ];

  const renderTable = (items: Justificante[], esAprobaciones: boolean) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden relative min-h-[200px]">
      {items.length === 0 && !loading ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          No hay justificantes en esta vista.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 uppercase text-xs font-bold border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-5 py-4">Folio</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Actividad</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Horario</th>
                {esAprobaciones && <th className="px-5 py-4">Solicitante</th>}
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {items.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-sm font-bold text-gray-900 dark:text-white">{j.folio}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-slate-700 capitalize">
                      {TIPO_LABEL[j.tipo]}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-[220px]">
                    <p className="truncate text-sm text-gray-700 dark:text-gray-300" title={j.actividad}>{j.actividad}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatFecha(j.fecha)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatHora(j.hora_inicio)} - {formatHora(j.hora_fin)}
                  </td>
                  {esAprobaciones && (
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{j.creador || '-'}</td>
                  )}
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full border capitalize ${ESTADO_BADGE[j.estado]}`}>
                      {ESTADO_LABEL[j.estado]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      {esAprobaciones && j.estado === JustificanteEstado.PENDIENTE ? (
                        <button
                          onClick={() => setRevision(j)}
                          className="p-2 text-guinda-600 hover:bg-guinda-50 dark:hover:bg-guinda-900/20 rounded-lg transition-colors"
                          title="Aprobar / Rechazar"
                        >
                          <ClipboardCheck size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDetalle(j)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      {j.estado === JustificanteEstado.APROBADO && (
                        <button
                          onClick={() => handleDownload(j)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Justificantes Digitales</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Crea justificantes individuales o colectivos; una vez aprobados se sellan digitalmente.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-guinda-600 text-white rounded-lg hover:bg-guinda-700 shadow-md transition-all whitespace-nowrap"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Nuevo justificante</span>
        </button>
      </div>

      {canAprobarJustificantes && (
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-800">
          {([
            { id: 'mis', label: 'Mis justificantes' },
            { id: 'aprobaciones', label: 'Aprobaciones' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-guinda-600 text-guinda-700 dark:text-guinda-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'mis' ? (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <select
              value={filtroMios}
              onChange={(e) => setFiltroMios(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-guinda-500"
            >
              {estados.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <button onClick={recargar} className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Recargar">
              <RefreshCw size={18} />
            </button>
          </div>
          {renderTable(mios, false)}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <select
              value={filtroAprob}
              onChange={(e) => setFiltroAprob(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-guinda-500"
            >
              {estados.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <button onClick={recargar} className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Recargar">
              <RefreshCw size={18} />
            </button>
          </div>
          {renderTable(aprobaciones, true)}
        </>
      )}

      {loading && (
        <div className="fixed inset-0 z-40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600"></div>
        </div>
      )}

      {showForm && <JustificanteForm onClose={() => setShowForm(false)} onSuccess={recargar} />}
      {detalle && <JustificanteDetalle justificante={detalle} onClose={() => setDetalle(null)} />}
      {revision && (
        <AprobacionModal
          justificante={revision}
          onClose={() => setRevision(null)}
          onSuccess={recargar}
        />
      )}

      {!canAprobarJustificantes && (
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <ShieldAlert size={14} /> La pestaña de aprobaciones es exclusiva para Estructura y Administración.
        </div>
      )}
    </div>
  );
};

export const JustificantesPageIcon = FileCheck2;