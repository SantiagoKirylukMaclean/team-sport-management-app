import React from 'react'

const Asistencia: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Asistencia</h1>
                <p className="text-muted-foreground">
                    Control de asistencia de jugadores y entrenamientos
                </p>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Registro de Asistencia</h2>
                <p className="text-muted-foreground">
                    Lleva un control detallado de la asistencia de los jugadores a entrenamientos y partidos.
                </p>
            </div>
        </div>
    )
}

export default Asistencia