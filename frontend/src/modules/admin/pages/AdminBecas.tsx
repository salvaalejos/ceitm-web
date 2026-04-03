import { useState, useEffect } from 'react';
import {
  getScholarships,
  getPaginatedScholarships,
  updateScholarship,
  getApplications,
  updateApplicationStatus,
  getCafeterias
} from '../../../shared/services/api';
import type { Scholarship, ScholarshipApplication } from '../../../shared/types';
import { RevisionModal } from '../components/RevisionModal';
import { ScholarshipModal } from '../components/ScholarshipModal';
import { QuotaManager } from '../components/QuotaManager';
import { CafeteriaManager } from '../components/CafeteriaManager';
import {
  CheckCircle, XCircle, Clock, Search, FileText,
  AlertTriangle, Edit, PlusCircle, BarChart3, ShieldAlert, ChevronLeft, ChevronRight, Coffee, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export default function AdminBecas() {
  const { canManageBecas, isConcejal } = usePermissions();

  const [activeTab, setActiveTab] = useState<'convocatorias' | 'solicitudes' | 'cupos' | 'cafeterias'>(
      isConcejal ? 'solicitudes' : 'convocatorias'
  );

  // Estado para Dropdowns (Lista Plana)
  const [allScholarships, setAllScholarships] = useState<Scholarship[]>([]);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<number | null>(null);

  // Estado para Cafeterías
  const [cafeterias, setCafeterias] = useState<any[]>([]);

  // Estados Paginación de CONVOCATORIAS
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholPage, setScholPage] = useState(1);
  const [scholTotal, setScholTotal] = useState(0);
  const [scholSearch, setScholSearch] = useState('');

  // Estados Paginación de SOLICITUDES
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [appPage, setAppPage] = useState(1);
  const [appTotal, setAppTotal] = useState(0);
  const [appSearch, setAppSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');

  const [loading, setLoading] = useState(false);
  const limit = 10;

  const [editingApp, setEditingApp] = useState<ScholarshipApplication | null>(null);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

  // Estados para Asignación de Cafetería
  const [assignCafeteriaApp, setAssignCafeteriaApp] = useState<ScholarshipApplication | null>(null);
  const [assignCafeteriaForm, setAssignCafeteriaForm] = useState<string>('');

  // Beca actual para validaciones condicionales
  const currentScholarship = allScholarships.find(s => s.id === selectedScholarshipId);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await getScholarships(false);
        setAllScholarships(data);
        if (data.length > 0 && !selectedScholarshipId) {
          setSelectedScholarshipId(data[0].id);
        }
      } catch (error) { console.error(error); }
    };
    fetchAll();
  }, []);

  useEffect(() => {
      getCafeterias().then(setCafeterias).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab !== 'convocatorias') return;
    const timeoutId = setTimeout(() => {
      loadPaginatedScholarships();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [scholPage, scholSearch, activeTab]);

  const loadPaginatedScholarships = async () => {
    setLoading(true);
    try {
      const skip = (scholPage - 1) * limit;
      const data = await getPaginatedScholarships(skip, limit, scholSearch);
      setScholarships(data.items);
      setScholTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'solicitudes' || !selectedScholarshipId) return;
    const timeoutId = setTimeout(() => {
      loadApplications();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [appPage, appSearch, filterStatus, selectedScholarshipId, activeTab]);

  const handleAppSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setAppSearch(e.target.value);
      setAppPage(1);
  };
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterStatus(e.target.value);
      setAppPage(1);
  };

  const loadApplications = async () => {
    if (!selectedScholarshipId) return;
    setLoading(true);
    try {
      const skip = (appPage - 1) * limit;
      const data = await getApplications(selectedScholarshipId, skip, limit, appSearch, filterStatus);
      setApplications(data.items);
      setAppTotal(data.total);
    } catch (error) {
      console.error(error);
      setApplications([]);
      setAppTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (s: Scholarship) => {
    if (!confirm(`¿Deseas ${s.is_active ? 'cerrar' : 'activar'} la convocatoria?`)) return;
    try {
      await updateScholarship(s.id, { is_active: !s.is_active });
      loadPaginatedScholarships();
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

  // --- LÓGICA CORREGIDA PARA ASIGNAR CAFETERÍA Y APROBAR ---
  const openAssignCafeteriaModal = (app: ScholarshipApplication) => {
      setAssignCafeteriaApp(app);
      setAssignCafeteriaForm((app as any).cafeteria_asignada_id ? String((app as any).cafeteria_asignada_id) : '');
  };

  const submitCafeteriaAssignment = async () => {
      if (!assignCafeteriaApp) return;
      try {
          const payload: any = {
              cafeteria_asignada_id: assignCafeteriaForm ? Number(assignCafeteriaForm) : null
          };

          // Si se asigna exitosamente, la solicitud pasa automáticamente a "Aprobada"
          // para que el cupo general de la carrera lo empiece a contabilizar
          if (assignCafeteriaForm) {
              payload.status = 'Aprobada';
          }

          await updateApplicationStatus(assignCafeteriaApp.id, payload);
          setAssignCafeteriaApp(null);

          // Refrescamos tanto la tabla como el monitor de cafeterías
          loadApplications();
          getCafeterias().then(setCafeterias).catch(console.error);

          Swal.fire({
              icon: 'success',
              title: 'Asignación Guardada',
              text: assignCafeteriaForm ? 'La solicitud ha sido aprobada automáticamente.' : '',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000
          });
      } catch (e) {
          Swal.fire('Error', 'No se pudo guardar la asignación', 'error');
      }
  };

  const scholTotalPages = Math.ceil(scholTotal / limit);
  const appTotalPages = Math.ceil(appTotal / limit);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Becas</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
                {canManageBecas
                    ? "Administra convocatorias, cupos y evalúa a los aspirantes"
                    : "Revisión de solicitudes asignadas a tu carrera"}
            </p>
        </div>

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
      <div className="border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max">
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

          {canManageBecas && (
            <>
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
                <button
                    onClick={() => setActiveTab('cafeterias')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'cafeterias'
                        ? 'border-guinda-600 text-guinda-600 dark:text-guinda-400 dark:border-guinda-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    Cafeterías
                </button>
            </>
          )}
        </nav>
      </div>

      {/* VISTA 1: CONVOCATORIAS */}
      {activeTab === 'convocatorias' && (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar convocatoria..."
                    className="form-input pl-10 py-2 w-full"
                    value={scholSearch}
                    onChange={(e) => { setScholSearch(e.target.value); setScholPage(1); }}
                />
            </div>

            <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700">
                {loading ? (
                    <div className="p-10 text-center text-gray-500 dark:text-slate-400">Cargando convocatorias...</div>
                ) : (
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
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-300">{s.period} {s.year}</td>
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
                )}

                {scholarships.length > 0 && !loading && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Mostrando {scholarships.length} de {scholTotal}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setScholPage(p => Math.max(1, p - 1))} disabled={scholPage === 1} className="p-1.5 border rounded-lg text-gray-600 disabled:opacity-50"><ChevronLeft size={16}/></button>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">Pág {scholPage} / {scholTotalPages || 1}</span>
                            <button onClick={() => setScholPage(p => Math.min(scholTotalPages, p + 1))} disabled={scholPage >= scholTotalPages || scholTotalPages === 0} className="p-1.5 border rounded-lg text-gray-600 disabled:opacity-50"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                )}
            </div>
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
                  {allScholarships.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                <input
                    type="text"
                    placeholder="Buscar por control o nombre..."
                    className="form-input py-1 text-sm w-full sm:w-64"
                    value={appSearch}
                    onChange={handleAppSearch}
                />
                <select
                    value={filterStatus}
                    onChange={handleStatusChange}
                    className="form-input py-1 text-sm w-full sm:w-auto"
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
                 <div className="p-10 text-center text-gray-500 dark:text-slate-400">Cargando solicitudes...</div>
             ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Control</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Alumno</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Carrera</th>

                        {currentScholarship?.type === 'Alimenticia' && canManageBecas && (
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Cafetería</th>
                        )}

                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Estatus</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {applications.length === 0 ? (
                            <tr><td colSpan={currentScholarship?.type === 'Alimenticia' && canManageBecas ? 6 : 5} className="p-8 text-center text-gray-500 dark:text-slate-400">No hay solicitudes</td></tr>
                        ) : (
                            applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-gray-200 font-semibold">{app.control_number}</td>

                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {app.full_name}
                                            {app.student?.is_blacklisted && (
                                                <ShieldAlert size={14} className="text-red-500" title="Alumno en Blacklist" />
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-slate-400">{app.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-300">{app.career}</td>

                                {currentScholarship?.type === 'Alimenticia' && canManageBecas && (
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            {(app as any).cafeteria_asignada_id ? (
                                                <span className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                                                    {cafeterias.find(c => c.id === (app as any).cafeteria_asignada_id)?.nombre || 'Asignada'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 italic whitespace-nowrap">Sin asignar</span>
                                            )}

                                            <button
                                                onClick={() => openAssignCafeteriaModal(app)}
                                                className="text-[10px] bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 dark:border-orange-800/50 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 px-2 py-1 rounded transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                                            >
                                                <Coffee size={10} /> {(app as any).cafeteria_asignada_id ? 'Cambiar' : 'Asignar'}
                                            </button>
                                        </div>
                                    </td>
                                )}

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
                                        className="text-guinda-600 hover:text-guinda-800 dark:text-guinda-400 dark:hover:text-guinda-300 font-bold border border-guinda-600 dark:border-guinda-400 px-3 py-1 rounded hover:bg-guinda-50 dark:hover:bg-guinda-900/20 transition-all flex items-center gap-1 ml-auto whitespace-nowrap"
                                    >
                                        <FileText size={14} /> Revisar
                                    </button>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>
             )}

             {applications.length > 0 && !loading && (
                 <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Mostrando {applications.length} de {appTotal}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setAppPage(p => Math.max(1, p - 1))} disabled={appPage === 1} className="p-1.5 border rounded-lg text-gray-600 disabled:opacity-50"><ChevronLeft size={16}/></button>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">Pág {appPage} / {appTotalPages || 1}</span>
                        <button onClick={() => setAppPage(p => Math.min(appTotalPages, p + 1))} disabled={appPage >= appTotalPages || appTotalPages === 0} className="p-1.5 border rounded-lg text-gray-600 disabled:opacity-50"><ChevronRight size={16}/></button>
                    </div>
                </div>
             )}
          </div>
        </div>
      )}

      {/* VISTA 3: CUPOS */}
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
                        {allScholarships.map(s => (
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

      {/* VISTA 4: CAFETERÍAS */}
      {activeTab === 'cafeterias' && canManageBecas && (
        <CafeteriaManager />
      )}

      {/* MODAL: ASIGNAR CAFETERÍA */}
      {assignCafeteriaApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
                  <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Coffee size={20} className="text-orange-500" /> Asignar Cafetería
                      </h3>
                      <button onClick={() => setAssignCafeteriaApp(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-5">
                      <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                          <p className="text-[10px] text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider mb-1.5">Preferencia del Alumno:</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {(assignCafeteriaApp as any).cafeteria_solicitada_id
                                  ? `${cafeterias.find(c => c.id === (assignCafeteriaApp as any).cafeteria_solicitada_id)?.nombre} - ${cafeterias.find(c => c.id === (assignCafeteriaApp as any).cafeteria_solicitada_id)?.campus}`
                                  : 'Sin preferencia registrada'}
                          </p>
                      </div>

                      <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Seleccionar Cafetería Oficial</label>
                          <select
                              value={assignCafeteriaForm || ''}
                              onChange={(e) => setAssignCafeteriaForm(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                          >
                              <option value="">Selecciona una opción...</option>
                              {cafeterias.map(c => {
                                  const libres = c.limite_becas - (c.becas_asignadas || 0);
                                  return (
                                      <option key={c.id} value={c.id}>
                                          {c.nombre} - {c.campus} (Disponibles: {libres})
                                      </option>
                                  );
                              })}
                          </select>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setAssignCafeteriaApp(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 transition-colors">
                              Cancelar
                          </button>
                          <button type="button" onClick={submitCafeteriaAssignment} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all flex justify-center items-center gap-2">
                              <CheckCircle size={18} /> Guardar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODALES */}
      {showScholarshipModal && (
        <ScholarshipModal
          scholarship={editingScholarship}
          onClose={() => setShowScholarshipModal(false)}
          onSuccess={() => loadPaginatedScholarships()} // Recargar al guardar
        />
      )}

      {editingApp && (
        <RevisionModal
            application={editingApp}
            onClose={() => setEditingApp(null)}
            onUpdate={() => {
                if (selectedScholarshipId) loadApplications(); // Recargar solicitudes
            }}
        />
      )}
    </div>
  );
}