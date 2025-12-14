import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { ConvenioCard } from '../components/ConvenioCard';
import { ConvenioModal } from '../components/ConvenioModal'; // Asegúrate que la ruta al componente sea correcta
import type { Convenio } from '../../../shared/types';
import { getConvenios } from '../../../shared/services/api';

export const ConveniosPage = () => {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Filtros y UI
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<Convenio | null>(null);

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

  const conveniosFiltrados = convenios.filter(c => {
    const matchNombre = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoria === 'all' || c.categoria === categoria;
    return matchNombre && matchCategoria;
  });

  const handleVerMas = (c: Convenio) => {
    setConvenioSeleccionado(c);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto px-6 py-12 animate-fade-in">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-guinda-600 dark:text-guinda-400 mb-4">
                Convenios Vigentes
            </h1>
            <p className="text-lg text-blue-gray-600 dark:text-blue-gray-300 max-w-2xl mx-auto">
                Beneficios exclusivos para la comunidad del CEITM.
            </p>
        </header>

        {/* BARRA DE FILTROS */}
        {/* CAMBIO: Fondo oscuro, borde oscuro */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 sticky top-24 z-30 bg-blue-gray-50/95 dark:bg-gray-900/95 p-4 rounded-xl backdrop-blur-sm shadow-sm border border-blue-gray-200 dark:border-gray-700 transition-colors duration-300">

            {/* Buscador */}
            <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-gray-400 dark:text-gray-500" size={20} />
                {/* CAMBIO: Input con fondo oscuro y texto claro */}
                <input
                    type="text"
                    placeholder="Buscar negocio..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-blue-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-guinda-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* Filtro */}
            <div className="relative w-full md:w-64">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-gray-400 dark:text-gray-500" size={20} />
                {/* CAMBIO: Select con fondo oscuro y texto claro */}
                <select
                    className="w-full pl-10 pr-8 py-3 rounded-lg border border-blue-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-guinda-500 outline-none appearance-none cursor-pointer transition-all"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                >
                    <option value="all">Todas las categorías</option>
                    <option value="Salud">Salud</option>
                    <option value="Comida">Comida</option>
                    <option value="Electrónica">Electrónica</option>
                    <option value="Educación">Educación</option>
                    <option value="Entretenimiento">Entretenimiento</option>
                </select>
            </div>
        </div>

        {/* GRID */}
        {loading ? (
            <div className="text-center py-20">Cargando...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {conveniosFiltrados.map(c => (
                    <ConvenioCard key={c.id} convenio={c} onVerMas={handleVerMas} />
                ))}
            </div>
        )}

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