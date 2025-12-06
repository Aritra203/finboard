/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features if needed
  experimental: {
    // Enable if you need to use Server Actions
    // serverActions: true,
  },
  // Configure allowed image domains if needed
  images: {
    domains: [],
  },
}

module.exports = nextConfig
