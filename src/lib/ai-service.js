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
    // ВАЖНО: Разделили владельца и имя, чтобы API не выдавал 404
    modelOwner: "google",
    modelName: "nano-banana",
    type: "editor",
    defaultParams: {
      // В документации prompt обязателен, его мы добавим в функции
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
    // Nano Banana работает как редактор по промпту
    const prompt = `Realistic virtual try-on. Replace the clothes of the person in the first image with the garment shown in the second image. Keep the person's pose and identity exactly the same. High quality, photorealistic.`;

    finalInput = {
      ...modelConfig.defaultParams,
      prompt: prompt,
      // Nano Banana принимает массив картинок
      image_input: [inputs.human_img, inputs.garm_img],
      // aspect_ratio не обязателен, если не указан - берется как у оригинала
    };

    // 🔥 ИСПРАВЛЕНИЕ: Получаем ID версии правильно
    if (!versionId && modelConfig.modelOwner && modelConfig.modelName) {
      try {
        // Передаем ДВА аргумента: ("google", "nano-banana")
        const model = await replicate.models.get(modelConfig.modelOwner, modelConfig.modelName);
        versionId = model.latest_version.id;
      } catch (e) {
        console.error("Ошибка получения версии модели Replicate:", e);
        throw new Error(`Не удалось найти модель ${modelConfig.modelOwner}/${modelConfig.modelName}`);
      }
    }
  }

  // Запуск через predictions.create (всегда возвращает ID, чтобы фронтенд мог ждать)
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