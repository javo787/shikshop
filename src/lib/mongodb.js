import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

let conn = null;
let gfs = null;

export async function connectMongoDB() {
  if (conn && gfs) {
    try {
      await conn.connection.db.command({ ping: 1 });
      console.log('MongoDB уже подключен, ping успешен');
      return { conn, gfs };
    } catch (error) {
      console.error('Ping не удался, сброс соединения:', error.message);
      conn = null;
      gfs = null;
    }
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не указан в .env.local');
    }

    console.log('Попытка подключения к MongoDB...');
    conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      appName: 'shikshak-shop',
    });

    if (!conn.connection.db) {
      console.error('MongoDB connection db is undefined');
      throw new Error('MongoDB connection database is undefined');
    }

    console.log('MongoDB подключен, инициализация GridFS...');
    gfs = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: 'images',
    });

    console.log('GridFS инициализирован, проверка коллекций...');
    const collections = await conn.connection.db.listCollections().toArray();
    const hasImagesFiles = collections.some(c => c.name === 'images.files');
    const hasImagesChunks = collections.some(c => c.name === 'images.chunks');
    console.log('Коллекция images.files существует:', hasImagesFiles);
    console.log('Коллекция images.chunks существует:', hasImagesChunks);

    if (!hasImagesFiles || !hasImagesChunks) {
      console.error('GridFS коллекции отсутствуют');
      throw new Error('GridFS collections missing');
    }

    await conn.connection.db.command({ ping: 1 });
    console.log('MongoDB ping успешен');

    return { conn, gfs };
  } catch (error) {
    console.error('Ошибка подключения MongoDB:', error.message);
    conn = null;
    gfs = null;
    throw error;
  }
}