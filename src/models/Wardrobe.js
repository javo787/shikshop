import mongoose from 'mongoose';

const WardrobeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, 
  
  originalImage: { type: String, required: true },
  garmentImage: { type: String, required: true },
  resultImage: { type: String, required: true },
  
  modelParams: {
    steps: Number,
    seed: Number,
    version: String
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Wardrobe || mongoose.model('Wardrobe', WardrobeSchema);