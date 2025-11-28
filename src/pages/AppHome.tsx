import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const AppHome: React.FC = () => {
  const { user, role, signOut } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded p-6">
          <h1 className="text-xl font-semibold mb-2">{t('home.greeting', { email: user?.email })}</h1>
          <p className="text-sm text-gray-600 mb-4">{t('home.role')}: {role ?? '—'}</p>

          {role === 'super_admin' && (
            <div role="region" aria-label="super-admin-panel" className="border rounded p-4 mb-4 bg-blue-50">
              <h2 className="text-lg font-bold">{t('home.superAdminPanel')}</h2>
              <p>{t('home.fullAccessEnabled')}</p>
            </div>
          )}

          <button
            onClick={signOut}
            className="w-full sm:w-auto rounded p-2 font-semibold bg-gray-800 text-white hover:bg-black"
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppHome
