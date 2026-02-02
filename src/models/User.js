import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Связь с Firebase Authentication
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // Основные данные
  // 👇 ИЗМЕНЕНИЕ: Убрали required: true, добавили sparse: true
  email: { 
    type: String, 
    required: false, 
    unique: true, 
    sparse: true // Разрешает иметь пользователей БЕЗ email
  },
  name: { type: String },
  
  // Аватар
  image: { 
    type: String,
    default: '' 
  },

  // Контакты
  // 👇 ИЗМЕНЕНИЕ: Тоже добавляем sparse, чтобы не было ошибок дубликатов
  phone: { 
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  address: { type: String },

  // Дополнительная анкета
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    default: 'female' 
  },
  birthDate: { type: Date },

  // Избранное
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Роль
  role: { type: String, default: 'user' },
  
  // Telegram provider (для будущего)
  providers: {
    telegram: {
      id: String,
      username: String,
      photoUrl: String
    }
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);