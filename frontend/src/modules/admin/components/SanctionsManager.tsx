import React, { useEffect, useState } from 'react';
import { getSanctions, createSanction, updateSanction, deleteSanction, getUsers } from '../../../shared/services/api';
import {type Sanction, SanctionSeverity, SanctionStatus, type User, UserRole } from '../../../shared/types';
import { CheckCircle2, Trash2, Plus, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export const SanctionsManager: React.FC = () => {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(false);
      const [sanctionsData, usersData] = await Promise.all([
        getSanctions(),
        getUsers()
      ]);
      setSanctions(sanctionsData);
      // Solo permitimos sancionar a gente de la estructura (Concejales, Vocales, etc.)
      setUsers(usersData.filter(u => u.role !== UserRole.ADMIN_SYS));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreate = async () => {
    const userOptions = users.map(u => `<option value="${u.id}">${u.full_name}</option>`).join('');

    const { value: formValues } = await Swal.fire({
      title: 'Nueva Sanción',
      html: `
        <select id="swal-user" class="swal2-input"><option value="">Seleccionar Usuario</option>${userOptions}</select>
        <select id="swal-severity" class="swal2-input">
          <option value="${SanctionSeverity.LEVE}">Leve</option>
          <option value="${SanctionSeverity.NORMAL}">Normal</option>
          <option value="${SanctionSeverity.GRAVE}">Grave</option>
        </select>
        <input id="swal-reason" class="swal2-input" placeholder="Motivo">
        <input id="swal-penalty" class="swal2-input" placeholder="Descripción de la pena (monto/horas)">
      `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          user_id: (document.getElementById('swal-user') as HTMLSelectElement).value,
          severity: (document.getElementById('swal-severity') as HTMLSelectElement).value,
          reason: (document.getElementById('swal-reason') as HTMLInputElement).value,
          penalty_description: (document.getElementById('swal-penalty') as HTMLInputElement).value,
        }
      }
    });

    if (formValues?.user_id && formValues?.reason) {
      try {
        await createSanction(formValues);
        fetchData();
        Swal.fire('Creado', 'Sanción aplicada', 'success');
      } catch (e) { Swal.fire('Error', 'No se pudo crear', 'error'); }
    }
  };

  const toggleStatus = async (sanc: Sanction) => {
    const newStatus = sanc.status === SanctionStatus.PENDIENTE ? SanctionStatus.SALDADA : SanctionStatus.PENDIENTE;
    try {
      await updateSanction(sanc.id, { status: newStatus });
      fetchData();
    } catch (e) { Swal.fire('Error', 'No se pudo actualizar', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-500 uppercase">Registro de Faltas</h4>
        <button onClick={handleCreate} className="flex items-center gap-2 bg-guinda-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-guinda-700 transition-colors">
          <Plus size={18} /> Nueva Sanción
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Gravedad</th>
              <th className="p-4">Motivo</th>
              <th className="p-4">Pena</th>
              <th className="p-4">Estatus</th>
              <th className="p-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {sanctions.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-bold text-gray-900 dark:text-white">{s.user?.full_name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    s.severity === SanctionSeverity.GRAVE ? 'bg-red-100 text-red-600' : 
                    s.severity === SanctionSeverity.NORMAL ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {s.severity}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{s.reason}</td>
                <td className="p-4 font-mono text-xs">{s.penalty_description}</td>
                <td className="p-4">
                  <button onClick={() => toggleStatus(s)} className={`flex items-center gap-1 font-bold ${s.status === SanctionStatus.SALDADA ? 'text-green-500' : 'text-red-500'}`}>
                    {s.status === SanctionStatus.SALDADA ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    {s.status}
                  </button>
                </td>
                <td className="p-4">
                  <button onClick={async () => { await deleteSanction(s.id); fetchData(); }} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};