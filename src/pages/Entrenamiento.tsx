import React from 'react'

const Entrenamiento: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Entrenamiento</h1>
                <p className="text-muted-foreground">
                    Gestiona las sesiones de entrenamiento del equipo
                </p>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Sesiones de Entrenamiento</h2>
                <p className="text-muted-foreground">
                    Aquí puedes programar, gestionar y hacer seguimiento de las sesiones de entrenamiento del equipo.
                </p>
            </div>
        </div>
    )
}

export default Entrenamiento