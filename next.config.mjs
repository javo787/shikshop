import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  images: {
    remotePatterns: [
      // Твой локальный сервер и продакшн
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
      // Cloudinary (твои фото)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dprydst2c/**',
      },
      // 👇 ВАЖНО: Разрешаем картинки от Replicate
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'replicate.com',
      },
      // Другие домены AI
      {
        protocol: 'https',
        hostname: '*.gradio.live',
      },
      {
        protocol: 'https',
        hostname: '*.hf.space',
      },
      {
        protocol: 'https',
        hostname: 'huggingface.co',
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