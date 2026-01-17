import Replicate from "replicate";
import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { personImage, garmentImage, userId, category = "upper_body" } = await req.json();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Не загружены фото" }, { status: 400 });
    }

    await connectMongoDB();

    // --- 1. ПРОВЕРКА ЛИМИТОВ ---
    if (userId) {
      const user = await User.findOne({ firebaseUid: userId });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (user.isBlocked) return NextResponse.json({ error: 'Blocked' }, { status: 403 });
      
      if (user.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ error: 'LIMIT_REACHED_BUY', message: 'Лимит исчерпан.' }, { status: 403 });
      }
      user.tryOnBalance -= 1;
      await user.save();
      await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'success', userAgent });
    } else {
      const usageCount = await TryOnLog.countDocuments({ ipAddress: ip, userId: null, status: 'success' });
      if (usageCount >= 1) { 
        return NextResponse.json({ error: 'LIMIT_REACHED_GUEST', message: 'Гостевой лимит исчерпан.' }, { status: 403 });
      }
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent });
    }

    // --- 2. ЗАПУСК НЕЙРОСЕТИ (IDM-VTON Latest) ---
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const randomSeed = Math.floor(Math.random() * 2147483647);
    const PRO_PROMPT = "high quality realistic clothing, detailed fabric texture, professional fashion photography, 4k, natural lighting";

    console.log("🚀 Запуск IDM-VTON (Latest) с категорией:", category);

    const prediction = await replicate.predictions.create({
      // ✅ АКТУАЛЬНЫЙ ID С САЙТА (Latest)
      version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985", 
      input: {
        steps: 30, 
        crop: false, // ⚠️ ВАЖНО: false, чтобы не резало платья
        seed: randomSeed,
        category: category, 
        force_dc: false,
        garm_img: garmentImage,
        human_img: personImage,
        garment_des: PRO_PROMPT,
      }
    });

    let remaining = 0;
    if (userId) {
       const updatedUser = await User.findOne({ firebaseUid: userId });
       remaining = updatedUser ? updatedUser.tryOnBalance : 0;
    }

    return NextResponse.json({ ...prediction, remaining });

  } catch (error) {
    console.error("Try-On Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(id);
    return NextResponse.json(prediction);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
