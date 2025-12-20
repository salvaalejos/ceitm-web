import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, ShieldAlert } from 'lucide-react';
import { getConvenios, deleteConvenio } from '../../../shared/services/api';
import { ConvenioForm } from '../components/ConvenioForm';
import type { Convenio } from '../../../shared/types';
import { usePermissions } from '../../../shared/hooks/usePermissions'; // <--- ÚNICO AGREGADO: Importar Hook

export const AdminConvenios = () => {
  // 👇 AGREGADO: Permiso de seguridad
  const { canManageConvenios } = usePermissions();

  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [convenioEditar, setConvenioEditar] = useState<Convenio | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 🔒 BLOQUEO DE SEGURIDAD (Agregado) ---
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

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getConvenios();
      setConvenios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo cargamos si tiene permiso (aunque el bloqueo de arriba ya lo evita, es doble check)
    if (canManageConvenios) {
        cargarDatos();
    }
  }, [canManageConvenios]);

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

  return (
    <div className="animate-fade-in">

      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Convenios</h1>
            <p className="text-gray-500 dark:text-gray-400">Administra los aliados comerciales del CEITM.</p>
        </div>
        <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-guinda-600 text-white rounded-lg hover:bg-guinda-700 shadow-md transition-all"
        >
            <Plus size={20} /> Nuevo Convenio
        </button>
      </div>

      {/* Tabla (TU CÓDIGO ORIGINAL INTACTO) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
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
                            No hay convenios registrados aún.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Modal */}
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