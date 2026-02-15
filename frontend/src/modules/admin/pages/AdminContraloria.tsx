import React from 'react';
import { ShieldCheck, Calendar, ClipboardList } from 'lucide-react';
import WeeklyScheduleGrid from '../components/WeeklyScheduleGrid';
import { SanctionsManager } from '../components/SanctionsManager';

const AdminContraloria: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header de la Página - Siguiendo tu estilo Hero */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="text-guinda-600" size={32} />
            Módulo de Contraloría
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de control interno, disciplina y cumplimiento de horarios.
          </p>
        </div>
      </div>

      {/* Grid de Secciones */}
      <div className="grid grid-cols-1 gap-8">

        {/* SECCIÓN 1: HORARIOS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-slate-800 pb-4">
            <Calendar className="text-blue-500" size={20} />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Gestión de Guardias</h3>
          </div>
          <WeeklyScheduleGrid />
        </div>

        {/* SECCIÓN 2: SANCIONES */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-slate-800 pb-4">
            <ClipboardList className="text-guinda-600" size={20} />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Panel de Sanciones</h3>
          </div>
          <SanctionsManager />
        </div>

      </div>
    </div>
  );
};

export default AdminContraloria;