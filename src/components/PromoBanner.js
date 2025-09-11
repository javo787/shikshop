import Link from 'next/link';

export default function PromoBanner({ title, description, buttonText, buttonLink, className, buttonClassName }) {
  return (
    <div className={`py-8 px-4 text-center ${className}`}>
      <h2 className="text-3xl font-semibold mb-4">{title}</h2>
      <p className="text-lg mb-6 max-w-2xl mx-auto">{description}</p>
      <Link href={buttonLink} className={`btn ${buttonClassName}`}>
        {buttonText}
      </Link>
    </div>
  );
}