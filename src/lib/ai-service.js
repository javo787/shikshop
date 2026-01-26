import Replicate from "replicate";
import { GoogleAuth } from 'google-auth-library';

// --- 1. КОНФИГУРАЦИЯ МОДЕЛЕЙ ---
export const AI_MODELS = {
  // ВАРИАНТ 1: Золотой стандарт (Replicate)
  // Самое высокое качество, но медленно и платно через Replicate
  'idm-vton': {
    name: "IDM-VTON (Premium)",
    provider: 'replicate',
    id: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    type: "vton-standard",
    cost: 1, 
  },

  // ВАРИАНТ 2: Официальный Google Try-On (Vertex AI)
  // Специализированная модель для примерки. Быстрая.
  'google-vton': {
    name: "Google Try-On (Speed)",
    provider: 'google-vertex',
    // Если virtual-try-on-exp выдаст 404, смените на virtual-try-on-001
    modelId: 'virtual-try-on-exp', 
    region: 'us-central1',
    type: "vton-native",
    cost: 1,
  },

  // ВАРИАНТ 3: Gemini 2.5 Flash Image (Nano Banana)
  // Творческий режим: понимает промпты и может менять позу/фон
  'gemini-flash': {
    name: "Gemini 2.5 (Nano Banana)",
    provider: 'google-vertex',
    // 🔥 ТОЧНОЕ НАЗВАНИЕ НОВОЙ МОДЕЛИ ИЗ ВАШЕЙ ДОКУМЕНТАЦИИ
    modelId: 'gemini-2.5-flash-image', 
    region: 'us-central1',
    type: "generative-prompt", 
    cost: 1,
    // Ваш промпт для "умного" редактирования
    systemPrompt: `Request: Virtual Try-On.
Input 1: Person. Input 2: Garment.
Task: Generate a photorealistic image of the person from Input 1 wearing the garment from Input 2.
Requirements:
1. Retain the person's identity, pose, and body shape.
2. Fit the garment naturally (folds, lighting, texture).
3. You may slightly adjust the background or lighting to blend the garment perfectly.
4. Output ONLY the generated image.`
  }
};

// --- 2. ГЛАВНАЯ ФУНКЦИЯ ЗАПУСКА ---
export async function generateTryOn(modelKey, { personImage, garmentImage, category = 'upper_body' }) {
  // Если модель не найдена, используем Google VTON по умолчанию
  const modelConfig = AI_MODELS[modelKey] || AI_MODELS['google-vton'];

  console.log(`🚀 Start AI: ${modelConfig.name} [${modelConfig.provider}]`);

  // Роутер: выбираем движок
  if (modelConfig.provider === 'replicate') {
    return await _runReplicate(modelConfig, { personImage, garmentImage, category });
  } 
  else if (modelConfig.provider === 'google-vertex') {
    // В Google Vertex есть два разных API:
    // 1. Predict API (для VTON моделей)
    // 2. GenerateContent API (для Gemini моделей)
    if (modelConfig.type === 'vton-native') {
        return await _runGoogleVtonNative(modelConfig, personImage, garmentImage);
    } else {
        return await _runGoogleGeminiPrompt(modelConfig, personImage, garmentImage);
    }
  }

  throw new Error("Unknown provider");
}

// ==========================================
// ВНУТРЕННИЕ ФУНКЦИИ (ДВИЖКИ)
// ==========================================

// --- A. REPLICATE (IDM-VTON) ---
async function _runReplicate(config, inputs) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  const output = await replicate.predictions.create({
    version: config.id,
    input: {
      steps: 30,
      crop: false,
      seed: 42,
      category: inputs.category,
      force_dc: inputs.category === 'dresses',
      garm_img: inputs.garmentImage,
      human_img: inputs.personImage,
      garment_des: "high quality realistic clothing"
    }
  });

  return output; 
}

// --- B. GOOGLE VERTEX: NATIVE VTON (Try-On API) ---
async function _runGoogleVtonNative(config, personBase64, garmentBase64) {
  const auth = await _getGoogleAuth(config.region);
  
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:predict`;

  const pImg = personBase64.replace(/^data:image\/.+;base64,/, '');
  const gImg = garmentBase64.replace(/^data:image\/.+;base64,/, '');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instances: [{ 
          person_image: { bytes: pImg }, 
          product_image: { bytes: gImg } 
      }],
      parameters: { seed: Math.floor(Math.random() * 1000000) }
    })
  });

  if (!response.ok) {
     const err = await response.text();
     // Если экспериментальная версия недоступна, кидаем понятную ошибку
     if (response.status === 404) {
        throw new Error("Model not found. Try changing 'virtual-try-on-exp' to 'virtual-try-on-001' in ai-service.js");
     }
     throw new Error(`Google VTON Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const resultBytes = data.predictions?.[0]?.bytes;
  
  if (!resultBytes) throw new Error("Google VTON returned empty result");
  
  return { output: `data:image/png;base64,${resultBytes}`, status: 'succeeded' };
}

// --- C. GOOGLE VERTEX: GEMINI 2.5 (Nano Banana) ---
async function _runGoogleGeminiPrompt(config, personBase64, garmentBase64) {
  const auth = await _getGoogleAuth(config.region);

  // Для Gemini используется метод :generateContent
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:generateContent`;

  const pImg = personBase64.replace(/^data:image\/.+;base64,/, '');
  const gImg = garmentBase64.replace(/^data:image\/.+;base64,/, '');

  // Формируем мультимодальный запрос (Текст + 2 Картинки)
  const requestBody = {
    contents: [{
      role: "user",
      parts: [
        { text: config.systemPrompt }, 
        { inlineData: { mimeType: "image/jpeg", data: pImg } }, // Фото 1 (Человек)
        { inlineData: { mimeType: "image/jpeg", data: gImg } }  // Фото 2 (Одежда)
      ]
    }],
    generationConfig: {
      temperature: 0.4,
      // В документации указано Output token limit 32k, но для картинки важно media_resolution (если поддерживается)
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  
  // Парсим ответ Gemini. Обычно картинка приходит как inlineData в parts.
  const candidate = data.candidates?.[0]?.content?.parts?.[0];
  
  // Если модель вернула картинку (Base64)
  if (candidate?.inlineData?.data) {
     return { output: `data:image/png;base64,${candidate.inlineData.data}`, status: 'succeeded' };
  }
  
  // Если модель вернула только текст (отказ или описание)
  if (candidate?.text) {
      console.warn("Gemini Response Text:", candidate.text);
      throw new Error("Gemini вернул текст вместо фото. Возможно, сработал фильтр безопасности.");
  }

  throw new Error("Gemini не вернул корректный результат.");
}


// --- ВСПОМОГАТЕЛЬНАЯ: АВТОРИЗАЦИЯ GOOGLE ---
async function _getGoogleAuth(region) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_ID not set");

  const authOptions = {
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: projectId,
  };

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      authOptions.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      throw new Error("Invalid JSON in GOOGLE_SERVICE_ACCOUNT_KEY");
    }
  }

  const auth = new GoogleAuth(authOptions);
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  return { token: token.token, projectId };
}