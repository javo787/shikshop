import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendTelegramNotification } from '@/lib/telegram'; // <--- 1. Импортируем

// ... (метод GET оставляем без изменений)

export async function POST(req) {
  try {
    const body = await req.json();
    const { items, totalAmount, shippingAddress, paymentMethod, userId } = body;

    await connectMongoDB();

    // Создаем заказ
    const newOrder = await Order.create({
      user: userId || 'Guest',
      items: items.map(item => ({
        product: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        size: item.selectedSize || ''
      })),
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'new'
    });

    // 2. ОТПРАВЛЯЕМ В ТЕЛЕГРАМ (внутри try-catch, чтобы не ломать заказ, если телеграм зависнет)
    try {
      await sendTelegramNotification(newOrder);
    } catch (tgError) {
      console.error('Не удалось отправить в Telegram:', tgError);
    }

    return NextResponse.json(
      { message: 'Order created', orderId: newOrder.orderNumber },
      { status: 201 }
    );

  } catch (error) {
    console.error('Order API Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// Получение всех заказов (для админки)
export async function GET(req) {
  try {
    await connectMongoDB();
    // Сортируем: сначала новые
    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Order Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Обновление статуса заказа
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    await connectMongoDB();

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Order Update Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}