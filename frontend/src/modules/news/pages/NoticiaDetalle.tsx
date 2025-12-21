import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSingleNews } from '../../../shared/services/api';
import { ArrowLeft, Calendar, ExternalLink, AlertCircle, Instagram } from 'lucide-react';
import ReactPlayer from 'react-player';

export const NoticiaDetalle = () => {
  const { slug } = useParams();
  const [noticia, setNoticia] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Función para limpiar URLs sucias (quita todo después del ?)
  const getCleanUrl = (url: string) => {
      if (!url) return '';
      return url.split('?')[0];
  };

  useEffect(() => {
    const loadData = async () => {
        if (!slug) return;
        try {
            const data = await getSingleNews(slug);
            setNoticia(data);
            setVideoError(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Cargando...</div>;
  if (!noticia) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Noticia no encontrada</div>;

  const cleanVideoUrl = getCleanUrl(noticia.video_url);
  // Instagram suele bloquear localhost, así que detectamos si es IG para mostrar una UI especial
  const isInstagram = cleanVideoUrl.includes('instagram.com');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 animate-fade-in pb-20">

      {/* NAVEGACIÓN */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="container mx-auto px-6 py-4">
              <Link to="/noticias" className="inline-flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-guinda-600 transition-colors font-medium">
                  <ArrowLeft size={20} /> Volver a Noticias
              </Link>
          </div>
      </div>

      <article className="container mx-auto px-6 max-w-4xl mt-10">

        {/* HEADER */}
        <header className="mb-10 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-guinda-50 dark:bg-guinda-900/30 text-guinda-700 dark:text-guinda-400 text-sm font-bold mb-4">
                Comunicado Oficial
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {noticia.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-gray-500 dark:text-slate-400 text-sm">
                <span className="flex items-center gap-2"><Calendar size={16}/> {new Date(noticia.created_at).toLocaleDateString()}</span>
            </div>
        </header>

        {/* MULTIMEDIA INTELIGENTE */}
        <div className="rounded-2xl overflow-hidden shadow-2xl mb-10 bg-black aspect-video relative group border border-gray-200 dark:border-slate-800">

            {/* CASO 1: Instagram (Mostrar tarjeta bonita directamenta para evitar pantalla negra) */}
            {isInstagram ? (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900 text-white p-6 text-center">
                    <Instagram size={64} className="mb-4 text-white/80" />
                    <h3 className="text-2xl font-bold mb-2">Ver Reel en Instagram</h3>
                    <p className="text-white/70 mb-6 max-w-md">
                        Para la mejor experiencia, visualiza este contenido directamente en la aplicación.
                    </p>
                    <a
                        href={cleanVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-3 bg-white text-pink-900 font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                    >
                        Abrir en Instagram <ExternalLink size={18} />
                    </a>
                </div>
            ) :

            /* CASO 2: Video Normal (YouTube, Vimeo, Facebook Watch, MP4) */
            noticia.video_url && !videoError ? (
                <div className="w-full h-full">
		    {/* @ts-ignore */}
                    <ReactPlayer
                        url={cleanVideoUrl} // Usamos la URL limpia
                        width="100%"
                        height="100%"
                        controls
                        onError={() => setVideoError(true)}
                    />
                </div>
            ) :

            /* CASO 3: Fallo o Sin Video */
            noticia.video_url && videoError ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                    <AlertCircle size={48} className="text-gray-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No se puede reproducir aquí</h3>
                    <a
                        href={cleanVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        Ver en fuente original <ExternalLink size={18} />
                    </a>
                </div>
            ) : (
                <img
                    src={noticia.imagen_url || 'https://placehold.co/1200x630?text=Sin+Imagen'}
                    alt={noticia.title}
                    className="w-full h-full object-cover"
                />
            )}
        </div>

        {/* CONTENIDO */}
        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {noticia.content}
        </div>

      </article>
    </div>
  );
};
