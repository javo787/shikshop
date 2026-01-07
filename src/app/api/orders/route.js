import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User'; 
import { sendTelegramNotification } from '@/lib/telegram';
import nodemailer from 'nodemailer'; 

// --- НАСТРОЙКА ПОЧТЫ (GMAIL) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_PASS, 
  },
});

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

    // 2. ОТПРАВКА EMAIL КЛИЕНТУ
    try {
      let targetEmail = userEmail;

      // Если email не пришел с фронта, но юзер авторизован — ищем email в базе молча
      if (!targetEmail && userId && userId !== 'Guest') {
         const user = await User.findOne({ firebaseUid: userId }) || await User.findById(userId).catch(() => null);
         if (user && user.email) {
            targetEmail = user.email;
         }
      }

      if (targetEmail) {
        await transporter.sendMail({
          from: '"PARIZOD Shop" <' + process.env.GMAIL_USER + '>',
          to: targetEmail, 
          subject: `✨ Заказ #${newOrder.orderNumber || newOrder._id.toString().slice(-6)} принят!`,
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 0; font-family: sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #ec4899; margin: 0; font-size: 28px;">PARIZOD</h1>
                </div>
                <h2 style="color: #111827; font-size: 20px; margin-bottom: 20px; text-align: center;">
                  Спасибо за заказ, ${shippingAddress.name}! 💖
                </h2>
                <p style="color: #374151; font-size: 16px; text-align: center; margin-bottom: 30px;">
                  Заказ <strong>#${newOrder.orderNumber || newOrder._id.toString().slice(-6)}</strong> принят в обработку.
                </p>

                <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    ${items.map(item => `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">
                          <strong>${item.name}</strong> <br/>
                          <span style="font-size: 12px; color: #6b7280;">${item.quantity} шт.</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                          ${item.price * item.quantity} TJS
                        </td>
                      </tr>
                    `).join('')}
                    <tr>
                      <td style="padding-top: 15px; font-weight: bold;">Итого:</td>
                      <td style="padding-top: 15px; text-align: right; font-weight: bold; color: #ec4899;">${totalAmount} TJS</td>
                    </tr>
                  </table>
                </div>

                <div style="margin-bottom: 30px; padding-left: 15px; border-left: 4px solid #ec4899;">
                   <p style="color: #4b5563; margin: 5px 0;">Адрес: ${shippingAddress.address}</p>
                   <p style="color: #4b5563; margin: 5px 0;">Телефон: <strong>${shippingAddress.phone}</strong></p>
                   <p style="color: #4b5563; margin: 5px 0;">Оплата: ${paymentMethod === 'cash_on_delivery' ? 'При получении' : 'Картой'}</p>
                </div>

                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                  <p>© 2026 PARIZOD</p>
                </div>
              </div>
            </div>
          `
        });
        // Оставляем только этот лог успеха
        console.log(`✅ Email отправлен на: ${targetEmail}`);
      } 
    } catch (emailError) {
      // Лог ошибки оставляем обязательно!
      console.error('❌ Ошибка отправки Email:', emailError);
    }

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