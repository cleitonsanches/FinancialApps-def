import axios from 'axios'

// Detectar a URL base da API
// Em produção (via Nginx), usar URL relativa '/api' que funciona automaticamente
// Em desenvolvimento, usar variável de ambiente ou localhost:3001
function getApiBaseURL(): string {
  // Se estiver definida a variável de ambiente, usar ela
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Se estiver no browser, usar URL relativa (funciona com Nginx)
  if (typeof window !== 'undefined') {
    return '/api'
  }
  
  // Fallback para desenvolvimento (SSR)
  return 'http://localhost:3001'
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api


