import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})

type FormValues = z.infer<typeof schema>

const Login: React.FC = () => {
  const { signIn } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema), 
    defaultValues: { email: '', password: '' } 
  })

  const onSubmit = async (values: FormValues) => {
    clearErrors('root')
    try {
      await signIn(values.email, values.password)
    } catch (err: any) {
      setError('root', { 
        type: 'server', 
        message: err?.message ?? 'Ocurrió un error al iniciar sesión' 
      })
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex flex-col items-center justify-center px-4 py-10">
      {/* Encabezado superior */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-black mb-4">
          Sports Team Manager
        </h1>
        <p className="text-xl text-gray-600">Sistema de gestión deportiva</p>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-black mb-3">
            Iniciar Sesión
          </h2>
          <p className="text-gray-600 text-lg">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-black font-semibold text-lg mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="w-full h-14 px-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition-all"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-black font-semibold text-lg mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full h-14 px-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition-all"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="text-red-600 text-center bg-red-50 p-3 rounded-lg">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-black hover:bg-gray-800 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Ingresando…' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link 
              to="/signup" 
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
