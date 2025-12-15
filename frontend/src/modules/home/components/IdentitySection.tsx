import { Target, Eye } from 'lucide-react';

export const IdentitySection = () => {
  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-6">

        {/* ENCABEZADO: OBJETIVO GENERAL */}
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-guinda-600 dark:text-guinda-400 mb-4">
                Nuestra Identidad
            </h2>
            <div className="h-1 w-20 bg-guinda-600 mx-auto rounded-full"></div>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                "El Consejo Estudiantil del Instituto Tecnológico de Morelia (CEITM) tiene como objetivo general representar de manera legítima, democrática y organizada a la comunidad estudiantil, promoviendo su bienestar académico, social, cultural y humano."
            </p>
        </div>

        {/* TARJETAS: MISIÓN Y VISIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">

            {/* MISIÓN */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border-l-4 border-guinda-600 shadow-md hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-guinda-100 dark:bg-guinda-900/30 text-guinda-600 rounded-lg group-hover:bg-guinda-600 group-hover:text-white transition-colors">
                        <Target size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Misión</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                    Representar, apoyar y fortalecer a la comunidad estudiantil del Instituto Tecnológico de Morelia, promoviendo su bienestar integral y gestionando acciones que impulsen su desarrollo académico, cultural, deportivo y humano.
                </p>
            </div>

            {/* VISIÓN */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border-l-4 border-yellow-500 shadow-md hover:shadow-lg transition-all group">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                        <Eye size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Visión</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                    Consolidar un Consejo Estudiantil transparente, organizado y reconocido por su liderazgo, destacándose por impulsar proyectos innovadores, gestionar apoyos significativos y fomentar la unidad entre las diferentes carreras del Instituto.
                </p>
            </div>

        </div>
      </div>
    </section>
  );
};