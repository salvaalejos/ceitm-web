import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, PlayCircle, FileText } from 'lucide-react';

interface NewsProps {
  slug: string;
  title: string;
  excerpt: string;
  imagen_url?: string;
  video_url?: string;
  created_at: string;
}

export const NewsCard = ({ news }: { news: NewsProps }) => {
  return (
    <Link
      to={`/noticias/${news.slug}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* 1. IMAGEN / MINIATURA */}
      <div className="h-56 overflow-hidden relative bg-gray-100 dark:bg-slate-950">
        {news.imagen_url ? (
            <img
                src={news.imagen_url}
                alt={news.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-800">
                <FileText size={48} />
            </div>
        )}

        {/* Badge de Video si tiene video */}
        {news.video_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                <PlayCircle size={48} className="text-white drop-shadow-lg opacity-90 group-hover:scale-110 transition-transform" />
            </div>
        )}

        {/* Fecha Overlay */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-guinda-700 dark:text-guinda-400 shadow-sm flex items-center gap-1">
            <Calendar size={12} />
            {new Date(news.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* 2. CONTENIDO */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-guinda-600 dark:group-hover:text-guinda-400 transition-colors">
            {news.title}
        </h3>

        <p className="text-gray-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 flex-grow">
            {news.excerpt}
        </p>

        <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4 mt-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500">
                <User size={14} />
                <span>Consejo Estudiantil</span>
            </div>
            <span className="text-sm font-bold text-guinda-600 dark:text-guinda-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Leer más <ArrowRight size={16} />
            </span>
        </div>
      </div>
    </Link>
  );
};