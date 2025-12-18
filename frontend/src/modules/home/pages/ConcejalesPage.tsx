import { useEffect, useState } from 'react';
import { Users, Search, MessageCircle, Instagram, Mail, ChevronDown } from 'lucide-react';
// IMPORTAMOS LA NUEVA FUNCIÓN
import { getConcejalesPublic } from '../../../shared/services/api';
import { CARRERAS } from '../../../shared/constants/carreras';

export const ConcejalesPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');

  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Usamos la ruta pública (Backend ya filtra activos)
            const data = await getConcejalesPublic();

            // 2. Opcional: Si quieres ocultar al 'admin_sys' de la vista pública:
            const visibleUsers = data.filter((u: any) => u.role !== 'admin_sys');

            setUsers(visibleUsers);
        } catch (error) {
            console.error("Error cargando equipo", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // Lógica de filtrado en frontend (Búsqueda y Carrera)
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.area && u.area.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCareer = selectedCareer === '' || u.career === selectedCareer;

    return matchesSearch && matchesCareer;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-guinda-900/40 to-slate-900 z-0"></div>
        <div className="relative z-10 container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Conoce a tus <span className="text-guinda-500">Representantes</span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                Tu enlace directo con la institución. Encuentra a tu concejal por carrera o área.
            </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-20">

        {/* BARRA DE FILTROS */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row gap-3 border border-gray-100 dark:border-slate-800">

            {/* Buscador */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors focus-within:border-guinda-500 focus-within:ring-1 focus-within:ring-guinda-500/20">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o área..."
                    className="flex-1 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Selector de Carrera */}
            <div className="relative min-w-[250px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none">
                   <Users size={18} />
                </div>
                <select
                    value={selectedCareer}
                    onChange={(e) => setSelectedCareer(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-slate-800/50 text-gray-700 dark:text-white py-3 pl-11 pr-10 rounded-xl border border-gray-200 dark:border-slate-700 outline-none cursor-pointer hover:border-guinda-500 transition-colors focus:border-guinda-500"
                >
                    <option value="">Todas las Carreras</option>
                    {CARRERAS.map(c => (
                        <option key={c.id} value={c.nombre}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            {/* Botón Limpiar */}
            {(searchTerm || selectedCareer) && (
                <button
                    onClick={() => { setSearchTerm(''); setSelectedCareer(''); }}
                    className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
                >
                    Limpiar
                </button>
            )}
        </div>

        {/* RESULTADOS */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 animate-pulse">
                <Users size={48} className="mb-4 opacity-50" />
                <p>Cargando equipo...</p>
            </div>
        ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
                <p className="text-lg">No encontramos representantes con esos filtros.</p>
                <button onClick={() => { setSearchTerm(''); setSelectedCareer(''); }} className="text-guinda-600 hover:underline mt-2">
                    Ver todos
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                {filteredUsers.map(user => (
                    <div key={user.id} className="card-base group hover:-translate-y-2 transition-all duration-300 overflow-visible">

                        {/* PORTADA Y FOTO */}
                        <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-800/50 rounded-t-2xl relative mb-12">
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                <div className="p-1 bg-white dark:bg-slate-900 rounded-full shadow-lg">
                                    <img
                                        src={user.imagen_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=800020&color=fff&size=128`}
                                        alt={user.full_name}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* INFO */}
                        <div className="px-6 pb-8 text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-guinda-600 transition-colors">
                                {user.full_name}
                            </h3>

                            <div className="flex flex-col gap-2 mb-4">
                                <span className="text-sm font-bold text-guinda-600 dark:text-guinda-400 uppercase tracking-wide">
                                    {/* Aquí mostramos el rol de forma amigable */}
                                    {user.area === 'Ninguna' ? user.role : user.area}
                                </span>
                                {user.career && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium bg-gray-100 dark:bg-slate-800 py-1 px-3 rounded-full mx-auto w-fit">
                                        {user.career}
                                    </span>
                                )}
                            </div>

                            {/* BOTONES DE CONTACTO */}
                            <div className="flex justify-center gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">

                                {/* WhatsApp: Limpiamos el número para que solo queden dígitos */}
                                {user.phone_number && (
                                    <a
                                        href={`https://wa.me/52${user.phone_number.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full hover:bg-green-500 hover:text-white transition-all hover:scale-110 shadow-sm"
                                        title="WhatsApp"
                                    >
                                        <MessageCircle size={18} />
                                    </a>
                                )}

                                {/* Instagram */}
                                {user.instagram_url && (
                                    <a
                                        href={user.instagram_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 flex items-center justify-center bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 rounded-full hover:bg-pink-500 hover:text-white transition-all hover:scale-110 shadow-sm"
                                        title="Instagram"
                                    >
                                        <Instagram size={18} />
                                    </a>
                                )}

                                {/* Correo (Siempre visible si hay email) */}
                                <a
                                    href={`mailto:${user.email}`}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full hover:bg-blue-600 hover:text-white transition-all hover:scale-110 shadow-sm"
                                    title="Correo Institucional"
                                >
                                    <Mail size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};