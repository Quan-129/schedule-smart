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
let renderedPages = new Set();
let pageObserver = null;
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
          <button type="button" class="pdf-nav-btn pdf-zoom-reset-btn" id="btn-pdf-zoom-reset" title="Đặt lại 100%">
            <span id="pdf-zoom-level">100%</span>
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

        <!-- Nhóm Cửa Sổ: Toàn Màn Hình & Nút Đóng -->
        <div class="pdf-window-actions">
          <button type="button" class="pdf-nav-btn pdf-fullscreen-btn" id="btn-pdf-fullscreen" title="Toàn màn hình (Phím F)">
            <i class="fa-solid fa-expand"></i>
          </button>
          <button type="button" class="pdf-reader-close-btn" id="btn-pdf-modal-close" title="Đóng (ESC)">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- 2. Body Viewport Cuộn Chuột Nhiều Trang Liên Tục -->
      <div class="pdf-reader-body" id="pdf-reader-body">
        <div class="pdf-loading-spinner" id="pdf-loading-spinner">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Đang nạp dữ liệu PDF...</span>
        </div>
        <div class="pdf-pages-container" id="pdf-pages-container" style="display: none;"></div>
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
    currentPageNum = 1;

    const spinner = overlay.querySelector('#pdf-loading-spinner');
    if (spinner) spinner.style.display = 'none';

    await buildMultiPageContainer(overlay);
    setupScrollPageTracker(overlay);
    updateHeaderPageIndicator(overlay);
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
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  if (pageObserver) {
    pageObserver.disconnect();
    pageObserver = null;
  }
  const overlay = document.getElementById('pdf-reader-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.innerHTML = '';
    }, 200);
  }
  currentPdfDoc = null;
  currentPdfId = null;
  renderedPages.clear();
  isSnippingActive = false;
}

// 4. MULTI-PAGE CONTINUOUS RENDERING ENGINE
async function buildMultiPageContainer(overlay) {
  const container = overlay.querySelector('#pdf-pages-container');
  if (!container || !currentPdfDoc) return;
  container.innerHTML = '';
  renderedPages.clear();

  if (pageObserver) {
    pageObserver.disconnect();
    pageObserver = null;
  }

  // Đo tỉ lệ khung hình của trang 1 làm placeholder ban đầu (chuẩn A4 ~ 1.414)
  let defaultAspect = 1.414;
  try {
    const firstPage = await currentPdfDoc.getPage(1);
    const vp = firstPage.getViewport({ scale: 1.0 });
    if (vp.width > 0 && vp.height > 0) {
      defaultAspect = vp.height / vp.width;
    }
  } catch (e) {}

  const cardWidth = Math.round(780 * (currentScale / 1.35));

  for (let p = 1; p <= totalPageCount; p++) {
    const card = document.createElement('div');
    card.className = `pdf-page-card ${p === currentPageNum ? 'is-current-page' : ''}`;
    card.id = `pdf-page-card-${p}`;
    card.dataset.page = p;
    card.style.width = `${cardWidth}px`;
    card.style.minHeight = `${Math.round(cardWidth * defaultAspect)}px`;

    card.innerHTML = `
      <div class="pdf-page-badge">Trang ${p} / ${totalPageCount}</div>
      <div class="pdf-canvas-wrapper" id="pdf-canvas-wrapper-${p}">
        <canvas id="pdf-canvas-${p}" class="pdf-page-canvas"></canvas>
        <div class="pdf-snipping-layer ${isSnippingActive ? 'active' : ''}" id="pdf-snipping-layer-${p}" data-page="${p}">
          <div class="pdf-snipe-marquee" id="pdf-snipe-marquee-${p}" style="display: none;"></div>
        </div>
      </div>
    `;

    container.appendChild(card);
  }

  container.style.display = 'flex';

  // IntersectionObserver nạp trang khi cuộn tới gần (Lazy Rendering)
  const bodyEl = overlay.querySelector('#pdf-reader-body');
  pageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pNum = parseInt(entry.target.dataset.page, 10);
        renderPageCanvas(pNum);
      }
    });
  }, {
    root: bodyEl,
    rootMargin: '600px 0px 600px 0px',
    threshold: 0.01
  });

  container.querySelectorAll('.pdf-page-card').forEach(card => pageObserver.observe(card));

  // Render ngay lập tức trang 1 & 2
  await renderPageCanvas(currentPageNum);
  if (totalPageCount > 1) {
    renderPageCanvas(2);
  }

  // Gắn sự kiện Khoanh hỏi AI đa trang
  attachSnippingEventsToAllPages(overlay);
}

