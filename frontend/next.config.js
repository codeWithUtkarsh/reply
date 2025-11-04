/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
  webpack: (config, { isServer }) => {
    // Fix for mermaid/cytoscape compatibility issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Ignore cytoscape warnings for client-side builds
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },
}

module.exports = nextConfig
