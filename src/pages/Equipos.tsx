import React from 'react'

const Equipos: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
        <p className="text-muted-foreground">
          Gestión de equipos
        </p>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Gestión de Equipos</h2>
        <p className="text-muted-foreground">
          Administra la información de todos los equipos, formaciones, tácticas y configuraciones del equipo.
        </p>
      </div>
    </div>
  )
}

export default Equipos