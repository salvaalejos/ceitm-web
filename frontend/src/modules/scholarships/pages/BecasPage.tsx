import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, Calendar, Clock, ChevronRight,
    AlertCircle, FileText, Info, Search
} from 'lucide-react';
import { getScholarships } from '../../../shared/services/api';
import type { Scholarship } from '../../../shared/types';

export const BecasPage = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      try {
          const becasData = await getScholarships();
          setScholarships(becasData);
      } catch (error) {
          console.error("Error cargando becas", error);
      } finally {
          setLoading(false);
      }
  };

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-MX', {
          day: 'numeric', month: 'long', year: 'numeric'
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white py-16 px-6 text-center relative overflow-hidden">
        {/* Fondo con gradiente sutil */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-guinda-900/40 to-slate-900 z-0"></div>

        <div className="relative z-10 container mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
                <GraduationCap size={48} className="text-yellow-400" /> Becas y Apoyos
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
                Consulta las convocatorias vigentes para el ciclo escolar. <br/>
                Trámite digital, gratuito y sin intermediarios.
            </p>

            {/* --- BOTÓN DE CONSULTA DE RESULTADOS --- */}
            <div className="flex justify-center">
                <button
                    onClick={() => navigate('/becas/resultados')}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-3 shadow-lg hover:shadow-white/10 group"
                >
                    <Search size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span>Consultar Resultados</span>
                </button>
            </div>
        </div>
      </div>

      {/* LISTA DE BECAS */}
      <div className="container mx-auto px-6 -mt-8 relative z-20 max-w-5xl">

        {loading ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">Cargando convocatorias...</div>
        ) : scholarships.length === 0 ? (
            <div className="card-base p-16 text-center text-gray-500 dark:text-gray-400 shadow-xl">
                <GraduationCap size={64} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No hay convocatorias activas</h3>
                <p>Mantente al pendiente de nuestras redes sociales para nuevos avisos.</p>
            </div>
        ) : (
            <div className="grid gap-8">
                {scholarships.map(beca => {
                    const now = new Date();
                    const endDate = new Date(beca.end_date);
                    const isActiveDate = now <= endDate && beca.is_active;

                    return (
                        <div key={beca.id} className="card-base p-0 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">

                            <div className="flex flex-col md:flex-row">
                                {/* Lateral de Color Indicativo */}
                                <div className={`md:w-2 bg-gradient-to-b ${isActiveDate ? 'from-guinda-500 to-guinda-700' : 'from-gray-400 to-gray-600'}`}></div>

                                <div className="p-8 flex-1">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold uppercase rounded-full">
                                                    {beca.type}
                                                </span>
                                                <span className="text-sm text-gray-400 font-medium flex items-center gap-1">
                                                    <Info size={14} /> Ciclo {beca.cycle}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-guinda-600 dark:group-hover:text-guinda-400 transition-colors">
                                                {beca.name}
                                            </h3>
                                        </div>

                                        {/* Estatus Visual */}
                                        <div className="shrink-0">
                                            {isActiveDate ? (
                                                <div className="text-right">
                                                    <span className="block text-green-600 dark:text-green-400 font-bold text-sm uppercase tracking-wide">Convocatoria Abierta</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
                                                        <Clock size={12} /> Cierra: {formatDate(beca.end_date)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                                    <AlertCircle size={20} /> Cerrada
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                        {beca.description}
                                    </p>

                                    <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-6 gap-4">
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col md:flex-row gap-4">
                                            <span className="flex items-center gap-2">
                                                <Calendar size={16} className="text-guinda-600 dark:text-guinda-400" />
                                                <strong>Resultados:</strong> {formatDate(beca.results_date)}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                                                <strong>Requisito:</strong> Digital (PDF/Img)
                                            </span>
                                        </div>

                                        {isActiveDate ? (
                                            <button
                                                onClick={() => navigate(`/becas/aplicar/${beca.id}`)}
                                                className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 py-3 px-8 text-lg shadow-lg hover:shadow-guinda-500/20"
                                            >
                                                Iniciar Trámite <ChevronRight size={20} />
                                            </button>
                                        ) : (
                                            <button disabled className="btn-secondary w-full md:w-auto opacity-50 cursor-not-allowed">
                                                Convocatoria Finalizada
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};