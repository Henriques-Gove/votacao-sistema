import { useState, useEffect } from 'react'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

export default function AdminUtilizadores() {
  const { user: eu } = useAuth()
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    api.get('/users').then(setUsers).finally(() => setLoading(false))
  }

  async function mudarRole(id, role) {
    try {
      await api.put(`/users/${id}/role`, { role })
      toast.success('Papel actualizado')
      carregar()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Utilizadores</h2>
      <p className="text-slate-400 text-sm mb-8">Gerir papéis e permissões</p>

      {loading ? <p className="text-slate-400">A carregar...</p> : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Nome', 'Email', 'Papel', 'Verificado', 'Registado em', 'Acções'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-5 py-3.5 text-sm text-white">{u.nome}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-indigo-900 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs ${u.verified ? 'text-green-400' : 'text-red-400'}`}>
                        {u.verified ? '✓ Sim' : '✗ Não'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.id !== eu?.id && (
                        <button
                          onClick={() => mudarRole(u.id, u.role === 'admin' ? 'eleitor' : 'admin')}
                          className="text-xs px-3 py-1.5 border border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-lg transition-all">
                          {u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
