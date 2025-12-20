import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, FileText, Youtube, ShieldAlert } from 'lucide-react';
import { getNews, deleteNews } from '../../../shared/services/api';
import { NewsForm } from '../components/NewsForm';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const AdminNoticias = () => {
  const { canManageNoticias } = usePermissions();

  const [news, setNews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 🔒 BLOQUEO DE SEGURIDAD ---
  // Si no tienes permiso, te sacamos una alerta en lugar de la tabla.
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

  // --- Lógica normal para quienes SÍ tienen permiso ---
  const cargarDatos = async () => {
    setLoading(true);
    try {
        const data = await getNews();
        setNews(data);
    } catch (error) {
        console.error("Error cargando noticias:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageNoticias) {
        cargarDatos();
    }
  }, [canManageNoticias]);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta noticia?')) {
        await deleteNews(id);
        cargarDatos();
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

  return (
    <div className="animate-fade-in">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Noticias y Avisos</h1>
                <p className="text-gray-500 dark:text-slate-400">Difusión de comunicados, eventos y multimedia.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                <Plus size={20} /> Nueva Noticia
            </button>
        </div>

        {/* Tabla */}
        <div className="card-base overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase font-bold border-b border-gray-100 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">Portada</th>
                        <th className="px-6 py-4">Título / Extracto</th>
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
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{item.title}</div>
                                <div className="text-sm text-gray-500 dark:text-slate-400 line-clamp-1">{item.excerpt}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                                {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button onClick={() => openEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {news.length === 0 && !loading && (
                        <tr>
                            <td colSpan={4} className="text-center py-12 text-gray-500 dark:text-slate-500">
                                No hay noticias publicadas aún.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
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