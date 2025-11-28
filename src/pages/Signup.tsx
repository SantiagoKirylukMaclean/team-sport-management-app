import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'

const Signup = () => {
  const { t } = useTranslation()

  const schema = z.object({
    email: z.string().email({ message: t('auth.invalidEmail') }),
    password: z.string().min(6, {
      message: t('auth.passwordTooShort', { min: 6 }),
    }),
  })

  type FormValues = z.infer<typeof schema>

  const { signUp } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: FormValues) => {
    clearErrors('root')
    try {
      await signUp(values.email, values.password)
    } catch (err: any) {
      setError('root', {
        type: 'server',
        message: err?.message ?? t('auth.signupError'),
      })
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex flex-col items-center justify-center px-4 py-10">
      {/* Encabezado superior */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Team Sport Manager
        </h1>
        <p className="text-xl text-slate-600">{t('auth.subtitle')}</p>
      </div>

      {/* Card principal */}
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
            {t('auth.createAccount')}
          </CardTitle>
          <CardDescription className="text-slate-600 text-base">
            {t('auth.signupPrompt')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-slate-900 font-medium text-base"
              >
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="h-12 text-base bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-slate-900 font-medium text-base"
              >
                {t('auth.password')}
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
              {isSubmitting
                ? t('auth.creatingAccount')
                : t('auth.register')}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-slate-600">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Signup
