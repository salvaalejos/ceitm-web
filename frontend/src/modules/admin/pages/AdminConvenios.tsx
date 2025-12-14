import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { getConvenios, deleteConvenio } from '../../../shared/services/api';
import { ConvenioForm } from '../components/ConvenioForm';
import type { Convenio } from '../../../shared/types';

export const AdminConvenios = () => {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
    cargarDatos();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este convenio?')) {
        await deleteConvenio(id);
        cargarDatos(); // Recargar la lista
    }
  };

  return (
    <div className="animate-fade-in">

      {/* Header de la Página */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Convenios</h1>
            <p className="text-gray-500">Administra los aliados comerciales del CEITM.</p>
        </div>
        <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-guinda-600 text-white rounded-lg hover:bg-guinda-700 shadow-md transition-all"
        >
            <Plus size={20} /> Nuevo Convenio
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs font-bold">
                <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Logo</th>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {convenios.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">#{c.id}</td>
                        <td className="px-6 py-4">
                            <img src={c.imagen_url} alt="Logo" className="h-10 w-10 rounded-full object-cover bg-gray-100" />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.nombre}</td>
                        <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{c.categoria}</span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar (Próximamente)">
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(c.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                ))}

                {convenios.length === 0 && !loading && (
                    <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-500">
                            No hay convenios registrados aún.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Modal del Formulario */}
      {showForm && (
        <ConvenioForm
            onClose={() => setShowForm(false)}
            onSuccess={cargarDatos} // Recargar tabla al guardar
        />
      )}

    </div>
  );
};