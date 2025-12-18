import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, Download, Lock, Globe } from 'lucide-react';
import { getAllDocuments, deleteDocument } from '../../../shared/services/api';
import { DocumentForm } from '../components/DocumentForm';

export const AdminDocumentos = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    setLoading(true);
    try {
        const data = await getAllDocuments(); // Usamos el endpoint de Admin que trae TODO
        setDocs(data);
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
    if (confirm('¿Eliminar documento permanentemente?')) {
        await deleteDocument(id);
        cargarDatos();
    }
  };

  return (
    <div className="animate-fade-in">

        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Repositorio de Documentos</h1>
                <p className="text-gray-500 dark:text-slate-400">Sube actas, informes y convocatorias.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                <Plus size={20} /> Subir PDF
            </button>
        </div>

        <div className="card-base overflow-hidden">
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
                                <div className="text-xs text-gray-500">{doc.description}</div>
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
                                <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {docs.length === 0 && !loading && (
                        <tr><td colSpan={5} className="text-center py-10 text-gray-500">No hay documentos.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {showForm && (
            <DocumentForm onClose={() => setShowForm(false)} onSuccess={cargarDatos} />
        )}
    </div>
  );
};