import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FilterX, ChevronDown, LayoutGrid, Check } from 'lucide-react';
import { getNews } from '../../../shared/services/api';
import { NewsCard } from '../components/NewsCard';
import { COORDINACIONES } from '../../../shared/constants/coordinaciones';

export const NoticiasPage = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'TODAS';

  // 2. Estado para el Dropdown Personalizado
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Opciones para el Select
  const categoryOptions = [
      { id: 'TODAS', label: 'Todas las Categorías', icon: null },
      { id: 'GENERAL', label: 'General / Institucional', icon: '📢' },
      ...COORDINACIONES
          .filter(c => c.type === 'operativa')
          .map(c => ({ id: c.id, label: c.label, icon: '🔹' })) // Puedes usar c.icon si quisieras renderizar el componente Lucide
  ];

  // Label de la categoría seleccionada para mostrar en el botón
  const selectedOptionLabel = categoryOptions.find(c => c.id === currentCategory)?.label || 'Seleccionar Categoría';

  // EFECTO: Cargar noticias
  useEffect(() => {
    const fetchNews = async () => {
        setLoading(true);
        try {
            const data = await getNews(currentCategory === 'TODAS' ? undefined : currentCategory);
            setNews(data);
        } catch (error) {
            console.error("Error cargando noticias", error);
        } finally {
            setLoading(false);
        }
    };
    fetchNews();
  }, [currentCategory]);

  // Manejador de selección
  const handleSelectCategory = (categoryId: string) => {
      if (categoryId === 'TODAS') {
          setSearchParams({});
      } else {
          setSearchParams({ category: categoryId });
      }
      setSearchTerm('');
      setIsDropdownOpen(false); // Cerramos el menú
  };

  // FILTRO FINAL
  const filteredNews = news.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
          item.title.toLowerCase().includes(term) ||
          item.excerpt.toLowerCase().includes(term)
      );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

        {/* HERO SECTION */}
        <div className="bg-slate-900 text-white py-20 px-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-guinda-900/50 to-slate-900 z-0"></div>
            <div className="relative z-10 container mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Noticias y <span className="text-guinda-500">Avisos</span>
                </h1>
                <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                    Mantente al día con lo que sucede en el Tec. Eventos, convocatorias y comunicados oficiales.
                </p>
            </div>
        </div>

        <div className="container mx-auto px-6 -mt-8 relative z-20">

            {/* 🔽 BARRA DE HERRAMIENTAS */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-gray-100 dark:border-slate-800 mb-10">

                {/* 1. INPUT DE BÚSQUEDA */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-transparent rounded-xl transition-colors focus-within:bg-gray-50 dark:focus-within:bg-slate-800/50">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar noticia (ej. 'Pony Emprende')..."
                        className="flex-1 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* 2. DROPDOWN PERSONALIZADO */}
                <div className="relative min-w-[280px]" ref={dropdownRef}>

                    {/* Botón Trigger */}
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                            isDropdownOpen 
                                ? 'bg-guinda-50 border-guinda-200 text-guinda-700 dark:bg-guinda-900/20 dark:border-guinda-800 dark:text-guinda-300' 
                                : 'bg-gray-50 border-transparent text-gray-700 dark:bg-slate-800/50 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <LayoutGrid size={18} className={isDropdownOpen ? 'text-guinda-600' : 'text-gray-500'} />
                            <span className="font-medium truncate">{selectedOptionLabel}</span>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-guinda-600' : 'text-gray-400'}`}
                        />
                    </button>

                    {/* Menú Desplegable */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                {categoryOptions.map(opt => {
                                    const isSelected = currentCategory === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSelectCategory(opt.id)}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                                                ${isSelected 
                                                    ? 'bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-guinda-300 font-bold' 
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Icono opcional */}
                                                <span className="w-5 text-center">{opt.icon}</span>
                                                <span>{opt.label.replace(/🔹|📢/g, '')}</span>
                                            </div>

                                            {isSelected && <Check size={16} className="text-guinda-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTÓN LIMPIAR */}
                {(searchTerm || currentCategory !== 'TODAS') && (
                    <button
                        onClick={() => { setSearchParams({}); setSearchTerm(''); setIsDropdownOpen(false); }}
                        className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors whitespace-nowrap hidden md:block"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {/* GRID DE NOTICIAS */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-96 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredNews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                    {filteredNews.map(item => (
                        <NewsCard key={item.id} news={item} />
                    ))}
                </div>
            ) : (
                /* EMPTY STATE */
                <div className="text-center py-20 flex flex-col items-center animate-fade-in">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <FilterX size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        No encontramos noticias
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        No hay resultados para tu búsqueda.
                    </p>
                    <button
                        onClick={() => { setSearchParams({}); setSearchTerm(''); }}
                        className="btn-secondary"
                    >
                        Ver todas las noticias
                    </button>
                </div>
            )}

        </div>
    </div>
  );
};