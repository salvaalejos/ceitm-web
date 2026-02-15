import { useState, useEffect } from 'react';
import {
  Search, ShieldAlert, ShieldCheck,
  Download, History
} from 'lucide-react';
import { getStudents, updateStudentStatus, downloadExpediente } from '../../../shared/services/api';
import Swal from 'sweetalert2';

export default function AdminBecarios() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error("Error al cargar becarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlacklist = async (student: any) => {
    const action = student.is_blacklisted ? 'quitar de' : 'mandar a';
    const result = await Swal.fire({
      title: `¿Confirmar acción?`,
      text: `Vas a ${action} la lista negra a ${student.full_name}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: student.is_blacklisted ? '#10b981' : '#ef4444',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await updateStudentStatus(student.control_number, { is_blacklisted: !student.is_blacklisted });
        loadStudents();
        Swal.fire('Actualizado', 'El estatus del alumno ha cambiado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo actualizar el estatus.', 'error');
      }
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.control_number.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expedientes de Becarios</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Historial unificado, folios de liberación y control de lista negra.
        </p>
      </header>

      {/* BUSCADOR */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o número de control..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-guinda-500 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA DE EXPEDIENTES */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Alumno</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Carrera / Contacto</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Historial</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Lista Negra</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Expediente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400">Cargando becarios...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400">No se encontraron expedientes</td></tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.control_number} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">{student.full_name}</span>
                      <span className="text-xs font-mono text-gray-500">{student.control_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex flex-col">
                      <span>{student.career}</span>
                      <span className="text-[10px] text-gray-400">{student.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      title="Ver solicitudes pasadas"
                    >
                      <History size={14} /> {student.applications?.length || 0} Solicitudes
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleBlacklist(student)}
                      className={`p-2 rounded-lg transition-colors ${
                        student.is_blacklisted 
                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20' 
                        : 'bg-green-50 text-green-600 dark:bg-green-900/20'
                      }`}
                    >
                      {student.is_blacklisted ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => downloadExpediente(student.applications[0]?.id, student.control_number)}
                      disabled={!student.applications?.length}
                      className="btn-secondary py-1 px-3 text-xs flex items-center gap-2 ml-auto disabled:opacity-30"
                    >
                      <Download size={14} /> Descargar PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}