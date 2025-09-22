import React from 'react'

const Campeonato: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Campeonato</h1>
                <p className="text-muted-foreground">
                    Información y gestión del campeonato
                </p>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Gestión del Campeonato</h2>
                <p className="text-muted-foreground">
                    Administra toda la información relacionada con el campeonato, fixtures, resultados y estadísticas.
                </p>
            </div>
        </div>
    )
}

export default Campeonato