import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()

  const schema = z.object({
    email: z.string().email({ message: t('auth.invalidEmail') }),
    password: z.string().min(6, {
      message: t('auth.passwordTooShort', { min: 6 }),
    }),
  })

  type FormValues = z.infer<typeof schema>

  const { signIn } = useAuth()
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
      await signIn(values.email, values.password)
    } catch (err: any) {
      setError('root', {
        type: 'server',
        message: err?.message ?? t('auth.loginError'),
      })
    }
  }

  return (
    <div className="login-container">
      {/* Encabezado superior */}
      <header className="login-header">
        <h1 className="login-title">Team Sports Manager</h1>
        <p className="login-subtitle">{t('auth.subtitle')}</p>
      </header>

      {/* Tarjeta de login */}
      <main className="login-card">
        <div className="login-card-header">
          <h2 className="login-card-title">{t('auth.login')}</h2>
          <p className="login-card-description">{t('auth.loginPrompt')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              placeholder="santiago.kiryluk@gmail.com"
              className="form-input"
              {...register('email')}
            />
            {errors.email && (
              <p className="error-message">{errors.email.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••••"
              className="form-input"
              {...register('password')}
            />
            {errors.password && (
              <p className="error-message">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <div className="error-container">{errors.root.message}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="login-button"
          >
            {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <footer className="login-footer">
          <p className="login-footer-text">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="login-footer-link">
              {t('auth.signUpHere')}
            </Link>
          </p>
        </footer>
      </main>
    </div>
  )
}

export default Login
