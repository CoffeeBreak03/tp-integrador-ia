#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Cargar variables de entorno
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Forzar mock mode
process.env.USE_MOCK_AZURE = 'true';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const ENDPOINT = '/api/process';
const IMAGE_PATH = path.join(__dirname, '../frontend/src/mock/imagen manga.jpeg');

async function testMockMode() {
  try {
    console.log('\n🧪 Test: Mock Mode (Local OCR Response)\n');
    console.log(`📍 API URL: ${API_URL}`);
    console.log(`📍 Endpoint: ${ENDPOINT}`);
    console.log(`📍 Image: ${IMAGE_PATH}`);
    console.log(`📍 Mode: USE_MOCK_AZURE=true\n`);

    // Verificar que la imagen exista
    if (!fs.existsSync(IMAGE_PATH)) {
      throw new Error(`Image not found: ${IMAGE_PATH}`);
    }

    // Leer imagen y convertir a base64
    console.log('📖 Reading image...');
    const imageBuffer = fs.readFileSync(IMAGE_PATH);
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    console.log(`✅ Image loaded: ${imageBuffer.length} bytes\n`);

    // Enviar POST a la API
    console.log('🚀 Sending POST request...');
    const response = await fetch(`${API_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
      timeout: 120000,
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // Validar respuesta
    console.log('📋 Response:');
    console.log(JSON.stringify(data, null, 2));

    // Validar estructura
    if (!Array.isArray(data)) {
      throw new Error('Response is not an array');
    }

    if (data.length === 0) {
      console.warn('\n⚠️  Warning: Response is empty array');
      process.exit(1);
    }

    console.log(`\n✅ Received ${data.length} items\n`);

    // Validar cada item
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      console.log(`🔍 Item ${i + 1}:`);
      console.log(`  ✅ id: ${item.id}`);
      console.log(`  ✅ box: [${item.box.join(', ')}]`);
      console.log(`  ✅ texto_original: "${item.texto_original?.substring(0, 40)}..."`);
      console.log(`  ✅ texto_traducido: "${item.texto_traducido?.substring(0, 40)}..."`);
    }

    console.log('\n✨ Test completed successfully!\n');
    console.log('📝 Note: This test uses mock data.');
    console.log('   For HF Space integration: Make sure the Space is awake and accessible.');
    console.log('   Set HF_SPACE_API_URL in .env and remove USE_MOCK_AZURE=true\n');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    console.error('\nMake sure:');
    console.error('  1. The Express server is running on http://localhost:3001');
    console.error('  2. Mock files exist in mocks/ directory\n');
    process.exit(1);
  }
}

testMockMode();
