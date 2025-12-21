import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Tag } from 'lucide-react';
import { COORDINACIONES } from '../../../shared/constants/coordinaciones';

interface NewsProps {
    id: number;
    title: string;
    excerpt: string;
    imagen_url: string;
    slug: string;
    created_at: string;
    category: string; // 👈 Asegúrate de recibir esto
}

export const NewsCard = ({ news }: { news: NewsProps }) => {

    // Helper para encontrar el nombre bonito y color de la categoría
    const getCategoryInfo = (catId: string) => {
        if (catId === 'GENERAL') return { label: 'General', color: 'bg-gray-100 text-gray-600' };

        const coord = COORDINACIONES.find(c => c.id === catId);
        if (coord) {
            // Extraemos el color base (ej. 'text-blue-600' -> 'bg-blue-50 text-blue-600')
            // Truco rápido: Usamos clases estáticas o un mapa de colores si prefieres
            // Por simplicidad, retornamos el label y un estilo genérico o el de la coordinación si lo tienes mapeado
            return { label: coord.label, color: 'bg-guinda-50 text-guinda-700' };
        }
        return { label: catId, color: 'bg-gray-100 text-gray-600' };
    };

    const categoryInfo = getCategoryInfo(news.category);

    return (
        <article className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-800 flex flex-col h-full group">

            {/* Imagen con Overlay al hacer hover */}
            <div className="relative h-52 overflow-hidden">
                <img
                    src={news.imagen_url || '/assets/demo-light.png'}
                    alt={news.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Badge de Categoría */}
                <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${categoryInfo.color} bg-white/90`}>
                        <Tag size={10} /> {categoryInfo.label}
                    </span>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
                {/* Fecha */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Calendar size={14} />
                    {new Date(news.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-guinda-600 transition-colors">
                    {news.title}
                </h3>

                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-6 flex-grow">
                    {news.excerpt}
                </p>

                <Link
                    to={`/noticias/${news.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-guinda-600 dark:text-guinda-500 hover:gap-3 transition-all"
                >
                    Leer nota completa <ArrowRight size={16} />
                </Link>
            </div>
        </article>
    );
};