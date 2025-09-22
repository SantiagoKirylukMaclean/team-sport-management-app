import { Link, useLocation } from "react-router-dom";
import { Trophy, Timer, Settings2, NotebookText, User, Menu, LogOut, LayoutDashboard, Shield, Users, UserCheck, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jugadores", label: "Jugadores", icon: UserCheck },
  { to: "/equipos", label: "Equipos", icon: Users },
  { to: "/entrenamiento", label: "Entrenamiento", icon: Timer },
  { to: "/asistencia", label: "Asistencia", icon: Settings2 },
  { to: "/campeonato", label: "Campeonato", icon: Trophy },
  { to: "/notes", label: "Notes", icon: NotebookText },
];

const adminItems = [
  { to: "/admin/equipos", label: "Equipos", icon: Users },
  { to: "/admin/jugadores", label: "Jugadores", icon: UserCheck },
  { to: "/admin/partidos", label: "Partidos", icon: Calendar },
];

export function Sidebar({ collapsed, onToggle }:{collapsed:boolean; onToggle:()=>void}) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const [adminExpanded, setAdminExpanded] = useState(false);
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
        
        {/* Admin Dropdown */}
        <div className="space-y-1">
          <button
            onClick={() => setAdminExpanded(!adminExpanded)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent w-full text-left",
              pathname.startsWith("/admin") ? "bg-accent" : "text-muted"
            )}
          >
            <Shield size={18}/>
            {!collapsed && (
              <>
                <span>Admin</span>
                <div className="ml-auto">
                  {adminExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </div>
              </>
            )}
          </button>
          
          {adminExpanded && !collapsed && (
            <div className="ml-6 space-y-1">
              {adminItems.map(({to,label,icon:Icon}) => {
                const active = pathname === to;
                return (
                  <Link key={to} to={to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent",
                      active ? "bg-accent" : "text-muted"
                    )}>
                    <Icon size={16}/>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
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
