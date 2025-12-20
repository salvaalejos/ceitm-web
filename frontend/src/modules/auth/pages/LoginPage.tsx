import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowLeft, Sun, Moon, LogIn, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../shared/store/authStore';
import { login, getCurrentUser } from '../../../shared/services/api';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado local para el tema (para el botón flotante)
  const [isDark, setIsDark] = useState(false);

  // Sincronizar estado del botón con el tema actual del sistema
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
        setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        setIsDark(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        setIsDark(true);
    }
  };

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. OBTENER TOKEN
      const tokenData = await login(formData.email, formData.password);
      const token = tokenData.access_token;

      // Guardamos el token primero (para que las siguientes peticiones ya vayan firmadas)
      setToken(token);

      // 2. OBTENER USUARIO (Usando el token que acabamos de guardar)
      // Esperamos un milisegundo para asegurar que el store se actualizó o pasamos el token manual si fuera necesario,
      // pero con el interceptor leyendo getState() debería funcionar directo.
      try {
          const userData = await getCurrentUser();
          setUser(userData);

          // 3. REDIRIGIR
          navigate('/admin'); // O a donde prefieras
      } catch (userError) {
          console.error("Error obteniendo perfil:", userError);
          // Si falla obtener el usuario, igual intentamos entrar o mostramos error específico
          setError('Token válido pero error cargando perfil.');
      }

    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">

      {/* FONDO DECORATIVO */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-guinda-600/10 dark:bg-guinda-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* BARRA SUPERIOR DE NAVEGACIÓN */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-guinda-600 dark:hover:text-guinda-400 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Volver al Inicio</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-guinda-600 transition-all shadow-sm"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
      </div>

      {/* TARJETA DE LOGIN */}
      <div className="card-base w-full max-w-md p-8 relative z-20 animate-fade-in shadow-2xl dark:shadow-black/50">

        {/* Header */}
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-guinda-100 dark:bg-guinda-900/30 text-guinda-700 dark:text-guinda-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <LogIn size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bienvenido de nuevo</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
                Acceso exclusivo para miembros del Consejo y Administración.
            </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center font-medium animate-pulse">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="form-label mb-1.5 ml-1">Correo Institucional</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="email"
                            required
                            className="form-input pl-11" // Padding extra para el ícono
                            placeholder="usuario@morelia.tecnm.mx"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="form-label mb-1.5 ml-1">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            required
                            className="form-input pl-11"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4 text-base"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
            </button>
        </form>

        {/* Footer del Card */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500">
                ¿Olvidaste tu contraseña? Contacta al <span className="text-guinda-600 dark:text-guinda-500 font-medium cursor-pointer hover:underline">SysAdmin</span>.
            </p>
        </div>
      </div>

    </div>
  );
};