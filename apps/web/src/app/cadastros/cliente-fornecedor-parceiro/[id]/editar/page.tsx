'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function EditarClienteFornecedorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadClient()
  }, [id, router])

  const loadClient = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/clients/${id}`)
      const data = response.data
      setFormData({
        tipoPessoa: data.tipoPessoa || 'J',
        razaoSocial: data.razaoSocial || '',
        nomeFantasia: data.nomeFantasia || '',
        nomeCompleto: data.nomeCompleto || '',
        cpfCnpj: data.cpfCnpj || '',
        emailPrincipal: data.emailPrincipal || '',
        telefonePrincipal: data.telefonePrincipal || '',
        site: data.site || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        uf: data.uf || '',
        cep: data.cep || '',
        pais: data.pais || '',
        status: data.status || 'ATIVO',
      })
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      alert('Erro ao carregar cliente')
      router.push('/cadastros/cliente-fornecedor-parceiro')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.patch(`/clients/${id}`, formData)
      router.push(`/cadastros/cliente-fornecedor-parceiro/${id}`)
    } catch (err: any) {
      console.error('Erro ao atualizar cliente/fornecedor:', err)
      if (err.response) {
        setError(err.response.data?.message || err.response.data?.error || 'Erro ao atualizar cliente/fornecedor')
      } else if (err.request) {
        setError('Não foi possível conectar ao servidor. Verifique se a API está rodando.')
      } else {
        setError(err.message || 'Erro ao atualizar cliente/fornecedor')
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

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href={`/cadastros/cliente-fornecedor-parceiro/${id}`}
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Detalhes
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Cliente/Fornecedor</h1>
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

            <div className="flex gap-3 pt-4">
              <Link
                href={`/cadastros/cliente-fornecedor-parceiro/${id}`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || (!formData.razaoSocial && !formData.nomeCompleto)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
