import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, User as UserIcon, ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, deleteUser } from '../../../shared/services/api';
import { UserForm } from '../components/UserForm';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const AdminUsuarios = () => {
  const { canManageUsers } = usePermissions();

  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA PAGINACIÓN Y BÚSQUEDA ---
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const limit = 10;

  // Carga de usuarios con debounce para la búsqueda
  useEffect(() => {
    if (!canManageUsers) return;

    const timeoutId = setTimeout(() => {
      cargarUsuarios();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [page, filter, canManageUsers]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
        const skip = (page - 1) * limit;
        const searchParam = filter ? `&search=${encodeURIComponent(filter)}` : '';

        // Consumimos el endpoint directamente para poder pasarle los query params
        const { data } = await api.get(`/users/?skip=${skip}&limit=${limit}${searchParam}`);

        setUsers(data.items);
        setTotal(data.total);
    } catch (error) {
        console.error("Error cargando usuarios:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setPage(1); // Regresamos a la página 1 al buscar
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
        try {
            await deleteUser(id);
            cargarUsuarios();
        } catch (error) {
            alert('No puedes eliminarte a ti mismo o hubo un error.');
        }
    }
  };

  const openEdit = (user: any) => {
    setUserToEdit(user);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setUserToEdit(null);
  };

  // --- BLOQUEO DE SEGURIDAD ---
  if (!canManageUsers) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acceso Restringido</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                No tienes los permisos necesarios para administrar usuarios.
                Si crees que esto es un error, contacta a la Presidencia del Consejo.
            </p>
        </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in pb-10">

        {/* Header y Buscador */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Equipo del Consejo</h1>
                <p className="text-gray-500 dark:text-gray-400">Gestiona roles, accesos y perfiles de los concejales.</p>
            </div>

            <div className="flex w-full md:w-auto items-center gap-3">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 shadow-sm transition-all text-sm"
                        value={filter}
                        onChange={handleSearch}
                    />
                </div>

                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 bg-guinda-600 text-white rounded-lg hover:bg-guinda-700 transition-colors whitespace-nowrap shadow-sm">
                    <Plus size={18} /> <span className="hidden sm:inline">Nuevo Miembro</span>
                </button>
            </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden relative">

            {/* Loader Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600"></div>
                </div>
            )}

            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs uppercase font-bold border-b border-gray-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Rol / Área</th>
                            <th className="px-6 py-4">Carrera</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {!loading && users.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic">No se encontraron usuarios.</td></tr>
                        ) : users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden border border-gray-200 dark:border-slate-600 shrink-0">
                                            {u.imagen_url ? (
                                                <img src={u.imagen_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><UserIcon size={18}/></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-gray-900 dark:text-white truncate">{u.full_name}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{u.area}</div>
                                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                                        u.role === 'admin_sys' 
                                            ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                                            : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    {u.career || 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    {u.is_active ? (
                                        <span className="text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30 px-2 py-1 rounded text-xs font-bold">Activo</span>
                                    ) : (
                                        <span className="text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-2 py-1 rounded text-xs font-bold">Inactivo</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEdit(u)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginación */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Mostrando <span className="font-bold text-gray-900 dark:text-white">{users.length}</span> de <span className="font-bold text-gray-900 dark:text-white">{total}</span>
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
        </div>

        {/* Modal Formulario */}
        {showForm && (
            <UserForm
                onClose={closeForm}
                onSuccess={cargarUsuarios}
                userToEdit={userToEdit}
            />
        )}
    </div>
  );
};