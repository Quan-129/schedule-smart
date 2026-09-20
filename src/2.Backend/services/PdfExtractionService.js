/**
 * ==========================================================================
 * BACKEND SERVICE - PDF EXTRACTION & RENDERING SERVICE (PDF.JS ENGINE)
 * Chịu trách nhiệm nạp động PDF.js, trích xuất text, render trang ra canvas
 * và bóc tách vùng ảnh crop phục vụ AI Snipping Tool & Gemini Vision.
 * ==========================================================================
 */

// 1. CONSTANTS & CDN PATHS
const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let isLibraryLoading = false;
let libraryLoadPromise = null;

// 2. ON-DEMAND SCRIPT INJECTION
/**
 * Nạp động thư viện PDF.js từ CDN chỉ khi phát sinh nhu cầu đọc file PDF
 * @returns {Promise<Object>} Trả về window.pdfjsLib
 */
export function ensurePdfJsLoaded() {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (libraryLoadPromise) {
    return libraryLoadPromise;
  }

  libraryLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${PDFJS_CDN_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        resolve(window.pdfjsLib);
      });
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_CDN_URL;
    script.async = true;

    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js đã tải xong nhưng không tìm thấy đối tượng window.pdfjsLib!'));
      }
    };

    script.onerror = () => {
      reject(new Error('Không thể tải thư viện PDF.js từ CDN! Vui lòng kiểm tra kết nối mạng.'));
    };

    document.head.appendChild(script);
  });

  return libraryLoadPromise;
}

// 3. DOCUMENT LOADING & PARSING

/**
 * Tải tài liệu PDF từ File, Blob, ArrayBuffer hoặc URL
 * @param {File|Blob|ArrayBuffer|string} source 
 * @returns {Promise<Object>} PDFDocumentProxy
 */
export async function loadPdfDocument(source) {
  const pdfjs = await ensurePdfJsLoaded();

  let loadingTask;
  if (typeof source === 'string') {
    loadingTask = pdfjs.getDocument({ url: source });
  } else if (source instanceof Blob) {
    const arrayBuffer = await source.arrayBuffer();
    loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  } else if (source instanceof ArrayBuffer) {
    loadingTask = pdfjs.getDocument({ data: source });
  } else {
    throw new Error('Định dạng nguồn PDF không hợp lệ!');
  }

  return await loadingTask.promise;
}

// 4. TEXT EXTRACTION ENGINE (CHO AI COPILOT & QUIZ GENERATOR)

/**
 * Bóc tách toàn bộ văn bản sạch từ tài liệu PDF (hoặc trong khoảng trang quy định)
 * @param {Object} pdfDoc - Đối tượng PDFDocumentProxy
 * @param {number} startPage - Trang bắt đầu (1-indexed)
 * @param {number} endPage - Trang kết thúc (1-indexed, null = hết tài liệu)
 * @param {number} maxTotalPages - Giới hạn số trang đọc tối đa để tránh quá tải token (mặc định 30 trang)
 * @returns {Promise<{ fullText: string, pageTexts: Array<{ page: number, text: string }>, totalPages: number }>}
 */
export async function extractPdfText(pdfDoc, startPage = 1, endPage = null, maxTotalPages = 30) {
  if (!pdfDoc) throw new Error('Chưa cung cấp tài liệu PDF!');

  const totalPages = pdfDoc.numPages;
  const from = Math.max(1, startPage);
  const to = Math.min(totalPages, endPage ? Math.min(endPage, from + maxTotalPages - 1) : Math.min(totalPages, from + maxTotalPages - 1));

  const pageTexts = [];
  const fullTextParts = [];

  for (let p = from; p <= to; p++) {
    try {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const strings = textContent.items.map(item => item.str || '');
      
      // Ghép chuỗi văn bản sạch sẽ
      let pageRawText = '';
      let lastY = null;
      for (const item of textContent.items) {
        if (!item.str) continue;
        // Xuống dòng nếu tọa độ Y thay đổi đáng kể
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
          pageRawText += '\n';
        } else if (pageRawText.length > 0 && !pageRawText.endsWith(' ') && !pageRawText.endsWith('\n')) {
          pageRawText += ' ';
        }
        pageRawText += item.str;
        lastY = item.transform[5];
      }

      const cleanText = pageRawText.trim();
      pageTexts.push({ page: p, text: cleanText });
      fullTextParts.push(`--- [Trang ${p} / ${totalPages}] ---\n${cleanText}`);
    } catch (err) {
      console.warn(`Lỗi khi đọc text trang ${p}:`, err);
    }
  }

  return {
    fullText: fullTextParts.join('\n\n'),
    pageTexts,
    totalPages
  };
}

// 5. CANVAS RENDERING ENGINE (CHO IN-APP VIEWER)

/**
 * Render một trang cụ thể của PDF lên thẻ HTML Canvas
 * @param {Object} pdfDoc - Đối tượng PDFDocumentProxy
 * @param {number} pageNum - Số trang (1-indexed)
 * @param {HTMLCanvasElement} canvasEl - Thẻ Canvas đích
 * @param {number} scale - Tỉ lệ phóng to (mặc định 1.5 để sắc nét trên màn hình Retina)
 * @returns {Promise<{ width: number, height: number }>}
 */
export async function renderPdfPageToCanvas(pdfDoc, pageNum, canvasEl, scale = 1.5) {
  if (!pdfDoc || !canvasEl) throw new Error('Tham số render thiếu pdfDoc hoặc canvas!');
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvasEl.width = viewport.width;
  canvasEl.height = viewport.height;
  canvasEl.style.width = '100%';
  canvasEl.style.height = 'auto';

  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}

// 6. SNIPPING & CROP ENGINE (CHO AI MULTIMODAL VISION)

/**
 * Cắt một vùng hình chữ nhật trên Canvas hiển thị PDF thành ảnh Base64
 * Phục vụ gửi thẳng cho Gemini Multimodal Vision phân tích công thức, biểu đồ
 * @param {HTMLCanvasElement} canvasEl - Canvas trang PDF gốc
 * @param {{ x: number, y: number, width: number, height: number }} cropRect - Tọa độ tỉ lệ % hoặc pixel trên client
 * @returns {{ mimeType: string, base64: string, dataUrl: string }}
 */
export function cropCanvasAreaToBase64(canvasEl, cropRect) {
  if (!canvasEl || !cropRect || cropRect.width <= 0 || cropRect.height <= 0) {
    throw new Error('Vùng khoanh chọn không hợp lệ!');
  }

  // Chuyển đổi từ tọa độ client sang tọa độ thực của canvas
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = canvasEl.width / rect.width;
  const scaleY = canvasEl.height / rect.height;

  const actualX = Math.max(0, Math.round(cropRect.x * scaleX));
  const actualY = Math.max(0, Math.round(cropRect.y * scaleY));
  const actualW = Math.min(canvasEl.width - actualX, Math.round(cropRect.width * scaleX));
  const actualH = Math.min(canvasEl.height - actualY, Math.round(cropRect.height * scaleY));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = actualW;
  tempCanvas.height = actualH;

  const ctx = tempCanvas.getContext('2d');
  // Vẽ nền trắng đề phòng PDF trong suốt
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, actualW, actualH);

  ctx.drawImage(
    canvasEl,
    actualX, actualY, actualW, actualH,
    0, 0, actualW, actualH
  );

  const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.88);
  const base64 = dataUrl.split(',')[1] || '';

  return {
    mimeType: 'image/jpeg',
    base64,
    dataUrl
  };
}
