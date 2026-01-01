export const sendTelegramNotification = async (order) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // 1. Разбиваем строку ID на массив (разделитель - запятая)
  const chatIds = process.env.TELEGRAM_ADMIN_ID?.split(',') || [];

  if (!token || chatIds.length === 0) {
    console.error('❌ Ошибка Telegram: Не заданы токен или ID админов');
    return;
  }

  // Формируем текст (он одинаковый для всех)
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
`;

  // 2. Отправляем каждому админу
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  // Используем Promise.all, чтобы отправить всем параллельно
  await Promise.all(chatIds.map(async (chatId) => {
    // Убираем возможные пробелы из ID
    const cleanId = chatId.trim();
    if (!cleanId) return;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`❌ Ошибка отправки для ${cleanId}:`, data.description);
      } else {
        console.log(`✅ Уведомление отправлено для ${cleanId}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка сети для ${cleanId}:`, error);
    }
  }));
};