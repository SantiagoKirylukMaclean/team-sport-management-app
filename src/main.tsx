import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";
import "./i18n/config"; // Inicializa i18n
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminGuard from "@/components/RouteGuards/AdminGuard";
import CoachGuard from "@/components/RouteGuards/CoachGuard";
import { AdminLayout } from "@/layouts/AdminLayout";
import { CoachLayout } from "@/layouts/CoachLayout";

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Entrenamiento = React.lazy(() => import("@/pages/Entrenamiento"));
const Asistencia = React.lazy(() => import("@/pages/Asistencia"));
const Campeonato = React.lazy(() => import("@/pages/Campeonato"));
const Notes = React.lazy(() => import("@/pages/Notes"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const Login = React.lazy(() => import("@/pages/Login"));
const Signup = React.lazy(() => import("@/pages/Signup"));
const SetPassword = React.lazy(() => import("@/pages/SetPassword"));
const Partidos = React.lazy(() => import("@/pages/Partidos"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

// Admin pages
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const SportsPage = React.lazy(() => import("@/pages/admin/SportsPage"));
const ClubsPage = React.lazy(() => import("@/pages/admin/ClubsPage"));
const TeamsPage = React.lazy(() => import("@/pages/admin/TeamsPage"));
const UsersPage = React.lazy(() => import("@/pages/admin/UsersPage"));
const InviteUserPage = React.lazy(() => import("@/pages/admin/InviteUserPage"));
const InvitePlayerPage = React.lazy(() => import("@/pages/admin/InvitePlayerPage"));
const InvitationManagementPage = React.lazy(() => import("@/pages/admin/InvitationManagementPage"));

// Coach pages
const CoachDashboard = React.lazy(() => import("@/pages/coach/CoachDashboard"));
const PlayersPage = React.lazy(() => import("@/pages/coach/PlayersPage"));
const TrainingsPage = React.lazy(() => import("@/pages/coach/TrainingsPage"));
const MatchesPage = React.lazy(() => import("@/pages/coach/MatchesPage"));

// Stats page (accessible to all roles)
const PlayerMatchStatsPage = React.lazy(() => import("@/pages/PlayerMatchStatsPage"));
const StatisticsPage = React.lazy(() => import("@/pages/coach/StatisticsPage"));
const MyEvaluations = React.lazy(() => import("@/pages/MyEvaluations"));
const PlayerEvaluationsPage = React.lazy(() => import("@/pages/coach/PlayerEvaluationsPage"));

const withShell = (el: React.ReactNode) => <AppShell>{el}</AppShell>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/reset-password" element={<SetPassword />} /> {/* Alias for password recovery */}

            {/* Protected main app routes */}
            <Route path="/" element={withShell(<Dashboard />)} />
            <Route path="/dashboard" element={withShell(<Dashboard />)} />
            <Route path="/partidos" element={withShell(<Partidos />)} />
            <Route path="/entrenamiento" element={withShell(<Entrenamiento />)} />
            <Route path="/asistencia" element={withShell(<Asistencia />)} />
            <Route path="/campeonato" element={withShell(<Campeonato />)} />
            <Route path="/estadisticas" element={withShell(<StatisticsPage />)} />
            <Route path="/evaluaciones" element={withShell(<MyEvaluations />)} />
            <Route path="/notes" element={withShell(<Notes />)} />
            <Route path="/profile" element={withShell(<Profile />)} />

            {/* Admin routes - protected by AdminGuard */}
            <Route path="/admin" element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="sports" element={<SportsPage />} />
              <Route path="clubs" element={<ClubsPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="invite-user" element={<InviteUserPage />} />
              <Route path="invite-player" element={<InvitePlayerPage />} />
              <Route path="invitations" element={<InvitationManagementPage />} />
            </Route>

            {/* Coach routes - protected by CoachGuard */}
            <Route path="/coach" element={
              <CoachGuard>
                <CoachLayout />
              </CoachGuard>
            }>
              <Route index element={<CoachDashboard />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="trainings" element={<TrainingsPage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="evaluations" element={<PlayerEvaluationsPage />} />
            </Route>

            {/* Legacy admin routes - redirect to new structure */}
            <Route path="/admin/equipos" element={<Navigate to="/admin/teams" replace />} />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
