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

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 dark:from-indigo-800 dark:via-indigo-900 dark:to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 border-8 border-white rounded-full" />
          <div className="absolute top-20 right-20 w-20 h-20 bg-white rounded-full" />
          <div className="absolute bottom-10 right-0 w-40 h-40 border-8 border-white/50 rounded-full" />
        </div>
        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 overflow-hidden flex-shrink-0 shadow-lg">
            {user?.foto ? (
              <img src={user.foto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                {user?.nome?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">Olá, {user?.nome?.split(' ')[0]}!</h1>
            <p className="text-indigo-200 text-sm sm:text-base mt-1">
              {isAdmin ? 'Painel de Administração do Sistema' : 'Bem-vindo ao sistema de votação electrónica'}
            </p>
          </div>
          {isAdmin && (
            <span className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 font-medium">
              Administrador
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatBadge label="Eleições Activas" value={activas} icon="⚡" gradient="from-emerald-500 to-teal-600" />
        <StatBadge label="Votos Registados" value={meusVotos.length} icon="📋" gradient="from-blue-500 to-indigo-600" />
        <StatBadge label="Encerradas" value={encerradas} icon="🏁" gradient="from-slate-500 to-slate-700" />
        <StatBadge label="Rascunhos" value={rascunhos} icon="📝" gradient="from-amber-500 to-orange-600" />
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
                    ...(activas > 0 ? [{ n: 'Activas', c: '#10b981' }] : []),
                    ...(encerradas > 0 ? [{ n: 'Encerradas', c: '#6366f1' }] : []),
                    ...(rascunhos > 0 ? [{ n: 'Rascunho', c: '#f59e0b' }] : []),
                  ].map((d, i) => <Cell key={i} fill={d.c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-slate-400">
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
                    ...(eleitores > 0 ? [{ n: 'Eleitores', c: '#6366f1' }] : []),
                    ...(admins > 0 ? [{ n: 'Administradores', c: '#f59e0b' }] : []),
                  ].map((d, i) => <Cell key={i} fill={d.c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />Eleitores: {eleitores}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />Admin: {admins}</span>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Admin: Groups + Recent Elections */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
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

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
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

      {/* Active Elections (for everyone) */}
      {eleicoes.filter(e => e.status === 'activa').length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Eleições Activas</h3>
            <Link to="/eleicoes" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Ver todas</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eleicoes.filter(e => e.status === 'activa').map(e => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
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

      {/* Bottom: Phone Voting Illustration */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Votar nunca foi tão fácil</h3>
            <p className="text-slate-300 text-sm sm:text-base mb-4">
              Use o seu telemóvel para votar de forma segura e anónima em qualquer lugar.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                Aceda às eleições activas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                Selecione o seu candidato
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                Confirme e vote com um clique
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-800 rounded-[2rem] border-2 border-slate-600 shadow-2xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex items-center justify-center">
          <div className="w-20 h-1.5 bg-slate-700 rounded-full" />
        </div>
        <div className="mt-6 mx-2 p-3 bg-slate-900/50 rounded-2xl h-[calc(100%-3rem)] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[8px] font-bold">V</div>
            <span className="text-[8px] font-bold text-white">VotaçãoMZ</span>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[6px] text-white">✓</div>
                <div>
                  <p className="text-[7px] font-medium text-white/90">Eleição Direcção</p>
                  <p className="text-[6px] text-indigo-300">Confirmado</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-white/10" />
                <div>
                  <p className="text-[7px] font-medium text-white/60">Eleição Turma</p>
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

function StatBadge({ label, value, icon, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-2 right-2 opacity-20 text-2xl">{icon}</div>
      <p className="text-xs text-white/70 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
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
