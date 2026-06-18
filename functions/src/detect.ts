import { Request, Response } from 'express';
import { getAzureClient } from './lib/azure-client';
import { PipelineOrchestrator } from './orchestrator';

interface DetectRequest {
  imageBase64: string;
}

export const detectPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as DetectRequest;
    if (!body.imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64' });
      return;
    }

    const azureClient = getAzureClient();
    const orchestrator = new PipelineOrchestrator(azureClient);
    const result = await orchestrator.detectTextBubblesOnly(body.imageBase64);

    res.status(200).json(result);
  } catch (error) {
    console.error('Detect function error:', error);
    const message = String(error ?? 'Unknown error').toLowerCase();
    const statusCode = message.includes('hugging face') || message.includes('hf_space_api_url') || message.includes('timeout')
      ? 502
      : 500;

    res.status(statusCode).json({ error: String(error) });
  }
};
