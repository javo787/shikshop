import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User'; 
import { sendTelegramNotification } from '@/lib/telegram';

// --- CREATE ORDER (POST) ---
export async function POST(req) {
  try {
    const body = await req.json();
    const { items, totalAmount, shippingAddress, paymentMethod, userId } = body;

    await connectMongoDB();

    // 1. Создаем заказ
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
      shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          address: shippingAddress.address
      },
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'new'
    });

    // ⚠️ ИЗМЕНЕНИЕ: Мы УБРАЛИ начисление попыток здесь. 
    // Бонусы теперь только после доставки (см. PUT ниже).
    // Если нужно просто отметить, что юзер совершал покупки (для статистики), можно оставить:
    if (userId && userId !== 'Guest') {
        await User.findByIdAndUpdate(userId, { hasPurchased: true });
    }

    // Отправка в Telegram
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

// --- GET ORDERS (GET) ---
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    await connectMongoDB();
    
    let query = {};
    if (userId) {
      query = { user: userId };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// --- UPDATE STATUS (PUT) ---
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status } = body; // id заказа, новый статус
    
    await connectMongoDB();
    
    // 1. Обновляем статус заказа
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. 🔥 ЛОГИКА НАЧИСЛЕНИЯ БОНУСОВ 🔥
    // Если статус сменился на "delivered" (Доставлен)
    if (status === 'delivered') {
       // Проверяем, что заказ принадлежит зарегистрированному юзеру
       if (updatedOrder.user && updatedOrder.user !== 'Guest') {
          // Ищем пользователя и добавляем ему 20 попыток ($inc увеличивает текущее значение)
          await User.findByIdAndUpdate(updatedOrder.user, {
             $inc: { tryOnBalance: 20 },
             hasPurchased: true 
          });
          console.log(`Пользователю ${updatedOrder.user} начислено +20 попыток за доставленный заказ.`);
       }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update Order Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}