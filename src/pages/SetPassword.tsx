import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  confirmPassword: z
    .string()
    .min(6, { message: 'Confirma tu contraseña' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

const SetPassword: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    const verifyRecoveryToken = async () => {
      try {
        // Get the recovery token from URL
        const accessToken = searchParams.get('access_token')
        const type = searchParams.get('type')

        if (!accessToken || type !== 'recovery') {
          setError('Link de invitación inválido o expirado')
          setVerifying(false)
          return
        }

        // Verify the session with the token
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: searchParams.get('refresh_token') || '',
        })

        if (sessionError || !data.user) {
          setError('Link de invitación inválido o expirado')
          setVerifying(false)
          return
        }

        setEmail(data.user.email || null)
        setVerifying(false)
      } catch (err) {
        console.error('Error verifying recovery token:', err)
        setError('Error al verificar el link de invitación')
        setVerifying(false)
      }
    }

    verifyRecoveryToken()
  }, [searchParams])

  const onSubmit = async (values: FormValues) => {
    try {
      setError(null)

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (updateError) throw updateError

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('Error setting password:', err)
      setFormError('root', {
        type: 'server',
        message: err?.message ?? 'Error al establecer la contraseña',
      })
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-0">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-slate-600">Verificando invitación...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
              variant="outline"
            >
              Ir a Inicio de Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-0">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              ¡Contraseña Establecida!
            </h2>
            <p className="text-slate-600 text-center">
              Tu cuenta ha sido activada correctamente.
              <br />
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Bienvenido
        </h1>
        <p className="text-lg text-slate-600">
          Establece tu contraseña para activar tu cuenta
        </p>
      </div>

      <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
            Crear Contraseña
          </CardTitle>
          {email && (
            <CardDescription className="text-slate-600 text-base">
              Cuenta: {email}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-900 font-medium text-base">
                Nueva Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="h-12 text-base bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-900 font-medium text-base">
                Confirmar Contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                className="h-12 text-base bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-base rounded-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estableciendo Contraseña...
                </>
              ) : (
                'Establecer Contraseña'
              )}
            </Button>
          </form>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Una vez que establezcas tu contraseña, podrás acceder a tu cuenta y cambiarla cuando quieras desde tu perfil.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SetPassword
