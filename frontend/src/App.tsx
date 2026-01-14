import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Layout } from './shared/components/Layout';
import { AdminLayout } from './modules/admin/layouts/AdminLayout';
import { LoginPage } from './modules/auth/pages/LoginPage';

// Pages Públicas
import { HomePage } from './modules/home/pages/HomePage';
import { ConcejalesPage } from './modules/home/pages/ConcejalesPage';
import { NoticiasPage } from './modules/news/pages/NoticiasPage';
import { NoticiaDetalle } from './modules/news/pages/NoticiaDetalle';
import { TransparenciaPage } from './modules/transparency/pages/TransparenciaPage';
import { ConveniosPage } from './modules/convenios/pages/ConveniosPage';
import { BuzonPage } from './modules/transparency/pages/BuzonPage';
import { BecasPage } from './modules/scholarships/pages/BecasPage';
import { SolicitudPage } from './modules/scholarships/pages/SolicitudPage';
import { ResultadosBecaPage } from './modules/scholarships/pages/ResultadosBecaPage';
import MapPage from './modules/map/pages/MapPage'; // <--- 1. AGREGAR ESTE IMPORT

// Pages Admin
import { AdminConvenios } from './modules/admin/pages/AdminConvenios';
import { AdminUsuarios } from './modules/admin/pages/AdminUsuarios';
import { AdminNoticias } from './modules/admin/pages/AdminNoticias';
import { AdminDocumentos } from './modules/admin/pages/AdminDocumentos';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { AdminQuejas } from './modules/admin/pages/AdminQuejas';
import AdminBecas from './modules/admin/pages/AdminBecas';
import { AdminLogs } from "./modules/admin/pages/AdminLogs.tsx";
import { AdminProfile } from './modules/admin/pages/AdminProfile';
import { AdminCarreras } from './modules/admin/pages/AdminCarreras';

import { ProtectedRoute } from './modules/auth/components/ProtectedRoute';
import RouteTracker from './shared/components/RouteTracker';
import {ReloadPrompt} from "./shared/components/ReloadPrompt.tsx";

function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="convenios" element={<ConveniosPage />} />
            <Route path="concejales" element={<ConcejalesPage />} />
            <Route path="noticias" element={<NoticiasPage />} />
            <Route path="noticias/:slug" element={<NoticiaDetalle />} />
            <Route path="transparencia" element={<TransparenciaPage />} />
            <Route path="buzon" element={<BuzonPage />} />
            <Route path="becas" element={<BecasPage />} />
            <Route path="becas/resultados" element={<ResultadosBecaPage />} />
            <Route path="becas/aplicar/:id" element={<SolicitudPage />} />

            {/* NUEVA RUTA DEL MAPA */}
            <Route path="mapa" element={<MapPage />} />

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
            <Route index element={<AdminDashboard />} />
            <Route path="convenios" element={<AdminConvenios />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="noticias" element={<AdminNoticias />} />
            <Route path="documentos" element={<AdminDocumentos />} />
            <Route path="perfil" element={<AdminProfile />} />
            <Route path="quejas" element={<AdminQuejas />} />
            <Route path="becas" element={<AdminBecas />} />
            <Route path="auditoria" element={<AdminLogs />} />
            <Route path="carreras" element={<AdminCarreras />} />
        </Route>

        <Route path="*" element={<div className="p-10 text-center">404 - Página no encontrada</div>} />
      </Routes>
      <ReloadPrompt />
    </BrowserRouter>
  );
}

export default App;