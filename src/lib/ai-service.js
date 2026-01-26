import Replicate from "replicate";
import { GoogleAuth } from 'google-auth-library';

// --- 1. КОНФИГУРАЦИЯ МОДЕЛЕЙ ---
export const AI_MODELS = {
  // ВАРИАНТ 1: Replicate (IDM-VTON)
  'idm-vton': {
    name: "IDM-VTON (Premium)",
    provider: 'replicate',
    id: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    type: "vton-standard",
  },

  // ВАРИАНТ 2: Google Vertex Try-On (VTON)
  'google-vton': {
    name: "Google Try-On (Speed)",
    provider: 'google-vertex',
    // ✅ ИСПРАВЛЕНО: 'exp' часто дает 404, ставим стабильную '001'
    modelId: 'virtual-try-on-001', 
    region: 'us-central1',
    type: "vton-native",
  },

  // ВАРИАНТ 3: Gemini 2.5 (Nano Banana / Flash)
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

// --- 2. ГЛАВНАЯ ФУНКЦИЯ ---
export async function generateTryOn(modelKey, { personImage, garmentImage, category = 'upper_body' }) {
  console.log(`\n🔍 [AI-SERVICE] Запрос на генерацию. Ключ: "${modelKey}"`);

  // 1. Выбор конфигурации (с защитой от опечаток)
  let modelConfig = AI_MODELS[modelKey];
  if (!modelConfig) {
    console.warn(`⚠️ [AI-SERVICE] Модель "${modelKey}" не найдена в конфиге. Используем 'google-vton' по умолчанию.`);
    modelConfig = AI_MODELS['google-vton'];
  }

  console.log(`✅ [AI-SERVICE] Выбрана модель: ${modelConfig.name} (${modelConfig.provider})`);
  console.log(`ℹ️ [AI-SERVICE] Параметры: Категория=${category}, PersonImg=${personImage?.substring(0, 30)}..., GarmentImg=${garmentImage?.substring(0, 30)}...`);

  // 2. Роутер провайдеров
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
    console.error(`❌ [AI-SERVICE] Критическая ошибка в generateTryOn:`, error);
    throw error;
  }
}

// ==========================================
// ВНУТРЕННИЕ ФУНКЦИИ (ДВИЖКИ)
// ==========================================

// --- A. REPLICATE ---
async function _runReplicate(config, inputs) {
  console.log(`🔄 [REPLICATE] Подготовка запуска IDM-VTON...`);
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

    console.log(`✅ [REPLICATE] Успешный запуск! ID: ${output.id}, Статус: ${output.status}`);
    return output;

  } catch (e) {
    console.error(`❌ [REPLICATE] Ошибка API:`, e);
    throw e;
  }
}

// --- B. GOOGLE VTON (Native) ---
async function _runGoogleVtonNative(config, personBase64, garmentBase64) {
  console.log(`🔄 [GOOGLE-VTON] Начинаем работу с Vertex AI (Native)...`);
  
  // 1. Авторизация
  const auth = await _getGoogleAuth(config.region);
  console.log(`🔑 [GOOGLE-VTON] Авторизация пройдена. ProjectID: ${auth.projectId}`);

  // 2. Формирование URL
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:predict`;
  console.log(`🌐 [GOOGLE-VTON] Endpoint: ${endpoint}`);

  // 3. Подготовка данных
  const pImg = personBase64.replace(/^data:image\/.+;base64,/, '');
  const gImg = garmentBase64.replace(/^data:image\/.+;base64,/, '');

  console.time("⏱️ GoogleVtonRequest");
  
  // 4. Запрос
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
  console.log(`📡 [GOOGLE-VTON] Статус ответа: ${response.status} ${response.statusText}`);

  if (!response.ok) {
     const errText = await response.text();
     console.error(`❌ [GOOGLE-VTON] Тело ошибки:`, errText);
     
     if (response.status === 404) {
        throw new Error(`Модель '${config.modelId}' не найдена (404). Проверьте название модели.`);
     }
     if (response.status === 429) {
        throw new Error(`Лимиты Google исчерпаны (429). Проверьте квоты.`);
     }
     throw new Error(`Google API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  
  // 5. Обработка результата
  const resultBytes = data.predictions?.[0]?.bytes;
  
  if (!resultBytes) {
      console.error("❌ [GOOGLE-VTON] Пустой ответ от Google (нет predictions[0].bytes). Ответ:", JSON.stringify(data).substring(0, 200));
      throw new Error("Google VTON вернул пустой результат");
  }

  console.log(`✅ [GOOGLE-VTON] Картинка получена! Размер (base64): ${resultBytes.length} символов.`);
  return { output: `data:image/png;base64,${resultBytes}`, status: 'succeeded' };
}

// --- C. GOOGLE GEMINI (Generative) ---
async function _runGoogleGeminiPrompt(config, personBase64, garmentBase64) {
  console.log(`🔄 [GEMINI] Начинаем работу с Gemini (Flash Image)...`);

  const auth = await _getGoogleAuth(config.region);
  const endpoint = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${auth.projectId}/locations/${config.region}/publishers/google/models/${config.modelId}:generateContent`;
  
  console.log(`🌐 [GEMINI] Endpoint: ${endpoint}`);

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
      generationConfig: { temperature: 0.4 }
    })
  });

  console.timeEnd("⏱️ GeminiRequest");
  console.log(`📡 [GEMINI] Статус ответа: ${response.status}`);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`❌ [GEMINI] Ошибка запроса:`, errText);
    throw new Error(`Gemini Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  
  // Логируем структуру ответа (осторожно, может быть большим)
  // console.log("Gemini Raw Response:", JSON.stringify(data).substring(0, 500));

  const candidate = data.candidates?.[0]?.content?.parts?.[0];

  // Проверка на картинку
  if (candidate?.inlineData?.data) {
     console.log(`✅ [GEMINI] Картинка сгенерирована!`);
     return { output: `data:image/png;base64,${candidate.inlineData.data}`, status: 'succeeded' };
  }
  
  // Проверка на текст (если нейросеть отказалась рисовать)
  if (candidate?.text) {
      console.warn(`⚠️ [GEMINI] Вернулся ТЕКСТ вместо фото: "${candidate.text}"`);
      throw new Error(`Gemini вернул текст: ${candidate.text}`);
  }

  console.error("❌ [GEMINI] Непонятный ответ сервера:", JSON.stringify(data));
  throw new Error("Gemini не вернул корректный результат.");
}

// --- ВСПОМОГАТЕЛЬНАЯ: АВТОРИЗАЦИЯ ---
async function _getGoogleAuth(region) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!projectId) {
      console.error("❌ [AUTH] Нет переменной GOOGLE_CLOUD_PROJECT_ID");
      throw new Error("GOOGLE_CLOUD_PROJECT_ID not set");
  }

  // Опции авторизации
  const authOptions = {
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: projectId,
  };

  // Проверяем, есть ли JSON-ключ в переменных окружения
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      authOptions.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      // console.log("🔑 [AUTH] Используем credentials из переменной окружения (JSON)");
    } catch (e) {
      console.error("❌ [AUTH] Ошибка парсинга JSON ключа:", e);
      throw new Error("Invalid JSON in GOOGLE_SERVICE_ACCOUNT_KEY");
    }
  } else {
    console.log("ℹ️ [AUTH] JSON-ключ не передан, библиотека будет искать локальный файл (если локально)");
  }

  const auth = new GoogleAuth(authOptions);
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  return { token: token.token, projectId };
}