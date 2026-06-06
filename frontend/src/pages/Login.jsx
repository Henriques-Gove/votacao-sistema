import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-indigo-50/50 to-purple-50/50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/30 transition-colors">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl shadow-indigo-500/30">
            V
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VotaçãoMZ</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Sistema de Votação Electrónica</p>
        </div>

        {!showOtp ? (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-700 shadow-soft">
              {(['login', 'registar']).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                    tab === t
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}>
                  {t === 'login' ? 'Entrar' : 'Criar Conta'}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 flex flex-col gap-4 border border-gray-200 dark:border-slate-700 shadow-soft">
              {tab === 'registar' && (
                <Field label="Nome Completo">
                  <Input value={nome} onChange={setNome} placeholder="Seu nome completo" icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  } />
                </Field>
              )}
              <Field label="Email">
                <Input type="email" value={email} onChange={setEmail} placeholder="email@exemplo.com" icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                } onEnter={tab === 'login' ? fazerLogin : fazerRegisto} />
              </Field>
              <Field label="Password">
                <Input type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                } onEnter={tab === 'login' ? fazerLogin : fazerRegisto} />
              </Field>
              <button onClick={tab === 'login' ? fazerLogin : fazerRegisto} disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 mt-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    A processar...
                  </span>
                ) : tab === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
              {tab === 'login' && (
                <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-center hover:underline">
                  Esqueceu-se da senha?
                </Link>
              )}
            </div>
          </>
        ) : (
          /* OTP Verification */
          <div className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 flex flex-col gap-4 border border-gray-200 dark:border-slate-700 shadow-soft">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.98l7.5-4.04a2.25 2.25 0 0 1 2.134 0l7.5 4.04a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Verifique o seu Email</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Código enviado para<br />
                <strong className="text-indigo-600 dark:text-indigo-400">{pendingEmail}</strong>
              </p>
            </div>
            <Field label="Código de Verificação (6 dígitos)">
              <Input value={otpCode} onChange={setOtpCode} placeholder="000000" maxLength={6} onEnter={verificarOtp} />
            </Field>
            <button onClick={verificarOtp} disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30">
              {loading ? 'A verificar...' : 'Verificar Código'}
            </button>
            <button onClick={reenviarOtp} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-center hover:underline">
              Reenviar código
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-6">
          Plataforma de votação segura e anónima
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input({ type = 'text', value, onChange, placeholder, icon, maxLength, onEnter }) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
          {icon}
        </div>
      )}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        className={`w-full rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600 ${
          icon ? 'pl-10' : 'pl-3.5'
        } pr-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30`} />
    </div>
  )
}
