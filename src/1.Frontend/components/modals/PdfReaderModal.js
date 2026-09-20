/**
 * ==========================================================================
 * FRONTEND COMPONENT - PDF READER MODAL (GLASSMORPHISM IN-APP VIEWER)
 * Trình đọc PDF cao cấp tích hợp:
 * - Render Canvas độ nét cao qua PDF.js
 * - Lật trang, Phóng to/Thu nhỏ, Tải file gốc
 * - ✂️ Khoanh vùng hỏi AI (Snipping Tool trên PDF gửi Gemini Vision)
 * - 🤖 AI Copilot giải thích trang tài liệu
 * - 🎯 Sinh trắc nghiệm tự động từ nội dung PDF vào Quiz Vault
 * - 📥 Trích xuất chữ dán thẳng vào Ghi chú
 * ==========================================================================
 */

// 1. IMPORTS
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { getPdfAttachment, createPdfBlobUrl, revokePdfBlobUrl } from '../../../3.Database/storage/IndexedDBEngine.js';
import { loadPdfDocument, extractPdfText, renderPdfPageToCanvas, cropCanvasAreaToBase64 } from '../../../2.Backend/services/PdfExtractionService.js';
import { askContextualNoteQuestion, generate5TopicPracticeQuizzes } from '../../../2.Backend/services/GeminiAIService.js';
import { renderMarkdownToHtml } from '../../../2.Backend/utils/markdownRenderer.js';
import { showToast } from '../Toast.js';

// 2. STATE VARIABLES
let currentPdfDoc = null;
let currentPdfId = null;
let currentPdfName = '';
let currentSubjectCode = '';
let currentTargetNode = null;
let currentAllNodes = [];
let currentPageNum = 1;
let totalPageCount = 1;
let currentScale = 1.35;
let insertToNoteCallback = null;

let isSnippingActive = false;
let snipeStartX = 0;
let snipeStartY = 0;
let snipeEndX = 0;
let snipeEndY = 0;
let isMouseDownOnSnipe = false;

// 3. MAIN OPEN / CLOSE CONTROLLERS
/**
 * Mở Trình Đọc PDF In-App Glassmorphism
 * @param {Object} options
 * @param {string} options.pdfId - ID của file PDF trong IndexedDB
 * @param {string} [options.pdfName] - Tên file hiển thị
 * @param {string} [options.subjectCode] - Mã môn học
 * @param {Object} [options.targetNode] - Node nơ-ron đang mở
 * @param {Array<Object>} [options.allNodes] - Danh sách node môn học
 * @param {Function} [options.onInsertToNote] - Callback chèn văn bản/lời giải vào Notepad
 */
