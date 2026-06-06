import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '@/api/client'
import { useAuth } from '@/context/AuthContext'

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#f97316', '#06b6d4', '#ec4899', '#14b8a6']

export default function Resultados() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]     = useState('')

  const fetchData = useCallback(() => {
    api.get(`/eleicoes/${id}/resultados`)
      .then(setData)
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!isAdmin || !data || data.eleicao.status !== 'activa') return
    const timer = setInterval(fetchData, 10000)
    return () => clearInterval(timer)
  }, [isAdmin, data, fetchData])

  function exportCSV() {
    if (!data) return
    const { eleicao, cargos, candidatos, total_votos, votos_branco, votos_nulo, total_inscritos, abstencao } = data
    const votosValidos = candidatos.reduce((s, c) => s + Number(c.votos), 0) + votos_branco
    let linhas = [
      ['Métrica', 'Valor'],
      ['Eleição', eleicao.titulo],
      ['Inscritos', total_inscritos],
      ['Votantes', total_votos],
      ['Abstenção', abstencao],
      ['Votos Válidos', votosValidos],
      ['Votos em Branco', votos_branco],
      ['Votos Nulos', votos_nulo],
      [''],
    ]
    if (cargos && cargos.length > 0) {
      for (const cargo of cargos) {
        const cands = candidatos.filter(c => c.cargo_id === cargo.id)
        linhas.push([`--- ${cargo.nome} ---`])
        linhas.push(['Candidato', 'Votos', '% Válidos', '% Votantes'])
        for (const c of cands) {
          linhas.push([
            c.nome,
            c.votos,
            `${votosValidos > 0 ? Math.round(Number(c.votos) / votosValidos * 100) : 0}%`,
            `${total_votos > 0 ? Math.round(Number(c.votos) / total_votos * 100) : 0}%`,
          ])
        }
        linhas.push([''])
      }
    }
    const csv = linhas.map(l => l.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${eleicao.titulo.replace(/\s+/g, '_')}_resultados.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    if (!data) return
    const { eleicao, cargos, candidatos, total_votos, votos_branco, votos_nulo, total_inscritos, abstencao } = data
    const votosValidos = candidatos.reduce((s, c) => s + Number(c.votos), 0) + votos_branco
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(79, 70, 229)
    doc.text('VotaçãoMZ', 14, 20)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(eleicao.titulo, 14, 30)

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    if (eleicao.grupo_nome) doc.text(`Grupo: ${eleicao.grupo_nome}`, 14, 37)
    doc.text(`Período: ${new Date(eleicao.inicio).toLocaleDateString('pt-PT')} — ${new Date(eleicao.fim).toLocaleDateString('pt-PT')}`, 14, 43)
    doc.text(`Status: ${eleicao.status}`, 14, 49)

    autoTable(doc, {
      startY: 56,
      head: [['Métrica', 'Valor']],
      body: [
        ['Inscritos', String(total_inscritos)],
        ['Votantes', String(total_votos)],
        ['Abstenção', String(abstencao)],
        ['Participação', `${total_inscritos > 0 ? Math.round(total_votos / total_inscritos * 100) : 0}%`],
        ['Votos Válidos', String(votosValidos)],
        ['Votos em Branco', String(votos_branco)],
        ['Votos Nulos', String(votos_nulo)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
    })

    if (cargos && cargos.length > 0) {
      for (const cargo of cargos) {
        const cands = candidatos.filter(c => c.cargo_id === cargo.id).sort((a, b) => Number(b.votos) - Number(a.votos))
        doc.addPage()
        doc.setFontSize(14)
        doc.setTextColor(79, 70, 229)
        doc.text(cargo.nome, 14, 20)
        autoTable(doc, {
          startY: 28,
          head: [['#', 'Candidato', 'Votos', '% Votantes']],
          body: cands.map((c, i) => [String(i + 1), c.nome, String(c.votos), `${total_votos > 0 ? Math.round(Number(c.votos) / total_votos * 100) : 0}%`]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [79, 70, 229] },
        })
      }
    } else {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['#', 'Candidato', 'Votos', '% Válidos', '% Votantes']],
        body: candidatos.map((c, i) => [
          String(i + 1),
          c.nome,
          String(c.votos),
          `${votosValidos > 0 ? Math.round(Number(c.votos) / votosValidos * 100) : 0}%`,
          `${total_votos > 0 ? Math.round(Number(c.votos) / total_votos * 100) : 0}%`,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
      })
    }

    doc.save(`${eleicao.titulo.replace(/\s+/g, '_')}_resultados.pdf`)
  }

  if (loading) return <Skeleton />
  if (erro) return (
    <div className="max-w-xl mx-auto text-center py-12">
      <p className="text-gray-500 dark:text-slate-400 mb-4">{erro}</p>
      <button onClick={() => navigate(-1)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">← Voltar</button>
    </div>
  )

  const { eleicao, cargos, candidatos, total_votos, votos_branco, votos_nulo, total_inscritos, abstencao } = data
  const votosValidos = candidatos.reduce((s, c) => s + Number(c.votos), 0) + votos_branco
  const participacao = total_inscritos > 0 ? Math.round(total_votos / total_inscritos * 100) : 0
  const isMulti = cargos && cargos.length > 0

  function cargoCandidates(cargoId) {
    return candidatos.filter(c => c.cargo_id === cargoId)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">← Voltar</button>
        </div>
        <div className="flex items-center gap-2">
          {eleicao.grupo_nome && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 font-medium">{eleicao.grupo_nome}</span>
          )}
          {isMulti && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-400">Multi-cargo</span>}
          <button onClick={exportCSV} className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg transition-all">
            CSV
          </button>
          <button onClick={exportPDF} className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all">
            PDF
          </button>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{eleicao.titulo}</h2>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">
        {eleicao.status === 'activa' ? 'Resultados em tempo real' : 'Resultados finais'}
        {isAdmin && eleicao.status === 'activa' && ' · actualiza a cada 10s'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <MiniStat label="Inscritos" value={total_inscritos} color="indigo" />
        <MiniStat label="Votantes" value={total_votos} color="green" />
        <MiniStat label="Abstenção" value={abstencao} color="slate" />
        <MiniStat label="Participação" value={`${participacao}%`} color={participacao > 50 ? 'green' : 'yellow'} />
        <MiniStat label="Votos Válidos" value={votosValidos} color="indigo" />
      </div>

      {candidatos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Distribuição dos Votos</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={[
                  ...candidatos.map(c => ({ name: c.nome, value: Number(c.votos), color: COLORS[candidatos.indexOf(c) % COLORS.length] })),
                  ...(votos_branco > 0 ? [{ name: 'Brancos', value: votos_branco, color: '#94a3b8' }] : []),
                  ...(votos_nulo > 0 ? [{ name: 'Nulos', value: votos_nulo, color: '#ef4444' }] : []),
                ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                  {candidatos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  {votos_branco > 0 && <Cell fill="#94a3b8" />}
                  {votos_nulo > 0 && <Cell fill="#ef4444" />}
                </Pie>
                <Tooltip formatter={v => `${v} votos`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {[...candidatos.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {c.nome}: {c.votos}
                </div>
              )),
              ...(votos_branco > 0 ? [<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#94a3b8' }} />Brancos: {votos_branco}</div>] : []),
              ...(votos_nulo > 0 ? [<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />Nulos: {votos_nulo}</div>] : []),
              ]}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Votos por Candidato</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={candidatos.map(c => ({
                name: c.nome.length > 15 ? c.nome.slice(0, 14) + '…' : c.nome,
                votos: Number(c.votos),
              }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip formatter={v => `${v} votos`} />
                <Bar dataKey="votos" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <MiniStat label="Votos em Branco" value={votos_branco} color="yellow" detail={total_votos > 0 ? `${Math.round(votos_branco / total_votos * 100)}%` : '0%'} />
        <MiniStat label="Votos Nulos" value={votos_nulo} color="red" detail={total_votos > 0 ? `${Math.round(votos_nulo / total_votos * 100)}%` : '0%'} />
      </div>

      {total_votos > 0 && (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center mb-6">
          Votos válidos = candidatos + brancos · Total votantes = válidos + nulos · Abstenção = {abstencao} de {total_inscritos} inscritos
        </p>
      )}

      {isMulti ? (
        <div className="flex flex-col gap-6">
          {cargos.map(cargo => {
            const cands = cargoCandidates(cargo.id).sort((a, b) => Number(b.votos) - Number(a.votos))
            const vencedor = cands[0]
            return (
              <div key={cargo.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cargo.nome}</h3>
                  {eleicao.status === 'encerrada' && vencedor && Number(vencedor.votos) > 0 && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full font-medium">
                      🏆 {vencedor.nome}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {cands.map((c, i) => {
                    const pctVotantes = total_votos > 0 ? Math.round(Number(c.votos) / total_votos * 100) : 0
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-slate-900 rounded-xl">
                        <div className="flex items-center gap-2">
                          {i === 0 && Number(c.votos) > 0 && eleicao.status === 'encerrada' && <span className="text-sm">🥇</span>}
                          {i === 1 && Number(c.votos) > 0 && eleicao.status === 'encerrada' && <span className="text-sm">🥈</span>}
                          {i === 2 && Number(c.votos) > 0 && eleicao.status === 'encerrada' && <span className="text-sm">🥉</span>}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{c.nome}</span>
                        </div>
                        <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                          {c.votos} <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">({pctVotantes}%)</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          {eleicao.status === 'encerrada' && candidatos[0] && Number(candidatos[0].votos) > 0 && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">🏆</div>
              <div className="text-white">
                <p className="text-xs text-white/70 uppercase tracking-wider">Vencedor</p>
                <p className="font-bold text-xl">{candidatos[0].nome}</p>
                <p className="text-sm text-white/80">
                  {candidatos[0].votos} votos · {votosValidos > 0 ? Math.round(candidatos[0].votos / votosValidos * 100) : 0}% válidos · {total_votos > 0 ? Math.round(candidatos[0].votos / total_votos * 100) : 0}% votantes
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resultado detalhado</h3>
            {candidatos.map((c, i) => {
              const pctValidos = votosValidos > 0 ? Math.round(Number(c.votos) / votosValidos * 100) : 0
              const pctVotantes = total_votos > 0 ? Math.round(Number(c.votos) / total_votos * 100) : 0
              return (
                <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {i === 0 && Number(c.votos) > 0 && eleicao.status === 'encerrada' && <span className="text-lg">🥇</span>}
                      {i === 1 && Number(c.votos) > 0 && eleicao.status === 'encerrada' && <span className="text-lg">🥈</span>}
                      {i === 2 && Number(c.votos) > 0 && eleicao.status === 'encerrada' && <span className="text-lg">🥉</span>}
                      <span className="text-gray-900 dark:text-white font-medium">{c.nome}</span>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold whitespace-nowrap">
                      {c.votos} votos{' '}
                      <span className="text-gray-400 dark:text-slate-500 text-xs font-normal">({pctValidos}% válidos · {pctVotantes}% votantes)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctVotantes}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {isAdmin && eleicao.status === 'activa' && (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-6">🔴 Resultados em tempo real — eleição ainda activa</p>
      )}
    </div>
  )
}

function MiniStat({ label, value, color, detail }) {
  const colors = {
    indigo: { border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    green:  { border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    yellow: { border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    red:    { border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    slate:  { border: 'border-gray-500/30 dark:border-slate-500/30', text: 'text-gray-500 dark:text-slate-400', bg: 'bg-gray-50 dark:bg-slate-900/50' },
  }
  const c = colors[color]
  return (
    <div className={`${c.bg} rounded-xl p-3 border text-center ${c.border} flex-1`}>
      <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">{label}</p>
      <p className={`text-xl font-bold ${c.text}`}>{value}</p>
      {detail && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{detail}</p>}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
      <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-6" />
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-slate-700 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="h-[340px] bg-gray-200 dark:bg-slate-700 rounded-2xl" />
        <div className="h-[340px] bg-gray-200 dark:bg-slate-700 rounded-2xl" />
      </div>
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />)}
    </div>
  )
}
