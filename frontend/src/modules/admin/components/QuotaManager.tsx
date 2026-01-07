import { useState, useEffect } from 'react';
import { getQuotas, updateQuota, initQuotas } from '../../../shared/services/api';
import type { ScholarshipQuota } from '../../../shared/types';
import { Save, AlertCircle, RefreshCw, BarChart3, Loader2, Zap, CheckCircle2 } from 'lucide-react';

interface Props {
    scholarshipId: number;
}

export const QuotaManager = ({ scholarshipId }: Props) => {
    const [quotas, setQuotas] = useState<ScholarshipQuota[]>([]);
    const [loading, setLoading] = useState(false);

    // Edición Individual
    const [editingId, setEditingId] = useState<number | null>(null);
    const [tempValue, setTempValue] = useState<number>(0);
    const [updating, setUpdating] = useState(false);

    // Edición Masiva
    const [bulkValue, setBulkValue] = useState<number>(10);
    const [bulkUpdating, setBulkUpdating] = useState(false);

    useEffect(() => {
        loadQuotas();
    }, [scholarshipId]);

    const loadQuotas = async () => {
        setLoading(true);
        try {
            const data = await getQuotas(scholarshipId);
            setQuotas(data);
        } catch (error) {
            console.error("Error cargando cupos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInit = async () => {
        if (!confirm("¿Inicializar cupos para todas las carreras en 0?")) return;
        setLoading(true);
        try {
            const data = await initQuotas(scholarshipId);
            setQuotas(data);
        } catch (e) {
            alert("Error al inicializar");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE ACTUALIZACIÓN INDIVIDUAL ---
    const startEdit = (q: ScholarshipQuota) => {
        setEditingId(q.id);
        setTempValue(q.total_slots);
    };

    const saveEdit = async (id: number) => {
        setUpdating(true);
        try {
            const updated = await updateQuota(id, tempValue);
            setQuotas(prev => prev.map(q => q.id === id ? updated : q));
            setEditingId(null);
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al actualizar");
        } finally {
            setUpdating(false);
        }
    };

    // --- LÓGICA DE ACTUALIZACIÓN MASIVA (NUEVO) ---
    const handleBulkApply = async () => {
        if (!confirm(`¿Estás seguro de asignar ${bulkValue} lugares a TODAS las carreras?`)) return;

        setBulkUpdating(true);
        let errors = 0;
        let success = 0;

        try {
            // Ejecutamos todas las promesas en paralelo
            const results = await Promise.allSettled(
                quotas.map(q => updateQuota(q.id, bulkValue))
            );

            // Procesamos resultados para dar feedback al usuario
            results.forEach((res) => {
                if (res.status === 'fulfilled') success++;
                else errors++;
            });

            // Recargamos datos frescos
            await loadQuotas();

            if (errors > 0) {
                alert(`⚠️ Se actualizaron ${success} carreras.\n❌ ${errors} no se pudieron actualizar porque el nuevo cupo es menor a los alumnos ya aceptados.`);
            } else {
                // Feedback visual sutil (opcional)
                // alert(`✅ ¡Listo! Todas las carreras tienen ahora ${bulkValue} lugares.`);
            }

        } catch (error) {
            console.error("Error masivo:", error);
            alert("Ocurrió un error inesperado en la actualización masiva.");
        } finally {
            setBulkUpdating(false);
        }
    };

    if (loading && !quotas.length) return <div className="p-8 text-center text-gray-500">Cargando matriz de cupos...</div>;

    if (quotas.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin cupos definidos</h3>
                <p className="text-gray-500 mb-4">Esta convocatoria no tiene límites por carrera configurados.</p>
                <button onClick={handleInit} className="btn-primary flex items-center gap-2 mx-auto">
                    <RefreshCw size={18}/> Inicializar Cupos
                </button>
            </div>
        );
    }

    // Cálculos para KPIs
    const totalSlots = quotas.reduce((acc, q) => acc + q.total_slots, 0);
    const totalUsed = quotas.reduce((acc, q) => acc + q.used_slots, 0);
    const totalPercent = totalSlots > 0 ? (totalUsed / totalSlots) * 100 : 0;

    return (
        <div className="space-y-6">

            {/* KPI GLOBAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-slate-700">
                    <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Oferta Total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalSlots}</p>
                    <p className="text-xs text-gray-500">Becas disponibles</p>
                </div>
                <div className="bg-green-50 dark:bg-slate-800 p-4 rounded-lg border border-green-100 dark:border-slate-700">
                    <p className="text-xs font-bold uppercase text-green-600 dark:text-green-400 tracking-wider">Asignadas</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalUsed}</p>
                    <p className="text-xs text-gray-500">Alumnos aceptados</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Ocupación Global</span>
                        <span className="text-lg font-bold text-guinda-600 dark:text-guinda-400">{totalPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                        <div className="bg-guinda-600 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(totalPercent, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* HERRAMIENTA DE ASIGNACIÓN MASIVA (NUEVO) */}
            <div className="bg-gray-100 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 text-yellow-700 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Acciones Rápidas</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Repartir cupos a todas las carreras por igual.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="number"
                        min="0"
                        value={bulkValue}
                        onChange={(e) => setBulkValue(Number(e.target.value))}
                        className="form-input w-24 py-2 text-center font-bold"
                        placeholder="Cant."
                    />
                    <button
                        onClick={handleBulkApply}
                        disabled={bulkUpdating}
                        className="btn-primary whitespace-nowrap bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 border-none text-white flex items-center gap-2"
                    >
                        {bulkUpdating ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                        Aplicar a Todas
                    </button>
                </div>
            </div>

            {/* TABLA DETALLADA */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-slate-400 sm:pl-6">Carrera</th>
                            <th className="px-3 py-3.5 text-center text-xs font-bold uppercase text-gray-500 dark:text-slate-400">Progreso</th>
                            <th className="px-3 py-3.5 text-center text-xs font-bold uppercase text-gray-500 dark:text-slate-400">Aceptados</th>
                            <th className="px-3 py-3.5 text-center text-xs font-bold uppercase text-gray-500 dark:text-slate-400">Cupo Total</th>
                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Editar</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {quotas.map((quota) => {
                            const percent = quota.total_slots > 0 ? (quota.used_slots / quota.total_slots) * 100 : 0;
                            const isFull = quota.used_slots >= quota.total_slots && quota.total_slots > 0;

                            return (
                                <tr key={quota.id} className={isFull ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                        {quota.career_name}
                                        {isFull && <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase tracking-wide">Lleno</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-1/3">
                                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-red-600' : percent >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-bold text-gray-700 dark:text-gray-300">
                                        {quota.used_slots}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                        {editingId === quota.id ? (
                                            <input
                                                type="number"
                                                className="w-20 text-center py-1 border-guinda-500 ring-2 ring-guinda-200 rounded-md font-bold text-gray-900"
                                                value={tempValue}
                                                onChange={(e) => setTempValue(Number(e.target.value))}
                                                autoFocus
                                                min={quota.used_slots}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(quota.id)}
                                            />
                                        ) : (
                                            <span className="text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-md">
                                                {quota.total_slots}
                                            </span>
                                        )}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        {editingId === quota.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => saveEdit(quota.id)} disabled={updating} className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors">
                                                    {updating ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors">
                                                    <AlertCircle size={18} className="rotate-45"/>
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEdit(quota)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs border border-blue-200 dark:border-blue-800 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                                Editar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};