import { Handler } from '@netlify/functions';
import { getAzureClient } from './lib/azure-client';

interface TranslateRequest {
  text: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as TranslateRequest;
    if (!body.text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing text' }),
      };
    }

    const azureClient = getAzureClient();
    const result = await azureClient.callTranslateModel(body.text);
    return {
      statusCode: 200,
      body: JSON.stringify({ translated: result }),
    };
  } catch (error) {
    console.error('Translate function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
