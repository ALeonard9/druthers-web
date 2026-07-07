import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output produces a minimal self-contained server for the Docker
  // image (see Dockerfile).
  output: 'standalone',
};

export default nextConfig;
