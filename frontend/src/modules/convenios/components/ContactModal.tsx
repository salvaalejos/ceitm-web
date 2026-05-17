import { X, MessageCircle, Instagram, Mail, Users } from 'lucide-react';
import type { User } from '../../../shared/types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinator: User | null;
}

export const ContactModal = ({ isOpen, onClose, coordinator }: ContactModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card-base w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
            <Users size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Únete a nuestra red!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Si representas a una empresa o negocio y quieres ofrecer beneficios a los estudiantes del ITM, contáctanos.
          </p>

          {coordinator ? (
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
              <div className="w-20 h-20 mx-auto mb-3">
                <img 
                  src={coordinator.imagen_url || `https://ui-avatars.com/api/?name=${coordinator.full_name}&background=800020&color=fff`} 
                  alt={coordinator.full_name}
                  className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-sm"
                />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{coordinator.full_name}</h3>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-4">
                Coordinador(a) de Vinculación
              </span>

              <div className="flex justify-center gap-3">
                {coordinator.phone_number && (
                  <a
                    href={`https://wa.me/52${coordinator.phone_number.replace(/\D/g, '')}?text=Hola,%20me%20interesa%20tener%20un%20convenio%20con%20el%20CEITM`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-sm transition-transform hover:scale-105 shadow-sm"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}
                {coordinator.instagram_url && (
                  <a
                    href={coordinator.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 rounded-xl hover:bg-pink-500 hover:text-white transition-transform hover:scale-105 shadow-sm"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                <a
                  href={`mailto:${coordinator.email}`}
                  className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-transform hover:scale-105 shadow-sm"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 p-4 rounded-xl text-sm mb-6 border border-orange-100 dark:border-orange-800">
              Actualmente no hay un coordinador asignado, pero puedes escribirnos a nuestras redes oficiales.
            </div>
          )}

          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-medium text-sm transition-colors">
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};
