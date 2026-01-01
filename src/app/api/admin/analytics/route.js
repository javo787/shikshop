import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import TryOnLog from '@/models/TryOnLog';
import User from '@/models/User'; // Импорт User нужен, если мы делаем populate, но в TryOnLog уже есть ref

export async function GET(req) {
  try {
    await connectMongoDB();

    // 1. Получаем последние 50 использований (для ленты событий)
    const recentLogs = await TryOnLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email'); // Подтягиваем имя и email, если это зарегистрированный юзер

    // 2. Агрегация: Топ IP адресов по количеству попыток (поиск мультиаккаунтов)
    const topIps = await TryOnLog.aggregate([
      {
        $group: {
          _id: "$ipAddress", // Группируем по IP
          count: { $sum: 1 }, // Считаем количество
          lastUsed: { $max: "$createdAt" }, // Дата последнего использования
          associatedUsers: { $addToSet: "$userId" } // Собираем список ID юзеров с этого IP
        }
      },
      { $sort: { count: -1 } }, // Сортируем от большего к меньшему
      { $limit: 20 } // Берем топ-20 нарушителей/активных юзеров
    ]);

    // 3. Простая статистика за сегодня
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayUsage = await TryOnLog.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    const totalUsage = await TryOnLog.countDocuments();

    return NextResponse.json({
      recentLogs,
      topIps,
      stats: {
        today: todayUsage,
        total: totalUsage
      }
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}