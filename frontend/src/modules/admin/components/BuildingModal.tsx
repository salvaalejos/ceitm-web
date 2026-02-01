import React, { useEffect, useState } from 'react';
import { X, MapPin, Save, Building as BuildingIcon } from 'lucide-react';
import type { Building } from '../../../shared/types';

interface BuildingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Building>) => Promise<void>;
    initialData?: Building | null;
}

const DEFAULT_COORDS = { lat: 19.7228, lng: -101.1855 }; // Coordenadas default (Centro del ITM)

export const BuildingModal: React.FC<BuildingModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Partial<Building>>({
        category: 'AULAS',
        coordinates: DEFAULT_COORDS
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar datos al abrir para editar
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: '',
                    code: '',
                    description: '',
                    tags: '',
                    category: 'AULAS',
                    coordinates: DEFAULT_COORDS
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Error saving building:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <BuildingIcon className="text-guinda-600" size={20} />
                        {initialData ? 'Editar Edificio' : 'Nuevo Edificio'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

                    {/* Nombre y Código */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nombre Oficial</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="Ej: Edificio K"
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Código</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-center"
                                placeholder="Ej: K"
                                value={formData.code || ''}
                                onChange={e => setFormData({...formData, code: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Descripción</label>
                        <textarea
                            rows={3}
                            className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                            placeholder="Descripción breve de lo que se encuentra aquí..."
                            value={formData.description || ''}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    {/* Categoría y Tags */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Categoría</label>
                            <select
                                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={formData.category || 'AULAS'}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="AULAS">Aulas</option>
                                <option value="ADMINISTRATIVO">Administrativo</option>
                                <option value="LABS">Laboratorios</option>
                                <option value="SERVICIOS">Servicios</option>
                                <option value="ALIMENTOS">Alimentos</option>
                                <option value="AREAS_VERDES">Áreas Verdes</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tags (Búsqueda)</label>
                            <input
                                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="isc, computo, redes..."
                                value={formData.tags || ''}
                                onChange={e => setFormData({...formData, tags: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Coordenadas */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-1.5">
                            <MapPin size={14}/> Ubicación Geográfica
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Latitud</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-1 focus:ring-blue-500"
                                    value={formData.coordinates?.lat || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Longitud</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-1 focus:ring-blue-500"
                                    value={formData.coordinates?.lng || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-2">
                            * Puedes copiar estas coordenadas haciendo clic derecho en Google Maps.
                        </p>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-bold text-white bg-guinda-600 hover:bg-guinda-700 rounded-lg shadow-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Guardando...' : <><Save size={16} /> Guardar Edificio</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};