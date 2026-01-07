import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User'; 
import { sendTelegramNotification } from '@/lib/telegram';
import nodemailer from 'nodemailer'; // 1. Импортируем Nodemailer

// 2. Настройка транспортера Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // parizod.tj@gmail.com
    pass: process.env.GMAIL_PASS, // Ваш 16-значный код
  },
});

// --- CREATE ORDER (POST) ---
export async function POST(req) {
  try {
    const body = await req.json();
    // Добавил userEmail в извлекаемые данные
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

    // 2. Логика отправки Email (Профессиональный шаблон) 📧
    try {
      // Если email не пришел с фронта, не отправляем (чтобы не было ошибки), или отправляем админу
      if (userEmail) {
        await transporter.sendMail({
          from: '"PARIZOD Shop" <' + process.env.GMAIL_USER + '>', // Красивое имя отправителя
          to: userEmail, 
          subject: `✨ Заказ #${newOrder.orderNumber || 'принят'} | PARIZOD`,
          html: `
            <div style="background-color: #f8f9fa; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #ec4899; margin: 0; font-size: 28px; letter-spacing: -1px;">PARIZOD</h1>
                  <p style="color: #6b7280; margin-top: 5px; font-size: 14px;">Магазин стильной одежды</p>
                </div>

                <h2 style="color: #111827; font-size: 20px; margin-bottom: 20px; text-align: center;">
                  Спасибо за заказ, ${shippingAddress.name}! 💖
                </h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.5; text-align: center; margin-bottom: 30px;">
                  Мы получили ваш заказ <strong>#${newOrder.orderNumber || newOrder._id.toString().slice(-6)}</strong> и уже начали его собирать.
                </p>

                <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    ${items.map(item => `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">
                          <strong>${item.name}</strong> <br/>
                          <span style="font-size: 12px; color: #6b7280;">Размер: ${item.selectedSize || 'One Size'} x ${item.quantity}</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: bold;">
                          ${item.price * item.quantity} TJS
                        </td>
                      </tr>
                    `).join('')}
                    <tr>
                      <td style="padding-top: 15px; font-size: 18px; font-weight: bold; color: #111827;">Итого:</td>
                      <td style="padding-top: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #ec4899;">${totalAmount} TJS</td>
                    </tr>
                  </table>
                </div>

                <div style="margin-bottom: 30px; border-left: 4px solid #ec4899; padding-left: 15px;">
                  <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 16px;">📍 Данные доставки:</h3>
                  <p style="margin: 0; color: #4b5563; font-size: 14px;">Адрес: ${shippingAddress.address}</p>
                  <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Телефон: <strong>${shippingAddress.phone}</strong></p>
                  <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Оплата: ${paymentMethod === 'cash_on_delivery' ? 'Наличными при получении' : 'Картой'}</p>
                </div>

                <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #9ca3af; font-size: 12px;">
                  <p>Если у вас есть вопросы, просто ответьте на это письмо.</p>
                  <p>© 2026 PARIZOD. Все права защищены.</p>
                </div>
              </div>
            </div>
          `
        });
        console.log('✅ Письмо успешно отправлено на', userEmail);
      }
    } catch (emailError) {
      console.error('❌ Ошибка отправки Email:', emailError);
      // Не прерываем выполнение, заказ все равно создан
    }

    // 3. Отправка в Telegram (Ваш старый код)
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

// --- GET ORDERS (Без изменений) ---
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

// --- UPDATE STATUS (PUT) (Без изменений, ваша логика бонусов сохранена) ---
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status } = body; 
    
    await connectMongoDB();
    
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 🔥 ЛОГИКА НАЧИСЛЕНИЯ БОНУСОВ
    if (status === 'delivered') {
       if (updatedOrder.user && updatedOrder.user !== 'Guest') {
          await User.findByIdAndUpdate(updatedOrder.user, {
             $inc: { tryOnBalance: 20 },
             hasPurchased: true 
          });
          console.log(`Пользователю ${updatedOrder.user} начислено +20 попыток.`);
       }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update Order Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}