import { useState, useEffect } from 'react';
import { X, Upload, Save, User as UserIcon } from 'lucide-react';
import { createUser, updateUser, uploadImage } from '../../../shared/services/api';
import { CARRERAS } from '../../../shared/constants/carreras';

// Tipos manuales
interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  area: string;
  career: string;
  imagen_url: string;
  is_active: boolean;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

// --- REGLAS DE NEGOCIO: ÁREAS POR ROL ---
const AREAS_PERMITIDAS: Record<string, string[]> = {
    estructura: ['Presidencia', 'Secretaría General', 'Tesorería', 'Contraloría'],
    coordinador: ['Académico', 'Vinculación', 'Becas y Apoyos', 'Comunicación y Difusión', 'Eventos (SODECU)', 'Prevención y Logística', 'Marketing y Diseño'],
    vocal: ['Académico', 'Vinculación', 'Becas y Apoyos', 'Comunicación y Difusión', 'Eventos (SODECU)', 'Prevención y Logística', 'Marketing y Diseño', 'Consejo General'],
    concejal: ['Consejo General', 'Ninguna'],
    admin_sys: ['Sistemas']
};

export const UserForm = ({ onClose, onSuccess, userToEdit }: Props) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'vocal', // Rol por defecto
    area: 'Consejo General', // Área por defecto compatible con vocal
    career: '',
    imagen_url: '',
    is_active: true
  });

  // Cargar datos al editar
  useEffect(() => {
    if (userToEdit) {
      console.log("Datos recibidos para editar:", userToEdit); // <--- DEBUG: Mira la consola

      setFormData({
        full_name: userToEdit.full_name,
        email: userToEdit.email || '', // Si viene undefined, pon string vacío
        password: '',
        role: userToEdit.role,
        area: userToEdit.area,
        career: userToEdit.career || '',
        imagen_url: userToEdit.imagen_url || '',
        // AQUÍ ESTÁ LA CLAVE:
        // Si userToEdit.is_active es undefined, usaba true. Ahora forzamos que lea el valor real.
        is_active: userToEdit.is_active
      });
    }
  }, [userToEdit]);

  // --- LÓGICA INTELIGENTE: CAMBIO DE ROL ---
  // Si el usuario cambia el rol manualmente, reseteamos el área a la primera válida
  const handleRoleChange = (newRole: string) => {
      const areasValidas = AREAS_PERMITIDAS[newRole] || ['Ninguna'];
      setFormData(prev => ({
          ...prev,
          role: newRole,
          area: areasValidas[0] // Seleccionar automáticamente la primera opción válida
      }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'role') {
        handleRoleChange(value);
    } else {
        const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData({ ...formData, [name]: finalValue });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
        const url = await uploadImage(file);
        setFormData(prev => ({ ...prev, imagen_url: url }));
    } catch (error) {
        alert('Error subiendo imagen');
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const dataToSend: any = { ...formData };
        if (userToEdit && !dataToSend.password) delete dataToSend.password;

        if (userToEdit) {
            await updateUser(userToEdit.id, dataToSend);
        } else {
            await createUser(dataToSend);
        }
        onSuccess();
        onClose();
    } catch (error: any) {
        console.error(error);
        alert(error.response?.data?.detail || 'Error guardando usuario');
    } finally {
        setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-guinda-500 outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  // Calcular las opciones de área según el rol actual
  const currentAreaOptions = AREAS_PERMITIDAS[formData.role] || ['Ninguna'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">

        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-guinda-600 flex items-center gap-2">
                <UserIcon size={24} />
                {userToEdit ? 'Editar Usuario' : 'Nuevo Miembro'}
            </h2>
            <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">

            {/* FOTO DE PERFIL */}
            <div className="flex justify-center mb-6">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-md">
                        {formData.imagen_url ? (
                            <img src={formData.imagen_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                <UserIcon size={48} />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-guinda-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-guinda-700 transition-colors">
                        <Upload size={16} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="col-span-2">
                    <label className={labelClass}>Nombre Completo</label>
                    <input name="full_name" value={formData.full_name} onChange={handleChange} required className={inputClass} placeholder="Ej. Juan Pérez" />
                </div>

                <div>
                    <label className={labelClass}>Correo Institucional</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={`${inputClass} disabled:opacity-60`} />
                </div>

                <div>
                    <label className={labelClass}>{userToEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required={!userToEdit} className={inputClass} placeholder="••••••••" />
                </div>

                {/* --- ROL (Dispara el cambio de áreas) --- */}
                <div>
                    <label className={labelClass}>Jerarquía (Rol)</label>
                    <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                        <option value="vocal">Vocal</option>
                        <option value="concejal">Concejal</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="estructura">Estructura (Mesa Directiva)</option>
                        <option value="admin_sys">SysAdmin</option>
                    </select>
                </div>

                {/* --- ÁREA (Dinámica) --- */}
                <div>
                    <label className={labelClass}>Área / Coordinación</label>
                    <select name="area" value={formData.area} onChange={handleChange} className={inputClass}>
                        {currentAreaOptions.map(areaOption => (
                            <option key={areaOption} value={areaOption}>{areaOption}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2">
                    <label className={labelClass}>Carrera</label>
                    <select name="career" value={formData.career} onChange={handleChange} className={inputClass}>
                        <option value="">-- Selecciona una carrera --</option>
                        {CARRERAS.map(c => (
                            <option key={c.id} value={c.nombre}>{c.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Checkbox de Activo */}
                <div className="col-span-2 flex items-center gap-2 mt-2">
                    <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active} // <--- Debe leer formData.is_active
                        onChange={handleChange}
                        className="w-5 h-5 text-guinda-600 rounded focus:ring-guinda-500"
                    />
                    <label htmlFor="is_active" className="...">
                        Usuario Activo (Permitir acceso)
                    </label>
                </div>

            </div>
        </form>

        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-guinda-600 hover:bg-guinda-700 text-white rounded-lg flex items-center gap-2 shadow-md">
                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
        </div>

      </div>
    </div>
  );
};