import mongoose from 'mongoose';

const LoginRequestSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Секретный код сессии
  status: { type: String, default: 'pending' }, // 'pending' | 'success'
  telegramUser: { type: Object, default: null }, // Сюда бот запишет данные
  createdAt: { type: Date, default: Date.now, expires: 300 } // Удаляется сам через 5 минут
});

export default mongoose.models.LoginRequest || mongoose.model('LoginRequest', LoginRequestSchema);