import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function DetalheEleicao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [eleicao, setEleicao]             = useState(null)
  const [votosCargo, setVotosCargo]       = useState({})
  const [cargoAtual, setCargoAtual]       = useState(0)
  const [loading, setLoading]             = useState(true)
  const [voting, setVoting]               = useState(false)

  useEffect(() => {
    api.get(`/eleicoes/${id}`).then(setEleicao).catch(() => navigate('/eleicoes')).finally(() => setLoading(false))
  }, [id])

  function setVoto(cargoId, tipo, candidatoId) {
    setVotosCargo(prev => ({ ...prev, [cargoId || 'geral']: { tipo, candidatoId } }))
  }

  function getCargoVoto(cargoId) {
    return votosCargo[cargoId || 'geral'] || {}
  }

  async function votar() {
    const isMulti = eleicao.cargos && eleicao.cargos.length > 0
    if (!isMulti && !votosCargo['geral']) return toast.error('Seleccione uma opção de voto')

    if (isMulti) {
      const semVoto = eleicao.cargos.some(c => !votosCargo[c.id])
      if (semVoto) return toast.error('Vote em todos os cargos antes de confirmar')
    }

    if (!confirm('Confirma os seus votos? Esta acção é irreversível.')) return
    setVoting(true)
    try {
      if (isMulti) {
        for (const cargo of eleicao.cargos) {
          const v = votosCargo[cargo.id]
          await api.post('/votos', {
            eleicao_id: Number(id),
            cargo_id: cargo.id,
            tipo_voto: v.tipo,
            ...(v.tipo === 'candidato' ? { candidato_id: v.candidatoId } : {}),
          })
        }
      } else {
        const v = votosCargo['geral']
        const payload = { eleicao_id: Number(id), tipo_voto: v.tipo }
        if (v.tipo === 'candidato') payload.candidato_id = v.candidatoId
        await api.post('/votos', payload)
      }
      toast.success('Votos registados com sucesso!')
      navigate(`/eleicoes/${id}/resultados`)
    } catch (e) { toast.error(e.message) }
    finally { setVoting(false) }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-6" />
      <div className="h-8 w-64 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-8" />
      <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />
      <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />
      <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />
    </div>
  )
  if (!eleicao) return null

  const isMulti = eleicao.cargos && eleicao.cargos.length > 0
  const jaVotouCompleto = !isMulti
    ? eleicao.ja_votou && eleicao.ja_votou.length > 0
    : eleicao.cargos.every(c => eleicao.ja_votou?.some(v => v.cargo_id === c.id))

  const cargoAtualObj = isMulti ? eleicao.cargos[cargoAtual] : null
  const candidatosCargo = isMulti
    ? eleicao.candidatos.filter(c => c.cargo_id === cargoAtualObj?.id)
    : eleicao.candidatos

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/eleicoes')} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center gap-2">← Voltar</button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{eleicao.titulo}</h2>
          {eleicao.descricao && <p className="text-gray-500 dark:text-slate-400 mb-2">{eleicao.descricao}</p>}
        </div>
        {eleicao.grupo_nome && (
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 font-medium whitespace-nowrap">{eleicao.grupo_nome}</span>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
        Termina em: {new Date(eleicao.fim).toLocaleString('pt-PT')}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-8">
        Total de inscritos: <strong className="text-gray-700 dark:text-slate-300">{eleicao.total_inscritos}</strong>
        {isMulti && ` · ${eleicao.cargos.length} cargos`}
        {!isMulti && ' · 1 cargo'}
      </p>

      {jaVotouCompleto ? (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-2xl p-6 text-center">
          <p className="text-green-700 dark:text-green-400 font-semibold text-lg">✓ Já votou</p>
          <button onClick={() => navigate(`/eleicoes/${id}/resultados`)}
            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-all">
            Ver Resultados
          </button>
        </div>
      ) : eleicao.status !== 'activa' ? (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-gray-500 dark:text-slate-400">Esta eleição não está activa para votação.</p>
        </div>
      ) : (
        <>
          {isMulti && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {eleicao.cargos.map((c, i) => {
                const votou = eleicao.ja_votou?.some(v => v.cargo_id === c.id)
                return (
                  <button key={c.id} onClick={() => setCargoAtual(i)}
                    className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                      cargoAtual === i
                        ? 'bg-indigo-600 text-white'
                        : votou
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600'
                    }`}>
                    {c.nome} {votou ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          )}

          {isMulti && cargoAtualObj && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cargoAtualObj.nome}</h3>
              {cargoAtualObj.descricao && <p className="text-sm text-gray-500 dark:text-slate-400">{cargoAtualObj.descricao}</p>}
            </div>
          )}

          <div className="flex flex-col gap-3 mb-6">
            {candidatosCargo.map(c => {
              const voto = getCargoVoto(c.cargo_id || 'geral')
              return (
                <button key={c.id} onClick={() => { setVoto(c.cargo_id || 'geral', 'candidato', c.id); if (isMulti && cargoAtual < eleicao.cargos.length - 1) setCargoAtual(cargoAtual + 1) }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    voto.tipo === 'candidato' && voto.candidatoId === c.id
                      ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      voto.tipo === 'candidato' && voto.candidatoId === c.id ? 'border-indigo-400' : 'border-gray-400 dark:border-slate-600'
                    }`}>
                      {voto.tipo === 'candidato' && voto.candidatoId === c.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{c.nome}</p>
                      {c.descricao && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{c.descricao}</p>}
                    </div>
                  </div>
                </button>
              )
            })}

            <button onClick={() => { setVoto(cargoAtualObj?.id || 'geral', 'branco', null); if (isMulti && cargoAtual < eleicao.cargos.length - 1) setCargoAtual(cargoAtual + 1) }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                getCargoVoto(cargoAtualObj?.id || 'geral').tipo === 'branco'
                  ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  getCargoVoto(cargoAtualObj?.id || 'geral').tipo === 'branco' ? 'border-yellow-400' : 'border-gray-400 dark:border-slate-600'
                }`}>
                  {getCargoVoto(cargoAtualObj?.id || 'geral').tipo === 'branco' && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Voto em Branco</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Voto válido que não escolhe nenhum candidato</p>
                </div>
              </div>
            </button>

            <button onClick={() => { setVoto(cargoAtualObj?.id || 'geral', 'nulo', null); if (isMulti && cargoAtual < eleicao.cargos.length - 1) setCargoAtual(cargoAtual + 1) }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                getCargoVoto(cargoAtualObj?.id || 'geral').tipo === 'nulo'
                  ? 'border-red-400 bg-red-100 dark:bg-red-900/30'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  getCargoVoto(cargoAtualObj?.id || 'geral').tipo === 'nulo' ? 'border-red-400' : 'border-gray-400 dark:border-slate-600'
                }`}>
                  {getCargoVoto(cargoAtualObj?.id || 'geral').tipo === 'nulo' && <div className="w-2.5 h-2.5 rounded-full bg-red-400" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Voto Nulo</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Voto inválido (não conta como voto válido)</p>
                </div>
              </div>
            </button>
          </div>

          <button onClick={votar} disabled={voting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {voting ? 'A registar votos...' : isMulti ? 'Confirmar Todos os Votos' : 'Confirmar Voto'}
          </button>
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-3">O voto é confidencial e irreversível</p>
        </>
      )}
    </div>
  )
}
