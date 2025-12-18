import { useEffect, useState } from 'react';
import { getNews } from '../../../shared/services/api';
import { NewsCard } from '../components/NewsCard';

export const NoticiasPage = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        setNews(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 py-16 px-6">
        <div className="container mx-auto text-center">
            <span className="text-guinda-600 dark:text-guinda-400 font-bold uppercase tracking-widest text-sm mb-2 block">
                Blog Oficial
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Noticias y Comunicados
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
                Mantente informado sobre eventos, convocatorias y actividades del Instituto Tecnológico de Morelia.
            </p>
        </div>
      </div>

      {/* GRID */}
      <div className="container mx-auto px-6 -mt-8">
        {loading ? (
             <div className="text-center py-20 text-gray-500">Cargando noticias...</div>
        ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map(item => (
                        <NewsCard key={item.id} news={item} />
                    ))}
                </div>

                {news.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-500 dark:text-slate-500">No hay noticias publicadas por el momento.</p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};