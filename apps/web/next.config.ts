import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@manager/domain'],
}

export default nextConfig
