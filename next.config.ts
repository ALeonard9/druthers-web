import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output is only for the Docker image (the Dockerfile sets
  // DOCKER_BUILD=1). It breaks `next start`/`next dev` locally, so gate it.
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  async redirects() {
    // "Bored" became "Surprise me" — keep old links working.
    return [{ source: '/bored', destination: '/surprise', permanent: true }];
  },
};

export default nextConfig;
