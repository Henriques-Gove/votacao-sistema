import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function DetalheEleicao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [eleicao, setEleicao]           = useState(null)
  const [selecionado, setSelecionado]   = useState(null)
  const [votoBranco, setVotoBranco]     = useState(false)
  const [loading, setLoading]           = useState(true)
  const [voting, setVoting]             = useState(false)

  useEffect(() => {
    api.get(`/eleicoes/${id}`).then(setEleicao).catch(() => navigate('/eleicoes')).finally(() => setLoading(false))
  }, [id])

  async function votar() {
    if (!selecionado && !votoBranco) return toast.error('Seleccione um candidato ou escolha voto em branco')
    if (!confirm('Confirma o seu voto? Esta acção é irreversível.')) return
    setVoting(true)
    try {
      const payload = { eleicao_id: Number(id) }
      if (votoBranco) {
        payload.tipo_voto = 'branco'
      } else {
        payload.candidato_id = selecionado
      }
      const res = await api.post('/votos', payload)
      toast.success('Voto registado com sucesso!')
      navigate(`/eleicoes/${id}/resultados`)
    } catch (e) {
      toast.error(e.message)
    } finally { setVoting(false) }
  }

  if (loading) return <p className="text-gray-500 dark:text-slate-400">A carregar...</p>
  if (!eleicao) return null

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/eleicoes')} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center gap-2">
        ← Voltar
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{eleicao.titulo}</h2>
          {eleicao.descricao && <p className="text-gray-500 dark:text-slate-400 mb-2">{eleicao.descricao}</p>}
        </div>
        {eleicao.grupo_nome && (
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 font-medium whitespace-nowrap">
            {eleicao.grupo_nome}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
        Termina em: {new Date(eleicao.fim).toLocaleString('pt-PT')}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-8">
        Total de inscritos: <strong className="text-gray-700 dark:text-slate-300">{eleicao.total_inscritos}</strong>
      </p>

      {eleicao.ja_votou ? (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-2xl p-6 text-center">
          <p className="text-green-700 dark:text-green-400 font-semibold text-lg">✓ Já votou nesta eleição</p>
          {eleicao.tipo_voto_usuario === 'branco' && (
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">(Voto em Branco)</p>
          )}
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
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Seleccione o seu candidato:</h3>
          <div className="flex flex-col gap-3 mb-6">
            {eleicao.candidatos.map(c => (
              <button key={c.id} onClick={() => { setSelecionado(c.id); setVotoBranco(false) }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selecionado === c.id && !votoBranco
                    ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selecionado === c.id && !votoBranco ? 'border-indigo-400' : 'border-gray-400 dark:border-slate-600'
                  }`}>
                    {selecionado === c.id && !votoBranco && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{c.nome}</p>
                    {c.descricao && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{c.descricao}</p>}
                  </div>
                </div>
              </button>
            ))}

            <button onClick={() => { setVotoBranco(true); setSelecionado(null) }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                votoBranco
                  ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  votoBranco ? 'border-yellow-400' : 'border-gray-400 dark:border-slate-600'
                }`}>
                  {votoBranco && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Voto em Branco</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Não escolher nenhum candidato</p>
                </div>
              </div>
            </button>
          </div>

          <button onClick={votar} disabled={(!selecionado && !votoBranco) || voting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {voting ? 'A registar voto...' : 'Confirmar Voto'}
          </button>
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-3">O voto é confidencial e irreversível</p>
        </>
      )}
    </div>
  )
}
