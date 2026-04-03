import React, { useState, useEffect } from 'react';
import { api, registerAttendance, getWeeklyFaults, exportAttendancesExcel, getWeeklyAttendanceRecords } from '../../../shared/services/api';
import { Search, Ban, CheckCircle, History, GraduationCap, FileText, Download, Send, X, UserCheck, UserX, ChevronLeft, ChevronRight, CalendarCheck, AlertTriangle, Filter, Undo } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../../../shared/hooks/usePermissions';

interface StudentRecord {
    control_number: string;
    full_name: string;
    email: string;
    career_rel?: { name: string };
    career?: string;
    is_blacklisted: boolean;
    current_week_faults?: number;
    scholarship_type?: string;
    days_active?: number;
    total_services?: number;
    released_services?: number;
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
    const { isAdmin, isEstructura, area } = usePermissions();
    const canVetarYLiberar = isAdmin || isEstructura || area === 'Prevención y Logística';
    const canRegistrarAsistencia = isAdmin || isEstructura || area === 'Becas y Apoyos';

    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState('control_desc');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 10;

    const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
    const [history, setHistory] = useState<ApplicationHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [studentForAttendance, setStudentForAttendance] = useState<StudentRecord | null>(null);
    const [weeklyAttendances, setWeeklyAttendances] = useState<Record<string, string>>({});
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

    const [releaseModalOpen, setReleaseModalOpen] = useState(false);
    const [appToRelease, setAppToRelease] = useState<number | null>(null);
    const [releaseForm, setReleaseForm] = useState({ activity: '', period: 'A', year: new Date().getFullYear() });

    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [excelDates, setExcelDates] = useState({ start: '', end: '' });

