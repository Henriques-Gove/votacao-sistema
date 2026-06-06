import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'

export default function Eleicoes() {
  const [eleicoes, setEleicoes] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/eleicoes').then(setEleicoes).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Eleições</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Eleições disponíveis para votação</p>

      {loading ? <p className="text-gray-500 dark:text-slate-400">A carregar...</p> :
       eleicoes.length === 0 ? <p className="text-gray-500 dark:text-slate-400">Nenhuma eleição disponível.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eleicoes.map(e => (
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge status={e.status} />
                  {e.grupo_nome && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400">{e.grupo_nome}</span>
                  )}
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
