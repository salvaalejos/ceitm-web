import { useEffect, useState, useRef } from 'react';
import { Users, Search, MessageCircle, Instagram, Mail, ChevronDown, Check, ExternalLink, Clock } from 'lucide-react';
import { getConcejalesPublic, getCareers, getShifts } from '../../../shared/services/api';
import type { Career, Shift, User } from '../../../shared/types';
import { ScheduleModal } from '../components/ScheduleModal'; // <--- Importamos el modal

export const ConcejalesPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]); // <--- Estado para los horarios
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');

  // Estados UI
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedConcejal, setSelectedConcejal] = useState<User | null>(null); // <--- Control del modal
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carga de Datos (Usuarios + Carreras + Horarios)
  useEffect(() => {
    const loadData = async () => {
        try {
            const [usersData, careersData, shiftsData] = await Promise.all([
                getConcejalesPublic(),
                getCareers(),
                getShifts() // <--- Cargamos los shifts de la BD
            ]);

            const visibleUsers = usersData.filter((u: any) => u.role !== 'admin_sys');
            setUsers(visibleUsers);
            setCareers(careersData);
            setAllShifts(shiftsData);

        } catch (error) {
            console.error("Error cargando datos", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // Lógica para procesar el horario del concejal seleccionado para el modal
  const getUserSchedule = (userId: number): [string, number[]][] => {
    const userShifts = allShifts.filter(s => s.user_id === userId);
    const schedule: Record<string, number[]> = {};

    userShifts.forEach(s => {
        if (!schedule[s.day]) schedule[s.day] = [];
        schedule[s.day].push(s.hour);
    });

    return Object.entries(schedule).sort((a, b) => {
        const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        return order.indexOf(a[0]) - order.indexOf(b[0]);
    }) as [string, number[]][];
  };

  // Lógica de filtrado
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.area && u.area.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCareer = selectedCareer === '' || u.career === selectedCareer;

    return matchesSearch && matchesCareer;
  });

  const handleSelectCareer = (careerName: string) => {
      setSelectedCareer(careerName);
      setIsDropdownOpen(false);
  };

  const clearFilters = () => {
      setSearchTerm('');
      setSelectedCareer('');
      setIsDropdownOpen(false);
  };

  const activeCareerObj = careers.find(c => c.name === selectedCareer);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-guinda-900/40 to-slate-900 z-0"></div>
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

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
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-gray-100 dark:border-slate-800 mb-8">

            {/* 1. Buscador */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-transparent rounded-xl transition-colors focus-within:bg-gray-50 dark:focus-within:bg-slate-800/50">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o área..."
                    className="flex-1 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* 2. Selector de Carrera (Dinámico desde BD) */}
            <div className="relative min-w-[280px]" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isDropdownOpen 
                            ? 'bg-guinda-50 border-guinda-200 text-guinda-700 dark:bg-guinda-900/20 dark:border-guinda-800 dark:text-guinda-300' 
                            : 'bg-gray-50 border-transparent text-gray-700 dark:bg-slate-800/50 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <div className="flex items-center gap-2 truncate">
                        <Users size={18} className={isDropdownOpen ? 'text-guinda-600' : 'text-gray-500'} />
                        <span className="font-medium truncate">
                            {selectedCareer || 'Todas las Carreras'}
                        </span>
                    </div>
                    <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-guinda-600' : 'text-gray-400'}`}
                    />
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            <button
                                onClick={() => handleSelectCareer('')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left mb-1 ${selectedCareer === '' ? 'bg-guinda-50 text-guinda-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <span>Todas las Carreras</span>
                                {selectedCareer === '' && <Check size={16} className="text-guinda-600" />}
                            </button>

                            {careers.map(c => {
                                const isSelected = selectedCareer === c.name;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelectCareer(c.name)}
                                        className={`
                                            w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                                            ${isSelected 
                                                ? 'bg-guinda-50 text-guinda-700 dark:bg-guinda-900/20 dark:text-guinda-300 font-bold' 
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        <span className="truncate">{c.name}</span>
                                        {isSelected && <Check size={16} className="text-guinda-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {(searchTerm || selectedCareer) && (
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors whitespace-nowrap hidden md:block"
                >
                    Limpiar
                </button>
            )}
        </div>

        {/* Banner de WhatsApp */}
        {selectedCareer && activeCareerObj?.whatsapp_url && (
            <div className="max-w-4xl mx-auto mb-10 animate-fade-in-up">
                <a
                    href={activeCareerObj.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex items-center justify-between p-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl shadow-lg shadow-green-500/20 transition-all hover:-translate-y-1"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-full">
                            <MessageCircle size={28} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Comunidad Oficial de {selectedCareer}</h3>
                            <p className="text-green-50 text-sm opacity-90">Únete al grupo de WhatsApp para avisos importantes.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                        Unirme ahora
                        <ExternalLink size={16} />
                    </div>
                </a>
            </div>
        )}

        {/* RESULTADOS */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 animate-pulse">
                <Users size={48} className="mb-4 opacity-50" />
                <p>Cargando equipo...</p>
            </div>
        ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
                <p className="text-lg">No encontramos representantes con esos filtros.</p>
                <button onClick={clearFilters} className="text-guinda-600 hover:underline mt-2">
                    Ver todos
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10 animate-fade-in">
                {filteredUsers.map(user => (
                    <div key={user.id} className="card-base group hover:-translate-y-2 transition-all duration-300 overflow-visible">
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

                        <div className="px-6 pb-8 text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-guinda-600 transition-colors">
                                {user.full_name}
                            </h3>

                            <div className="flex flex-col gap-2 mb-4">
                                <span className="text-sm font-bold text-guinda-600 dark:text-guinda-400 uppercase tracking-wide">
                                    {user.area === 'Ninguna' ? user.role : user.area}
                                </span>
                                {user.career && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium bg-gray-100 dark:bg-slate-800 py-1 px-3 rounded-full mx-auto w-fit">
                                        {user.career}
                                    </span>
                                )}
                            </div>

                            {/* Botón "¿Cómo encontrarlo?" para abrir el modal */}
                            <button
                                onClick={() => setSelectedConcejal(user)}
                                className="mb-4 w-full py-2 px-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-guinda-50 dark:hover:bg-guinda-900/20 hover:text-guinda-600 transition-all border border-transparent hover:border-guinda-100"
                            >
                                <Clock size={14} /> ¿Cuándo encontrarlo?
                            </button>

                            <div className="flex justify-center gap-3 mt-4 pt-6 border-t border-gray-100 dark:border-slate-800">
                                {user.phone_number && (
                                    <a
                                        href={`https://wa.me/52${user.phone_number.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full hover:bg-green-500 hover:text-white transition-all hover:scale-110 shadow-sm"
                                        title="WhatsApp Personal"
                                    >
                                        <MessageCircle size={18} />
                                    </a>
                                )}
                                {user.instagram_url && (
                                    <a
                                        href={user.instagram_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 flex items-center justify-center bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 rounded-full hover:bg-pink-500 hover:text-white transition-all hover:scale-110 shadow-sm"
                                    >
                                        <Instagram size={18} />
                                    </a>
                                )}
                                <a
                                    href={`mailto:${user.email}`}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full hover:bg-blue-600 hover:text-white transition-all hover:scale-110 shadow-sm"
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

      {/* Modal de Horario */}
      {selectedConcejal && (
        <ScheduleModal
            isOpen={!!selectedConcejal}
            onClose={() => setSelectedConcejal(null)}
            concejalName={selectedConcejal.full_name}
            schedule={getUserSchedule(selectedConcejal.id)}
        />
      )}
    </div>
  );
};