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


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Usamos 'card-base' */}
      <div className="card-base w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header estandarizado */}
        <div className="modal-header">
            <h2 className="text-xl font-bold text-guinda-600 dark:text-guinda-500 flex items-center gap-2">
                <UserIcon size={24} />
                {userToEdit ? 'Editar Usuario' : 'Nuevo Miembro'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <X />
            </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">

            {/* FOTO DE PERFIL */}
            <div className="flex justify-center mb-2">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 shadow-md bg-gray-100 dark:bg-slate-950">
                        {formData.imagen_url ? (
                            <img src={formData.imagen_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-700">
                                <UserIcon size={48} />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-guinda-600 hover:bg-guinda-700 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-all active:scale-90">
                        <Upload size={18} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="col-span-2">
                    <label className="form-label">Nombre Completo</label>
                    <input name="full_name" value={formData.full_name} onChange={handleChange} required className="form-input" placeholder="Ej. Juan Pérez" />
                </div>

                <div>
                    <label className="form-label">Correo Institucional</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
                </div>

                <div>
                    <label className="form-label">{userToEdit ? 'Nueva Contraseña' : 'Contraseña'}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required={!userToEdit} className="form-input" placeholder="••••••••" />
                </div>

                <div>
                    <label className="form-label">Jerarquía (Rol)</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="form-input cursor-pointer">
                        <option value="vocal">Vocal</option>
                        <option value="concejal">Concejal</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="estructura">Estructura</option>
                        <option value="admin_sys">SysAdmin</option>
                    </select>
                </div>

                <div>
                    <label className="form-label">Área / Coordinación</label>
                    <select name="area" value={formData.area} onChange={handleChange} className="form-input cursor-pointer">
                        {AREAS_PERMITIDAS[formData.role]?.map(areaOption => (
                            <option key={areaOption} value={areaOption}>{areaOption}</option>
                        )) || <option value="Ninguna">Ninguna</option>}
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="form-label">Carrera</label>
                    <select name="career" value={formData.career} onChange={handleChange} className="form-input cursor-pointer">
                        <option value="">-- Selecciona una carrera --</option>
                        {CARRERAS.map(c => (
                            <option key={c.id} value={c.nombre}>{c.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Checkbox Corregido */}
                <div className="col-span-2">
                    <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 cursor-pointer hover:border-guinda-500/30 transition-colors">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-5 h-5 text-guinda-600 rounded focus:ring-guinda-500 accent-guinda-600"
                        />
                        <span className="form-check-label">
                            Usuario Activo (Permitir acceso al sistema)
                        </span>
                    </label>
                </div>

            </div>
        </form>

        {/* Footer estandarizado */}
        <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
        </div>

      </div>
    </div>
  );
};