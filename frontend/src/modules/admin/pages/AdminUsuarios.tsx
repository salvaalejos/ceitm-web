import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, User as UserIcon, ShieldAlert } from 'lucide-react';
import { getUsers, deleteUser } from '../../../shared/services/api';
import { UserForm } from '../components/UserForm';
import { usePermissions } from '../../../shared/hooks/usePermissions'; // <--- IMPORTAMOS EL HOOK

export const AdminUsuarios = () => {
  // 👇 Verificamos permiso crítico
  const { canManageUsers } = usePermissions();

  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // --- BLOQUEO DE SEGURIDAD (Si entra por URL directa) ---
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

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
        const data = await getUsers();
        setUsers(data);
    } catch (error) {
        console.error("Error cargando usuarios:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
        cargarUsuarios();
    }
  }, [canManageUsers]);

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

  return (
    <div className="animate-fade-in">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Equipo del Consejo</h1>
                <p className="text-gray-500 dark:text-gray-400">Gestiona roles, accesos y perfiles de los concejales.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-4 py-2 bg-guinda-600 text-white rounded-lg hover:bg-guinda-700 transition-colors">
                <Plus size={20} /> Nuevo Miembro
            </button>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
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
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden border border-gray-200 dark:border-slate-600">
                                        {u.imagen_url ? (
                                            <img src={u.imagen_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><UserIcon size={18}/></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{u.full_name}</div>
                                        <div className="text-xs text-gray-500 dark:text-slate-400">{u.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.area}</div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
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
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button onClick={() => openEdit(u)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Modal */}
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