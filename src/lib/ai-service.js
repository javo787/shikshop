// lib/ai-service.js
import Replicate from "replicate";
import { GoogleAuth } from 'google-auth-library';

// --- КОНФИГУРАЦИЯ МОДЕЛЕЙ ---
export const AI_MODELS = {
  // 1. IDM-VTON (Лучший выбор для одежды)
  'replicate-idm-vton': {
    provider: 'replicate',
    id: "c871bb9b046607e58045a57f15283f1210c9b2d9a78619aec6101b730eb194c2", 
    type: "vton",
    defaultParams: { steps: 40, crop: false }
  },
  
  // 2. Google Nano Banana (Эксперимент)
  'google-nano-banana': {
    provider: 'replicate',
    modelOwner: "google",
    modelName: "nano-banana",
    type: "editor", 
    defaultParams: { 
        safety_filter_level: "block_only_high", 
        output_format: "png"
    }
  },

  // 3. Google Vertex
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

  // А) IDM-VTON
  if (modelConfig.type === 'vton') {
      finalInput = { ...modelConfig.defaultParams, ...inputs };
  } 
  
  // Б) Nano Banana (Редактор)
  else if (modelConfig.type === 'editor') {
      // 🔥 НОВЫЙ МОЩНЫЙ ПРОМПТ
      // Мы явно указываем: Первое фото = Человек, Второе фото = Одежда
      const prompt = `Virtual Try-On task. The first image is the [Model]. The second image is the [Garment]. Replace the [Model]'s current clothing with the [Garment]. Keep the [Model]'s face, pose, and background 100% unchanged. Blend the [Garment] naturally onto the body. High realism, 2k.`;
      
      finalInput = {
          ...modelConfig.defaultParams,
          prompt: prompt,
          // Важен порядок: [Человек, Одежда]
          image_input: [inputs.human_img, inputs.garm_img], 
          aspect_ratio: "match_input_image"
      };

      // Получаем ID версии динамически
      if (!versionId && modelConfig.modelOwner && modelConfig.modelName) {
          try {
             const model = await replicate.models.get(modelConfig.modelOwner, modelConfig.modelName);
             versionId = model.latest_version.id;
          } catch (e) {
             console.error("Ошибка версии:", e);
             // Фолбэк на хардкод версию, если API глючит (взял из твоих логов)
             versionId = "dcg7t15fpsrmt0cvykrbg9702w"; 
          }
      }
  }

  return await replicate.predictions.create({
    version: versionId,
    input: finalInput
  });
}

// ... (runGoogle оставляем без изменений)
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