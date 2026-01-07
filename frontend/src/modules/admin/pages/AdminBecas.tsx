import { useState, useEffect } from 'react';
import {
  getScholarships,
  updateScholarship,
  getApplications
} from '../../../shared/services/api';
import type { Scholarship, ScholarshipApplication } from '../../../shared/types';
import { RevisionModal } from '../components/RevisionModal';
import { ScholarshipModal } from '../components/ScholarshipModal';
// Importamos el gestor de cupos
import { QuotaManager } from '../components/QuotaManager';
import {
  CheckCircle, XCircle, Clock, Search, Filter, FileText,
  AlertTriangle, Edit, PlusCircle, BarChart3
} from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export default function AdminBecas() {
  const { canManageBecas, isConcejal } = usePermissions();

  // Estado de pestañas actualizado con 'cupos'
  const [activeTab, setActiveTab] = useState<'convocatorias' | 'solicitudes' | 'cupos'>(
      isConcejal ? 'solicitudes' : 'convocatorias'
  );

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);

  const [loading, setLoading] = useState(false);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');

  const [editingApp, setEditingApp] = useState<ScholarshipApplication | null>(null);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

  useEffect(() => {
    loadScholarships();
  }, []);

  useEffect(() => {
    if (selectedScholarshipId && activeTab === 'solicitudes') {
      loadApplications(selectedScholarshipId);
    }
  }, [selectedScholarshipId, activeTab]);

  const loadScholarships = async () => {
    setLoading(true);
    try {
      const data = await getScholarships(false);
      setScholarships(data);
      if (data.length > 0 && !selectedScholarshipId) {
        setSelectedScholarshipId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (id: number) => {
    setLoading(true);
    try {
      const data = await getApplications(id);
      setApplications(data);
    } catch (error) {
      console.error(error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (s: Scholarship) => {
    if (!confirm(`¿Deseas ${s.is_active ? 'cerrar' : 'activar'} la convocatoria?`)) return;
    try {
      await updateScholarship(s.id, { is_active: !s.is_active });
      loadScholarships();
    } catch (error) {
      alert("Error al actualizar estatus");
    }
  };

  const handleCreateScholarship = () => {
    setEditingScholarship(null);
    setShowScholarshipModal(true);
  };

  const handleEditScholarship = (s: Scholarship) => {
    setEditingScholarship(s);
    setShowScholarshipModal(true);
  };

  const filteredApps = applications.filter(app => {
    if (filterStatus === 'Todos') return true;
    return app.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Becas</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
                {canManageBecas
                    ? "Administra convocatorias, cupos y evalúa a los aspirantes"
                    : "Revisión de solicitudes asignadas a tu carrera"}
            </p>
        </div>

        {/* Solo mostrar botón de crear si estás en la pestaña de convocatorias y eres admin */}
        {activeTab === 'convocatorias' && canManageBecas && (
          <button
            onClick={handleCreateScholarship}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle size={20} /> Nueva Convocatoria
          </button>
        )}
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">

          <button
            onClick={() => setActiveTab('convocatorias')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'convocatorias'
                ? 'border-guinda-600 text-guinda-600 dark:text-guinda-400 dark:border-guinda-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Convocatorias
          </button>

          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'solicitudes'
                ? 'border-guinda-600 text-guinda-600 dark:text-guinda-400 dark:border-guinda-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Revisión de Solicitudes
          </button>

          {/* Pestaña Cupos (Solo Admin/Estructura) */}
          {canManageBecas && (
            <button
                onClick={() => setActiveTab('cupos')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cupos'
                    ? 'border-guinda-600 text-guinda-600 dark:text-guinda-400 dark:border-guinda-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                Control de Cupos
            </button>
          )}
        </nav>
      </div>

      {/* VISTA 1: CONVOCATORIAS */}
      {activeTab === 'convocatorias' && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Ciclo</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Estado</th>
                {canManageBecas && (
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {scholarships.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-300">{s.cycle}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                      s.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {s.is_active ? 'Activa' : 'Cerrada'}
                    </span>
                  </td>

                  {canManageBecas && (
                      <td className="px-6 py-4 text-right text-sm flex justify-end items-center gap-3">
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`${s.is_active ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-green-600 hover:text-green-800 dark:text-green-400'} font-bold hover:underline text-xs`}
                        >
                          {s.is_active ? 'Cerrar' : 'Activar'}
                        </button>
                        <button
                            onClick={() => handleEditScholarship(s)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Editar"
                        >
                            <Edit size={18} />
                        </button>
                      </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 2: SOLICITUDES */}
      {activeTab === 'solicitudes' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
                <Search size={18} className="text-gray-400" />
                <select
                  value={selectedScholarshipId || ''}
                  onChange={(e) => setSelectedScholarshipId(Number(e.target.value))}
                  className="form-input py-1 text-sm w-64"
                >
                  {scholarships.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-input py-1 text-sm"
                >
                    <option value="Todos">Todos</option>
                    <option value="Pendiente">Pendientes</option>
                    <option value="Aprobada">Aprobadas</option>
                    <option value="Rechazada">Rechazadas</option>
                    <option value="Documentación Faltante">Corrección</option>
                </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700">
             {loading ? (
                 <div className="p-10 text-center text-gray-500 dark:text-slate-400">Cargando datos...</div>
             ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Control</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Alumno</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Carrera</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Estatus</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredApps.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-slate-400">No hay solicitudes</td></tr>
                    ) : (
                        filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-gray-200 font-semibold">{app.control_number}</td>

                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{app.full_name}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{app.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-300">{app.career}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full border ${
                                    app.status === 'Aprobada' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                    app.status === 'Rechazada' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                                    app.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                }`}>
                                    {app.status === 'Aprobada' && <CheckCircle size={12}/>}
                                    {app.status === 'Rechazada' && <XCircle size={12}/>}
                                    {app.status === 'Pendiente' && <Clock size={12}/>}
                                    {app.status === 'Documentación Faltante' && <AlertTriangle size={12}/>}
                                    {app.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => setEditingApp(app)}
                                    className="text-guinda-600 hover:text-guinda-800 dark:text-guinda-400 dark:hover:text-guinda-300 font-bold border border-guinda-600 dark:border-guinda-400 px-3 py-1 rounded hover:bg-guinda-50 dark:hover:bg-guinda-900/20 transition-all flex items-center gap-1 ml-auto"
                                >
                                    <FileText size={14} /> Revisar
                                </button>
                            </td>
                        </tr>
                        ))
                    )}
                  </tbody>
                </table>
             )}
          </div>
        </div>
      )}

      {/* VISTA 3: CUPOS (NUEVA) */}
      {activeTab === 'cupos' && canManageBecas && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="text-guinda-600"/>
                    Monitor de Cupos por Carrera
                </h2>
                <div className="flex items-center gap-4 mt-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona Convocatoria:</label>
                    <select
                        value={selectedScholarshipId || ''}
                        onChange={(e) => setSelectedScholarshipId(Number(e.target.value))}
                        className="form-input py-2 px-3 text-sm w-full md:w-64"
                    >
                        {scholarships.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedScholarshipId ? (
                <QuotaManager scholarshipId={selectedScholarshipId} />
            ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700">
                    Selecciona una convocatoria activa para gestionar sus límites de aceptación.
                </div>
            )}
        </div>
      )}

      {/* MODALES */}
      {showScholarshipModal && (
        <ScholarshipModal
          scholarship={editingScholarship}
          onClose={() => setShowScholarshipModal(false)}
          onSuccess={() => loadScholarships()}
        />
      )}

      {editingApp && (
        <RevisionModal
            application={editingApp}
            onClose={() => setEditingApp(null)}
            onUpdate={() => {
                if (selectedScholarshipId) loadApplications(selectedScholarshipId);
            }}
        />
      )}
    </div>
  );
}