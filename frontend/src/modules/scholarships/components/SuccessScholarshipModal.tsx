import React from 'react';
import { Check, MessageCircle} from 'lucide-react';

interface SuccessScholarshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappLink: string;
}

export const SuccessScholarshipModal: React.FC<SuccessScholarshipModalProps> = ({
  isOpen,
  onClose,
  whatsappLink
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center relative animate-scale-up border border-gray-100 dark:border-slate-800">

        {/* Check Animado */}
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <Check size={32} className="text-green-600 dark:text-green-400 stroke-[3px] animate-bounce" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Solicitud Registrada!
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Como siguiente paso, es **obligatorio** que te unas al grupo de WhatsApp oficial de seguimiento.
        </p>

        {/* Botón de WhatsApp Dinámico */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold transition-all shadow-lg shadow-green-200 dark:shadow-none transform active:scale-95"
        >
          <MessageCircle size={24} />
          Unirme al Grupo
        </a>

        <button
          onClick={onClose}
          className="mt-6 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          Cerrar ventana
        </button>
      </div>
    </div>
  );
};