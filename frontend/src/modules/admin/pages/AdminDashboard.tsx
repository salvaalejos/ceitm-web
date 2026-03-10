import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Newspaper,
  MessageSquareWarning,
  ArrowRight,
  TrendingUp,
  Activity,
  FileText,
  CalendarDays,
  ShieldAlert, // Icono para sanciones
  X,           // Icono cerrar modal
  CheckCircle, // Icono saldada
  Clock        // Icono pendiente
} from 'lucide-react';
import { useAuthStore } from '../../../shared/store/authStore';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import {
  getUsers,
  getScholarships,
  getNews,
  getComplaints,
  getSanctions // Importamos servicio de sanciones
} from '../../../shared/services/api';
import { type Sanction, SanctionStatus } from '../../../shared/types';

// Componentes locales
import { GoogleAnalyticsSection } from '../components/GoogleAnalyticsSection';
import WeeklyScheduleGrid from '../components/WeeklyScheduleGrid';

// --- COMPONENTE: TARJETA DE ESTADÍSTICA ---
const StatCard = ({ title, value, icon: Icon, color, to, onClick, subtitle }: any) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {to && (
        <Link to={to} className="text-gray-400 hover:text-guinda-600 dark:hover:text-guinda-400 transition-colors">
          <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  </div>
);

export const AdminDashboard = () => {
  const { user } = useAuthStore();
  const {
    isAdmin,
    isConcejal,
    canManageUsers,
    canManageNoticias,
    canReviewBecas
  } = usePermissions();

  const [stats, setStats] = useState({
    users: 0,
    scholarships: 0,
    activeScholarships: 0,
    news: 0,
    complaints: 0,
    mySanctions: 0 // Contador de sanciones pendientes
  });

  const [mySanctionsList, setMySanctionsList] = useState<Sanction[]>([]);
  const [showSanctionsModal, setShowSanctionsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const promises = [];

      // Carga condicional basada en permisos
      if (canManageUsers) {
        promises.push(getUsers().then(data => ({ key: 'users', val: data.length })));
      }
      if (canReviewBecas) {
        promises.push(getScholarships(false).then(data => {
            const active = data.filter((s: any) => s.is_active).length;
            return { key: 'scholarships', val: data.length, extra: active };
        }));
      }
      if (canManageNoticias) {
        promises.push(getNews().then(data => ({ key: 'news', val: data.length })));
      }

      // Datos accesibles para todos
      promises.push(getComplaints().then(data => ({ key: 'complaints', val: data.length })));

      // Cargar MIS Sanciones (El backend filtra por usuario si no es admin)
      promises.push(getSanctions().then(data => {
        setMySanctionsList(data);
        // Contamos solo las pendientes para la alerta
        const pending = data.filter((s: Sanction) => s.status === SanctionStatus.PENDIENTE).length;
        return { key: 'mySanctions', val: pending };
      }));

      const results = await Promise.allSettled(promises);
      const newStats: any = { ...stats };

      results.forEach((res: any) => {
        if (res.status === 'fulfilled' && res.value) {
            newStats[res.value.key] = res.value.val;
            if (res.value.extra !== undefined) newStats.activeScholarships = res.value.extra;
        }
      });
      setStats(newStats);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">

      {/* --- HERO SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Hola, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                {isAdmin ? 'Bienvenido al panel de control general.' :
                 isConcejal ? `Panel de gestión para ${user?.career || 'tu carrera'}.` :
                 `Gestión del área de ${user?.area || 'Operaciones'}.`}
            </p>
        </div>
        <div className="text-sm text-gray-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm">
            📅 {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* --- ANALYTICS --- */}
      <GoogleAnalyticsSection isVisible={canManageUsers} />

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* TARJETA DE SANCIONES (VISIBLE PARA TODOS) */}
        <StatCard
            title="Mis Sanciones"
            value={loading ? '...' : stats.mySanctions}
            icon={ShieldAlert}
            // Rojo si hay pendientes, Verde si está limpio
            color={stats.mySanctions > 0 ? "bg-red-500 text-red-600" : "bg-green-500 text-green-600"}
            onClick={() => setShowSanctionsModal(true)}
            subtitle={stats.mySanctions > 0 ? "Tienes faltas pendientes" : "Historial limpio"}
        />

        {canManageUsers && (
            <StatCard
                title="Usuarios Totales"
                value={loading ? '...' : stats.users}
                icon={Users}
                color="bg-blue-500 text-blue-600"
                to="/admin/usuarios"
                subtitle="Administradores y Staff"
            />
        )}
        {canReviewBecas && (
            <StatCard
                title="Convocatorias"
                value={loading ? '...' : stats.scholarships}
                icon={GraduationCap}
                color="bg-guinda-600 text-guinda-600"
                to="/admin/becas"
                subtitle={`${stats.activeScholarships} Activas actualmente`}
            />
        )}

        {/* Si no hay suficientes cards de admin, mostramos Quejas para rellenar */}
        <StatCard
            title="Quejas Recibidas"
            value={loading ? '...' : stats.complaints}
            icon={MessageSquareWarning}
            color="bg-orange-500 text-orange-600"
            to="/admin/quejas"
            subtitle="Buzón Estudiantil"
        />
      </div>

      {/* --- HORARIO DE GUARDIAS --- */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="text-guinda-600" size={24} />
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Horario de Guardias</h3>
            <p className="text-xs text-gray-500">Consulta de turnos de atención presencial</p>
          </div>
        </div>
        <WeeklyScheduleGrid />
      </section>

      {/* --- PANELES DE ACCIÓN RÁPIDA (Solo Admins/Estructura) --- */}
      {(canReviewBecas || canManageNoticias || canManageUsers) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-guinda-600" /> Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {canReviewBecas && (
                        <Link to="/admin/becas" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-guinda-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-guinda-200">
                            <div className="bg-white dark:bg-slate-700 p-3 rounded-lg text-guinda-600 shadow-sm group-hover:scale-110 transition-transform">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Revisar Solicitudes</h4>
                                <p className="text-xs text-gray-500">Evaluar aspirantes pendientes</p>
                            </div>
                        </Link>
                    )}
                    {canManageNoticias && (
                        <Link to="/admin/noticias" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-blue-200">
                            <div className="bg-white dark:bg-slate-700 p-3 rounded-lg text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Newspaper size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Nueva Noticia</h4>
                                <p className="text-xs text-gray-500">Publicar aviso o evento</p>
                            </div>
                        </Link>
                    )}
                    <Link to="/admin/documentos" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-green-200">
                        <div className="bg-white dark:bg-slate-700 p-3 rounded-lg text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Repositorio</h4>
                            <p className="text-xs text-gray-500">Formatos y reglamentos</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* ESTADO DEL SISTEMA */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-blue-500" /> Estado del Sistema
                </h3>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0"></div>
                        <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Sistema Operativo</p>
                            <p className="text-xs text-gray-500">Todos los servicios funcionando</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-2 h-2 mt-2 rounded-full bg-guinda-500 shrink-0"></div>
                        <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Ciclo Escolar</p>
                            <p className="text-xs text-gray-500">Enero - Junio 2026</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* --- MODAL DE "MIS SANCIONES" --- */}
      {showSanctionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-scale-up">
                {/* Header Modal */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mi Historial de Sanciones</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Registro de faltas y penalizaciones.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowSanctionsModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Lista de Sanciones */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {mySanctionsList.length === 0 ? (
                        <div className="text-center py-12 bg-green-50 dark:bg-green-900/10 rounded-xl border border-dashed border-green-200 dark:border-green-900">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3 opacity-80" />
                            <p className="text-green-800 dark:text-green-300 font-bold">¡Todo en orden!</p>
                            <p className="text-sm text-green-600 dark:text-green-400">No tienes sanciones registradas.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {mySanctionsList.map((sanction) => (
                                <div key={sanction.id} className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                sanction.severity === 'Grave' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                sanction.severity === 'Normal' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {sanction.severity}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(sanction.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{sanction.reason}</h4>
                                        <p className="text-xs text-guinda-600 dark:text-guinda-400 font-mono bg-guinda-50 dark:bg-guinda-900/10 px-2 py-1 rounded w-fit">
                                            Penalización: {sanction.penalty_description}
                                        </p>
                                    </div>

                                    <div className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                                        sanction.status === SanctionStatus.SALDADA
                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                    }`}>
                                        {sanction.status === SanctionStatus.SALDADA ? <CheckCircle size={16} /> : <Clock size={16} />}
                                        {sanction.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};