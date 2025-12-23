'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Redirecionando...</p>
    </div>
  )
}

