import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return toast.error('A senha deve ter mínimo 6 caracteres')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, token, password })
      toast.success('Senha redefinida com sucesso!')
      navigate('/login')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">VotaçãoMZ</span>
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Redefinir Senha</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center">Escolha uma nova senha para {email}</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)" required minLength={6}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" />
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
              {loading ? 'A redefinir...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
