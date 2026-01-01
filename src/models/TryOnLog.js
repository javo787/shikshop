import mongoose from 'mongoose';

const TryOnLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null для гостей
    ipAddress: { type: String, required: true }, // Чтобы ловить мультиаккаунты
    imageUrl: { type: String }, // Какое фото использовали (опционально)
    status: { type: String, enum: ['success', 'failed', 'blocked'], default: 'success' },
    userAgent: { type: String } // С какого устройства
  },
  { timestamps: true } // Автоматически создаст поле createdAt (дата использования)
);

export default mongoose.models.TryOnLog || mongoose.model('TryOnLog', TryOnLogSchema);