export async function openPdfReaderModal({
  pdfId,
  pdfName = 'Tài liệu.pdf',
  subjectCode = '',
  targetNode = null,
  allNodes = [],
  onInsertToNote = null
}) {
  currentPdfId = pdfId;
  currentPdfName = pdfName;
  currentSubjectCode = subjectCode;
  currentTargetNode = targetNode;
  currentAllNodes = allNodes;
  insertToNoteCallback = onInsertToNote;
  currentPageNum = 1;
  currentScale = 1.35;

  let overlay = document.getElementById('pdf-reader-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pdf-reader-modal-overlay';
    overlay.className = 'pdf-reader-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="pdf-reader-container" id="pdf-reader-container">
      <!-- 1. Header Toolbar -->
      <div class="pdf-reader-header">
        <div class="pdf-reader-title-box">
          <i class="fa-solid fa-file-pdf pdf-reader-icon"></i>
          <span class="pdf-reader-title" id="pdf-modal-title" title="${escapeHtml(pdfName)}">${escapeHtml(pdfName)}</span>
        </div>

        <!-- Bộ điều khiển trang -->
        <div class="pdf-nav-controls">
          <button type="button" class="pdf-nav-btn" id="btn-pdf-prev" title="Trang trước (Phím ←)">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="pdf-page-indicator" id="pdf-page-indicator">Đang tải...</span>
          <button type="button" class="pdf-nav-btn" id="btn-pdf-next" title="Trang kế (Phím →)">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <!-- Bộ điều khiển Zoom -->
        <div class="pdf-zoom-controls">
          <button type="button" class="pdf-nav-btn" id="btn-pdf-zoom-out" title="Thu nhỏ (Ctrl -)">
            <i class="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <button type="button" class="pdf-nav-btn" id="btn-pdf-zoom-reset" title="Đặt lại 100%">
            <i class="fa-solid fa-expand"></i>
          </button>
          <button type="button" class="pdf-nav-btn" id="btn-pdf-zoom-in" title="Phóng to (Ctrl +)">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </button>
        </div>

        <!-- Nhóm Công Cụ AI Siêu Đỉnh -->
        <div class="pdf-ai-actions">
          <button type="button" class="pdf-tool-btn btn-snipe" id="btn-pdf-snipe" title="Kéo chuột khoanh một vùng công thức/hình vẽ để hỏi AI">
            <i class="fa-solid fa-crop-simple"></i>
            <span>Khoanh hỏi AI</span>
          </button>
          <button type="button" class="pdf-tool-btn btn-copilot" id="btn-pdf-ask-page" title="Hỏi AI tóm tắt hoặc phân tích trang này">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>Hỏi AI trang này</span>
          </button>
          <button type="button" class="pdf-tool-btn btn-quiz" id="btn-pdf-gen-quiz" title="AI tự tạo 5 câu trắc nghiệm từ nội dung PDF">
            <i class="fa-solid fa-bullseye"></i>
            <span>Tạo Trắc Nghiệm</span>
          </button>
          <button type="button" class="pdf-tool-btn" id="btn-pdf-insert-text" title="Trích xuất toàn bộ chữ trang này dán vào Note">
            <i class="fa-solid fa-file-import"></i>
            <span>Chèn vào Note</span>
          </button>
          <button type="button" class="pdf-tool-btn" id="btn-pdf-download" title="Tải file PDF gốc về máy tính">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>

        <!-- Nút đóng -->
        <button type="button" class="pdf-reader-close-btn" id="btn-pdf-modal-close" title="Đóng (ESC)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- 2. Body Viewport Canvas -->
      <div class="pdf-reader-body" id="pdf-reader-body">
        <div class="pdf-loading-spinner" id="pdf-loading-spinner">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Đang nạp dữ liệu PDF...</span>
        </div>
        <div class="pdf-canvas-wrapper" id="pdf-canvas-wrapper" style="display: none;">
          <canvas id="pdf-render-canvas"></canvas>
          <!-- Lớp phủ Snipping Marquee -->
          <div class="pdf-snipping-layer" id="pdf-snipping-layer">
            <div class="pdf-snipe-marquee" id="pdf-snipe-marquee" style="display: none;"></div>
          </div>
        </div>
      </div>

      <!-- 3. Khung Chat AI Nổi Tại Chỗ (In-situ AI Popup) -->
      <div class="pdf-ai-popup" id="pdf-ai-popup" style="display: none;">
        <div class="pdf-ai-popup-header">
          <div class="pdf-ai-popup-title" id="pdf-ai-popup-title">
            <i class="fa-solid fa-brain"></i>
            <span>Trợ lý AI Phân Tích PDF</span>
          </div>
          <button type="button" class="pdf-reader-close-btn" id="btn-close-pdf-ai-popup" style="width: 26px; height: 26px; font-size: 0.85rem;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="pdf-ai-popup-body" id="pdf-ai-popup-body"></div>
        <div class="pdf-ai-popup-footer">
          <input type="text" id="pdf-ai-input" placeholder="Hỏi thêm chi tiết về vùng này..." spellcheck="false" />
          <button type="button" id="btn-send-pdf-ai">Gửi</button>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  attachPdfModalEvents(overlay);

  // Tải tài liệu từ IndexedDB
  try {
    const record = await getPdfAttachment(pdfId);
    if (!record || !record.blob) {
      throw new Error('Không tìm thấy tệp PDF trong cơ sở dữ liệu IndexedDB!');
    }

    currentPdfDoc = await loadPdfDocument(record.blob);
    totalPageCount = currentPdfDoc.numPages;

    const spinner = overlay.querySelector('#pdf-loading-spinner');
    const wrapper = overlay.querySelector('#pdf-canvas-wrapper');
    if (spinner) spinner.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';

    await renderCurrentPdfPage();
  } catch (err) {
    console.error('Lỗi nạp file PDF:', err);
    showToast(`Lỗi khi mở PDF: ${err.message}`, 'error');
    closePdfReaderModal();
  }
}

/**
 * Đóng Modal đọc PDF
 */
export function closePdfReaderModal() {
  const overlay = document.getElementById('pdf-reader-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.innerHTML = '';
    }, 200);
  }
  currentPdfDoc = null;
  currentPdfId = null;
  isSnippingActive = false;
}