    useEffect(() => {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(monday.getDate() - monday.getDay() + 1);
        const friday = new Date(today);
        friday.setDate(friday.getDate() - friday.getDay() + 5);

        const formatLocal = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        setExcelDates({
            start: formatLocal(monday),
            end: formatLocal(friday)
        });
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadStudents();
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [page, filter, sortBy]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * limit;
            const searchParam = filter ? `&search=${encodeURIComponent(filter)}` : '';

            const { data } = await api.get(`/students/?skip=${skip}&limit=${limit}&sort_by=${sortBy}${searchParam}`);
            setStudents(data.items);
            setTotal(data.total);
        } catch (error: any) {
            console.error("🔥 Error completo de Axios:", error);
            if (error.response && error.response.data) {
                Swal.fire('Error del Servidor', error.response.data.detail || 'Ocurrió un problema interno en el servidor.', 'error');
            } else {
                Swal.fire('Error de Red', 'No se pudo conectar con el servidor', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(e.target.value);
        setPage(1);
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

    const fetchAttendanceForWeek = async (studentId: string, offset: number) => {
        setAttendanceLoading(true);
        try {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const numDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const targetMonday = new Date(today);
            targetMonday.setDate(today.getDate() - numDay + (offset * 7));

            const formatLocal = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };

            const dateRef = formatLocal(targetMonday);
            const records = await getWeeklyAttendanceRecords(studentId, dateRef);
            const attendanceMap: Record<string, string> = {};
            records.forEach(r => {
                attendanceMap[r.date] = r.status;
            });
            setWeeklyAttendances(attendanceMap);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los registros', 'error');
        } finally {
            setAttendanceLoading(false);
        }
    };

    const openAttendanceModal = (student: StudentRecord) => {
        setStudentForAttendance(student);
        setCurrentWeekOffset(0);
        setAttendanceModalOpen(true);
        fetchAttendanceForWeek(student.control_number, 0);
    };

    const handlePreviousWeek = () => {
        const newOffset = currentWeekOffset - 1;
        setCurrentWeekOffset(newOffset);
        fetchAttendanceForWeek(studentForAttendance!.control_number, newOffset);
    };

    const handleNextWeek = () => {
        const newOffset = currentWeekOffset + 1;
        setCurrentWeekOffset(newOffset);
        fetchAttendanceForWeek(studentForAttendance!.control_number, newOffset);
    };

    const handleMarkAttendance = async (date: string, status: 'presente' | 'falta' | 'justificado') => {
        const currentStatus = weeklyAttendances[date];
        if (currentStatus === status) return;

        if (currentStatus) {
            const isDark = document.documentElement.classList.contains('dark');
            const res = await Swal.fire({
                title: '¿Modificar registro?',
                html: `<p class="text-sm">Ya hay un registro de <b>${currentStatus.toUpperCase()}</b> para este día.<br>¿Deseas cambiarlo a <b>${status.toUpperCase()}</b>?</p>`,
                icon: 'question',
                showCancelButton: true,
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[24px] shadow-2xl border border-gray-100 dark:border-slate-800',
                    title: 'text-xl font-bold text-gray-800 dark:text-white',
                    htmlContainer: 'text-gray-600 dark:text-gray-300',
                    confirmButton: 'rounded-xl px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 ml-2 transition-all',
                    cancelButton: 'rounded-xl px-6 py-2.5 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 mr-2 transition-all'
                },
                confirmButtonText: 'Sí, modificar',
                cancelButtonText: 'Cancelar',
                background: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a'
            });
            if (!res.isConfirmed) return;
        }

        try {
            setAttendanceLoading(true);
            await registerAttendance({ student_id: studentForAttendance!.control_number, date, status: status as any });
            setWeeklyAttendances(prev => ({ ...prev, [date]: status }));

            // Actualizamos el número de faltas en la tabla general si estamos en la semana actual
            if (currentWeekOffset === 0) {
                const faultsRes = await getWeeklyFaults(studentForAttendance!.control_number);
                setStudents(prev => prev.map(s => s.control_number === studentForAttendance!.control_number ? { ...s, current_week_faults: faultsRes.fault_count } : s));
                setStudentForAttendance(prev => prev ? { ...prev, current_week_faults: faultsRes.fault_count } : null);
            }
        } catch(e) {
            Swal.fire('Error', 'No se pudo registrar la asistencia', 'error');
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            await exportAttendancesExcel(excelDates.start, excelDates.end);
            setExcelModalOpen(false);
        } catch(e) {
            Swal.fire('Error', 'No se pudo generar el archivo Excel', 'error');
        }
    };

    const getWeekDates = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const numDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const targetMonday = new Date(today);
        targetMonday.setDate(today.getDate() - numDay + (currentWeekOffset * 7));

        const formatLocal = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const todayStr = formatLocal(today);
        const days = [];
        const names = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        for (let i = 0; i < 5; i++) {
            const d = new Date(targetMonday);
            d.setDate(targetMonday.getDate() + i);
            const localDateStr = formatLocal(d);

            days.push({
                name: names[i],
                date: localDateStr,
                isToday: localDateStr === todayStr
            });
        }
        return days;
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
            Swal.fire({ icon: 'success', title: '¡Beca Liberada!', text: 'El folio ha sido generado correctamente.' });
            loadStudents();
        } catch (e) {
            Swal.fire('Error', 'No se pudo liberar.', 'error');
        }
    };

