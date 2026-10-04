/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable standalone output when explicitly targeted (e.g. inside Docker in M4).
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  serverExternalPackages: ['onnxruntime-node'],
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/problem-solution',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/roi-calculator',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/market',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/technology',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/demo',
        destination: '/dashboard/shipment/FS-8821',
        permanent: false,
      },
      {
        source: '/contact',
        destination: '/dashboard/support',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
