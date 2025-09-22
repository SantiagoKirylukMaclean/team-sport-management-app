import React from 'react'

const Jugadores: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jugadores</h1>
        <p className="text-muted-foreground">
          Gestión de jugadores
        </p>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Hola</h2>
      </div>
    </div>
  )
}

export default Jugadores