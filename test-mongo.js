import { config } from 'dotenv';
import { connectMongoDB } from './src/lib/mongodb.js';

config({ path: '.env.local' });

async function testMongo() {
  try {
    const { conn, gfs } = await connectMongoDB();
    console.log('MongoDB подключен успешно');
    console.log('Database name:', conn.connection.db.databaseName);
    console.log('GridFS инициализирован:', !!gfs);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

testMongo();