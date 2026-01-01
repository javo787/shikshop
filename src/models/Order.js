import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    // ИСПРАВЛЕНО: Разрешаем хранить здесь и ID (если вошел), и строку "Guest" (если не вошел)
    user: {
      type: mongoose.Schema.Types.Mixed, 
      required: true,
      default: 'Guest'
    },
    
    orderNumber: {
      type: String, // Лучше String для генерации красивых ID
      unique: true,
    },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        image: String,
        quantity: Number,
        size: String,
      },
    ],
    
    totalAmount: {
      type: Number,
      required: true,
    },
    
    // ИСПРАВЛЕНО: Меняем fullName на name, чтобы совпадало с формой на сайте
    shippingAddress: {
      name: { type: String, required: true }, // <--- Было fullName
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },

    status: {
      type: String,
      enum: ['new', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'new',
    },

    paymentMethod: {
      type: String,
      default: 'cash_on_delivery',
    },
  },
  { timestamps: true }
);

// Генерация красивого номера заказа
OrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    // Пример: ORD-1205-5839 (ДеньМесяц-СлучайноеЧисло)
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${date.getDate()}${date.getMonth()+1}-${random}`;
  }
  next();
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);