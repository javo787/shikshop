import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
  });
if (mongoose.models.Review) {
  delete mongoose.models.Review;
}

const Review = mongoose.model('Review', reviewSchema);

export default Review;