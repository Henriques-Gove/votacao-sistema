import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'

export default function AdminAudit() {
  const navigate = useNavigate()
  const [eleicoes, setEleicoes]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [votantes, setVotantes]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get('/eleicoes').then(setEleicoes).finally(() => setLoading(false))
  }, [])

  async function loadVotantes(eleicaoId) {
    setSelected(eleicaoId)
    setLoading(true)
    try {
      const res = await api.get(`/eleicoes/${eleicaoId}/votantes`)
      setVotantes(res)
    } catch (e) { setVotantes([]) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Registo de Votação</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Quem votou em cada eleição (sem revelar o voto)</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Eleições</h3>
          {eleicoes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">Nenhuma eleição</p>
          ) : (
            <div className="flex flex-col gap-1">
              {eleicoes.map(e => (
                <button key={e.id} onClick={() => loadVotantes(e.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selected === e.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}>
                  <span className="block font-medium">{e.titulo}</span>
                  <span className="block text-xs opacity-60">{e.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
            {selected ? 'Eleitores que votaram' : 'Seleccione uma eleição'}
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">A carregar...</p>
          ) : votantes.length === 0 && selected ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">Nenhum voto registado nesta eleição.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-slate-400 text-xs uppercase">
                    <th className="pb-2 pr-4">Nome</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Voto</th>
                    <th className="pb-2">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {votantes.map(v => (
                    <tr key={`${v.id}-${v.votou_em}`} className="text-gray-700 dark:text-slate-300">
                      <td className="py-2.5 pr-4">{v.nome}</td>
                      <td className="py-2.5 pr-4 text-xs">{v.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          v.tipo_voto === 'candidato' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400' :
                          v.tipo_voto === 'branco' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400'
                        }`}>
                          {v.tipo_voto}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs">{new Date(v.votou_em).toLocaleString('pt-PT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
