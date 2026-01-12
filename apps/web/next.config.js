/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  // Removendo standalone temporariamente para evitar erro de build trace
  // Pode ser reativado quando o problema for resolvido
  // output: 'standalone',
  
  // Desabilitar geração de páginas de erro estáticas para evitar erro de build
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
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
    
    // Garantir que módulos do recharts sejam resolvidos corretamente
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
      'apps/web/node_modules',
    ];
    
    return config;
  },
  
  // Desabilitar exportação estática de páginas de erro
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
