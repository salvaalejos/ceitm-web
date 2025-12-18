import { Link, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // Iconos para menú móvil si lo necesitas
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-blue-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">

      {/* CAMBIO AQUÍ: Agregué 'dark:bg-gray-900/90' y 'dark:border-gray-700' */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-blue-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
         <div className="container mx-auto px-6 py-4 flex justify-between items-center">

            <Link to="/" className="text-2xl font-bold text-guinda-600 tracking-tight hover:text-guinda-700 transition-colors">
                CEITM Platform
            </Link>

            <div className="hidden md:flex items-center space-x-8">
                {/* CAMBIO AQUÍ: Textos adaptables */}
                <Link to="/convenios" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600 dark:hover:text-guinda-400 font-medium transition-colors">
                    Convenios
                </Link>
                <Link to="/concejales" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600 dark:hover:text-guinda-400 font-medium transition-colors">
                    Concejales
                </Link>
                <Link to="/noticias" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600 dark:hover:text-guinda-400 font-medium transition-colors">
                    Noticias
                </Link>
                <Link to="/transparencia" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600 dark:hover:text-guinda-400 font-medium transition-colors">
                    Transparencia
                </Link>

                {/* Borde del separador del toggle */}
                <div className="border-l pl-4 border-gray-200 dark:border-gray-700">
                    <ThemeToggle />
                </div>
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-blue-gray-600 dark:text-gray-300">
                {isMenuOpen ? <X /> : <Menu />}
            </button>
         </div>

         {/* Menú Móvil - Fondo y bordes oscuros */}
         {isMenuOpen && (
             <div className="md:hidden bg-white dark:bg-gray-800 border-b border-blue-gray-200 dark:border-gray-700">
                 <div className="flex flex-col p-4 space-y-4">
                     <Link to="/convenios" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600" onClick={() => setIsMenuOpen(false)}>Convenios</Link>
                     <Link to="/concejales" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600" onClick={() => setIsMenuOpen(false)}>Concejales</Link>
                     <Link to="/noticias" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600" onClick={() => setIsMenuOpen(false)}>Noticias</Link>
                     <Link to="/transparencia" className="text-blue-gray-600 dark:text-gray-300 hover:text-guinda-600" onClick={() => setIsMenuOpen(false)}>Transparencia</Link>
                     <div className="flex justify-between items-center">
                         <span className="text-blue-gray-400 dark:text-gray-500">Tema</span>
                         <ThemeToggle />
                     </div>
                 </div>
             </div>
         )}
      </nav>

      <main>
          <Outlet />
      </main>

    </div>
  );
};