import { useState } from 'react'; // Importar useState
import { ArrowRight } from 'lucide-react';
import { COORDINACIONES, type Coordination } from '../../../shared/constants/coordinaciones';
import { CoordinationModal } from './CoordinationModal'; // Importar el modal nuevo

export const CoordinationsGrid = () => {
  // 👇 Estado para controlar qué modal se abre
  const [selectedCoordination, setSelectedCoordination] = useState<Coordination | null>(null);

  const directiva = COORDINACIONES.filter(c => c.type === 'directiva');
  const operativas = COORDINACIONES.filter(c => c.type === 'operativa');

  return (
    <section id="estructura" className="py-20 bg-gray-50 dark:bg-gray-800/50 transition-colors relative">
      <div className="container mx-auto px-6">

        {/* ... (HEADER SE QUEDA IGUAL) ... */}

        {/* MESA DIRECTIVA */}
        <div className="mb-12">
            <h3 className="text-xl font-bold text-guinda-600 dark:text-guinda-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 inline-block">
                Mesa Directiva
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {directiva.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex flex-col cursor-pointer hover:-translate-y-1"
                    >
                         {/* ... contenido de la tarjeta igual ... */}
                         <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${item.color}`}>
                            <item.icon size={28} />
                        </div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{item.label}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow line-clamp-3">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* COORDINACIONES OPERATIVAS */}
        <div>
            <h3 className="text-xl font-bold text-guinda-600 dark:text-guinda-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 inline-block">
                Coordinaciones Operativas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {operativas.map((coord) => (
                    <div key={coord.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 dark:border-gray-700 group cursor-default flex flex-col h-full">

                        {/* ... icono y textos iguales ... */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${coord.color}`}>
                            <coord.icon size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                            {coord.label}
                        </h3>

                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                            {coord.description}
                        </p>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                            {/* 👇 BOTÓN ACTUALIZADO: Abre el modal en vez de link directo */}
                            <button
                                onClick={() => setSelectedCoordination(coord)}
                                className="text-sm font-semibold text-guinda-600 dark:text-guinda-400 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity group-hover:translate-x-1 duration-300"
                            >
                                Ver más <ArrowRight size={16} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* 👇 IMPORTANTE: Aquí renderizamos el Modal si hay uno seleccionado */}
      {selectedCoordination && (
          <CoordinationModal
              coordination={selectedCoordination}
              onClose={() => setSelectedCoordination(null)}
          />
      )}

    </section>
  );
};