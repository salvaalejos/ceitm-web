// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

export const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <div className="pwa-toast">
      {needRefresh && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-gray-900 text-white rounded-lg shadow-lg flex flex-col gap-2 border border-gray-700 animate-fade-in">
          <div className="mb-2 font-medium">
            <span>Hay una nueva versión disponible.</span>
          </div>
          <div className="flex gap-2">
            <button
                className="px-3 py-1 bg-guinda-600 hover:bg-guinda-700 rounded text-sm font-bold transition-colors"
                onClick={() => updateServiceWorker(true)}
            >
              Actualizar
            </button>
            <button
                className="px-3 py-1 border border-gray-600 hover:bg-gray-800 rounded text-sm transition-colors"
                onClick={close}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};