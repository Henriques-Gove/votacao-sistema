import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function AdminEleicoes() {
  const [eleicoes, setEleicoes] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    api.get('/eleicoes').then(setEleicoes).finally(() => setLoading(false))
  }

  async function mudarStatus(id, status) {
    const el = eleicoes.find(e => e.id === id)
    try {
      await api.put(`/eleicoes/${id}`, { ...el, status })
      toast.success('Status actualizado')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  async function eliminar(id) {
    if (!confirm('Eliminar esta eleição? Esta acção é irreversível.')) return
    try {
      await api.delete(`/eleicoes/${id}`)
      toast.success('Eleição eliminada')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerir Eleições</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Painel de administração</p>
        </div>
        <Link to="/admin/eleicoes/nova"
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">
          + Nova Eleição
        </Link>
      </div>

      {loading ? <p className="text-gray-500 dark:text-slate-400">A carregar...</p> :
       eleicoes.length === 0 ? <p className="text-gray-500 dark:text-slate-400">Nenhuma eleição criada.</p> : (
        <div className="flex flex-col gap-4">
          {eleicoes.map(e => (
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={e.status} />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-semibold">{e.titulo}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {new Date(e.inicio).toLocaleDateString('pt-PT')} → {new Date(e.fim).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.status === 'rascunho' && (
                    <button onClick={() => mudarStatus(e.id, 'activa')}
                      className="text-xs px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-all">
                      Activar
                    </button>
                  )}
                  {e.status === 'activa' && (
                    <button onClick={() => mudarStatus(e.id, 'encerrada')}
                      className="text-xs px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-all">
                      Encerrar
                    </button>
                  )}
                  <Link to={`/eleicoes/${e.id}/resultados`}
                    className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg transition-all">
                    Resultados
                  </Link>
                  <button onClick={() => eliminar(e.id)}
                    className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/50 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-white border border-red-300 dark:border-red-700 rounded-lg transition-all">
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

function StatusBadge({ status }) {
  const map = {
    activa: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400',
    encerrada: 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
    rascunho: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400',
  }
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status]}`}>{status}</span>
}
