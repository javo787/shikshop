import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    const { firebaseUid, productId } = await req.json();

    if (!firebaseUid || !productId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await connectMongoDB();

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Проверяем, есть ли товар уже в избранном
    const isFavorite = user.favorites.includes(productId);
    
    let updatedUser;
    if (isFavorite) {
      // Удаляем
      updatedUser = await User.findOneAndUpdate(
        { firebaseUid },
        { $pull: { favorites: productId } },
        { new: true }
      );
    } else {
      // Добавляем
      updatedUser = await User.findOneAndUpdate(
        { firebaseUid },
        { $addToSet: { favorites: productId } }, // $addToSet предотвращает дубли
        { new: true }
      );
    }

    return NextResponse.json({ 
      favorites: updatedUser.favorites, 
      action: isFavorite ? 'removed' : 'added' 
    }, { status: 200 });

  } catch (error) {
    console.error('Favorites API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}