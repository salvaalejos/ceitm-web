import React, { useEffect, useState } from 'react';
import { getShifts, createShift, deleteShift, getUsers } from '../../../shared/services/api';
import { useAuthStore } from '../../../shared/store/authStore';
import {type Shift, DayOfWeek, type User, UserArea, UserRole } from '../../../shared/types';
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
      let usersData: User[] = [];
      if (canEdit) {
        usersData = await getUsers();
      }
      setShifts(shiftsData);
      if (canEdit) {
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

    if (existingShift) {
      const result = await Swal.fire({
        title: '¿Liberar bloque?',
        text: `Se eliminará la guardia de ${existingShift.user?.full_name}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6', // Azul primario acorde a tu UI
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, liberar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          await deleteShift(existingShift.id);
          setShifts((prev) => prev.filter((s) => s.id !== existingShift.id));
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
      }
    } else {
      const options = users
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
        .map(u => `<option value="${u.id}">${u.full_name} - ${u.area || u.role}</option>`)
        .join('');

      const { value: userId } = await Swal.fire({
        title: 'Asignar Guardia',
        html: `<select id="swal-user" class="swal2-input">${options}</select>`,
        showCancelButton: true,
        preConfirm: () => (document.getElementById('swal-user') as HTMLSelectElement).value
      });

      if (userId) {
        try {
          await createShift({ user_id: parseInt(userId), day, hour });
          fetchData();
        } catch (error) {
          Swal.fire('Error', 'No se pudo asignar', 'error');
        }
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-primary-600">Cargando horario...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24">Hora</th>
              {DAYS.map(day => (
                <th key={day} className="p-3 text-xs font-bold text-primary-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour} className="border-b border-gray-100 last:border-b-0">
                <td className="p-3 text-center text-xs font-semibold text-gray-400 bg-gray-50 border-r border-gray-200">
                  {hour}:00
                </td>
                {DAYS.map(day => {
                  const shift = getShift(day, hour);
                  const isMine = currentUser?.id === shift?.user_id;
                  return (
                    <td
                      key={`${day}-${hour}`}
                      onClick={() => handleCellClick(day, hour)}
                      className={`p-1 border-r border-gray-100 last:border-r-0 h-16 min-w-[120px] transition-colors
                        ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''}
                        ${shift ? (isMine ? 'bg-blue-50' : 'bg-gray-50/50') : ''}
                      `}
                    >
                      {shift && (
                        <div className={`h-full flex flex-col justify-center items-center rounded-lg p-1 
                          ${isMine ? 'border-l-4 border-primary-500 bg-white shadow-sm' : 'bg-white border border-gray-200'}`}>
                          <span className="text-[10px] font-bold text-gray-800 leading-tight line-clamp-2">
                            {shift.user?.full_name}
                          </span>
                          <span className="text-[9px] text-primary-600 font-medium mt-1">
                            {shift.user?.area}
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