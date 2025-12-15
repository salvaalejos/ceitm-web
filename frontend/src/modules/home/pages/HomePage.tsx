import { HeroSection } from '../components/HeroSection';
import { IdentitySection } from '../components/IdentitySection';
import { CoordinationsGrid } from '../components/CoordinationsGrid';

export const HomePage = () => {
  return (
    <div className="animate-fade-in">

      {/* 1. HERO (Portada) */}
      <HeroSection />

      {/* 2. IDENTIDAD (Misión / Visión Oficiales) */}
      <IdentitySection />

      {/* 3. COORDINACIONES (Estructura Operativa) */}
      <CoordinationsGrid />

      {/* 4. FOOTER TEMPORAL (Llamado a la acción) */}
      <div className="py-20 bg-guinda-900 text-center text-white relative overflow-hidden">
          {/* Un poco de decoración de fondo */}
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

          <div className="relative z-10 container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">¿Quieres formar parte del cambio?</h2>
            <p className="mb-8 text-guinda-100 max-w-2xl mx-auto text-lg">
                Acércate a tu concejal de carrera o visita nuestras oficinas para conocer más sobre cómo puedes participar.
            </p>
            <button className="px-8 py-3 bg-white text-guinda-900 font-bold rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-lg">
                Contáctanos
            </button>
          </div>
      </div>

    </div>
  );
};