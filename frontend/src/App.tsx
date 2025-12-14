import { useState, useEffect } from 'react';
import { ConvenioCard } from './modules/convenios/components/ConvenioCard';
import type { Convenio } from './shared/types';
import { getConvenios } from './shared/services/api';

function App() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTO es lo que conecta el Frontend con el Backend
  useEffect(() => {
    async function cargar() {
      try {
        const data = await getConvenios();
        setConvenios(data);
      } catch (error) {
        console.error("Error conectando al backend:", error);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  if (loading) return <div className="p-10 text-center">Cargando sistema...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-guinda-600 mb-6 text-center">
        Convenios Oficiales CEITM
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 container mx-auto">
        {convenios.map((c) => (
          <ConvenioCard key={c.id} convenio={c} onVerMas={() => alert(c.nombre)} />
        ))}
      </div>
    </div>
  );
}

export default App;