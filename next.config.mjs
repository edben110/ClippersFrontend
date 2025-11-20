/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.coolify.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.clipers.pro',
        pathname: '/uploads/**',
      },
    ],
  },
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  // Optimizaciones para producción
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Optimizaciones adicionales
  swcMinify: true,
  reactStrictMode: true,
  
  // Reducir tamaño del bundle
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
}

export default nextConfig
