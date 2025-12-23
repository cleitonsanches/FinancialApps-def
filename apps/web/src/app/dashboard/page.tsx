'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavigationLinks from '@/components/NavigationLinks'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <NavigationLinks />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/agenda"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Agenda</h2>
            <p className="text-gray-600">Visualize suas tarefas e compromissos</p>
          </Link>

          <Link
            href="/projetos"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Projetos</h2>
            <p className="text-gray-600">Gerencie seus projetos</p>
          </Link>

          <Link
            href="/negociacoes"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Negociações</h2>
            <p className="text-gray-600">Acompanhe suas negociações</p>
          </Link>

          <Link
            href="/contas-receber"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contas a Receber</h2>
            <p className="text-gray-600">Gerencie recebimentos</p>
          </Link>

          <Link
            href="/contas-pagar"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">💳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contas a Pagar</h2>
            <p className="text-gray-600">Gerencie pagamentos</p>
          </Link>

          <Link
            href="/templates"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Templates</h2>
            <p className="text-gray-600">Gerencie templates</p>
          </Link>
        </div>
      </div>
    </div>
  )
}


