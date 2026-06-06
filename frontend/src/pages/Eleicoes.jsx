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

  const filtradas = filtro
    ? eleicoes.filter(e => e.grupo_nome === filtro || (!e.grupo_nome && filtro === 'geral'))
    : eleicoes

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Eleições</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Eleições disponíveis para votação</p>
        </div>
        {isAdmin && (
          <Link to="/admin/eleicoes/nova" className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-md shadow-indigo-500/30">
            + Nova Eleição
          </Link>
        )}
      </div>

      {/* Filter pills */}
      {grupos.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          <FilterPill active={!filtro} onClick={() => setFiltro('')}>Todas</FilterPill>
          <FilterPill active={filtro === 'geral'} onClick={() => setFiltro('geral')}>Gerais</FilterPill>
          {grupos.map(g => (
            <FilterPill key={g.id} active={filtro === g.nome} onClick={() => setFiltro(g.nome)}>
              {g.nome}
            </FilterPill>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-16 bg-gray-200 dark:bg-slate-700 rounded-full" />
                <div className="h-5 w-20 bg-gray-200 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded mb-1" />
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-10 w-full bg-gray-200 dark:bg-slate-700 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Nenhuma eleição encontrada</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Tente alterar o filtro ou aguarde novas eleições</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map(e => (
            <div key={e.id} className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={e.status} />
                {e.grupo_nome ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {e.grupo_nome}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                    Geral
                  </span>
                )}
                {e.multi_cargo && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                    Multi-cargo
                  </span>
                )}
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {e.titulo}
              </h3>
              {e.descricao && (
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">{e.descricao}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                  </svg>
                  {new Date(e.inicio).toLocaleDateString('pt-PT')}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {new Date(e.fim).toLocaleDateString('pt-PT')}
                </span>
              </div>
              <div className="mt-4">
                {e.status === 'activa' && (
                  <Link to={`/eleicoes/${e.id}`}
                    className="block w-full text-center py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-500/30">
                    Votar Agora
                  </Link>
                )}
                {e.status === 'encerrada' && (
                  <Link to={`/eleicoes/${e.id}/resultados`}
                    className="block w-full text-center py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-xl text-sm font-medium transition-all">
                    Ver Resultados
                  </Link>
                )}
                {e.status === 'rascunho' && isAdmin && (
                  <Link to={`/admin/eleicoes?edit=${e.id}`}
                    className="block w-full text-center py-2.5 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium transition-all">
                    Editar Rascunho
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
  const config = {
    activa:    { label: 'Activa',    bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    encerrada: { label: 'Encerrada', bg: 'bg-gray-100 dark:bg-slate-700',        text: 'text-gray-500 dark:text-slate-400',     dot: 'bg-gray-400' },
    rascunho:  { label: 'Rascunho',  bg: 'bg-amber-100 dark:bg-amber-900/50',    text: 'text-amber-700 dark:text-amber-400',    dot: 'bg-amber-500' },
  }[status] || {}
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-4 py-1.5 rounded-full whitespace-nowrap font-medium transition-all flex-shrink-0 ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
          : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}>
      {children}
    </button>
  )
}
