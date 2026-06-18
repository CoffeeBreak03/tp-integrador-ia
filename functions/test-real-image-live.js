#!/usr/bin/env node
/**
 * Test: Real Image + Live HF Space (No Mock)
 * 
 * Envía la imagen real del frontend directamente al HF Space sin mock
 * para diagnosticar dónde está el timeout.
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logStep(step, msg) {
  console.log(`${colors.cyan}[Step ${step}]${colors.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function logError(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function logWarning(msg) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

async function runTest() {
  try {
    logStep(1, 'Loading image from frontend mock...');
    const imagePath = path.join(__dirname, '../frontend/src/mock/imagen manga.jpeg');
    
    if (!fs.existsSync(imagePath)) {
      logError(`Image not found at ${imagePath}`);
      process.exit(1);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    logSuccess(`Image loaded: ${imageBuffer.length} bytes`);

    logStep(2, 'Converting to base64 (as frontend would)...');
    const imageBase64 = imageBuffer.toString('base64');
    logSuccess(`Base64 encoded: ${imageBase64.length} bytes`);

    logStep(3, 'Testing HF Space endpoint directly...');
    const HF_SPACE_URL = process.env.HF_SPACE_API_URL || 'https://coffeebreak03-manga-translate-ocr.hf.space';
    const endpoint = `${HF_SPACE_URL}/analyze-manga`;
    
    log(`📍 Endpoint: ${endpoint}`, 'cyan');
    log(`📍 Timeout: 120 seconds\n`, 'cyan');

    const startFetch = Date.now();
    log('🚀 Sending request to HF Space...', 'blue');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logWarning('Client-side timeout triggered (120s)');
    }, 120000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageBase64,
        }),
        signal: controller.signal,
        timeout: 120000,
      });

      clearTimeout(timeoutId);
      const fetchTime = Date.now() - startFetch;
      
      log(`📊 Response received in ${fetchTime}ms, status: ${response.status}`, 'cyan');

      if (!response.ok) {
        const errorText = await response.text();
        logError(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        process.exit(1);
      }

      const data = await response.json();
      
      if (!data.globos) {
        logError('Response missing "globos" field');
        log(`Response: ${JSON.stringify(data).substring(0, 200)}`, 'red');
        process.exit(1);
      }

      logSuccess(`HF Space responded with ${data.globos.length} globos in ${fetchTime}ms`);
      
      log('\n📋 Sample globos:');
      data.globos.slice(0, 2).forEach((globo, idx) => {
        log(`  [${idx + 1}] id=${globo.id}, box=${JSON.stringify(globo.box)}, text="${globo.texto_original.substring(0, 30)}..."`);
      });

      logStep(4, 'Testing through Express backend...');
      
      const backendStart = Date.now();
      log('🚀 Sending request to /api/process...', 'blue');

      const backendResponse = await fetch('http://localhost:3001/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: `data:image/jpeg;base64,${imageBase64}`,
        }),
        timeout: 120000,
      });

      const backendTime = Date.now() - backendStart;
      log(`📊 Backend response in ${backendTime}ms, status: ${backendResponse.status}`, 'cyan');

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        logError(`HTTP ${backendResponse.status}: ${errorText.substring(0, 200)}`);
        process.exit(1);
      }

      const backendData = await backendResponse.json();
      
      if (backendData && backendData.translations && backendData.translations.length > 0) {
        logSuccess(`Express backend returned ${backendData.translations.length} translated boxes in ${backendTime}ms`);
        log(`\n🎯 Final result (first 2 items):`);
        backendData.translations.slice(0, 2).forEach((box, idx) => {
          log(`  [${idx + 1}] "${box.texto_original}" → "${box.texto_traducido}"`);
        });
      } else if (Array.isArray(backendData) && backendData.length > 0) {
        logSuccess(`Express backend returned ${backendData.length} translated boxes in ${backendTime}ms`);
        log(`\n🎯 Final result (first 2 items):`);
        backendData.slice(0, 2).forEach((box, idx) => {
          log(`  [${idx + 1}] "${box.texto_original}" → "${box.texto_traducido}"`);
        });
      } else {
        logWarning(`Backend returned empty or invalid response: ${JSON.stringify(backendData).substring(0, 100)}`);
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      if (errorMsg.includes('abort')) {
        logError('Request aborted (client timeout after 30s)');
      } else if (errorMsg.includes('timeout')) {
        logError(`Request timeout: ${errorMsg}`);
      } else {
        logError(`Fetch failed: ${errorMsg}`);
      }
      
      const elapsed = Date.now() - startFetch;
      log(`⏱️  Elapsed time: ${elapsed}ms\n`, 'yellow');
      
      logWarning('DIAGNOSIS:');
      logWarning('- If timeout > 60s: HF Space is sleeping (cold start) - wait and retry');
      logWarning('- If timeout ~120s: Client reached timeout limit - increase in code');
      logWarning('- If timeout < 120s but no response: Network or HF Space error');
      
      process.exit(1);
    }

    logSuccess('\n✨ All tests passed!');

  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

runTest();
