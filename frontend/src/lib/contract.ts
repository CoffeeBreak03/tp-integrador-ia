// Placeholder para lib/contract.ts
// Implementar según T2.5 en 2_FRONTEND_MOCK_DRIVEN.md

export interface TranslationContract {
  id: number;
  box: [number, number, number, number];
  texto_original: string;
  texto_traducido: string;
}

export const validateContract = (data: unknown): data is TranslationContract[] => {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    typeof item.id === 'number' &&
    Array.isArray(item.box) &&
    item.box.length === 4 &&
    typeof item.texto_original === 'string' &&
    typeof item.texto_traducido === 'string'
  );
};
