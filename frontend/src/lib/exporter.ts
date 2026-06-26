import JSZip from 'jszip';
import type { TranslationContract } from '@/lib/contract';
import type { CachedPage } from '@/composables/useChapterProcessor';

export interface ExportOptions {
  fontFamily: string;
  fontSizeScale: number;
  textColor: string;
  bgColor: string;
  bgOpacity: number;
  lang?: 'es' | 'en';
}

export async function exportChapterToZip(
  pages: string[],
  pageCache: Map<number, CachedPage>,
  options: ExportOptions,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const totalPages = pages.length;

  const exportData = {
    totalPages,
    pages: [] as Array<{
      index: number;
      imagePath: string;
      translations: TranslationContract[];
    }>,
  };

  const isEn = options.lang === 'en';
  const folderName = isEn ? 'pages' : 'paginas';
  const filePrefix = isEn ? 'page' : 'pagina';

  const pagesFolder = zip.folder(folderName);
  if (!pagesFolder) throw new Error(`Could not create ${folderName} folder`);

  for (let i = 0; i < totalPages; i++) {
    const pageDataUrl = pages[i];
    const cachedPage = pageCache.get(i);
    
    // Only apply translations if they were successfully processed
    let pageTranslations: TranslationContract[] = [];
    if (cachedPage && cachedPage.translationStatus === 'success' && !cachedPage.hasError && cachedPage.translations.length > 0) {
      pageTranslations = cachedPage.translations;
    }
    
    // Use original image directly for ZIP. No canvas modification
    const blob = await dataUrlToBlob(pageDataUrl);
    
    const paddedIndex = String(i + 1).padStart(3, '0');
    const imageFilename = `${filePrefix}_${paddedIndex}.jpg`;
    
    pagesFolder.file(imageFilename, blob);
    
    exportData.pages.push({
      index: i,
      imagePath: `${folderName}/${imageFilename}`,
      translations: pageTranslations
    });

    if (onProgress) {
      onProgress(i + 1, totalPages);
    }
  }

  // Generate the HTML viewer string
  const htmlContent = generateViewerHTML(exportData.pages, options);
  zip.file('index.html', htmlContent);

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function hexToRgba(hex: string, opacity: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateViewerHTML(
  pagesData: Array<{ index: number; imagePath: string; translations: TranslationContract[] }>,
  options: ExportOptions
): string {
  const bgColorRgba = hexToRgba(options.bgColor, options.bgOpacity);
  
  const serializedData = JSON.stringify(pagesData).replace(/</g, '\\u003c');

  const offlineTranslations = {
    es: {
      title: 'Visor de Manga Traducido',
      prev: 'Anterior',
      next: 'Siguiente',
      page: 'Pág.',
      zoomOut: 'Alejar',
      zoomFit: 'Ajustar',
      zoomIn: 'Acercar',
      overlays: '👁 Overlays',
      altText: 'Página del manga'
    },
    en: {
      title: 'Translated Manga Viewer',
      prev: 'Previous',
      next: 'Next',
      page: 'Pg.',
      zoomOut: 'Zoom Out',
      zoomFit: 'Fit',
      zoomIn: 'Zoom In',
      overlays: '👁 Overlays',
      altText: 'Manga page'
    }
  };
  const lang = options.lang === 'en' ? 'en' : 'es';
  const t = offlineTranslations[lang];

  return `<!DOCTYPE html>
<html lang="${lang}" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    :root {
      --bg-color: #020617;
      --text-color: #f1f5f9;
      --ui-bg: rgba(15, 23, 42, 0.8);
      --overlay-bg: ${bgColorRgba};
      --overlay-text: ${options.textColor};
      --overlay-font: ${options.fontFamily}, sans-serif;
      --overlay-scale: ${options.fontSizeScale};
    }
    
    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: system-ui, -apple-system, sans-serif;
    }

    #top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--ui-bg);
      backdrop-filter: blur(8px);
      padding: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      z-index: 200;
      transition: transform 0.3s ease;
    }

    #top-bar.hidden {
      transform: translateY(-100%);
    }

    .btn {
      background: rgba(30, 41, 59, 0.8);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn:hover:not(:disabled) {
      background: rgba(51, 65, 85, 1);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    #main-container {
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 4rem 1rem 1rem 1rem;
      overflow-x: auto;
    }

    .page-wrapper {
      position: relative;
      flex-shrink: 0;
      /* Default: fills viewport width (minus padding) */
      width: min(100%, 900px);
    }

    #manga-image {
      display: block;
      /* Always fill wrapper width - height scales proportionally */
      /* This guarantees .overlay-container (inset:0) matches the image exactly */
      width: 100%;
      height: auto;
    }

    .overlay-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
      container-type: inline-size;
    }

    .translation-box {
      position: absolute;
      background-color: var(--overlay-bg);
      color: var(--overlay-text);
      font-family: var(--overlay-font);
      font-weight: 600;
      border-radius: 0.5rem;
      border: 2px solid transparent;
      padding: 0.25rem;
      box-sizing: border-box;
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.2s ease;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 1.2;
      z-index: 10;
      overflow-wrap: break-word;
      -webkit-hyphens: auto;
      hyphens: auto;
    }

    .translation-box:hover, .translation-box.active {
      z-index: 100;
      border-color: #60a5fa;
      box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.4);
      background-color: var(--overlay-bg);
      
      height: max-content !important;
      min-height: var(--orig-h);
      width: fit-content !important;
      min-width: var(--orig-w);
      max-width: calc(var(--orig-w) + 15vw);
      overflow: visible !important;
    }
  </style>
</head>
<body>
  <div id="top-bar">
    <button id="btn-prev" class="btn">${t.prev}</button>
    <span id="page-indicator" style="font-weight: 600; min-width: 120px; text-align: center;">${t.page} - / -</span>
    <button id="btn-next" class="btn">${t.next}</button>
    <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.2); margin: 0 0.5rem;"></div>
    <button id="btn-zoom-out" class="btn" title="${t.zoomOut}">🔍-</button>
    <button id="btn-zoom-reset" class="btn" title="${t.zoomFit}">[ ]</button>
    <button id="btn-zoom-in" class="btn" title="${t.zoomIn}">🔍+</button>
    <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.2); margin: 0 0.5rem;"></div>
    <button id="btn-toggle" class="btn">${t.overlays}</button>
  </div>

  <div id="main-container">
    <div class="page-wrapper">
      <img id="manga-image" alt="${t.altText}">
      <div id="overlays" class="overlay-container"></div>
    </div>
  </div>

  <script>
    const CHAPTER_DATA = ${serializedData};
    const OVERLAY_SCALE = ${options.fontSizeScale};
    let currentPageIndex = 0;
    let showOverlays = true;
    let isMobile = window.innerWidth < 768;

    const imgEl = document.getElementById('manga-image');
    const overlaysContainer = document.getElementById('overlays');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnToggle = document.getElementById('btn-toggle');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const pageIndicator = document.getElementById('page-indicator');
    const topBar = document.getElementById('top-bar');
    const pageWrapper = document.querySelector('.page-wrapper');
    
    let zoomState = 'fit';
    let currentWidthPx = 0;

    window.addEventListener('resize', () => {
      isMobile = window.innerWidth < 768;
      renderOverlays(); // Recalculate font sizes
    });

    function updateNav() {
      btnPrev.disabled = currentPageIndex === 0;
      btnNext.disabled = currentPageIndex === CHAPTER_DATA.length - 1;
      pageIndicator.textContent = '${t.page} ' + (currentPageIndex + 1) + ' / ' + CHAPTER_DATA.length;
    }

    function loadPage(index) {
      if (index < 0 || index >= CHAPTER_DATA.length) return;
      currentPageIndex = index;
      const pageData = CHAPTER_DATA[currentPageIndex];
      
      // Load image
      imgEl.src = pageData.imagePath;
      
      updateNav();
    }

    imgEl.onload = () => {
      renderOverlays();
    };

    function renderOverlays() {
      overlaysContainer.innerHTML = '';
      if (!showOverlays) return;
      
      const pageData = CHAPTER_DATA[currentPageIndex];
      const translations = pageData.translations || [];
      
      let imageAspectRatio = 16 / 9;
      if (imgEl.naturalWidth && imgEl.naturalHeight) {
        imageAspectRatio = imgEl.naturalWidth / imgEl.naturalHeight;
      }

      translations.forEach(t => {
        if (!t.box) return;
        const box = t.box; // [ymin, xmin, ymax, xmax] ranges 0-1000
        
        const ymin = box[0];
        const xmin = box[1];
        const ymax = box[2];
        const xmax = box[3];

        const top = (ymin / 10).toFixed(2) + '%';
        const left = (xmin / 10).toFixed(2) + '%';
        const width = ((xmax - xmin) / 10).toFixed(2) + '%';
        const height = ((ymax - ymin) / 10).toFixed(2) + '%';

        // Calculate font size using cqw
        const w = (xmax - xmin) / 10;
        const h = (ymax - ymin) / 10;
        const h_in_w = h / imageAspectRatio;
        const area = w * h_in_w;
        const charCount = (t.texto_traducido || '').length || 1;
        
        const multiplier = isMobile ? 1.3 : 0.85;
        let fontSizeCqw = Math.sqrt(area / (charCount * 0.55)) * multiplier;
        
        const minFont = isMobile ? 1.1 : 0.6;
        const maxFont = isMobile ? 2.5 : 1.4;
        fontSizeCqw = Math.max(minFont, Math.min(maxFont, fontSizeCqw));
        
        const finalFontSize = (fontSizeCqw * OVERLAY_SCALE).toFixed(2) + 'cqw';

        const div = document.createElement('div');
        div.className = 'translation-box';
        div.style.top = top;
        div.style.left = left;
        div.style.width = width;
        div.style.height = height;
        div.style.fontSize = finalFontSize;
        
        const textP = document.createElement('p');
        textP.style.margin = '0';
        
        // Insertamos guiones suaves (\u00AD) heurísticamente para forzar el guión ortográfico al separar
        const hyphenatedText = (t.texto_traducido || '').replace(
          /([aeiouáéíóú][nrsld]?)([bcdfghjklmnñpqrstvwxyz][aeiouáéíóú])/gi, 
          '$1\u00AD$2'
        );
        
        textP.textContent = hyphenatedText;
        div.appendChild(textP);

        // Click to toggle active state on mobile
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasActive = div.classList.contains('active');
          document.querySelectorAll('.translation-box.active').forEach(el => el.classList.remove('active'));
          if (!wasActive) div.classList.add('active');
        });

        // Guardar dimensiones originales en variables CSS para la expansión al hacer hover
        div.style.setProperty('--orig-w', width);
        div.style.setProperty('--orig-h', height);

        // Ya no iteramos el tamaño de fuente; se respeta estrictamente la escala configurada
        div.style.fontSize = (fontSizeCqw * OVERLAY_SCALE).toFixed(2) + 'cqw';

        overlaysContainer.appendChild(div);
      });
    }

    btnPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      loadPage(currentPageIndex - 1);
    });
    btnNext.addEventListener('click', (e) => {
      e.stopPropagation();
      loadPage(currentPageIndex + 1);
    });
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      showOverlays = !showOverlays;
      renderOverlays();
    });

    function applyZoom() {
      pageWrapper.style.width = zoomState + 'px';
    }

    function snapToNaturalZoom() {
      // On first zoom interaction, capture the image's CURRENT rendered width.
      // Since the image fills the wrapper 100%, clientWidth === rendered image width.
      if (zoomState === 'fit') {
        zoomState = imgEl.clientWidth;
      }
    }

    btnZoomIn.addEventListener('click', (e) => {
      e.stopPropagation();
      snapToNaturalZoom();
      zoomState = Math.min(zoomState * 1.25, 3000);
      applyZoom();
    });

    btnZoomOut.addEventListener('click', (e) => {
      e.stopPropagation();
      snapToNaturalZoom();
      zoomState = Math.max(zoomState / 1.25, 300);
      applyZoom();
    });

    btnZoomReset.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomState = 'fit';
      // Restore the CSS default
      pageWrapper.style.width = 'min(100%, 900px)';
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') loadPage(currentPageIndex - 1);
      else if (e.key === 'ArrowRight') loadPage(currentPageIndex + 1);
    });

    // Auto-hide top bar on background click
    document.body.addEventListener('click', () => {
      topBar.classList.toggle('hidden');
      document.querySelectorAll('.translation-box.active').forEach(el => el.classList.remove('active'));
    });
    
    // Prevent top bar click from propagating to body
    topBar.addEventListener('click', (e) => e.stopPropagation());

    // Init
    if (CHAPTER_DATA.length > 0) {
      loadPage(0);
    }
  </script>
</body>
</html>`;
}
