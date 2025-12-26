import { useState, useEffect } from 'react';
import {
  GraduationCap, Search, Edit, ExternalLink,
  MessageCircle, CheckCircle, XCircle, Lock, AlertTriangle
} from 'lucide-react';
import { getCareers } from '../../../shared/services/api';
import type { Career } from '../../../shared/types';
import { CareerModal } from '../components/CareerModal';
// 👇 Importamos el Hook y las CONSTANTES DE ROLES
import { usePermissions, ROLES } from '../../../shared/hooks/usePermissions';

export const AdminCarreras = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados del Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);

  // 👇 Usamos el Hook para obtener usuario y flags básicos
  const { user, isAdmin, isEstructura } = usePermissions();

  // --- LÓGICA DE PERMISOS PARA ESTA PÁGINA ---

  // 1. ¿Es "Super Admin"? (Puede ver todo y editar estatus)
  const isSuperAdmin = isAdmin || isEstructura;

  // 2. ¿Es "Representante"? (Coordinador, Vocal o Concejal)
  // Si NO es Super Admin, asumimos que es un representante que solo debe ver SU carrera.
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

  // 👇 FILTRO:
  const filteredCareers = careers.filter(c => {
    // A. Búsqueda por texto
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.slug.toLowerCase().includes(searchTerm.toLowerCase());

    // B. Filtro por Rol
    if (isRepresentative) {
        // Si es representante (Coordinador/Vocal/Concejal), SOLO ve su carrera asignada
        return matchesSearch && c.name === user?.career;
    }

    // Admin ve todo
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex justify-between items-center">
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
      </div>

      {/* Buscador (Solo visible para Super Admins) */}
      {isSuperAdmin && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar carrera..."
                    className="form-input pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700">
        {loading ? (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600 mb-2"></div>
                Cargando...
            </div>
        ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Carrera</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">WhatsApp Oficial</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Estatus</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredCareers.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500">
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
                            // 👇 LÓGICA DE PERMISOS POR FILA
                            // Puedes editar si eres SuperAdmin O si es TU carrera
                            const isMyCareer = user?.career === career.name;
                            const canEdit = isSuperAdmin || isMyCareer;

                            return (
                                <tr key={career.id} className={`transition-colors ${canEdit ? 'hover:bg-gray-50 dark:hover:bg-slate-700/50' : 'opacity-75 bg-gray-50/50 dark:bg-slate-900/20'}`}>

                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {career.name}
                                            {isRepresentative && (
                                                <span className="ml-2 text-[10px] bg-guinda-100 text-guinda-700 px-1.5 py-0.5 rounded border border-guinda-200 font-bold uppercase">
                                                    Mi Carrera
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{career.slug}</div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {career.whatsapp_url ? (
                                            <a
                                                href={career.whatsapp_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline font-medium"
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
                                        <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full border ${
                                            career.is_active 
                                                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                                : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-700 dark:text-gray-400'
                                        }`}>
                                            {career.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {career.is_active ? 'Visible' : 'Oculta'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {canEdit ? (
                                            <button
                                                onClick={() => handleEdit(career)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold border border-blue-600 dark:border-blue-400 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-1 ml-auto"
                                            >
                                                <Edit size={14} /> Editar
                                            </button>
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
        )}
      </div>

      {showModal && (
        <CareerModal
            career={editingCareer}
            onClose={() => setShowModal(false)}
            onSuccess={loadCareers}
            // 👇 Solo Super Admins pueden cambiar estatus (visibilidad)
            canEditStatus={isSuperAdmin}
        />
      )}

    </div>
  );
};