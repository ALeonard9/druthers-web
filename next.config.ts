import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output is only for the Docker image (the Dockerfile sets
  // DOCKER_BUILD=1). It breaks `next start`/`next dev` locally, so gate it.
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  async redirects() {
    return [
      // "Bored" became "Surprise me" - keep old links working.
      { source: '/bored', destination: '/surprise', permanent: true },
      { source: '/developers', destination: '/mcp', permanent: true },
    ];
  },
  async headers() {
    // Baseline security headers (druthers-infra THREAT-MODEL.md, H4).
    // Google Sign-In is unaffected: GIS embeds *Google's* iframe in our page;
    // X-Frame-Options only controls who may frame *us*.
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Browsers ignore HSTS over plain http, so this is safe locally.
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://image.tmdb.org; font-src 'self'; frame-src 'self' https://accounts.google.com; connect-src 'self' https://accounts.google.com;",
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
