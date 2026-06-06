import { useState, useEffect } from 'react'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function AdminSuporte() {
  const [mensagens, setMensagens] = useState([])
  const [loading, setLoading] = useState(true)
  const [respostaText, setRespostaText] = useState({})

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      const data = await api.get('/suporte')
      setMensagens(data)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function responder(id) {
    const resposta = respostaText[id]?.trim()
    if (!resposta) return toast.error('Escreva uma resposta')
    try {
      await api.put(`/suporte/${id}/responder`, { resposta })
      toast.success('Resposta enviada')
      setRespostaText(p => ({ ...p, [id]: '' }))
      carregar()
    } catch (e) { toast.error(e.message) }
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
                  <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap mb-3">{m.mensagem}</p>

                  {m.resposta && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 mb-3">
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Resposta:</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{m.resposta}</p>
                      {m.respondido_em && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{new Date(m.respondido_em).toLocaleString('pt-PT')}</p>
                      )}
                    </div>
                  )}

                  {!m.resposta && (
                    <div className="flex gap-2">
                      <textarea value={respostaText[m.id] || ''} onChange={e => setRespostaText(p => ({ ...p, [m.id]: e.target.value }))}
                        rows={2} placeholder="Escrever resposta..."
                        className="flex-1 rounded-xl text-sm outline-none px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:border-indigo-500 resize-none" />
                      <button onClick={() => responder(m.id)}
                        className="self-end text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all">
                        Enviar
                      </button>
                    </div>
                  )}
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