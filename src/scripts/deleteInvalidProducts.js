import connectMongoDB from '../lib/mongodb.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Загружаем .env.local
dotenv.config({ path: './.env.local' });

async function deleteInvalidProducts() {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    await connectMongoDB();
    const products = await Product.find({}).lean();
    for (const product of products) {
      const id = product._id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        // Прямой поиск и удаление по строковому _id
        await Product.deleteOne({ _id: id });
        console.log(`Deleted product with invalid _id: ${id}`);
      }
    }
    console.log('Deletion of invalid products completed');
  } catch (error) {
    console.error('Error deleting products:', error);
  }
  process.exit();
}

deleteInvalidProducts();