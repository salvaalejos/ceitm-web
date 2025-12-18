import { useEffect, useState } from 'react';
import {
    Inbox, Calendar, User,
    FileText, ExternalLink, CheckCircle
} from 'lucide-react';
import { getComplaints, updateComplaintStatus } from '../../../shared/services/api';

export const AdminQuejas = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      try {
          const data = await getComplaints();
          setComplaints(data);
      } catch (error) {
          console.error("Error cargando quejas", error);
      } finally {
          setLoading(false);
      }
  };

  const handleStatusChange = async (id: number) => {
      if (!confirm('¿Marcar este reporte como RESUELTO?')) return;
      try {
          await updateComplaintStatus(id, 'Resuelto');
          loadData(); // Recargar
      } catch (error) {
          alert('Error actualizando estado');
      }
  };

  // Filtrado simple en frontend
  const filtered = complaints.filter(c =>
      filter === 'Todos' || c.status === filter
  );

  return (
    <div className="animate-fade-in pb-20">

        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Inbox className="text-guinda-600" /> Buzón de Entrada
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Revisión de quejas y sugerencias estudiantiles.</p>
            </div>

            {/* Filtro Estado */}
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-gray-200 dark:border-slate-800">
                {['Todos', 'Pendiente', 'Resuelto'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === status ? 'bg-guinda-50 dark:bg-guinda-900/20 text-guinda-700 dark:text-guinda-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* LISTA DE TARJETAS */}
        {loading ? (
            <div className="text-center py-20">Cargando buzón...</div>
        ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                <Inbox size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay reportes en esta categoría.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {filtered.map(item => (
                    <div key={item.id} className={`card-base p-6 border-l-4 ${item.status === 'Resuelto' ? 'border-l-green-500' : 'border-l-amber-500'} transition-all hover:shadow-lg`}>

                        {/* CABECERA */}
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded text-white ${item.type === 'Queja' ? 'bg-red-500' : item.type === 'Sugerencia' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                        {item.type}
                                    </span>
                                    <span className="text-sm text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {item.full_name} <span className="text-gray-400 font-normal text-sm">• {item.control_number}</span>
                                </h3>
                                <p className="text-sm text-guinda-600 dark:text-guinda-400 font-medium">
                                    {item.career} - {item.semester}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {item.status !== 'Resuelto' ? (
                                    <button
                                        onClick={() => handleStatusChange(item.id)}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Marcar Resuelto
                                    </button>
                                ) : (
                                    <span className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <CheckCircle size={16} /> Resuelto
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* CONTENIDO */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                    {item.description}
                                </p>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <User size={16} />
                                    <span>{item.phone_number}</span>
                                </div>

                                {item.evidence_url && (
                                    <a
                                        href={item.evidence_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 border border-blue-100 dark:border-blue-900/30 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium flex items-center justify-center gap-2"
                                    >
                                        <FileText size={16} /> Ver Evidencia Adjunta <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        )}
    </div>
  );
};