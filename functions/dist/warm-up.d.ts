import { Request, Response } from 'express';
/**
 * Endpoint para despertar el HF Space (cold start).
 * Envía una imagen dummy para que el servicio inicie si está dormido.
 * Useful para evitar timeouts en la primera petición real.
 */
export declare const warmUp: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=warm-up.d.ts.map