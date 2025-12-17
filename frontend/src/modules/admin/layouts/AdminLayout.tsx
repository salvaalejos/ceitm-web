import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, LogOut, Users } from 'lucide-react';
import { ThemeToggle } from '../../../shared/components/ThemeToggle';

export const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 font-sans">

      {/* SIDEBAR LATERAL */}
      <aside className="w-64 bg-white dark:bg-blue-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-bold text-guinda-600 tracking-tight">CEITM Admin</h2>
                  <p className="text-xs text-gray-500 mt-1">Panel de Control</p>
              </div>
              {/* Aquí el botón pequeñito en el sidebar */}
              <ThemeToggle/>
          </div>

          <nav className="flex-1 p-4 space-y-2">
              <Link to="/admin/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <LayoutDashboard size={20}/>
                  Dashboard
              </Link>
              <Link to="/admin/convenios" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Store size={20} />
                Gestión Convenios
            </Link>
            <Link to="/admin/usuarios" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Users size={20} />
                Equipo / Usuarios
            </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
                <LogOut size={20} />
                Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
          {/* Header Móvil (Solo visible en celular) */}
          <header className="md:hidden bg-white dark:bg-blue-gray-800 p-4 border-b flex justify-between items-center sticky top-0 z-20">
              <span className="font-bold text-guinda-600">CEITM Admin</span>
              <button onClick={handleLogout}><LogOut size={20} className="text-red-600"/></button>
          </header>

          <div className="p-8">
              <Outlet /> {/* Aquí se carga el dashboard o la lista de convenios */}
          </div>
      </main>
    </div>
  );
};