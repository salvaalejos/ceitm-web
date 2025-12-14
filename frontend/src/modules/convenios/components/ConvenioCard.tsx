// Ubicación: frontend/src/modules/convenios/components/ConvenioCard.tsx
import { Globe, Facebook, Instagram, ArrowRight } from 'lucide-react';
import type { Convenio } from '../../../shared/types';

interface Props {
  convenio: Convenio;
  onVerMas: (convenio: Convenio) => void;
}

export const ConvenioCard = ({ convenio, onVerMas }: Props) => {
  return (
    <div className="bg-white dark:bg-blue-gray-800 rounded-xl shadow-md hover:shadow-xl dark:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col h-full border border-blue-gray-100 dark:border-blue-gray-700">

      {/* Imagen */}
      <div className="relative h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          // OJO: Aquí usamos 'imagen_url' que es como viene de Python
          src={convenio.imagen_url}
          alt={`Imagen de ${convenio.nombre}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/64748b?text=Imagen+no+disponible';
          }}
        />
        <div className="absolute top-3 right-3">
            <span className="bg-guinda-600/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                {convenio.categoria}
            </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-blue-gray-900 dark:text-white mb-2 line-clamp-1">
            {convenio.nombre}
          </h3>

          <p className="text-sm text-blue-gray-600 dark:text-blue-gray-400 mb-4 line-clamp-3">
            {/* OJO: Python manda snake_case (descripcion_corta) */}
            {convenio.descripcion_corta}
          </p>
        </div>

        {/* Footer de la tarjeta */}
        <div className="flex justify-between items-center pt-4 border-t border-blue-gray-200 dark:border-blue-gray-700 mt-2">
          <div className="flex space-x-3 text-blue-gray-400">
            {convenio.social_links?.web && <Globe size={18} className="hover:text-guinda-500 cursor-pointer transition-colors" />}
            {convenio.social_links?.facebook && <Facebook size={18} className="hover:text-guinda-500 cursor-pointer transition-colors" />}
            {convenio.social_links?.instagram && <Instagram size={18} className="hover:text-guinda-500 cursor-pointer transition-colors" />}
          </div>

          <button
            onClick={() => onVerMas(convenio)}
            className="flex items-center text-sm font-semibold text-guinda-600 dark:text-guinda-400 hover:text-guinda-800 dark:hover:text-guinda-200 transition-colors group"
          >
            Ver más
            <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};