import mongoose from 'mongoose';

let conn = null;
let isConnecting = false;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function connectMongoDB() {
  if (conn) {
    try {
      await conn.connection.db.command({ ping: 1 });
      console.log('MongoDB уже подключен');
      return { conn };
    } catch (error) {
      console.error('Ping не удался, сброс соединения');
      conn = null;
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
      appName: 'shikshop',
    });

    console.log('Соединение установлено, db:', conn.connection.db ? 'OK' : 'undefined');
    if (!conn.connection.db) {
      throw new Error('MongoDB connection database is undefined');
    }

    await conn.connection.db.command({ ping: 1 });
    console.log('MongoDB ping успешен');

    isConnecting = false;
    return { conn };
  } catch (error) {
    console.error('Ошибка подключения MongoDB:', error.message);
    conn = null;
    isConnecting = false;
    throw error;
  }
}