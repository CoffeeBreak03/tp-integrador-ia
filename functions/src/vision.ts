import { Request, Response } from 'express';
import { getAzureClient } from './lib/azure-client';

interface VisionRequest {
  imageBase64: string;
}

export const detectVision = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as VisionRequest;
    if (!body.imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64' });
      return;
    }

    const azureClient = getAzureClient();
    const result = await azureClient.detectTextBubbles(body.imageBase64);
    res.status(200).json({ vision_output: result });
  } catch (error) {
    console.error('Vision function error:', error);
    res.status(500).json({ error: String(error) });
  }
};
