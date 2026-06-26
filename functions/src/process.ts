import { Request, Response } from 'express';
import { getAzureClient } from './lib/azure-client';
import { PipelineOrchestrator } from './orchestrator';
import { validateTranslationContract } from './lib/validate-contract';

interface ProcessRequest {
  imageBase64: string;
  contexto?: string;
  targetLanguage?: string;
}

export const processPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as ProcessRequest;
    if (!body.imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64' });
      return;
    }

    const azureClient = getAzureClient();
    const orchestrator = new PipelineOrchestrator(azureClient);
    const result = await orchestrator.processMangaImage(body.imageBase64, body.contexto, body.targetLanguage);
    const validated = validateTranslationContract(result.translations);

    res.status(200).json({
      contexto: result.contexto,
      translations: validated,
    });
  } catch (error) {
    console.error('Process function error:', error);
    const message = String(error ?? 'Unknown error').toLowerCase();
    const statusCode = message.includes('hugging face') || message.includes('hf_space_api_url') || message.includes('timeout')
      ? 502
      : 500;

    res.status(statusCode).json({ error: String(error) });
  }
};
