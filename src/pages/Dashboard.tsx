import React from 'react'

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel principal
        </p>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Hola</h2>
        <p className="text-muted-foreground">
          Este es tu dashboard principal donde puedes ver un resumen de toda la información importante.
        </p>
      </div>
    </div>
  )
}

export default Dashboard