import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { Routes, Route } from "react-router-dom";

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

const withShell = (el: React.ReactNode) => <AppShell>{el}</AppShell>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="/admin/equipos" element={withShell(<Equipos/>)} />
          <Route path="/admin/jugadores" element={withShell(<Jugadores/>)} />
          <Route path="/admin/partidos" element={withShell(<Partidos/>)} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
