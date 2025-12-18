import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ArrowLeft, Clock, CheckCircle,
    XCircle, AlertTriangle, FileText, Loader2
} from 'lucide-react';
import { checkMyStatus, getScholarships } from '../../../shared/services/api';
import type { ScholarshipApplication, Scholarship } from '../../../shared/types';

export const ResultadosBecaPage = () => {
    const navigate = useNavigate();
    const [controlNumber, setControlNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState<ScholarshipApplication[]>([]);
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);

    useEffect(() => {
        getScholarships(false).then(setScholarships).catch(console.error);
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!controlNumber.trim()) return;

        setLoading(true);
        setHasSearched(false);
        try {
            const data = await checkMyStatus(controlNumber.trim());
            setResults(data);
            setHasSearched(true);
        } catch (error) {
            console.error(error);
            alert("Error al consultar. Verifica tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    const getBecaName = (id: number) => scholarships.find(s => s.id === id)?.name || `Convocatoria #${id}`;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 pt-10 px-4 animate-fade-in">
            <div className="container mx-auto max-w-2xl">

                {/* BOTÓN VOLVER INTEGRADO */}
                <button
                    onClick={() => navigate('/becas')}
                    className="mb-8 text-gray-500 hover:text-guinda-600 dark:text-gray-400 dark:hover:text-guinda-400 flex items-center gap-2 transition-colors font-medium"
                >
                    <ArrowLeft size={20} /> Regresar a Becas
                </button>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Consulta de Resultados</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Ingresa tu número de control para verificar el estatus de tus solicitudes de beca.
                    </p>
                </div>

                {/* TARJETA BUSCADOR */}
                <div className="card-base p-8 shadow-xl mb-10">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Ej. 19120158"
                                className="form-input pl-11 uppercase text-lg tracking-wide"
                                value={controlNumber}
                                onChange={(e) => setControlNumber(e.target.value)}
                                autoFocus
                            />
                            <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !controlNumber}
                            className="btn-primary px-8 py-3 text-lg flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Consultar'}
                        </button>
                    </form>
                </div>

                {/* LISTA DE RESULTADOS */}
                {hasSearched && (
                    <div className="space-y-6 animate-fade-in-up">
                        {results.length === 0 ? (
                            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sin resultados</h3>
                                <p className="text-gray-500 dark:text-gray-400">No encontramos solicitudes registradas con el número <span className="font-mono font-bold">{controlNumber}</span>.</p>
                            </div>
                        ) : (
                            results.map(app => (
                                <div key={app.id} className="card-base p-0 overflow-hidden border-l-4 border-l-guinda-600">
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                                                    {getBecaName(app.scholarship_id)}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <Clock size={14} /> Solicitado el: {new Date(app.created_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* ETIQUETA ESTATUS */}
                                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border shadow-sm
                                                ${app.status === 'Aprobada' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 
                                                  app.status === 'Rechazada' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 
                                                  app.status === 'Documentación Faltante' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                                  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                }`}
                                            >
                                                {app.status === 'Aprobada' && <CheckCircle size={16}/>}
                                                {app.status === 'Rechazada' && <XCircle size={16}/>}
                                                {app.status === 'Documentación Faltante' && <AlertTriangle size={16}/>}
                                                {app.status === 'Pendiente' && <Clock size={16}/>}
                                                {app.status}
                                            </div>
                                        </div>

                                        {/* COMENTARIOS ADMIN */}
                                        {app.admin_comments && (
                                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50 mt-4">
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <FileText size={14} /> Observaciones del Comité
                                                </p>
                                                <p className="text-gray-700 dark:text-gray-300 italic text-sm leading-relaxed">
                                                    "{app.admin_comments}"
                                                </p>
                                            </div>
                                        )}

                                        {/* MENSAJE DE ACCIÓN SI FALTAN DOCUMENTOS */}
                                        {app.status === 'Documentación Faltante' && (
                                            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-400 text-sm rounded-lg flex items-start gap-2 border border-yellow-100 dark:border-yellow-900/30">
                                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                                <span>
                                                    <strong>Acción requerida:</strong> Tu solicitud tiene observaciones. Por favor acude al Consejo Estudiantil o envía los documentos corregidos a la brevedad.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};