import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '../../../../lib/mongodb';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // Извлекаем ID из URL
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Некорректный или отсутствующий ID:', id);
      return NextResponse.json({ error: 'Некорректный или отсутствующий ID' }, { status: 400 });
    }

    const { gfs } = await connectMongoDB();
    if (!gfs) {
      console.error('GridFS не инициализирован');
      return NextResponse.json({ error: 'GridFS не инициализирован' }, { status: 500 });
    }

    const fileId = new mongoose.Types.ObjectId(id);
    // Проверяем, существует ли файл в GridFS
    const file = await gfs.find({ _id: fileId }).toArray();
    if (!file || file.length === 0) {
      console.error('Файл не найден:', id);
      return NextResponse.json({ error: 'Изображение не найдено' }, { status: 404 });
    }

    const downloadStream = gfs.openDownloadStream(fileId);
    // Используем Content-Type из метаданных файла или дефолтный
    const contentType = file[0].contentType || 'image/jpeg';

    return new NextResponse(downloadStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Кэширование на год
      },
    });
  } catch (error) {
    console.error('Ошибка при загрузке изображения:', error.message);
    return NextResponse.json({ error: 'Не удалось загрузить изображение', details: error.message }, { status: 500 });
  }
}