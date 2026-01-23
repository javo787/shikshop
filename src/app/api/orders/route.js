import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User'; 
import { sendTelegramNotification } from '@/lib/telegram';
// Импортируем нашу централизованную функцию почты
import { sendOrderConfirmationEmail } from '@/lib/email'; 

// --- СОЗДАНИЕ ЗАКАЗА (POST) ---
export async function POST(req) {
  try {
    const body = await req.json();
    const { items, totalAmount, shippingAddress, paymentMethod, userId, userEmail } = body;

    await connectMongoDB();

    // 1. Создаем заказ в базе
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

    // 2. ОТПРАВКА EMAIL КЛИЕНТУ (Через сервис)
    // Эта логика не блокирует создание заказа, поэтому оборачиваем в try/catch внутри, но не прерываем ответ
    (async () => {
      try {
        let targetEmail = userEmail;

        // Если email не пришел с фронта, но юзер авторизован — ищем email в базе
        if (!targetEmail && userId && userId !== 'Guest') {
           const user = await User.findOne({ firebaseUid: userId }) || await User.findById(userId).catch(() => null);
           if (user && user.email) {
              targetEmail = user.email;
           }
        }

        if (targetEmail) {
           await sendOrderConfirmationEmail({
             email: targetEmail,
             order: newOrder,
             shippingAddress,
             items,
             totalAmount,
             paymentMethod
           });
        }
      } catch (bgError) {
        console.error('⚠️ Background Email Error:', bgError);
      }
    })();

    // 3. Отправка в Telegram
    try {
        if (typeof sendTelegramNotification === 'function') {
            await sendTelegramNotification(newOrder);
        }
    } catch (tgError) {
        console.error('Ошибка Telegram:', tgError);
    }

    return NextResponse.json({ message: 'Order created', orderId: newOrder.orderNumber }, { status: 201 });
  } catch (error) {
    console.error('GLOBAL Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- GET ORDERS ---
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    await connectMongoDB();
    let query = {};
    if (userId) query = { user: userId };
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
    const { id, status } = body; 
    await connectMongoDB();
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (status === 'delivered') {
       if (updatedOrder.user && updatedOrder.user !== 'Guest') {
          await User.findByIdAndUpdate(updatedOrder.user, {
             $inc: { tryOnBalance: 20 },
             hasPurchased: true 
          });
       }
    }
    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}