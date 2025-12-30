import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true }, // Связь с Firebase
  email: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  address: { type: String },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Избранное
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);