import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/api/client'

export default function Eleicoes() {
  const { isAdmin } = useAuth()
  const [eleicoes, setEleicoes] = useState([])
  const [grupos, setGrupos]     = useState([])
  const [filtro, setFiltro]     = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/eleicoes').then(setEleicoes).finally(() => setLoading(false))
    if (isAdmin) api.get('/grupos').then(setGrupos).catch(() => {})
  }, [])

  const filtradas = filtro ? eleicoes.filter(e => e.grupo_nome === filtro || (!e.grupo_nome && filtro === 'geral')) : eleicoes

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Eleições</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Eleições disponíveis para votação</p>

      {grupos.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setFiltro('')}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${!filtro ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600'}`}>
            Todas
          </button>
          <button onClick={() => setFiltro('geral')}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filtro === 'geral' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600'}`}>
            Gerais
          </button>
          {grupos.map(g => (
            <button key={g.id} onClick={() => setFiltro(g.nome)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filtro === g.nome ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600'}`}>
              {g.nome}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 animate-pulse">
              <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-8 w-full bg-gray-200 dark:bg-slate-700 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">Nenhuma eleição encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map(e => (
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge status={e.status} />
                  {e.grupo_nome ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400">{e.grupo_nome}</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">Geral</span>
                  )}
                  {e.multi_cargo && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-400">Multi-cargo</span>}
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg">{e.titulo}</h3>
                {e.descricao && <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">{e.descricao}</p>}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500 flex gap-4">
                <span>Início: {new Date(e.inicio).toLocaleDateString('pt-PT')}</span>
                <span>Fim: {new Date(e.fim).toLocaleDateString('pt-PT')}</span>
              </div>
              <div className="flex gap-2 mt-auto">
                {e.status === 'activa' && (
                  <Link to={`/eleicoes/${e.id}`} className="flex-1 text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
                    Votar
                  </Link>
                )}
                {e.status === 'encerrada' && (
                  <Link to={`/eleicoes/${e.id}/resultados`} className="flex-1 text-center py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-all">
                    Ver Resultados
                  </Link>
                )}
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
    activa:    'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400',
    encerrada: 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
    rascunho:  'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400',
  }
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status]}`}>{status}</span>
}
