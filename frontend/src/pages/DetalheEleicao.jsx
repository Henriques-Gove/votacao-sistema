import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function DetalheEleicao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [eleicao, setEleicao]           = useState(null)
  const [selecionado, setSelecionado]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [voting, setVoting]             = useState(false)

  useEffect(() => {
    api.get(`/eleicoes/${id}`).then(setEleicao).catch(() => navigate('/eleicoes')).finally(() => setLoading(false))
  }, [id])

  async function votar() {
    if (!selecionado) return toast.error('Seleccione um candidato')
    if (!confirm('Confirma o seu voto? Esta acção é irreversível.')) return
    setVoting(true)
    try {
      const res = await api.post('/votos', { eleicao_id: Number(id), candidato_id: selecionado })
      toast.success('Voto registado com sucesso!')
      navigate(`/eleicoes/${id}/resultados`)
    } catch (e) {
      toast.error(e.message)
    } finally { setVoting(false) }
  }

  if (loading) return <p className="text-slate-400">A carregar...</p>
  if (!eleicao) return null

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/eleicoes')} className="text-sm text-slate-400 hover:text-white mb-6 flex items-center gap-2">
        ← Voltar
      </button>

      <h2 className="text-2xl font-bold text-white mb-2">{eleicao.titulo}</h2>
      {eleicao.descricao && <p className="text-slate-400 mb-2">{eleicao.descricao}</p>}
      <p className="text-xs text-slate-500 mb-8">Termina em: {new Date(eleicao.fim).toLocaleString('pt-PT')}</p>

      {eleicao.ja_votou ? (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-6 text-center">
          <p className="text-green-400 font-semibold text-lg">✓ Já votou nesta eleição</p>
          <button onClick={() => navigate(`/eleicoes/${id}/resultados`)}
            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-all">
            Ver Resultados Parciais
          </button>
        </div>
      ) : eleicao.status !== 'activa' ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-slate-400">Esta eleição não está activa para votação.</p>
        </div>
      ) : (
        <>
          <h3 className="font-semibold text-white mb-4">Seleccione o seu candidato:</h3>
          <div className="flex flex-col gap-3 mb-6">
            {eleicao.candidatos.map(c => (
              <button key={c.id} onClick={() => setSelecionado(c.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selecionado === c.id
                    ? 'border-indigo-500 bg-indigo-900/30'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selecionado === c.id ? 'border-indigo-400' : 'border-slate-600'
                  }`}>
                    {selecionado === c.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{c.nome}</p>
                    {c.descricao && <p className="text-sm text-slate-400 mt-0.5">{c.descricao}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={votar} disabled={!selecionado || voting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {voting ? 'A registar voto...' : 'Confirmar Voto'}
          </button>
          <p className="text-xs text-slate-500 text-center mt-3">O voto é confidencial e irreversível</p>
        </>
      )}
    </div>
  )
}
