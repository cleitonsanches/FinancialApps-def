'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/services/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Tentando fazer login com:', { email, password: '***' })
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      console.log('Resposta do login:', response.data)

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
        console.log('Token salvo no localStorage:', response.data.access_token.substring(0, 20) + '...')
        
        // Verificar se foi salvo
        const savedToken = localStorage.getItem('token')
        console.log('Token verificado no localStorage:', savedToken ? savedToken.substring(0, 20) + '...' : 'NÃO ENCONTRADO')
        
        // Pequeno delay para garantir que o token foi salvo
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('Redirecionando para /dashboard')
        // Usar window.location para garantir redirecionamento
        window.location.href = '/dashboard'
      } else if (response.data.token) {
        // Fallback para compatibilidade
        localStorage.setItem('token', response.data.token)
        console.log('Token (fallback) salvo no localStorage')
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.href = '/dashboard'
      } else {
        console.error('Resposta não contém token:', response.data)
        setError('Resposta do servidor inválida. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      console.error('Detalhes do erro:', {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message,
      })
      if (err.response) {
        // Erro com resposta do servidor
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Erro ao fazer login'
        setError(errorMessage)
        console.error('Mensagem de erro:', errorMessage)
      } else if (err.request) {
        // Erro de conexão
        setError('Não foi possível conectar ao servidor. Verifique se a API está rodando.')
      } else {
        // Outro erro
        setError(err.message || 'Erro ao fazer login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="CoreGestão"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

