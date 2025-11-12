import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Menu, Users, ArrowLeft, Calendar, Trophy, BarChart3, Building, UserPlus, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function CoachLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const adminNavItems = [
    { to: "/admin/sports", label: t('admin.sports'), icon: Trophy },
    { to: "/admin/clubs", label: t('admin.clubs'), icon: Building },
    { to: "/admin/teams", label: t('admin.teams'), icon: Users },
    { to: "/admin/invite-user", label: t('admin.inviteCoachAdmin'), icon: UserPlus },
    { to: "/admin/invite-player", label: t('admin.invitePlayer'), icon: Users },
    { to: "/admin/invitations", label: t('admin.invitations'), icon: Mail },
    { to: "/admin/users", label: t('admin.users') || 'Usuarios', icon: Users },
  ];

  const coachNavItems = [
    { to: "/coach/players", label: t('nav.players'), icon: Users },
    { to: "/coach/trainings", label: t('nav.training'), icon: Calendar },
    { to: "/coach/matches", label: t('nav.matches'), icon: Trophy },
    { to: "/coach/evaluations", label: t('nav.evaluations') || 'Evaluaciones', icon: BarChart3 },
    { to: "/estadisticas", label: t('nav.statistics'), icon: BarChart3 },
  ];

  return (
    <div className="h-full flex">
      {/* Coach Sidebar */}
      <aside className={cn(
        "h-full bg-black/60 border-r border-border flex flex-col transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center h-14 px-3 justify-between">
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-2 rounded-lg hover:bg-accent"
          >
            <Menu size={18}/>
          </button>
          {!collapsed && <span className="text-sm font-medium">Panel Coach</span>}
        </div>

        {/* Navigation */}
        <nav className="px-2 space-y-1 flex-1">
          {/* Admin Links */}
          {!collapsed && (
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-2">
              ADMINISTRACIÓN
            </div>
          )}
          {adminNavItems.map(({to, label, icon: Icon}) => {
            const active = pathname === to;
            return (
              <Link 
                key={to} 
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent",
                  active ? "bg-accent" : "text-muted"
                )}
              >
                <Icon size={18}/>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}

          {/* Divider */}
          {!collapsed && (
            <div className="border-t border-border my-3"></div>
          )}
          {!collapsed && (
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
              COACH
            </div>
          )}

          {/* Coach Links */}
          {coachNavItems.map(({to, label, icon: Icon}) => {
            const active = pathname === to;
            return (
              <Link 
                key={to} 
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent",
                  active ? "bg-accent" : "text-muted"
                )}
              >
                <Icon size={18}/>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Back to Main App */}
        <div className="p-2">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent text-muted"
          >
            <ArrowLeft size={18}/>
            {!collapsed && <span>{t('common.back')}</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Coach Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">{t('nav.dashboard')}</h1>
          <LanguageSwitcher />
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}