import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/context/AuthContext'

export default function Resultados() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]     = useState('')

  useEffect(() => {
    api.get(`/eleicoes/${id}/resultados`)
      .then(setData)
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-gray-500 dark:text-slate-400">A carregar resultados...</p>
  if (erro) return (
    <div className="max-w-xl mx-auto text-center py-12">
      <p className="text-gray-500 dark:text-slate-400 mb-4">{erro}</p>
      <button onClick={() => navigate(-1)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">← Voltar</button>
    </div>
  )

  const { eleicao, candidatos, total_votos, votos_branco, votos_nulo, total_inscritos, abstencao } = data
  const vencedor = candidatos[0]
  const participacao = total_inscritos > 0 ? Math.round(total_votos / total_inscritos * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center gap-2">← Voltar</button>

      <div className="flex items-start justify-between mb-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados</h2>
        {eleicao.grupo_nome && (
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 font-medium whitespace-nowrap">
            {eleicao.grupo_nome}
          </span>
        )}
      </div>
      <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-4">{eleicao.titulo}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MiniStat label="Inscritos" value={total_inscritos} color="indigo" />
        <MiniStat label="Votaram" value={total_votos} color="green" />
        <MiniStat label="Abstenção" value={abstencao} color="slate" />
        <MiniStat label="Participação" value={`${participacao}%`} color={participacao > 50 ? 'green' : 'yellow'} />
      </div>

      <div className="flex gap-3 mb-6">
        <MiniStat label="Votos em Branco" value={votos_branco} color="yellow" />
        <MiniStat label="Votos Nulos" value={votos_nulo} color="red" />
      </div>

      {eleicao.status === 'encerrada' && vencedor && Number(vencedor.votos) > 0 && (
        <div className="bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xl">🏆</div>
          <div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Vencedor</p>
            <p className="text-gray-900 dark:text-white font-bold text-lg">{vencedor.nome}</p>
            <p className="text-indigo-600 dark:text-indigo-300 text-sm">{vencedor.votos} votos ({total_votos > 0 ? Math.round(vencedor.votos / total_votos * 100) : 0}% dos votos) • {Math.round(vencedor.votos / total_inscritos * 100)}% dos inscritos</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {candidatos.map((c, i) => {
          const pctVotos = total_votos > 0 ? Math.round(Number(c.votos) / total_votos * 100) : 0
          const pctInscritos = total_inscritos > 0 ? Math.round(Number(c.votos) / total_inscritos * 100) : 0
          return (
            <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {i === 0 && Number(c.votos) > 0 && eleicao.status === 'encerrada' && <span className="text-lg">🥇</span>}
                  <span className="text-gray-900 dark:text-white font-medium">{c.nome}</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {c.votos} <span className="text-gray-400 dark:text-slate-500 text-xs font-normal">({pctVotos}% votos • {pctInscritos}% inscritos)</span>
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pctVotos}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {isAdmin && eleicao.status === 'activa' && (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-6">Resultados em tempo real — eleição ainda activa</p>
      )}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  const colors = {
    indigo: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
    green:  'border-green-500/30 text-green-600 dark:text-green-400',
    yellow: 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
    red:    'border-red-500/30 text-red-600 dark:text-red-400',
    slate:  'border-gray-500/30 dark:border-slate-500/30 text-gray-500 dark:text-slate-400',
  }
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-3 border text-center ${colors[color]}`}>
      <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">{label}</p>
      <p className={`text-xl font-bold ${colors[color].split(' ')[2]}`}>{value}</p>
    </div>
  )
}
