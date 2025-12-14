import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { ConveniosPage } from './modules/convenios/pages/ConveniosPage';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { ProtectedRoute } from './modules/auth/components/ProtectedRoute';
import { AdminLayout } from './modules/admin/layouts/AdminLayout';
import { AdminConvenios } from './modules/admin/pages/AdminConvenios';

// Componentes Admin Temporales
const DashboardHome = () => <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Resumen General 📊</h1>;

// Home Público
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
    <h1 className="text-5xl font-bold text-guinda-600 mb-4">Bienvenido al CEITM</h1>
    <p className="text-xl text-blue-gray-600 max-w-2xl">Plataforma oficial del Consejo Estudiantil.</p>
    <div className="mt-8">
        <a href="/convenios" className="px-6 py-3 bg-guinda-600 text-white rounded-lg hover:bg-guinda-700 transition-colors shadow-lg">Ver Convenios</a>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* === ZONA PÚBLICA === */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="convenios" element={<ConveniosPage />} />
          <Route path="noticias" element={<div className="p-10 text-center">Noticias 🚧</div>} />
          <Route path="transparencia" element={<div className="p-10 text-center">Transparencia 🚧</div>} />
        </Route>

        {/* === LOGIN === */}
        <Route path="/login" element={<LoginPage />} />

        {/* === ZONA PRIVADA (ADMIN) === */}
        <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
                {/* Redirigir /admin a /admin/dashboard */}
                <Route index element={<Navigate to="/admin/dashboard" replace />} />

                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="convenios" element={<AdminConvenios />} />
            </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;