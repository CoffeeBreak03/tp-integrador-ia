import { Request, Response } from 'express';
import { getAzureClient } from './lib/azure-client';

interface TranslateRequest {
  text: string;
  targetLanguage?: string;
}

export const translateText = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as TranslateRequest;
    if (!body.text) {
      res.status(400).json({ error: 'Missing text' });
      return;
    }

    const azureClient = getAzureClient();
    const result = await azureClient.callTranslateModel(body.text, body.targetLanguage);
    res.status(200).json({ translated: result });
  } catch (error) {
    console.error('Translate function error:', error);
    res.status(500).json({ error: String(error) });
  }
};
