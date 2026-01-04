'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import NavigationLinks from '@/components/NavigationLinks'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Dashboard: Verificando autenticação...')
    const token = localStorage.getItem('token')
    console.log('Dashboard: Token encontrado:', token ? token.substring(0, 20) + '...' : 'NÃO ENCONTRADO')
    
    if (!token) {
      console.log('Dashboard: Sem token, redirecionando para login')
      router.push('/auth/login')
    } else {
      console.log('Dashboard: Token válido, exibindo dashboard')
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="CoreGestão"
                  width={120}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl text-gray-500">|</span>
              <h2 className="text-2xl font-semibold text-gray-700">Dashboard</h2>
            </div>
            <NavigationLinks />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/agenda"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex-1 min-w-[200px]"
            >
              <div className="text-4xl mb-4">📅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Agenda</h2>
              <p className="text-gray-600">Visualize suas tarefas e compromissos</p>
            </Link>

            <Link
              href="/projetos"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex-1 min-w-[200px]"
            >
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Projetos</h2>
              <p className="text-gray-600">Gerencie seus projetos</p>
            </Link>

            <Link
              href="/negociacoes"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex-1 min-w-[200px]"
            >
              <div className="text-4xl mb-4">🤝</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Negociações</h2>
              <p className="text-gray-600">Acompanhe suas negociações</p>
            </Link>

            <Link
              href="/contas-receber"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex-1 min-w-[200px]"
            >
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Contas a Receber</h2>
              <p className="text-gray-600">Gerencie recebimentos</p>
            </Link>

            <Link
              href="/contas-pagar"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex-1 min-w-[200px]"
            >
              <div className="text-4xl mb-4">💳</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Contas a Pagar</h2>
              <p className="text-gray-600">Gerencie pagamentos</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


