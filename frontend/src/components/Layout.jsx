import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">V</div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">VotaçãoMZ</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={location.pathname === '/'} theme={theme}>Dashboard</NavLink>
            <NavLink to="/eleicoes" active={isActive('/eleicoes')} theme={theme}>Eleições</NavLink>
            {isAdmin && <>
              <NavLink to="/admin/eleicoes" active={isActive('/admin/eleicoes')} theme={theme}>Gerir Eleições</NavLink>
              <NavLink to="/admin/grupos" active={isActive('/admin/grupos')} theme={theme}>Grupos</NavLink>
              <NavLink to="/admin/utilizadores" active={isActive('/admin/utilizadores')} theme={theme}>Utilizadores</NavLink>
            </>}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-500 dark:text-slate-400 hidden md:block">{user?.nome}</span>
            {isAdmin && <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium">Admin</span>}
            <button onClick={logout} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
              Sair
            </button>
          </div>
        </div>

        <div className="flex md:hidden gap-1 px-4 pb-3 overflow-x-auto">
          <NavLink to="/" active={location.pathname === '/'} theme={theme}>Dashboard</NavLink>
          <NavLink to="/eleicoes" active={isActive('/eleicoes')} theme={theme}>Eleições</NavLink>
          {isAdmin && <>
            <NavLink to="/admin/eleicoes" active={isActive('/admin/eleicoes')} theme={theme}>Gerir</NavLink>
            <NavLink to="/admin/grupos" active={isActive('/admin/grupos')} theme={theme}>Grupos</NavLink>
            <NavLink to="/admin/utilizadores" active={isActive('/admin/utilizadores')} theme={theme}>Users</NavLink>
          </>}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, active, theme, children }) {
  return (
    <Link to={to} className={`text-sm font-medium px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
      active
        ? 'bg-indigo-600 text-white'
        : theme === 'dark'
          ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
    }`}>
      {children}
    </Link>
  )
}
