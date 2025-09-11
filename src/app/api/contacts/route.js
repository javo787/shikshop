import { NextResponse } from 'next/server';
import { connectMongoDB } from '../../../lib/mongodb.js';
import Message from '../../../models/Message.js';

export async function POST(request) {
  try {
    await connectMongoDB();
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }
    const newMessage = await Message.create({ name, email, message });
    return NextResponse.json({ message: 'Сообщение отправлено', data: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoDB();
    const messages = await Message.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}