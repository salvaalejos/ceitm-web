import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../shared/store/authStore';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Leemos directamente del store si hay token y usuario
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Si no hay token o no hay usuario cargado, va para afuera
  if (!token || !user) {
    // replace y state ayudan a volver a la página intentada después de loguearse
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};