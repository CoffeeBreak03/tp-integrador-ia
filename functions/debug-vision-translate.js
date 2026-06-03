const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { AzureClient } = require('./dist/lib/azure-client.js');

(async () => {
  try {
    const imagePath = path.resolve(__dirname, '../frontend/src/mock/imagen manga.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const client = new AzureClient({
      endpoint: process.env.AZURE_FOUNDRY_ENDPOINT,
      apiKey: process.env.AZURE_FOUNDRY_API_KEY,
      modelVision: process.env.AZURE_FOUNDRY_MODEL_VISION,
      modelTranslate: process.env.AZURE_FOUNDRY_MODEL_TRANSLATE,
    });

    const visionRaw = await client.callVisionModel(imageBase64);
    console.log('VISION RAW:\n', visionRaw);

    const translationRaw = await client.callTranslateModel(['何それ寝てる間に生えたってこと...?']);
    console.log('TRANSLATION RAW:\n', translationRaw);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
