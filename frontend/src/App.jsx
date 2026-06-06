import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Eleicoes from './pages/Eleicoes'
import DetalheEleicao from './pages/DetalheEleicao'
import Resultados from './pages/Resultados'
import AdminEleicoes from './pages/admin/AdminEleicoes'
import AdminUtilizadores from './pages/admin/AdminUtilizadores'
import AdminGrupos from './pages/admin/AdminGrupos'
import AdminGrupoMembros from './pages/admin/AdminGrupoMembros'
import NovaEleicao from './pages/admin/NovaEleicao'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-slate-400">A carregar...</div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/" />
  return children
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="eleicoes" element={<Eleicoes />} />
        <Route path="eleicoes/:id" element={<DetalheEleicao />} />
        <Route path="eleicoes/:id/resultados" element={<Resultados />} />
        <Route path="admin/eleicoes" element={<AdminRoute><AdminEleicoes /></AdminRoute>} />
        <Route path="admin/eleicoes/nova" element={<AdminRoute><NovaEleicao /></AdminRoute>} />
        <Route path="admin/utilizadores" element={<AdminRoute><AdminUtilizadores /></AdminRoute>} />
        <Route path="admin/grupos" element={<AdminRoute><AdminGrupos /></AdminRoute>} />
        <Route path="admin/grupos/:id" element={<AdminRoute><AdminGrupoMembros /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
