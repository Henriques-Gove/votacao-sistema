import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      <header className="sticky top-0 z-50 border-b border-slate-800" style={{ background: '#0f172a' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">V</div>
            <span className="font-bold text-indigo-400 text-lg">VotaçãoMZ</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={location.pathname === '/'}>Dashboard</NavLink>
            <NavLink to="/eleicoes" active={isActive('/eleicoes')}>Eleições</NavLink>
            {isAdmin && <>
              <NavLink to="/admin/eleicoes" active={isActive('/admin/eleicoes')}>Gerir Eleições</NavLink>
              <NavLink to="/admin/utilizadores" active={isActive('/admin/utilizadores')}>Utilizadores</NavLink>
            </>}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden md:block">{user?.nome}</span>
            {isAdmin && <span className="text-xs px-2 py-1 rounded-full bg-indigo-900 text-indigo-300 font-medium">Admin</span>}
            <button onClick={logout} className="text-sm px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-all">
              Sair
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 px-4 pb-3 overflow-x-auto">
          <NavLink to="/" active={location.pathname === '/'}>Dashboard</NavLink>
          <NavLink to="/eleicoes" active={isActive('/eleicoes')}>Eleições</NavLink>
          {isAdmin && <>
            <NavLink to="/admin/eleicoes" active={isActive('/admin/eleicoes')}>Gerir</NavLink>
            <NavLink to="/admin/utilizadores" active={isActive('/admin/utilizadores')}>Users</NavLink>
          </>}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className={`text-sm font-medium px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
      active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
    }`}>
      {children}
    </Link>
  )
}
