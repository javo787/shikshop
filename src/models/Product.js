import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number },
  category: { type: String }, // Обычная категория (для фильтров)
  
  // 🔥 НОВЫЕ ПОЛЯ ДЛЯ AI
  aiCategory: { type: String, default: 'upper_body' }, // dresses | upper_body | lower_body
  tryOnImage: { type: String }, // Фото на манекене (чистое)

  type: { type: String, default: 'product' },
  style: String,
  material: String,
  sizes: String,
  details: String,
  
  image: { type: String, required: true },
  imageLarge: String,
  additionalImages: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
