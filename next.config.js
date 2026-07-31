/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable CSS optimization and minification for production builds
  // This reduces CSS file size for faster CloudFront CDN delivery
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configure webpack for CSS minification
  webpack: (config, { isServer }) => {
    // Enable CSS minification in production
    if (!isServer && process.env.NODE_ENV === 'production') {
      const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
      config.optimization.minimizer.push(
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: ['default', { discardComments: { removeAll: true } }],
          },
        })
      );
    }
    return config;
  },
  // Enable server-side rendering
  output: 'standalone',
  // Configure for AWS Lambda deployment via SST or Amplify
  experimental: {
    // Optimize for serverless deployment
    outputFileTracingRoot: undefined,
  },
  // Environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: process.env.PORT || '3000',
  },
  // Configure static file serving
  assetPrefix: process.env.ASSET_PREFIX || '',
  // Enable compression
  compress: true,
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
