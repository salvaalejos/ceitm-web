import {
  BookOpen, Users, GraduationCap, Megaphone, HeartHandshake, Palette, Scale,
  Crown, FileText, DollarSign, Activity, ArrowRight
} from 'lucide-react';

export const CoordinationsGrid = () => {

  // 1. MESA DIRECTIVA
  const directiva = [
    {
      titulo: "Presidencia",
      icono: <Crown size={28} />,
      desc: "Representación oficial del alumnado, liderazgo estratégico y coordinación general del Consejo.",
      color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 group-hover:bg-yellow-600 group-hover:text-white"
    },
    {
      titulo: "Secretaría General",
      icono: <FileText size={28} />,
      desc: "Organización interna, gestión de documentación oficial, minutas y agenda del Consejo.",
      color: "text-gray-600 bg-gray-100 dark:bg-gray-700/50 group-hover:bg-gray-600 group-hover:text-white"
    },
    {
      titulo: "Tesorería",
      icono: <DollarSign size={28} />,
      desc: "Administración transparente de recursos, finanzas y gestión de presupuestos para actividades.",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-600 group-hover:text-white"
    },
    {
      titulo: "Contraloría",
      icono: <Scale size={28} />,
      desc: "Vigilancia del cumplimiento de estatutos, auditoría interna y transparencia en procesos.",
      color: "text-blue-gray-600 bg-blue-gray-50 dark:bg-slate-800 group-hover:bg-slate-600 group-hover:text-white"
    }
  ];

  // 2. COORDINACIONES OPERATIVAS
  const coordinaciones = [
    {
      titulo: "Académico",
      icono: <BookOpen size={32} />,
      desc: "Atención a problemáticas escolares, asesorías y gestión de trámites educativos.",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-600 group-hover:text-white"
    },
    {
      titulo: "Becas y Apoyos",
      icono: <GraduationCap size={32} />,
      desc: "Gestión integral de apoyos alimenticios, becas de reinscripción y becas para cursos del CLE.",
      color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 group-hover:bg-orange-600 group-hover:text-white"
    },
    {
      titulo: "Prevención y Logística", // CAMBIO: Nombre original restaurado
      icono: <HeartHandshake size={32} />,
      desc: "Campañas de impacto social para la comunidad y programas para liberación de servicio becario.",
      color: "text-red-600 bg-red-50 dark:bg-red-900/20 group-hover:bg-red-600 group-hover:text-white"
    },
    {
      titulo: "Comunicación y Difusión",
      icono: <Megaphone size={32} />,
      desc: "Manejo de redes oficiales, diseño de estrategias informativas y difusión de avisos.",
      color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20 group-hover:bg-pink-600 group-hover:text-white"
    },
    {
      titulo: "Vinculación",
      icono: <Users size={32} />,
      desc: "Alianzas estratégicas con empresas y sector externo para proyectos de valor curricular.",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-600 group-hover:text-white"
    },
    {
      titulo: "Eventos (SODECU)",
      icono: <Activity size={32} />,
      desc: "Creación de experiencias culturales, deportivas y recreativas para la integración estudiantil.",
      color: "text-green-600 bg-green-50 dark:bg-green-900/20 group-hover:bg-green-600 group-hover:text-white"
    },
    {
      titulo: "Marketing y Diseño",
      icono: <Palette size={32} />,
      desc: "Identidad visual institucional, creación de contenido gráfico y branding del Consejo.",
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-600 group-hover:text-white"
    }
  ];

  return (
    // CAMBIO: ID agregado para el scroll
    <section id="estructura" className="py-20 bg-gray-50 dark:bg-gray-800/50 transition-colors">
      <div className="container mx-auto px-6">

        {/* HEADER */}
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Nuestra Estructura
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Un equipo multidisciplinario organizado para cubrir todas las necesidades de la comunidad tecnológica.
            </p>
        </div>

        {/* SECCIÓN 1: MESA DIRECTIVA */}
        <div className="mb-12">
            <h3 className="text-xl font-bold text-guinda-600 dark:text-guinda-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 inline-block">
                Mesa Directiva
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {directiva.map((item, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex flex-col">
                         <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${item.color}`}>
                            {item.icono}
                        </div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{item.titulo}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* SECCIÓN 2: COORDINACIONES */}
        <div>
            <h3 className="text-xl font-bold text-guinda-600 dark:text-guinda-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 inline-block">
                Coordinaciones Operativas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {coordinaciones.map((coord, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 dark:border-gray-700 group cursor-default flex flex-col h-full">

                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${coord.color}`}>
                            {coord.icono}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                            {coord.titulo}
                        </h3>

                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                            {coord.desc}
                        </p>

                        {/* CAMBIO: Botón "Ver área" */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                            <button className="text-sm font-semibold text-guinda-600 dark:text-guinda-400 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity group-hover:translate-x-1 duration-300">
                                Ir al sitio <ArrowRight size={16} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </div>

      </div>
    </section>
  );
};