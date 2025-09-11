import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '../../../lib/mongodb';
import Review from '../../../models/review';

export async function GET(request) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId обязателен' }, { status: 400 });
    }
    const reviews = await Review.find({ productId }).lean();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Ошибка получения отзывов:', error.message);
    return NextResponse.json({ error: 'Не удалось получить отзывы', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectMongoDB();
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Неверный JSON в теле запроса:', error.message);
      return NextResponse.json({ error: 'Неверный формат JSON в теле запроса' }, { status: 400 });
    }

    const { productId, userName, rating, comment } = body;
    console.log('Получены данные отзыва:', { productId, userName, rating, comment });

    if (!productId) {
      return NextResponse.json({ error: 'productId обязателен' }, { status: 400 });
    }
    if (!userName) {
      return NextResponse.json({ error: 'userName обязателен' }, { status: 400 });
    }
    if (!rating) {
      return NextResponse.json({ error: 'rating обязателен' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Неверный формат productId' }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating должен быть числом от 1 до 5' }, { status: 400 });
    }

    const review = new Review({ productId, userName, rating, comment });
    await review.save();
    return NextResponse.json(review.toObject(), { status: 201 });
  } catch (error) {
    console.error('Ошибка создания отзыва:', error.message);
    return NextResponse.json({ error: 'Не удалось создать отзыв', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    console.log('Попытка удаления отзыва:', { reviewId });
    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId обязателен' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: 'Неверный формат reviewId' }, { status: 400 });
    }
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Отзыв успешно удалён' }, { status: 200 });
  } catch (error) {
    console.error('Ошибка удаления отзыва:', error.message);
    return NextResponse.json({ error: 'Не удалось удалить отзыв', details: error.message }, { status: 500 });
  }
}