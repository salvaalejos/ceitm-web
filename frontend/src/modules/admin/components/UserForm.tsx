import { useState, useEffect } from 'react';
import {
    X, Upload, Save, User as UserIcon,
    Phone, Instagram, Loader2, Mail, Lock, Briefcase
} from 'lucide-react';
import { createUser, updateUser, uploadImage, getCareers } from '../../../shared/services/api';
import { getAreasByRole } from '../../../shared/constants/coordinaciones';
import type {Career} from '../../../shared/types'; // Asegúrate de tener el tipo Career
interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  area: string;
  career: string;
  imagen_url: string;
  is_active: boolean;
  phone_number?: string;
  instagram_url?: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

export const UserForm = ({ onClose, onSuccess, userToEdit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // 👇 Estado para el catálogo de carreras
  const [careerList, setCareerList] = useState<Career[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
    area: '',
    career: '',
    imagen_url: '',
    is_active: true,
    phone_number: '',
    instagram_url: ''
  });

  // Cargar Carreras de la BD al montar
  useEffect(() => {
      const fetchCareers = async () => {
          try {
              const data = await getCareers();
              setCareerList(data);
          } catch (error) {
              console.error("Error cargando carreras:", error);
          }
      };
      fetchCareers();
  }, []);

  // Cargar datos al editar
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        full_name: userToEdit.full_name || '',
        email: userToEdit.email || '',
        password: '',
        role: userToEdit.role || '',
        area: userToEdit.area || '',
        career: userToEdit.career || '',
        imagen_url: userToEdit.imagen_url || '',
        is_active: userToEdit.is_active !== undefined ? userToEdit.is_active : true,
        phone_number: userToEdit.phone_number || '',
        instagram_url: userToEdit.instagram_url || ''
      });
    }
  }, [userToEdit]);

  // --- LÓGICA INTELIGENTE: CAMBIO DE ROL ---
  const handleRoleChange = (newRole: string) => {
      if (!newRole) {
          setFormData(prev => ({ ...prev, role: '', area: '' }));
          return;
      }

      const areasValidas = getAreasByRole(newRole);
      const defaultArea = areasValidas.length > 0 ? areasValidas[0] : 'Ninguna';

      setFormData(prev => ({
          ...prev,
          role: newRole,
          area: defaultArea
      }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'role') {
        handleRoleChange(value);
    } else {
        // @ts-ignore
        const finalValue = type === 'checkbox' ? e.target.checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    try {
        const url = await uploadImage(file);
        setFormData(prev => ({ ...prev, imagen_url: url }));
    } catch (error) {
        console.error("Error subiendo imagen", error);
        alert('Error al subir la imagen');
    } finally {
        setUploadingImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) {
        alert("Por favor selecciona un Rol para el usuario.");
        return;
    }

    setLoading(true);
    try {
        const dataToSend: any = { ...formData };
        if (userToEdit && !dataToSend.password) delete dataToSend.password;

        if (userToEdit) {
            await updateUser(userToEdit.id, dataToSend);
        } else {
            if (!dataToSend.password) {
                alert("La contraseña es obligatoria para nuevos usuarios");
                setLoading(false);
                return;
            }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="card-base w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">

        <div className="modal-header shrink-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <UserIcon size={24} className="text-guinda-600" />
                {userToEdit ? 'Editar Usuario' : 'Nuevo Miembro'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <form id="user-form" onSubmit={handleSubmit} className="space-y-6">

                {/* FOTO DE PERFIL */}
                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                            {formData.imagen_url ? (
                                <img src={formData.imagen_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={48} className="text-gray-300 dark:text-slate-600" />
                            )}
                            {uploadingImg && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-white" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-guinda-600 hover:bg-guinda-700 text-white p-2 rounded-full shadow-md cursor-pointer transition-colors">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>

                {/* DATOS PERSONALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="form-label">Nombre Completo</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input name="full_name" value={formData.full_name} onChange={handleChange} required className="form-input pl-10" placeholder="Ej. Juan Pérez" />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Correo Institucional</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input pl-10" placeholder="usuario@morelia.tecnm.mx" />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">{userToEdit ? 'Nueva Contraseña' : 'Contraseña'}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required={!userToEdit} className="form-input pl-10" placeholder="••••••••" />
                        </div>
                    </div>
                </div>

                {/* CLASIFICACIÓN */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Rol y Ubicación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <label className="form-label">Jerarquía (Rol)</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={`form-input cursor-pointer ${!formData.role ? 'text-gray-500' : ''}`}
                            >
                                <option value="">-- Selecciona un Rol --</option>
                                <option value="estructura">Estructura</option>
                                <option value="coordinador">Coordinador</option>
                                <option value="vocal">Vocal</option>
                                <option value="concejal">Concejal</option>
                                <option value="admin_sys">SysAdmin</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Área / Coordinación</label>
                            <select
                                name="area"
                                value={formData.area}
                                onChange={handleChange}
                                className="form-input cursor-pointer disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-800"
                                disabled={!formData.role}
                            >
                                {!formData.role ? (
                                    <option value="">-- Primero selecciona Rol --</option>
                                ) : (
                                    getAreasByRole(formData.role).map(areaOption => (
                                        <option key={areaOption} value={areaOption}>{areaOption}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="form-label">Carrera (Asignada)</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    name="career"
                                    value={formData.career}
                                    onChange={handleChange}
                                    className="form-input pl-10 cursor-pointer"
                                >
                                    <option value="">-- Selecciona una carrera --</option>
                                    {/* 👇 AQUÍ MAPEA LAS CARRERAS DE LA BD */}
                                    {careerList.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Importante para Concejales: Define qué grupo de WhatsApp y solicitudes pueden ver.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CONTACTO */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Phone size={14} /> Contacto Público
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <label className="form-label">WhatsApp (10 dígitos)</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    name="phone_number"
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className="form-input pl-10"
                                    placeholder="4431234567"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Link de Instagram</label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    name="instagram_url"
                                    type="url"
                                    value={formData.instagram_url}
                                    onChange={handleChange}
                                    className="form-input pl-10"
                                    placeholder="https://instagram.com/usuario"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIVO */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                    <input
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="w-5 h-5 text-guinda-600 rounded focus:ring-guinda-500 cursor-pointer accent-guinda-600"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        Usuario Activo (Permitir acceso al sistema)
                    </label>
                </div>

            </form>
        </div>

        <div className="modal-footer shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">
                Cancelar
            </button>
            <button type="submit" form="user-form" disabled={loading || uploadingImg} className="btn-primary flex items-center gap-2">
                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
        </div>

      </div>
    </div>
  );
};