import React, { useEffect, useState } from 'react';
import { getShifts, createShift, deleteShift, getUsers } from '../../../shared/services/api';
import { useAuthStore } from '../../../shared/store/authStore';
import { type Shift, DayOfWeek, type User, UserArea, UserRole } from '../../../shared/types';
import Swal from 'sweetalert2';

const DAYS = [DayOfWeek.LUNES, DayOfWeek.MARTES, DayOfWeek.MIERCOLES, DayOfWeek.JUEVES, DayOfWeek.VIERNES];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

const WeeklyScheduleGrid: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = currentUser?.role === UserRole.ADMIN_SYS || currentUser?.area === UserArea.CONTRALORIA;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const shiftsData = await getShifts();
      setShifts(shiftsData);

      if (canEdit) {
        const usersData = await getUsers();
        setUsers(usersData.filter((u: User) => u.is_active));
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

    const isDark = document.documentElement.classList.contains('dark');
    const swalColors = {
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#000'
    };

    if (existingShift) {
      const result = await Swal.fire({
        title: '¿Liberar bloque?',
        text: `Se eliminará la guardia de ${existingShift.user?.full_name}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, liberar',
        cancelButtonText: 'Cancelar',
        ...swalColors
      });

      if (result.isConfirmed) {
        try {
          await deleteShift(existingShift.id);
          setShifts((prev) => prev.filter((s) => s.id !== existingShift.id));
        } catch (error) {
          Swal.fire({ title: 'Error', text: 'No se pudo eliminar', icon: 'error', ...swalColors });
        }
      }
    } else {
      const options = users
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
        .map(u => `<option value="${u.id}">${u.full_name} - ${u.area || u.role}</option>`)
        .join('');

      const { value: userId } = await Swal.fire({
        title: 'Asignar Guardia',
        html: `
            <select id="swal-user" class="swal2-select w-full m-0 border-gray-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 rounded-lg">
                <option value="">-- Seleccionar --</option>
                ${options}
            </select>
        `,
        showCancelButton: true,
        ...swalColors,
        preConfirm: () => (document.getElementById('swal-user') as HTMLSelectElement).value
      });

      if (userId) {
        try {
          const newShift = await createShift({ user_id: parseInt(userId), day, hour });
          setShifts(prev => [...prev, newShift]); // Update local state optimization
          // fetchData(); // Optional: refresh completely
        } catch (error) {
          Swal.fire({ title: 'Error', text: 'No se pudo asignar (¿Horario ocupado?)', icon: 'error', ...swalColors });
        }
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Cargando horario...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
              <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-slate-800 w-24">Hora</th>
              {DAYS.map(day => (
                <th key={day} className="p-3 text-xs font-bold text-guinda-700 dark:text-guinda-400 uppercase tracking-wider border-r border-gray-200 dark:border-slate-800 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour} className="border-b border-gray-100 dark:border-slate-800/50 last:border-b-0">
                <td className="p-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800/30 border-r border-gray-200 dark:border-slate-800">
                  {hour}:00
                </td>
                {DAYS.map(day => {
                  const shift = getShift(day, hour);
                  const isMine = currentUser?.id === shift?.user_id;
                  return (
                    <td
                      key={`${day}-${hour}`}
                      onClick={() => handleCellClick(day, hour)}
                      className={`
                        p-1 border-r border-gray-100 dark:border-slate-800 last:border-r-0 h-16 min-w-[120px] transition-all
                        ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800' : ''}
                        ${shift 
                            ? (isMine ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50/50 dark:bg-slate-800/40') 
                            : 'bg-white dark:bg-slate-900'}
                      `}
                    >
                      {shift && (
                        <div className={`h-full flex flex-col justify-center items-center rounded-lg p-1 animate-scale-up
                          ${isMine 
                            ? 'border-l-4 border-blue-500 bg-white dark:bg-slate-800 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700'}
                        `}>
                          <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight line-clamp-2 text-center">
                            {shift.user?.full_name}
                          </span>
                          <span className="text-[9px] text-guinda-600 dark:text-guinda-400 font-medium mt-1 uppercase tracking-tighter">
                            {shift.user?.area || shift.user?.role}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;