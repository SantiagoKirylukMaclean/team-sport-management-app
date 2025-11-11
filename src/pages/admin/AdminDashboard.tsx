import { Link } from "react-router-dom";
import { Trophy, Building, Users, UserPlus, Mail, UserCog } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function AdminDashboard() {
  const { t } = useTranslation();

  const adminOptions = [
    { 
      to: "/admin/sports", 
      label: t('admin.sports'),
      description: t('admin.sportsManagement'),
      icon: Trophy,
      color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
    },
    { 
      to: "/admin/clubs", 
      label: t('admin.clubs'),
      description: t('admin.clubsManagement'),
      icon: Building,
      color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
    },
    { 
      to: "/admin/teams", 
      label: t('admin.teams'),
      description: t('admin.teamsManagement'),
      icon: Users,
      color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
    },
    { 
      to: "/admin/users", 
      label: t('users.title'),
      description: t('admin.usersManagement'),
      icon: UserCog,
      color: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20"
    },
    { 
      to: "/admin/invite-user", 
      label: t('admin.inviteCoachAdmin'),
      description: t('admin.inviteNewUsers'),
      icon: UserPlus,
      color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
    },
    { 
      to: "/admin/invite-player", 
      label: t('admin.invitePlayer'),
      description: t('admin.invitePlayersDescription'),
      icon: Users,
      color: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20"
    },
    { 
      to: "/admin/invitations", 
      label: t('admin.invitations'),
      description: t('admin.manageInvitations'),
      icon: Mail,
      color: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('admin.panel')}</h2>
        <p className="text-muted-foreground">
          {t('admin.manageSystem')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminOptions.map(({ to, label, description, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className={`p-6 rounded-lg border transition-colors ${color}`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-background/50">
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{label}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
