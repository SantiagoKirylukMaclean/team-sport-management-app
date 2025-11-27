import { Link } from "react-router-dom";
import { Users, Calendar, Trophy, BarChart3 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function CoachDashboard() {
    const { t } = useTranslation();

    const coachOptions = [
        {
            to: "/coach/players",
            label: t('nav.players'),
            description: "Gestiona y visualiza información de tus jugadores",
            icon: Users,
            color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
        },
        {
            to: "/coach/trainings",
            label: t('nav.training'),
            description: "Planifica y organiza sesiones de entrenamiento",
            icon: Calendar,
            color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
        },
        {
            to: "/coach/matches",
            label: t('nav.matches'),
            description: "Administra partidos y resultados del equipo",
            icon: Trophy,
            color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
        },
        {
            to: "/coach/evaluations",
            label: t('nav.evaluations') || 'Evaluaciones',
            description: "Evalúa el rendimiento de tus jugadores",
            icon: BarChart3,
            color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Panel de Coach</h2>
                <p className="text-muted-foreground">
                    Gestiona tu equipo y jugadores
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coachOptions.map(({ to, label, description, icon: Icon, color }) => (
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
