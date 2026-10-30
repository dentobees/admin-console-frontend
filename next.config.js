/** @type {import('next').NextConfig} */
// Next proxies /api/* to the Rust admin-api, so the browser sees one origin
// (host-only cookies, no CORS). On Vercel, ADMIN_API_ORIGIN is the deployed
// backend (https://apidev.dentobees.com/admin-api); in dev, the local one.
const API_ORIGIN = process.env.ADMIN_API_ORIGIN || 'http://localhost:4100';

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

module.exports = nextConfig;
