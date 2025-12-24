'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovoTipoServicoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    active: true,
  })

  const getCompanyIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.companyId || null
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }

  const generateCodeFromName = (name: string): string => {
    return name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^A-Z0-9]/g, '_') // Substitui caracteres especiais por _
      .replace(/_+/g, '_') // Remove múltiplos underscores
      .replace(/^_|_$/g, '') // Remove underscores no início e fim
  }

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'saveAndNew' | 'saveAndClose' = 'saveAndClose') => {
    e.preventDefault()

    if (!formData.name) {
      alert('Preencha o nome do tipo de serviço')
      return
    }

    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      // Gerar código automaticamente se não fornecido
      const code = formData.code 
        ? formData.code.toUpperCase().replace(/\s+/g, '_')
        : generateCodeFromName(formData.name)

      const payload = {
        code: code,
        name: formData.name,
        active: formData.active,
        companyId: companyId,
      }

      await api.post('/service-types', payload)
      alert('Tipo de serviço criado com sucesso!')
      
      if (action === 'saveAndNew') {
        // Limpar formulário e manter na tela
        setFormData({
          code: '',
          name: '',
          active: true,
        })
      } else if (action === 'saveAndClose') {
        router.push('/administracao?tab=tipos-servico')
      }
    } catch (error: any) {
      console.error('Erro ao criar tipo de serviço:', error)
      alert(error.response?.data?.message || 'Erro ao criar tipo de serviço')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 inline-block cursor-pointer"
            >
              ← Voltar
            </button>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Tipo de Serviço</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Código */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Código
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: AUTOMACOES (opcional - será gerado automaticamente se não preenchido)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Código único para identificar o tipo de serviço. Se não preenchido, será gerado automaticamente a partir do nome.
            </p>
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Automações"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Ativo</span>
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/administracao?tab=tipos-servico')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'saveAndNew')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar e Novo'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'saveAndClose')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar e Fechar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

