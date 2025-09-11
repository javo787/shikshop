import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**',
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