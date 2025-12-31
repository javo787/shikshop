import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Связь с Firebase Authentication
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true,
    index: true // Индекс для быстрого поиска при входе
  },
  
  // Основные данные
  email: { type: String, required: true },
  name: { type: String },
  
  // ВАЖНО: Поле для хранения ссылки на аватар
  image: { 
    type: String,
    default: '' 
  },

  // Контакты
  phone: { type: String },
  address: { type: String },

  // Дополнительная анкета (для будущих скидок и аналитики)
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    default: 'female' 
  },
  birthDate: { type: Date },

  // Избранное (храним ID товаров)
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Роль пользователя (admin или user)
  role: { type: String, default: 'user' },
  
  createdAt: { type: Date, default: Date.now },
});

// Проверка, чтобы не компилировать модель дважды при горячей перезагрузке Next.js
export default mongoose.models.User || mongoose.model('User', UserSchema);