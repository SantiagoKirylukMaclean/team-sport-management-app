import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Administración</h2>
          <nav className="space-y-2">
            <NavLink
              to="/admin/sports"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              Deportes
            </NavLink>
            <NavLink
              to="/admin/clubs"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              Clubes
            </NavLink>
            <NavLink
              to="/admin/teams"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              Equipos
            </NavLink>
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout