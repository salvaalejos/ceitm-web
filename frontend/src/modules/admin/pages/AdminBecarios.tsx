import { useState, useEffect } from 'react';
import { api } from '../../../shared/services/api';
import { Search, Ban, CheckCircle, History, GraduationCap, FileText, Download, Send, X, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import Swal from 'sweetalert2';

// --- TIPOS ---
interface StudentRecord {
    control_number: string;
    full_name: string;
    email: string;
    career_rel?: { name: string };
    career?: string;
    is_blacklisted: boolean;
}

interface ApplicationHistory {
    id: number;
    status: string;
    created_at: string;
    release_folio?: string;
    scholarship?: {
        name: string;
        id: number;
    };
}

const AdminBecarios = () => {
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // --- ESTADOS PARA MODALES ---
    const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
    const [history, setHistory] = useState<ApplicationHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Modal Liberación
    const [releaseModalOpen, setReleaseModalOpen] = useState(false);
    const [appToRelease, setAppToRelease] = useState<number | null>(null);
    const [releaseForm, setReleaseForm] = useState({
        activity: '',
        period: 'A', // A = Ene-Jun
        year: new Date().getFullYear()
    });

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<StudentRecord[]>('/students/');
            setStudents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async (student: StudentRecord) => {
        setSelectedStudent(student);
        setLoadingHistory(true);
        try {
            const { data } = await api.get<ApplicationHistory[]>(`/students/${student.control_number}/history`);
            setHistory(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar el historial', 'error');
            setSelectedStudent(null);
        } finally {
            setLoadingHistory(false);
        }
    };

    const openReleaseModal = (appId: number) => {
        setAppToRelease(appId);
        setReleaseForm({ activity: '', period: 'A', year: new Date().getFullYear() });
        setReleaseModalOpen(true);
    };

    const handleReleaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appToRelease || !releaseForm.activity) return;

        try {
            await api.patch(`/becas/applications/${appToRelease}`, {
                status: 'Liberada',
                release_activity: releaseForm.activity,
                release_period: releaseForm.period,
                release_year: releaseForm.year
            });

            setReleaseModalOpen(false);
            if (selectedStudent) loadHistory(selectedStudent);

            Swal.fire({
                icon: 'success',
                title: '¡Beca Liberada!',
                text: 'El folio ha sido generado correctamente.',
                background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
            });
        } catch (e) {
            Swal.fire('Error', 'No se pudo liberar.', 'error');
        }
    };

    const handleDownload = async (appId: number, control: string) => {
        try {
            const response = await api.get(`/becas/applications/${appId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Expediente_${control}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            Swal.fire('Error', 'No se pudo descargar', 'error');
        }
    };

    const handleToggleBlacklist = async (student: StudentRecord) => {
        const isDark = document.documentElement.classList.contains('dark');
        const action = student.is_blacklisted ? 'Retirar Veto' : 'Vetar Alumno';

        const res = await Swal.fire({
            title: `¿${action}?`,
            text: `Cambiarás el estatus de ${student.full_name}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: student.is_blacklisted ? '#10b981' : '#ef4444',
            confirmButtonText: `Sí, ${action}`,
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#fff' : '#000'
        });

        if (res.isConfirmed) {
            try {
                await api.patch(`/students/${student.control_number}/toggle-blacklist`);
                setStudents(prev => prev.map(s => s.control_number === student.control_number ? { ...s, is_blacklisted: !s.is_blacklisted } : s));
            } catch (e) { Swal.fire('Error', 'Falló la operación', 'error'); }
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(filter.toLowerCase()) ||
        s.control_number.includes(filter)
    );

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando Padrón...</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="text-guinda-600" /> Padrón de Becarios
                    </h1>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Administración de expedientes y liberaciones.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o control..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 shadow-sm transition-all"
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla Principal */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 uppercase font-bold text-xs border-b border-gray-100 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Control</th>
                                <th className="p-4">Becario</th>
                                <th className="p-4">Carrera</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic">No se encontraron registros.</td></tr>
                            ) : filteredStudents.map(s => (
                                <tr key={s.control_number} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-mono text-gray-600 dark:text-gray-400 font-medium">{s.control_number}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{s.full_name}</div>
                                        <div className="text-xs text-gray-400">{s.email}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        {s.career_rel?.name || s.career || '---'}
                                    </td>
                                    <td className="p-4 text-center">
                                        {s.is_blacklisted
                                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 text-xs font-bold"><Ban size={12}/> Vetado</span>
                                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 text-xs font-bold"><CheckCircle size={12}/> Activo</span>
                                        }
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        {/* Botón Historial */}
                                        <button
                                            onClick={() => loadHistory(s)}
                                            className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                            title="Ver Expediente e Historial"
                                        >
                                            <FileText size={16}/> <span className="hidden md:inline">Expediente</span>
                                        </button>

                                        {/* Botón Blacklist (RECUPERADO) */}
                                        <button
                                            onClick={() => handleToggleBlacklist(s)}
                                            className={`p-2 rounded-lg transition-all border ${
                                                s.is_blacklisted 
                                                ? 'text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-900/20' 
                                                : 'text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20'
                                            }`}
                                            title={s.is_blacklisted ? "Retirar Veto" : "Vetar Alumno"}
                                        >
                                            {s.is_blacklisted ? <UserCheck size={16} /> : <UserX size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>{filteredStudents.length} resultados</span>
                    <span>Total: {students.length}</span>
                </div>
            </div>

            {/* MODAL DE HISTORIAL (ESTILO MEJORADO) */}
            {selectedStudent && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/80 dark:bg-slate-800/50 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-guinda-100 dark:bg-guinda-900/30 flex items-center justify-center text-guinda-700 dark:text-guinda-400 font-bold text-lg">
                                    {selectedStudent.full_name[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{selectedStudent.full_name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{selectedStudent.control_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Modal */}
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                            {loadingHistory ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin h-8 w-8 border-4 border-guinda-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                    <p className="text-gray-400 text-sm">Cargando historial...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                                    <History className="mx-auto h-10 w-10 mb-3 text-gray-300 dark:text-slate-600" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Sin solicitudes registradas.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((app, index) => (
                                        <div key={app.id} className="relative pl-6 pb-6 border-l-2 border-gray-100 dark:border-slate-800 last:pb-0 last:border-0">
                                            {/* Timeline Dot */}
                                            <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 
                                                ${app.status === 'Liberada' ? 'bg-blue-500' : 
                                                  app.status === 'Aprobada' ? 'bg-green-500' : 
                                                  app.status === 'Rechazada' ? 'bg-red-500' : 'bg-gray-300'}
                                            `}></div>

                                            <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{app.scholarship?.name || 'Convocatoria'}</h4>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {new Date(app.created_at).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                                                        ${app.status === 'Liberada' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                                                          app.status === 'Aprobada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                                                          'bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-gray-400'}
                                                    `}>
                                                        {app.status}
                                                    </span>
                                                </div>

                                                {app.release_folio && (
                                                    <div className="mb-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-slate-800 flex items-center justify-between group">
                                                        <div>
                                                            <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Folio Oficial</p>
                                                            <p className="text-base font-mono font-black text-blue-600 dark:text-blue-400 tracking-widest select-all">{app.release_folio}</p>
                                                        </div>
                                                        <CheckCircle size={20} className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                )}

                                                <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-slate-800">
                                                    <button
                                                        onClick={() => handleDownload(app.id, selectedStudent.control_number)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                                                    >
                                                        <Download size={14} /> Descargar
                                                    </button>

                                                    {app.status === 'Aprobada' && (
                                                        <button
                                                            onClick={() => openReleaseModal(app.id)}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-guinda-600 hover:bg-guinda-700 text-white text-xs font-bold transition-colors shadow-md shadow-guinda-900/20"
                                                        >
                                                            <Send size={14} /> Liberar Beca
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE LIBERACIÓN (INPUT MANUAL) */}
            {releaseModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Liberar Beca</h3>
                            <button onClick={() => setReleaseModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleReleaseSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Actividad Realizada</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Recolecta de víveres"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 focus:border-guinda-500 transition-all"
                                    value={releaseForm.activity}
                                    onChange={e => setReleaseForm({...releaseForm, activity: e.target.value})}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">El folio usará las primeras 3 letras (Ej. REC)</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Periodo</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:border-guinda-500"
                                        value={releaseForm.period}
                                        onChange={e => setReleaseForm({...releaseForm, period: e.target.value})}
                                    >
                                        <option value="A">Ene-Jun (A)</option>
                                        <option value="B">Ago-Dic (B)</option>
                                        <option value="V">Verano (V)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Año</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:border-guinda-500"
                                        value={releaseForm.year}
                                        onChange={e => setReleaseForm({...releaseForm, year: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3.5 mt-2 rounded-xl bg-guinda-600 hover:bg-guinda-700 text-white font-bold shadow-lg shadow-guinda-900/30 transition-all transform active:scale-95">
                                Generar Folio y Liberar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBecarios;