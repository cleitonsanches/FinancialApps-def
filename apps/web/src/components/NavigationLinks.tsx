'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NavigationLinks() {
  const router = useRouter()
  const [showFinanceMenu, setShowFinanceMenu] = useState(false)
  const financeMenuRef = useRef<HTMLDivElement>(null)

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (financeMenuRef.current && !financeMenuRef.current.contains(event.target as Node)) {
        setShowFinanceMenu(false)
      }
    }

    if (showFinanceMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFinanceMenu])

  return (
    <div className="flex gap-2 items-center flex-nowrap overflow-x-auto">
      {/* Agenda */}
      <Link
        href="/agenda"
        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
      >
        Agenda
      </Link>
      
      {/* Projetos */}
      <Link
        href="/projetos"
        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
      >
        Projetos
      </Link>
      
      {/* Negociações */}
      <Link
        href="/negociacoes"
        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
      >
        Negociações
      </Link>
      
      {/* Menu Financeiro com Dropdown */}
      <div className="relative" ref={financeMenuRef}>
        <button
          onClick={() => setShowFinanceMenu(!showFinanceMenu)}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1 whitespace-nowrap"
        >
          Financeiro
          <span className="text-xs">▼</span>
        </button>
        
        {showFinanceMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px] z-50">
            <Link
              href="/contas-receber"
              onClick={() => setShowFinanceMenu(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Contas a Receber
            </Link>
            <Link
              href="/contas-pagar"
              onClick={() => setShowFinanceMenu(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Contas a Pagar
            </Link>
            <Link
              href="/reembolsos"
              onClick={() => setShowFinanceMenu(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Reembolsos
            </Link>
            <Link
              href="/conciliacao"
              onClick={() => setShowFinanceMenu(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Conciliação
            </Link>
            <Link
              href="/analise"
              onClick={() => setShowFinanceMenu(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Análise
            </Link>
          </div>
        )}
      </div>
      
      {/* Cadastros */}
      <Link
        href="/cadastros"
        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
      >
        Cadastros
      </Link>
      
      {/* Administração */}
      <Link
        href="/templates"
        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
      >
        Administração
      </Link>
      
      {/* Botão de Logout */}
      <button
        onClick={() => {
          // Remover token do localStorage
          localStorage.removeItem('token')
          // Redirecionar para a página de login
          router.push('/auth/login')
        }}
        className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
        title="Sair do sistema"
      >
        Sair
      </button>
    </div>
  )
}


