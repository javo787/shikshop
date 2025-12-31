export const sendTelegramNotification = async (order) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_ID;

  if (!token || !chatId) {
    console.error('Telegram settings are missing');
    return;
  }

  // Формируем красивый текст сообщения
  const itemsList = order.items
    .map((item, index) => 
      `${index + 1}. ${item.name} (${item.size || 'STD'}) — ${item.quantity} шт. x ${item.price} TJS`
    )
    .join('\n');

  const message = `
🚨 <b>НОВЫЙ ЗАКАЗ!</b> 🚨

🆔 <b>Заказ:</b> ${order.orderNumber || 'Без номера'}
👤 <b>Клиент:</b> ${order.shippingAddress?.name}
📞 <b>Телефон:</b> ${order.shippingAddress?.phone}
📍 <b>Адрес:</b> ${order.shippingAddress?.address}

🛒 <b>Товары:</b>
${itemsList}

💰 <b>Итого:</b> ${order.totalAmount} TJS
🚚 <b>Доставка:</b> ${order.totalAmount >= 250 ? 'Бесплатно' : 'Платная'}

<i>Проверьте админ-панель для деталей!</i>
`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Чтобы работала жирность шрифта
      }),
    });
    
    console.log('Telegram notification sent');
  } catch (error) {
    console.error('Telegram sending error:', error);
  }
};