// 4. RENDERING CURRENT PAGE
async function renderCurrentPdfPage() {
  if (!currentPdfDoc) return;
  const overlay = document.getElementById('pdf-reader-modal-overlay');
  if (!overlay) return;

  const canvas = overlay.querySelector('#pdf-render-canvas');
  const indicator = overlay.querySelector('#pdf-page-indicator');
  const btnPrev = overlay.querySelector('#btn-pdf-prev');
  const btnNext = overlay.querySelector('#btn-pdf-next');

  if (indicator) {
    indicator.textContent = `Trang ${currentPageNum} / ${totalPageCount}`;
  }
  if (btnPrev) btnPrev.disabled = currentPageNum <= 1;
  if (btnNext) btnNext.disabled = currentPageNum >= totalPageCount;

  if (canvas) {
    await renderPdfPageToCanvas(currentPdfDoc, currentPageNum, canvas, currentScale);
  }
}

// 5. EVENT BINDINGS
function attachPdfModalEvents(overlay) {
  // 1. Nút Đóng Modal
  overlay.querySelector('#btn-pdf-modal-close')?.addEventListener('click', closePdfReaderModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePdfReaderModal();
  });

  // 2. Chuyển trang
  overlay.querySelector('#btn-pdf-prev')?.addEventListener('click', async () => {
    if (currentPageNum > 1) {
      currentPageNum--;
      await renderCurrentPdfPage();
    }
  });
  overlay.querySelector('#btn-pdf-next')?.addEventListener('click', async () => {
    if (currentPageNum < totalPageCount) {
      currentPageNum++;
      await renderCurrentPdfPage();
    }
  });

  // 3. Phóng to / Thu nhỏ
  overlay.querySelector('#btn-pdf-zoom-in')?.addEventListener('click', async () => {
    currentScale = Math.min(3.0, currentScale + 0.25);
    await renderCurrentPdfPage();
  });
  overlay.querySelector('#btn-pdf-zoom-out')?.addEventListener('click', async () => {
    currentScale = Math.max(0.6, currentScale - 0.25);
    await renderCurrentPdfPage();
  });
  overlay.querySelector('#btn-pdf-zoom-reset')?.addEventListener('click', async () => {
    currentScale = 1.35;
    await renderCurrentPdfPage();
  });

  // 4. Nút Tải file gốc
  overlay.querySelector('#btn-pdf-download')?.addEventListener('click', async () => {
    if (!currentPdfId) return;
    try {
      const res = await createPdfBlobUrl(currentPdfId);
      if (res && res.url) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = currentPdfName || 'TaiLieu.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => revokePdfBlobUrl(res.url), 2000);
      }
    } catch (e) {
      showToast('Lỗi khi tải file!', 'error');
    }
  });

  // 5. Nút Khoanh hỏi AI (Snipping Tool)
  const btnSnipe = overlay.querySelector('#btn-pdf-snipe');
  const snippingLayer = overlay.querySelector('#pdf-snipping-layer');
  const marquee = overlay.querySelector('#pdf-snipe-marquee');
  const canvas = overlay.querySelector('#pdf-render-canvas');

  btnSnipe?.addEventListener('click', () => {
    isSnippingActive = !isSnippingActive;
    btnSnipe.classList.toggle('active', isSnippingActive);
    snippingLayer?.classList.toggle('active', isSnippingActive);
    if (isSnippingActive) {
      showToast('✂️ Kéo chuột khoanh vùng công thức hoặc bài tập trên trang PDF để hỏi AI!', 'info');
    }
  });

  if (snippingLayer && marquee && canvas) {
    snippingLayer.addEventListener('mousedown', (e) => {
      isMouseDownOnSnipe = true;
      const rect = snippingLayer.getBoundingClientRect();
      snipeStartX = e.clientX - rect.left;
      snipeStartY = e.clientY - rect.top;
      marquee.style.left = `${snipeStartX}px`;
      marquee.style.top = `${snipeStartY}px`;
      marquee.style.width = '0px';
      marquee.style.height = '0px';
      marquee.style.display = 'block';
    });

    snippingLayer.addEventListener('mousemove', (e) => {
      if (!isMouseDownOnSnipe) return;
      const rect = snippingLayer.getBoundingClientRect();
      snipeEndX = e.clientX - rect.left;
      snipeEndY = e.clientY - rect.top;

      const left = Math.min(snipeStartX, snipeEndX);
      const top = Math.min(snipeStartY, snipeEndY);
      const width = Math.abs(snipeEndX - snipeStartX);
      const height = Math.abs(snipeEndY - snipeStartY);

      marquee.style.left = `${left}px`;
      marquee.style.top = `${top}px`;
      marquee.style.width = `${width}px`;
      marquee.style.height = `${height}px`;
    });

    const onSnipeFinish = async (e) => {
      if (!isMouseDownOnSnipe) return;
      isMouseDownOnSnipe = false;
      marquee.style.display = 'none';

      const width = Math.abs(snipeEndX - snipeStartX);
      const height = Math.abs(snipeEndY - snipeStartY);

      if (width < 25 || height < 25) {
        return; // Vùng khoanh quá bé, coi như click nhầm
      }

      const left = Math.min(snipeStartX, snipeEndX);
      const top = Math.min(snipeStartY, snipeEndY);

      // Tắt chế độ Snipping
      isSnippingActive = false;
      btnSnipe?.classList.remove('active');
      snippingLayer.classList.remove('active');

      try {
        const cropRes = cropCanvasAreaToBase64(canvas, {
          x: left,
          y: top,
          width,
          height
        });

        await openPdfAiPopupWithCrop(cropRes);
      } catch (err) {
        console.error('Lỗi cắt ảnh vùng khoanh:', err);
        showToast('Không thể cắt vùng ảnh đã chọn!', 'error');
      }
    };

    snippingLayer.addEventListener('mouseup', onSnipeFinish);
    snippingLayer.addEventListener('mouseleave', onSnipeFinish);
  }

  // 6. Nút Hỏi AI Toàn Trang
  overlay.querySelector('#btn-pdf-ask-page')?.addEventListener('click', async () => {
    try {
      showToast('🤖 Đang đọc nội dung trang để hỏi AI...', 'info');
      const textRes = await extractPdfText(currentPdfDoc, currentPageNum, currentPageNum);
      const pageText = textRes.fullText || '';
      await openPdfAiPopupWithText(pageText, `Trang ${currentPageNum}`);
    } catch (e) {
      showToast('Lỗi đọc nội dung trang!', 'error');
    }
  });

  // 7. Nút Tạo Trắc Nghiệm Từ PDF
  overlay.querySelector('#btn-pdf-gen-quiz')?.addEventListener('click', async () => {
    const btn = overlay.querySelector('#btn-pdf-gen-quiz');
    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đọc PDF...';
      const textRes = await extractPdfText(currentPdfDoc, currentPageNum, Math.min(totalPageCount, currentPageNum + 2));
      const text = textRes.fullText || '';

      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI Gen 5 câu...';
      const quizzes = await generate5TopicPracticeQuizzes(
        `Tài liệu: ${currentPdfName} (Trang ${currentPageNum})`,
        `Nội dung trích xuất từ trang ${currentPageNum} của tệp ${currentPdfName}`,
        {
          label: currentTargetNode?.label || currentPdfName,
          notes: text.slice(0, 3000),
          visualNotes: { html: '' }
        },
        currentAllNodes
      );

      if (Array.isArray(quizzes) && quizzes.length > 0 && currentTargetNode) {
        currentTargetNode.quizzes = currentTargetNode.quizzes || [];
        currentTargetNode.quizzes.push(...quizzes);
        showToast(`✨ Đã tạo thành công ${quizzes.length} câu hỏi trắc nghiệm từ PDF vào Quiz Vault!`, 'success');
      } else {
        showToast(`Đã tạo xong ${quizzes.length} câu hỏi trắc nghiệm!`, 'success');
      }
    } catch (err) {
      console.error('Lỗi tạo trắc nghiệm:', err);
      showToast(`Lỗi tạo trắc nghiệm: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bullseye"></i> <span>Tạo Trắc Nghiệm</span>';
    }
  });

  // 8. Nút Chèn Chữ Vào Note
  overlay.querySelector('#btn-pdf-insert-text')?.addEventListener('click', async () => {
    try {
      showToast('📥 Đang trích xuất văn bản...', 'info');
      const textRes = await extractPdfText(currentPdfDoc, currentPageNum, currentPageNum);
      const cleanText = textRes.pageTexts[0]?.text || '';
      if (!cleanText) {
        showToast('Trang này không có văn bản dạng text hoặc là ảnh quét!', 'warning');
        return;
      }
      const formatted = `\n\n> 📄 **Trích xuất từ ${escapeHtml(currentPdfName)} (Trang ${currentPageNum}):**\n${cleanText}\n`;
      if (typeof insertToNoteCallback === 'function') {
        insertToNoteCallback(formatted);
        showToast('Đã chèn nội dung trang vào ghi chú thành công! ✨', 'success');
      }
    } catch (e) {
      showToast('Lỗi trích xuất văn bản!', 'error');
    }
  });

  // Phím tắt bàn phím
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      const popup = overlay.querySelector('#pdf-ai-popup');
      if (popup && popup.style.display !== 'none') {
        popup.style.display = 'none';
      } else {
        closePdfReaderModal();
      }
    } else if (e.key === 'ArrowLeft') {
      overlay.querySelector('#btn-pdf-prev')?.click();
    } else if (e.key === 'ArrowRight') {
      overlay.querySelector('#btn-pdf-next')?.click();
    }
  };
  document.addEventListener('keydown', onKeyDown);
}

// 6. IN-SITU AI POPUP CONTROLLERS
let currentCropData = null;
let currentTextContext = '';
let currentAiChatHistory = [];

async function openPdfAiPopupWithCrop(cropRes) {
  currentCropData = cropRes;
  currentTextContext = '';
  currentAiChatHistory = [];

  const overlay = document.getElementById('pdf-reader-modal-overlay');
  const popup = overlay?.querySelector('#pdf-ai-popup');
  const body = overlay?.querySelector('#pdf-ai-popup-body');
  const title = overlay?.querySelector('#pdf-ai-popup-title');
  if (!popup || !body) return;

  if (title) title.innerHTML = '<i class="fa-solid fa-crop-simple"></i> Phân Tích Vùng Khoanh (Gemini Vision)';

  body.innerHTML = `
    <img src="${cropRes.dataUrl}" alt="Vùng khoanh chọn" class="focal-preview-img" />
    <div class="pdf-ai-loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i> Đang gửi hình ảnh sang Gemini Vision phân tích...
    </div>
  `;
  popup.style.display = 'flex';

  attachPopupSendEvent();

  try {
    const aiAnswer = await askContextualNoteQuestion({
      subjectCode: currentSubjectCode,
      targetNode: currentTargetNode,
      allNodes: currentAllNodes,
      fullContext: `Tài liệu PDF: ${currentPdfName} (Trang ${currentPageNum})`,
      focalText: `Phân tích chi tiết công thức, bảng biểu hoặc bài tập trong hình ảnh đính kèm từ trang ${currentPageNum} của tài liệu ${currentPdfName}.`,
      focalImages: [{ mimeType: cropRes.mimeType, base64: cropRes.base64 }],
      userQuestion: 'Hãy giải thích cặn kẽ bản chất công thức/sơ đồ/bài tập được chụp trong ảnh này, chỉ ra các bẫy thường gặp và cách vận dụng chuẩn xác.',
      chatHistory: currentAiChatHistory
    });

    currentAiChatHistory.push(
      { role: 'user', text: 'Giải thích vùng khoanh chọn' },
      { role: 'model', text: aiAnswer.text }
    );

    renderPopupAnswer(aiAnswer.text);
  } catch (err) {
    body.innerHTML = `<div style="color: #f87171;">❌ Lỗi phân tích: ${escapeHtml(err.message)}</div>`;
  }
}

async function openPdfAiPopupWithText(pageText, label) {
  currentCropData = null;
  currentTextContext = pageText;
  currentAiChatHistory = [];

  const overlay = document.getElementById('pdf-reader-modal-overlay');
  const popup = overlay?.querySelector('#pdf-ai-popup');
  const body = overlay?.querySelector('#pdf-ai-popup-body');
  const title = overlay?.querySelector('#pdf-ai-popup-title');
  if (!popup || !body) return;

  if (title) title.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI Copilot: ${escapeHtml(label)}`;

  body.innerHTML = `
    <div class="pdf-ai-loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i> Đang đọc hiểu toàn bộ ${escapeHtml(label)}...
    </div>
  `;
  popup.style.display = 'flex';

  attachPopupSendEvent();

  try {
    const aiAnswer = await askContextualNoteQuestion({
      subjectCode: currentSubjectCode,
      targetNode: currentTargetNode,
      allNodes: currentAllNodes,
      fullContext: `Tài liệu PDF: ${currentPdfName} (Trang ${currentPageNum})`,
      focalText: pageText.slice(0, 3500),
      focalImages: [],
      userQuestion: 'Tóm tắt các ý chính cốt lõi, công thức quan trọng và mẹo học tập của trang tài liệu này.',
      chatHistory: currentAiChatHistory
    });

    currentAiChatHistory.push(
      { role: 'user', text: 'Tóm tắt trang' },
      { role: 'model', text: aiAnswer.text }
    );

    renderPopupAnswer(aiAnswer.text);
  } catch (err) {
    body.innerHTML = `<div style="color: #f87171;">❌ Lỗi phân tích: ${escapeHtml(err.message)}</div>`;
  }
}

function renderPopupAnswer(answerText) {
  const overlay = document.getElementById('pdf-reader-modal-overlay');
  const body = overlay?.querySelector('#pdf-ai-popup-body');
  if (!body) return;

  const previewImgHtml = currentCropData ? `<img src="${currentCropData.dataUrl}" alt="Vùng khoanh chọn" class="focal-preview-img" />` : '';

  body.innerHTML = `
    ${previewImgHtml}
    <div class="pdf-ai-markdown-response">
      ${renderMarkdownToHtml(answerText)}
    </div>
    <div style="margin-top: 12px; display: flex; gap: 8px;">
      <button type="button" class="pdf-tool-btn" id="btn-insert-ai-answer" style="font-size: 0.75rem; padding: 4px 8px;">
        <i class="fa-solid fa-file-circle-plus"></i> Chèn vào Note
      </button>
      <button type="button" class="pdf-tool-btn" id="btn-copy-ai-answer" style="font-size: 0.75rem; padding: 4px 8px;">
        <i class="fa-regular fa-copy"></i> Sao chép
      </button>
    </div>
  `;

  body.querySelector('#btn-insert-ai-answer')?.addEventListener('click', () => {
    if (typeof insertToNoteCallback === 'function') {
      const block = `\n\n### 🤖 Lời giải AI từ tài liệu ${escapeHtml(currentPdfName)} (Trang ${currentPageNum}):\n${answerText}\n`;
      insertToNoteCallback(block);
      showToast('Đã chèn câu trả lời của AI vào ghi chú! ✨', 'success');
    }
  });

  body.querySelector('#btn-copy-ai-answer')?.addEventListener('click', () => {
    navigator.clipboard.writeText(answerText).then(() => {
      showToast('Đã sao chép câu trả lời!');
    });
  });
}

function attachPopupSendEvent() {
  const overlay = document.getElementById('pdf-reader-modal-overlay');
  const popup = overlay?.querySelector('#pdf-ai-popup');
  const btnClose = overlay?.querySelector('#btn-close-pdf-ai-popup');
  const btnSend = overlay?.querySelector('#btn-send-pdf-ai');
  const input = overlay?.querySelector('#pdf-ai-input');

  if (btnClose && popup) {
    btnClose.onclick = () => {
      popup.style.display = 'none';
    };
  }

  const handleSend = async () => {
    const q = input?.value?.trim();
    if (!q) return;
    input.value = '';

    const body = overlay?.querySelector('#pdf-ai-popup-body');
    if (body) {
      const userBubble = document.createElement('div');
      userBubble.style.cssText = 'background: rgba(99, 102, 241, 0.2); padding: 8px; border-radius: 8px; margin: 8px 0; font-weight: 600; color: #c7d2fe;';
      userBubble.textContent = `Bạn: ${q}`;
      body.appendChild(userBubble);

      const loading = document.createElement('div');
      loading.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AI đang suy nghĩ...';
      body.appendChild(loading);
      body.scrollTop = body.scrollHeight;

      try {
        const focalImgs = currentCropData ? [{ mimeType: currentCropData.mimeType, base64: currentCropData.base64 }] : [];
        const res = await askContextualNoteQuestion({
          subjectCode: currentSubjectCode,
          targetNode: currentTargetNode,
          allNodes: currentAllNodes,
          fullContext: `Tài liệu PDF: ${currentPdfName} (Trang ${currentPageNum})`,
          focalText: currentTextContext || 'Vùng khoanh chọn',
          focalImages: focalImgs,
          userQuestion: q,
          chatHistory: currentAiChatHistory
        });

        loading.remove();
        currentAiChatHistory.push({ role: 'user', text: q }, { role: 'model', text: res.text });

        const modelBubble = document.createElement('div');
        modelBubble.style.cssText = 'background: rgba(30, 41, 59, 0.6); padding: 10px; border-radius: 8px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, 0.08);';
        modelBubble.innerHTML = renderMarkdownToHtml(res.text);
        body.appendChild(modelBubble);
        body.scrollTop = body.scrollHeight;
      } catch (err) {
        loading.innerHTML = `<span style="color: #f87171;">Lỗi: ${escapeHtml(err.message)}</span>`;
      }
    }
  };

  if (btnSend) btnSend.onclick = handleSend;
  if (input) {
    input.onkeydown = (e) => {
      if (e.key === 'Enter') handleSend();
    };
  }
}
