import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Menu, Trophy, Building, Users, ArrowLeft, UserPlus, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AdminLayout() {
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
  ];

  return (
    <div className="h-full flex">
      {/* Admin Sidebar */}
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
          {!collapsed && <span className="text-sm font-medium">{t('admin.panel')}</span>}
        </div>

        {/* Navigation */}
        <nav className="px-2 space-y-1 flex-1">
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
        {/* Admin Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">{t('admin.title')}</h1>
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