import connectMongoDB from '../lib/mongodb';
import Product from '../models/Product';

async function createIndexes() {
  await connectMongoDB();
  await Product.collection.createIndex({ type: 1 });
  await Product.collection.createIndex({ category: 1 });
  await Product.collection.createIndex({ price: 1 });
  console.log('Indexes created');
  process.exit();
}

createIndexes();