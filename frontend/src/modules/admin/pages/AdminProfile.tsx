import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Instagram, Save, Lock,
    Upload, Camera, ShieldCheck, Loader2
} from 'lucide-react';
import { useAuthStore } from '../../../shared/store/authStore';
import { updateProfile, uploadImage, getCurrentUser } from '../../../shared/services/api';

export const AdminProfile = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // Estado del formulario
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    instagram_url: '',
    imagen_url: ''
  });

  const [passData, setPassData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            instagram_url: user.instagram_url || '',
            imagen_url: user.imagen_url || ''
        });
    }
  }, [user]);

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Actualizamos en backend
        await updateProfile(formData);

        // Refrescamos los datos en local (Store)
        const updatedUser = await getCurrentUser();
        setUser(updatedUser);

        alert("Perfil actualizado correctamente");
    } catch (error) {
        console.error(error);
        alert("Error al actualizar perfil");
    } finally {
        setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.password !== passData.confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }
    if (passData.password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    setLoading(true);
    try {
        await updateProfile({ password: passData.password });
        setPassData({ password: '', confirmPassword: '' });
        alert("Contraseña actualizada. Úsala en tu próximo inicio de sesión.");
    } catch (error) {
        console.error(error);
        alert("Error al cambiar contraseña");
    } finally {
        setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const url = await uploadImage(file);
        setFormData(prev => ({ ...prev, imagen_url: url }));
        // Guardado automático al subir foto
        await updateProfile({ imagen_url: url });

        // Actualizar store
        const updatedUser = await getCurrentUser();
        setUser(updatedUser);

    } catch (error) {
        console.error(error);
        alert("Error subiendo imagen");
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">

        {/* HEADER */}
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
            <p className="text-gray-500 dark:text-gray-400">Administra tu información personal y seguridad.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* COLUMNA IZQUIERDA: TARJETA DE RESUMEN */}
            <div className="md:col-span-1 space-y-6">
                <div className="card-base p-6 text-center">
                    <div className="relative inline-block mb-4 group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl bg-gray-100 mx-auto">
                            {formData.imagen_url ? (
                                <img src={formData.imagen_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-6 text-gray-300" />
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-white" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-guinda-600 text-white rounded-full cursor-pointer hover:bg-guinda-700 transition-colors shadow-lg">
                            <Camera size={18} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
                    <span className="inline-block mt-1 px-3 py-1 bg-guinda-50 dark:bg-guinda-900/30 text-guinda-700 dark:text-guinda-400 text-xs font-bold uppercase tracking-wider rounded-full">
                        {user?.role}
                    </span>
                    <p className="text-sm text-gray-500 mt-2">{user?.area}</p>
                </div>

                {/* MENÚ LATERAL (TABS) */}
                <div className="card-base overflow-hidden">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${activeTab === 'general' ? 'bg-guinda-50 dark:bg-guinda-900/20 text-guinda-700 dark:text-guinda-400 font-medium border-l-4 border-guinda-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <User size={20} /> Información General
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${activeTab === 'security' ? 'bg-guinda-50 dark:bg-guinda-900/20 text-guinda-700 dark:text-guinda-400 font-medium border-l-4 border-guinda-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <ShieldCheck size={20} /> Seguridad
                    </button>
                </div>
            </div>

            {/* COLUMNA DERECHA: FORMULARIOS */}
            <div className="md:col-span-2">
                <div className="card-base p-8">

                    {activeTab === 'general' ? (
                        <form onSubmit={handleGeneralSubmit} className="space-y-6 animate-fade-in">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <User size={20} className="text-guinda-600" /> Editar Información
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="form-label">Nombre Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                            className="form-input pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Correo Institucional</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="form-input pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">WhatsApp (Contacto Público)</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                                className="form-input pl-10"
                                                placeholder="443..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">Instagram (URL)</label>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                value={formData.instagram_url}
                                                onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                                                className="form-input pl-10"
                                                placeholder="https://instagram.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                    <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSecuritySubmit} className="space-y-6 animate-fade-in">
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-guinda-600" /> Cambiar Contraseña
                            </h3>

                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-400 text-sm rounded-lg border border-amber-100 dark:border-amber-900/20 mb-6">
                                Usa una contraseña segura. Al cambiarla, tendrás que usar la nueva la próxima vez que inicies sesión.
                            </div>

                            <div>
                                <label className="form-label">Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={passData.password}
                                        onChange={(e) => setPassData({...passData, password: e.target.value})}
                                        className="form-input pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Confirmar Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={passData.confirmPassword}
                                        onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                                        className="form-input pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                    <Save size={18} /> {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};