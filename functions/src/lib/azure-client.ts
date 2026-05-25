import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  modelVision: string;
  modelTranslate: string;
}

export class AzureClient {
  private config: AzureConfig;

  constructor(config: AzureConfig) {
    this.config = config;
  }

  private async readMockFile(filename: string): Promise<any> {
    try {
      // process.cwd() is functions/, so go up one level to workspace root
      const root = process.cwd();
      const workspaceRoot = path.resolve(root, '..');
      const p = path.join(workspaceRoot, 'mocks', filename);
      if (fs.existsSync(p)) {
        const raw = await fs.promises.readFile(p, 'utf8');
        return JSON.parse(raw);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async callVisionModel(imageBase64: string): Promise<string> {
    if (process.env.USE_MOCK_AZURE === 'true') {
      const mock = await this.readMockFile('ocr-response.json');
      if (mock && Array.isArray(mock.boxes)) {
        return JSON.stringify(mock.boxes);
      }
      return JSON.stringify([]);
    }

    const url = `${this.config.endpoint.replace(/\/responses$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.modelVision,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: 'Extract all text from this manga image. For each text box, return JSON array with: {y_min, x_min, y_max, x_max (as 0-1000 pixel coords), text}. Return ONLY valid JSON array.',
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Azure vision API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  async callTranslateModel(texts: string | string[]): Promise<string> {
    if (process.env.USE_MOCK_AZURE === 'true') {
      const mock = await this.readMockFile('translate-response.json');
      if (mock && Array.isArray(mock.translations)) {
        return JSON.stringify(mock.translations.map((t: any) => ({ original: t.original, translated: t.translated })));
      }
      return JSON.stringify([]);
    }

    // Support both single string and array of strings
    const textList = Array.isArray(texts) ? texts : [texts];
    const textContent = textList.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const url = `${this.config.endpoint.replace(/\/responses$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.modelTranslate,
        messages: [
          {
            role: 'user',
            content: `Translate these texts to Spanish maintaining context. Return ONLY a JSON array with [{original: "...", translated: "..."}, ...] format:\n\n${textContent}`,
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Azure translate API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}

export const getAzureClient = (): AzureClient => {
  return new AzureClient({
    endpoint: process.env.AZURE_FOUNDRY_ENDPOINT || '',
    apiKey: process.env.AZURE_FOUNDRY_API_KEY || '',
    modelVision: process.env.AZURE_FOUNDRY_MODEL_VISION || '',
    modelTranslate: process.env.AZURE_FOUNDRY_MODEL_TRANSLATE || '',
  });
};
