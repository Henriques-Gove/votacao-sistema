import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import api from '@/api/client'

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#f97316', '#06b6d4']

export default function AdminDashboard() {
  const [eleicoes, setEleicoes] = useState([])
  const [users, setUsers]       = useState([])
  const [grupos, setGrupos]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/eleicoes'),
      api.get('/users'),
      api.get('/grupos'),
    ]).then(([el, us, gr]) => {
      setEleicoes(el)
      setUsers(us)
      setGrupos(gr)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 dark:text-slate-400">A carregar...</p>

  const totalUsers = users.length
  const admins = users.filter(u => u.role === 'admin').length
  const eleitores = totalUsers - admins
  const activas = eleicoes.filter(e => e.status === 'activa').length
  const encerradas = eleicoes.filter(e => e.status === 'encerrada').length
  const rascunhos = eleicoes.filter(e => e.status === 'rascunho').length

  const participacaoData = eleicoes.filter(e => e.status === 'encerrada').map(e => ({
    name: e.titulo.length > 15 ? e.titulo.slice(0, 14) + '…' : e.titulo,
    participacao: 0,
  }))

  const gruposCount = grupos.map(g => ({
    name: g.nome.length > 12 ? g.nome.slice(0, 11) + '…' : g.nome,
    value: 1,
  }))

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Painel de Administração</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Visão geral do sistema</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <MiniStat label="Utilizadores" value={totalUsers} color="indigo" detail={`${eleitores} eleitores · ${admins} admin`} />
        <MiniStat label="Eleições Activas" value={activas} color="green" />
        <MiniStat label="Eleições Encerradas" value={encerradas} color="slate" />
        <MiniStat label="Rascunhos" value={rascunhos} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Eleições por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[
                { name: 'Activas', value: activas, color: '#10b981' },
                { name: 'Encerradas', value: encerradas, color: '#6366f1' },
                { name: 'Rascunho', value: rascunhos, color: '#f59e0b' },
              ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                {['#10b981', '#6366f1', '#f59e0b'].filter((_, i) => [activas, encerradas, rascunhos][i] > 0).map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-slate-400">
            {[{ n: 'Activas', v: activas, c: '#10b981' }, { n: 'Encerradas', v: encerradas, c: '#6366f1' }, { n: 'Rascunho', v: rascunhos, c: '#f59e0b' }].filter(x => x.v > 0).map(x => (
              <span key={x.n} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: x.c }} />{x.n}: {x.v}</span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Utilizadores</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[
                { name: 'Eleitores', value: eleitores, color: '#6366f1' },
                { name: 'Administradores', value: admins, color: '#f59e0b' },
              ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                {[eleitores, admins].filter(v => v > 0).map((_, i) => <Cell key={i} fill={['#6366f1', '#f59e0b'][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#6366f1' }} />Eleitores: {eleitores}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />Admin: {admins}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Grupos</h3>
          <div className="flex flex-col gap-2">
            {grupos.map(g => (
              <div key={g.id} className="flex justify-between text-sm text-gray-600 dark:text-slate-400">
                <span>{g.nome}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Eleições Recentes</h3>
          <div className="flex flex-col gap-2">
            {eleicoes.slice(0, 10).map(e => (
              <div key={e.id} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-slate-300">{e.titulo}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  e.status === 'activa' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' :
                  e.status === 'encerrada' ? 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400' :
                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400'
                }`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color, detail }) {
  const colors = {
    indigo: { border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    green:  { border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    yellow: { border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    slate:  { border: 'border-gray-500/30', text: 'text-gray-500 dark:text-slate-400', bg: 'bg-gray-50 dark:bg-slate-900/50' },
  }
  const c = colors[color]
  return (
    <div className={`${c.bg} rounded-2xl p-5 border ${c.border}`}>
      <p className="text-xs text-gray-500 dark:text-slate-400 uppercase mb-1">{label}</p>
      <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
      {detail && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{detail}</p>}
    </div>
  )
}
