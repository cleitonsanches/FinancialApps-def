'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Erro</h1>
            <p className="text-gray-600 mb-8">Ocorreu um erro ao carregar a aplicação.</p>
            <button
              onClick={reset}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
