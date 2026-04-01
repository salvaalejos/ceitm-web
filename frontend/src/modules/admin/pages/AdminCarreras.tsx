import { useState, useEffect } from 'react';
import {
  GraduationCap, Search, Edit, ExternalLink,
  MessageCircle, CheckCircle, XCircle, Lock, AlertTriangle,
  Trash2, Plus // <-- Nuevos iconos
} from 'lucide-react';
// 👇 Agregamos la importación de 'api' y 'Swal'
import { deleteCareer, getCareers } from '../../../shared/services/api';
import Swal from 'sweetalert2';
import type { Career } from '../../../shared/types';
import { CareerModal } from '../components/CareerModal';
import { usePermissions, ROLES } from '../../../shared/hooks/usePermissions';

export const AdminCarreras = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados del Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);

  const { user, isAdmin, isEstructura } = usePermissions();

  const isSuperAdmin = isAdmin || isEstructura;
  const isRepresentative = !isSuperAdmin;

  useEffect(() => {
    loadCareers();
  }, []);

  const loadCareers = async () => {
    setLoading(true);
    try {
      const data = await getCareers();
      setCareers(data.sort((a: Career, b: Career) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (career: Career) => {
    setEditingCareer(career);
    setShowModal(true);
  };

  // NUEVA FUNCIÓN: Abrir modal para crear
  const handleCreate = () => {
    setEditingCareer(null);
    setShowModal(true);
  };

  // NUEVA FUNCIÓN: Eliminar carrera
  const handleDelete = async (career: Career) => {
    const isDark = document.documentElement.classList.contains('dark');

    const res = await Swal.fire({
        title: '¿Eliminar carrera?',
        text: `Se eliminará "${career.name}" permanentemente.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#000'
    });

    if (res.isConfirmed) {
        try {
            await deleteCareer(career.id);
            Swal.fire({
                title: '¡Eliminada!',
                text: 'La carrera ha sido eliminada.',
                icon: 'success',
                background: isDark ? '#1e293b' : '#fff',
                color: isDark ? '#fff' : '#000'
            });
            loadCareers(); // Recargar la tabla
        } catch (error) {
            Swal.fire('Error', 'No se pudo eliminar la carrera', 'error');
        }
    }
  };

  const filteredCareers = careers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (isRepresentative) {
        return matchesSearch && c.name === user?.career;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <GraduationCap className="text-guinda-600" />
                {isRepresentative ? 'Mi Carrera' : 'Catálogo de Carreras'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
               {isRepresentative
                 ? "Gestiona el enlace oficial de WhatsApp para tu comunidad."
                 : "Gestiona los enlaces y visibilidad de todas las carreras."}
            </p>
        </div>

        {/* 👇 NUEVO BOTÓN: Añadir Carrera */}
        {isSuperAdmin && (
            <button
                onClick={handleCreate}
                className="bg-guinda-600 hover:bg-guinda-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-guinda-900/20 active:scale-95 whitespace-nowrap"
            >
                <Plus size={18} /> Añadir Carrera
            </button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar carrera..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
        {loading ? (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600 mb-2"></div>
                Cargando...
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Carrera</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">WhatsApp Oficial</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Estatus</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                        {filteredCareers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-10 text-center text-gray-500">
                                    {isRepresentative ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertTriangle className="text-yellow-500" size={32} />
                                            <p className="font-bold text-gray-700 dark:text-gray-300">No tienes una carrera asignada.</p>
                                            <p className="text-sm">Tu usuario dice: <span className="font-mono bg-gray-100 px-1">{user?.career || 'Sin carrera'}</span></p>
                                            <p className="text-xs text-gray-400">Si esto es un error, contacta a Sistemas.</p>
                                        </div>
                                    ) : (
                                        "No se encontraron carreras."
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filteredCareers.map((career) => {
                                const isMyCareer = user?.career === career.name;
                                const canEdit = isSuperAdmin || isMyCareer;

                                return (
                                    <tr key={career.id} className={`transition-colors ${canEdit ? 'hover:bg-gray-50 dark:hover:bg-slate-700/30' : 'opacity-75 bg-gray-50/50 dark:bg-slate-900/20'}`}>

                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                {career.name}
                                                {isRepresentative && (
                                                    <span className="ml-2 text-[10px] bg-guinda-100 text-guinda-700 px-2 py-0.5 rounded-full border border-guinda-200 font-bold uppercase">
                                                        Mi Carrera
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{career.slug}</div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {career.whatsapp_url ? (
                                                <a
                                                    href={career.whatsapp_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 hover:text-green-700 hover:underline font-bold"
                                                >
                                                    <MessageCircle size={16} /> Enlace Activo <ExternalLink size={12} />
                                                </a>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic flex items-center gap-1">
                                                    <MessageCircle size={16} /> Sin enlace
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full border ${
                                                career.is_active 
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                                                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700'
                                            }`}>
                                                {career.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {career.is_active ? 'Visible' : 'Oculta'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            {canEdit ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(career)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900/50 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-1.5"
                                                    >
                                                        <Edit size={14} /> Editar
                                                    </button>

                                                    {/* 👇 NUEVO BOTÓN: Eliminar (Solo Super Admins) */}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(career)}
                                                            className="text-red-500 hover:text-red-700 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/50 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center"
                                                            title="Eliminar carrera"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1 text-gray-400 text-xs cursor-not-allowed">
                                                    <Lock size={14} /> Solo lectura
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {showModal && (
        <CareerModal
            career={editingCareer}
            onClose={() => setShowModal(false)}
            onSuccess={loadCareers}
            canEditStatus={isSuperAdmin}
        />
      )}

    </div>
  );
};