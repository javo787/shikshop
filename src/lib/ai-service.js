import Replicate from "replicate";
import { GoogleAuth } from 'google-auth-library';

// --- КОНСТАНТЫ И НАСТРОЙКИ ---

// Словарь дефолтных описаний (Помогает IDM-VTON понять форму одежды)
const DEFAULT_DESCRIPTIONS = {
    'dresses': "A high-quality dress, full body garment, realistic fabric texture, intricate details",
    'upper_body': "A high-quality upper body top, shirt, realistic fabric texture",
    'lower_body': "High-quality pants or skirt, lower body garment, realistic texture"
};

// --- КОНФИГУРАЦИЯ МОДЕЛЕЙ ---
export const AI_MODELS = {
  // 1. IDM-VTON (Золотой стандарт для одежды)
  'replicate-idm-vton': {
    provider: 'replicate',
    id: "c871bb9b046607e58045a57f15283f1210c9b2d9a78619aec6101b730eb194c2", 
    type: "vton",
    defaultParams: { 
        steps: 50, // 🔥 Максимальное качество (было 40)
        crop: false, // Мы кропаем на фронте, тут отключаем авто-кроп
        seed: 42 // Фиксированный сид для стабильности (или убери для рандома)
    }
  },
  
  // 2. Google Nano Banana (Экспериментальный редактор)
  'google-nano-banana': {
    provider: 'replicate',
    modelOwner: "google",
    modelName: "nano-banana",
    type: "editor", 
    // Запасной ID на случай сбоя API получения версий
    fallbackId: "dcg7t15fpsrmt0cvykrbg9702w",
    defaultParams: { 
        safety_filter_level: "block_only_high", 
        output_format: "png"
    }
  },

  // 3. Google Vertex (Быстрый, Cloud API)
  'google-vertex': {
    provider: 'google',
    region: 'us-central1'
  }
};

// --- ФУНКЦИЯ REPLICATE ---
export async function runReplicate(modelKey, inputs) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const modelConfig = AI_MODELS[modelKey];

  if (!modelConfig) throw new Error(`Модель ${modelKey} не найдена`);

  console.time(`⏱️ Replicate (${modelKey})`); // Засекаем время
  
  let finalInput = {};
  let versionId = modelConfig.id;

  try {
      // === ЛОГИКА ДЛЯ IDM-VTON (ПРИМЕРКА) ===
      if (modelConfig.type === 'vton') {
          const category = inputs.category || 'upper_body';
          
          // 1. Умное описание (если не задано вручную)
          const description = inputs.garment_des || DEFAULT_DESCRIPTIONS[category] || "High quality clothing";

          // 2. Force DC (Dress Code) - Обязательно для платьев!
          // Включаем строго если категория 'dresses'
          const useForceDC = category === 'dresses';

          finalInput = { 
              ...modelConfig.defaultParams, 
              ...inputs, 
              garment_des: description,
              force_dc: useForceDC,
              category: category 
          };
      } 
      
      // === ЛОГИКА ДЛЯ NANO BANANA (РЕДАКТОР) ===
      else if (modelConfig.type === 'editor') {
          // 1. Агрессивный промпт (чтобы менял одежду даже на сложном фоне)
          const prompt = `Advanced image editing. IGNORE the current clothes on the person in the first image. REPLACE them completely with the garment shown in the second image. COMPOSITE the new garment naturally onto the person's body. PRESERVE the person's face, identity, pose, and the background environment 100% exactly. High realism, 4k quality.`;
          
          finalInput = {
              ...modelConfig.defaultParams,
              prompt: prompt,
              image_input: [inputs.human_img, inputs.garm_img], 
              aspect_ratio: "match_input_image"
          };

          // 2. Получение ID версии (с кэшированием/фолбэком)
          if (!versionId && modelConfig.modelOwner && modelConfig.modelName) {
              try {
                 const model = await replicate.models.get(modelConfig.modelOwner, modelConfig.modelName);
                 versionId = model.latest_version.id;
              } catch (e) {
                 console.warn("⚠️ Не удалось получить версию Nano Banana, используем запасную.", e.message);
                 versionId = modelConfig.fallbackId;
              }
          }
      }

      // === ЗАПУСК ===
      const prediction = await replicate.predictions.create({
        version: versionId,
        input: finalInput
      });
      
      console.timeEnd(`⏱️ Replicate (${modelKey})`);
      return prediction;

  } catch (error) {
      console.timeEnd(`⏱️ Replicate (${modelKey})`);
      console.error(`❌ Ошибка Replicate (${modelKey}):`, error);
      throw error; // Пробрасываем ошибку выше
  }
}

// --- ФУНКЦИЯ GOOGLE VERTEX ---
export async function runGoogle(personBase64, garmentBase64) {
  console.time("⏱️ Google Vertex");

  try {
      const REGION = AI_MODELS['google-vertex'].region;
      const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const API_ENDPOINT = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/virtual-try-on-001:predict`;

      const authOptions = {
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        projectId: PROJECT_ID,
      };

      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
          authOptions.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
          throw new Error("Ошибка парсинга JSON ключей Google: " + e.message);
        }
      }

      const auth = new GoogleAuth(authOptions);
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      // Очистка Base64 от префиксов (на всякий случай)
      const cleanPerson = personBase64.replace(/^data:image\/\w+;base64,/, "");
      const cleanGarment = garmentBase64.replace(/^data:image\/\w+;base64,/, "");

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [{ person_image: { bytes: cleanPerson }, product_image: { bytes: cleanGarment } }],
          parameters: { seed: Math.floor(Math.random() * 1000000) }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Google API Error: ${response.status} ${err}`);
      }

      const data = await response.json();
      
      if (!data.predictions?.[0]?.bytes) {
          throw new Error("Google API вернул пустой результат (возможен Safety Filter)");
      }

      console.timeEnd("⏱️ Google Vertex");
      return `data:image/png;base64,${data.predictions[0].bytes}`;

  } catch (error) {
      console.timeEnd("⏱️ Google Vertex");
      console.error("❌ Ошибка Google Vertex:", error);
      throw error;
  }
}