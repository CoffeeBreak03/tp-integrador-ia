import { Request, Response } from 'express';
import { getAzureClient } from './lib/azure-client';
import { PipelineOrchestrator } from './orchestrator';
import { validateTranslationContract } from './lib/validate-contract';

interface TranslatePageRequest {
  croppedBubbles: Array<{
    id: number;
    base64: string;
  }>;
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
    if (!body.croppedBubbles || !Array.isArray(body.croppedBubbles)) {
      res.status(400).json({ error: 'Missing or invalid croppedBubbles' });
      return;
    }
    if (!body.boxes || !Array.isArray(body.boxes)) {
      res.status(400).json({ error: 'Missing or invalid boxes' });
      return;
    }

    const azureClient = getAzureClient();
    const orchestrator = new PipelineOrchestrator(azureClient);
    const result = await orchestrator.translatePageOnly(body.croppedBubbles, body.boxes, body.contexto);
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
