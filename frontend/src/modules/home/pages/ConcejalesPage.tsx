import { useEffect, useState } from 'react';
import { Search, Filter, Mail, User as UserIcon, GraduationCap } from 'lucide-react';
import { getPublicConcejales } from '../../../shared/services/api';
import { CARRERAS } from '../../../shared/constants/carreras';

// Tipo de dato para el frontend
interface Concejal {
  id: number;
  full_name: string;
  email: string;
  role: string;
  area: string;
  career: string;
  imagen_url: string;
}

export const ConcejalesPage = () => {
  const [concejales, setConcejales] = useState<Concejal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [carreraSeleccionada, setCarreraSeleccionada] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await getPublicConcejales();
      setConcejales(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtrado
  const filtrados = concejales.filter(c => {
    const coincideTexto = c.full_name.toLowerCase().includes(busqueda.toLowerCase()) ||
                          c.area.toLowerCase().includes(busqueda.toLowerCase());

    // Si carreraSeleccionada está vacía, muestra todos. Si no, debe coincidir exactamente.
    const coincideCarrera = carreraSeleccionada === '' ? true : c.career === carreraSeleccionada;

    return coincideTexto && coincideCarrera;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">

      {/* Header / Portada pequeña */}
      <div className="bg-guinda-900 text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto relative z-10 text-center">
            <h1 className="text-4xl font-bold mb-4">Directorio de Concejales</h1>
            <p className="text-guinda-100 max-w-2xl mx-auto text-lg">
                Conoce a quienes te representan. Busca a tu concejal de carrera o contacta a las coordinaciones.
            </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">

        {/* BARRA DE FILTROS */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-24 z-20">

            {/* Buscador de Texto */}
            <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o área..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-guinda-500 outline-none transition-all"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* Filtro de Carrera */}
            <div className="relative w-full md:w-96">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                    className="w-full pl-10 pr-8 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-guinda-500 outline-none appearance-none cursor-pointer"
                    value={carreraSeleccionada}
                    onChange={(e) => setCarreraSeleccionada(e.target.value)}
                >
                    <option value="">Todas las Carreras</option>
                    {CARRERAS.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* GRID DE RESULTADOS */}
        {loading ? (
            <div className="text-center py-20 text-gray-500">Cargando directorio...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtrados.map((concejal) => (
                    <div key={concejal.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all group hover:-translate-y-1">

                        {/* Tarjeta Header (Fondo de color según rol) */}
                        <div className={`h-24 ${concejal.role === 'estructura' ? 'bg-gradient-to-r from-guinda-700 to-guinda-900' : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'}`}></div>

                        {/* Foto de Perfil */}
                        <div className="px-6 relative">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-md bg-gray-200 absolute -top-12 overflow-hidden flex items-center justify-center">
                                {concejal.imagen_url ? (
                                    <img src={concejal.imagen_url} alt={concejal.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={40} className="text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Info Body */}
                        <div className="pt-14 px-6 pb-6">
                            <div className="mb-4">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight mb-1">
                                    {concejal.full_name}
                                </h3>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                                    ${concejal.role === 'estructura' ? 'bg-yellow-100 text-yellow-800' : 
                                      concejal.role === 'coordinador' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {concejal.role}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                {/* Área */}
                                <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-guinda-500"></span>
                                    {concejal.area}
                                </div>

                                {/* Carrera (si tiene) */}
                                {concejal.career && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <GraduationCap size={16} />
                                        <span className="truncate" title={concejal.career}>{concejal.career}</span>
                                    </div>
                                )}
                            </div>

                            {/* Botón Contacto */}
                            <a
                                href={`mailto:${concejal.email}`}
                                className="block w-full py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-guinda-50 dark:hover:bg-guinda-900/30 text-gray-700 dark:text-gray-200 hover:text-guinda-700 dark:hover:text-guinda-400 rounded-lg text-sm font-medium text-center transition-colors border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-2"
                            >
                                <Mail size={16} />
                                Contactar
                            </a>
                        </div>
                    </div>
                ))}

                {filtrados.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <UserIcon size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No se encontraron concejales</h3>
                        <p className="text-gray-500">Intenta con otros filtros de búsqueda.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};