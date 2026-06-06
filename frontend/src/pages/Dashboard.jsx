import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/api/client'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [eleicoes, setEleicoes]   = useState([])
  const [meusVotos, setMeusVotos] = useState([])
  const [users, setUsers]         = useState([])
  const [grupos, setGrupos]       = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const promises = [api.get('/eleicoes'), api.get('/votos/meus')]
    if (isAdmin) promises.push(api.get('/users'), api.get('/grupos'))
    Promise.all(promises).then(([el, mv, us, gr]) => {
      setEleicoes(el); setMeusVotos(mv)
      if (us) setUsers(us)
      if (gr) setGrupos(gr)
    }).finally(() => setLoading(false))
  }, [isAdmin])

  const activas    = eleicoes.filter(e => e.status === 'activa').length
  const encerradas = eleicoes.filter(e => e.status === 'encerrada').length
  const rascunhos  = eleicoes.filter(e => e.status === 'rascunho').length
  const totalUsers = users.length
  const admins     = users.filter(u => u.role === 'admin').length
  const eleitores  = totalUsers - admins

  const jaVotou = (id) => meusVotos.some(v => v.eleicao_id === id)

  if (loading) return <DashSkeleton />

  return (
    <div className="flex flex-col gap-6">

      {/* Hero */}
      <div className="bg-indigo-600 dark:bg-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex-shrink-0">
            {user?.foto ? (
              <img src={user.foto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                {user?.nome?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Olá, {user?.nome?.split(' ')[0]}!</h1>
            <p className="text-indigo-100 text-sm sm:text-base mt-0.5">
              {isAdmin ? 'Painel de Administração' : 'Bem-vindo ao sistema de votação'}
            </p>
          </div>
          {isAdmin && (
            <span className="hidden sm:inline-flex text-xs px-3 py-1 rounded-full bg-white/20 border border-white/30 font-medium">
              Administrador
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Eleições Activas" value={activas} color="emerald" />
        <StatCard label="Votos Registados" value={meusVotos.length} color="indigo" />
        <StatCard label="Encerradas" value={encerradas} color="gray" />
        <StatCard label="Rascunhos" value={rascunhos} color="amber" />
      </div>

      {/* Admin Charts */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard title="Eleições por Estado">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[
                  { n: 'Activas', v: activas, c: '#10b981' },
                  { n: 'Encerradas', v: encerradas, c: '#6366f1' },
                  { n: 'Rascunho', v: rascunhos, c: '#f59e0b' },
                ].filter(d => d.v > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="v" nameKey="n">
                  {[
                    ...(activas > 0 ? [{ c: '#10b981' }] : []),
                    ...(encerradas > 0 ? [{ c: '#6366f1' }] : []),
                    ...(rascunhos > 0 ? [{ c: '#f59e0b' }] : []),
                  ].map((d, i) => <Cell key={i} fill={d.c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-slate-400 mt-1">
              {[{ n: 'Activas', v: activas, c: '#10b981' }, { n: 'Encerradas', v: encerradas, c: '#6366f1' }, { n: 'Rascunho', v: rascunhos, c: '#f59e0b' }].filter(x => x.v > 0).map(x => (
                <span key={x.n} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: x.c }} />
                  {x.n}: {x.v}
                </span>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Utilizadores">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[
                  { n: 'Eleitores', v: eleitores, c: '#6366f1' },
                  { n: 'Administradores', v: admins, c: '#f59e0b' },
                ].filter(d => d.v > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="v" nameKey="n">
                  {[
                    ...(eleitores > 0 ? [{ c: '#6366f1' }] : []),
                    ...(admins > 0 ? [{ c: '#f59e0b' }] : []),
                  ].map((d, i) => <Cell key={i} fill={d.c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />Eleitores: {eleitores}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />Admin: {admins}</span>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Admin: Groups + Recent Elections */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Grupos</h3>
            {grupos.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhum grupo criado</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {grupos.map(g => (
                  <Link key={g.id} to={`/admin/grupos/${g.id}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                    {g.nome}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Eleições Recentes</h3>
            <div className="flex flex-col gap-2">
              {eleicoes.slice(0, 8).map(e => (
                <div key={e.id} className="flex justify-between items-center text-sm">
                  <Link to={`/eleicoes/${e.id}`} className="text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 truncate">
                    {e.titulo}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                    e.status === 'activa' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' :
                    e.status === 'encerrada' ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400' :
                    'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                  }`}>{e.status}</span>
                </div>
              ))}
              {eleicoes.length === 0 && <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhuma eleição</p>}
            </div>
          </div>
        </div>
      )}

      {/* Active Elections */}
      {eleicoes.filter(e => e.status === 'activa').length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Eleições Activas</h3>
            <Link to="/eleicoes" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Ver todas</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eleicoes.filter(e => e.status === 'activa').map(e => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{e.titulo}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Até {new Date(e.fim).toLocaleDateString('pt-PT')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {jaVotou(e.id) && <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">✓</span>}
                  <Link to={`/eleicoes/${e.id}`}
                    className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                      jaVotou(e.id)
                        ? 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/30'
                    }`}>
                    {jaVotou(e.id) ? 'Ver' : 'Votar'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom: How to Vote */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-2">Votar nunca foi tão fácil</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-4">
              Use o seu telemóvel para votar de forma segura e anónima em qualquer lugar.
            </p>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</span>
                Aceda às eleições activas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</span>
                Selecione o seu candidato
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</span>
                Confirme e vote com um clique
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</span>
                Verifique o seu voto com o código único
              </li>
            </ul>
          </div>
          <div className="flex-shrink-0">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="relative w-48 h-72 sm:w-52 sm:h-80">
      <div className="absolute inset-0 bg-slate-700 rounded-[2rem] border-2 border-slate-500 shadow-lg overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex items-center justify-center">
          <div className="w-20 h-1.5 bg-slate-600 rounded-full" />
        </div>
        <div className="mt-6 mx-2 p-3 bg-slate-800/80 rounded-2xl h-[calc(100%-3rem)] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[8px] font-bold">V</div>
            <span className="text-[8px] font-bold text-white">VotaçãoMZ</span>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[6px] text-white">✓</div>
                <div>
                  <p className="text-[7px] font-medium text-white/90">Eleição Presidencial</p>
                  <p className="text-[6px] text-indigo-200">Confirmado</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-white/10" />
                <div>
                  <p className="text-[7px] font-medium text-white/60">Assembleia Geral</p>
                  <p className="text-[6px] text-white/30">Disponível</p>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-[6px] text-white/40 text-center">Termina em 3 dias</p>
            </div>
          </div>
          <div className="flex justify-center gap-1">
            <div className="w-1 h-1 rounded-full bg-indigo-500" />
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="w-1 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const styles = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30',   text: 'text-indigo-700 dark:text-indigo-400',  border: 'border-indigo-200 dark:border-indigo-800' },
    gray:    { bg: 'bg-gray-100 dark:bg-slate-700',        text: 'text-gray-600 dark:text-slate-300',     border: 'border-gray-200 dark:border-slate-600' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800' },
  }
  const s = styles[color]
  return (
    <div className={`${s.bg} ${s.border} rounded-2xl p-4 sm:p-5 border shadow-sm`}>
      <p className={`text-xs uppercase tracking-wider mb-1 ${s.text} opacity-75`}>{label}</p>
      <p className={`text-3xl sm:text-4xl font-bold ${s.text}`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">{title}</h3>
      {children}
    </div>
  )
}

function DashSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  )
}
