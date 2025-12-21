import { useEffect, useState } from 'react';
import { X, ArrowRight, User as UserIcon, Loader2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Coordination } from '../../../shared/constants/coordinaciones';
import { getConcejalesPublic } from '../../../shared/services/api';

interface Props {
    coordination: Coordination;
    onClose: () => void;
}

export const CoordinationModal = ({ coordination, onClose }: Props) => {
    const [coordinator, setCoordinator] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const findCoordinator = async () => {
            try {
                const users = await getConcejalesPublic();

                // Lógica de match por nombre de área
                const found = users.find((u: any) =>
                    u.area === coordination.label &&
                    (u.role === 'coordinador' || u.role === 'estructura' || u.role === 'vocal')
                );

                setCoordinator(found || null);
            } catch (error) {
                console.error("Error buscando coordinador", error);
            } finally {
                setLoading(false);
            }
        };

        findCoordinator();
    }, [coordination]);

    // Extraemos el color principal (el texto) de la configuración
    // Ej: "text-yellow-600 bg-yellow-50..." -> "text-yellow-600"
    const iconColorClass = coordination.color.split(' ')[0];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">

                {/* Botón Cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                {/* 👇 HEADER NUEVO (Limpio y Profesional) */}
                <div className="h-32 w-full bg-gray-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
                     {/* Patrón de fondo muy sutil */}
                     <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Contenido */}
                <div className="px-8 pb-8 -mt-10 flex-grow overflow-y-auto relative z-20">

                    {/* Foto del Coordinador */}
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 shadow-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            {loading ? (
                                <Loader2 className="animate-spin text-guinda-600" />
                            ) : (
                                // Corrección del bug de imagen
                                coordinator?.imagen_url ? (
                                    <img
                                        src={coordinator.imagen_url}
                                        alt={coordinator.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : coordinator ? (
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${coordinator.full_name}&background=800020&color=fff`}
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <UserIcon size={32} className="text-gray-400" />
                                )
                            )}
                        </div>
                    </div>

                    <div className="text-center space-y-1 mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {coordination.label}
                        </h3>

                        {!loading && coordinator ? (
                            <div className="animate-fade-in">
                                <p className="text-lg font-medium text-guinda-600 dark:text-guinda-400">
                                    {coordinator.full_name}
                                </p>
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    {coordinator.role === 'estructura' ? 'Mesa Directiva' : 'Coordinador(a) del Área'}
                                </p>
                            </div>
                        ) : !loading && (
                            <p className="text-sm text-gray-400 italic">Área actualmente vacante</p>
                        )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-center mb-8 text-sm leading-relaxed">
                        {coordination.modalDescription}
                    </p>

                    {/* Botones de Acción */}
                    <div className="space-y-3">
                        <Link
                            to={coordination.route}
                            onClick={onClose}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 shadow-lg shadow-guinda-600/20"
                        >
                            Ir al sitio de {coordination.label} <ArrowRight size={18} />
                        </Link>

                        <Link
                            to={`/noticias?category=${coordination.id}`}
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            <Filter size={16} /> Ver noticias de esta área
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};