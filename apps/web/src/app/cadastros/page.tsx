'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavigationLinks from '@/components/NavigationLinks'

type TabType = 'clientes' | 'contatos'

export default function CadastrosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('clientes')

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Cadastros</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('clientes')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'clientes'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clientes/Fornecedores
              </button>
              <button
                onClick={() => setActiveTab('contatos')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'contatos'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contatos
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'clientes' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Clientes/Fornecedores</h2>
              <Link
                href="/cadastros/cliente-fornecedor-parceiro/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo
              </Link>
            </div>
            <p className="text-gray-600">Gerencie seus clientes e fornecedores aqui.</p>
            <Link
              href="/cadastros/cliente-fornecedor-parceiro"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Ver lista completa →
            </Link>
          </div>
        )}

        {activeTab === 'contatos' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Contatos</h2>
              <Link
                href="/cadastros/contato/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo
              </Link>
            </div>
            <p className="text-gray-600">Gerencie os contatos aqui.</p>
            <Link
              href="/cadastros/contato"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Ver lista completa →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
