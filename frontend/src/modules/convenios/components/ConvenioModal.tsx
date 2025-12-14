import { X, MapPin, Globe, Facebook, Instagram } from 'lucide-react';
import type { Convenio } from '../../../shared/types';

interface Props {
  convenio: Convenio;
  onClose: () => void;
}

export const ConvenioModal = ({ convenio, onClose }: Props) => {
  if (!convenio) return null;

  // Clase base: Redondo, gris suave por defecto, transición suave
  const baseSocialClass = "p-3 rounded-full transition-all duration-300 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-sm hover:shadow-md hover:-translate-y-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>

      <div
        className="bg-white dark:bg-blue-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative animate-fade-in overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-blue-gray-900 z-10">
            <h3 className="text-2xl font-bold text-guinda-600 dark:text-guinda-400 truncate pr-4">
                {convenio.nombre}
            </h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all">
                <X size={24} />
            </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-0 flex-grow">

            <div className="flex flex-col md:flex-row min-h-full items-stretch">

                {/* COLUMNA IZQUIERDA: IMAGEN */}
                <div className="w-full md:w-1/2 bg-gray-50 dark:bg-black/20 p-8 flex items-center justify-center border-r border-gray-100 dark:border-gray-700">
                    <img
                        src={convenio.imagen_url}
                        alt={convenio.nombre}
                        className="w-full h-auto object-contain rounded-lg shadow-lg dark:shadow-black/50"
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x800/e2e8f0/64748b?text=Sin+Imagen')}
                    />
                </div>

                {/* COLUMNA DERECHA: INFORMACIÓN */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white dark:bg-blue-gray-900">

                    <div className="flex-grow space-y-8">

                        {/* Descripción */}
                        <div>
                            <h4 className="text-xs font-bold text-guinda-600 dark:text-guinda-400 uppercase tracking-widest mb-3">Sobre el negocio</h4>
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed text-sm md:text-base">
                                {convenio.descripcion_larga}
                            </p>
                        </div>

                        {/* Beneficios */}
                        <div className="bg-guinda-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-guinda-100 dark:border-gray-700">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="bg-guinda-100 dark:bg-guinda-900 text-guinda-600 dark:text-guinda-300 p-1 rounded">✨</span>
                                Beneficios exclusivos
                            </h4>
                            <ul className="space-y-3">
                                {convenio.beneficios.map((beneficio, index) => (
                                    <li key={index} className="flex items-start text-gray-700 dark:text-gray-300 text-sm">
                                        <span className="mr-3 text-guinda-500 font-bold">•</span>
                                        {beneficio}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Ubicación */}
                        {convenio.direccion && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Ubicación</h4>
                                <div className="flex items-start text-gray-600 dark:text-gray-300 group cursor-default">
                                    <MapPin className="text-guinda-500 mr-2 mt-0.5 flex-shrink-0 group-hover:animate-bounce" size={18} />
                                    <p className="text-sm">{convenio.direccion}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* REDES SOCIALES (Corregido) */}
                    <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex gap-4">

                            {/* WEB -> Guinda */}
                            {convenio.social_links?.web && (
                                <a
                                    href={convenio.social_links.web}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${baseSocialClass} hover:bg-guinda-600 dark:hover:bg-guinda-600 hover:text-white dark:hover:text-white`}
                                    title="Sitio Web"
                                >
                                    <Globe size={22} />
                                </a>
                            )}

                            {/* FACEBOOK -> Azul (Usamos blue-600 que es muy parecido al oficial) */}
                            {convenio.social_links?.facebook && (
                                <a
                                    href={convenio.social_links.facebook}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${baseSocialClass} hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white`}
                                    title="Facebook"
                                >
                                    <Facebook size={22} />
                                </a>
                            )}

                            {/* INSTAGRAM -> Rosa (Usamos pink-600) */}
                            {convenio.social_links?.instagram && (
                                <a
                                    href={convenio.social_links.instagram}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${baseSocialClass} hover:bg-pink-600 dark:hover:bg-pink-600 hover:text-white dark:hover:text-white`}
                                    title="Instagram"
                                >
                                    <Instagram size={22} />
                                </a>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};