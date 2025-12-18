import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { Layout } from './shared/components/Layout'; // Layout Público
import { AdminLayout } from './modules/admin/layouts/AdminLayout'; // Layout Privado
import { LoginPage } from './modules/auth/pages/LoginPage';

// Pages Públicas
import { HomePage } from './modules/home/pages/HomePage';
import { ConcejalesPage } from './modules/home/pages/ConcejalesPage';
import { NoticiasPage } from './modules/news/pages/NoticiasPage';
import { NoticiaDetalle } from './modules/news/pages/NoticiaDetalle';
import { TransparenciaPage } from './modules/transparency/pages/TransparenciaPage';
import { ConveniosPage } from './modules/convenios/pages/ConveniosPage';

// Pages Admin
import { AdminConvenios } from './modules/admin/pages/AdminConvenios';
import { AdminUsuarios } from './modules/admin/pages/AdminUsuarios';
import { AdminNoticias } from './modules/admin/pages/AdminNoticias';
import { AdminDocumentos } from './modules/admin/pages/AdminDocumentos';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';

// Guard (Protector de Rutas)
import { ProtectedRoute } from './modules/auth/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="convenios" element={<ConveniosPage />} />
            <Route path="concejales" element={<ConcejalesPage />} />
            <Route path="noticias" element={<NoticiasPage />} />
            <Route path="noticias/:slug" element={<NoticiaDetalle />} />
            <Route path="transparencia" element={<TransparenciaPage />} />
          {/* ... otras rutas públicas ... */}
        </Route>

        {/* --- LOGIN --- */}
        <Route path="/login" element={<LoginPage />} />

        {/* ... BLOQUE DE RUTAS ADMIN ... */}
        <Route
            path="/admin"
            element={
                <ProtectedRoute>
                    <AdminLayout />
                </ProtectedRoute>
            }
        >
            {/* ESTA ES LA RUTA PRINCIPAL (DASHBOARD) */}
            <Route index element={<AdminDashboard />} />

            <Route path="convenios" element={<AdminConvenios />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="noticias" element={<AdminNoticias />} />
            <Route path="documentos" element={<AdminDocumentos />} />
        </Route>

        {/* 404 - Ruta no encontrada */}
        <Route path="*" element={<div className="p-10 text-center">404 - Página no encontrada</div>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;