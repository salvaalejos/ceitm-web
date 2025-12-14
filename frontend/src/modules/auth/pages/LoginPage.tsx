import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { login } from '../../../shared/services/api';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- 1. FUNCIÓN DE VALIDACIÓN PERSONALIZADA ---
  const validarEmail = (email: string) => {
    // Esta expresión regular verifica formato: texto@texto.texto
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- 2. VALIDACIÓN MANUAL ANTES DE ENVIAR ---
    if (!validarEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return; // Detenemos la función aquí, no molestamos al backend
    }

    if (!password) {
      setError('La contraseña es obligatoria.');
      return;
    }

    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.access_token);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      // Mensaje genérico por seguridad o específico si el backend lo dice
      setError('Credenciales incorrectas o usuario inactivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-gray-50 dark:bg-blue-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-blue-gray-800 rounded-xl shadow-xl p-8 border border-blue-gray-100 dark:border-blue-gray-700">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-guinda-600 dark:text-guinda-400">Iniciar Sesión</h2>
          <p className="text-blue-gray-500 dark:text-blue-gray-400 mt-2">Acceso al Panel del CEITM</p>
        </div>

        {/* Muestra tu error personalizado aquí */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* --- 3. AGREGAR noValidate AL FORM --- */}
        {/* Esto desactiva los mensajes automáticos del navegador */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm font-medium text-blue-gray-700 dark:text-blue-gray-300 mb-2">Correo Institucional</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-gray-400" size={20} />
              <input
                type="email"
                // Ya no necesitamos 'required' visual del navegador porque validamos manual
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-blue-gray-300 bg-white dark:bg-blue-gray-900 focus:ring-2 focus:ring-guinda-500 outline-none transition-all"
                placeholder="admin@ceitm.mx"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(''); // Limpiar error al escribir
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-gray-700 dark:text-blue-gray-300 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-gray-400" size={20} />
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-blue-gray-300 bg-white dark:bg-blue-gray-900 focus:ring-2 focus:ring-guinda-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-guinda-600 hover:bg-guinda-700 text-white font-bold rounded-lg shadow-md transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};