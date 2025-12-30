import Image from 'next/image';

export default function TipCard({ title, description, icon, className }) {
  return (
    <div
      className={`flex items-start gap-4 p-6 bg-white dark:bg-white/5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-pink-100 dark:hover:border-pink-900/20 ${className}`}
    >
      {icon && (
        <div className="relative w-12 h-12 shrink-0 bg-secondary-peach/30 rounded-full p-2 flex items-center justify-center text-2xl">
           {/* Если иконка - это путь к файлу */}
           <div className="relative w-full h-full">
             <Image src={icon} alt="" fill className="object-contain" />
           </div>
        </div>
      )}
      <div>
        <h3 className="text-lg font-serif font-bold text-dark-teal dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}