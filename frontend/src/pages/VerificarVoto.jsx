import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function VerificarVoto() {
  const { user } = useAuth()
  const [tokenVoto, setTokenVoto] = useState('')
  const [candidatoId, setCandidatoId] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)

  async function verificar(e) {
    e.preventDefault()
    if (!tokenVoto.trim() || !candidatoId.trim()) return toast.error('Preencha o token e o ID do candidato')
    setLoading(true)
    try {
      const res = await api.post('/votos/verificar', { token_voto: tokenVoto.trim(), candidato_id: Number(candidatoId) })
      setResultado(res)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Verificar Voto</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Confirme que o seu voto foi contado correctamente</p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 mb-6">
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          O voto é armazenado com um hash criptográfico (HMAC-SHA256) que liga o seu token ao candidato escolhido.
          Ao verificar, provamos que o voto foi contado sem revelar o conteúdo a ninguém — nem ao administrador.
        </p>

        <form onSubmit={verificar} className="flex flex-col gap-4">
          <Field label="Token do Voto">
            <input type="text" value={tokenVoto} onChange={e => setTokenVoto(e.target.value)}
              placeholder="Token recebido após votar"
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 font-mono" />
          </Field>
          <Field label="ID do Candidato">
            <input type="number" value={candidatoId} onChange={e => setCandidatoId(e.target.value)}
              placeholder="Número do candidato (ex: 1, 2, 3...)"
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" />
          </Field>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
            {loading ? 'A verificar...' : 'Verificar Voto'}
          </button>
        </form>
      </div>

      {resultado && (
        <div className={`rounded-2xl p-6 border text-center ${
          resultado.valido
            ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
            : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
        }`}>
          {resultado.valido ? (
            <>
              <p className="text-3xl mb-2">✅</p>
              <p className="text-green-700 dark:text-green-400 font-bold text-lg">Voto Confirmado!</p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">{resultado.message}</p>
            </>
          ) : (
            <>
              <p className="text-3xl mb-2">❌</p>
              <p className="text-red-700 dark:text-red-400 font-bold text-lg">Voto Não Confirmado</p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">{resultado.message}</p>
            </>
          )}
        </div>
      )}
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
