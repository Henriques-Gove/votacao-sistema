import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/api/client'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [eleicoes, setEleicoes]   = useState([])
  const [meusVotos, setMeusVotos] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/eleicoes'),
      api.get('/votos/meus'),
    ]).then(([el, mv]) => {
      setEleicoes(el)
      setMeusVotos(mv)
    }).finally(() => setLoading(false))
  }, [])

  const activas    = eleicoes.filter(e => e.status === 'activa').length
  const encerradas = eleicoes.filter(e => e.status === 'encerrada').length

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Olá, {user?.nome} 👋</h2>
      <p className="text-slate-400 text-sm mb-8">Bem-vindo ao sistema de votação electrónica</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Eleições Activas" value={loading ? '...' : activas} color="indigo" />
        <StatCard label="Já Votou Em" value={loading ? '...' : meusVotos.length} color="green" />
        <StatCard label="Eleições Encerradas" value={loading ? '...' : encerradas} color="slate" />
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="font-semibold text-white mb-4">Eleições Disponíveis</h3>
        {loading ? (
          <p className="text-slate-400 text-sm">A carregar...</p>
        ) : eleicoes.filter(e => e.status === 'activa').length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhuma eleição activa de momento.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {eleicoes.filter(e => e.status === 'activa').map(e => {
              const jaVotou = meusVotos.some(v => v.eleicao_id === e.id)
              return (
                <div key={e.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <div>
                    <p className="font-medium text-white">{e.titulo}</p>
                    <p className="text-xs text-slate-400 mt-1">Termina: {new Date(e.fim).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {jaVotou && <span className="text-xs px-2 py-1 bg-green-900 text-green-400 rounded-full">✓ Votou</span>}
                    <Link to={`/eleicoes/${e.id}`}
                      className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all">
                      {jaVotou ? 'Ver' : 'Votar'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'border-indigo-500/30 text-indigo-400',
    green:  'border-green-500/30 text-green-400',
    slate:  'border-slate-500/30 text-slate-400',
  }
  return (
    <div className={`bg-slate-800 rounded-2xl p-6 border ${colors[color]}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-4xl font-bold ${colors[color].split(' ')[1]}`}>{value}</p>
    </div>
  )
}
