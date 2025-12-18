import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  const heroImage = "http://localhost:8000/static/images/hero-bg.jpg";
  const [isLoaded, setIsLoaded] = useState(false);

  const scrollToFunctions = () => {
    const element = document.getElementById('estructura');
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-[85vh] w-full overflow-hidden flex items-center justify-center bg-gray-900">

      {/* 1. IMAGEN (z-0) */}
      <img
        src={heroImage}
        alt="Hero Background"
        onLoad={() => setIsLoaded(true)}
        className={`
            absolute inset-0 w-full h-full object-cover z-0
            transition-opacity duration-1000 ease-in-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'} 
        `}
      />

      {/* Overlay (z-10) - Oscurecemos un poco más abajo para que resalte el botón */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-guinda-900/95 to-guinda-800/70 dark:from-black/90 dark:to-guinda-900/80"></div>

      {/* 2. CONTENIDO TEXTO (z-30) - ¡ELEVADO PARA QUE NO LO TAPE NADA! */}
      <div className="relative z-30 container mx-auto px-6 text-center md:text-left will-change-transform">
        <div className="max-w-3xl">

            <div className={`transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold mb-6 backdrop-blur-md">
                    Consejo Estudiantil 2025 - 2026
                </span>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                    Velando por la <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                        Comunidad Estudiantil
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-100 mb-10 leading-relaxed max-w-2xl drop-shadow-md">
                    Tu voz, tus derechos y tu desarrollo profesional en un solo lugar.
                    Accede a convenios exclusivos, trámites académicos y transparencia total.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* BOTÓN 1: Agregué 'border' y 'shadow-xl' para contraste máximo */}
                    <button
                        onClick={scrollToFunctions}
                        className="group px-8 py-4 bg-white text-guinda-900 font-bold rounded-xl
                                   shadow-xl border-2 border-transparent hover:border-gray-200
                                   transform transition-transform duration-200 hover:scale-105 active:scale-95
                                   flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Ver Funciones
                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* BOTÓN 2: Conoce al Equipo (Ahora funcional) */}
                    <Link
                        to="/concejales"
                        className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl
                                   transform transition-transform duration-200 hover:scale-105 active:scale-95 hover:bg-white/10 shadow-lg text-center flex items-center justify-center"
                    >
                        Conoce al Equipo
                    </Link>
                </div>
            </div>

        </div>
      </div>

      {/* 3. DECORACIÓN INFERIOR (z-20) - POR DEBAJO DEL TEXTO */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20 pointer-events-none">
        <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-blue-gray-50 dark:fill-gray-900 transition-colors"
            ></path>
        </svg>
      </div>

    </div>
  );
};