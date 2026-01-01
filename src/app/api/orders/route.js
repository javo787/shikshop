import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req) {
  try {
    const body = await req.json();
    const { items, totalAmount, shippingAddress, paymentMethod, userId } = body;

    await connectMongoDB();

    // Создаем заказ
    const newOrder = await Order.create({
      user: userId || 'Guest', // Теперь здесь будет реальный ID юзера, если он вошел
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
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          address: shippingAddress.address
      },
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'new'
    });

    try {
        if (typeof sendTelegramNotification === 'function') {
            await sendTelegramNotification(newOrder);
        }
    } catch (tgError) {
        console.error('Ошибка Telegram:', tgError);
    }

    return NextResponse.json({ message: 'Order created', orderId: newOrder.orderNumber }, { status: 201 });
  } catch (error) {
    console.error('Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ОБНОВЛЕННЫЙ GET С ФИЛЬТРАЦИЕЙ
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    await connectMongoDB();
    
    let query = {};
    if (userId) {
      query = { user: userId }; // Фильтруем по ID пользователя
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

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