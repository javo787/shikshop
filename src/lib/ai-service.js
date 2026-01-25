import Replicate from "replicate";
import { GoogleAuth } from 'google-auth-library';

// --- КОНФИГУРАЦИЯ МОДЕЛЕЙ ---
export const AI_MODELS = {
  // 1. Стандартная качественная примерка (IDM-VTON)
  'replicate-idm-vton': {
    provider: 'replicate',
    id: "c871bb9b046607e58045a57f15283f1210c9b2d9a78619aec6101b730eb194c2", 
    type: "vton",
    defaultParams: { steps: 40, crop: false }
  },
  
  // 2. 🔥 НОВАЯ: Google Nano Banana (Gemini Flash Image)
  'google-nano-banana': {
    provider: 'replicate',
    // Мы не указываем жесткий ID, а указываем имя модели.
    // Код ниже сам найдет актуальную версию.
    modelStr: "google/nano-banana", 
    type: "editor", 
    defaultParams: { 
        safety_filter_level: "block_only_high", 
        output_format: "png"
    }
  },

  // 3. Google Vertex (через Cloud API)
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

  let finalInput = {};
  let versionId = modelConfig.id;

  // === АДАПТЕР ВХОДНЫХ ДАННЫХ ===
  
  // А) Если это IDM-VTON (Примерка)
  if (modelConfig.type === 'vton') {
      finalInput = { 
          ...modelConfig.defaultParams, 
          ...inputs 
      };
  } 
  
  // Б) Если это Nano Banana (Редактор)
  else if (modelConfig.type === 'editor') {
      const prompt = `Realistic virtual try-on. Replace the clothes of the person in the first image with the garment shown in the second image. Keep the person's pose and identity exactly the same. High quality, photorealistic.`;
      
      finalInput = {
          ...modelConfig.defaultParams,
          prompt: prompt,
          image_input: [inputs.human_img, inputs.garm_img], // Массив картинок!
          aspect_ratio: "match_input_image"
      };

      // 🔥 ИСПРАВЛЕНИЕ:
      // Если у нас нет жесткого ID версии (как у Nano Banana), мы получаем его динамически.
      // Это позволяет использовать .predictions.create и получить ID для фронтенда.
      if (!versionId && modelConfig.modelStr) {
          const model = await replicate.models.get(modelConfig.modelStr);
          versionId = model.latest_version.id;
      }
  }

  // Запуск через predictions.create (всегда возвращает ID!)
  return await replicate.predictions.create({
    version: versionId,
    input: finalInput
  });
}

// --- ФУНКЦИЯ GOOGLE VERTEX ---
export async function runGoogle(personBase64, garmentBase64) {
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
      throw new Error("Ошибка парсинга ключей Google");
    }
  }

  const auth = new GoogleAuth(authOptions);
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

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
    throw new Error(`Google API Error: ${err}`);
  }

  const data = await response.json();
  if (!data.predictions?.[0]?.bytes) throw new Error("Google не вернул изображение");

  return `data:image/png;base64,${data.predictions[0].bytes}`;
}