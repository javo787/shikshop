import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // URL из Cloudinary
  date: { type: String },
}, { timestamps: true });

export default mongoose.models.Blog || mongoose.model('Blog', blogSchema);