export const sendTelegramNotification = async (order) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_ID;

  if (!token || !chatId) {
    console.error('❌ Ошибка Telegram: Не заданы TELEGRAM_BOT_TOKEN или TELEGRAM_ADMIN_ID в .env');
    return;
  }

  // Формируем текст сообщения
  const itemsList = order.items
    .map((item, index) => 
      `${index + 1}. ${item.name} (${item.size || 'STD'}) — ${item.quantity} шт. x ${item.price} TJS`
    )
    .join('\n');

  const message = `
🚨 <b>НОВЫЙ ЗАКАЗ!</b> 🚨

🆔 <b>Заказ:</b> ${order.orderNumber || order._id}
👤 <b>Клиент:</b> ${order.shippingAddress?.name}
📞 <b>Телефон:</b> ${order.shippingAddress?.phone}
📍 <b>Адрес:</b> ${order.shippingAddress?.address}

🛒 <b>Товары:</b>
${itemsList}

💰 <b>Итого:</b> ${order.totalAmount} TJS
🚚 <b>Метод:</b> ${order.paymentMethod === 'cash_on_delivery' ? 'Наличные' : 'Карта'}

<i>Проверьте админ-панель!</i>
`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    // 👇 ВАЖНОЕ ИЗМЕНЕНИЕ: Читаем ответ от Telegram
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Ошибка отправки в Telegram:', data);
    } else {
      console.log('✅ Telegram уведомление успешно отправлено:', data.result?.message_id);
    }
    
  } catch (error) {
    console.error('❌ Ошибка сети Telegram:', error);
  }
};