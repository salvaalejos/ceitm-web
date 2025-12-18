import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define qué forma tiene tu usuario (ajusta según lo que devuelva tu backend)
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  // ... otros campos que necesites
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // Acciones
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token: string) =>
        set({ token, isAuthenticated: !!token }),

      setUser: (user: User) =>
        set({ user }),

      logout: () => {
        localStorage.removeItem('token'); // Limpiar token crudo si lo usabas
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', // Nombre para guardar en localStorage automáticamente
    }
  )
);