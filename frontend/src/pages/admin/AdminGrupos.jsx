import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function AdminGrupos() {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [novaDesc, setNovaDesc] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    api.get('/grupos').then(setGrupos).finally(() => setLoading(false))
  }

  async function criar() {
    if (!novoNome.trim()) return toast.error('Insira um nome')
    try {
      await api.post('/grupos', { nome: novoNome, descricao: novaDesc })
      toast.success('Grupo criado')
      setNovoNome('')
      setNovaDesc('')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  async function eliminar(id) {
    if (!confirm('Eliminar este grupo?')) return
    try {
      await api.delete(`/grupos/${id}`)
      toast.success('Grupo eliminado')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Grupos</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Gerir grupos de votação</p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Novo Grupo</h3>
        <div className="flex gap-3">
          <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
            placeholder="Nome do grupo" className="flex-1 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500 placeholder:text-gray-400 dark:placeholder:text-slate-600" />
          <input value={novaDesc} onChange={e => setNovaDesc(e.target.value)}
            placeholder="Descrição" className="flex-1 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500 placeholder:text-gray-400 dark:placeholder:text-slate-600" />
          <button onClick={criar} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all">Criar</button>
        </div>
      </div>

      {loading ? <p className="text-gray-500 dark:text-slate-400">A carregar...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map(g => (
            <div key={g.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{g.nome}</h3>
                  {g.descricao && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{g.descricao}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to={`/admin/grupos/${g.id}`}
                  className="flex-1 text-center text-sm py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg transition-all">
                  Membros
                </Link>
                <button onClick={() => eliminar(g.id)}
                  className="text-sm px-3 py-1.5 bg-red-100 dark:bg-red-900/50 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-white border border-red-300 dark:border-red-700 rounded-lg transition-all">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
