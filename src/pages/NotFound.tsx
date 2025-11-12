import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const NotFound: React.FC = () => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow rounded p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
        <p className="text-gray-600 mb-4">
          La página que buscas no existe.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Serás redirigido al inicio en {countdown} segundos...
        </p>
        <Link className="text-blue-600 hover:underline" to="/dashboard">
          Ir al inicio ahora
        </Link>
      </div>
    </div>
  )
}

export default NotFound