async function renderPageCanvas(pageNum) {
  if (!currentPdfDoc || pageNum < 1 || pageNum > totalPageCount) return;
  if (renderedPages.has(pageNum)) return;
  renderedPages.add(pageNum);

  const canvas = document.getElementById(`pdf-canvas-${pageNum}`);
  const card = document.getElementById(`pdf-page-card-${pageNum}`);
  if (!canvas) return;

  try {
    await renderPdfPageToCanvas(currentPdfDoc, pageNum, canvas, currentScale);
    if (card) card.style.minHeight = 'auto';
  } catch (err) {
    console.warn(`Lỗi render trang ${pageNum}:`, err);
  }
}

function updateHeaderPageIndicator(overlay) {
  const indicator = overlay?.querySelector('#pdf-page-indicator');
  const btnPrev = overlay?.querySelector('#btn-pdf-prev');
  const btnNext = overlay?.querySelector('#btn-pdf-next');

  if (indicator) {
    indicator.textContent = `Trang ${currentPageNum} / ${totalPageCount}`;
  }
  if (btnPrev) btnPrev.disabled = currentPageNum <= 1;
  if (btnNext) btnNext.disabled = currentPageNum >= totalPageCount;
}

function scrollToPage(pageNum, smooth = true) {
  if (!currentPdfDoc) return;
  pageNum = Math.max(1, Math.min(totalPageCount, pageNum));
  currentPageNum = pageNum;

  const overlay = document.getElementById('pdf-reader-modal-overlay');
  const targetCard = document.getElementById(`pdf-page-card-${pageNum}`);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }

  if (overlay) {
    updateHeaderPageIndicator(overlay);
    overlay.querySelectorAll('.pdf-page-card').forEach(c => {
      c.classList.toggle('is-current-page', parseInt(c.dataset.page, 10) === currentPageNum);
    });
  }

  renderPageCanvas(pageNum);
}

