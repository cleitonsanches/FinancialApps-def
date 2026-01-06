/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suportar path base para instância de testes
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Configurações de produção
  output: 'standalone',
  
  // Configurações de imagens
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
