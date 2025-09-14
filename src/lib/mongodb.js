import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

let conn = null;
let gfs = null;
let isConnecting = false; // Флаг для предотвращения параллельных подключений

// Функция для ожидания (используется для повторных попыток)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function connectMongoDB(attempt = 1, maxAttempts = 3) {
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

  if (isConnecting) {
    console.log('Подключение уже в процессе, ожидание...');
    while (isConnecting && attempt <= maxAttempts) {
      await sleep(1000); // Ждем 1 секунду перед проверкой
    }
    if (conn && gfs) return { conn, gfs };
  }

  isConnecting = true;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не указан в .env.local');
    }

    console.log(`Попытка подключения к MongoDB (попытка ${attempt}/${maxAttempts})...`);
    conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Увеличенный таймаут выбора сервера
      connectTimeoutMS: 15000, // Увеличенный таймаут подключения
      socketTimeoutMS: 60000, // Увеличенный таймаут сокета
      maxPoolSize: 10,
      appName: 'shikshak-shop',
    });

    if (!conn.connection.db) {
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
      throw new Error('GridFS collections missing');
    }

    await conn.connection.db.command({ ping: 1 });
    console.log('MongoDB ping успешен');

    isConnecting = false;
    return { conn, gfs };
  } catch (error) {
    console.error(`Ошибка подключения MongoDB (попытка ${attempt}/${maxAttempts}):`, error.message);
    conn = null;
    gfs = null;
    isConnecting = false;

    if (attempt < maxAttempts) {
      console.log(`Повторная попытка подключения через 2 секунды...`);
      await sleep(2000);
      return connectMongoDB(attempt + 1, maxAttempts);
    }

    throw new Error(`Не удалось подключиться к MongoDB после ${maxAttempts} попыток: ${error.message}`);
  }
}