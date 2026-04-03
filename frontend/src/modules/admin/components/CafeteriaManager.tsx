import React, { useState, useEffect } from 'react';
import { Coffee, Plus, Edit, Trash2, X, Save, MapPin, Users, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { getCafeterias, createCafeteria, updateCafeteria, deleteCafeteria, resetCafeterias } from '../../../shared/services/api';

interface Cafeteria {
    id: number;
    nombre: string;
    campus: string;
    limite_becas: number;
    becas_asignadas?: number;
}

export const CafeteriaManager = () => {
    const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        campus: '',
        limite_becas: 0
    });

    useEffect(() => {
        loadCafeterias();
    }, []);

    const loadCafeterias = async () => {
        setLoading(true);
        try {
            const data = await getCafeterias();
            setCafeterias(data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar las cafeterías', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (cafeteria?: Cafeteria) => {
        if (cafeteria) {
            setEditingId(cafeteria.id);
            setFormData({
                nombre: cafeteria.nombre,
                campus: cafeteria.campus,
                limite_becas: cafeteria.limite_becas
            });
        } else {
            setEditingId(null);
            setFormData({ nombre: '', campus: '', limite_becas: 0 });
        }
        setModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await updateCafeteria(editingId, formData);
                Swal.fire({ icon: 'success', title: 'Actualizada', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            } else {
                await createCafeteria(formData);
                Swal.fire({ icon: 'success', title: 'Creada', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            }
            setModalOpen(false);
            loadCafeterias();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar la información', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number, nombre: string) => {
        const isDark = document.documentElement.classList.contains('dark');
        const res = await Swal.fire({
            title: '¿Eliminar Cafetería?',
            text: `Estás a punto de borrar "${nombre}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#fff' : '#000'
        });

        if (res.isConfirmed) {
            try {
                await deleteCafeteria(id);
                Swal.fire({ icon: 'success', title: 'Eliminada', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                loadCafeterias();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar (verifica que no tenga becas asignadas)', 'error');
            }
        }
    };

    // --- NUEVA LÓGICA DE REINICIO DE SEMESTRE ---
    const handleReset = async () => {
        const isDark = document.documentElement.classList.contains('dark');
        const res = await Swal.fire({
            title: '¿Cambio de Semestre?',
            text: 'Esto liberará TODOS los cupos y desasignará a los becarios actuales. Las cafeterías y sus límites se mantendrán intactos. ¿Proceder?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, reiniciar asignaciones',
            cancelButtonText: 'Cancelar',
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#fff' : '#000'
        });

        if (res.isConfirmed) {
            setLoading(true);
            try {
                await resetCafeterias();
                Swal.fire({ icon: 'success', title: 'Todos los cupos fueron liberados', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                loadCafeterias();
            } catch (error) {
                Swal.fire('Error', 'No se pudo reiniciar', 'error');
                setLoading(false);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Coffee className="text-orange-500" /> Gestión de Cafeterías
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administra los puntos de alimentación y sus cupos máximos.</p>
                </div>

                {/* BOTONERA ACTUALIZADA */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 text-sm px-4 py-2 border rounded-xl font-bold transition-colors border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <RefreshCw size={16} /> Reiniciar Asignaciones
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="btn-primary flex items-center justify-center gap-2 text-sm px-4 py-2"
                    >
                        <Plus size={16} /> Nueva Cafetería
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : cafeterias.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No hay cafeterías registradas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cafeterias.map(caf => {
                        const libres = caf.limite_becas - (caf.becas_asignadas || 0);

                        return (
                            <div key={caf.id} className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{caf.nombre}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                            <MapPin size={12} /> {caf.campus}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(caf)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                            <Edit size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(caf.id, caf.nombre)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users size={16} className="text-gray-400" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {caf.becas_asignadas || 0} / {caf.limite_becas}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                        libres > 0 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {libres > 0 ? `${libres} Libres` : 'Lleno'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL FORMULARIO */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Editar Cafetería' : 'Registrar Cafetería'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Nombre del Local</label>
                                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Cafetería Central" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Ubicación / Campus</label>
                                <input required type="text" name="campus" value={formData.campus} onChange={handleChange} placeholder="Ej. Campus 1" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Límite de Becas</label>
                                <input required type="number" name="limite_becas" min="1" value={formData.limite_becas} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} /> {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};