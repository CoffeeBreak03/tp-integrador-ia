import { Handler } from '@netlify/functions';
import { getAzureClient } from './lib/azure-client';
import { PipelineOrchestrator } from './orchestrator';
import { validateTranslationContract } from './lib/validate-contract';

interface ProcessRequest {
  imageBase64: string;
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
    const result = await orchestrator.processMangaImage(body.imageBase64);
    const validated = validateTranslationContract(result);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(validated),
    };
  } catch (error) {
    console.error('Process function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
