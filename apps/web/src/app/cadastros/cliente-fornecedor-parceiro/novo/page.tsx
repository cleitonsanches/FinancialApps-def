'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

interface Contact {
  id?: string
  name: string
  phone?: string
  email?: string
}

export default function NovoClienteFornecedorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [formData, setFormData] = useState({
    tipoPessoa: 'J' as 'F' | 'J',
    razaoSocial: '',
    nomeFantasia: '',
    nomeCompleto: '',
    cpfCnpj: '',
    emailPrincipal: '',
    telefonePrincipal: '',
    site: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    pais: '',
    status: 'ATIVO',
  })
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Criar o cliente primeiro
      console.log('Criando cliente com dados:', formData)
      const response = await api.post('/clients', formData)
      console.log('Cliente criado:', response.data)
      const clientId = response.data.id

      // Criar os contatos
      if (contacts.length > 0) {
        console.log(`Criando ${contacts.length} contato(s)...`)
        for (const contact of contacts) {
          try {
            console.log('Criando contato:', contact)
            const contactResponse = await api.post('/contacts', {
              ...contact,
              clientId,
            })
            console.log('Contato criado:', contactResponse.data)
          } catch (contactErr: any) {
            console.error('Erro ao criar contato:', contactErr)
            console.error('Resposta do erro:', contactErr.response?.data)
            // Continuar mesmo se um contato falhar
            alert(`Aviso: Não foi possível criar o contato "${contact.name}". O cliente foi criado com sucesso.`)
          }
        }
      }

      // Após criar, perguntar se quer criar contato
      if (confirm('Cliente/Fornecedor criado com sucesso! Deseja adicionar um contato agora?')) {
        router.push(`/cadastros/contato/novo?clientId=${clientId}`)
      } else {
        router.push('/cadastros/cliente-fornecedor-parceiro')
      }
    } catch (err: any) {
      console.error('Erro ao criar cliente/fornecedor:', err)
      console.error('Resposta completa do erro:', err.response)
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Erro ao criar cliente/fornecedor'
        if (errorMessage.includes('empresa vinculada') || errorMessage.includes('companyId')) {
          setError('Você precisa cadastrar uma empresa primeiro. Por favor, faça logout e login novamente, ou cadastre a empresa no dashboard.')
        } else {
          setError(errorMessage)
        }
      } else if (err.request) {
        setError('Não foi possível conectar ao servidor. Verifique se a API está rodando.')
      } else {
        setError(err.message || 'Erro ao criar cliente/fornecedor')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddContact = () => {
    if (!contactForm.name.trim()) {
      alert('O nome do contato é obrigatório')
      return
    }

    if (editingContactIndex !== null) {
      // Editar contato existente
      const updatedContacts = [...contacts]
      updatedContacts[editingContactIndex] = { ...contactForm }
      setContacts(updatedContacts)
      setEditingContactIndex(null)
    } else {
      // Adicionar novo contato
      setContacts([...contacts, { ...contactForm }])
    }

    // Limpar formulário
    setContactForm({ name: '', phone: '', email: '' })
    setShowContactModal(false)
  }

  const handleEditContact = (index: number) => {
    setContactForm(contacts[index])
    setEditingContactIndex(index)
    setShowContactModal(true)
  }

  const handleRemoveContact = (index: number) => {
    if (confirm('Deseja remover este contato?')) {
      setContacts(contacts.filter((_, i) => i !== index))
    }
  }

  const handleCancelContact = () => {
    setContactForm({ name: '', phone: '', email: '' })
    setEditingContactIndex(null)
    setShowContactModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/cadastros/cliente-fornecedor-parceiro"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Clientes/Fornecedores
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Cliente/Fornecedor</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Tipo de Pessoa */}
            <div>
              <label htmlFor="tipoPessoa" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Pessoa <span className="text-red-500">*</span>
              </label>
              <select
                id="tipoPessoa"
                name="tipoPessoa"
                value={formData.tipoPessoa}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="J">Pessoa Jurídica (PJ)</option>
                <option value="F">Pessoa Física (PF)</option>
              </select>
            </div>

            {/* Campos para Pessoa Jurídica */}
            {formData.tipoPessoa === 'J' && (
              <>
                <div>
                  <label htmlFor="razaoSocial" className="block text-sm font-medium text-gray-700 mb-2">
                    Razão Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="razaoSocial"
                    name="razaoSocial"
                    type="text"
                    value={formData.razaoSocial}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Razão social da empresa"
                  />
                </div>

                <div>
                  <label htmlFor="nomeFantasia" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Fantasia
                  </label>
                  <input
                    id="nomeFantasia"
                    name="nomeFantasia"
                    type="text"
                    value={formData.nomeFantasia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Nome fantasia"
                  />
                </div>
              </>
            )}

            {/* Campo para Pessoa Física */}
            {formData.tipoPessoa === 'F' && (
              <div>
                <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="nomeCompleto"
                  name="nomeCompleto"
                  type="text"
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Nome completo"
                />
              </div>
            )}

            {/* CPF/CNPJ */}
            <div>
              <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700 mb-2">
                {formData.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'}
              </label>
              <input
                id="cpfCnpj"
                name="cpfCnpj"
                type="text"
                value={formData.cpfCnpj}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder={formData.tipoPessoa === 'J' ? '00.000.000/0000-00' : '000.000.000-00'}
              />
            </div>

            {/* Endereço */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700 mb-2">
                    Logradouro
                  </label>
                  <input
                    id="logradouro"
                    name="logradouro"
                    type="text"
                    value={formData.logradouro}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div>
                  <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
                    Número
                  </label>
                  <input
                    id="numero"
                    name="numero"
                    type="text"
                    value={formData.numero}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Nº"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  id="complemento"
                  name="complemento"
                  type="text"
                  value={formData.complemento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Complemento"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro
                  </label>
                  <input
                    id="bairro"
                    name="bairro"
                    type="text"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    id="cidade"
                    name="cidade"
                    type="text"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label htmlFor="uf" className="block text-sm font-medium text-gray-700 mb-2">
                    UF
                  </label>
                  <input
                    id="uf"
                    name="uf"
                    type="text"
                    value={formData.uf}
                    onChange={handleChange}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="UF"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    id="cep"
                    name="cep"
                    type="text"
                    value={formData.cep}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <label htmlFor="pais" className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    id="pais"
                    name="pais"
                    type="text"
                    value={formData.pais}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="País"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>

            {/* Contatos */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contatos</h3>
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  + Adicionar Contato
                </button>
              </div>

              {contacts.length > 0 && (
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
                        {contact.email && <p className="text-sm text-gray-600">{contact.email}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditContact(index)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href="/cadastros/cliente-fornecedor-parceiro"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || (!formData.razaoSocial && !formData.nomeCompleto)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>

        {/* Modal de Contato */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingContactIndex !== null ? 'Editar Contato' : 'Adicionar Contato'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Nome do contato"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="contato@exemplo.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancelContact}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingContactIndex !== null ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