    const handleRevertRelease = async (appId: number) => {
        const isDark = document.documentElement.classList.contains('dark');
        const res = await Swal.fire({
            title: '¿Deshacer Liberación?',
            text: 'La solicitud regresará a estado "Aprobada" y se borrará el folio generado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, revertir',
            cancelButtonText: 'Cancelar',
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#fff' : '#000'
        });

        if (res.isConfirmed) {
            try {
                await api.patch(`/becas/applications/${appId}`, {
                    status: 'Aprobada',
                    release_activity: null,
                    release_period: null,
                    release_year: null
                });
                Swal.fire({ icon: 'success', title: 'Revertido', text: 'La liberación ha sido cancelada.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                if (selectedStudent) loadHistory(selectedStudent);
                loadStudents();
            } catch (e) {
                Swal.fire('Error', 'No se pudo revertir la liberación.', 'error');
            }
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

    const totalPages = Math.ceil(total / limit);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // 👇 CÁLCULO DINÁMICO DE FALTAS PARA EL MODAL
    const currentModalFaults = Object.values(weeklyAttendances).filter(status => status === 'falta').length;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="text-guinda-600" /> Padrón de Becarios
                    </h1>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Administración de expedientes y asistencias.</p>
                </div>

                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                    <button
                        onClick={() => setExcelModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white py-3 md:py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm"
                    >
                        <Download size={18} /> <span className="hidden md:inline">Exportar</span> Excel
                    </button>

                    {/* SELECTOR DE ORDENAMIENTO */}
                    <div className="relative flex-1 md:flex-none">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="w-full flex items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 shadow-sm hover:border-guinda-500 dark:hover:border-guinda-500 transition-all group"
                        >
                            <div className="flex items-center gap-2">
                                <Filter size={18}
                                        className="text-gray-400 group-hover:text-guinda-500 transition-colors"/>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    {sortBy === 'control_desc' && 'Más Recientes'}
                                    {sortBy === 'control_asc' && 'Más Antiguos'}
                                    {sortBy === 'name_asc' && 'Nombre (A-Z)'}
                                    {sortBy === 'name_desc' && 'Nombre (Z-A)'}
                                </span>
                            </div>
                            <ChevronRight size={16}
                                          className={`text-gray-400 transition-transform duration-200 ${isSortOpen ? 'rotate-90' : ''}`}/>
                        </button>

                        {/* MENÚ DESPLEGABLE */}
                        {isSortOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                                <div
                                    className="absolute top-full mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-1.5">
                                        {[
                                            {id: 'control_desc', label: 'Más Recientes (Control)'},
                                            {id: 'control_asc', label: 'Más Antiguos (Control)'},
                                            {id: 'name_asc', label: 'Nombre (A-Z)'},
                                            {id: 'name_desc', label: 'Nombre (Z-A)'}
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    setSortBy(option.id);
                                                    setPage(1);
                                                    setIsSortOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                                    sortBy === option.id
                                                        ? 'bg-guinda-50 text-guinda-700 dark:bg-guinda-900/30 dark:text-guinda-400'
                                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o control..."
                            className="w-full pl-10 pr-4 py-3 md:py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 shadow-sm transition-all"
                            value={filter}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
            </div>

            {/* Tabla Principal */}
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
                {loading && (
                    <div
                        className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600"></div>
                    </div>
                )}

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left text-sm">
                        <thead
                            className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 uppercase font-bold text-xs border-b border-gray-100 dark:border-slate-800">
                        <tr>
                            <th className="p-4">Control</th>
                            <th className="p-4">Becario</th>
                            <th className="p-4 text-center">Tipo Beca</th>
                            <th className="p-4 text-center">Días Activo</th>
                            <th className="p-4 text-center">Servicio</th>
                            <th className="p-4 text-center">Asistencia</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {!loading && students.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-gray-400 italic">No se encontraron
                                    registros.
                                </td>
                            </tr>
                        ) : students.map(s => (
                            <tr key={s.control_number}
                                className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 font-mono text-gray-600 dark:text-gray-400 font-medium">{s.control_number}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{s.full_name}</div>
                                        <div className="text-xs text-gray-400">{s.email}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                            {s.scholarship_type || 'Desconocido'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono font-bold text-gray-600 dark:text-gray-400">
                                        {s.scholarship_type === 'Alimenticia' ? (s.days_active !== undefined ? s.days_active : 0) : <span className="text-gray-400 font-medium italic">N/A</span>}
                                    </td>

                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-700">
                                                {s.released_services || 0} / {s.total_services || 0}
                                            </div>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Liberados</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-center">
                                        {s.scholarship_type === 'Alimenticia' ? (
                                            <div className="flex flex-col items-center justify-center">
                                                {canRegistrarAsistencia && (
                                                    <button
                                                        onClick={() => openAttendanceModal(s)}
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-colors mb-1.5 border border-blue-200 dark:border-blue-800"
                                                    >
                                                        Registrar
                                                    </button>
                                                )}
                                                <span className={`text-[11px] font-bold ${s.current_week_faults && s.current_week_faults >= 2 ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    Faltas: {s.current_week_faults || 0}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {s.is_blacklisted
                                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 text-xs font-bold"><Ban size={12}/> Vetado</span>
                                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 text-xs font-bold"><CheckCircle size={12}/> Activo</span>
                                        }
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => loadHistory(s)}
                                            className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                            title="Ver Expediente"
                                        >
                                            <FileText size={16}/> <span className="hidden xl:inline">Expediente</span>
                                        </button>

                                        {canVetarYLiberar && (
                                            <button
                                                onClick={() => handleToggleBlacklist(s)}
                                                className={`p-2 rounded-lg transition-all border ${
                                                    s.is_blacklisted 
                                                    ? 'text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-900/20' 
                                                    : 'text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20'
                                                }`}
                                            >
                                                {s.is_blacklisted ? <UserCheck size={16} /> : <UserX size={16} />}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Mostrando <span className="font-bold text-gray-900 dark:text-white">{students.length}</span> registros de un total de <span className="font-bold text-gray-900 dark:text-white">{total}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">Página {page} de {totalPages || 1}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || totalPages === 0} className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL AISLADO: ASISTENCIAS CON NAVEGACIÓN Y JUSTIFICACIÓN */}
            {attendanceModalOpen && studentForAttendance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/80 dark:bg-slate-800/50 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg">
                                    <CalendarCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Asistencia Semanal</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{studentForAttendance.full_name} • {studentForAttendance.control_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setAttendanceModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-900 min-h-[300px] flex flex-col">
                            <div className="flex justify-between items-center mb-5 bg-gray-50 dark:bg-slate-950 p-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                                <button onClick={handlePreviousWeek} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400">
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                                        {currentWeekOffset === 0 ? 'Semana Actual' : currentWeekOffset < 0 ? `Hace ${Math.abs(currentWeekOffset)} semana(s)` : `Semana +${currentWeekOffset}`}
                                    </span>
                                    {currentWeekOffset !== 0 && (
                                        <button onClick={() => {setCurrentWeekOffset(0); fetchAttendanceForWeek(studentForAttendance.control_number, 0);}} className="text-[10px] mt-0.5 text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider">Volver a hoy</button>
                                    )}
                                </div>
                                <button onClick={handleNextWeek} disabled={currentWeekOffset >= 0} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-20 transition-colors text-gray-600 dark:text-gray-400">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {attendanceLoading && Object.keys(weeklyAttendances).length === 0 ? (
                                <div className="flex-1 flex justify-center items-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-end items-center mb-5">
                                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 px-4 py-1.5 rounded-lg flex items-center gap-2">
                                            Faltas (Semana vista):
                                            {/* 👇 AQUÍ CONTAMOS LOS BOTONES ROJOS EN TIEMPO REAL */}
                                            <span className={`text-lg ${currentModalFaults >= 2 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                {currentModalFaults}
                                            </span>
                                            {currentModalFaults >= 2 && (
                                                <AlertTriangle size={16} className="text-red-500 ml-1" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {getWeekDates().map(day => {
                                            const isPresente = weeklyAttendances[day.date] === 'presente';
                                            const isFalta = weeklyAttendances[day.date] === 'falta';
                                            const isJustificado = weeklyAttendances[day.date] === 'justificado';

                                            return (
                                                <div key={day.date} className={`p-3 rounded-xl border transition-all ${day.isToday && currentWeekOffset === 0 ? 'border-blue-400 bg-blue-50/30 dark:border-blue-700/50 dark:bg-blue-900/10 shadow-sm' : 'border-gray-200 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-950'}`}>
                                                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 text-center mb-0.5 uppercase tracking-wider">{day.name}</p>
                                                    <p className="text-[10px] text-gray-400 text-center mb-3 font-mono">{day.date.slice(5)}</p>

                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => handleMarkAttendance(day.date, 'presente')}
                                                            disabled={attendanceLoading}
                                                            className={`text-[11px] py-1.5 rounded-lg font-bold transition-all shadow-sm ${
                                                                isPresente 
                                                                ? 'bg-green-500 text-white ring-2 ring-green-300 ring-offset-2 dark:ring-offset-slate-950 shadow-green-500/30' 
                                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400 hover:text-green-600 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-400 dark:hover:border-green-600 dark:hover:text-green-400'
                                                            }`}
                                                        >
                                                            Presente
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAttendance(day.date, 'falta')}
                                                            disabled={attendanceLoading}
                                                            className={`text-[11px] py-1.5 rounded-lg font-bold transition-all shadow-sm ${
                                                                isFalta 
                                                                ? 'bg-red-500 text-white ring-2 ring-red-300 ring-offset-2 dark:ring-offset-slate-950 shadow-red-500/30' 
                                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-red-400 hover:text-red-600 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-400 dark:hover:border-red-600 dark:hover:text-red-400'
                                                            }`}
                                                        >
                                                            Falta
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAttendance(day.date, 'justificado')}
                                                            disabled={attendanceLoading}
                                                            className={`text-[11px] py-1.5 rounded-lg font-bold transition-all shadow-sm ${
                                                                isJustificado 
                                                                ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-2 dark:ring-offset-slate-950 shadow-amber-500/30' 
                                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-400 hover:text-amber-600 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-400 dark:hover:border-amber-600 dark:hover:text-amber-400'
                                                            }`}
                                                        >
                                                            Justificado
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ORIGINAL: HISTORIAL (EXPEDIENTE) */}
            {selectedStudent && !attendanceModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-slate-800">
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

                        <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <History size={18} className="text-guinda-600" /> Historial de Solicitudes
                            </h4>
                            {loadingHistory ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin h-8 w-8 border-4 border-guinda-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Sin solicitudes registradas.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((app) => (
                                        <div key={app.id} className="relative pl-6 pb-6 border-l-2 border-gray-100 dark:border-slate-800 last:pb-0 last:border-0">
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
                                                    <button onClick={() => handleDownload(app.id, selectedStudent.control_number)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors">
                                                        <Download size={14} /> Descargar
                                                    </button>

                                                    {/* 👇 BOTÓN LIBERAR (Solo PyL y Admin) */}
                                                    {app.status === 'Aprobada' && canVetarYLiberar && (
                                                        <button onClick={() => openReleaseModal(app.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-guinda-600 hover:bg-guinda-700 text-white text-xs font-bold transition-colors shadow-md shadow-guinda-900/20">
                                                            <Send size={14} /> Liberar Beca
                                                        </button>
                                                    )}

                                                    {/* 👇 NUEVO BOTÓN REVERTIR (Solo PyL y Admin) */}
                                                    {app.status === 'Liberada' && canVetarYLiberar && (
                                                        <button onClick={() => handleRevertRelease(app.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-md shadow-amber-900/20">
                                                            <Undo size={14} /> Deshacer
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

            {/* MODAL DE LIBERACIÓN */}
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
                                <input required type="text" placeholder="Ej. Recolecta de víveres" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-guinda-500 focus:border-guinda-500 transition-all" value={releaseForm.activity} onChange={e => setReleaseForm({...releaseForm, activity: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Periodo</label>
                                    <select className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:border-guinda-500" value={releaseForm.period} onChange={e => setReleaseForm({...releaseForm, period: e.target.value})}>
                                        <option value="A">Ene-Jun (A)</option>
                                        <option value="B">Ago-Dic (B)</option>
                                        <option value="V">Verano (V)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Año</label>
                                    <input type="number" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:border-guinda-500" value={releaseForm.year} onChange={e => setReleaseForm({...releaseForm, year: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3.5 mt-2 rounded-xl bg-guinda-600 hover:bg-guinda-700 text-white font-bold shadow-lg shadow-guinda-900/30 transition-all transform active:scale-95">
                                Generar Folio y Liberar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EXPORTAR EXCEL */}
            {excelModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Download size={20} className="text-green-600" /> Exportar Asistencias
                            </h3>
                            <button onClick={() => setExcelModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Fecha Inicio</label>
                                <input type="date" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all" value={excelDates.start} onChange={e => setExcelDates({...excelDates, start: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Fecha Fin</label>
                                <input type="date" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all" value={excelDates.end} onChange={e => setExcelDates({...excelDates, end: e.target.value})} />
                            </div>
                            <button onClick={handleExportExcel} className="w-full py-3.5 mt-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-900/30 transition-all transform active:scale-95">
                                Descargar Archivo Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBecarios;