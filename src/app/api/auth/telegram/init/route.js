import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import LoginRequest from '@/models/LoginRequest';

export async function POST(req) {
  try {
    // 1. Получаем код, который сгенерировал фронтенд
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    await connectMongoDB();

    // 2. Сохраняем его в базу данных со статусом 'pending'
    // Если такой код уже есть (маловероятно), MongoDB может выдать ошибку, поэтому используем try/catch
    await LoginRequest.create({ 
      code,
      status: 'pending'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Init Error:', error);
    // Даже если ошибка (например, дубликат), возвращаем ок, чтобы не ломать UI, 
    // но в консоли вы увидите проблему
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}