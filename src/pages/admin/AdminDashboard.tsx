import { Link } from "react-router-dom";
import { Trophy, Building, Users, UserPlus, Mail, UserCog } from "lucide-react";

const adminOptions = [
  { 
    to: "/admin/sports", 
    label: "Deportes", 
    description: "Gestión de deportes del sistema",
    icon: Trophy,
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
  },
  { 
    to: "/admin/clubs", 
    label: "Clubs", 
    description: "Administración de clubs deportivos",
    icon: Building,
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
  },
  { 
    to: "/admin/teams", 
    label: "Teams", 
    description: "Gestión de equipos",
    icon: Users,
    color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
  },
  { 
    to: "/admin/users", 
    label: "Usuarios", 
    description: "Administrar usuarios, roles y permisos",
    icon: UserCog,
    color: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20"
  },
  { 
    to: "/admin/invite-user", 
    label: "Invite User", 
    description: "Invitar nuevos usuarios al sistema",
    icon: UserPlus,
    color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
  },
  { 
    to: "/admin/invitations", 
    label: "Invitations", 
    description: "Gestión de invitaciones enviadas",
    icon: Mail,
    color: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20"
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Panel de Administración</h2>
        <p className="text-muted-foreground">
          Gestiona todos los aspectos del sistema desde aquí
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
