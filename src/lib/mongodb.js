import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

let conn = null;
let gfs = null;
let isConnecting = false;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function connectMongoDB() {
  if (conn && gfs) {
    try {
      await conn.connection.db.command({ ping: 1 });
      console.log('MongoDB уже подключен');
      return { conn, gfs };
    } catch (error) {
      console.error('Ping не удался, сброс соединения');
      conn = null;
      gfs = null;
    }
  }

  if (isConnecting) {
    console.log('Подключение в процессе, ожидание...');
    await sleep(500);
    return connectMongoDB();
  }

  isConnecting = true;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не указан в .env.local');
    }

    console.log('URI используется:', process.env.MONGODB_URI.substring(0, 50) + '...');
    console.log('Подключение к MongoDB...');
    conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
      appName: 'shikshak-shop',
    });

    console.log('Соединение установлено, db:', conn.connection.db ? 'OK' : 'undefined');
    if (!conn.connection.db) {
      throw new Error('MongoDB connection database is undefined');
    }

    console.log('MongoDB подключен, инициализация GridFS...');
    gfs = new mongoose.mongo.GridFSBucket(conn.connection.db, { bucketName: 'images' });

    console.log('GridFS инициализирован');
    await conn.connection.db.command({ ping: 1 });
    console.log('MongoDB ping успешен');

    isConnecting = false;
    return { conn, gfs };
  } catch (error) {
    console.error('Ошибка подключения MongoDB:', error.message);
    conn = null;
    gfs = null;
    isConnecting = false;
    throw error;
  }
}