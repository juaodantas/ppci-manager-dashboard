import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@manager/domain'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), { canvas: 'canvas' }]
    }
    return config
  },
}

export default nextConfig
