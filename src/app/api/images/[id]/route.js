import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '../../../../lib/mongodb';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // Извлекаем ID из URL
    if (!id) {
      console.error('ID параметр отсутствует');
      return NextResponse.json({ error: 'ID параметр отсутствует' }, { status: 400 });
    }

    const { gfs } = await connectMongoDB();
    if (!gfs) {
      console.error('GridFS не инициализирован');
      return NextResponse.json({ error: 'GridFS не инициализирован' }, { status: 500 });
    }

    const fileId = new mongoose.Types.ObjectId(id);
    const downloadStream = gfs.openDownloadStream(fileId);

    return new NextResponse(downloadStream, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error.message);
    return NextResponse.json({ error: 'Failed to fetch image', details: error.message }, { status: 500 });
  }
}