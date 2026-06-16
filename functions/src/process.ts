import { Handler } from '@netlify/functions';
import { getAzureClient } from './lib/azure-client';
import { PipelineOrchestrator } from './orchestrator';
import { validateTranslationContract } from './lib/validate-contract';

interface ProcessRequest {
  imageBase64: string;
  contexto?: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as ProcessRequest;
    if (!body.imageBase64) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Missing imageBase64' }),
      };
    }

    const azureClient = getAzureClient();
    const orchestrator = new PipelineOrchestrator(azureClient);
    const result = await orchestrator.processMangaImage(body.imageBase64, body.contexto);
    const validated = validateTranslationContract(result.translations);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        contexto: result.contexto,
        translations: validated,
      }),
    };
  } catch (error) {
    console.error('Process function error:', error);
    const message = String(error ?? 'Unknown error').toLowerCase();
    const statusCode = message.includes('hugging face') || message.includes('hf_space_api_url') || message.includes('timeout')
      ? 502
      : 500;

    return {
      statusCode,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
