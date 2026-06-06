import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function NovaEleicao() {
  const navigate = useNavigate()
  const [titulo, setTitulo]       = useState('')
  const [descricao, setDescricao] = useState('')
  const [inicio, setInicio]       = useState('')
  const [fim, setFim]             = useState('')
  const [candidatos, setCandidatos] = useState([{ nome: '', descricao: '' }, { nome: '', descricao: '' }])
  const [loading, setLoading]     = useState(false)

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

  async function submeter() {
    if (!titulo || !inicio || !fim) return toast.error('Preencha título, início e fim')
    if (candidatos.some(c => !c.nome.trim())) return toast.error('Todos os candidatos precisam de nome')
    setLoading(true)
    try {
      await api.post('/eleicoes', { titulo, descricao, inicio, fim, candidatos })
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
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Eleição do Presidente do Clube" />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva o objectivo desta eleição..."
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-600 resize-none h-24 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Início">
              <Input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} />
            </Field>
            <Field label="Data de Fim">
              <Input type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} />
            </Field>
          </div>
        </div>

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
                <Input value={c.nome} onChange={e => updateCandidato(i, 'nome', e.target.value)} placeholder="Nome do candidato" />
                <Input value={c.descricao} onChange={e => updateCandidato(i, 'descricao', e.target.value)} placeholder="Descrição / proposta (opcional)" />
              </div>
            </div>
          ))}
        </div>

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
  const { theme } = useTheme()
  return <input {...props} className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-600 ${
    theme === 'dark'
      ? 'bg-slate-900 border border-slate-600 text-white'
      : 'bg-gray-100 border border-gray-300 text-gray-900'
  }`} />
}
