import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const [tab, setTab]             = useState('login')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [nome, setNome]           = useState('')
  const [otpCode, setOtpCode]     = useState('')
  const [showOtp, setShowOtp]     = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [loading, setLoading]     = useState(false)

  async function fazerLogin() {
    if (!email || !password) return toast.error('Preencha todos os campos')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.access_token, res.user)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function fazerRegisto() {
    if (!nome || !email || !password) return toast.error('Preencha todos os campos')
    setLoading(true)
    try {
      await api.post('/auth/register', { nome, email, password })
      setPendingEmail(email)
      setShowOtp(true)
      toast.success('Código enviado para o email!')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function verificarOtp() {
    if (!otpCode) return toast.error('Insira o código')
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { email: pendingEmail, otp_code: otpCode })
      login(res.access_token, res.user)
      toast.success('Conta verificada!')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function reenviarOtp() {
    try {
      await api.post('/auth/resend-otp', { email: pendingEmail })
      toast.success('Código reenviado!')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">V</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VotaçãoMZ</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Sistema de Votação Electrónica</p>
        </div>

        <button onClick={toggle} className="mx-auto mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
          {theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo escuro'}
        </button>

        {!showOtp ? (
          <>
            <div className="flex gap-2 mb-6 p-1 rounded-xl bg-gray-200 dark:bg-slate-800">
              {['login','registar'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
                  {t === 'login' ? 'Entrar' : 'Criar Conta'}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex flex-col gap-4 border border-gray-200 dark:border-slate-700">
              {tab === 'registar' && (
                <Field label="Nome Completo">
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
                </Field>
              )}
              <Field label="Email">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? fazerLogin() : fazerRegisto())} />
              </Field>
              <Field label="Password">
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? fazerLogin() : fazerRegisto())} />
              </Field>
              <Btn onClick={tab === 'login' ? fazerLogin : fazerRegisto} loading={loading}>
                {tab === 'login' ? 'Entrar' : 'Criar Conta'}
              </Btn>
              {tab === 'login' && (
                <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-center">Esqueceu-se da senha?</Link>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex flex-col gap-4 border border-gray-200 dark:border-slate-700">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Verificar Email</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Código enviado para <strong className="text-indigo-600 dark:text-indigo-400">{pendingEmail}</strong></p>
            <Field label="Código de 6 dígitos">
              <Input value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="000000" maxLength={6} onKeyDown={e => e.key === 'Enter' && verificarOtp()} />
            </Field>
            <Btn onClick={verificarOtp} loading={loading}>Verificar</Btn>
            <button onClick={reenviarOtp} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-center">Reenviar código</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

function Input(props) {
  const { theme } = useTheme()
  return <input {...props} className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-600 ${
    theme === 'dark'
      ? 'bg-slate-900 border border-slate-600 text-white'
      : 'bg-gray-100 border border-gray-300 text-gray-900'
  }`} />
}

function Btn({ onClick, loading, children }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all mt-1">
      {loading ? 'A processar...' : children}
    </button>
  )
}
