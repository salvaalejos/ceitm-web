import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Loader2, Users, ArrowLeft } from 'lucide-react';
import { getJustificantePublico } from '../../../shared/services/api';
import { IMAGES } from '../../../shared/config/constants';
import type { Justificante } from '../../../shared/types';
import { formatFecha, formatHora, TIPO_LABEL } from '../utils';

export const JustificantePublicoPage = () => {
  const { token } = useParams<{ token: string }>();
  const [justificante, setJustificante] = useState<Justificante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getJustificantePublico(token)
      .then((j) => { setJustificante(j); setLoading(false); })
      .catch(() => {
        setError('Este justificante no está disponible o aún no ha sido aprobado.');
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-guinda-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-guinda-700 dark:bg-guinda-900 px-6 py-5 flex items-center gap-3">
            <img src={IMAGES.LOGO_BLANCO} alt="CEITM" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-white font-bold">Verificación de Justificante</h1>
              <p className="text-white/70 text-sm">Concejo Estudiantil del ITM</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {!token && (
              <div className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Documento no válido</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Enlace de verificación inválido.</p>
              </div>
            )}

            {token && loading && (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
                <Loader2 className="animate-spin" size={20} /> Verificando documento...
              </div>
            )}

            {token && error && !loading && (
              <div className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Documento no válido</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{error}</p>
              </div>
            )}

            {token && justificante && !loading && !error && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0" size={28} />
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">
                      Documento verificado digitalmente
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Este justificante cuenta con sello digital emitido por el CEITM.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tipo</label>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{TIPO_LABEL[justificante.tipo]}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Folio</label>
                    <p className="font-semibold text-gray-900 dark:text-white">{justificante.folio}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Fecha</label>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatFecha(justificante.fecha)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Horario</label>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatHora(justificante.hora_inicio)} a {formatHora(justificante.hora_fin)} hrs
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Actividad realizada</label>
                  <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed">{justificante.actividad}</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                  <Users size={16} /> Participantes ({justificante.participantes.length})
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
                      {justificante.participantes.map((p, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 text-gray-900 dark:text-white">{p.nombre}</td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{p.carrera}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-300">{p.numero_control}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">Validación digital</label>
                  <p className="font-mono text-sm font-bold text-guinda-700 dark:text-guinda-400 break-all">
                    {justificante.sello_digital}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Aprobado por <span className="font-semibold">{justificante.aprobador}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Fecha y hora de aprobación:{' '}
                    <span className="font-semibold">
                      {formatFecha(justificante.approved_at?.slice(0, 10) || '')} a las{' '}
                      {formatHora(new Date(justificante.approved_at || '').toTimeString())} hrs
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};