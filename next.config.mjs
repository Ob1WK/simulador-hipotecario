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
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <- genera HTML estático listo para Pages
};
export default nextConfig;

