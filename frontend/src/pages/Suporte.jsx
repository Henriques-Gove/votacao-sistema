import { useState } from 'react'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function Suporte() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telemovel, setTelemovel] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome || !email || !mensagem) return toast.error('Preencha nome, email e mensagem')
    setEnviando(true)
    try {
      await api.post('/suporte', { nome, email, telemovel, mensagem })
      setEnviado(true)
      toast.success('Mensagem enviada!')
    } catch (e) { toast.error(e.message) }
    finally { setEnviando(false) }
  }

  if (enviado) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-200 dark:border-slate-700 shadow-soft">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mensagem Enviada!</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">Entraremos em contacto consigo brevemente.</p>
          <button onClick={() => { setEnviado(false); setNome(''); setEmail(''); setTelemovel(''); setMensagem('') }}
            className="mt-6 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            Enviar nova mensagem
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Suporte Técnico</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Envie-nos uma mensagem que entraremos em contacto.</p>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-200 dark:border-slate-700 shadow-soft flex flex-col gap-4">
        <Campo label="Nome" value={nome} onChange={setNome} placeholder="O seu nome" />
        <Campo label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" />
        <Campo label="Telemóvel (opcional)" type="tel" value={telemovel} onChange={setTelemovel} placeholder="+258 00 000 0000" />
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mensagem</label>
          <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={4} placeholder="Descreva o seu problema ou dúvida..."
            className="w-full rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 resize-none" />
        </div>
        <button type="submit" disabled={enviando}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30">
          {enviando ? 'A enviar...' : 'Enviar Mensagem'}
        </button>
      </form>
    </div>
  )
}

function Campo({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30" />
    </div>
  )
}