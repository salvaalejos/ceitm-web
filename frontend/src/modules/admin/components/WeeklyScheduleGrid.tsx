import React, { useEffect, useState } from 'react';
import { api, getShifts, createShift, deleteShift } from '../../../shared/services/api';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { type Shift, DayOfWeek, type User } from '../../../shared/types';
import { Users, X, Search, Building, Briefcase, PlusCircle, Trash2, Clock, AlertTriangle, UserMinus } from 'lucide-react';
import Swal from 'sweetalert2';

const DAYS = [DayOfWeek.LUNES, DayOfWeek.MARTES, DayOfWeek.MIERCOLES, DayOfWeek.JUEVES, DayOfWeek.VIERNES];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

const WeeklyScheduleGrid: React.FC = () => {
  const { user: currentUser, canManageContraloria: canEdit } = usePermissions();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA MODALES ---
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [targetCell, setTargetCell] = useState<{ day: DayOfWeek; hour: number } | null>(null);
  const [shiftToRelease, setShiftToRelease] = useState<Shift | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [releasingLoading, setReleasingLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [canEdit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const shiftsData = await getShifts();
      setShifts(shiftsData);

      if (canEdit) {
        const usersRes = await api.get('/users/all');
        // 👇 ERROR CORREGIDO: false en minúscula para JavaScript
        const activeUsers = usersRes.data.filter((u: User) => u.is_active !== false);
        setUsers(activeUsers);
      }
    } catch (error) {
      console.error('Error cargando guardias:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShift = (day: DayOfWeek, hour: number) => {
    return shifts.find((s) => s.day === day && s.hour === hour);
  };

  const handleCellClick = async (day: DayOfWeek, hour: number) => {
    if (!canEdit) return;

    const existingShift = getShift(day, hour);

    if (existingShift) {
        // Abrir el nuevo modal de liberación
        setShiftToRelease(existingShift);
        setIsReleaseModalOpen(true);
    } else {
        // Abrir el modal de asignación
        setTargetCell({ day, hour });
        setSearchTerm('');
        setIsAssignModalOpen(true);
    }
  };

  // --- LÓGICA DE ASIGNACIÓN ---
  const handleAssignUser = async (userId: number) => {
    if (!targetCell) return;
    setAssigningLoading(true);
    try {
        const newShift = await createShift({
            user_id: userId,
            day: targetCell.day,
            hour: targetCell.hour
        });
        setShifts(prev => [...prev, newShift]);
        setIsAssignModalOpen(false);
        Swal.fire({ icon: 'success', title: 'Guardia asignada', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    } catch (error) {
        Swal.fire('Error', 'No se pudo asignar. Es posible que el horario se haya ocupado.', 'error');
    } finally {
        setAssigningLoading(false);
    }
  };

  // --- LÓGICA DE LIBERACIÓN ---
  const handleConfirmRelease = async () => {
      if (!shiftToRelease) return;
      setReleasingLoading(true);
      try {
          await deleteShift(shiftToRelease.id);
          setShifts((prev) => prev.filter((s) => s.id !== shiftToRelease.id));
          setIsReleaseModalOpen(false);
          Swal.fire({ icon: 'success', title: 'Bloque liberado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar la guardia', 'error');
      } finally {
          setReleasingLoading(false);
          setShiftToRelease(null);
      }
  };

  const filteredUsers = users
    .filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  if (loading) return <div className="p-12 text-center text-gray-400 animate-pulse font-medium">Cargando horario de guardias...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors relative">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800">
              <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-slate-800 w-28">Hora</th>
              {DAYS.map(day => (
                <th key={day} className="p-4 text-xs font-bold text-guinda-700 dark:text-guinda-400 uppercase tracking-wider border-r border-gray-100 dark:border-slate-800 last:border-r-0 min-w-[150px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour} className="border-b border-gray-100/50 dark:border-slate-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                <td className="p-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800/30 border-r border-gray-100 dark:border-slate-800">
                  {hour}:00 hrs
                </td>
                {DAYS.map(day => {
                  const shift = getShift(day, hour);
                  const isMine = currentUser?.id === shift?.user_id;
                  return (
                    <td
                      key={`${day}-${hour}`}
                      onClick={() => handleCellClick(day, hour)}
                      className={`
                        p-1.5 border-r border-gray-100/50 dark:border-slate-800 last:border-r-0 h-20 min-w-[150px] transition-all relative
                        ${canEdit ? 'cursor-pointer' : ''}
                        ${shift 
                            ? (isMine ? 'bg-blue-50/50 dark:bg-blue-900/10' : '') 
                            : (canEdit ? 'hover:bg-guinda-50/30 dark:hover:bg-guinda-900/10 group' : '')}
                      `}
                    >
                      {shift ? (
                        <div className={`h-full flex flex-col justify-center items-center rounded-xl p-2 animate-scale-up relative
                          ${isMine 
                            ? 'border border-blue-100 dark:border-blue-900 bg-white dark:bg-slate-800 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'}
                        `}>
                          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2 text-center">
                            {shift.user?.full_name}
                          </span>
                          <span className="text-[9px] text-guinda-600 dark:text-guinda-400 font-bold mt-1 uppercase tracking-tighter bg-gray-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                            {shift.user?.area || shift.user?.role}
                          </span>
                          {canEdit && (
                            <Trash2 size={14} className="absolute top-1.5 right-1.5 text-gray-300 dark:text-gray-600 group-hover:text-red-500 transition-colors" />
                          )}
                        </div>
                      ) : (
                        canEdit && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlusCircle className="text-guinda-400 dark:text-guinda-600" size={24}/>
                            </div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* 1. MODAL DE ASIGNACIÓN */}
      {/* ========================================== */}
      {isAssignModalOpen && targetCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">

            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-guinda-100 dark:bg-guinda-900/50 rounded-2xl text-guinda-700 dark:text-guinda-400">
                    <Users size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Asignar Guardia</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 font-medium">
                    <Clock size={14} className="text-gray-400" />
                    {targetCell.day} • {targetCell.hour}:00 hrs
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-slate-800 relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar concejal por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-guinda-500 text-sm"
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-[300px]">
                {assigningLoading ? (
                    <div className="flex flex-col items-center justify-center pt-10 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600 mb-4"></div>
                        Asignando horario...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-10 text-center bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                        <AlertTriangle className="text-amber-500 mb-3" size={32}/>
                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">No se encontraron resultados</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prueba con otro término o verifica que el concejal esté activo.</p>
                    </div>
                ) : filteredUsers.map(u => (
                    <button
                        key={u.id}
                        onClick={() => handleAssignUser(u.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl text-left bg-white hover:bg-guinda-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-800 hover:border-guinda-100 dark:hover:border-slate-700 group"
                    >
                        <div className="h-11 w-11 rounded-full bg-gray-100 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-black text-sm uppercase border border-gray-200 dark:border-slate-700">
                            {u.full_name[0]}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-guinda-700 dark:group-hover:text-guinda-400">{u.full_name}</h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                <span className="flex items-center gap-1.5"><Briefcase size={12}/> {u.role}</span>
                                {u.area && <span className="flex items-center gap-1.5"><Building size={12}/> {u.area}</span>}
                            </div>
                        </div>
                        <PlusCircle size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-guinda-500 dark:group-hover:text-guinda-400 transition-colors" />
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end">
                <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 transition-colors"
                >
                    Cancelar
                </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. NUEVO MODAL DE LIBERACIÓN */}
      {/* ========================================== */}
      {isReleaseModalOpen && shiftToRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">

             {/* Header */}
             <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-2xl text-red-600 dark:text-red-400">
                        <UserMinus size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Liberar Guardia</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 font-medium">
                            <Clock size={14} className="text-gray-400" />
                            {shiftToRelease.day} • {shiftToRelease.hour}:00 hrs
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsReleaseModalOpen(false)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                    <X size={20} />
                </button>
             </div>

             {/* Body */}
             <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                    Estás a punto de eliminar la guardia asignada a este integrante. El bloque quedará disponible inmediatamente.
                </p>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
                    <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-black text-lg uppercase shadow-sm border border-gray-200 dark:border-slate-600">
                        {shiftToRelease.user?.full_name[0]}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{shiftToRelease.user?.full_name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{shiftToRelease.user?.area || shiftToRelease.user?.role}</p>
                    </div>
                </div>
             </div>

             {/* Footer */}
             <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex gap-3">
                <button
                    onClick={() => setIsReleaseModalOpen(false)}
                    className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleConfirmRelease}
                    disabled={releasingLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
                >
                    {releasingLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Trash2 size={18} /> Sí, Liberar</>}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyScheduleGrid;