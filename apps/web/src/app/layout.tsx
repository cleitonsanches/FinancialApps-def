import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Projeto Financial',
  description: 'Sistema de Gestão Financeira',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}


