/** @type {import('next').NextConfig} */
// In production nginx serves /api/* from the Rust admin-api on the same origin
// (host-only cookies, no CORS). In dev, Next proxies /api/* to the local backend.
const API_DEV_ORIGIN = process.env.ADMIN_API_ORIGIN || 'http://localhost:4100';

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_DEV_ORIGIN}/api/:path*` }];
  },
};

module.exports = nextConfig;
