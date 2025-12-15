import { ArrowRight } from 'lucide-react';

export const HeroSection = () => {
  const heroImage = "http://localhost:8000/static/images/hero-bg.jpg";

  // Función para scroll suave
  const scrollToFunctions = () => {
    const element = document.getElementById('estructura');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-[85vh] w-full overflow-hidden flex items-center justify-center">

      {/* IMAGEN DE FONDO */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-guinda-900/90 to-guinda-800/60 dark:from-black/80 dark:to-guinda-900/70"></div>
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 container mx-auto px-6 text-center md:text-left">
        <div className="max-w-3xl">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold mb-6 backdrop-blur-md animate-fade-in-up">
                Consejo Estudiantil 2025 - 2026
            </span>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Velando por la <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                    Comunidad Estudiantil
                </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Tu voz, tus derechos y tu desarrollo profesional en un solo lugar.
                Accede a convenios exclusivos, trámites académicos y transparencia total.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                {/* CAMBIO: Botón con acción de Scroll */}
                <button
                    onClick={scrollToFunctions}
                    className="px-8 py-4 bg-white text-guinda-900 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                    Ver Funciones
                    <ArrowRight size={20} />
                </button>

                <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm">
                    Conoce al Equipo
                </button>
            </div>
        </div>
      </div>

      {/* Decoración Inferior */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-10">
        <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-blue-gray-50 dark:fill-gray-900"
            ></path>
        </svg>
      </div>

    </div>
  );
};