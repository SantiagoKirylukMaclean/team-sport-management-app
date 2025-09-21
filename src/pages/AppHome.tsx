import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const AppHome: React.FC = () => {
  const { user, role, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded p-6">
          <h1 className="text-xl font-semibold mb-2">Hola, {user?.email}</h1>
          <p className="text-sm text-gray-600 mb-4">Rol: {role ?? '—'}</p>

          {role === 'super_admin' && (
            <div role="region" aria-label="super-admin-panel" className="border rounded p-4 mb-4 bg-blue-50">
              <h2 className="text-lg font-bold">Panel de Super Admin</h2>
              <p>Acceso completo habilitado.</p>
            </div>
          )}

          <button
            onClick={signOut}
            className="w-full sm:w-auto rounded p-2 font-semibold bg-gray-800 text-white hover:bg-black"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppHome
