import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Основные поля
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number },
  category: { type: String }, // Обычная категория (для фильтров)
  
  // --- AI поля ---
  // Категория для нейросети: dresses | upper_body | lower_body
  aiCategory: { type: String, default: 'upper_body' }, 
  
  // Старое поле (одиночное) - оставляем для совместимости
  tryOnImage: { type: String }, 
  
  // 🔥 НОВОЕ: Массив фото для примерки (например, разные цвета)
  tryOnImages: [{ type: String }], 

  // Характеристики
  type: { type: String, default: 'product' },
  style: String,
  material: String,
  sizes: String,
  details: String,
  
  // --- Медиа ---
  image: { type: String, required: true }, // Главное фото (обложка)
  imageLarge: String, // Большое фото (если отличается)
  additionalImages: [{ type: String }], // Галерея дополнительных ракурсов
  
  createdAt: { type: Date, default: Date.now },
});

// Если модель уже существует (при горячей перезагрузке Next.js), используем её, иначе создаем новую
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;