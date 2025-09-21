import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'

const schema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})

type FormValues = z.infer<typeof schema>

const Signup: React.FC = () => {
  const { signUp } = useAuth()
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
      await signUp(values.email, values.password)
    } catch (err: any) {
      setError('root', { 
        type: 'server', 
        message: err?.message ?? 'Ocurrió un error al crear la cuenta' 
      })
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex flex-col items-center justify-center px-4 py-10">
      {/* Encabezado superior */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Sports Team Manager
        </h1>
        <p className="text-xl text-slate-600">Sistema de gestión deportiva</p>
      </div>

      {/* Card principal */}
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-slate-600 text-base">
            Regístrate para acceder al sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-900 font-medium text-base">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="h-12 text-base bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-900 font-medium text-base">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                className="h-12 text-base bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-base rounded-lg"
            >
              {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-slate-600">
              ¿Ya tienes cuenta?{' '}
              <Link 
                to="/login" 
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Signup
