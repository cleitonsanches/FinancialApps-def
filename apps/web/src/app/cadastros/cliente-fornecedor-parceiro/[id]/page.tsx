'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function EditarClienteFornecedorPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    razaoSocial: '',
    cnpjCpf: '',
    contactEmail: '',
    phone: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
    addressZipcode: '',
    isCliente: false,
    isFornecedor: false,
    isColaborador: false,
  })

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  const loadClient = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/clients/${clientId}`)
      const client = response.data
      setFormData({
        name: client.name || '',
        razaoSocial: client.razaoSocial || '',
        cnpjCpf: client.cnpjCpf || '',
        contactEmail: client.contactEmail || '',
        phone: client.phone || '',
        addressStreet: client.addressStreet || '',
        addressNumber: client.addressNumber || '',
        addressComplement: client.addressComplement || '',
        addressNeighborhood: client.addressNeighborhood || '',
        addressCity: client.addressCity || '',
        addressState: client.addressState || '',
        addressZipcode: client.addressZipcode || '',
        isCliente: client.isCliente || false,
        isFornecedor: client.isFornecedor || false,
        isColaborador: client.isColaborador || false,
      })
    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error)
      alert('Erro ao carregar dados do cliente')
      router.push('/cadastros')
    } finally {
      setLoadingData(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que pelo menos um tipo foi selecionado
    if (!formData.isCliente && !formData.isFornecedor && !formData.isColaborador) {
      alert('Selecione pelo menos um tipo: Cliente, Fornecedor ou Colaborador/Associado')
      return
    }
    
    setLoading(true)

    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      await api.put(`/clients/${clientId}`, {
        name: formData.name,
        razaoSocial: formData.razaoSocial || formData.name || '',
        cnpjCpf: formData.cnpjCpf || null,
        contactEmail: formData.contactEmail || null,
        phone: formData.phone || null,
        addressStreet: formData.addressStreet || null,
        addressNumber: formData.addressNumber || null,
        addressComplement: formData.addressComplement || null,
        addressNeighborhood: formData.addressNeighborhood || null,
        addressCity: formData.addressCity || null,
        addressState: formData.addressState || null,
        addressZipcode: formData.addressZipcode || null,
        isCliente: formData.isCliente,
        isFornecedor: formData.isFornecedor,
        isColaborador: formData.isColaborador,
        companyId: companyId,
      })

      alert('Cliente/Fornecedor atualizado com sucesso!')
      router.push('/cadastros')
    } catch (error: any) {
      console.error('Erro ao atualizar cliente/fornecedor:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar cliente/fornecedor')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando dados do cliente...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Cliente/Fornecedor</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o nome"
            />
          </div>

          {/* Razão Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razão Social
            </label>
            <input
              type="text"
              value={formData.razaoSocial}
              onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite a razão social"
            />
          </div>

          {/* CNPJ/CPF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNPJ/CPF
            </label>
            <input
              type="text"
              value={formData.cnpjCpf}
              onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o CNPJ ou CPF"
            />
          </div>

          {/* Endereço */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={formData.addressStreet}
                    onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Digite a rua"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.addressNumber}
                    onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Número"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.addressComplement}
                  onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Digite o complemento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.addressNeighborhood}
                  onChange={(e) => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Digite o bairro"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.addressCity}
                    onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Digite a cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.addressState}
                    onChange={(e) => setFormData({ ...formData, addressState: e.target.value.toUpperCase() })}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="UF"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.addressZipcode}
                  onChange={(e) => setFormData({ ...formData, addressZipcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Digite o CEP"
                />
              </div>
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o e-mail de contato"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o telefone"
            />
          </div>

          {/* Tipos */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo *</h3>
            <p className="text-sm text-gray-500 mb-4">Selecione pelo menos um tipo (pode selecionar múltiplos)</p>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCliente"
                  checked={formData.isCliente}
                  onChange={(e) => setFormData({ ...formData, isCliente: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isCliente" className="ml-2 block text-sm text-gray-700">
                  Cliente
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFornecedor"
                  checked={formData.isFornecedor}
                  onChange={(e) => setFormData({ ...formData, isFornecedor: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isFornecedor" className="ml-2 block text-sm text-gray-700">
                  Fornecedor
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isColaborador"
                  checked={formData.isColaborador}
                  onChange={(e) => setFormData({ ...formData, isColaborador: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isColaborador" className="ml-2 block text-sm text-gray-700">
                  Colaborador/Associado
                </label>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/cadastros')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

