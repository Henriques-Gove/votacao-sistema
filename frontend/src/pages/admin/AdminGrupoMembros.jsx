import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function AdminGrupoMembros() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grupo, setGrupo] = useState(null)
  const [membros, setMembros] = useState([])
  const [disponiveis, setDisponiveis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [id])

  async function carregar() {
    const [g, m, d] = await Promise.all([
      api.get('/grupos'),
      api.get(`/grupos/${id}/membros`),
      api.get('/users/sem-grupo'),
    ])
    setGrupo(g.find(x => x.id === Number(id)))
    setMembros(m)
    setDisponiveis(d)
    setLoading(false)
  }

  async function adicionar(userId) {
    try {
      await api.post(`/grupos/${id}/membros`, { user_id: userId })
      toast.success('Adicionado')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  async function remover(userId) {
    try {
      await api.delete(`/grupos/${id}/membros/${userId}`)
      toast.success('Removido')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <p className="text-gray-500 dark:text-slate-400">A carregar...</p>

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/admin/grupos')} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center gap-2">← Voltar</button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{grupo?.nome}</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">{grupo?.descricao}</p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Adicionar Membro</h3>
        {disponiveis.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Todos os utilizadores já estão em grupos.</p>
        ) : (
          <select onChange={e => { const v = e.target.value; if (v) adicionar(Number(v)) }} value=""
            className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
            <option value="">Seleccionar utilizador...</option>
            {disponiveis.map(u => (
              <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Membros ({membros.length})</h3>
        </div>
        {membros.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 p-5">Nenhum membro neste grupo.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {membros.map(u => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{u.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                </div>
                <button onClick={() => remover(u.id)}
                  className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/50 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-white border border-red-300 dark:border-red-700 rounded-lg transition-all">
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
