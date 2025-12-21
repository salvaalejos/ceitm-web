import { useState, useEffect, useRef } from 'react';
import { Search, FilterX, ChevronDown, Check, LayoutGrid } from 'lucide-react';
import { ConvenioCard } from '../components/ConvenioCard';
import { ConvenioModal } from '../components/ConvenioModal';
import type { Convenio } from '../../../shared/types';
import { getConvenios } from '../../../shared/services/api';
// 👇 Importamos las constantes
import { CATEGORIAS_CONVENIOS } from '../../../shared/constants/convenios';

export const ConveniosPage = () => {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('TODAS'); // 'TODAS' en lugar de 'all' para consistencia

  // UI States
  const [modalOpen, setModalOpen] = useState(false);
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<Convenio | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await getConvenios();
        setConvenios(data);
      } catch (error) {
        console.error("Error conectando al backend:", error);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  // Armamos las opciones para el Dropdown (Agregando "TODAS")
  const opcionesDropdown = [
      { id: 'TODAS', label: 'Todas las categorías', icon: LayoutGrid },
      ...CATEGORIAS_CONVENIOS
  ];

  const selectedLabel = opcionesDropdown.find(c => c.id === categoria)?.label;

  // 🧠 Lógica de Filtrado Corregida
  const conveniosFiltrados = convenios.filter(c => {
    const matchNombre = c.nombre.toLowerCase().includes(busqueda.toLowerCase());

    // Aquí es donde fallaba: Aseguramos que el match sea exacto con el ID centralizado
    const matchCategoria = categoria === 'TODAS' || c.categoria === categoria;

    return matchNombre && matchCategoria;
  });

  const handleVerMas = (c: Convenio) => {
    setConvenioSeleccionado(c);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

        {/* HERO SECTION */}
        <div className="bg-slate-900 text-white py-20 px-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-guinda-900/50 to-slate-900 z-0"></div>
            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            <div className="relative z-10 container mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Convenios <span className="text-guinda-500">Vigentes</span>
                </h1>
                <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                    Aprovecha los descuentos y beneficios exclusivos para la comunidad del CEITM.
                </p>
            </div>
        </div>

        <div className="container mx-auto px-6 -mt-8 relative z-20">

            {/* BARRA DE HERRAMIENTAS */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-gray-100 dark:border-slate-800 mb-10">

                {/* Buscador */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-transparent rounded-xl transition-colors focus-within:bg-gray-50 dark:focus-within:bg-slate-800/50">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar negocio (ej. 'Gym', 'Pizza')..."
                        className="flex-1 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-400"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {/* Dropdown Personalizado */}
                <div className="relative min-w-[260px]" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                            isDropdownOpen 
                                ? 'bg-guinda-50 border-guinda-200 text-guinda-700 dark:bg-guinda-900/20 dark:border-guinda-800 dark:text-guinda-300' 
                                : 'bg-gray-50 border-transparent text-gray-700 dark:bg-slate-800/50 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            {/* Renderizamos el icono dinámicamente */}
                            {(() => {
                                const Icon = opcionesDropdown.find(c => c.id === categoria)?.icon || LayoutGrid;
                                return <Icon size={18} className={isDropdownOpen ? 'text-guinda-600' : 'text-gray-500'} />;
                            })()}
                            <span className="font-medium truncate">{selectedLabel}</span>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-guinda-600' : 'text-gray-400'}`}
                        />
                    </button>

                    {/* Menú Flotante */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                {opcionesDropdown.map(opt => {
                                    const isSelected = categoria === opt.id;
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setCategoria(opt.id); setIsDropdownOpen(false); }}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                                                ${isSelected 
                                                    ? 'bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-guinda-300 font-bold' 
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={18} className={isSelected ? 'text-guinda-600' : 'text-gray-400'} />
                                                <span>{opt.label}</span>
                                            </div>
                                            {isSelected && <Check size={16} className="text-guinda-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón Limpiar */}
                {(busqueda || categoria !== 'TODAS') && (
                    <button
                        onClick={() => { setBusqueda(''); setCategoria('TODAS'); setIsDropdownOpen(false); }}
                        className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors whitespace-nowrap hidden md:block"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {/* 3. GRID */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
                    <LayoutGrid size={48} className="mb-4 opacity-50" />
                    <p>Cargando convenios...</p>
                </div>
            ) : conveniosFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                    {conveniosFiltrados.map(c => (
                        <ConvenioCard key={c.id} convenio={c} onVerMas={handleVerMas} />
                    ))}
                </div>
            ) : (
                /* EMPTY STATE */
                <div className="text-center py-20 flex flex-col items-center animate-fade-in">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <FilterX size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        No encontramos resultados
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        No hay convenios para esta búsqueda.
                    </p>
                    <button
                        onClick={() => { setBusqueda(''); setCategoria('TODAS'); }}
                        className="btn-secondary"
                    >
                        Ver todos
                    </button>
                </div>
            )}
        </div>

        {/* MODAL */}
        {modalOpen && convenioSeleccionado && (
            <ConvenioModal
                convenio={convenioSeleccionado}
                onClose={() => setModalOpen(false)}
            />
        )}
    </div>
  );
};