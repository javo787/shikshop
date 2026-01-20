import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  category: {
    type: String,
  },
  type: {
    type: String,
    default: 'product',
  },
  style: {
    type: String,
  },
  material: {
    type: String,
  },
  sizes: {
    type: String,
  },
  details: {
    type: String,
  },
  image: {
    type: String, // URL или старый ID как строка
    required: true,
  },
  imageLarge: {
    type: String, // URL или старый ID
  },
  additionalImages: [{
    type: String, // Массив URL или ID
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Если модель уже существует (при горячей перезагрузке Next.js), используем её, иначе создаем новую
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
