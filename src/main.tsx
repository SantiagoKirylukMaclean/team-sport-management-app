import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminGuard from "@/components/RouteGuards/AdminGuard";
import AdminLayout from "@/layouts/AdminLayout";

const Dashboard = React.lazy(()=>import("@/pages/Dashboard"));
const Entrenamiento = React.lazy(()=>import("@/pages/Entrenamiento"));
const Asistencia = React.lazy(()=>import("@/pages/Asistencia"));
const Campeonato = React.lazy(()=>import("@/pages/Campeonato"));
const Notes     = React.lazy(()=>import("@/pages/Notes"));
const Profile   = React.lazy(()=>import("@/pages/Profile"));
const Login     = React.lazy(()=>import("@/pages/Login"));
const Signup    = React.lazy(()=>import("@/pages/Signup"));
const Equipos   = React.lazy(()=>import("@/pages/Equipos"));
const Jugadores = React.lazy(()=>import("@/pages/Jugadores"));
const Partidos  = React.lazy(()=>import("@/pages/Partidos"));

// Admin pages
const SportsPage = React.lazy(()=>import("@/pages/admin/SportsPage"));
const ClubsPage = React.lazy(()=>import("@/pages/admin/ClubsPage"));
const TeamsPage = React.lazy(()=>import("@/pages/admin/TeamsPage"));

const withShell = (el: React.ReactNode) => <AppShell>{el}</AppShell>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }>
          <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/" element={withShell(<Dashboard/>)} />
          <Route path="/dashboard" element={withShell(<Dashboard/>)} />
          <Route path="/jugadores" element={withShell(<Jugadores/>)} />
          <Route path="/equipos" element={withShell(<Equipos/>)} />
          <Route path="/entrenamiento" element={withShell(<Entrenamiento/>)} />
          <Route path="/asistencia" element={withShell(<Asistencia/>)} />
          <Route path="/campeonato" element={withShell(<Campeonato/>)} />
          <Route path="/notes" element={withShell(<Notes/>)} />
          <Route path="/profile" element={withShell(<Profile/>)} />
          
          {/* Admin routes - protected by AdminGuard */}
          <Route path="/admin" element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }>
            <Route index element={<Navigate to="/admin/sports" replace />} />
            <Route path="sports" element={<SportsPage />} />
            <Route path="clubs" element={<ClubsPage />} />
            <Route path="teams" element={<TeamsPage />} />
          </Route>
          
          {/* Legacy admin routes - redirect to new structure */}
          <Route path="/admin/equipos" element={<Navigate to="/admin/teams" replace />} />
          <Route path="/admin/jugadores" element={withShell(<Jugadores/>)} />
          <Route path="/admin/partidos" element={withShell(<Partidos/>)} />
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
