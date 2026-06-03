#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Cargar variables de entorno
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.NETLIFY_DEV_URL || 'http://localhost:8888';
const ENDPOINT = '/.netlify/functions/process';
const IMAGE_PATH = path.join(__dirname, '../frontend/src/mock/imagen manga.jpeg');

async function testHFIntegration() {
  try {
    console.log('\n🧪 Test: Hugging Face Space Integration\n');
    console.log(`📍 API URL: ${API_URL}`);
    console.log(`📍 Endpoint: ${ENDPOINT}`);
    console.log(`📍 Image: ${IMAGE_PATH}`);
    console.log(`📍 HF_SPACE_API_URL: ${process.env.HF_SPACE_API_URL || 'using default'}\n`);

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
    } else {
      console.log(`\n✅ Received ${data.length} items\n`);

      // Validar primer item
      const first = data[0];
      console.log('🔍 Validating first item:');
      console.log(`  - id: ${first.id} (${typeof first.id === 'number' ? '✅' : '❌'})`);
      console.log(`  - box: [${first.box}] (${Array.isArray(first.box) && first.box.length === 4 ? '✅' : '❌'})`);
      console.log(`  - texto_original: "${first.texto_original?.substring(0, 30)}..." (${typeof first.texto_original === 'string' ? '✅' : '❌'})`);
      console.log(`  - texto_traducido: "${first.texto_traducido?.substring(0, 30)}..." (${typeof first.texto_traducido === 'string' ? '✅' : '❌'})`);
    }

    console.log('\n✨ Test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    console.error('\nMake sure:');
    console.error('  1. netlify dev is running on http://localhost:8888');
    console.error('  2. HF_SPACE_API_URL is set in .env');
    console.error('  3. The Hugging Face Space is accessible\n');
    process.exit(1);
  }
}

testHFIntegration();
