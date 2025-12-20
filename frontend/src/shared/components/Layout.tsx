import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Shield, MapPin, Mail, Instagram, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { IMAGES } from '../config/constants';

export const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Convenios', path: '/convenios' },
    { name: 'Concejales', path: '/concejales' },
    { name: 'Noticias', path: '/noticias' },
    { name: 'Transparencia', path: '/transparencia' },
    { name: 'Buzón', path: '/buzon' },
    { name: 'Becas', path: '/becas' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans transition-colors duration-300 flex flex-col">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
         <div className="container mx-auto px-6 h-20 flex justify-between items-center">

            {/* 1. LOGO + TEXTO "CEITM" */}
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsMenuOpen(false)}>
                {/* Placeholder del Logo */}
                <div className="w-12 h-12  flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <img src={IMAGES.LOGO} alt="CEITM Logo" className="w-full h-full object-contain drop-shadow-md"/>
                </div>

                <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight group-hover:text-guinda-700 dark:group-hover:text-guinda-400 transition-colors">
                    Consejo Estudiantil del ITM
                </span>
            </Link>

            {/* 2. MENÚ ESCRITORIO (Sin botón Acceder) */}
            <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                ${isActive 
                                    ? 'bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-guinda-300 font-bold' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                                }
                            `}
                        >
                            {link.name}
                        </Link>
                    );
                })}

                {/* Separador y ThemeToggle */}
                <div className="ml-4 pl-4 border-l border-gray-200 dark:border-slate-700 flex items-center">
                    <ThemeToggle />
                </div>
            </div>

            {/* BOTÓN HAMBURGUESA (MÓVIL) */}
            <div className="flex items-center gap-4 lg:hidden">
                <ThemeToggle />
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
         </div>

         {/* MENÚ MÓVIL (Sin botón Acceder) */}
         <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
             <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-xl">
                 <div className="flex flex-col p-4 space-y-2">
                     {navLinks.map((link) => (
                         <Link
                            key={link.path}
                            to={link.path}
                            className={`
                                block px-4 py-3 rounded-xl font-medium transition-colors
                                ${location.pathname === link.path 
                                    ? 'bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-guinda-300' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }
                            `}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.name}
                         </Link>
                     ))}
                 </div>
             </div>
         </div>
      </nav>

      <main className="flex-grow">
          <Outlet />
      </main>

      {/* FOOTER MEJORADO */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pt-12 pb-8 mt-auto">
        <div className="container mx-auto px-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

                {/* Columna 1: Marca y Descripción */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Shield className="text-guinda-600 dark:text-guinda-500" size={24} />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">CEITM</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                        Representación oficial de los estudiantes del Instituto Tecnológico de Morelia.
                        <br/>
                        Trabajando por y para los ponys. 🐴
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                        {/* Redes Sociales (Placeholders) */}
                        <a href="https://whatsapp.com/channel/0029VbBNbfS8kyyRQ2m1Pj2f" className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-guinda-50 hover:text-guinda-600 dark:hover:bg-slate-700 transition-colors">
                            <MessageCircle size={18} />
                        </a>
                        <a href="https://www.instagram.com/ceitm_oficial/" className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-guinda-50 hover:text-guinda-600 dark:hover:bg-slate-700 transition-colors">
                            <Instagram size={18} />
                        </a>
                    </div>
                </div>

                {/* Columna 2: Enlaces Rápidos */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Enlaces</h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link to="/becas" className="text-gray-500 dark:text-gray-400 hover:text-guinda-600 dark:hover:text-guinda-400 transition-colors">Convocatorias de Becas</Link>
                        </li>
                        <li>
                            <Link to="/convenios" className="text-gray-500 dark:text-gray-400 hover:text-guinda-600 dark:hover:text-guinda-400 transition-colors">Descuentos y Convenios</Link>
                        </li>
                        <li>
                            <Link to="/transparencia" className="text-gray-500 dark:text-gray-400 hover:text-guinda-600 dark:hover:text-guinda-400 transition-colors">Portal de Transparencia</Link>
                        </li>
                        <li>
                            <Link to="/buzon" className="text-gray-500 dark:text-gray-400 hover:text-guinda-600 dark:hover:text-guinda-400 transition-colors">Buzón Estudiantil</Link>
                        </li>
                    </ul>
                </div>

                {/* Columna 3: Contacto */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Contacto</h4>
                    <ul className="space-y-4 text-sm">
                        <li className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                            <MapPin size={18} className="text-guinda-600 shrink-0 mt-0.5" />
                            <span>
                                Av. Tecnológico 1500, Lomas de Santiaguito.<br/>
                                Edificio "S1".<br/>
                                Morelia, Mich.
                            </span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                            <Mail size={18} className="text-guinda-600 shrink-0" />
                            <a href="https://www.instagram.com/ceitm_oficial/" className="hover:text-guinda-600 transition-colors">
                                consejo@morelia.tecnm.mx
                            </a>
                        </li>
                    </ul>
                </div>

            </div>

            {/* Barra Inferior */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-400 dark:text-slate-500 text-xs">
                    © {new Date().getFullYear()} Consejo Estudiantil del ITM.
                </p>
                <p className="text-gray-400 dark:text-slate-500 text-xs flex items-center gap-1">
                    Desarrollado con <span className="text-red-500 text-[10px]">❤️</span> por
                    <a href="https://www.instagram.com/comite_isc_itm/" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-500 dark:text-slate-400 hover:text-guinda-600 transition-colors">
                        Cómite de ISC.
                    </a>
                </p>
            </div>
        </div>
      </footer>

    </div>
  );
};