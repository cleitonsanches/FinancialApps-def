'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavigationLinks from '@/components/NavigationLinks'

type TabType = 'plano-contas' | 'conta-corrente' | 'usuarios' | 'clientes'

export default function CadastrosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('plano-contas')

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar ao início
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cadastros</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('plano-contas')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'plano-contas'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Plano de Contas
              </button>
              <button
                onClick={() => setActiveTab('conta-corrente')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'conta-corrente'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contas Correntes
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'usuarios'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Usuários
              </button>
              <button
                onClick={() => setActiveTab('clientes')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'clientes'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clientes
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'plano-contas' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Plano de Contas</h2>
              <Link
                href="/cadastros/plano-contas/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo
              </Link>
            </div>
            <p className="text-gray-600">Gerencie seu plano de contas aqui.</p>
            <Link
              href="/cadastros/plano-contas"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Ver lista completa →
            </Link>
          </div>
        )}

        {activeTab === 'conta-corrente' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Contas Correntes</h2>
              <Link
                href="/cadastros/conta-corrente/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Nova
              </Link>
            </div>
            <p className="text-gray-600">Gerencie suas contas bancárias aqui.</p>
            <Link
              href="/cadastros/conta-corrente"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Ver lista completa →
            </Link>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Usuários</h2>
              <Link
                href="/cadastros/usuario/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo
              </Link>
            </div>
            <p className="text-gray-600">Gerencie os usuários do sistema aqui.</p>
            <Link
              href="/cadastros/usuario"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Ver lista completa →
            </Link>
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
              <Link
                href="/cadastros/cliente-fornecedor-parceiro/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo
              </Link>
            </div>
            <p className="text-gray-600">Gerencie seus clientes aqui.</p>
            <Link
              href="/cadastros/cliente-fornecedor-parceiro"
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
