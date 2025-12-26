import { config } from 'dotenv';
import { connectMongoDB } from '../lib/mongodb.js';
import Product from '../models/Product.js';

// Загружаем переменные окружения, так как скрипт запускается отдельно от Next.js
config({ path: '.env.local' });

async function createIndexes() {
  try {
    await connectMongoDB();
    console.log('Создание индексов...');
    
    await Product.collection.createIndex({ type: 1 });
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ price: 1 });
    
    console.log('Индексы успешно созданы');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при создании индексов:', error);
    process.exit(1);
  }
}

createIndexes();