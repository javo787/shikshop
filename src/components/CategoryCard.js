import Link from 'next/link';
import Image from 'next/image';

export default function CategoryCard({ name, description, image }) {
  return (
    <Link href="/catalog" className="group">
      <div className="rounded-lg overflow-hidden shadow-sm bg-bg-light transition-transform transform group-hover:scale-105">
        {image && (
          <div className="relative h-48">
            <Image
              src={image} // Ожидает /api/images/[id] из GridFS
              alt={name}
              width={300}
              height={200}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-lg font-medium text-dark-teal">{name}</h3>
          <p className="text-sm text-text-dark">{description}</p>
        </div>
      </div>
    </Link>
  );
}