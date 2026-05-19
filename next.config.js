/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable strict mode in production but disable in development to reduce noise from
  // harmless extension-injected attributes. Real hydration issues have been fixed.
  reactStrictMode: process.env.NODE_ENV === 'production',
};

module.exports = nextConfig;