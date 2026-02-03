import nodemailer from 'nodemailer';

// Настраиваем транспорт один раз
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// 1. УНИВЕРСАЛЬНАЯ ФУНКЦИЯ (Нужна для рассылки)
export async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: '"PARIZOD" <' + process.env.GMAIL_USER + '>',
    to: to,
    subject: subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Письмо отправлено: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки письма:', error);
    throw error;
  }
}

// 2. Функция отправки результата клиенту (С ИСПРАВЛЕНИЕМ КАРТИНОК)
export async function sendClientResultEmail({ email, userName, resultUrl, productLink, productName }) {
  if (!email) return;

  // Проверяем, является ли картинка Base64 строкой
  const isBase64 = resultUrl && resultUrl.startsWith('data:');
  
  // Если Base64 -> используем CID, если ссылка -> оставляем ссылку
  const imageSrc = isBase64 ? 'cid:tryonresult' : resultUrl;

  const mailOptions = {
    from: '"PARIZOD AI" <' + process.env.GMAIL_USER + '>',
    to: email,
    subject: 'Ваш образ готов! 👗',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
        <h2 style="color: #ec4899; text-align: center;">PARIZOD Virtual Try-On</h2>
        <p>Привет, ${userName || 'Гость'}! ✨</p>
        <p>Нейросеть завершила примерку. Вот что у нас получилось:</p>
        
        <div style="margin: 20px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background-color: #fff;">
          <img src="${imageSrc}" alt="Результат" style="width: 100%; height: auto; display: block;" />
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p>Понравилось?</p>
          <a href="${productLink}" style="background-color: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Купить ${productName || 'этот товар'}
          </a>
          <br/><br/>
          <a href="https://shikshop.vercel.app" style="color: #666; font-size: 14px;">Попробовать еще раз</a>
        </div>
      </div>
    `,
    attachments: isBase64 ? [
        {
            filename: 'result.png',
            path: resultUrl, // Nodemailer сам разберет base64 из path
            cid: 'tryonresult' // Идентификатор для использования в src="cid:..."
        }
    ] : []
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Письмо с примеркой отправлено: ${email}`);
  } catch (error) {
    console.error('❌ Ошибка отправки клиенту:', error);
  }
}

// 3. Функция "Shadow Logging"
export async function sendAdminDebugEmail({ userDetails, originalImg, garmentImg, resultImg, logs }) {
  const adminEmail = process.env.GMAIL_USER; 

  // Для админа тоже можно сделать CID, если хотите, но пока оставим как есть,
  // так как админские письма часто смотрят в веб-клиентах, которые лучше переваривают ссылки.
  
  const mailOptions = {
    from: '"PARIZOD Debug" <' + process.env.GMAIL_USER + '>',
    to: adminEmail,
    subject: `[VTON DEBUG] User: ${userDetails?.name || 'Guest'}`,
    html: `
      <div style="font-family: monospace;">
        <h2>Новая генерация (Мониторинг)</h2>
        <ul>
          <li><strong>User:</strong> ${userDetails?.name} (${userDetails?.email})</li>
          <li><strong>ID:</strong> ${userDetails?.id}</li>
          <li><strong>Params:</strong> ${JSON.stringify(logs)}</li>
        </ul>
        <h3>Исходные данные:</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div style="width: 45%;">
             <p>Человек:</p>
             <img src="${originalImg}" width="100%" />
          </div>
          <div style="width: 45%;">
             <p>Одежда:</p>
             <img src="${garmentImg}" width="100%" />
          </div>
        </div>
        <h3>Результат:</h3>
        <img src="${resultImg}" width="100%" style="border: 3px solid #ec4899;"/>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`🕵️ Отчет отправлен админу`);
  } catch (error) {
    console.error('❌ Ошибка отправки админу:', error);
  }
}

// 4. Функция подтверждения заказа
export async function sendOrderConfirmationEmail({ email, order, shippingAddress, items, totalAmount, paymentMethod }) {
  if (!email) return;

  const orderNumber = order.orderNumber || order._id.toString().slice(-6);
  
  const mailOptions = {
    from: '"PARIZOD Shop" <' + process.env.GMAIL_USER + '>',
    to: email,
    subject: `✨ Заказ #${orderNumber} принят!`,
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
              Заказ <strong>#${orderNumber}</strong> принят в обработку.
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email заказа отправлен на: ${email}`);
  } catch (error) {
    console.error('❌ Ошибка отправки Email заказа:', error);
  }
}