function setupScrollPageTracker(overlay) {
  const bodyEl = overlay.querySelector('#pdf-reader-body');
  const container = overlay.querySelector('#pdf-pages-container');
  if (!bodyEl || !container) return;

  let ticking = false;
  bodyEl.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const bodyRect = bodyEl.getBoundingClientRect();
        const triggerY = bodyRect.top + 180;

        let bestPage = currentPageNum;
        let minDistance = Infinity;

        const cards = container.querySelectorAll('.pdf-page-card');
        for (let card of cards) {
          const rect = card.getBoundingClientRect();
          const dist = Math.abs(rect.top - triggerY);
          if (dist < minDistance) {
            minDistance = dist;
            bestPage = parseInt(card.dataset.page, 10);
          }
        }

        if (bestPage !== currentPageNum) {
          currentPageNum = bestPage;
          updateHeaderPageIndicator(overlay);
          cards.forEach(c => c.classList.toggle('is-current-page', parseInt(c.dataset.page, 10) === currentPageNum));
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

async function applyZoom(newScale) {
  currentScale = Math.max(0.6, Math.min(3.0, newScale));
  const overlay = document.getElementById('pdf-reader-modal-overlay');
  if (!overlay) return;

  const zoomLevel = overlay.querySelector('#pdf-zoom-level');
  if (zoomLevel) {
    const percent = Math.round((currentScale / 1.35) * 100);
    zoomLevel.textContent = `${percent}%`;
  }

  const cardWidth = Math.round(780 * (currentScale / 1.35));
  overlay.querySelectorAll('.pdf-page-card').forEach(c => {
    c.style.width = `${cardWidth}px`;
  });

  // Xóa cache rendered và nạp lại trang hiện tại cùng lân cận
  renderedPages.clear();
  await renderPageCanvas(currentPageNum);
  if (currentPageNum > 1) renderPageCanvas(currentPageNum - 1);
  if (currentPageNum < totalPageCount) renderPageCanvas(currentPageNum + 1);
}

function attachSnippingEventsToAllPages(overlay) {
  const container = overlay.querySelector('#pdf-pages-container');
  if (!container) return;

  let isMouseDown = false;
  let startX = 0, startY = 0;
  let activeLayer = null;
  let activeMarquee = null;
  let activeCanvas = null;
  let targetPage = 1;

  container.addEventListener('mousedown', (e) => {
    if (!isSnippingActive) return;
    const layer = e.target.closest('.pdf-snipping-layer');
    if (!layer) return;

    isMouseDown = true;
    activeLayer = layer;
    targetPage = parseInt(layer.dataset.page, 10) || currentPageNum;
    activeMarquee = layer.querySelector('.pdf-snipe-marquee');
    activeCanvas = document.getElementById(`pdf-canvas-${targetPage}`);

    const rect = layer.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    if (activeMarquee) {
      activeMarquee.style.left = `${startX}px`;
      activeMarquee.style.top = `${startY}px`;
      activeMarquee.style.width = '0px';
      activeMarquee.style.height = '0px';
      activeMarquee.style.display = 'block';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown || !activeLayer || !activeMarquee) return;
    const rect = activeLayer.getBoundingClientRect();
    const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const left = Math.min(startX, curX);
    const top = Math.min(startY, curY);
    const width = Math.abs(curX - startX);
    const height = Math.abs(curY - startY);

    activeMarquee.style.left = `${left}px`;
    activeMarquee.style.top = `${top}px`;
    activeMarquee.style.width = `${width}px`;
    activeMarquee.style.height = `${height}px`;
  });

  const onSnipeFinish = async (e) => {
    if (!isMouseDown || !activeLayer || !activeMarquee || !activeCanvas) {
      isMouseDown = false;
      return;
    }
    isMouseDown = false;
    activeMarquee.style.display = 'none';

    const rect = activeLayer.getBoundingClientRect();
    const endX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const endY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    // Tắt chế độ Snipping
    isSnippingActive = false;
    const btnSnipe = overlay.querySelector('#btn-pdf-snipe');
    btnSnipe?.classList.remove('active');
    overlay.querySelectorAll('.pdf-snipping-layer').forEach(l => l.classList.remove('active'));

    if (width < 25 || height < 25) {
      return; // Vùng khoanh quá bé, coi như click nhầm
    }

    try {
      const cropRes = cropCanvasAreaToBase64(activeCanvas, {
        x: left,
        y: top,
        width,
        height
      });

      await openPdfAiPopupWithCrop(cropRes, targetPage);
    } catch (err) {
      console.error('Lỗi cắt ảnh vùng khoanh:', err);
      showToast('Không thể cắt vùng ảnh đã chọn!', 'error');
    }
  };

  window.addEventListener('mouseup', onSnipeFinish);
}

// 5. EVENT BINDINGS
function attachPdfModalEvents(overlay) {
  // 1. Nút Đóng Modal
  overlay.querySelector('#btn-pdf-modal-close')?.addEventListener('click', closePdfReaderModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePdfReaderModal();
  });

  // 2. Chuyển trang (Cuộn mượt)
  overlay.querySelector('#btn-pdf-prev')?.addEventListener('click', () => {
    if (currentPageNum > 1) {
      scrollToPage(currentPageNum - 1);
    }
  });
  overlay.querySelector('#btn-pdf-next')?.addEventListener('click', () => {
    if (currentPageNum < totalPageCount) {
      scrollToPage(currentPageNum + 1);
    }
  });

  // 3. Phóng to / Thu nhỏ / Đặt lại 100%
  overlay.querySelector('#btn-pdf-zoom-in')?.addEventListener('click', () => {
    applyZoom(currentScale + 0.25);
  });
  overlay.querySelector('#btn-pdf-zoom-out')?.addEventListener('click', () => {
    applyZoom(currentScale - 0.25);
  });
  overlay.querySelector('#btn-pdf-zoom-reset')?.addEventListener('click', () => {
    applyZoom(1.35);
  });

  // 3.1. Chế độ Toàn màn hình (Fullscreen Toggle)
  const btnFullscreen = overlay.querySelector('#btn-pdf-fullscreen');
  const container = overlay.querySelector('.pdf-reader-container');

  const updateFullscreenIcon = () => {
    const isFs = container?.classList.contains('is-fullscreen') || !!document.fullscreenElement;
    if (btnFullscreen) {
      btnFullscreen.innerHTML = isFs ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
      btnFullscreen.title = isFs ? 'Thu nhỏ cửa sổ (Phím F hoặc ESC)' : 'Toàn màn hình (Phím F)';
      btnFullscreen.classList.toggle('active', isFs);
    }
  };

  const toggleFullscreen = async () => {
    if (!container) return;
    const isCurrentlyFs = container.classList.contains('is-fullscreen') || !!document.fullscreenElement;

    if (!isCurrentlyFs) {
      container.classList.add('is-fullscreen');
      try {
        if (container.requestFullscreen && !document.fullscreenElement) {
          await container.requestFullscreen();
        }
      } catch (fsErr) {
        console.warn('Browser Fullscreen fallback sang CSS fullscreen:', fsErr);
      }
    } else {
      container.classList.remove('is-fullscreen');
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (exitErr) {
        console.warn('Exit fullscreen error:', exitErr);
      }
    }
    updateFullscreenIcon();
  };

  btnFullscreen?.addEventListener('click', toggleFullscreen);

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && container?.classList.contains('is-fullscreen')) {
      container.classList.remove('is-fullscreen');
      updateFullscreenIcon();
    }
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
  btnSnipe?.addEventListener('click', () => {
    isSnippingActive = !isSnippingActive;
    btnSnipe.classList.toggle('active', isSnippingActive);
    overlay.querySelectorAll('.pdf-snipping-layer').forEach(l => l.classList.toggle('active', isSnippingActive));
    if (isSnippingActive) {
      showToast('✂️ Kéo chuột khoanh vùng công thức hoặc bài tập trên bất kỳ trang PDF nào để hỏi AI!', 'info');
    }
  });

  // 6. Nút Hỏi AI Toàn Trang
  overlay.querySelector('#btn-pdf-ask-page')?.addEventListener('click', async () => {
    try {
      showToast(`🤖 Đang đọc nội dung trang ${currentPageNum} để hỏi AI...`, 'info');
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
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        scrollToPage(currentPageNum - 1);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        scrollToPage(currentPageNum + 1);
      }
    } else if (e.key === 'Home') {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        scrollToPage(1);
      }
    } else if (e.key === 'End') {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        scrollToPage(totalPageCount);
      }
    } else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const activeEl = document.activeElement;
      if (activeEl?.tagName !== 'INPUT' && activeEl?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleFullscreen();
      }
    }
  };
  document.addEventListener('keydown', onKeyDown);
}

// 6. IN-SITU AI POPUP CONTROLLERS
let currentCropData = null;
let currentTextContext = '';
let currentAiChatHistory = [];

async function openPdfAiPopupWithCrop(cropRes, targetPageNum = currentPageNum) {
  currentCropData = cropRes;
  currentTextContext = '';
  currentAiChatHistory = [];

  const overlay = document.getElementById('pdf-reader-modal-overlay');
  const popup = overlay?.querySelector('#pdf-ai-popup');
  const body = overlay?.querySelector('#pdf-ai-popup-body');
  const title = overlay?.querySelector('#pdf-ai-popup-title');
  if (!popup || !body) return;

  if (title) title.innerHTML = `<i class="fa-solid fa-crop-simple"></i> Phân Tích Vùng Khoanh (Trang ${targetPageNum})`;

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
      fullContext: `Tài liệu PDF: ${currentPdfName} (Trang ${targetPageNum})`,
      focalText: `Phân tích chi tiết công thức, bảng biểu hoặc bài tập trong hình ảnh đính kèm từ trang ${targetPageNum} của tài liệu ${currentPdfName}.`,
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
