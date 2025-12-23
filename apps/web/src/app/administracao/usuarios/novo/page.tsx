'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    contactId: '',
    email: '',
    password: '',
    passwordConfirm: '',
    isAdmin: false,
    isActive: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      const response = await api.get('/contacts')
      setContacts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validações
    if (!formData.contactId) {
      setErrors({ contactId: 'Selecione um contato' })
      return
    }

    if (!formData.email) {
      setErrors({ email: 'Email é obrigatório' })
      return
    }

    if (!formData.password) {
      setErrors({ password: 'Senha é obrigatória' })
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setErrors({ passwordConfirm: 'As senhas não coincidem' })
      return
    }

    if (formData.password.length < 6) {
      setErrors({ password: 'A senha deve ter pelo menos 6 caracteres' })
      return
    }

    try {
      setLoading(true)
      const selectedContact = contacts.find(c => c.id === formData.contactId)
      
      const userData = {
        contactId: formData.contactId,
        name: selectedContact?.name || '',
        email: formData.email,
        passwordHash: formData.password, // O service vai fazer o hash
        isAdmin: formData.isAdmin,
        isActive: formData.isActive,
      }

      await api.post('/users', userData)
      router.push('/administracao')
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message })
      } else {
        setErrors({ submit: 'Erro ao criar usuário. Tente novamente.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedContact = contacts.find(c => c.id === formData.contactId)

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
          <h1 className="text-3xl font-bold text-gray-900">Novo Usuário</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
              Contato <span className="text-red-500">*</span>
            </label>
            <select
              id="contactId"
              value={formData.contactId}
              onChange={(e) => {
                setFormData({ ...formData, contactId: e.target.value })
                const contact = contacts.find(c => c.id === e.target.value)
                if (contact?.email) {
                  setFormData(prev => ({ ...prev, email: contact.email || '' }))
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                errors.contactId ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Selecione um contato</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.email && `(${contact.email})`}
                </option>
              ))}
            </select>
            {errors.contactId && (
              <p className="mt-1 text-sm text-red-600">{errors.contactId}</p>
            )}
            {selectedContact && (
              <p className="mt-2 text-sm text-gray-600">
                <strong>Email do contato:</strong> {selectedContact.email || 'Não informado'}
                {selectedContact.phone && (
                  <>
                    <br />
                    <strong>Telefone:</strong> {selectedContact.phone}
                  </>
                )}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                errors.passwordConfirm ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.passwordConfirm && (
              <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm}</p>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Administrador</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Ativo</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/administracao"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

