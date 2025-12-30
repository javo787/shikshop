import Link from 'next/link';

export default function PromoBanner({ title, description, buttonText, buttonLink }) {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-accent-rose via-primary-pink to-secondary-lavender text-white p-8 md:p-16 text-center">
      {/* Декоративные круги */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10">
        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 tracking-wide drop-shadow-md">
          {title}
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90 font-light">
          {description}
        </p>
        <Link 
          href={buttonLink} 
          className="inline-block bg-white text-accent-rose px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}