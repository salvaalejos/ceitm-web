import { useEffect, useState, useMemo } from 'react';
import { FileText, Download, Shield, Book, Search, Calendar, Filter, X } from 'lucide-react';
import { getPublicDocuments } from '../../../shared/services/api';

export const TransparenciaPage = () => {
  const [activeTab, setActiveTab] = useState<'repositorio' | 'estatutos'>('repositorio');
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS DE FILTRO
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedYear, setSelectedYear] = useState('Todos');

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const data = await getPublicDocuments();
        setDocs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadDocs();
  }, []);

  // --- LÓGICA DE FILTRADO INTELIGENTE ---

  // 1. Obtener listas únicas para los dropdowns
  const availableCategories = useMemo(() =>
    ['Todas', ...new Set(docs.map(d => d.category))],
  [docs]);

  const availableYears = useMemo(() =>
    ['Todos', ...new Set(docs.map(d => new Date(d.created_at).getFullYear().toString()))],
  [docs]);

  // 2. Filtrar documentos
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || doc.category === selectedCategory;

    const matchesYear = selectedYear === 'Todos' ||
                        new Date(doc.created_at).getFullYear().toString() === selectedYear;

    return matchesSearch && matchesCategory && matchesYear;
  });

  // 3. Agrupar el resultado filtrado para mostrarlo con encabezados
  // Si hay un filtro de categoría activo, solo mostramos esa categoría.
  const categoriesToShow = selectedCategory === 'Todas'
    ? [...new Set(filteredDocs.map(d => d.category))]
    : [selectedCategory];

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Todas');
    setSelectedYear('Todos');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 animate-fade-in">

      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-guinda-600 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
            {/* TEXTO CORREGIDO */}
            <span className="inline-block py-1 px-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">
                Transparencia CEITM
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Repositorio Oficial</h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                Consulta y descarga la documentación pública, informes financieros y normatividad vigente.
            </p>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="container mx-auto max-w-5xl px-6 -mt-8 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-2 flex flex-col md:flex-row gap-2 border border-gray-100 dark:border-slate-800">
            <button
                onClick={() => setActiveTab('repositorio')}
                className={`flex-1 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all font-bold text-lg ${activeTab === 'repositorio' ? 'bg-guinda-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
            >
                <FileText size={20} />
                Repositorio
            </button>
            <button
                onClick={() => setActiveTab('estatutos')}
                className={`flex-1 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all font-bold text-lg ${activeTab === 'estatutos' ? 'bg-slate-700 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
            >
                <Book size={20} />
                Estatutos
            </button>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-6 mt-12">

        {/* VISTA 1: REPOSITORIO CON FILTROS */}
        {activeTab === 'repositorio' && (
            <div className="animate-fade-in">

                {/* BARRA DE HERRAMIENTAS DE FILTRADO */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">

                    {/* Buscador de Texto */}
                    <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 focus-within:border-guinda-500 transition-colors">
                        <Search className="text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar documento..."
                            className="flex-1 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-400 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')}><X size={14} className="text-gray-400 hover:text-red-500" /></button>
                        )}
                    </div>

                    {/* Filtros: Categoría y Año */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">

                        <div className="relative min-w-[140px]">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 appearance-none cursor-pointer hover:border-guinda-500 transition-colors outline-none"
                            >
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative min-w-[100px]">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 appearance-none cursor-pointer hover:border-guinda-500 transition-colors outline-none"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* Botón limpiar si hay filtros activos */}
                        {(selectedCategory !== 'Todas' || selectedYear !== 'Todos') && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* RESULTADOS */}
                {filteredDocs.length === 0 && !loading ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">No se encontraron resultados</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda.</p>
                        <button onClick={clearFilters} className="mt-4 text-guinda-600 hover:underline">Ver todos los documentos</button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {categoriesToShow.map(cat => {
                             // Verificamos si esta categoría tiene documentos después del filtro
                             const docsInCat = filteredDocs.filter(d => d.category === cat);
                             if (docsInCat.length === 0) return null;

                             return (
                                <div key={cat} className="animate-fade-in">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-2">
                                        <span className="w-2 h-2 bg-guinda-600 rounded-full"></span>
                                        {cat}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {docsInCat.map(doc => (
                                            <div key={doc.id} className="card-base p-5 flex items-start gap-4 hover:border-guinda-500 transition-colors group">
                                                <div className="p-3 bg-gray-100 dark:bg-slate-800 text-gray-500 group-hover:bg-guinda-600 group-hover:text-white rounded-lg transition-all duration-300">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-guinda-600 transition-colors truncate pr-2">
                                                            {doc.title}
                                                        </h4>
                                                        {/* FECHA DESTACADA */}
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-full whitespace-nowrap">
                                                            {new Date(doc.created_at).getFullYear()}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                                                        {doc.description || 'Documento oficial disponible para descarga pública.'}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800/50">
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar size={12} /> {new Date(doc.created_at).toLocaleDateString()}
                                                        </span>
                                                        <a
                                                            href={doc.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs font-bold bg-guinda-50 dark:bg-guinda-900/20 text-guinda-700 dark:text-guinda-400 px-3 py-1.5 rounded-md hover:bg-guinda-100 dark:hover:bg-guinda-900/40 flex items-center gap-1 transition-colors"
                                                        >
                                                            Descargar <Download size={12} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                )}
            </div>
        )}

        {/* VISTA 2: ESTATUTOS (Sin cambios, solo se renderiza si activeTab es estatutos) */}
        {activeTab === 'estatutos' && (
            <div className="card-base p-8 md:p-12 animate-fade-in prose prose-lg dark:prose-invert max-w-none">

                <div className="text-center mb-10 pb-10 border-b border-gray-200 dark:border-slate-800">
                    <Shield size={64} className="mx-auto text-guinda-600 mb-6"/>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Estatutos Generales</h2>
                    <p className="text-gray-500">Consejo Estudiantil del Instituto Tecnológico de Morelia</p>
                    <p className="text-xs text-gray-400 mt-2">Última actualización: 2025</p>
                </div>

                {/* AQUÍ VA EL TEXTO RESUMIDO DE TUS ESTATUTOS */}
                <div className="space-y-8 text-gray-700 dark:text-slate-300">

                    <section>
                        <h3 className="text-xl font-bold text-guinda-700 dark:text-guinda-400">CAPÍTULO I: De la
                            Denominación y Objeto</h3>
                        <p>
                            <strong>Artículo 1.</strong> La organización estudiantil se denominará "Consejo Estudiantil
                            del Instituto Tecnológico de Morelia" (C.E.I.T.M.), siendo el máximo órgano de
                            representación de los alumnos ante las autoridades.
                        </p>
                        <p>
                            <strong>Artículo 2.</strong> El objetivo principal es velar por los derechos de los
                            estudiantes, promover la excelencia académica y fomentar la integración de la comunidad
                            tecnológica.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-guinda-700 dark:text-guinda-400">CAPÍTULO II: De los
                            Asociados</h3>
                        <p>
                            <strong>Artículo 5.</strong> Son miembros del C.E.I.T.M. todos los alumnos inscritos
                            legalmente en el Instituto Tecnológico de Morelia que no hayan perdido sus derechos
                            estudiantiles.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-guinda-700 dark:text-guinda-400">CAPÍTULO III: De la
                            Estructura</h3>
                        <p>
                            La estructura del Consejo se compone de:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Mesa Directiva:</strong> Presidente, Vicepresidente, Secretario General,
                                Tesorero, Contralor.
                            </li>
                            <li><strong>Concejales:</strong> Representantes de cada carrera.</li>
                            <li><strong>Coordinadores:</strong> Responsables de áreas específicas (Académica, Cultural,
                                Deportiva, etc.).
                            </li>
                        </ul>
                    </section>

                    {/* BOTÓN PARA DESCARGAR EL COMPLETO */}
                    <div
                        className="mt-12 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="mb-4 text-sm font-medium">Para consultar el documento legal completo con todos sus
                            artículos y sellos oficiales:</p>
                        <button className="btn-primary inline-flex items-center gap-2">
                            <Download size={18}/> Descargar Estatutos Completos (PDF)
                        </button>
                    </div>

                </div>
            </div>
        )}

      </div>
    </div>
  );
};