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
  CalendarDays // Icono para el horario
} from 'lucide-react';
import { useAuthStore } from '../../../shared/store/authStore';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import {
  getUsers,
  getScholarships,
  getNews,
  getComplaints
} from '../../../shared/services/api';

// Componentes locales
import { GoogleAnalyticsSection } from '../components/GoogleAnalyticsSection';
import WeeklyScheduleGrid from '../components/WeeklyScheduleGrid';

// --- COMPONENTE: TARJETA DE ESTADÍSTICA (Tu estándar) ---
const StatCard = ({ title, value, icon: Icon, color, to, subtitle }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
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
    complaints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const promises = [];
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
      promises.push(getComplaints().then(data => ({ key: 'complaints', val: data.length })));

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
    <div className="space-y-8 animate-fade-in">

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

      {/* --- SECCIÓN ANALYTICS (Componente separado) --- */}
      <GoogleAnalyticsSection isVisible={canManageUsers} />

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        {canManageNoticias && (
            <StatCard
                title="Noticias Publicadas"
                value={loading ? '...' : stats.news}
                icon={Newspaper}
                color="bg-purple-500 text-purple-600"
                to="/admin/noticias"
                subtitle="Visibles en la app"
            />
        )}
        <StatCard
            title="Quejas Recibidas"
            value={loading ? '...' : stats.complaints}
            icon={MessageSquareWarning}
            color="bg-orange-500 text-orange-600"
            to="/admin/quejas"
            subtitle="Buzón Estudiantil"
        />
      </div>

      {/* --- SECCIÓN: HORARIO DE GUARDIAS (NUEVO) --- */}
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

      {/* --- SECCIONES ESPECÍFICAS POR ROL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PANEL IZQUIERDO: ACCIONES RÁPIDAS */}
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
                <Link to="/admin/quejas" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-orange-200">
                    <div className="bg-white dark:bg-slate-700 p-3 rounded-lg text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                        <MessageSquareWarning size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Atender Buzón</h4>
                        <p className="text-xs text-gray-500">Revisar reportes recientes</p>
                    </div>
                </Link>
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

        {/* PANEL DERECHO: ESTADO DEL SISTEMA */}
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
                        <p className="text-xs text-gray-500">Enero - Junio 2025</p>
                    </div>
                </div>
                {isConcejal && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">RECORDATORIO</p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                            Revisar las solicitudes de beca antes del cierre de mes.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};