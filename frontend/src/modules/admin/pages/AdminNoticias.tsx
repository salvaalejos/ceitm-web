import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, FileText, ShieldAlert, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, deleteNews } from '../../../shared/services/api';
import { NewsForm } from '../components/NewsForm';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { COORDINACIONES } from '../../../shared/constants/coordinaciones';

export const AdminNoticias = () => {
  const { canManageNoticias } = usePermissions();

  const [news, setNews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA PAGINACIÓN Y BÚSQUEDA ---
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;

  if (!canManageNoticias) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acceso Restringido</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Este módulo es exclusivo para el área de Comunicación y Marketing.
            </p>
        </div>
    );
  }

  // Petición con Debounce
  useEffect(() => {
    if (!canManageNoticias) return;

    const timeoutId = setTimeout(() => {
        cargarDatos();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [page, searchTerm, canManageNoticias]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
        const skip = (page - 1) * limit;
        let url = `/noticias/?skip=${skip}&limit=${limit}`;

        if (searchTerm) {
            url += `&search=${encodeURIComponent(searchTerm)}`;
        }

        // Consumimos directamente la api para el backend paginado
        const { data } = await api.get(url);
        setNews(data.items);
        setTotal(data.total);
    } catch (error) {
        console.error("Error cargando noticias:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reinicia a pág 1 al escribir
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta noticia?')) {
        await deleteNews(id);
        cargarDatos(); // Recargamos para refrescar la paginación
    }
  };

  const openEdit = (item: any) => {
    setNewsToEdit(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setNewsToEdit(null);
  };

  const getCategoryLabel = (catId: string) => {
      if (!catId || catId === 'GENERAL') return 'General / Institucional';
      const found = COORDINACIONES.find(c => c.id === catId);
      return found ? found.label : catId;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in pb-20">

        {/* Header y Buscador */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Noticias y Avisos</h1>
                <p className="text-gray-500 dark:text-slate-400">Difusión de comunicados, eventos y multimedia.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título o categoría..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 shadow-sm transition-all text-sm"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto py-2.5 px-4 rounded-lg bg-guinda-600 text-white hover:bg-guinda-700 transition-all shadow-md">
                    <Plus size={20} /> <span className="hidden sm:inline">Nueva Noticia</span>
                </button>
            </div>
        </div>

        {/* Tabla */}
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
                            <th className="px-6 py-4">Portada</th>
                            <th className="px-6 py-4">Título / Extracto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {news.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-900 overflow-hidden border border-gray-200 dark:border-slate-700 relative">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><FileText size={24}/></div>
                                        )}
                                    </div>
                                </td>

                                <td className="px-6 py-4 max-w-xs">
                                    <div className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{item.title}</div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 line-clamp-1">{item.excerpt}</div>
                                </td>

                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300">
                                        {getCategoryLabel(item.category)}
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    {item.is_published ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            <CheckCircle size={12} /> Publicado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                            <XCircle size={12} /> Borrador
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {news.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-slate-500">
                                    No se encontraron noticias.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- CONTROLES DE PAGINACIÓN --- */}
            {news.length > 0 && !loading && (
                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Mostrando <span className="font-bold text-gray-900 dark:text-white">{news.length}</span> de <span className="font-bold text-gray-900 dark:text-white">{total}</span>
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

        {/* Modal */}
        {showForm && (
            <NewsForm
                onClose={closeForm}
                onSuccess={cargarDatos}
                newsToEdit={newsToEdit}
            />
        )}
    </div>
  );
};