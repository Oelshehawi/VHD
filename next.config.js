import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    deviceSizes: [320, 640, 1024, 1440],
    imageSizes: [64, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === "development";

// Simplified PWA configuration
const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev, // Completely disable in development mode
  buildExcludes: [/middleware-manifest\.json$/, /manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/(clerk\.com|clerk\.dev)\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "auth-cache",
        networkTimeoutSeconds: 30,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-images",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

// Export the configuration
// @ts-ignore - Ignore type mismatch between next-pwa and Next.js
export default isDev ? nextConfig : withPWAConfig(nextConfig);
