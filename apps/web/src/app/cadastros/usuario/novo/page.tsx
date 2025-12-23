'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [contacts, setContacts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    contactId: '', // ID do contato selecionado
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: false,
    ativo: true,
  })
  const [selectedContact, setSelectedContact] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadContacts()
  }, [router])

  const loadContacts = async () => {
    try {
      setLoadingContacts(true)
      const response = await api.get('/contacts')
      setContacts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      alert('Erro ao carregar contatos')
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleContactChange = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    setSelectedContact(contact || null)
    setFormData({
      ...formData,
      contactId,
      email: contact?.email || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.contactId) {
      alert('Selecione um contato')
      return
    }

    if (!formData.email) {
      alert('Preencha o email')
      return
    }

    if (!formData.password) {
      alert('Preencha a senha')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      setLoading(true)
      await api.post('/users', {
        contactId: formData.contactId,
        email: formData.email,
        password: formData.password,
        isAdmin: formData.isAdmin,
        ativo: formData.ativo,
      })
      alert('Usuário criado com sucesso!')
      router.push('/templates?tab=usuarios')
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      alert(error.response?.data?.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/templates?tab=usuarios"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Usuários
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Usuário</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Seleção de Contato */}
          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Contato <span className="text-red-500">*</span>
            </label>
            {loadingContacts ? (
              <p className="text-gray-500 text-sm">Carregando contatos...</p>
            ) : (
              <select
                id="contactId"
                value={formData.contactId}
                onChange={(e) => handleContactChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              >
                <option value="">Selecione um contato...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.email ? `(${contact.email})` : ''} {contact.phone ? `- ${contact.phone}` : ''}
                  </option>
                ))}
              </select>
            )}
            {contacts.length === 0 && !loadingContacts && (
              <p className="text-sm text-red-500 mt-1">
                Nenhum contato disponível. Cadastre contatos na seção de Cadastros primeiro.
              </p>
            )}
            {selectedContact && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Contato selecionado:</strong> {selectedContact.name}
                  {selectedContact.email && ` - ${selectedContact.email}`}
                  {selectedContact.phone && ` - ${selectedContact.phone}`}
                </p>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            />
            {selectedContact && selectedContact.email && formData.email !== selectedContact.email && (
              <p className="mt-1 text-xs text-yellow-600">
                O email do contato selecionado é: {selectedContact.email}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">
              A senha deve ter pelo menos 6 caracteres
            </p>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Digite a senha novamente"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
              minLength={6}
            />
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                As senhas não coincidem
              </p>
            )}
          </div>

          {/* Admin */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700">
              Usuário Administrador
            </label>
          </div>

          {/* Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
              Usuário Ativo
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/templates?tab=usuarios')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading || !formData.contactId || !formData.email || !formData.password || formData.password !== formData.confirmPassword}
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

