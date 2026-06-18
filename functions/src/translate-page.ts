import { Request, Response } from 'express';
import { getAzureClient } from './lib/azure-client';
import { PipelineOrchestrator } from './orchestrator';
import { validateTranslationContract } from './lib/validate-contract';

interface TranslatePageRequest {
  imageBase64: string;
  boxes: Array<{
    id: number;
    y_min: number;
    x_min: number;
    y_max: number;
    x_max: number;
  }>;
  contexto?: string;
}

export const translatePage = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as TranslatePageRequest;
    if (!body.imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64' });
      return;
    }
    if (!body.boxes || !Array.isArray(body.boxes)) {
      res.status(400).json({ error: 'Missing or invalid boxes' });
      return;
    }

    const azureClient = getAzureClient();
    const orchestrator = new PipelineOrchestrator(azureClient);
    const result = await orchestrator.translatePageOnly(body.imageBase64, body.boxes, body.contexto);
    const validated = validateTranslationContract(result.translations);

    res.status(200).json({
      contexto: result.contexto,
      translations: validated,
    });
  } catch (error) {
    console.error('Translate-page function error:', error);
    const message = String(error ?? 'Unknown error').toLowerCase();
    const statusCode = message.includes('hugging face') || message.includes('hf_space_api_url') || message.includes('timeout')
      ? 502
      : 500;

    res.status(statusCode).json({ error: String(error) });
  }
};
