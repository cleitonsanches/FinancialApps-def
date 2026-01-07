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
  
  // Transpilar recharts para resolver problemas de build
  transpilePackages: ['recharts'],
  
  // Configurações do webpack para recharts
  webpack: (config, { isServer }) => {
    // Resolver problemas com recharts no build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
