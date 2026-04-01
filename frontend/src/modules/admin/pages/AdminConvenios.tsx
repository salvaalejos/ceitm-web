import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, deleteConvenio } from '../../../shared/services/api';
import { ConvenioForm } from '../components/ConvenioForm';
import type { Convenio } from '../../../shared/types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const AdminConvenios = () => {
  const { canManageConvenios } = usePermissions();

  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [convenioEditar, setConvenioEditar] = useState<Convenio | null>(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA PAGINACIÓN Y BÚSQUEDA ---
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;

  // Bloqueo de seguridad
  if (!canManageConvenios) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acceso Restringido</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Este módulo es exclusivo para el área de Vinculación y la Directiva.
            </p>
        </div>
    );
  }

  // Petición con Debounce
  useEffect(() => {
    if (!canManageConvenios) return;

    const timeoutId = setTimeout(() => {
        cargarDatos();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [page, searchTerm, canManageConvenios]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let url = `/convenios/?skip=${skip}&limit=${limit}`;

      if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      // Consumimos directamente la api para mandarle los query params
      const { data } = await api.get(url);
      setConvenios(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reinicia a pág 1 al escribir
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este convenio?')) {
        await deleteConvenio(id);
        cargarDatos();
    }
  };

  const handleEdit = (convenio: Convenio) => {
    setConvenioEditar(convenio);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setConvenioEditar(null);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in pb-20">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Convenios</h1>
            <p className="text-gray-500 dark:text-gray-400">Administra los aliados comerciales del CEITM.</p>
        </div>

        {/* BUSCADOR Y BOTÓN */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar convenio o categoría..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 shadow-sm transition-all text-sm"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>
            <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-guinda-600 text-white rounded-lg hover:bg-guinda-700 shadow-md transition-all whitespace-nowrap w-full md:w-auto"
            >
                <Plus size={20} /> <span className="hidden sm:inline">Nuevo Convenio</span>
            </button>
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
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 uppercase text-xs font-bold border-b border-gray-100 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Logo</th>
                        <th className="px-6 py-4">Nombre</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {convenios.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">#{c.id}</td>
                            <td className="px-6 py-4">
                                <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-white overflow-hidden border border-gray-200">
                                    {c.imagen_url ? (
                                        <img src={c.imagen_url} alt="Logo" className="h-full w-full object-contain p-1" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.nombre}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-800">
                                    {c.categoria}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(c)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {convenios.length === 0 && !loading && (
                        <tr>
                            <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No se encontraron convenios.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* --- CONTROLES DE PAGINACIÓN --- */}
        {convenios.length > 0 && !loading && (
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Mostrando <span className="font-bold text-gray-900 dark:text-white">{convenios.length}</span> de <span className="font-bold text-gray-900 dark:text-white">{total}</span>
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
        <ConvenioForm
            onClose={handleCloseForm}
            onSuccess={cargarDatos}
            convenioToEdit={convenioEditar}
        />
      )}

    </div>
  );
};