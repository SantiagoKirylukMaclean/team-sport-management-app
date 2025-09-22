import { Link, useLocation } from "react-router-dom";
import { Trophy, FlaskConical, Timer, Settings2, Wrench, NotebookText, User, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { to: "/standings", label: "Standings", icon: Trophy },
  { to: "/simulate", label: "Simulate Weekend", icon: FlaskConical },
  { to: "/timing", label: "Timing Analysis", icon: Timer },
  { to: "/test-config", label: "Test Configuration", icon: Settings2 },
  { to: "/parts", label: "Parts List", icon: Wrench },
  { to: "/notes", label: "Notes", icon: NotebookText },
];

export function Sidebar({ collapsed, onToggle }:{collapsed:boolean; onToggle:()=>void}) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
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
