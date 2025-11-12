import { Link, useLocation } from "react-router-dom";
import { Trophy, Timer, Settings2, NotebookText, User, Menu, LogOut, LayoutDashboard, Shield, Users, UserCheck, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jugadores", label: "Jugadores", icon: UserCheck },
  { to: "/partidos", label: "Partidos", icon: Calendar },
  { to: "/entrenamiento", label: "Entrenamiento", icon: Timer },
  { to: "/asistencia", label: "Asistencia", icon: Settings2 },
  { to: "/campeonato", label: "Campeonato", icon: Trophy },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/evaluaciones", label: "Mis Evaluaciones", icon: BarChart3 },
  { to: "/notes", label: "Notes", icon: NotebookText },
];

export function Sidebar({ collapsed, onToggle }:{collapsed:boolean; onToggle:()=>void}) {
  const { pathname } = useLocation();
  const { signOut, role } = useAuth();
  
  // Only show admin section for super_admin users
  const showAdminSection = role === 'super_admin';
  // Show coach section for coach, admin, and super_admin users
  const showCoachSection = role === 'coach' || role === 'admin' || role === 'super_admin';
  return (
    <aside className={cn(
      "h-full bg-black/60 border-r border-border flex flex-col transition-[width] duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center h-14 px-3 justify-between">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-accent">
          <Menu size={18}/>
        </button>
        {!collapsed && <span className="text-sm font-medium">GOAT Racing</span>}
      </div>

      <nav className="px-2 space-y-1">
        {items.map(({to,label,icon:Icon}) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent",
                active ? "bg-accent" : "text-muted"
              )}>
              <Icon size={18}/>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
        
        {/* Coach Link - Visible for coach, admin, and super_admin users */}
        {showCoachSection && (
          <Link 
            to="/coach"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent",
              pathname.startsWith("/coach") ? "bg-accent" : "text-muted"
            )}
          >
            <Users size={18}/>
            {!collapsed && <span>Coach</span>}
          </Link>
        )}

        {/* Super Admin Link - Only visible for super_admin users */}
        {showAdminSection && (
          <Link 
            to="/admin"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent",
              pathname.startsWith("/admin") ? "bg-accent" : "text-muted"
            )}
          >
            <Shield size={18}/>
            {!collapsed && <span>Super Admin</span>}
          </Link>
        )}
      </nav>

      <div className="mt-auto p-2 space-y-1">
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent text-muted">
          <User size={18}/>
          {!collapsed && <span>Profile</span>}
        </Link>
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent text-muted w-full"
        >
          <LogOut size={18}/>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
