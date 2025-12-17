import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { ConveniosPage } from './modules/convenios/pages/ConveniosPage';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { ProtectedRoute } from './modules/auth/components/ProtectedRoute';
import { AdminLayout } from './modules/admin/layouts/AdminLayout';
import { AdminConvenios } from './modules/admin/pages/AdminConvenios';
import { HomePage } from './modules/home/pages/HomePage';
import { AdminUsuarios } from './modules/admin/pages/AdminUsuarios';

// Componentes Admin Temporales
const DashboardHome = () => <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Resumen General 📊</h1>;


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
                <Route path="usuarios" element={<AdminUsuarios />} />
            </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;