import React, { useEffect, useState } from 'react';
import { X, BoxSelect, Save } from 'lucide-react';
import type { Room } from '../../../shared/types';

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Room>) => Promise<void>;
    initialData?: Room | null;
    buildingId: number; // Necesario para vincular el salón
}

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSave, initialData, buildingId }) => {
    const [formData, setFormData] = useState<Partial<Room>>({
        type: 'CLASSROOM',
        floor: 'PB',
        building_id: buildingId
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: '',
                    type: 'CLASSROOM',
                    floor: 'PB',
                    building_id: buildingId
                });
            }
        }
    }, [isOpen, initialData, buildingId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Error saving room:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">

                {/* HEADER */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <BoxSelect className="text-guinda-600" size={20} />
                        {initialData ? 'Editar Espacio' : 'Nuevo Espacio'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nombre / Identificador</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            placeholder="Ej: Aula K4, Lab. Redes, Baños Hombres..."
                            value={formData.name || ''}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Piso */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Piso / Nivel</label>
                            <select
                                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={formData.floor || 'PB'}
                                onChange={e => setFormData({...formData, floor: e.target.value})}
                            >
                                <option value="PB">Planta Baja</option>
                                <option value="1">Piso 1</option>
                                <option value="2">Piso 2</option>
                                <option value="3">Piso 3</option>
                                <option value="4">Piso 4</option>
                            </select>
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tipo de Espacio</label>
                            <select
                                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={formData.type || 'CLASSROOM'}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="CLASSROOM">Aula</option>
                                <option value="LAB">Laboratorio</option>
                                <option value="OFFICE">Oficina</option>
                                <option value="WC">Baños</option>
                                <option value="PC">Cómputo</option>
                                <option value="AUDITORIUM">Auditorio</option>
                                <option value="FOOD">Comida/Cafetería</option>
                                <option value="STORE">Papelería/Tienda</option>
                            </select>
                        </div>
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
                            {isSubmitting ? 'Guardando...' : <><Save size={16} /> Guardar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};