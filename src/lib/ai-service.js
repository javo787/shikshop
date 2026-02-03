import Replicate from "replicate";
import { GoogleAuth } from 'google-auth-library';

// ==============================================================================
// 1. КОНФИГУРАЦИЯ МОДЕЛЕЙ
// ==============================================================================
export const AI_MODELS = {
  // 1. REPLICATE (IDM-VTON)
  'replicate-idm-vton': {
    name: "IDM-VTON (Premium)",
    provider: 'replicate',
    id: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    type: "vton-standard",
  },
  'idm-vton': { // Алиас
    name: "IDM-VTON (Premium)",
    provider: 'replicate',
    id: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    type: "vton-standard",
  },

  // 2. GOOGLE VERTEX (VTON NATIVE)
  'google-vertex': {
    name: "Google Try-On (Speed)",
    provider: 'google-vertex',
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

  // 3. GEMINI 2.5 (NANO BANANA) - SUPER CHARGED CONFIG
  'google-nano-banana': {
    name: "Gemini 2.5 (Nano Banana)",
    provider: 'google-vertex',
    modelId: 'gemini-2.5-flash-image', 
    region: 'us-central1',
    type: "generative-prompt", 
    // 🔥 МОЩНЫЙ ПРОМПТ ДЛЯ РЕДАКТИРОВАНИЯ
    systemPrompt: `
      Role: Professional Virtual Try-On AI Specialist.
      Task: Edit the input image (Image 1) to make the person wear the garment from Image 2.

      [INPUTS]
      - Image 1: Target Person (Keep their face, pose, body shape, and background EXACTLY as is).
      - Image 2: Garment Reference (Use the texture, fabric, logos, and shape from this image).

      [STRICT GUIDELINES]
      1. IDENTITY PRESERVATION: Do NOT change the person's face, hair, or skin tone.
      2. REALISM: The garment must fold naturally around the body. Match lighting and shadows of Image 1.
      3. FIT: Ensure the garment fits the body shape defined in Image 1.
      4. OUTPUT: Return ONLY the final photorealistic image. No explanations.
    `
  },
  'gemini-flash': { // Алиас с тем же промптом
    name: "Gemini 2.5 (Nano Banana)",
    provider: 'google-vertex',
    modelId: 'gemini-2.5-flash-image', 
    region: 'us-central1',
    type: "generative-prompt",
    systemPrompt: `
      Role: Professional Virtual Try-On AI Specialist.
      Task: Edit the input image (Image 1) to make the person wear the garment from Image 2.
      
      [STRICT GUIDELINES]
      1. IDENTITY PRESERVATION: Do NOT change the person's face, hair, or skin tone.
      2. REALISM: The garment must fold naturally around the body. Match lighting and shadows.
      3. OUTPUT: Return ONLY the final photorealistic image.
    `
  }
};

// ==============================================================================
// 2. ГЛАВНАЯ ФУНКЦИЯ ЗАПУСКА
// ==============================================================================
export async function generateTryOn(modelKey, { personImage, garmentImage, category = 'upper_body' }) {
  console.log(`\n🔍 [AI-SERVICE] Запрос. Ключ: "${modelKey}"`);

  let modelConfig = AI_MODELS[modelKey];
  
  // Логика поиска модели (fallback)
  if (!modelConfig) {
    console.warn(`⚠️ [AI-SERVICE] Модель "${modelKey}" не найдена.`);
    if (modelKey && modelKey.includes('banana')) modelConfig = AI_MODELS['google-nano-banana'];
    else if (modelKey && modelKey.includes('google')) modelConfig = AI_MODELS['google-vertex'];
    
    // Если совсем ничего не нашли — Replicate
    if (!modelConfig) {
        console.warn(`⚠️ [AI-SERVICE] Переключаемся на запасную: replicate-idm-vton`);
        modelConfig = AI_MODELS['replicate-idm-vton'];
    }
  }

  console.log(`✅ [AI-SERVICE] Выбрана: ${modelConfig.name} [${modelConfig.provider}]`);

  try {
    if (modelConfig.provider === 'replicate') {
      return await _runReplicate(modelConfig, { personImage, garmentImage, category });
    } 
    else if (modelConfig.provider === 'google-vertex') {
      if (modelConfig.type === 'vton-native') {
        return await _runGoogleVtonNative(modelConfig, personImage, garmentImage);
      } else {
        return await _runGoogleGeminiPrompt(modelConfig, personImage, garmentImage);
      }
    }
    throw new Error(`Неизвестный провайдер: ${modelConfig.provider}`);
  } catch (error) {
    console.error(`❌ [AI-SERVICE] Ошибка генерации:`, error);
    throw error;
  }
}

// ==============================================================================
// ВНУТРЕННИЕ ФУНКЦИИ (ДВИЖКИ)
// ==============================================================================

// --- ХЕЛПЕР: ПРЕВРАЩАЕМ ЛЮБУЮ ССЫЛКУ В BASE64 ---
async function _ensureBase64(input) {
  if (!input) return null;
  
  // 1. Если это ссылка (http/https) — скачиваем
  if (input.startsWith('http') || input.startsWith('https')) {
      console.log(`⬇️ [AI-SERVICE] Скачивание картинки: ${input.substring(0, 30)}...`);
      try {
        const response = await fetch(input);
        if (!response.ok) throw new Error(`Не удалось скачать картинку: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
      } catch (e) {
        console.error("Ошибка скачивания:", e);
        throw new Error("Ошибка при загрузке изображения по ссылке");
      }
  }
  
  // 2. Если это уже base64 (data:image...) — просто чистим префикс
  return input.replace(/^data:image\/\w+;base64,/, '');
}


// --- ДВИЖОК A: REPLICATE ---
async function _runReplicate(config, inputs) {
  console.log(`🔄 [REPLICATE] Запуск...`);
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
        garm_img: inputs.garmentImage, // Replicate сам скачает ссылку
        human_img: inputs.personImage,
        garment_des: "high quality realistic clothing"
      }
    });
    return output;
  } catch (e) {
    console.error(`❌ [REPLICATE] Error:`, e);
    throw e;
  }
}

// --- ДВИЖОК B: GOOGLE VTON (Native) ---
async function _runGoogleVtonNative(config, personInput, garmentInput) {
  console.log(`🔄 [GOOGLE-VTON] Подготовка...`);
  
  const pImg = await _ensureBase64(personInput);
  const gImg = await _ensureBase64(garmentInput);

  const auth = await _getGoogleAuth(config.region);
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:predict`;

  console.time("⏱️ GoogleVton");
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    },
    // 🔥 ИСПРАВЛЕННАЯ СТРУКТУРА ДЛЯ virtual-try-on-001
    body: JSON.stringify({
      instances: [{ 
          personImage: { 
            image: { bytesBase64Encoded: pImg } 
          }, 
          productImages: [{ 
            image: { bytesBase64Encoded: gImg } 
          }] 
      }],
      parameters: { 
          sampleCount: 1
          // seed: удален, так как включен watermark (вызывал ошибку 400)
      }
    })
  });
  console.timeEnd("⏱️ GoogleVton");

  if (!response.ok) {
     const errText = await response.text();
     if (response.status === 404) throw new Error(`Модель не найдена (404).`);
     if (response.status === 429) throw new Error(`Лимиты Google VTON исчерпаны (429).`);
     throw new Error(`Google API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  
  // Получаем байты из нового поля
  const resultBytes = data.predictions?.[0]?.bytesBase64Encoded;
  
  if (!resultBytes) {
      console.error("❌ Google VTON Response:", JSON.stringify(data, null, 2));
      throw new Error("Google VTON вернул пустой результат");
  }

  return { output: `data:image/png;base64,${resultBytes}`, status: 'succeeded' };
}

// --- ДВИЖОК C: GOOGLE GEMINI (MAXIMUM POWER) ---
async function _runGoogleGeminiPrompt(config, personInput, garmentInput) {
  console.log(`🔄 [GEMINI] Подготовка (Flash Image 2.5)...`);

  const pImg = await _ensureBase64(personInput);
  const gImg = await _ensureBase64(garmentInput);

  const auth = await _getGoogleAuth(config.region);
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:generateContent`;
  
  // 🔥 НАСТРОЙКИ БЕЗОПАСНОСТИ (Чтобы не блокировало манекены)
  const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ];

  console.time("⏱️ Gemini");
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
      // 🔥 ТОНКИЕ НАСТРОЙКИ ГЕНЕРАЦИИ
      generationConfig: { 
          temperature: 0.2, // Меньше фантазии, больше точности
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          candidateCount: 1 
      },
      safetySettings: safetySettings
    })
  });
  console.timeEnd("⏱️ Gemini");

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) throw new Error(`Лимиты Gemini исчерпаны (429).`);
    // Обработка Safety Filter на уровне HTTP
    if (response.status === 400 && errText.includes("safety")) throw new Error("Google Safety Filter заблокировал запрос.");
    throw new Error(`Gemini Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  
  // Проверка на блокировку промпта
  if (data.promptFeedback?.blockReason) {
      throw new Error(`Запрос заблокирован (Safety): ${data.promptFeedback.blockReason}`);
  }

  const candidate = data.candidates?.[0];

  // Проверка на блокировку ответа
  if (candidate?.finishReason === "SAFETY") {
      throw new Error("Генерация остановлена фильтром безопасности.");
  }

  // Успешная картинка
  if (candidate?.content?.parts?.[0]?.inlineData?.data) {
     return { output: `data:image/png;base64,${candidate.content.parts[0].inlineData.data}`, status: 'succeeded' };
  }
  
  // Ответ текстом (ошибка модели)
  if (candidate?.content?.parts?.[0]?.text) {
      throw new Error(`Gemini ответил текстом вместо фото: "${candidate.content.parts[0].text.substring(0, 50)}..."`);
  }

  throw new Error("Gemini вернул пустой результат.");
}

// --- АВТОРИЗАЦИЯ ---
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