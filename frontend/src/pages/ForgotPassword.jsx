import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return toast.error('Introduza o seu email')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
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
          {sent ? (
            <div className="text-center py-4">
              <p className="text-green-600 dark:text-green-400 font-semibold mb-2">✓ Email enviado</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Se o email existir no sistema, receberá instruções para redefinir a sua senha.</p>
              <Link to="/login" className="inline-block mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Voltar ao login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Recuperar Senha</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center">Introduza o seu email para receber instruções</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="O seu email" required
                className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" />
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
                {loading ? 'A enviar...' : 'Enviar'}
              </button>
              <Link to="/login" className="text-center text-sm text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">← Voltar ao login</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
