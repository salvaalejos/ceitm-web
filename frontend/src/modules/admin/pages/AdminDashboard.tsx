import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, FileText, Newspaper, Store,
    Plus, ArrowRight, Activity
} from 'lucide-react';
import { useAuthStore } from '../../../shared/store/authStore';
import { getConvenios, getNews, getAllDocuments, getUsers } from '../../../shared/services/api';

export const AdminDashboard = () => {
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    convenios: 0,
    noticias: 0,
    documentos: 0,
    usuarios: 0
  });

  useEffect(() => {
    const loadStats = async () => {
        try {
            const [conv, news, docs, users] = await Promise.all([
                getConvenios().catch(() => []),
                getNews().catch(() => []),
                getAllDocuments().catch(() => []),
                getUsers().catch(() => [])
            ]);

            setStats({
                convenios: conv.length,
                noticias: news.length,
                documentos: docs.length,
                usuarios: users.length
            });
        } catch (error) {
            console.error("Error cargando estadísticas", error);
        } finally {
            setLoading(false);
        }
    };
    loadStats();
  }, []);

  // Tarjeta de Estadística Reutilizable
  const StatCard = ({ title, count, icon: Icon, color, to }: any) => (
    <Link to={to} className="card-base p-6 hover:-translate-y-1 transition-transform cursor-pointer group relative overflow-hidden flex flex-col justify-between h-32">
        <div className={`absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={100} />
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${color} bg-opacity-10 text-current`}>
            <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white leading-none mb-1">
                {loading ? '-' : count}
            </h3>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {title}
            </p>
        </div>
    </Link>
  );

  return (
    <div className="animate-fade-in space-y-8">

        {/* HEADER DE BIENVENIDA (DISEÑO MEJORADO) */}
        <div className="relative rounded-3xl p-8 overflow-hidden shadow-lg">
            {/* Fondo con degradado: Más vibrante en light mode, más profundo en dark mode */}
            <div className="absolute inset-0 bg-gradient-to-r from-guinda-600 to-red-500 dark:from-guinda-900 dark:to-slate-900"></div>

            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-10 w-40 h-40 bg-black opacity-10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    ¡Hola, {user?.full_name?.split(' ')[0] || 'Colega'}! 👋
                </h1>
                <p className="text-guinda-50 dark:text-gray-300 max-w-xl text-lg opacity-90">
                    Bienvenido al panel de administración del CEITM. Aquí tienes el resumen de hoy.
                </p>
            </div>
        </div>

        {/* GRID DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Convenios"
                count={stats.convenios}
                icon={Store}
                color="text-blue-600 bg-blue-600"
                to="/admin/convenios"
            />
            <StatCard
                title="Noticias"
                count={stats.noticias}
                icon={Newspaper}
                color="text-purple-600 bg-purple-600"
                to="/admin/noticias"
            />
            <StatCard
                title="Documentos"
                count={stats.documentos}
                icon={FileText}
                color="text-amber-500 bg-amber-500"
                to="/admin/documentos"
            />
            <StatCard
                title="Usuarios"
                count={stats.usuarios}
                icon={Users}
                color="text-emerald-500 bg-emerald-500"
                to="/admin/usuarios"
            />
        </div>

        {/* SECCIÓN DE ACCESOS RÁPIDOS */}
        <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 px-1">
                <Activity size={20} className="text-guinda-600" /> Accesos Rápidos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Botón Rápido: Noticia */}
                <Link to="/admin/noticias" className="card-base p-5 hover:border-guinda-500/50 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-guinda-50 dark:bg-guinda-900/20 rounded-xl text-guinda-600 shrink-0">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-guinda-600 transition-colors">Nueva Noticia</h3>
                        <p className="text-xs text-gray-500">Publicar aviso o video</p>
                    </div>
                    <ArrowRight className="ml-auto text-gray-300 group-hover:text-guinda-600 transition-colors" size={18} />
                </Link>

                {/* Botón Rápido: Convenio */}
                <Link to="/admin/convenios" className="card-base p-5 hover:border-blue-500/50 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 shrink-0">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Nuevo Convenio</h3>
                        <p className="text-xs text-gray-500">Registrar aliado</p>
                    </div>
                    <ArrowRight className="ml-auto text-gray-300 group-hover:text-blue-600 transition-colors" size={18} />
                </Link>

                {/* Botón Rápido: Documento */}
                <Link to="/admin/documentos" className="card-base p-5 hover:border-amber-500/50 transition-all group flex items-center gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 shrink-0">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">Subir PDF</h3>
                        <p className="text-xs text-gray-500">Actas o Transparencia</p>
                    </div>
                    <ArrowRight className="ml-auto text-gray-300 group-hover:text-amber-600 transition-colors" size={18} />
                </Link>

            </div>
        </div>
    </div>
  );
};