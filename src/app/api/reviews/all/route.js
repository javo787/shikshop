import { NextResponse } from 'next/server';
import { connectMongoDB } from '../../../../lib/mongodb';
import Review from '../../../../models/Review';
export async function GET() {
  try {
    await connectMongoDB();
    const reviews = await Review.find().lean();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Ошибка получения всех отзывов:', error.message);
    return NextResponse.json({ error: 'Не удалось получить отзывы', details: error.message }, { status: 500 });
  }
}