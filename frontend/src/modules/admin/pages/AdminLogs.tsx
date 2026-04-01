import { useEffect, useState } from 'react';
import {
  Activity, ShieldAlert, Filter, Database,
  User, Trash2, Edit, PlusCircle, LogIn, FileText, Loader2
} from 'lucide-react';
import { getAuditLogs, downloadDbBackup } from '../../../shared/services/api';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const AdminLogs = () => {
  const { canManageUsers } = usePermissions();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filterModule, setFilterModule] = useState('');

  // --- 🔒 BLOQUEO DE SEGURIDAD ---
  if (!canManageUsers) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acceso Restringido</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Esta bitácora es exclusiva para Auditoría y Presidencia.
            </p>
        </div>
    );
  }

  const cargarLogs = async () => {
    setLoading(true);
    try {
        const data = await getAuditLogs(filterModule || undefined);
        setLogs(data);
    } catch (error) {
        console.error("Error cargando auditoría:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
        cargarLogs();
    }
  }, [filterModule]);

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      await downloadDbBackup();
    } catch (error) {
      console.error("Fallo al descargar el respaldo:", error);
      alert("Error al descargar el respaldo de la base de datos.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper para estilos
  const getActionStyle = (action: string) => {
    switch (action) {
        case 'CREATE': return { icon: PlusCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
        case 'DELETE': return { icon: Trash2, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
        case 'UPDATE': return { icon: Edit, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' };
        case 'LOGIN': return { icon: LogIn, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' };
        case 'EVALUACION': return { icon: FileText, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' };
        default: return { icon: Activity, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' };
    }
  };

  return (
    <div className="animate-fade-in pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Activity className="text-guinda-600" /> Auditoría del Sistema
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">Rastreo de movimientos críticos y seguridad.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

                {/* BOTÓN PARA DESCARGAR RESPALDO BD */}
                <button
                    onClick={handleDownloadBackup}
                    disabled={isDownloading}
                    className="group relative flex items-center justify-center gap-3 px-6 py-2.5 w-full sm:w-auto overflow-hidden rounded-xl border-2 border-guinda-600 bg-white dark:bg-slate-900 text-guinda-600 dark:text-guinda-400 font-bold text-sm shadow-sm transition-all hover:bg-guinda-600 hover:text-white active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {/* Efecto de brillo al pasar el mouse */}
                    <div
                        className="absolute inset-0 w-1/4 h-full bg-white/20 skew-x-[-25deg] -translate-x-full group-hover:animate-shimmer"/>

                    {isDownloading ? (
                        <Loader2 size={18} className="animate-spin"/>
                    ) : (
                        <Database size={18} className="transition-transform group-hover:rotate-12"/>
                    )}

                    <span>{isDownloading ? 'Generando dump...' : 'Respaldar Base de Datos'}</span>
                </button>

                <div className="relative w-full sm:w-auto">
                    <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <select
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                        className="w-full sm:w-auto pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-guinda-500 focus:border-transparent outline-none transition-all cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">Todos los Módulos</option>
                        <option value="AUTH">Sesiones (Login)</option>
                        <option value="USUARIOS">Usuarios</option>
                        <option value="BECAS">Becas</option>
                        <option value="DOCUMENTOS">Documentos</option>
                        <option value="CONVENIOS">Convenios</option>
                        <option value="NOTICIAS">Noticias</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Tabla */}
        <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden relative">

            {loading && (
                <div
                    className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600"></div>
                </div>
            )}

            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left">
                    <thead
                        className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs uppercase font-bold border-b border-gray-100 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">Acción</th>
                        <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Detalle</th>
                            <th className="px-6 py-4">Módulo</th>
                            <th className="px-6 py-4 text-right">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {logs.map((log) => {
                            const style = getActionStyle(log.action);
                            const Icon = style.icon;
                            return (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit text-xs font-bold border border-transparent ${style.color}`}>
                                            <Icon size={14} />
                                            {log.action}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 shrink-0">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">{log.user_email}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 capitalize truncate">{log.user_role?.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-700 dark:text-slate-300 font-medium line-clamp-2">{log.details}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono font-bold text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded bg-gray-50 dark:bg-slate-800">
                                            {log.module}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                                            {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && !loading && (
                            <tr><td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">No hay registros recientes.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};