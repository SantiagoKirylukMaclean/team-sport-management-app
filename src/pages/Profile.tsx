import React from 'react'

const Profile: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Gestión de perfil de usuario
        </p>
      </div>
      
      <div className="bg-card rounded-lg p-6">
        <p className="text-muted-foreground">
          Página de perfil en desarrollo...
        </p>
      </div>
    </div>
  )
}

export default Profile