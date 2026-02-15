import React from 'react';
import { X, Clock, Calendar } from 'lucide-react';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    concejalName: string;
    schedule: [string, number[]][];
}

export const ScheduleModal = ({ isOpen, onClose, concejalName, schedule }: ScheduleModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-scale-up">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="text-guinda-600" size={20} />
                        Horario de {concejalName.split(' ')[0]}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {schedule.length > 0 ? (
                        <div className="space-y-3">
                            {schedule.map(([day, hours]) => (
                                <div key={day} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{day}</span>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {hours.sort((a, b) => a - b).map(h => (
                                            <span key={h} className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600 text-[10px] font-mono font-bold text-guinda-600 dark:text-guinda-400">
                                                {h}:00
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="mx-auto text-gray-300 mb-2" size={40} />
                            <p className="text-sm text-gray-400 italic">Horario por definir para este periodo.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 flex justify-center">
                    <p className="text-[10px] text-gray-400 font-medium">Ubicación: Edificio del Consejo Estudiantil</p>
                </div>
            </div>
        </div>
    );
};