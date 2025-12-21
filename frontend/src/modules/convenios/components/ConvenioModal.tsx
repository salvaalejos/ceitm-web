import { X, MapPin, Globe, Facebook, Instagram, ExternalLink } from 'lucide-react';
import type { Convenio } from '../../../shared/types';
import { CATEGORIAS_CONVENIOS } from '../../../shared/constants/convenios';

interface Props {
  convenio: Convenio;
  onClose: () => void;
}

export const ConvenioModal = ({ convenio, onClose }: Props) => {
  if (!convenio) return null;

  // Buscar info de la categoría para el icono/label
  const categoryInfo = CATEGORIAS_CONVENIOS.find(c => c.id === convenio.categoria);
  const CategoryIcon = categoryInfo?.icon;

  // Clase base para redes sociales
  const baseSocialClass = "p-3 rounded-full transition-all duration-300 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-sm hover:shadow-md hover:-translate-y-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>

      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative animate-fade-in overflow-hidden border border-gray-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex-shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                {/* Badge de Categoría */}
                {CategoryIcon && (
                    <div className={`p-2 rounded-lg ${categoryInfo?.color || 'bg-gray-100 text-gray-500'} bg-opacity-10`}>
                        <CategoryIcon size={20} />
                    </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {convenio.nombre}
                </h3>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all flex-shrink-0">
                <X size={24} />
            </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="overflow-y-auto p-0 flex-grow">

            <div className="flex flex-col md:flex-row min-h-full items-stretch">

                {/* COLUMNA IZQUIERDA: IMAGEN (Flyer Completo) */}
                {/* 👇 CAMBIO: Quitamos padding y centrado para que la img ocupe todo */}
                <div className="w-full md:w-1/2 bg-gray-50 dark:bg-black/20 border-r border-gray-100 dark:border-slate-800">
                    <img
                        src={convenio.imagen_url}
                        alt={convenio.nombre}
                        // 👇 CAMBIO: w-full y h-auto para que crezca lo que tenga que crecer
                        className="w-full h-auto block object-cover"
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x800/e2e8f0/64748b?text=Sin+Imagen')}
                    />
                </div>

                {/* COLUMNA DERECHA: INFORMACIÓN */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white dark:bg-slate-900">

                    <div className="flex-grow space-y-8">

                        {/* Descripción */}
                        <div>
                            <h4 className="text-xs font-bold text-guinda-600 dark:text-guinda-400 uppercase tracking-widest mb-3">Sobre el negocio</h4>
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed text-sm md:text-base">
                                {convenio.descripcion_larga}
                            </p>
                        </div>

                        {/* Beneficios */}
                        <div className="bg-guinda-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-guinda-100 dark:border-slate-700">
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
                                <div className="flex items-start gap-3 group">
                                    <MapPin className="text-guinda-500 mt-1 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-tight">
                                            {convenio.direccion}
                                        </p>

                                        {/* Link a Maps */}
                                        <a
                                            href={convenio.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(convenio.direccion)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-guinda-600 hover:text-guinda-700 mt-2 hover:underline"
                                        >
                                            Ver en Google Maps <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* REDES SOCIALES */}
                    <div className="pt-8 mt-8 border-t border-gray-100 dark:border-slate-800">
                        <div className="flex gap-4">

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