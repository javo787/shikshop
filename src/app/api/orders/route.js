import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendTelegramNotification } from '@/lib/telegram'; // Если вы уже создали этот файл

export async function POST(req) {
  try {
    const body = await req.json();
    const { items, totalAmount, shippingAddress, paymentMethod, userId } = body;

    await connectMongoDB();

    // Создаем заказ
    const newOrder = await Order.create({
      user: userId || 'Guest', // Теперь модель это примет
      items: items.map(item => ({
        product: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        size: item.selectedSize || ''
      })),
      totalAmount,
      shippingAddress: {
          name: shippingAddress.name, // Убедитесь, что имена полей совпадают
          phone: shippingAddress.phone,
          address: shippingAddress.address
      },
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'new'
    });

    // Попытка отправить уведомление в Telegram (не блокирует создание заказа при ошибке)
    try {
        if (typeof sendTelegramNotification === 'function') {
            await sendTelegramNotification(newOrder);
        }
    } catch (tgError) {
        console.error('Ошибка Telegram:', tgError);
    }

    return NextResponse.json(
      { message: 'Order created', orderId: newOrder.orderNumber },
      { status: 201 }
    );

  } catch (error) {
    console.error('Order API Error:', error); // Эту ошибку вы видели в логах
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Метод GET для админки
export async function GET(req) {
  try {
    await connectMongoDB();
    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Метод PUT для обновления статуса
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status } = body;
    await connectMongoDB();
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}