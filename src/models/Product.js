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
    type: String, // "product", "collection", "look"
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
    type: mongoose.Schema.Types.ObjectId, // Основное изображение
    ref: 'fs.files',
    required: true,
  },
  imageLarge: {
    type: mongoose.Schema.Types.ObjectId, // Большое изображение для collection/look
    ref: 'fs.files',
  },
  additionalImages: [{
    type: mongoose.Schema.Types.ObjectId, // Дополнительные изображения
    ref: 'fs.files',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;