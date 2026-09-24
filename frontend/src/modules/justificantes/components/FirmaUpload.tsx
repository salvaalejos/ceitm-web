import { useRef, useState } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { uploadFirma } from '../../../shared/services/api';

interface Props {
  onUploaded: (url: string) => void;
  existingUrl?: string | null;
}

export const FirmaUpload = ({ onUploaded, existingUrl }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(existingUrl || '');
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const res = await uploadFirma(file);
      setPreview(res.imagen_url);
      onUploaded(res.imagen_url);
    } catch (err) {
      console.error(err);
      alert('Error al subir la firma. Verifica que sea una imagen PNG o JPG.');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/40">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        Firma digital (se guarda y se reutiliza en tus aprobaciones)
      </p>

      {preview ? (
        <img
          src={preview}
          alt="Firma"
          className="h-16 object-contain rounded-lg border border-gray-200 dark:border-slate-700 bg-white p-2"
        />
      ) : (
        <div className="h-16 w-40 flex items-center justify-center text-xs text-gray-400 border rounded-lg border-gray-200 dark:border-slate-700 bg-white/50">
          Sin firma guardada
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-guinda-600 text-white text-sm font-medium hover:bg-guinda-700 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : preview ? (
          <RefreshCw size={16} />
        ) : (
          <Upload size={16} />
        )}
        {preview ? 'Reemplazar firma' : 'Subir firma'}
      </button>
    </div>
  );
};