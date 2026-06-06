import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/api/client'
import toast from 'react-hot-toast'

export default function Perfil() {
  const { user, login, refreshUser } = useAuth()
  const fileRef = useRef()
  const [foto, setFoto]           = useState(null)
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [meusVotos, setMeusVotos] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setNome(user.nome)
      setEmail(user.email)
      setFoto(user.foto || null)
    }
    api.get('/votos/meus').then(setMeusVotos).catch(() => {})
  }, [user])

  async function uploadFoto(file) {
    if (!file) return
    if (file.size > 500000) return toast.error('Imagem muito grande (máx 500KB)')
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result
      try {
        await api.put('/auth/foto', { foto: base64 })
        setFoto(base64)
        refreshUser()
        toast.success('Foto actualizada')
      } catch (e) { toast.error(e.message) }
    }
    reader.readAsDataURL(file)
  }

  async function removerFoto() {
    try {
      await api.delete('/auth/foto')
      setFoto(null)
      refreshUser()
      toast.success('Foto removida')
    } catch (e) { toast.error(e.message) }
  }

  async function saveProfile() {
    if (!nome.trim()) return toast.error('Nome é obrigatório')
    setSaving(true)
    try {
      const res = await api.put('/auth/profile', { nome: nome.trim(), email })
      login(res.access_token, res.user)
      toast.success('Perfil actualizado')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) return toast.error('Preencha ambos os campos')
    if (newPassword.length < 6) return toast.error('Nova senha deve ter mínimo 6 caracteres')
    setSaving(true)
    try {
      await api.put('/auth/password', { current_password: currentPassword, new_password: newPassword })
      toast.success('Senha alterada')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">O Meu Perfil</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Gerir os seus dados pessoais</p>

      <div className="flex flex-col gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Fotografia</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
              {foto ? (
                <img src={foto} alt="foto" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-xl font-bold">
                  {user?.nome?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all">
                {foto ? 'Alterar' : 'Adicionar'} Foto
              </button>
              {foto && (
                <button onClick={removerFoto}
                  className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/50 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-white border border-red-300 dark:border-red-700 rounded-lg transition-all">
                  Remover
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => uploadFoto(e.target.files[0])} />
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500">A foto pode ser tirada com a câmara do telemóvel. Máx 500KB.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Informação Pessoal</h3>
          <Field label="Nome">
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="O seu nome" />
          </Field>
          <Field label="Email">
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="O seu email" />
          </Field>
          <button onClick={saveProfile} disabled={saving}
            className="self-start py-2 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
            {saving ? 'A salvar...' : 'Salvar'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Alterar Senha</h3>
          <Field label="Senha Actual">
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Nova Senha">
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </Field>
          <button onClick={changePassword} disabled={saving}
            className="self-start py-2 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
            Alterar Senha
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Os Meus Votos</h3>
        {meusVotos.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Ainda não votou em nenhuma eleição.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {meusVotos.map(v => (
              <div key={v.eleicao_id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{v.titulo}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {new Date(v.created_at).toLocaleDateString('pt-PT')} · {new Date(v.created_at).toLocaleTimeString('pt-PT')}
                    {v.tipo_voto === 'branco' && ' · Voto em Branco'}
                    {v.tipo_voto === 'nulo' && ' · Voto Nulo'}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">{v.token_unico.slice(0, 16)}…</span>
              </div>
            ))}
          </div>
        )}
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
