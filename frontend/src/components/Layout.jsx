import { Outlet, useLocation, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import AnimatedPage from './AnimatedPage'
import InstallButton from './InstallButton'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-800/60 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-500/30 group-hover:shadow-lg group-hover:shadow-indigo-500/40 transition-all">
              V
            </div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">VotaçãoMZ</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            <NavLink to="/" active={location.pathname === '/'}>Dashboard</NavLink>
            <NavLink to="/eleicoes" active={isActive('/eleicoes')}>Eleições</NavLink>
            <NavLink to="/verificar" active={isActive('/verificar')}>Verificar Voto</NavLink>
            {isAdmin && <>
              <span className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />
              <NavLink to="/admin/eleicoes" active={isActive('/admin/eleicoes')}>Gerir Eleições</NavLink>
              <NavLink to="/admin/grupos" active={isActive('/admin/grupos')}>Grupos</NavLink>
              <NavLink to="/admin/utilizadores" active={isActive('/admin/utilizadores')}>Utilizadores</NavLink>
              <NavLink to="/admin/audit" active={isActive('/admin/audit')}>Auditoria</NavLink>
            </>}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
              {theme === 'dark' ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              )}
            </button>

            <Link to="/perfil" className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {user?.foto ? (
                <img src={user.foto} className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-200 dark:ring-slate-700" alt="" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-indigo-400 inline-flex items-center justify-center text-xs font-bold ring-2 ring-gray-200 dark:ring-slate-700">
                  {user?.nome?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
              <span className="max-w-[120px] truncate">{user?.nome}</span>
            </Link>

            {isAdmin && (
              <span className="hidden md:inline-flex text-xs px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
                Admin
              </span>
            )}

            <button onClick={logout}
              className="text-sm px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-red-400 hover:text-red-500 dark:hover:text-red-400 dark:hover:border-red-600 transition-all">
              Sair
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden gap-1 px-4 pb-2.5 overflow-x-auto scrollbar-none">
          <NavLink to="/" active={location.pathname === '/'}>Dashboard</NavLink>
          <NavLink to="/eleicoes" active={isActive('/eleicoes')}>Eleições</NavLink>
          <NavLink to="/verificar" active={isActive('/verificar')}>Verificar</NavLink>
          <NavLink to="/perfil" active={isActive('/perfil')}>Perfil</NavLink>
          {isAdmin && <>
            <span className="w-px h-5 bg-gray-200 dark:bg-slate-700 self-center mx-0.5" />
            <NavLink to="/admin/eleicoes" active={isActive('/admin/eleicoes')}>Gerir</NavLink>
            <NavLink to="/admin/grupos" active={isActive('/admin/grupos')}>Grupos</NavLink>
            <NavLink to="/admin/utilizadores" active={isActive('/admin/utilizadores')}>Users</NavLink>
            <NavLink to="/admin/audit" active={isActive('/admin/audit')}>Auditoria</NavLink>
          </>}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <AnimatedPage key={location.pathname}>
            <Outlet />
          </AnimatedPage>
        </AnimatePresence>
      </main>
      <InstallButton />
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className={`text-sm font-medium px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
      active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
        : 'text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800/50'
    }`}>
      {children}
    </Link>
  )
}
