import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**',
      },
      {
        protocol: 'https',
        hostname: 'shikshop.vercel.app',
        pathname: '/api/images/**',
      },
    ],
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/pagefile.sys', '**/.env.local'],
    };
    return config;
  },
});