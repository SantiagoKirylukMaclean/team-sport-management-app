import React from 'react'

const Notes: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Notas</h1>
                <p className="text-muted-foreground">
                    Notas
                </p>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Registro de Notas</h2>
                <p className="text-muted-foreground">
                    Lleva un control de notas
                </p>
            </div>
        </div>
    )
}

export default Notes