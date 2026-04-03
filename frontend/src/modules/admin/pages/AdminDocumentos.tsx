import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, Download, Lock, Globe, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllDocuments, deleteDocument } from '../../../shared/services/api';
import { DocumentForm } from '../components/DocumentForm';
import { useAuthStore } from '../../../shared/store/authStore';

export const AdminDocumentos = () => {
  // 👇 AÑADIDO: Obtenemos al usuario para saber sus permisos visuales
  const { user } = useAuthStore();
  const canUpload = user?.role === 'admin_sys' || user?.role === 'estructura';
  const canDelete = user?.role === 'admin_sys';

  const [docs, setDocs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA PAGINACIÓN Y BÚSQUEDA ---
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        cargarDatos();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [page, searchTerm]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
        const skip = (page - 1) * limit;
        const data = await getAllDocuments(skip, limit, searchTerm);
        setDocs(data.items);
        setTotal(data.total);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar documento permanentemente?')) {
        await deleteDocument(id);
        cargarDatos();
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in pb-20">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Repositorio de Documentos</h1>
                <p className="text-gray-500 dark:text-slate-400">Consulta de actas, informes y convocatorias.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título o descripción..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 shadow-sm transition-all text-sm"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                {/* 👇 AÑADIDO: Ocultar botón si no tiene permisos */}
                {canUpload && (
                    <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto py-2.5 px-4 rounded-lg bg-guinda-600 text-white hover:bg-guinda-700 transition-all shadow-md">
                        <Plus size={20} /> <span className="hidden sm:inline">Subir PDF</span>
                    </button>
                )}
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden relative">

            {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600"></div>
                </div>
            )}

            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase font-bold border-b border-gray-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Título / Descripción</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Visibilidad</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {docs.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg w-fit">
                                        <FileText size={20} />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{doc.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-slate-400">{doc.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs rounded-full font-medium">
                                        {doc.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {doc.is_public ? (
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full w-fit">
                                            <Globe size={12} /> Público
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full w-fit">
                                            <Lock size={12} /> Privado
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                        <Download size={18} />
                                    </a>
                                    {/* 👇 AÑADIDO: Ocultar botón eliminar si no es ADMIN_SYS */}
                                    {canDelete && (
                                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {docs.length === 0 && !loading && (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-500 dark:text-slate-400">No se encontraron documentos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- CONTROLES DE PAGINACIÓN --- */}
            {docs.length > 0 && !loading && (
                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Mostrando <span className="font-bold text-gray-900 dark:text-white">{docs.length}</span> de <span className="font-bold text-gray-900 dark:text-white">{total}</span>
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">
                            Página {page} de {totalPages || 1}
                        </span>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || totalPages === 0}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>

        {showForm && (
            <DocumentForm onClose={() => setShowForm(false)} onSuccess={cargarDatos} />
        )}
    </div>
  );
};