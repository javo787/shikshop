import Image from 'next/image';

export default function TipCard({ title, description, icon, className }) {
  return (
    <div
      className={`flex flex-row items-center p-4 bg-card-cream dark:bg-neutral-gray rounded-lg shadow-sm transition-transform transform hover:scale-105 hover:shadow-md ${className}`}
      data-aos="fade-up"
      data-aos-duration="500"
    >
      {icon && (
        <div className="relative w-8 h-8 mr-3 flex-shrink-0">
          <Image
            src={icon}
            alt={title}
            fill
            className="object-contain"
          />
        </div>
      )}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-dark-teal dark:text-text-light">{title}</h3>
        <p className="text-sm text-text-dark dark:text-text-light">{description}</p>
      </div>
    </div>
  );
}