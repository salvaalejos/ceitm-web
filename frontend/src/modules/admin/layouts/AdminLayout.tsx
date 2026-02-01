import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, X, Sun, Moon, LogOut,
    LayoutDashboard, Newspaper, Store, Users, FolderOpen, GraduationCap, Inbox, Activity, BookOpen, MapPin // <--- IMPORTAMOS MapPin
} from 'lucide-react';
import { useAuthStore } from '../../../shared/store/authStore';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { IMAGES } from "../../../shared/config/constants";

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  // 👇 Usamos el hook para TODOS los permisos (incluido el mapa)
  const {
    canManageUsers,
    canManageNoticias,
    canManageConvenios,
    canReviewBecas,
    canManageMap // <--- Ahora viene del hook
  } = usePermissions();

  // Sincronizar tema al cargar
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
        setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        setIsDark(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        setIsDark(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Clases para links activos vs inactivos
  const getLinkClass = (path: string) => {
    const isActive = path === '/admin'
        ? location.pathname === '/admin'
        : location.pathname.startsWith(path);

    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group";

    if (isActive) {
        return `${baseClass} bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-guinda-400 border border-guinda-100 dark:border-guinda-900/50`;
    }
    return `${baseClass} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300">

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">

            {/* HEADER DEL SIDEBAR */}
            <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center">
                        <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-cover"/>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                        CEITM <span className="text-guinda-600 dark:text-guinda-500">Admin</span>
                        </h1>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            Panel de Control
                        </span>
                    </div>
                </div>
                <button className="lg:hidden ml-auto text-gray-500" onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                </button>
            </div>

            {/* NAV LINKS */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">

                {/* DASHBOARD */}
                <Link to="/admin" className={getLinkClass('/admin')}>
                    <LayoutDashboard size={20} />
                    Dashboard
                </Link>

                <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Gestión
                </div>

                {/* NOTICIAS */}
                {canManageNoticias && (
                    <Link to="/admin/noticias" className={getLinkClass('/admin/noticias')}>
                        <Newspaper size={20} />
                        Noticias y Avisos
                    </Link>
                )}

                {/* BUZÓN (Público para todos los admins) */}
                <Link to="/admin/quejas" className={getLinkClass('/admin/quejas')}>
                    <Inbox size={20} />
                    <span>Buzón</span>
                </Link>

                <Link to="/admin/carreras" className={getLinkClass('/admin/carreras')}>
                    <BookOpen size={20} />
                    <span>Carreras</span>
                </Link>

                {/* CONVENIOS */}
                {canManageConvenios && (
                    <Link to="/admin/convenios" className={getLinkClass('/admin/convenios')}>
                        <Store size={20} />
                        Convenios
                    </Link>
                )}

                {/* BECAS */}
                {canReviewBecas && (
                    <Link to="/admin/becas" className={getLinkClass('/admin/becas')}>
                        <GraduationCap size={20} />
                        Gestión Becas
                    </Link>
                )}

                {/* MAPA (Controlado por Hook) */}
                {canManageMap && (
                    <Link to="/admin/mapa" className={getLinkClass('/admin/mapa')}>
                        <MapPin size={20} />
                        Gestión Mapa
                    </Link>
                )}

                {/* DOCUMENTOS */}
                <Link to="/admin/documentos" className={getLinkClass('/admin/documentos')}>
                    <FolderOpen size={20} />
                    Repositorio / Docs
                </Link>

                {/* SECCIÓN SISTEMA (Solo Admin) */}
                {canManageUsers && (
                    <>
                        <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Sistema
                        </div>

                        <Link to="/admin/usuarios" className={getLinkClass('/admin/usuarios')}>
                            <Users size={20} />
                            Usuarios
                        </Link>
                        <Link to="/admin/auditoria" className={getLinkClass('/admin/auditoria')}>
                            <Activity size={20} />
                            Auditoría
                        </Link>
                    </>
                )}

            </nav>

            {/* FOOTER SIDEBAR */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                <Link
                    to="/admin/perfil"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                    <div className="w-10 h-10 rounded-full bg-guinda-100 dark:bg-guinda-900 flex items-center justify-center text-guinda-700 dark:text-guinda-400 font-bold text-xs overflow-hidden border border-gray-200 dark:border-slate-700">
                        {user?.imagen_url ? (
                            <img src={user.imagen_url} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            user?.full_name?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-guinda-600 transition-colors">
                            {user?.full_name?.split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate capitalize">
                            {user?.role?.replace('_', ' ')}
                        </p>
                    </div>
                </Link>
            </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30 px-6 flex items-center justify-between">
            <button className="lg:hidden p-2 text-gray-600 dark:text-gray-300" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
            </button>
            <div className="hidden md:block text-sm text-gray-400"></div>

            <div className="flex items-center gap-4 ml-auto">
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 mx-2"></div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Salir</span>
                </button>
            </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
            <Outlet />
        </main>
      </div>

      {isSidebarOpen && (
        <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};