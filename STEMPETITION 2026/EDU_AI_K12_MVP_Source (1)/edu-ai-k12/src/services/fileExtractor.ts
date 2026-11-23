export interface ExtractedFileResult {
  fileName: string;
  fileType: string;
  text: string;
  confidence: number; // 0..1
  method: 'plain-text' | 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'ocr-image' | 'unsupported';
  error?: string;
}

function getExtension(name: string): string {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function extractTextFromFile(file: File): Promise<ExtractedFileResult> {
  const ext = getExtension(file.name);

  try {
    // 1. Plain text, CSV, Markdown, JSON
    if (['txt', 'csv', 'md', 'json', 'log'].includes(ext) || file.type.startsWith('text/')) {
      const text = await file.text();
      return {
        fileName: file.name,
        fileType: ext || 'text',
        text: text.trim(),
        confidence: text.trim().length > 0 ? 1 : 0,
        method: 'plain-text',
      };
    }

    // 2. DOCX via mammoth
    if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer });
      const text = (res.value || '').trim();
      return {
        fileName: file.name,
        fileType: 'docx',
        text,
        confidence: text.length > 0 ? 0.96 : 0.2,
        method: 'docx',
      };
    }

    // 3. XLSX / XLS via xlsx
    if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const chunks: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          chunks.push(`[Sheet: ${sheetName}]\n${csv.trim()}`);
        }
      }
      const text = chunks.join('\n\n').trim();
      return {
        fileName: file.name,
        fileType: ext,
        text,
        confidence: text.length > 0 ? 0.98 : 0.2,
        method: 'xlsx',
      };
    }

    // 4. PPTX via jszip XML extraction
    if (ext === 'pptx') {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const slideNames = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
          const na = Number(a.match(/\d+/)?.[0] ?? 0);
          const nb = Number(b.match(/\d+/)?.[0] ?? 0);
          return na - nb;
        });

      const slidesText: string[] = [];
      for (const slidePath of slideNames) {
        const xml = await zip.files[slidePath].async('string');
        const matches = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((m) =>
          decodeXmlEntities(m[1]),
        );
        if (matches.length > 0) {
          const slideNo = slidePath.match(/\d+/)?.[0] ?? '?';
          slidesText.push(`[Slide ${slideNo}]\n${matches.join(' ')}`);
        }
      }
      const text = slidesText.join('\n\n').trim();
      return {
        fileName: file.name,
        fileType: 'pptx',
        text,
        confidence: text.length > 0 ? 0.92 : 0.2,
        method: 'pptx',
      };
    }

    // 5. PDF via pdfjs-dist
    if (ext === 'pdf' || file.type === 'application/pdf') {
      const pdfjsLib = await import('pdfjs-dist');
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
      } catch {
        // Fallback if worker URL resolution isn't available in test environment
      }
      const data = new Uint8Array(await file.arrayBuffer());
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;
      const pages: string[] = [];
      const maxPages = Math.min(pdf.numPages, 25);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .filter(Boolean);
        if (strings.length > 0) {
          pages.push(`[Trang ${i}]\n${strings.join(' ')}`);
        }
      }
      const text = pages.join('\n\n').trim();
      return {
        fileName: file.name,
        fileType: 'pdf',
        text,
        confidence: text.length > 10 ? 0.9 : 0.15,
        method: 'pdf',
        error:
          text.length <= 10
            ? 'Tệp PDF này không chứa lớp văn bản chọn được (có thể là PDF dạng ảnh scan).'
            : undefined,
      };
    }

    // 6. Image OCR via tesseract.js
    if (
      ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) ||
      file.type.startsWith('image/')
    ) {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'vie+eng');
      const text = (result.data.text || '').trim();
      const rawConf = typeof result.data.confidence === 'number' ? result.data.confidence / 100 : 0;
      const confidence = text.length > 0 ? Math.max(0, Math.min(1, rawConf)) : 0;
      return {
        fileName: file.name,
        fileType: ext || 'image',
        text,
        confidence,
        method: 'ocr-image',
        error:
          confidence < 0.55
            ? 'Độ tin cậy OCR từ ảnh chưa đủ cao để tự động kết luận chính xác. Vui lòng kiểm tra hoặc chỉnh sửa văn bản trích xuất.'
            : undefined,
      };
    }

    return {
      fileName: file.name,
      fileType: ext || 'unknown',
      text: '',
      confidence: 0,
      method: 'unsupported',
      error: `Định dạng tệp .${ext || 'không xác định'} chưa được hỗ trợ trích xuất trực tiếp.`,
    };
  } catch (err) {
    return {
      fileName: file.name,
      fileType: ext || 'unknown',
      text: '',
      confidence: 0,
      method: 'unsupported',
      error:
        err instanceof Error
          ? `Không thể đọc tệp "${file.name}": ${err.message}`
          : `Không thể đọc tệp "${file.name}".`,
    };
  }
}
