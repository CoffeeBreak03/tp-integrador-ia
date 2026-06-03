import { Handler } from '@netlify/functions';
import { getAzureClient } from './lib/azure-client';

interface VisionRequest {
  imageBase64: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as VisionRequest;
    if (!body.imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing imageBase64' }),
      };
    }

    const azureClient = getAzureClient();
    const result = await azureClient.detectTextBubbles(body.imageBase64);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ vision_output: result }),
    };
  } catch (error) {
    console.error('Vision function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
