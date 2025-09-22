import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import './Login.css'

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
    <div className="login-container">
      {/* Encabezado superior */}
      <header className="login-header">
        <h1 className="login-title">
          Team Sports Manager
        </h1>
        <p className="login-subtitle">
          Sistema de gestión deportiva
        </p>
      </header>

      {/* Tarjeta de login */}
      <main className="login-card">
        <div className="login-card-header">
          <h2 className="login-card-title">
            Iniciar Sesión
          </h2>
          <p className="login-card-description">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="santiago.kiryluk@gmail.com"
              className="form-input"
              {...register('email')}
            />
            {errors.email && (
              <p className="error-message">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••••"
              className="form-input"
              {...register('password')}
            />
            {errors.password && (
              <p className="error-message">
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="error-container">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="login-button"
          >
            {isSubmitting ? 'Ingresando…' : 'Iniciar Sesión'}
          </button>
        </form>

        <footer className="login-footer">
          <p className="login-footer-text">
            ¿No tienes cuenta?{' '}
            <Link to="/signup" className="login-footer-link">
              Regístrate aquí
            </Link>
          </p>
        </footer>
      </main>
    </div>
  )
}

export default Login
