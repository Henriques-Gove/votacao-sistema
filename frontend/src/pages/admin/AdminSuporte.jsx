import { useState, useEffect } from 'react'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function AdminSuporte() {
  const [mensagens, setMensagens] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      const data = await api.get('/suporte')
      setMensagens(data)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function marcarLida(id) {
    try {
      await api.put(`/suporte/${id}/ler`)
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  async function eliminar(id) {
    if (!window.confirm('Eliminar esta mensagem?')) return
    try {
      await api.delete(`/suporte/${id}`)
      toast.success('Mensagem eliminada')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <p className="text-gray-500 dark:text-slate-400">A carregar...</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mensagens de Suporte</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">{mensagens.filter(m => !m.lida).length} não lidas</p>

      {mensagens.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">Nenhuma mensagem recebida.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {mensagens.map(m => (
            <div key={m.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all ${m.lida ? 'border-gray-200 dark:border-slate-700 opacity-60' : 'border-indigo-200 dark:border-indigo-800 shadow-soft'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{m.nome}</span>
                    {!m.lida && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 font-medium">Nova</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mb-3">
                    <span>{m.email}</span>
                    {m.telemovel && <span>{m.telemovel}</span>}
                    <span>{new Date(m.created_at).toLocaleString('pt-PT')}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{m.mensagem}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {!m.lida && (
                    <button onClick={() => marcarLida(m.id)}
                      className="text-xs px-2.5 py-1.5 border border-gray-300 dark:border-slate-600 hover:border-indigo-500 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all">
                        Marcar Lida
                    </button>
                  )}
                  <button onClick={() => eliminar(m.id)}
                    className="text-xs px-2.5 py-1.5 border border-red-300 dark:border-red-700 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white rounded-lg transition-all">
                      Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}