import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  // Связь с пользователем (кто заказал)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Уникальный читаемый номер заказа (например, 10001, 10002)
  orderNumber: {
    type: Number,
    unique: true,
  },

  // Состав заказа (Массив товаров)
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      // ВАЖНО: Сохраняем данные товара "как есть" на момент покупки (Snapshot)
      // Если товар удалят из базы или изменится цена, в заказе останутся верные данные
      name: { type: String, required: true },
      price: { type: Number, required: true }, // Цена за единицу на момент покупки
      image: { type: String },
      quantity: { type: Number, required: true, min: 1 },
      size: { type: String }, // Если есть размеры
    }
  ],

  // Финансовая информация
  totalAmount: {
    type: Number,
    required: true,
  },
  
  // Данные для доставки (могут отличаться от профиля)
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: 'Душанбе' },
    comments: { type: String }, // Комментарий курьеру
  },

  // Статус заказа
  status: {
    type: String,
    enum: ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'new',
    index: true, // Для быстрой фильтрации админом
  },

  // Способ оплаты
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'card_online'], // Наличные или карта
    default: 'cash_on_delivery',
  },

  // История изменений статуса (Pro feature)
  // Позволяет видеть: "Заказ создан 10:00", "Принят 10:05", "Доставлен 12:00"
  statusHistory: [
    {
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      comment: { type: String },
    }
  ],

}, { 
  timestamps: true // Автоматические поля createdAt и updatedAt
});

// Middleware: Авто-генерация номера заказа перед сохранением
// (Простая реализация инкремента. В high-load проектах используют отдельные счетчики)
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'orderNumber': -1 } });
    this.orderNumber = lastOrder && lastOrder.orderNumber ? lastOrder.orderNumber + 1 : 10001;
  }
  next();
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);