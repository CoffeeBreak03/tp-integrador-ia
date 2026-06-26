import { describe, it, expect } from 'vitest';
import { generateViewerHTML, hexToRgba } from '@/lib/exporter';
import type { TranslationContract } from '@/lib/contract';

describe('exporter', () => {
  describe('hexToRgba', () => {
    it('converts hex to rgba string correctly', () => {
      expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
      expect(hexToRgba('#000000', 1)).toBe('rgba(0, 0, 0, 1)');
      // Supports 3-character hex
      expect(hexToRgba('#fff', 0.8)).toBe('rgba(255, 255, 255, 0.8)');
    });
  });

  describe('generateViewerHTML', () => {
    it('generates HTML containing the serialized chapter data and styles', () => {
      const mockTranslations: TranslationContract[] = [
        { id: 1, box: [100, 200, 300, 400], texto_original: 'Hello', texto_traducido: 'Hola' }
      ];
      
      const pagesData = [
        { index: 0, imagePath: 'paginas/pagina_001.jpg', translations: mockTranslations }
      ];
      
      const options = {
        fontFamily: 'sans-serif',
        fontSizeScale: 1.2,
        textColor: '#ffffff',
        bgColor: '#000000',
        bgOpacity: 0.9
      };

      const html = generateViewerHTML(pagesData, options);
      
      // Basic structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="es" class="dark">');
      
      // Styles are applied correctly
      expect(html).toContain('--overlay-bg: rgba(0, 0, 0, 0.9);');
      expect(html).toContain('--overlay-text: #ffffff;');
      expect(html).toContain('--overlay-scale: 1.2;');
      expect(html).toContain('--overlay-font: sans-serif, sans-serif;');
      
      // Data is serialized
      const expectedDataString = JSON.stringify(pagesData).replace(/</g, '\\u003c');
      expect(html).toContain(`const CHAPTER_DATA = ${expectedDataString};`);
      
      // JS Logic exists
      expect(html).toContain('function renderOverlays()');
      expect(html).toContain('function loadPage(index)');
    });
    
    it('handles empty pages safely', () => {
      const html = generateViewerHTML([], {
        fontFamily: 'serif',
        fontSizeScale: 1.0,
        textColor: 'default',
        bgColor: '#123456',
        bgOpacity: 1
      });
      
      expect(html).toContain('const CHAPTER_DATA = [];');
    });
  });
});
