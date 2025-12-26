import { useEffect, useState } from 'react';
import {
    Inbox, Search, MessageSquare, CheckCircle, Filter, ChevronDown, Clock, XCircle, Trash2, Building
} from 'lucide-react';
import { getComplaints, getCareers, deleteComplaint } from '../../../shared/services/api';
import {type Complaint, ComplaintStatus, type Career } from '../../../shared/types';
import { ComplaintModal } from '../components/ComplaintModal';

export const AdminQuejas = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [careersList, setCareersList] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterCareer, setFilterCareer] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      setLoading(true);
      try {
          const [dataComplaints, dataCareers] = await Promise.all([
              getComplaints(),
              getCareers()
          ]);
          setComplaints(dataComplaints);
          setCareersList(dataCareers);
      } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleOpenModal = (complaint: Complaint) => {
      setSelectedComplaint(complaint);
      setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
      if (!confirm("¿Estás seguro de ELIMINAR este ticket permanentemente?")) return;
      try {
          await deleteComplaint(id);
          setComplaints(prev => prev.filter(c => c.id !== id));
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) { alert("Error al eliminar."); }
  };

  const filtered = complaints.filter(c => {
      const matchesStatus = filterStatus === 'Todos' || c.status === filterStatus;
      const matchesCareer = filterCareer === 'Todas' || c.career === filterCareer;
      const matchesSearch =
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.control_number.includes(searchTerm);
      return matchesStatus && matchesCareer && matchesSearch;
  });

  return (
    <div className="animate-fade-in pb-20">

        {/* --- HEADER --- */}
        <div className="flex flex-col gap-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-guinda-600 rounded-lg text-white shadow-lg shadow-guinda-900/20">
                        <Inbox size={24} />
                    </div>
                    Gestión de Tickets
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">
                    Administra y depura las solicitudes estudiantiles.
                </p>
            </div>

            {/* BARRA DE HERRAMIENTAS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">

                {/* 1. Tabs de Estado */}
                <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-full xl:w-auto overflow-x-auto no-scrollbar shrink-0">
                    {['Todos', ComplaintStatus.PENDIENTE, ComplaintStatus.RESUELTO, ComplaintStatus.RECHAZADO].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                                ${filterStatus === status 
                                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            {status === 'Todos' ? 'Todos' : status}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row w-full gap-3">

                    {/* 2. Filtro Carrera (DROPDOWN MEJORADO) */}
                    <div className="relative w-full md:w-72 group">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-guinda-600 transition-colors" size={16} />
                        <select
                            value={filterCareer}
                            onChange={(e) => setFilterCareer(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl
                                     bg-gray-50 dark:bg-slate-800
                                     border border-transparent dark:border-slate-700
                                     text-gray-700 dark:text-gray-200 text-sm font-medium
                                     focus:ring-2 focus:ring-guinda-500 focus:bg-white dark:focus:bg-slate-800
                                     appearance-none cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-slate-700/80"
                        >
                            <option value="Todas" className="dark:bg-slate-800">Todas las Carreras</option>
                            {careersList.map(c => (
                                <option key={c.id} value={c.name} className="dark:bg-slate-800 text-gray-900 dark:text-gray-200">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 transition-colors pointer-events-none" size={16} />
                    </div>

                    {/* 3. Buscador */}
                    <div className="relative w-full md:w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar folio, matrícula o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-guinda-500 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-700 dark:text-gray-200"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* --- LISTADO --- */}
        {loading ? (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinda-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando...</p>
            </div>
        ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Filter size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sin resultados</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Intenta ajustar los filtros de búsqueda.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {filtered.map(item => (
                    <div key={item.id} className="card-base p-0 overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-slate-800 group">

                        {/* Status Bar */}
                        <div className={`h-1.5 w-full ${
                            item.status === ComplaintStatus.RESUELTO ? 'bg-green-500' : 
                            item.status === ComplaintStatus.RECHAZADO ? 'bg-red-500' : 
                            'bg-amber-500'
                        }`} />

                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded text-white 
                                            ${item.type === 'Queja' ? 'bg-rose-500' : 'bg-blue-500'}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 rounded border border-gray-200 dark:border-slate-700">
                                            #{item.tracking_code}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {item.full_name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {item.career} <span className="text-gray-300 mx-1">|</span> {item.semester}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                                    {/* Botón Atender */}
                                    {(item.status === ComplaintStatus.PENDIENTE || item.status === ComplaintStatus.EN_PROCESO) && (
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="btn-primary py-2 px-4 text-sm flex items-center gap-2 shadow-lg shadow-guinda-900/10"
                                        >
                                            <MessageSquare size={16} /> Atender
                                        </button>
                                    )}

                                    {/* Badge Status */}
                                    {(item.status === ComplaintStatus.RESUELTO || item.status === ComplaintStatus.RECHAZADO) && (
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border
                                            ${item.status === ComplaintStatus.RESUELTO 
                                                ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' 
                                                : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                            }`}>
                                            {item.status === ComplaintStatus.RESUELTO ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {item.status}
                                        </div>
                                    )}

                                    {/* Botón Eliminar */}
                                    {(item.status === ComplaintStatus.RESUELTO || item.status === ComplaintStatus.RECHAZADO) && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                                            title="Eliminar registro"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Descripción y Respuesta */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 mb-4 border border-gray-100 dark:border-slate-800">
                                "{item.description}"
                            </div>

                            {item.admin_response && (
                                <div className="pl-4 border-l-2 border-guinda-200 dark:border-guinda-900 mb-4">
                                    <p className="text-xs font-bold text-guinda-600 dark:text-guinda-400 uppercase mb-1">Respuesta:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                        {item.admin_response}
                                    </p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-end text-xs text-gray-400 border-t border-gray-100 dark:border-slate-800 pt-3 mt-2">
                                <Clock size={12} className="mr-1" /> Creado el {new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <ComplaintModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            complaint={selectedComplaint}
            onSuccess={loadData}
        />
    </div>
  );
};