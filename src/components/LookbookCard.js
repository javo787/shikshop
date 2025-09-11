import Image from 'next/image';
import Link from 'next/link';

export default function LookbookCard({ look }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {look.image && (
        <Image
          src={look.image}
          alt={look.name}
          width={300}
          height={400}
          className="w-full h-64 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-text-dark">{look.name}</h3>
        <p className="text-text-gray text-sm mt-1">{look.description}</p>
        <Link href={`/product/${look._id}`} className="mt-2 inline-block text-accent-rose hover:underline">
          Подробнее
        </Link>
      </div>
    </div>
  );
}