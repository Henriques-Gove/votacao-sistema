import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function NovaEleicao() {
  const navigate = useNavigate()
  const [titulo, setTitulo]       = useState('')
  const [descricao, setDescricao] = useState('')
  const [inicio, setInicio]       = useState('')
  const [fim, setFim]             = useState('')
  const [grupoId, setGrupoId]     = useState('')
  const [grupos, setGrupos]       = useState([])
  const [multiCargo, setMultiCargo] = useState(false)
  const [candidatos, setCandidatos] = useState([{ nome: '', descricao: '' }, { nome: '', descricao: '' }])
  const [cargos, setCargos] = useState([
    { nome: 'Presidente', descricao: '', candidatos: [{ nome: '', descricao: '' }, { nome: '', descricao: '' }] },
    { nome: 'Vice-Presidente', descricao: '', candidatos: [{ nome: '', descricao: '' }, { nome: '', descricao: '' }] },
    { nome: 'Secretário', descricao: '', candidatos: [{ nome: '', descricao: '' }, { nome: '', descricao: '' }] },
  ])
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    api.get('/grupos').then(setGrupos).catch(() => {})
  }, [])

  function addCandidato() {
    setCandidatos([...candidatos, { nome: '', descricao: '' }])
  }
  function removeCandidato(i) {
    if (candidatos.length <= 2) return toast.error('Mínimo 2 candidatos')
    setCandidatos(candidatos.filter((_, idx) => idx !== i))
  }
  function updateCandidato(i, field, val) {
    const novo = [...candidatos]
    novo[i][field] = val
    setCandidatos(novo)
  }

  function addCargo() {
    setCargos([...cargos, { nome: '', descricao: '', candidatos: [{ nome: '', descricao: '' }, { nome: '', descricao: '' }] }])
  }
  function removeCargo(i) {
    if (cargos.length <= 1) return toast.error('Mínimo 1 cargo')
    setCargos(cargos.filter((_, idx) => idx !== i))
  }
  function updateCargo(i, field, val) {
    const novo = [...cargos]
    novo[i][field] = val
    setCargos(novo)
  }
  function addCargoCandidato(cargoIdx) {
    const novo = [...cargos]
    novo[cargoIdx].candidatos.push({ nome: '', descricao: '' })
    setCargos(novo)
  }
  function removeCargoCandidato(cargoIdx, candIdx) {
    const novo = [...cargos]
    if (novo[cargoIdx].candidatos.length <= 2) return toast.error('Mínimo 2 candidatos por cargo')
    novo[cargoIdx].candidatos = novo[cargoIdx].candidatos.filter((_, idx) => idx !== candIdx)
    setCargos(novo)
  }
  function updateCargoCandidato(cargoIdx, candIdx, field, val) {
    const novo = [...cargos]
    novo[cargoIdx].candidatos[candIdx][field] = val
    setCargos(novo)
  }

  async function submeter() {
    if (!titulo || !inicio || !fim) return toast.error('Preencha título, início e fim')
    if (new Date(inicio) >= new Date(fim)) return toast.error('Fim deve ser após início')

    if (multiCargo) {
      if (cargos.some(c => !c.nome.trim())) return toast.error('Todos os cargos precisam de nome')
      if (cargos.some(c => c.candidatos.some(cd => !cd.nome.trim()))) return toast.error('Todos os candidatos precisam de nome')
    } else {
      if (candidatos.some(c => !c.nome.trim())) return toast.error('Todos os candidatos precisam de nome')
    }

    setLoading(true)
    try {
      const payload = { titulo, descricao, inicio, fim, grupo_id: grupoId ? Number(grupoId) : null }
      if (multiCargo) {
        payload.cargos = cargos.map(c => ({
          nome: c.nome.trim(),
          descricao: c.descricao,
          candidatos: c.candidatos.map(cd => ({ nome: cd.nome.trim(), descricao: cd.descricao })),
        }))
      } else {
        payload.candidatos = candidatos.map(c => ({ nome: c.nome.trim(), descricao: c.descricao }))
      }
      await api.post('/eleicoes', payload)
      toast.success('Eleição criada!')
      navigate('/admin/eleicoes')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center gap-2">← Voltar</button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Nova Eleição</h2>

      <div className="flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Informação Geral</h3>
          <Field label="Título">
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Eleição do Grémio Estudantil" />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva o objectivo..."
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-600 resize-none h-24" />
          </Field>
          <Field label="Grupo (opcional)">
            <select value={grupoId} onChange={e => setGrupoId(e.target.value)}
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">Todos os eleitores</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Início">
              <Input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} />
            </Field>
            <Field label="Data de Fim">
              <Input type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} />
            </Field>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setMultiCargo(!multiCargo)}
                className={`w-10 h-5 rounded-full transition-all relative ${multiCargo ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${multiCargo ? 'left-5' : 'left-0.5'}`} />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Múltiplos Cargos</span>
                <p className="text-xs text-gray-500 dark:text-slate-400">Presidente, Vice-Presidente, Secretário, etc.</p>
              </div>
            </label>
          </div>
        </div>

        {!multiCargo ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Candidatos</h3>
              <button onClick={addCandidato} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">+ Adicionar</button>
            </div>
            {candidatos.map((c, i) => (
              <div key={i} className="p-4 bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">Candidato {i + 1}</span>
                  {candidatos.length > 2 && (
                    <button onClick={() => removeCandidato(i)} className="text-xs text-red-600 dark:text-red-400 hover:text-red-500">Remover</button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Input value={c.nome} onChange={e => updateCandidato(i, 'nome', e.target.value)} placeholder="Nome" />
                  <Input value={c.descricao} onChange={e => updateCandidato(i, 'descricao', e.target.value)} placeholder="Descrição (opcional)" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Cargos e Candidatos</h3>
              <button onClick={addCargo} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">+ Adicionar Cargo</button>
            </div>
            {cargos.map((cargo, ci) => (
              <div key={ci} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">Cargo {ci + 1}</span>
                  {cargos.length > 1 && (
                    <button onClick={() => removeCargo(ci)} className="text-xs text-red-600 dark:text-red-400 hover:text-red-500">Remover Cargo</button>
                  )}
                </div>
                <div className="flex flex-col gap-3 mb-4">
                  <Input value={cargo.nome} onChange={e => updateCargo(ci, 'nome', e.target.value)} placeholder="Nome do cargo (ex: Presidente)" />
                  <Input value={cargo.descricao} onChange={e => updateCargo(ci, 'descricao', e.target.value)} placeholder="Descrição do cargo (opcional)" />
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 dark:text-slate-400 uppercase">Candidatos para este cargo</span>
                    <button onClick={() => addCargoCandidato(ci)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">+ Adicionar</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {cargo.candidatos.map((cd, di) => (
                      <div key={di} className="p-3 bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 dark:text-slate-400">Candidato {di + 1}</span>
                          {cargo.candidatos.length > 2 && (
                            <button onClick={() => removeCargoCandidato(ci, di)} className="text-xs text-red-600 dark:text-red-400 hover:text-red-500">Remover</button>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Input value={cd.nome} onChange={e => updateCargoCandidato(ci, di, 'nome', e.target.value)} placeholder="Nome" />
                          <Input value={cd.descricao} onChange={e => updateCargoCandidato(ci, di, 'descricao', e.target.value)} placeholder="Descrição (opcional)" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={submeter} disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
          {loading ? 'A criar...' : 'Criar Eleição'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

function Input(props) {
  return <input {...props} className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-600" />
}
