'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NavigationLinks() {
  const router = useRouter()
  const [showFinanceMenu, setShowFinanceMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const financeMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (financeMenuRef.current && !financeMenuRef.current.contains(event.target as Node)) {
        setShowFinanceMenu(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    if (showFinanceMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFinanceMenu, showMobileMenu])

  // Renderizar links de navegação (reutilizável para desktop e mobile)
  const renderNavigationLinks = (isMobile: boolean = false) => {
    const linkClassName = isMobile
      ? "block px-4 py-3 text-gray-700 hover:bg-gray-100 border-b border-gray-200"
      : "px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"

    return (
      <>
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={isMobile ? linkClassName : `${linkClassName} flex items-center gap-1`}
          title="Dashboard"
          onClick={() => isMobile && setShowMobileMenu(false)}
        >
          <span className={isMobile ? "" : "text-base"}>🏠</span>
          {isMobile && <span className="ml-2">Dashboard</span>}
        </Link>
        
        {/* Agenda */}
        <Link
          href="/agenda"
          className={linkClassName}
          onClick={() => isMobile && setShowMobileMenu(false)}
        >
          Agenda
        </Link>
        
        {/* Projetos */}
        <Link
          href="/projetos"
          className={linkClassName}
          onClick={() => isMobile && setShowMobileMenu(false)}
        >
          Projetos
        </Link>
        
        {/* Horas Trabalhadas */}
        <Link
          href="/horas-trabalhadas"
          className={linkClassName}
          onClick={() => isMobile && setShowMobileMenu(false)}
        >
          Horas Trabalhadas
        </Link>
        
        {/* Negociações */}
        <Link
          href="/negociacoes"
          className={linkClassName}
          onClick={() => isMobile && setShowMobileMenu(false)}
        >
          Negociações
        </Link>
        
        {/* Menu Financeiro com Dropdown */}
        {isMobile ? (
          <>
            <div className="px-4 py-3 text-gray-700 font-semibold border-b border-gray-200">
              Financeiro
            </div>
            <Link
              href="/contas-receber"
              onClick={() => setShowMobileMenu(false)}
              className="block px-6 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Contas a Receber
            </Link>
            <Link
              href="/contas-pagar"
              onClick={() => setShowMobileMenu(false)}
              className="block px-6 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Contas a Pagar
            </Link>
            <Link
              href="/reembolsos"
              onClick={() => setShowMobileMenu(false)}
              className="block px-6 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Reembolsos
            </Link>
            <Link
              href="/conciliacao"
              onClick={() => setShowMobileMenu(false)}
              className="block px-6 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Conciliação
            </Link>
            <Link
              href="/analise"
              onClick={() => setShowMobileMenu(false)}
              className="block px-6 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Análise
            </Link>
          </>
        ) : (
          <div className="relative" ref={financeMenuRef}>
            <button
              onClick={() => setShowFinanceMenu(!showFinanceMenu)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
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
        )}
        
        {/* Cadastros */}
        <Link
          href="/cadastros"
          className={linkClassName}
          onClick={() => isMobile && setShowMobileMenu(false)}
        >
          Cadastros
        </Link>
        
        {/* Administração */}
        <Link
          href="/administracao"
          className={linkClassName}
          onClick={() => isMobile && setShowMobileMenu(false)}
        >
          Administração
        </Link>
        
        {/* Botão de Logout */}
        <button
          onClick={() => {
            localStorage.removeItem('token')
            router.push('/auth/login')
            if (isMobile) setShowMobileMenu(false)
          }}
          className={isMobile ? "block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 border-t border-gray-200 mt-2" : "px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"}
          title="Sair do sistema"
        >
          Sair
        </button>
      </>
    )
  }

  return (
    <>
      {/* Menu Desktop - visível apenas em telas maiores */}
      <div className="hidden md:flex gap-2 flex-nowrap items-center">
        {renderNavigationLinks(false)}
      </div>

      {/* Botão Hambúrguer Mobile - visível apenas em telas pequenas */}
      <div className="md:hidden relative" ref={mobileMenuRef}>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          aria-label="Abrir menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {showMobileMenu ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Menu Mobile - slide in */}
        {showMobileMenu && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[calc(100vh-100px)] overflow-y-auto">
            <div className="py-2">
              {renderNavigationLinks(true)}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

