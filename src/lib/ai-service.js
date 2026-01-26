import Replicate from "replicate";
import { GoogleAuth } from 'google-auth-library';

// ==============================================================================
// 1. КОНФИГУРАЦИЯ МОДЕЛЕЙ
// Важно: Ключи объекта (слева) должны совпадать с тем, что отправляет Frontend
// ==============================================================================
export const AI_MODELS = {
  // 1. REPLICATE (IDM-VTON)
  // Ключ 'replicate-idm-vton' — так обычно называет фронтенд
  'replicate-idm-vton': {
    name: "IDM-VTON (Premium)",
    provider: 'replicate',
    id: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    type: "vton-standard",
  },
  // Алиас для совместимости (если фронтенд шлет просто 'idm-vton')
  'idm-vton': {
    name: "IDM-VTON (Premium)",
    provider: 'replicate',
    id: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    type: "vton-standard",
  },

  // 2. GOOGLE VERTEX (VTON)
  // Ключ 'google-vertex' или 'google-vton'
  'google-vertex': {
    name: "Google Try-On (Speed)",
    provider: 'google-vertex',
    // ✅ Стабильная версия 001 (exp часто выдает 404)
    modelId: 'virtual-try-on-001', 
    region: 'us-central1',
    type: "vton-native",
  },
  'google-vton': { // Алиас
    name: "Google Try-On (Speed)",
    provider: 'google-vertex',
    modelId: 'virtual-try-on-001', 
    region: 'us-central1',
    type: "vton-native",
  },

  // 3. GEMINI 2.5 (NANO BANANA)
  // Ключ 'google-nano-banana' — именно его шлет ваш сайт (судя по логам)
  'google-nano-banana': {
    name: "Gemini 2.5 (Nano Banana)",
    provider: 'google-vertex',
    // ✅ Официальный ID модели в Google Cloud
    modelId: 'gemini-2.5-flash-image', 
    region: 'us-central1',
    type: "generative-prompt", 
    systemPrompt: `Request: Virtual Try-On.
Input 1: Person. Input 2: Garment.
Task: Generate a photorealistic image of the person from Input 1 wearing the garment from Input 2.
Requirements:
1. Retain the person's identity, pose, and body shape.
2. Fit the garment naturally (folds, lighting, texture).
3. Output ONLY the generated image.`
  },
  // Алиас на случай, если вы поменяете фронтенд
  'gemini-flash': {
    name: "Gemini 2.5 (Nano Banana)",
    provider: 'google-vertex',
    modelId: 'gemini-2.5-flash-image', 
    region: 'us-central1',
    type: "generative-prompt",
    systemPrompt: `Request: Virtual Try-On.
Input 1: Person. Input 2: Garment.
Task: Generate a photorealistic image of the person from Input 1 wearing the garment from Input 2.
Requirements:
1. Retain the person's identity, pose, and body shape.
2. Fit the garment naturally (folds, lighting, texture).
3. Output ONLY the generated image.`
  }
};

// ==============================================================================
// 2. ГЛАВНАЯ ФУНКЦИЯ ЗАПУСКА
// ==============================================================================
export async function generateTryOn(modelKey, { personImage, garmentImage, category = 'upper_body' }) {
  console.log(`\n🔍 [AI-SERVICE] Запрос на генерацию. Ключ от фронтенда: "${modelKey}"`);

  // 1. Поиск конфигурации
  let modelConfig = AI_MODELS[modelKey];
  
  if (!modelConfig) {
    console.warn(`⚠️ [AI-SERVICE] Модель "${modelKey}" не найдена в конфиге.`);
    
    // Пытаемся угадать или берем дефолт
    if (modelKey && modelKey.includes('banana')) modelConfig = AI_MODELS['google-nano-banana'];
    else if (modelKey && modelKey.includes('google')) modelConfig = AI_MODELS['google-vertex'];
    
    // Если совсем ничего не нашли — используем Replicate (самый надежный вариант)
    if (!modelConfig) {
        console.warn(`⚠️ [AI-SERVICE] Переключаемся на запасную модель: replicate-idm-vton`);
        modelConfig = AI_MODELS['replicate-idm-vton'];
    }
  }

  console.log(`✅ [AI-SERVICE] Будет использована конфигурация: ${modelConfig.name} (${modelConfig.provider})`);
  console.log(`ℹ️ [AI-SERVICE] ID Модели: ${modelConfig.modelId || modelConfig.id}`);

  // 2. Роутер провайдеров
  try {
    if (modelConfig.provider === 'replicate') {
      return await _runReplicate(modelConfig, { personImage, garmentImage, category });
    } 
    else if (modelConfig.provider === 'google-vertex') {
      // В Google Vertex два типа моделей: Native VTON и Gemini
      if (modelConfig.type === 'vton-native') {
        return await _runGoogleVtonNative(modelConfig, personImage, garmentImage);
      } else {
        return await _runGoogleGeminiPrompt(modelConfig, personImage, garmentImage);
      }
    }
    
    throw new Error(`Неизвестный провайдер: ${modelConfig.provider}`);

  } catch (error) {
    console.error(`❌ [AI-SERVICE] Ошибка внутри generateTryOn:`, error);
    throw error;
  }
}

