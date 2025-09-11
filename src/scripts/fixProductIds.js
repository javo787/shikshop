import connectMongoDB from '../lib/mongodb';
import Product from '../models/Product';
import mongoose from 'mongoose';

async function fixProductIds() {
  await connectMongoDB();
  const products = await Product.find({}).lean();
  for (const product of products) {
    const oldId = product._id;
    if (!mongoose.Types.ObjectId.isValid(oldId)) {
      const newId = new mongoose.Types.ObjectId();
      await Product.updateOne(
        { _id: oldId },
        {
          $set: {
            ...product,
            _id: newId,
            image: product.image,
            imageLarge: product.imageLarge,
            additionalImages: product.additionalImages || [],
          },
        },
        { upsert: true }
      );
      await Product.deleteOne({ _id: oldId });
      console.log(`Fixed ID for ${product.name}: ${oldId} -> ${newId}`);
    }
  }
  console.log('Fix completed');
  process.exit();
}

fixProductIds();