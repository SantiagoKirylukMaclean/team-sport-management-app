import React from 'react'
import { Link } from 'react-router-dom'

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow rounded p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
        <Link className="text-blue-600 hover:underline" to="/login">Volver al login</Link>
      </div>
    </div>
  )
}

export default NotFound
