import React, { useEffect, useState } from 'react';
import { getSanctions, createSanction, updateSanction, deleteSanction, getUsers } from '../../../shared/services/api';
import { type Sanction, SanctionSeverity, SanctionStatus, type User, UserRole } from '../../../shared/types';
import { CheckCircle2, Trash2, Plus, Clock, ShieldAlert, X, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

export const SanctionsManager: React.FC = () => {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    user_id: '',
    severity: SanctionSeverity.LEVE,
    reason: '',
    penalty_description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sanctionsData, usersData] = await Promise.all([
        getSanctions(),
        getUsers()
      ]);
      setSanctions(sanctionsData);
      setUsers(usersData.filter(u => u.role !== UserRole.ADMIN_SYS));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSanction({
        ...formData,
        user_id: parseInt(formData.user_id)
      });
      setIsModalOpen(false);
      setFormData({ user_id: '', severity: SanctionSeverity.LEVE, reason: '', penalty_description: '' });
      fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Sanción registrada',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
      });
    } catch (error) {
      Swal.fire('Error', 'No se pudo registrar la sanción', 'error');
    }
  };

  const toggleStatus = async (sanc: Sanction) => {
    try {
      const newStatus = sanc.status === SanctionStatus.PENDIENTE ? SanctionStatus.SALDADA : SanctionStatus.PENDIENTE;
      await updateSanction(sanc.id, { status: newStatus });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    const isDark = document.documentElement.classList.contains('dark');
    const result = await Swal.fire({
        title: '¿Eliminar sanción?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#000'
    });

    if (result.isConfirmed) {
        await deleteSanction(id);
        fetchData();
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Cargando módulo de disciplina...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-guinda-50 dark:bg-guinda-900/20 rounded-lg">
                <ShieldAlert className="text-guinda-600 dark:text-guinda-400" size={24} />
            </div>
            <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Control de Disciplina</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestiona las faltas y penalizaciones del equipo.</p>
            </div>
        </div>
        <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-guinda-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-guinda-700 transition-all shadow-lg shadow-guinda-900/20 hover:scale-105 active:scale-95"
        >
          <Plus size={18} /> Nueva Sanción
        </button>
      </div>

      {/* Grid de Sanciones (Mejor que tabla simple) */}
      <div className="grid grid-cols-1 gap-4">
        {sanctions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                <ShieldAlert className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-700 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Sin sanciones activas.</p>
                <p className="text-xs text-gray-400">¡El equipo se está portando bien!</p>
            </div>
        ) : (
            sanctions.map(s => (
                <div key={s.id} className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-xl
                            ${s.user?.imagen_url ? 'bg-gray-100' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 text-gray-600 dark:text-gray-300'}
                        `}>
                            {s.user?.imagen_url ? (
                                <img src={s.user.imagen_url} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                s.user?.full_name[0]
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">{s.user?.full_name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                    s.severity === SanctionSeverity.GRAVE ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                    s.severity === SanctionSeverity.NORMAL ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                    {s.severity}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{s.reason}</p>
                            <div className="flex items-center gap-2 text-xs text-guinda-600 dark:text-guinda-400 font-mono bg-guinda-50 dark:bg-guinda-900/10 px-2 py-1 rounded w-fit">
                                <AlertTriangle size={12} />
                                Penalización: {s.penalty_description}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pl-16 md:pl-0 border-t md:border-t-0 border-gray-100 dark:border-slate-800 pt-4 md:pt-0">
                        <button
                            onClick={() => toggleStatus(s)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                s.status === SanctionStatus.SALDADA
                                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
                            }`}
                        >
                            {s.status === SanctionStatus.SALDADA ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                            {s.status === SanctionStatus.SALDADA ? 'Saldada' : 'Pendiente'}
                        </button>

                        <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Modal Nativo Personalizado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Nueva Sanción</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Integrante</label>
                        <select
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all"
                            value={formData.user_id}
                            onChange={e => setFormData({...formData, user_id: e.target.value})}
                        >
                            <option value="">Seleccionar usuario...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name} — {u.area || u.role}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Nivel de Gravedad</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[SanctionSeverity.LEVE, SanctionSeverity.NORMAL, SanctionSeverity.GRAVE].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({...formData, severity: level})}
                                    className={`py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                                        formData.severity === level 
                                            ? 'bg-guinda-600 text-white border-guinda-600 shadow-md shadow-guinda-900/20' 
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Motivo</label>
                        <input
                            required
                            type="text"
                            placeholder="Ej. Llegada tarde a guardia..."
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all"
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Castigo / Pena</label>
                        <input
                            required
                            type="text"
                            placeholder="Ej. Traer el desayuno..."
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all"
                            value={formData.penalty_description}
                            onChange={e => setFormData({...formData, penalty_description: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-guinda-600 text-white font-bold hover:bg-guinda-700 shadow-lg shadow-guinda-900/20 transition-all active:scale-95"
                        >
                            Guardar Sanción
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};