// ==============================================================================
// ВНУТРЕННИЕ ФУНКЦИИ (ДВИЖКИ)
// ==============================================================================

// --- ДВИЖОК A: REPLICATE ---
async function _runReplicate(config, inputs) {
  console.log(`🔄 [REPLICATE] Запуск через Replicate API...`);
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  try {
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

    console.log(`✅ [REPLICATE] Задача создана: ${output.id}`);
    return output;

  } catch (e) {
    console.error(`❌ [REPLICATE] API Error:`, e);
    throw e;
  }
}

// --- ДВИЖОК B: GOOGLE VTON (Native) ---
async function _runGoogleVtonNative(config, personBase64, garmentBase64) {
  console.log(`🔄 [GOOGLE-VTON] Запуск через Vertex AI (Predict API)...`);
  
  const auth = await _getGoogleAuth(config.region);
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:predict`;

  // Очистка Base64
  const pImg = personBase64.replace(/^data:image\/.+;base64,/, '');
  const gImg = garmentBase64.replace(/^data:image\/.+;base64,/, '');

  console.time("⏱️ GoogleVtonRequest");

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

  console.timeEnd("⏱️ GoogleVtonRequest");

  if (!response.ok) {
     const errText = await response.text();
     console.error(`❌ [GOOGLE-VTON] Ошибка: ${response.status} - ${errText}`);
     
     if (response.status === 404) {
        throw new Error(`Модель '${config.modelId}' не найдена (404). Проверьте доступность.`);
     }
     if (response.status === 429) {
        throw new Error(`Лимиты Google VTON исчерпаны (429).`);
     }
     throw new Error(`Google API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const resultBytes = data.predictions?.[0]?.bytes;
  
  if (!resultBytes) throw new Error("Google VTON вернул пустой результат");

  console.log(`✅ [GOOGLE-VTON] Успех!`);
  return { output: `data:image/png;base64,${resultBytes}`, status: 'succeeded' };
}

// --- ДВИЖОК C: GOOGLE GEMINI (Generative) ---
async function _runGoogleGeminiPrompt(config, personBase64, garmentBase64) {
  console.log(`🔄 [GEMINI] Запуск через Vertex AI (GenerateContent API)...`);
  console.log(`ℹ️ [GEMINI] Модель: ${config.modelId}`);

  const auth = await _getGoogleAuth(config.region);
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:generateContent`;
  
  const pImg = personBase64.replace(/^data:image\/.+;base64,/, '');
  const gImg = garmentBase64.replace(/^data:image\/.+;base64,/, '');

  console.time("⏱️ GeminiRequest");

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: config.systemPrompt }, 
          { inlineData: { mimeType: "image/jpeg", data: pImg } },
          { inlineData: { mimeType: "image/jpeg", data: gImg } }
        ]
      }],
      generationConfig: { 
          temperature: 0.4,
          maxOutputTokens: 2048 
      }
    })
  });

  console.timeEnd("⏱️ GeminiRequest");

  if (!response.ok) {
    const errText = await response.text();
    console.error(`❌ [GEMINI] Ошибка: ${response.status} - ${errText}`);
    
    if (response.status === 429) throw new Error(`Лимиты Gemini исчерпаны (429).`);
    throw new Error(`Gemini Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0];

  // Проверка на картинку
  if (candidate?.inlineData?.data) {
     console.log(`✅ [GEMINI] Картинка сгенерирована!`);
     return { output: `data:image/png;base64,${candidate.inlineData.data}`, status: 'succeeded' };
  }
  
  // Проверка на текст (отказ)
  if (candidate?.text) {
      console.warn(`⚠️ [GEMINI] Ответ текстом: "${candidate.text}"`);
      throw new Error(`Gemini не смог сгенерировать фото: ${candidate.text}`);
  }

  throw new Error("Gemini вернул пустой или некорректный результат.");
}

// --- ВСПОМОГАТЕЛЬНАЯ: АВТОРИЗАЦИЯ ---
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