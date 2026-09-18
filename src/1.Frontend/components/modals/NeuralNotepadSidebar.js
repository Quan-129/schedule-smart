// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { updateNeuralNode, deleteNeuralNodeQuiz, getSubjectKnowledgeNodes } from '../../../3.Database/state.js';
import { renderMarkdownToHtml } from '../../../2.Backend/utils/markdownRenderer.js';
import { openNeuralQuizModal } from './NeuralQuizModal.js';
import { compressImage } from '../../../2.Backend/utils/imageCompressor.js';
import { uploadNoteImageToStorage } from '../../../3.Database/auth/FirebaseAuthService.js';
import { askContextualNoteQuestion } from '../../../2.Backend/services/GeminiAIService.js';
import { showToast } from '../Toast.js';

// ==========================================================================
// 2. HELPER FUNCTIONS: SMART FORMATTING & CONTEXT MATCHING
// ==========================================================================

/**
 * Tìm vị trí chính xác của đoạn text đang được bôi đen trên giao diện xem trước (Preview)
 * Bằng cách so khớp ngữ cảnh các từ xung quanh (Context Matching), ngăn ngừa triệt để
 * lỗi nhảy lên từ xuất hiện đầu tiên ở đầu file khi một từ bị lặp lại nhiều lần.
 * 
 * @param {string} rawText - Toàn bộ nội dung văn bản gốc trong textarea
 * @param {string} sel - Cụm từ người dùng đang bôi đen
 * @returns {number} Vị trí index chính xác trong rawText, hoặc -1 nếu không tìm thấy
 */
function findSmartSelectionIndex(rawText, sel) {
  if (!sel || !rawText) return -1;

  let prefixContext = '';
  let suffixContext = '';

  if (typeof window !== 'undefined' && window.getSelection) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let container = range.commonAncestorContainer;
      if (container && container.nodeType === 3) container = container.parentElement;
      const fullContent = (container && container.textContent) ? container.textContent : '';
      const pos = fullContent.indexOf(sel);
      if (pos !== -1) {
        prefixContext = fullContent.substring(Math.max(0, pos - 30), pos).trim();
        suffixContext = fullContent.substring(pos + sel.length, pos + sel.length + 30).trim();
      }
    }
  }

  if (prefixContext || suffixContext) {
    let searchPos = 0;
    let bestIdx = -1;
    let maxScore = -1;

    while ((searchPos = rawText.indexOf(sel, searchPos)) !== -1) {
      let score = 0;
      if (prefixContext) {
        const beforeText = rawText.substring(Math.max(0, searchPos - 45), searchPos);
        for (let word of prefixContext.split(/\s+/)) {
          if (word.length > 1 && beforeText.includes(word)) score += 2;
        }
      }
      if (suffixContext) {
        const afterText = rawText.substring(searchPos + sel.length, searchPos + sel.length + 45);
        for (let word of suffixContext.split(/\s+/)) {
          if (word.length > 1 && afterText.includes(word)) score += 2;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestIdx = searchPos;
      }
      searchPos += sel.length;
    }

    if (bestIdx !== -1 && maxScore > 0) {
      return bestIdx;
    }
  }

  return rawText.indexOf(sel);
}

/**
 * Áp dụng định dạng Markdown thông minh:
 * - Nếu đang thao tác trên Preview: Định vị chính xác qua ngữ cảnh, bọc định dạng và XÓA SẠCH selection
 *   để không bị lưu vết selection cũ sang các lần bấm tiếp theo.
 * - Nếu đang thao tác trong Textarea: Bọc/gỡ định dạng trực tiếp tại con trỏ.
 * - Nếu không bôi đen: Chỉ chèn cặp thẻ rỗng và đưa con trỏ vào giữa để gõ tiếp.
 * 
 * @param {HTMLElement} sidebar
 * @param {HTMLTextAreaElement} textarea 
 * @param {HTMLElement} previewContent
 * @param {string} prefix 
 * @param {string} suffix 
 * @param {Function} onModifyCallback 
 */
function applyFormat(sidebar, textarea, previewContent, prefix, suffix, onModifyCallback) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  const isEditPaneHidden = sidebar.querySelector('#neural-np-edit-pane')?.classList.contains('hidden');
  const domSelection = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection() : null;
  const domSelText = (domSelection && domSelection.rangeCount > 0) ? domSelection.toString().trim() : '';

  // ƯU TIÊN 1: Người dùng đang bôi đen trên bản Preview (hoặc tab Preview đang mở độc chiếm)
  const isDomSelInPreview = domSelText && previewContent && domSelection.anchorNode && previewContent.contains(domSelection.anchorNode);

  if (isEditPaneHidden || isDomSelInPreview) {
    if (!domSelText) return;

    const idx = findSmartSelectionIndex(text, domSelText);
    if (idx !== -1) {
      const existing = text.substring(Math.max(0, idx - prefix.length), idx + domSelText.length + suffix.length);
      let newText = '';
      if (existing === prefix + domSelText + suffix) {
        newText = text.substring(0, idx - prefix.length) + domSelText + text.substring(idx + domSelText.length + suffix.length);
      } else {
        const replacement = prefix + domSelText + suffix;
        newText = text.substring(0, idx) + replacement + text.substring(idx + domSelText.length);
      }

      textarea.value = newText;
      textarea.setSelectionRange(0, 0);

      if (domSelection) {
        domSelection.removeAllRanges();
      }

      if (onModifyCallback) onModifyCallback(newText, 0, 0);
      return;
    }
  }

  // ƯU TIÊN 2: Người dùng đang bôi đen trực tiếp trong Textarea
  if (start !== end) {
    const selectedText = text.substring(start, end);

    if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix) && selectedText.length >= prefix.length + suffix.length) {
      const unformatted = selectedText.slice(prefix.length, -suffix.length);
      const newText = text.substring(0, start) + unformatted + text.substring(end);
      textarea.value = newText;
      textarea.focus();
      textarea.setSelectionRange(start, start + unformatted.length);
      if (onModifyCallback) onModifyCallback(newText, start, start + unformatted.length);
      return;
    }

    const replacement = prefix + selectedText + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(start, start + replacement.length);
    if (onModifyCallback) onModifyCallback(newText, start, start + replacement.length);
    return;
  }

  // ƯU TIÊN 3: Nếu KHÔNG bôi đen bất kỳ chữ nào
  const replacement = prefix + suffix;
  const newText = text.substring(0, start) + replacement + text.substring(end);
  textarea.value = newText;
  textarea.focus();
  const midPos = start + prefix.length;
  textarea.setSelectionRange(midPos, midPos);
  if (onModifyCallback) onModifyCallback(newText, midPos, midPos);
}

// ==========================================================================
// 3. COMPONENT TEMPLATE
// ==========================================================================
function renderNotepadTemplate(node) {
  const notes = node.notes || '';
  const hasNotes = Boolean(notes && notes.trim());
  const renderedHtml = renderMarkdownToHtml(notes);
  const visualNotes = node.visualNotes || { html: '', images: [] };
  const initialVisualHtml = visualNotes.html || '';
  const hasVisualNotes = Boolean(
    (Array.isArray(visualNotes.images) && visualNotes.images.length > 0) ||
    (typeof visualNotes.html === 'string' && visualNotes.html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0) ||
    (typeof visualNotes === 'string' && visualNotes.trim().length > 0)
  );

  let defaultTab = 'edit';
  if (hasNotes) {
    defaultTab = 'preview';
  } else if (hasVisualNotes) {
    defaultTab = 'visual';
  }

  return `
    <!-- Splitter Resizer Handle (Thanh 3 chấm kéo tỉ lệ) -->
    <div class="neural-sidebar-resizer" id="neural-sidebar-resizer" role="separator" aria-orientation="vertical" title="Nhấn giữ và kéo sang trái/phải để đổi độ rộng (Nhấp đúp để về 50%)">
      <div class="neural-resizer-line"></div>
      <div class="neural-resizer-pill">
        <span class="resizer-dot"></span>
        <span class="resizer-dot"></span>
        <span class="resizer-dot"></span>
      </div>
    </div>

    <div class="neural-notepad-header">
      <div class="neural-notepad-title-group">
        <span class="neural-notepad-badge"><i class="fa-solid fa-file-pen"></i></span>
        <div>
          <h3 class="neural-notepad-title">${escapeHtml(node.label || 'Ghi Chú Khái Niệm')}</h3>
        </div>
      </div>
      <div class="neural-notepad-header-actions">
        <div class="neural-notepad-tabs">
          <button type="button" class="neural-np-tab ${defaultTab === 'preview' ? 'active' : ''}" data-tab="preview" title="Bảng notepad đã gen ra">
            <i class="fa-solid fa-eye"></i> Đã Gen Ra
          </button>
          <button type="button" class="neural-np-tab ${defaultTab === 'edit' ? 'active' : ''}" data-tab="edit" title="Soạn thảo Markdown">
            <i class="fa-solid fa-pen-to-square"></i> Soạn thảo
          </button>
          <button type="button" class="neural-np-tab ${defaultTab === 'visual' ? 'active' : ''}" data-tab="visual" title="Ghi chú tự do & chèn ảnh nổi đè lên">
            <i class="fa-solid fa-paintbrush"></i> Ghi chú
          </button>
          <button type="button" class="neural-np-tab" data-tab="quiz" title="Ngân hàng câu hỏi trắc nghiệm đã lưu">
            <i class="fa-solid fa-bullseye"></i> Trắc nghiệm (${(node.quizzes || []).length})
          </button>
          <button type="button" class="neural-np-tab" id="btn-toggle-ai-copilot" title="Mở Trợ lý AI Copilot đọc hiểu ngữ cảnh" style="color: #c084fc; border-color: rgba(168, 85, 247, 0.4);">
            <i class="fa-solid fa-wand-magic-sparkles"></i> AI Copilot
          </button>
        </div>
        <button type="button" class="neural-close-btn" id="btn-close-neural-notepad" title="Đóng bảng ghi chú">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <!-- Toolbar 1: Dành cho Markdown (Preview & Soạn thảo) -->
    <div class="neural-notepad-toolbar" id="neural-notepad-toolbar" style="${defaultTab === 'visual' ? 'display: none;' : ''}">
      <div class="neural-np-tools-group">
        <button type="button" class="neural-np-tool-btn" id="btn-hist-undo" title="Hoàn tác (Ctrl+Z)" disabled>
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button type="button" class="neural-np-tool-btn" id="btn-hist-redo" title="Làm lại (Ctrl+Y)" disabled>
          <i class="fa-solid fa-rotate-right"></i>
        </button>

        <div class="neural-np-tool-divider"></div>

        <button type="button" class="neural-np-tool-btn" id="btn-fmt-bold" title="In đậm (**văn bản**)">
          <strong>B</strong>
        </button>
        <button type="button" class="neural-np-tool-btn" id="btn-fmt-italic" title="In nghiêng (*văn bản*)">
          <em>I</em>
        </button>
        <button type="button" class="neural-np-tool-btn" id="btn-fmt-underline" title="Gạch chân (<u>văn bản</u>)">
          <span style="text-decoration: underline;">U</span>
        </button>
        <button type="button" class="neural-np-tool-btn highlight" id="btn-fmt-highlight" title="Tô sáng dạ quang (==văn bản==)">
          <i class="fa-solid fa-highlighter"></i> HL
        </button>

        <div class="neural-np-tool-divider"></div>

        <button type="button" class="neural-np-tool-btn neural-btn-snipping" id="btn-snipe-ai-md" title="Khoanh vùng hỏi AI (Kéo chuột chọn bất kỳ đoạn nào để hỏi)">
          <i class="fa-solid fa-crop-simple"></i>
          <span>Khoanh hỏi AI</span>
        </button>
      </div>

      <div class="neural-notepad-save-indicator" id="neural-notepad-save-status">
        <i class="fa-solid fa-cloud-arrow-up"></i> Đã đồng bộ
      </div>
    </div>

    <!-- Body Container: 3 Panes (Edit, Preview, Visual) -->
    <div class="neural-notepad-body" id="neural-notepad-body-container" data-view-mode="${defaultTab}">
      <!-- 1. Textarea Soạn thảo Markdown -->
      <div class="neural-np-pane ${defaultTab === 'edit' ? '' : 'hidden'}" id="neural-np-edit-pane">
        <textarea 
          id="neural-notepad-textarea" 
          class="neural-notepad-textarea" 
          placeholder="Nhập ghi chú định dạng Markdown tại đây...&#10;• **In đậm**&#10;• *In nghiêng*&#10;• <u>Gạch chân</u>&#10;• ==Tô sáng highlight=="
        >${escapeHtml(notes)}</textarea>
      </div>

      <!-- 2. Bảng Notepad Đã Gen Ra (Rich Preview) -->
      <div class="neural-np-pane ${defaultTab === 'preview' ? '' : 'hidden'}" id="neural-np-preview-pane">
        <div class="neural-notepad-rendered-content" id="neural-notepad-preview-content">
          ${renderedHtml}
        </div>
        <button type="button" class="btn-quick-switch-to-edit" id="btn-quick-switch-to-edit" title="Chuyển sang soạn thảo">
          <i class="fa-solid fa-pen-to-square"></i> Sửa nội dung
        </button>
      </div>

      <!-- 3. Pane Ghi Chú Tự Do Đa Tầng (Visual Canvas Note & Overlay Floating Images) -->
      <div class="neural-np-pane neural-np-visual-pane ${defaultTab === 'visual' ? '' : 'hidden'}" id="neural-np-visual-pane">
        <!-- Toolbar riêng cho tab Ghi Chú -->
        <div class="neural-visual-toolbar" id="neural-visual-toolbar">
          <button type="button" class="neural-np-tool-btn" id="btn-vis-undo" title="Hoàn tác (Ctrl+Z)">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
          <div class="neural-np-tool-divider"></div>
          <button type="button" class="neural-np-tool-btn" id="btn-vis-bold" title="In đậm">
            <strong>B</strong>
          </button>
          <button type="button" class="neural-np-tool-btn" id="btn-vis-italic" title="In nghiêng">
            <em>I</em>
          </button>
          <button type="button" class="neural-np-tool-btn" id="btn-vis-underline" title="Gạch chân">
            <span style="text-decoration: underline;">U</span>
          </button>
          <button type="button" class="neural-np-tool-btn highlight" id="btn-vis-highlight" title="Tô sáng dạ quang">
            <i class="fa-solid fa-highlighter"></i> HL
          </button>
          <div class="neural-np-tool-divider"></div>
          <select class="visual-font-size-select" id="vis-font-size" title="Thay đổi cỡ chữ">
            <option value="15px">Chuẩn (15px)</option>
            <option value="13px">Nhỏ (13px)</option>
            <option value="18px">Vừa (18px)</option>
            <option value="22px">Tiêu đề (22px)</option>
            <option value="26px">Lớn (26px)</option>
          </select>
          <div class="neural-np-tool-divider"></div>
          <div class="visual-color-swatches" id="vis-color-swatches" title="Chọn màu chữ">
            <span class="visual-color-dot active" data-color="#f8fafc" style="background: #f8fafc;" title="Trắng sáng"></span>
            <span class="visual-color-dot" data-color="#38bdf8" style="background: #38bdf8;" title="Xanh Cyan"></span>
            <span class="visual-color-dot" data-color="#facc15" style="background: #facc15;" title="Vàng Neon"></span>
            <span class="visual-color-dot" data-color="#c084fc" style="background: #c084fc;" title="Tím Pastel"></span>
            <span class="visual-color-dot" data-color="#4ade80" style="background: #4ade80;" title="Xanh Mint"></span>
            <span class="visual-color-dot" data-color="#f472b6" style="background: #f472b6;" title="Hồng Pastel"></span>
          </div>
          <div class="neural-np-tool-divider"></div>
          <label class="visual-paste-btn" title="Chèn ảnh từ máy (hoặc bấm Ctrl+V để dán trực tiếp)">
            <i class="fa-regular fa-image"></i> Dán ảnh (Ctrl+V)
            <input type="file" id="vis-file-input" accept="image/*" style="display: none;">
          </label>
          <div class="neural-np-tool-divider"></div>
          <button type="button" class="neural-np-tool-btn neural-btn-snipping" id="btn-snipe-ai-vis" title="Khoanh vùng hỏi AI (Kéo chuột chọn bất kỳ đoạn nào để hỏi)">
            <i class="fa-solid fa-crop-simple"></i>
            <span>Khoanh hỏi AI</span>
          </button>
        </div>

        <!-- Canvas Wrapper chứa Text Editor nền & Lớp ảnh nổi đè lên -->
        <div class="visual-note-canvas-wrapper" id="visual-note-canvas-wrapper">
          <div 
            class="visual-rich-editor" 
            id="visual-rich-editor" 
            contenteditable="true" 
            spellcheck="false"
            data-placeholder="Gõ văn bản ghi chú tại đây...&#10;• Dùng các nút trên để đổi cỡ chữ, màu sắc, in đậm/nghiêng/highlight&#10;• Bấm Ctrl+V để dán ảnh đè lên văn bản, kéo thả ở tâm và co giãn 4 góc mượt mà!"
          >${initialVisualHtml}</div>

          <div class="visual-images-layer" id="visual-images-layer"></div>
        </div>
      </div>

      <!-- 4. Pane Ngân Hàng Câu Hỏi Trắc Nghiệm Đã Lưu (Quiz Vault) -->
      <div class="neural-np-pane hidden" id="neural-np-quiz-pane">
        <div class="quiz-vault-header-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 4px 2px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-bullseye"></i>
            <span>Kho Câu Hỏi Trắc Nghiệm Của Khái Niệm</span>
          </div>
          <button type="button" class="btn-neural-quiz-action next" id="btn-open-quiz-from-vault" style="padding: 5px 12px; font-size: 0.78rem;">
            <i class="fa-solid fa-wand-magic-sparkles"></i> AI Gen Câu Mới
          </button>
        </div>
        <div class="quiz-vault-list" id="quiz-vault-list-container">
          <!-- Sẽ được fill bằng JavaScript -->
        </div>
      </div>
    </div>

    <!-- 5. Contextual AI Copilot Drawer (Hỏi đáp ngữ cảnh thông minh) -->
    <div class="neural-ai-copilot-drawer" id="neural-ai-copilot-drawer">
      <div class="neural-ai-drawer-header" id="neural-ai-drawer-header" title="Nhấp để thu nhỏ / mở rộng">
        <div class="neural-ai-drawer-title-group">
          <div class="neural-ai-drawer-badge"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          <div>
            <span class="neural-ai-drawer-title">
              AI Copilot
              <span class="neural-ai-drawer-sub">Đọc hiểu toàn bài</span>
            </span>
          </div>
        </div>
        <div class="neural-ai-drawer-actions">
          <button type="button" class="neural-ai-drawer-btn" id="btn-minimize-ai-drawer" title="Thu nhỏ / Mở rộng">
            <i class="fa-solid fa-minus"></i>
          </button>
          <button type="button" class="neural-ai-drawer-btn" id="btn-close-ai-drawer" title="Đóng AI Copilot">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Focal Context Bar -->
      <div class="neural-ai-focal-bar">
        <div class="neural-ai-focal-chip" id="neural-ai-focal-chip">
          <span class="neural-ai-focal-tag">🎯 Tiêu điểm</span>
          <span class="neural-ai-focal-quote" id="neural-ai-focal-quote">Toàn bộ bài ghi chú</span>
        </div>
        <button type="button" class="neural-ai-drawer-btn" id="btn-clear-focal" title="Chọn lại toàn bài">
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>
      </div>

      <!-- Quick Action Chips -->
      <div class="neural-ai-quick-chips">
        <button type="button" class="neural-ai-quick-chip" data-prompt="Giải thích chi tiết đoạn trích này theo bối cảnh toàn bài ghi chú">
          <i class="fa-regular fa-lightbulb"></i> Giải thích chi tiết
        </button>
        <button type="button" class="neural-ai-quick-chip" data-prompt="Hãy cho ví dụ minh họa thực tế dễ hiểu về phần này">
          <i class="fa-solid fa-pen-fancy"></i> Cho ví dụ
        </button>
        <button type="button" class="neural-ai-quick-chip" data-prompt="Chỉ ra các bẫy thi và sai lầm thường gặp mà sinh viên hay mắc ở đoạn này">
          <i class="fa-solid fa-triangle-exclamation"></i> Bẫy thi & Sai lầm
        </button>
        <button type="button" class="neural-ai-quick-chip" data-prompt="Tóm tắt 3 quy tắc bản chất cốt lõi cần nhớ nhất">
          <i class="fa-solid fa-bolt"></i> 3 ý cốt lõi
        </button>
      </div>

      <!-- Chat Body -->
      <div class="neural-ai-chat-body" id="neural-ai-chat-body">
        <!-- Messages will be rendered here -->
      </div>

      <!-- Chat Input Row -->
      <div class="neural-ai-input-row">
        <input type="text" class="neural-ai-input" id="neural-ai-input" placeholder="Hỏi bất kỳ điều gì về đoạn này (Enter để gửi)..." />
        <button type="button" class="neural-ai-send-btn" id="btn-ai-send" title="Gửi câu hỏi">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="neural-notepad-footer">
      <span class="neural-notepad-hint">Tự động gen ra chữ đậm, nghiêng, gạch chân &amp; highlight vàng</span>
      <button type="button" class="neural-btn-save" id="btn-save-neural-notepad">
        <i class="fa-solid fa-floppy-disk"></i> Lưu Ghi Chú
      </button>
    </div>
  `;
}

// ==========================================================================
// 4. CONTROLLER & INSTANCE MANAGEMENT
// ==========================================================================
let currentNotepadEl = null;
let notepadCleanupFns = [];

/**
 * Khởi tạo thanh kéo 3 chấm phân tách (Splitter Resizer) cho Notepad Sidebar
 * @param {HTMLElement} sidebar 
 * @returns {Function} Hàm dọn dẹp khi đóng sidebar
 */
function initSidebarResizer(sidebar) {
  const resizer = sidebar.querySelector('#neural-sidebar-resizer');
  if (!resizer) return () => {};

  // Khôi phục chiều rộng đã lưu trước đó nếu có (chỉ trên màn hình > 768px)
  const savedWidth = localStorage.getItem('schedule_smart_neural_sidebar_width');
  if (savedWidth && window.innerWidth > 768) {
    const parsed = parseInt(savedWidth, 10);
    const minW = Math.max(340, Math.floor(window.innerWidth * 0.25));
    const maxW = Math.min(Math.floor(window.innerWidth * 0.85), window.innerWidth - 180);
    if (!isNaN(parsed) && parsed >= minW && parsed <= maxW) {
      sidebar.style.width = `${parsed}px`;
    }
  }

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (window.innerWidth <= 768) return;

    isDragging = true;
    startX = e.clientX;
    startWidth = sidebar.getBoundingClientRect().width;

    try {
      resizer.setPointerCapture(e.pointerId);
    } catch (err) {}

    sidebar.classList.add('is-resizing');
    document.body.classList.add('neural-resizing-active');
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = startX - e.clientX;
    let newWidth = startWidth + deltaX;

    const minW = Math.max(340, Math.floor(window.innerWidth * 0.25));
    const maxW = Math.min(Math.floor(window.innerWidth * 0.85), window.innerWidth - 180);

    newWidth = Math.max(minW, Math.min(maxW, newWidth));
    sidebar.style.width = `${newWidth}px`;
    if (sidebar.parentNode) {
      sidebar.parentNode.style.setProperty('--neural-sidebar-w', `${Math.round(newWidth)}px`);
    }
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;

    try {
      resizer.releasePointerCapture(e.pointerId);
    } catch (err) {}

    sidebar.classList.remove('is-resizing');
    document.body.classList.remove('neural-resizing-active');

    const finalWidth = Math.round(sidebar.getBoundingClientRect().width);
    if (finalWidth > 0) {
      localStorage.setItem('schedule_smart_neural_sidebar_width', finalWidth);
      if (sidebar.parentNode) {
        sidebar.parentNode.style.setProperty('--neural-sidebar-w', `${finalWidth}px`);
      }
    }
  };

  const onDblClick = () => {
    if (window.innerWidth <= 768) return;
    sidebar.style.transition = 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    const defaultWidth = Math.min(680, Math.max(480, Math.floor(window.innerWidth * 0.5)));
    sidebar.style.width = `${defaultWidth}px`;
    if (sidebar.parentNode) {
      sidebar.parentNode.style.setProperty('--neural-sidebar-w', `${defaultWidth}px`);
    }
    localStorage.setItem('schedule_smart_neural_sidebar_width', defaultWidth);
    setTimeout(() => {
      sidebar.style.transition = '';
    }, 320);
  };

  resizer.addEventListener('pointerdown', onPointerDown);
  resizer.addEventListener('pointermove', onPointerMove);
  resizer.addEventListener('pointerup', onPointerUp);
  resizer.addEventListener('pointercancel', onPointerUp);
  resizer.addEventListener('dblclick', onDblClick);

  return () => {
    resizer.removeEventListener('pointerdown', onPointerDown);
    resizer.removeEventListener('pointermove', onPointerMove);
    resizer.removeEventListener('pointerup', onPointerUp);
    resizer.removeEventListener('pointercancel', onPointerUp);
    resizer.removeEventListener('dblclick', onDblClick);
    document.body.classList.remove('neural-resizing-active');
  };
}

/**
 * Mở bảng Notepad Sidepanel 50% bên phải cho một node nơ-ron
 * @param {HTMLElement} parentContainer - Container cha (thường là .neural-modal-overlay)
 * @param {string} subjectCode - Mã môn học
 * @param {Object} node - Node nơ-ron đang mở ghi chú
 * @param {Function} onSavedCallback - Callback khi ghi chú được lưu
 */
export function openNeuralNotepadSidebar(parentContainer, subjectCode, node, onSavedCallback) {
  closeNeuralNotepadSidebar();

  const sidebar = document.createElement('div');
  sidebar.className = 'neural-notepad-sidebar';
  sidebar.id = 'neural-notepad-sidebar-panel';
  sidebar.innerHTML = renderNotepadTemplate(node);
  parentContainer.appendChild(sidebar);
  currentNotepadEl = sidebar;
  parentContainer.classList.add('has-notepad-sidebar');

  // Khởi tạo tính năng kéo chỉnh độ rộng bằng thanh 3 chấm
  const cleanupResizer = initSidebarResizer(sidebar);
  notepadCleanupFns.push(cleanupResizer);

  // Cập nhật biến độ rộng ban đầu cho CSS responsive của thanh công cụ
  requestAnimationFrame(() => {
    const initialW = Math.round(sidebar.getBoundingClientRect().width);
    if (initialW > 0) {
      parentContainer.style.setProperty('--neural-sidebar-w', `${initialW}px`);
    }
    sidebar.classList.add('active');
  });

  const textarea = sidebar.querySelector('#neural-notepad-textarea');
  const previewContent = sidebar.querySelector('#neural-notepad-preview-content');
  const editPane = sidebar.querySelector('#neural-np-edit-pane');
  const previewPane = sidebar.querySelector('#neural-np-preview-pane');
  const visualPane = sidebar.querySelector('#neural-np-visual-pane');
  const quizPane = sidebar.querySelector('#neural-np-quiz-pane');
  const quizVaultContainer = sidebar.querySelector('#quiz-vault-list-container');
  const btnOpenQuizFromVault = sidebar.querySelector('#btn-open-quiz-from-vault');
  const visualEditor = sidebar.querySelector('#visual-rich-editor');
  const visualImagesLayer = sidebar.querySelector('#visual-images-layer');
  const canvasWrapper = sidebar.querySelector('#visual-note-canvas-wrapper');
  const mdToolbar = sidebar.querySelector('#neural-notepad-toolbar');
  const tabBtns = sidebar.querySelectorAll('.neural-np-tab');
  const saveStatus = sidebar.querySelector('#neural-notepad-save-status');
  const bodyContainer = sidebar.querySelector('#neural-notepad-body-container');
  const undoBtn = sidebar.querySelector('#btn-hist-undo');
  const redoBtn = sidebar.querySelector('#btn-hist-redo');

  // Hàm hủy chọn tất cả các ảnh nổi (ẩn khung viền điều chỉnh, 4 núm co giãn và nút xóa)
  const deselectAllVisualCards = () => {
    sidebar.querySelectorAll('.visual-floating-img-card.active').forEach(c => {
      c.classList.remove('active');
    });
  };

  // ========================================================================
  // UNDO / REDO HISTORY ENGINE CHO MARKDOWN
  // ========================================================================
  const historyStack = [{
    text: textarea.value,
    start: textarea.selectionStart || 0,
    end: textarea.selectionEnd || 0
  }];
  let historyIndex = 0;
  const MAX_HISTORY = 60;

  const updateHistoryButtons = () => {
    if (undoBtn) undoBtn.disabled = (historyIndex <= 0);
    if (redoBtn) redoBtn.disabled = (historyIndex >= historyStack.length - 1);
  };

  const pushHistory = (newText, start, end) => {
    if (historyStack[historyIndex] && historyStack[historyIndex].text === newText) {
      return;
    }
    if (historyIndex < historyStack.length - 1) {
      historyStack.splice(historyIndex + 1);
    }
    historyStack.push({
      text: newText,
      start: typeof start === 'number' ? start : textarea.selectionStart,
      end: typeof end === 'number' ? end : textarea.selectionEnd
    });
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
    } else {
      historyIndex++;
    }
    updateHistoryButtons();
  };

  const doUndo = () => {
    if (historyIndex > 0) {
      historyIndex--;
      const state = historyStack[historyIndex];
      textarea.value = state.text;
      textarea.focus();
      textarea.setSelectionRange(state.start, state.end);
      updateLivePreview();
      updateHistoryButtons();
      debouncedSave();
    }
  };

  const doRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      const state = historyStack[historyIndex];
      textarea.value = state.text;
      textarea.focus();
      textarea.setSelectionRange(state.start, state.end);
      updateLivePreview();
      updateHistoryButtons();
      debouncedSave();
    }
  };

  if (undoBtn) undoBtn.addEventListener('click', doUndo);
  if (redoBtn) redoBtn.addEventListener('click', doRedo);

  textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      doUndo();
      return;
    }
    if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      doRedo();
      return;
    }
  });

  // ========================================================================
  // QUIZ VAULT CONTROLLER & RENDERING
  // ========================================================================
  const updateQuizTabBadge = () => {
    const quizTabBtn = sidebar.querySelector('[data-tab="quiz"]');
    if (quizTabBtn) {
      const count = Array.isArray(node.quizzes) ? node.quizzes.length : 0;
      quizTabBtn.innerHTML = `<i class="fa-solid fa-bullseye"></i> Trắc nghiệm (${count})`;
    }
  };

  const renderQuizVaultList = () => {
    if (!quizVaultContainer) return;
    const quizzes = Array.isArray(node.quizzes) ? node.quizzes : [];

    if (quizzes.length === 0) {
      quizVaultContainer.innerHTML = `
        <div class="quiz-vault-empty">
          <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 2.2rem; color: #f59e0b; margin-bottom: 12px; display: block;"></i>
          <p style="font-weight: 600; color: #f8fafc; margin-bottom: 4px;">Chưa có câu hỏi trắc nghiệm nào được lưu</p>
          <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 16px;">Bấm nút "AI Gen Câu Mới" ở góc trên hoặc icon ✨ ngoài Cây Kiến Thức để bắt đầu khảo hạch.</p>
        </div>
      `;
      return;
    }

    quizVaultContainer.innerHTML = quizzes.map((q, qIdx) => {
      const optionsHtml = (q.options || []).map((opt, oIdx) => {
        const prefix = ['A', 'B', 'C', 'D'][oIdx] || '';
        const cleanOpt = opt.replace(/^[A-D]\.\s*/i, '');
        return `
          <div style="font-size: 0.84rem; padding: 6px 10px; border-radius: 6px; background: rgba(255,255,255,0.025); margin-bottom: 4px; display: flex; gap: 8px;">
            <strong style="color: #f59e0b;">${prefix}.</strong>
            <span style="color: #cbd5e1;">${escapeHtml(cleanOpt)}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="quiz-vault-item-card" data-quiz-id="${q.id}">
          <div class="quiz-vault-item-top">
            <span style="font-size: 0.75rem; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 2px 7px; border-radius: 5px;">
              Câu ${qIdx + 1}
            </span>
            <button type="button" class="quiz-vault-btn-del" data-action="delete-quiz" data-id="${q.id}" title="Xóa câu này">
              <i class="fa-solid fa-trash-can"></i> Xóa
            </button>
          </div>

          <div class="quiz-vault-item-title">${escapeHtml(q.question)}</div>

          <div style="margin: 6px 0;">
            ${optionsHtml}
          </div>

          <details style="margin-top: 6px; font-size: 0.82rem; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
            <summary style="cursor: pointer; font-weight: 600; color: #818cf8; user-select: none;">
              <i class="fa-solid fa-lightbulb"></i> Xem đáp án &amp; Bóc tách bẫy tư duy
            </summary>
            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
              <div style="color: #10b981;">
                <strong>Đáp án đúng:</strong> ${['A', 'B', 'C', 'D'][q.correctIndex]}
              </div>
              <div style="color: #cbd5e1;">
                <strong>💡 Giải thích:</strong> ${escapeHtml(q.explanation || '')}
              </div>
              <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 6px 10px; border-radius: 0 6px 6px 0; color: #fef3c7;">
                <strong style="color: #f59e0b;">⚠️ Bẫy thường gặp:</strong> ${escapeHtml(q.trap || '')}
              </div>
              <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 6px 10px; border-radius: 0 6px 6px 0; color: #d1fae5;">
                <strong style="color: #10b981;">💎 Bản chất cốt lõi:</strong> ${escapeHtml(q.rule || '')}
              </div>
            </div>
          </details>
        </div>
      `;
    }).join('');

    // Gắn sự kiện nút xóa câu
    quizVaultContainer.querySelectorAll('[data-action="delete-quiz"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.dataset.id;
        deleteNeuralNodeQuiz(subjectCode, node.id, qId);
        updateQuizTabBadge();
        renderQuizVaultList();
        if (onSavedCallback) onSavedCallback(node.id, textarea.value);
      });
    });
  };

  if (btnOpenQuizFromVault) {
    btnOpenQuizFromVault.addEventListener('click', () => {
      openNeuralQuizModal(parentContainer, subjectCode, node, () => {
        updateQuizTabBadge();
        renderQuizVaultList();
        if (onSavedCallback) onSavedCallback(node.id, textarea.value);
      });
    });
  }

  // ========================================================================
  // TAB SWITCHING (ĐÃ GEN RA vs SOẠN THẢO vs GHI CHÚ vs TRẮC NGHIỆM)
  // ========================================================================
  const switchViewTab = (tab) => {
    deselectAllVisualCards();
    tabBtns.forEach(b => {
      if (b.dataset.tab === tab) b.classList.add('active');
      else b.classList.remove('active');
    });

    if (tab === 'preview') {
      previewContent.innerHTML = renderMarkdownToHtml(textarea.value);
      if (mdToolbar) mdToolbar.style.display = 'flex';
      editPane.classList.add('hidden');
      if (visualPane) visualPane.classList.add('hidden');
      if (quizPane) quizPane.classList.add('hidden');
      previewPane.classList.remove('hidden');
    } else if (tab === 'visual') {
      if (mdToolbar) mdToolbar.style.display = 'none';
      editPane.classList.add('hidden');
      previewPane.classList.add('hidden');
      if (quizPane) quizPane.classList.add('hidden');
      if (visualPane) visualPane.classList.remove('hidden');
      if (visualEditor) visualEditor.focus();
      setTimeout(updateCanvasWrapperHeight, 60);
    } else if (tab === 'quiz') {
      if (mdToolbar) mdToolbar.style.display = 'none';
      editPane.classList.add('hidden');
      previewPane.classList.add('hidden');
      if (visualPane) visualPane.classList.add('hidden');
      if (quizPane) quizPane.classList.remove('hidden');
      renderQuizVaultList();
    } else {
      if (mdToolbar) mdToolbar.style.display = 'flex';
      previewPane.classList.add('hidden');
      if (visualPane) visualPane.classList.add('hidden');
      if (quizPane) quizPane.classList.add('hidden');
      editPane.classList.remove('hidden');
      textarea.focus();
    }
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchViewTab(btn.dataset.tab);
    });
  });

  const quickEditBtn = sidebar.querySelector('#btn-quick-switch-to-edit');
  if (quickEditBtn) {
    quickEditBtn.addEventListener('click', () => {
      switchViewTab('edit');
    });
  }

  const updateLivePreview = () => {
    if (previewContent) {
      previewContent.innerHTML = renderMarkdownToHtml(textarea.value);
    }
  };

  // ========================================================================
  // TOOLBAR 4 CHỨC NĂNG ĐỊNH DẠNG (B, I, U, HL) CHO MARKDOWN
  // ========================================================================
  sidebar.querySelectorAll('.neural-np-tool-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
  });

  const handleFormat = (prefix, suffix) => {
    applyFormat(sidebar, textarea, previewContent, prefix, suffix, (newText, s, e) => {
      pushHistory(newText, s, e);
      updateLivePreview();
      debouncedSave();
    });
  };

  sidebar.querySelector('#btn-fmt-bold')?.addEventListener('click', () => handleFormat('**', '**'));
  sidebar.querySelector('#btn-fmt-italic')?.addEventListener('click', () => handleFormat('*', '*'));
  sidebar.querySelector('#btn-fmt-underline')?.addEventListener('click', () => handleFormat('<u>', '</u>'));
  sidebar.querySelector('#btn-fmt-highlight')?.addEventListener('click', () => handleFormat('==', '=='));

  // ========================================================================
  // VISUAL CANVAS NOTE: RICH-TEXT & FLOATING OVERLAY IMAGES CONTROLLER
  // ========================================================================
  const visualNotes = node.visualNotes || { html: '', images: [] };
  let currentImages = Array.isArray(visualNotes.images) ? [...visualNotes.images] : [];

  // Tự động tính toán và mở rộng chiều cao tối thiểu cho Canvas Wrapper khi nội dung/ảnh dài xuống dưới
  const updateCanvasWrapperHeight = () => {
    if (!canvasWrapper) return;
    let maxBottom = 650;
    if (visualEditor) {
      maxBottom = Math.max(maxBottom, visualEditor.scrollHeight + 140);
    }
    if (Array.isArray(currentImages) && currentImages.length > 0) {
      currentImages.forEach(img => {
        const bottom = (Number(img.y) || 0) + (Number(img.height) || 0) + 160;
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
      });
    }
    canvasWrapper.style.minHeight = `${maxBottom}px`;
  };

  // Render các ảnh nổi đè lên văn bản
  const renderVisualImages = () => {
    if (!visualImagesLayer) return;
    visualImagesLayer.innerHTML = '';

    currentImages.forEach(imgItem => {
      const card = document.createElement('div');
      card.className = 'visual-floating-img-card';
      card.dataset.id = imgItem.id;
      card.style.left = `${imgItem.x}px`;
      card.style.top = `${imgItem.y}px`;
      card.style.width = `${imgItem.width}px`;

      card.innerHTML = `
        <img src="${imgItem.src}" alt="Note sticker" draggable="false" />
        <button type="button" class="visual-img-btn-delete" title="Xóa ảnh"><i class="fa-solid fa-xmark"></i></button>
        <div class="visual-resize-handle handle-nw" data-handle="nw"></div>
        <div class="visual-resize-handle handle-ne" data-handle="ne"></div>
        <div class="visual-resize-handle handle-se" data-handle="se"></div>
        <div class="visual-resize-handle handle-sw" data-handle="sw"></div>
      `;

      // 1. Nút xóa ảnh
      const delBtn = card.querySelector('.visual-img-btn-delete');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImages = currentImages.filter(i => i.id !== imgItem.id);
        card.remove();

        // Đồng bộ xóa khoảng trống tương ứng trong văn bản nếu có
        if (visualEditor) {
          const relatedGap = visualEditor.querySelector(`.visual-note-img-gap[data-img-id="${imgItem.id}"]`);
          if (relatedGap) relatedGap.remove();
        }

        updateCanvasWrapperHeight();
        saveAllNotes();
      });

      // 2. Kéo thả di chuyển ở tâm / thân ảnh
      card.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('visual-resize-handle') || e.target.closest('.visual-img-btn-delete')) {
          return;
        }

        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initLeft = card.offsetLeft;
        const initTop = card.offsetTop;
        let isDragged = false;

        card.classList.add('dragging');

        const onPointerMove = (moveEvt) => {
          const dx = moveEvt.clientX - startX;
          const dy = moveEvt.clientY - startY;
          if (Math.hypot(dx, dy) > 3) {
            isDragged = true;
          }
          const newX = Math.max(0, initLeft + dx);
          const newY = Math.max(0, initTop + dy);
          card.style.left = `${newX}px`;
          card.style.top = `${newY}px`;
          imgItem.x = newX;
          imgItem.y = newY;
        };

        const onPointerUp = () => {
          card.classList.remove('dragging');
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);

          if (isDragged) {
            // Đã kéo di chuyển rồi thả ra -> tự động ẩn khung chỉnh!
            card.classList.remove('active');
          } else {
            // Chỉ click vào ảnh mà không kéo -> hiện khung chỉnh!
            deselectAllVisualCards();
            card.classList.add('active');
          }

          updateCanvasWrapperHeight();
          saveAllNotes();
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      });

      // 3. Co giãn kích thước ở 4 góc
      const handles = card.querySelectorAll('.visual-resize-handle');
      handles.forEach(handle => {
        handle.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const handleType = handle.dataset.handle;
          const startX = e.clientX;
          const startWidth = card.offsetWidth;
          const startHeight = card.offsetHeight;
          const startLeft = card.offsetLeft;
          const startTop = card.offsetTop;
          const aspectRatio = startWidth / (startHeight || 1);
          let isResized = false;

          const onResizeMove = (moveEvt) => {
            const dx = moveEvt.clientX - startX;
            if (Math.abs(dx) > 2) {
              isResized = true;
            }
            let newWidth = startWidth;

            if (handleType === 'se') {
              newWidth = Math.max(60, startWidth + dx);
            } else if (handleType === 'sw') {
              newWidth = Math.max(60, startWidth - dx);
              const newLeft = startLeft + (startWidth - newWidth);
              card.style.left = `${newLeft}px`;
              imgItem.x = newLeft;
            } else if (handleType === 'ne') {
              newWidth = Math.max(60, startWidth + dx);
              const deltaH = (newWidth - startWidth) / aspectRatio;
              const newTop = startTop - deltaH;
              card.style.top = `${newTop}px`;
              imgItem.y = newTop;
            } else if (handleType === 'nw') {
              newWidth = Math.max(60, startWidth - dx);
              const newLeft = startLeft + (startWidth - newWidth);
              const deltaH = (newWidth - startWidth) / aspectRatio;
              const newTop = startTop - deltaH;
              card.style.left = `${newLeft}px`;
              card.style.top = `${newTop}px`;
              imgItem.x = newLeft;
              imgItem.y = newTop;
            }

            card.style.width = `${newWidth}px`;
            imgItem.width = newWidth;
            imgItem.height = Math.round(newWidth / aspectRatio);
          };

          const onResizeUp = () => {
            window.removeEventListener('pointermove', onResizeMove);
            window.removeEventListener('pointerup', onResizeUp);

            // Kéo co giãn xong rồi thả chuột ra -> tự động ẩn khung chỉnh!
            if (isResized) {
              card.classList.remove('active');
            }

            // Đồng bộ chiều cao khoảng trống trong văn bản
            if (visualEditor) {
              const relatedGap = visualEditor.querySelector(`.visual-note-img-gap[data-img-id="${imgItem.id}"]`);
              if (relatedGap) {
                relatedGap.style.height = `${imgItem.height + 20}px`;
              }
            }

            updateCanvasWrapperHeight();
            saveAllNotes();
          };

          window.addEventListener('pointermove', onResizeMove);
          window.addEventListener('pointerup', onResizeUp);
        });
      });

      visualImagesLayer.appendChild(card);
    });
  };

  renderVisualImages();
  setTimeout(updateCanvasWrapperHeight, 80);

  // 4. Lắng nghe click/pointerdown ra vùng ngoài card để tự động hủy chọn (ẩn khung viền & núm chỉnh)
  const onOutsidePointerDown = (e) => {
    if (e.target && e.target.closest && e.target.closest('.visual-floating-img-card')) {
      return;
    }
    deselectAllVisualCards();
  };

  // 5. Lắng nghe phím Escape để hủy chọn card
  const onGlobalKeyDown = (e) => {
    if (e.key === 'Escape') {
      deselectAllVisualCards();
    }
  };

  document.addEventListener('pointerdown', onOutsidePointerDown, true);
  document.addEventListener('click', onOutsidePointerDown, true);
  document.addEventListener('keydown', onGlobalKeyDown);

  notepadCleanupFns.push(() => {
    document.removeEventListener('pointerdown', onOutsidePointerDown, true);
    document.removeEventListener('click', onOutsidePointerDown, true);
    document.removeEventListener('keydown', onGlobalKeyDown);
  });

  // Tự động ẩn khung chỉnh khi người dùng click hoặc focus vào soạn thảo văn bản
  if (visualEditor) {
    visualEditor.addEventListener('focus', deselectAllVisualCards);
    visualEditor.addEventListener('pointerdown', deselectAllVisualCards);
    visualEditor.addEventListener('click', deselectAllVisualCards);
  }

  // ========================================================================
  // SELECTION & CARET TRACKING ENGINE
  // ========================================================================
  let lastVisualRange = null; // Vùng chọn bôi đen text (format B, I, U, HL)
  let lastCaretRange = null;  // Vị trí con nháy chuột gõ chữ (dán ảnh tại chỗ)

  const trackVisualSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (visualEditor && visualEditor.contains(r.commonAncestorContainer)) {
        lastCaretRange = r.cloneRange();
        if (!sel.isCollapsed) {
          lastVisualRange = r.cloneRange();
        }
      }
    }
  };

  if (visualEditor) {
    visualEditor.addEventListener('mouseup', trackVisualSelection);
    visualEditor.addEventListener('keyup', trackVisualSelection);
    visualEditor.addEventListener('touchend', trackVisualSelection);
    visualEditor.addEventListener('click', trackVisualSelection);
    visualEditor.addEventListener('input', trackVisualSelection);
    document.addEventListener('selectionchange', trackVisualSelection);
  }

  // Đo toạ độ pixel tương đối của con nháy so với container
  const getCaretTargetPosition = (range, containerEl) => {
    if (!range || !containerEl) return null;
    try {
      let rect = range.getBoundingClientRect();

      // Nếu con nháy ở dòng trống hoặc rect rỗng
      if (!rect || (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)) {
        const dummy = document.createElement('span');
        dummy.textContent = '\u200b'; // Zero-width space
        const clone = range.cloneRange();
        clone.insertNode(dummy);
        rect = dummy.getBoundingClientRect();
        if (dummy.parentNode) {
          dummy.parentNode.removeChild(dummy);
        }
      }

      const containerRect = containerEl.getBoundingClientRect();
      return {
        x: Math.round(rect.left - containerRect.left),
        y: Math.round(rect.top - containerRect.top),
        bottom: Math.round(rect.bottom - containerRect.top),
        height: Math.round(rect.height || 24)
      };
    } catch (err) {
      console.warn('Lỗi đo toạ độ con nháy:', err);
      return null;
    }
  };

  // Hàm nạp file ảnh vào Canvas (Nén WebP & Upload Firebase Cloud Storage)
  const handleImageFile = async (file) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return;

    if (saveStatus) {
      saveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang nén & tối ưu ảnh...';
    }

    try {
      // 1. Nén ảnh thông minh sang WebP (giảm 95% dung lượng)
      const compressed = await compressImage(file, 1280, 1280, 0.82);
      const naturalW = compressed.width || 300;
      const naturalH = compressed.height || 200;
      const width = Math.min(320, naturalW);
      const height = Math.round(width * (naturalH / naturalW));
      const wrapperW = canvasWrapper ? canvasWrapper.clientWidth : 400;

      // 2. Xác định vị trí con nháy chuột hiện tại
      let activeRange = null;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && visualEditor && visualEditor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        activeRange = sel.getRangeAt(0).cloneRange();
      } else if (lastCaretRange && visualEditor && visualEditor.contains(lastCaretRange.commonAncestorContainer)) {
        activeRange = lastCaretRange.cloneRange();
      }

      const caret = getCaretTargetPosition(activeRange, canvasWrapper);
      let targetX = Math.max(20, Math.round((wrapperW - width) / 2));
      let targetY = Math.max(20, (visualPane ? visualPane.scrollTop : 0) + 40);

      if (caret && caret.bottom >= 0) {
        // Xuất hiện chuẩn xác ngay bên dưới vị trí con nháy chuột hiện tại!
        targetX = Math.max(20, Math.min(caret.x > 30 ? caret.x : targetX, wrapperW - width - 20));
        targetY = caret.bottom + 10;
      }

      // 3. Hiển thị tức thì cho người dùng bằng dataUrl WebP siêu nhẹ
      const tempImgId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newImg = {
        id: tempImgId,
        src: compressed.dataUrl,
        x: targetX,
        y: targetY,
        width,
        height
      };

      // Chèn khoảng trống nhường chỗ cho ảnh trong editor
      if (activeRange && visualEditor && visualEditor.contains(activeRange.commonAncestorContainer)) {
        try {
          const gap = document.createElement('div');
          gap.className = 'visual-note-img-gap';
          gap.setAttribute('data-img-id', newImg.id);
          gap.setAttribute('contenteditable', 'false');
          gap.style.height = `${height + 20}px`;

          const nextLine = document.createElement('div');
          nextLine.innerHTML = '<br>';

          activeRange.collapse(false);
          activeRange.insertNode(nextLine);
          activeRange.insertNode(gap);

          if (sel) {
            const newRange = document.createRange();
            newRange.setStart(nextLine, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            lastCaretRange = newRange.cloneRange();
          }
        } catch (err) {
          console.warn('Lỗi chèn khoảng cách dưới ảnh:', err);
        }
      }

      currentImages.push(newImg);
      renderVisualImages();

      // Cuộn tới ảnh vừa chèn
      const newCard = visualImagesLayer.querySelector(`[data-id="${newImg.id}"]`);
      if (newCard) {
        deselectAllVisualCards();
        newCard.classList.add('active');
        setTimeout(() => {
          newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 40);
      }

      if (visualEditor) {
        visualEditor.focus();
      }

      updateCanvasWrapperHeight();
      saveAllNotes();

      // 4. BẬT UPLOAD CLOUD TRONG NỀN: Tải ảnh lên Firebase Storage để đồng bộ đa thiết bị
      if (saveStatus) {
        saveStatus.innerHTML = '<i class="fa-solid fa-cloud-arrow-up fa-bounce"></i> Đang tải lên Cloud...';
      }
      uploadNoteImageToStorage(compressed.blob, 'visual_note').then(cloudUrl => {
        if (cloudUrl) {
          // Thay thế dataUrl bằng Cloud Storage URL vĩnh viễn!
          newImg.src = cloudUrl;
          const renderedImgTag = visualImagesLayer ? visualImagesLayer.querySelector(`[data-id="${newImg.id}"] img`) : null;
          if (renderedImgTag) {
            renderedImgTag.src = cloudUrl;
          }
          saveAllNotes();
          if (saveStatus) {
            saveStatus.innerHTML = '<i class="fa-solid fa-cloud"></i> Đã đồng bộ Cloud!';
          }
        }
      }).catch(e => {
        console.warn('Upload Firebase Storage bỏ qua, giữ WebP nén:', e);
      });

    } catch (err) {
      console.error('Lỗi nén và xử lý ảnh:', err);
    }
  };

  // Lắng nghe Ctrl + V dán ảnh từ Clipboard
  sidebar.addEventListener('paste', (e) => {
    if (visualPane && !visualPane.classList.contains('hidden')) {
      const items = (e.clipboardData || window.clipboardData)?.items;
      if (items) {
        for (let item of items) {
          if (item.type && item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            handleImageFile(blob);
            return;
          }
        }
      }
    }
  });

  // Chọn ảnh từ máy tính
  const fileInput = sidebar.querySelector('#vis-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
        e.target.value = '';
      }
    });
  }

  // Hàm khôi phục hoặc lấy vùng chọn hiện thời trong visualEditor
  const getOrRestoreVisualRange = () => {
    if (!visualEditor) return null;
    visualEditor.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const r = sel.getRangeAt(0);
      if (visualEditor.contains(r.commonAncestorContainer)) {
        return r;
      }
    }
    if (lastVisualRange && !lastVisualRange.collapsed) {
      if (visualEditor.contains(lastVisualRange.commonAncestorContainer)) {
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(lastVisualRange);
        }
        return lastVisualRange;
      }
    }
    return null;
  };

  // Toolbar Formatting cho Visual Note: Chặn mousedown trên toàn bộ tool/dots để không mất vùng chọn text
  const visToolbar = sidebar.querySelector('#neural-visual-toolbar');
  if (visToolbar) {
    visToolbar.querySelectorAll('.neural-np-tool-btn, .visual-paste-btn, .visual-color-dot').forEach(btn => {
      btn.addEventListener('mousedown', (e) => e.preventDefault());
    });
  }

  sidebar.querySelector('#btn-vis-bold')?.addEventListener('click', () => {
    visualEditor?.focus();
    document.execCommand('bold', false, null);
    saveAllNotes();
  });
  sidebar.querySelector('#btn-vis-italic')?.addEventListener('click', () => {
    visualEditor?.focus();
    document.execCommand('italic', false, null);
    saveAllNotes();
  });
  sidebar.querySelector('#btn-vis-underline')?.addEventListener('click', () => {
    visualEditor?.focus();
    document.execCommand('underline', false, null);
    saveAllNotes();
  });
  sidebar.querySelector('#btn-vis-undo')?.addEventListener('click', () => {
    visualEditor?.focus();
    document.execCommand('undo', false, null);
    saveAllNotes();
  });
  // Hàm unwrap/gỡ bỏ thẻ highlight
  const unwrapHighlightNode = (markNode) => {
    if (!markNode || !markNode.parentNode) return;
    const parent = markNode.parentNode;
    while (markNode.firstChild) {
      parent.insertBefore(markNode.firstChild, markNode);
    }
    parent.removeChild(markNode);
    parent.normalize();
  };

  sidebar.querySelector('#btn-vis-highlight')?.addEventListener('click', () => {
    const range = getOrRestoreVisualRange();
    if (!range || range.collapsed) return;
    try {
      // Kiểm tra nếu vùng chọn nằm trong hoặc bọc thẻ neural-highlight
      let existingMark = null;
      let curr = range.commonAncestorContainer;
      while (curr && curr !== visualEditor) {
        if (curr.nodeType === 1 && curr.classList.contains('neural-highlight')) {
          existingMark = curr;
          break;
        }
        curr = curr.parentNode;
      }

      if (existingMark) {
        unwrapHighlightNode(existingMark);
      } else {
        const mark = document.createElement('mark');
        mark.className = 'neural-highlight';
        mark.appendChild(range.extractContents());
        range.insertNode(mark);

        const sel = window.getSelection();
        const newRange = document.createRange();
        newRange.selectNodeContents(mark);
        sel.removeAllRanges();
        sel.addRange(newRange);
        lastVisualRange = newRange.cloneRange();
      }
    } catch (e) {
      console.warn('Highlight error:', e);
    }
    saveAllNotes();
  });

  // Đổi cỡ chữ
  const fontSizeSelect = sidebar.querySelector('#vis-font-size');
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', (e) => {
      const size = e.target.value;
      const range = getOrRestoreVisualRange();
      if (range && !range.collapsed) {
        try {
          const span = document.createElement('span');
          span.style.fontSize = size;
          span.appendChild(range.extractContents());
          range.insertNode(span);

          const sel = window.getSelection();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          sel.removeAllRanges();
          sel.addRange(newRange);
          lastVisualRange = newRange.cloneRange();
        } catch (err) {
          console.warn('Font size error:', err);
        }
        saveAllNotes();
      }
    });
  }

  // Đổi màu chữ (Áp dụng cho văn bản đang bôi đen HOẶC thiết lập màu gõ tiếp theo)
  const applyTextColor = (color) => {
    if (!visualEditor) return;
    const range = getOrRestoreVisualRange();

    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (e) {}

    if (range && !range.collapsed) {
      // 1. Trường hợp có văn bản đang được bôi đen
      const success = document.execCommand('foreColor', false, color);
      if (!success) {
        try {
          const span = document.createElement('span');
          span.style.color = color;
          span.appendChild(range.extractContents());
          range.insertNode(span);

          const sel = window.getSelection();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          sel.removeAllRanges();
          sel.addRange(newRange);
          lastVisualRange = newRange.cloneRange();
        } catch (domErr) {
          console.warn('Fallback span color error:', domErr);
        }
      }
    } else {
      // 2. Trường hợp con trỏ đang nhấp nháy (không bôi đen): Đặt màu để gõ chữ tiếp theo
      visualEditor.focus();
      document.execCommand('foreColor', false, color);
    }

    saveAllNotes();
  };

  const colorDots = sidebar.querySelectorAll('.visual-color-dot');
  colorDots.forEach(dot => {
    dot.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Giữ nguyên vùng chọn bôi đen text
    });

    dot.addEventListener('click', (e) => {
      e.preventDefault();
      colorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const color = dot.dataset.color;
      applyTextColor(color);
    });
  });

  if (visualEditor) {
    visualEditor.addEventListener('input', () => {
      updateCanvasWrapperHeight();
      debouncedSave();
    });
  }

  // ========================================================================
  // AUTO-SAVE ENGINE & DEBOUNCE
  // ========================================================================
  const saveAllNotes = () => {
    const newNotes = textarea.value;
    const newVisualNotes = {
      html: visualEditor ? visualEditor.innerHTML : (node.visualNotes?.html || ''),
      images: currentImages
    };

    updateNeuralNode(subjectCode, node.id, { 
      notes: newNotes,
      visualNotes: newVisualNotes
    });
    node.notes = newNotes;
    node.visualNotes = newVisualNotes;

    if (saveStatus) {
      saveStatus.innerHTML = '<i class="fa-solid fa-check"></i> Đã lưu thành công!';
      saveStatus.classList.add('saved');
      setTimeout(() => {
        if (saveStatus) {
          saveStatus.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Đã đồng bộ';
          saveStatus.classList.remove('saved');
        }
      }, 2000);
    }

    if (onSavedCallback) onSavedCallback(node.id, newNotes);
  };

  let debounceTimer = null;
  const debouncedSave = () => {
    if (saveStatus) {
      saveStatus.innerHTML = '<i class="fa-solid fa-pen-nib"></i> Đang chỉnh sửa...';
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveAllNotes, 1200);
  };

  sidebar.querySelector('#btn-save-neural-notepad').addEventListener('click', saveAllNotes);

  let historyDebounce = null;
  textarea.addEventListener('input', () => {
    updateLivePreview();
    debouncedSave();

    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => {
      pushHistory(textarea.value, textarea.selectionStart, textarea.selectionEnd);
    }, 450);
  });

  // ========================================================================
  // FLOATING UNHIGHLIGHT BADGE (HOVER ĐỂ HIỆN DẤU BỎ HIGHLIGHT)
  // ========================================================================
  let unhighlightBadge = document.querySelector('.neural-unhighlight-badge');
  if (!unhighlightBadge) {
    unhighlightBadge = document.createElement('div');
    unhighlightBadge.className = 'neural-unhighlight-badge';
    unhighlightBadge.innerHTML = '<i class="fa-solid fa-xmark"></i> Bỏ highlight';
    document.body.appendChild(unhighlightBadge);
  }

  let activeHighlightEl = null;
  let hideBadgeTimeout = null;

  const positionBadge = (markEl) => {
    if (!unhighlightBadge || !markEl) return;
    clearTimeout(hideBadgeTimeout);
    activeHighlightEl = markEl;

    unhighlightBadge.classList.add('visible');
    const markRect = markEl.getBoundingClientRect();
    const badgeRect = unhighlightBadge.getBoundingClientRect();

    // Căn giữa phía trên đoạn text highlight
    let top = markRect.top - badgeRect.height - 7;
    let left = markRect.left + (markRect.width - badgeRect.width) / 2;

    // Nếu sát mép trên màn hình (< 10px) thì hiện phía dưới text
    if (top < 10) {
      top = markRect.bottom + 7;
    }
    // Giữ badge không tràn mép màn hình
    if (left < 10) left = 10;
    if (left + badgeRect.width > window.innerWidth - 10) {
      left = window.innerWidth - badgeRect.width - 10;
    }

    unhighlightBadge.style.top = `${Math.round(top)}px`;
    unhighlightBadge.style.left = `${Math.round(left)}px`;
  };

  const scheduleHideBadge = () => {
    clearTimeout(hideBadgeTimeout);
    hideBadgeTimeout = setTimeout(() => {
      if (unhighlightBadge) {
        unhighlightBadge.classList.remove('visible');
      }
      activeHighlightEl = null;
    }, 200);
  };

  const hideBadgeImmediately = () => {
    clearTimeout(hideBadgeTimeout);
    if (unhighlightBadge) {
      unhighlightBadge.classList.remove('visible');
    }
    activeHighlightEl = null;
  };

  const onBodyMouseOver = (e) => {
    const markEl = e.target.closest('.neural-highlight');
    if (markEl) {
      positionBadge(markEl);
    }
  };

  const onBodyMouseOut = (e) => {
    const markEl = e.target.closest('.neural-highlight');
    if (markEl) {
      scheduleHideBadge();
    }
  };

  if (bodyContainer) {
    bodyContainer.addEventListener('mouseover', onBodyMouseOver);
    bodyContainer.addEventListener('mouseout', onBodyMouseOut);
  }

  const onBadgeMouseEnter = () => {
    clearTimeout(hideBadgeTimeout);
  };
  const onBadgeMouseLeave = () => {
    scheduleHideBadge();
  };

  unhighlightBadge.addEventListener('mouseenter', onBadgeMouseEnter);
  unhighlightBadge.addEventListener('mouseleave', onBadgeMouseLeave);

  const onBadgeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeHighlightEl) return;

    // 1. Nếu thẻ mark nằm trong Visual Editor
    if (visualEditor && visualEditor.contains(activeHighlightEl)) {
      unwrapHighlightNode(activeHighlightEl);
      saveAllNotes();
    }
    // 2. Nếu thẻ mark nằm trong Markdown Preview
    else if (previewContent && previewContent.contains(activeHighlightEl)) {
      const targetText = activeHighlightEl.textContent;
      if (targetText && textarea) {
        const raw = textarea.value;
        const pattern1 = `==${targetText}==`;
        const pattern2 = `<mark class="neural-highlight">${targetText}</mark>`;
        const pattern3 = `<mark>${targetText}</mark>`;

        if (raw.includes(pattern1)) {
          textarea.value = raw.replace(pattern1, targetText);
        } else if (raw.includes(pattern2)) {
          textarea.value = raw.replace(pattern2, targetText);
        } else if (raw.includes(pattern3)) {
          textarea.value = raw.replace(pattern3, targetText);
        } else {
          const escaped = targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`==(${escaped})==`, 'g');
          textarea.value = raw.replace(regex, '$1');
        }
        updateLivePreview();
        saveAllNotes();
      }
    }

    hideBadgeImmediately();
  };

  unhighlightBadge.addEventListener('click', onBadgeClick);

  const onScrollHide = () => hideBadgeImmediately();
  window.addEventListener('scroll', onScrollHide, true);
  sidebar.addEventListener('scroll', onScrollHide, true);
  if (visualPane) visualPane.addEventListener('scroll', onScrollHide, true);
  if (previewPane) previewPane.addEventListener('scroll', onScrollHide, true);

  notepadCleanupFns.push(() => {
    hideBadgeImmediately();
    window.removeEventListener('scroll', onScrollHide, true);
    sidebar.removeEventListener('scroll', onScrollHide, true);
    if (visualPane) visualPane.removeEventListener('scroll', onScrollHide, true);
    if (previewPane) previewPane.removeEventListener('scroll', onScrollHide, true);
    if (bodyContainer) {
      bodyContainer.removeEventListener('mouseover', onBodyMouseOver);
      bodyContainer.removeEventListener('mouseout', onBodyMouseOut);
    }
    unhighlightBadge.removeEventListener('mouseenter', onBadgeMouseEnter);
    unhighlightBadge.removeEventListener('mouseleave', onBadgeMouseLeave);
    unhighlightBadge.removeEventListener('click', onBadgeClick);
    if (unhighlightBadge.parentNode) {
      unhighlightBadge.parentNode.removeChild(unhighlightBadge);
    }
  });

  // ========================================================================
  // 12. CONTEXTUAL AI COPILOT & FLOATING SELECTION PILL CONTROLLER
  // ========================================================================
  const aiDrawer = sidebar.querySelector('#neural-ai-copilot-drawer');
  const btnCloseAiDrawer = sidebar.querySelector('#btn-close-ai-drawer');
  const btnMinimizeAiDrawer = sidebar.querySelector('#btn-minimize-ai-drawer');
  const btnClearFocal = sidebar.querySelector('#btn-clear-focal');
  const focalQuoteEl = sidebar.querySelector('#neural-ai-focal-quote');
  const aiChatBody = sidebar.querySelector('#neural-ai-chat-body');
  const aiInput = sidebar.querySelector('#neural-ai-input');
  const btnAiSend = sidebar.querySelector('#btn-ai-send');
  const quickChips = sidebar.querySelectorAll('.neural-ai-quick-chip');
  const btnToggleAiCopilot = sidebar.querySelector('#btn-toggle-ai-copilot');
  const drawerHeader = sidebar.querySelector('#neural-ai-drawer-header');

  // Khởi tạo Floating Selection Pill gắn vào document.body để không bao giờ bị cắt xén (overflow clip)
  const selectionPill = document.createElement('button');
  selectionPill.type = 'button';
  selectionPill.className = 'neural-ai-selection-pill';
  selectionPill.id = 'neural-ai-selection-pill';
  selectionPill.title = 'Hỏi AI giải thích đoạn trích này';
  selectionPill.innerHTML = `
    <span class="neural-ai-pill-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
    <span class="neural-ai-pill-text">Hỏi AI về đoạn này</span>
  `;
  document.body.appendChild(selectionPill);

  let currentFocalText = '';
  let aiChatHistory = [];
  let isAiGenerating = false;
  let selectionDebounceTimer = null;
  let lastMouseCoord = { x: 0, y: 0 };

  // Theo dõi tọa độ con trỏ chuột bên trong sidebar
  const onSidebarMouseMove = (e) => {
    lastMouseCoord.x = e.clientX;
    lastMouseCoord.y = e.clientY;
  };
  sidebar.addEventListener('mousemove', onSidebarMouseMove);

  const hideSelectionPill = () => {
    if (selectionPill) {
      selectionPill.classList.remove('visible');
    }
  };

  const showSelectionPillAt = (x, y, text) => {
    if (!selectionPill || !text || text.length < 2) return;
    currentFocalText = text.trim();

    const pillW = 190;
    const pillH = 36;
    let posX = x - pillW / 2;
    let posY = y - pillH - 12;

    if (posX < 12) posX = 12;
    if (posX + pillW > window.innerWidth - 12) posX = window.innerWidth - pillW - 12;
    if (posY < 12) posY = y + 24;

    selectionPill.style.left = `${Math.round(posX)}px`;
    selectionPill.style.top = `${Math.round(posY)}px`;
    selectionPill.classList.add('visible');
  };

  // Kiểm tra sự kiện bôi đen trong Preview, Visual Editor hoặc Textarea
  const checkTextSelection = () => {
    // 1. Selection trong DOM (Preview Content hoặc Visual Editor)
    const domSel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection() : null;
    if (domSel && !domSel.isCollapsed && domSel.rangeCount > 0) {
      const anchor = domSel.anchorNode;
      // Bỏ qua nếu đang bôi đen bên trong chính AI Copilot Drawer
      if (aiDrawer && anchor && aiDrawer.contains(anchor)) {
        return;
      }

      const domText = domSel.toString().trim();
      if (domText && domText.length >= 2) {
        const isInPreview = previewContent && previewContent.contains(anchor);
        const isInVisual = visualEditor && visualEditor.contains(anchor);

        if (isInPreview || isInVisual) {
          try {
            const range = domSel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
              showSelectionPillAt(rect.left + rect.width / 2, rect.top, domText);
              return;
            }
          } catch (err) {}
        }
      }
    }

    // 2. Selection trong Textarea Markdown
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const selText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
      if (selText && selText.length >= 2) {
        showSelectionPillAt(lastMouseCoord.x || (sidebar.getBoundingClientRect().left + 150), lastMouseCoord.y || 200, selText);
        return;
      }
    }

    hideSelectionPill();
  };

  const onSelectionEvent = () => {
    clearTimeout(selectionDebounceTimer);
    selectionDebounceTimer = setTimeout(checkTextSelection, 130);
  };

  document.addEventListener('selectionchange', onSelectionEvent);
  sidebar.addEventListener('mouseup', onSelectionEvent);
  sidebar.addEventListener('keyup', onSelectionEvent);

  // Mở AI Copilot Drawer
  const openAiCopilot = (focalSnippet = '') => {
    hideSelectionPill();
    if (focalSnippet && typeof focalSnippet === 'string') {
      currentFocalText = focalSnippet.trim();
    }
    if (!currentFocalText) {
      const sampleText = (textarea.value || node.notes || '').trim();
      currentFocalText = sampleText.slice(0, 160);
    }

    // Cập nhật tiêu điểm hiển thị
    if (focalQuoteEl) {
      const displayQuote = currentFocalText.length > 55
        ? `"${currentFocalText.slice(0, 55)}..."`
        : `"${currentFocalText || 'Toàn bộ bài ghi chú'}"`;
      focalQuoteEl.textContent = displayQuote;
      focalQuoteEl.title = currentFocalText || 'Toàn bộ bài ghi chú';
    }

    if (aiDrawer) {
      aiDrawer.classList.remove('minimized');
      aiDrawer.classList.add('active');
    }

    // Nếu chưa có tin nhắn nào, render lời chào mở đầu
    if (aiChatBody && aiChatBody.children.length === 0) {
      renderAiWelcomeMsg();
    }

    if (aiInput) {
      setTimeout(() => aiInput.focus(), 160);
    }
  };

  const renderAiWelcomeMsg = () => {
    if (!aiChatBody) return;
    aiChatBody.innerHTML = `
      <div class="neural-ai-msg model">
        <div class="neural-ai-bubble">
          <p>👋 <strong>Chào bạn!</strong> Mình là Trợ lý Học tập AI Copilot của môn học.</p>
          <p>Mình đã nạp <strong>toàn bộ nội dung bài ghi chú "${escapeHtml(node.label || 'này')}"</strong> để hiểu sâu ngữ cảnh. Hãy chọn các nút gợi ý nhanh ở trên hoặc gõ câu hỏi thắc mắc về đoạn trích nhé!</p>
        </div>
      </div>
    `;
  };

  // Ngăn chặn sự kiện click vào pill làm mất selection
  selectionPill.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  selectionPill.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openAiCopilot(currentFocalText);
  });

  // Nút AI Copilot trên Header Tabs
  if (btnToggleAiCopilot) {
    btnToggleAiCopilot.addEventListener('click', () => {
      if (aiDrawer && aiDrawer.classList.contains('active')) {
        aiDrawer.classList.toggle('minimized');
      } else {
        openAiCopilot();
      }
    });
  }

  // Thu nhỏ / Đóng Drawer
  if (btnCloseAiDrawer) {
    btnCloseAiDrawer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (aiDrawer) {
        aiDrawer.classList.remove('active');
        aiDrawer.classList.remove('minimized');
      }
    });
  }

  if (btnMinimizeAiDrawer) {
    btnMinimizeAiDrawer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (aiDrawer) {
        aiDrawer.classList.toggle('minimized');
      }
    });
  }

  if (drawerHeader) {
    drawerHeader.addEventListener('click', (e) => {
      if (e.target.closest('.neural-ai-drawer-btn')) return;
      if (aiDrawer) {
        aiDrawer.classList.toggle('minimized');
      }
    });
  }

  // Nút chọn lại toàn bài (reset focal)
  if (btnClearFocal) {
    btnClearFocal.addEventListener('click', () => {
      currentFocalText = '';
      if (focalQuoteEl) {
        focalQuoteEl.textContent = 'Toàn bộ bài ghi chú';
        focalQuoteEl.title = 'Toàn bộ bài ghi chú';
      }
      showToast('Đã chuyển tiêu điểm sang: Toàn bộ bài ghi chú');
    });
  }

  // ========================================================================
  // TIỆN ÍCH TRÍCH XUẤT ẢNH CHO GEMINI MULTIMODAL VISION
  // ========================================================================
  const extractImageBase64WithCrop = async (imgEl, cropRect = null) => {
    try {
      if (!imgEl) return null;

      // Nếu không cần crop và đã là Data URL
      if (!cropRect && typeof imgEl.src === 'string' && imgEl.src.startsWith('data:image/')) {
        const parts = imgEl.src.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        return {
          mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg',
          base64: parts[1],
          dataUrl: imgEl.src
        };
      }

      const natW = imgEl.naturalWidth || imgEl.width || 400;
      const natH = imgEl.naturalHeight || imgEl.height || 300;
      if (natW <= 0 || natH <= 0) return null;

      let sx = 0;
      let sy = 0;
      let sWidth = natW;
      let sHeight = natH;

      if (cropRect) {
        const iRect = imgEl.getBoundingClientRect();
        const ix = Math.max(cropRect.left, iRect.left);
        const iy = Math.max(cropRect.top, iRect.top);
        const iw = Math.min(cropRect.right, iRect.right) - ix;
        const ih = Math.min(cropRect.bottom, iRect.bottom) - iy;

        if (iw > 10 && ih > 10 && iRect.width > 0 && iRect.height > 0) {
          const scaleX = natW / iRect.width;
          const scaleY = natH / iRect.height;
          sx = Math.max(0, (ix - iRect.left) * scaleX);
          sy = Math.max(0, (iy - iRect.top) * scaleY);
          sWidth = Math.min(natW - sx, iw * scaleX);
          sHeight = Math.min(natH - sy, ih * scaleY);
        }
      }

      // Giới hạn max dimension để phản hồi AI siêu tốc và tiết kiệm token (tối đa 1024px)
      const MAX_DIM = 1024;
      let targetW = sWidth;
      let targetH = sHeight;
      if (targetW > MAX_DIM || targetH > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
        targetW = Math.max(1, Math.round(targetW * ratio));
        targetH = Math.max(1, Math.round(targetH * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(targetW));
      canvas.height = Math.max(1, Math.round(targetH));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgEl, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      return {
        mimeType: 'image/jpeg',
        base64: dataUrl.split(',')[1],
        dataUrl
      };
    } catch (err) {
      console.warn('Canvas export failed (likely CORS on external image):', err);
      if (typeof imgEl.src === 'string' && imgEl.src.startsWith('data:image/')) {
        const parts = imgEl.src.split(',');
        return {
          mimeType: 'image/jpeg',
          base64: parts[1],
          dataUrl: imgEl.src
        };
      }
      return null;
    }
  };

  // Xử lý gửi câu hỏi cho AI
  const sendAiQuestion = async (customPrompt = '') => {
    const question = (customPrompt || (aiInput ? aiInput.value : '')).trim();
    if (!question || isAiGenerating) return;

    if (aiInput) aiInput.value = '';
    isAiGenerating = true;
    if (btnAiSend) btnAiSend.disabled = true;

    // 1. Thêm tin nhắn của sinh viên
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'neural-ai-msg user';
    userMsgEl.innerHTML = `<div class="neural-ai-bubble">${escapeHtml(question)}</div>`;
    aiChatBody.appendChild(userMsgEl);

    // 2. Thêm loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'neural-ai-loading';
    loadingEl.innerHTML = `
      <span>Gemini đang quan sát bài học và suy luận</span>
      <div class="neural-ai-loading-dots">
        <div class="neural-ai-loading-dot"></div>
        <div class="neural-ai-loading-dot"></div>
        <div class="neural-ai-loading-dot"></div>
      </div>
    `;
    aiChatBody.appendChild(loadingEl);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    // 3. Chuẩn bị ngữ cảnh toàn bài và gọi Gemini
    try {
      const fullNoteText = [
        textarea ? textarea.value : (node.notes || ''),
        visualEditor ? visualEditor.innerText : (node.visualNotes?.html?.replace(/<[^>]*>/g, ' ') || '')
      ].filter(Boolean).join('\n\n');

      const allNodes = getSubjectKnowledgeNodes(subjectCode);

      // Tự động thu thập hình ảnh bài ghi chú nếu bài có ảnh / thuần ảnh (Multimodal Vision)
      let docImages = [];
      const noteImgs = Array.from(sidebar.querySelectorAll('.visual-pane img, .preview-pane img, #neural-canvas-wrapper img'));
      if (noteImgs.length > 0) {
        for (const imgEl of noteImgs.slice(0, 3)) {
          const imgData = await extractImageBase64WithCrop(imgEl, null);
          if (imgData) docImages.push(imgData);
        }
      }

      const res = await askContextualNoteQuestion({
        subjectCode,
        targetNode: node,
        allNodes,
        fullContext: fullNoteText,
        focalText: currentFocalText || fullNoteText.slice(0, 160),
        focalImages: docImages,
        userQuestion: question,
        chatHistory: aiChatHistory
      });

      if (loadingEl.parentNode) loadingEl.remove();

      // Render bong bóng tin nhắn của AI
      const aiMsgEl = document.createElement('div');
      aiMsgEl.className = 'neural-ai-msg model';

      const formattedHtml = renderMarkdownToHtml(res.text);
      aiMsgEl.innerHTML = `
        <div class="neural-ai-bubble">
          ${formattedHtml}
        </div>
        <div class="neural-ai-msg-actions">
          <button type="button" class="neural-ai-action-btn copy-btn" title="Sao chép câu trả lời">
            <i class="fa-regular fa-copy"></i> Sao chép
          </button>
          <button type="button" class="neural-ai-action-btn insert-btn" title="Chèn trực tiếp vào bài ghi chú">
            <i class="fa-solid fa-file-circle-plus"></i> Chèn vào ghi chú
          </button>
        </div>
      `;

      // Nút sao chép
      const copyBtn = aiMsgEl.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(res.text).then(() => {
          showToast('Đã sao chép câu trả lời vào Clipboard!');
        });
      });

      // Nút chèn vào ghi chú
      const insertBtn = aiMsgEl.querySelector('.insert-btn');
      insertBtn.addEventListener('click', () => {
        insertAiAnswerIntoNote(res.text);
      });

      aiChatBody.appendChild(aiMsgEl);
      aiChatBody.scrollTop = aiChatBody.scrollHeight;

      // Lưu lại lịch sử hội thoại nhiều lượt
      aiChatHistory.push(
        { role: 'user', text: question },
        { role: 'model', text: res.text }
      );

    } catch (err) {
      if (loadingEl.parentNode) loadingEl.remove();
      const errEl = document.createElement('div');
      errEl.className = 'neural-ai-msg model';
      errEl.innerHTML = `
        <div class="neural-ai-bubble" style="background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5;">
          <i class="fa-solid fa-triangle-exclamation"></i> <strong>Lỗi:</strong> ${escapeHtml(err.message)}
        </div>
      `;
      aiChatBody.appendChild(errEl);
      aiChatBody.scrollTop = aiChatBody.scrollHeight;
    } finally {
      isAiGenerating = false;
      if (btnAiSend) btnAiSend.disabled = false;
      if (aiInput) aiInput.focus();
    }
  };

  // Hàm chèn lời giải của AI vào bản ghi chú
  const insertAiAnswerIntoNote = (answerText) => {
    const isVisualTab = visualPane && !visualPane.classList.contains('hidden');
    const snippetTitle = currentFocalText ? (currentFocalText.slice(0, 32) + '...') : 'Khái niệm';

    if (isVisualTab && visualEditor) {
      // Chèn vào Visual Rich Editor
      const quoteBlock = document.createElement('div');
      quoteBlock.style.cssText = 'border-left: 3px solid #a855f7; background: rgba(168, 85, 247, 0.08); padding: 10px 14px; margin: 12px 0; border-radius: 0 8px 8px 0;';
      quoteBlock.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: 700; color: #c084fc; margin-bottom: 4px;">
          <i class="fa-solid fa-wand-magic-sparkles"></i> AI Copilot Giải Thích (${escapeHtml(snippetTitle)}):
        </div>
        <div style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.5;">
          ${renderMarkdownToHtml(answerText)}
        </div>
      `;
      visualEditor.appendChild(quoteBlock);
      const spacer = document.createElement('p');
      spacer.innerHTML = '<br>';
      visualEditor.appendChild(spacer);
      updateCanvasWrapperHeight();
      saveAllNotes();
      showToast('Đã chèn giải thích của AI vào Ghi Chú!');
    } else {
      // Chèn vào Markdown Textarea
      const currentVal = textarea.value;
      const formattedQuote = `\n\n> 💡 **AI Copilot Giải Thích (${snippetTitle}):**\n` +
        answerText.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';

      const newText = currentVal + formattedQuote;
      textarea.value = newText;
      updateLivePreview();
      pushHistory(newText, newText.length, newText.length);
      saveAllNotes();
      showToast('Đã chèn giải thích của AI vào bài Markdown!');
    }
  };

  // Bắt sự kiện click các chip gợi ý nhanh
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (prompt) {
        sendAiQuestion(prompt);
      }
    });
  });

  // Bắt sự kiện nhập và bấm nút gửi
  if (btnAiSend) {
    btnAiSend.addEventListener('click', () => sendAiQuestion());
  }

  if (aiInput) {
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiQuestion();
      }
    });
  }

  // ========================================================================
  // 13. ONE-SHOT SNIPPING AI & IN-SITU FLOATING POPUP CONTROLLER
  // ========================================================================
  const btnSnipeMd = sidebar.querySelector('#btn-snipe-ai-md');
  const btnSnipeVis = sidebar.querySelector('#btn-snipe-ai-vis');
  let activeFloatingPopup = null;

  const closeFloatingPopup = () => {
    if (activeFloatingPopup && activeFloatingPopup.parentNode) {
      if (typeof activeFloatingPopup._cleanupHandlers === 'function') {
        activeFloatingPopup._cleanupHandlers();
      }
      activeFloatingPopup.parentNode.removeChild(activeFloatingPopup);
      activeFloatingPopup = null;
    }
  };

  // Trích xuất nội dung (chữ & link ảnh & danh sách thẻ ảnh) từ vùng màn hình được khoanh
  const extractContentFromScreenRect = (rect) => {
    let extractedParts = [];
    let matchedImgs = [];
    const isVisualTab = visualPane && !visualPane.classList.contains('hidden');
    const isPreviewTab = previewPane && !previewPane.classList.contains('hidden');

    const targetContainer = isVisualTab ? canvasWrapper : (isPreviewTab ? previewContent : textarea);

    if (targetContainer && targetContainer !== textarea) {
      const handledElements = new Set();

      // 1. Quét các BẢNG / MA TRẬN (TABLE) để giữ nguyên cấu trúc dòng và cột
      const tables = targetContainer.querySelectorAll('table');
      tables.forEach(table => {
        const tRect = table.getBoundingClientRect();
        const intersects = !(
          tRect.right < rect.left ||
          tRect.left > rect.right ||
          tRect.bottom < rect.top ||
          tRect.top > rect.bottom
        );
        if (intersects) {
          const rowTexts = [];
          table.querySelectorAll('tr').forEach(tr => {
            const trRect = tr.getBoundingClientRect();
            const trIntersects = !(
              trRect.right < rect.left ||
              trRect.left > rect.right ||
              trRect.bottom < rect.top ||
              trRect.top > rect.bottom
            );
            if (trIntersects) {
              const cells = Array.from(tr.querySelectorAll('th, td')).map(c => c.textContent.trim());
              if (cells.length > 0) {
                rowTexts.push('| ' + cells.join(' | ') + ' |');
              }
            }
          });
          if (rowTexts.length > 0) {
            extractedParts.push(`[Bảng / Ma trận số liệu]:\n` + rowTexts.join('\n'));
            table.querySelectorAll('*').forEach(el => handledElements.add(el));
            handledElements.add(table);
          }
        }
      });

      // 2. Quét các khối Code, Math, Pre
      const preBlocks = targetContainer.querySelectorAll('pre, code');
      preBlocks.forEach(pre => {
        if (handledElements.has(pre)) return;
        const pRect = pre.getBoundingClientRect();
        const intersects = !(
          pRect.right < rect.left ||
          pRect.left > rect.right ||
          pRect.bottom < rect.top ||
          pRect.top > rect.bottom
        );
        if (intersects) {
          const txt = pre.textContent.trim();
          if (txt) {
            extractedParts.push(`[Đoạn mã / Công thức]:\n` + txt);
            pre.querySelectorAll('*').forEach(el => handledElements.add(el));
            handledElements.add(pre);
          }
        }
      });

      // 3. Quét các thẻ ảnh (bao gồm cả ảnh nổi trong Visual Notes và Markdown preview)
      const imgs = targetContainer.querySelectorAll('img');
      imgs.forEach(img => {
        if (handledElements.has(img)) return;
        const iRect = img.getBoundingClientRect();
        const intersects = !(
          iRect.right < rect.left ||
          iRect.left > rect.right ||
          iRect.bottom < rect.top ||
          iRect.top > rect.bottom
        );
        if (intersects && img.src) {
          extractedParts.push(`[Hình ảnh sơ đồ / biểu đồ: ${img.alt || 'Ảnh minh họa'}](${img.src})`);
          matchedImgs.push(img);
          handledElements.add(img);
        }
      });

      // 4. Quét các khối văn bản (P, LI, H1-H6, BLOCKQUOTE)
      const textBlocks = targetContainer.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote');
      textBlocks.forEach(block => {
        if (handledElements.has(block)) return;
        const bRect = block.getBoundingClientRect();
        const intersects = !(
          bRect.right < rect.left ||
          bRect.left > rect.right ||
          bRect.bottom < rect.top ||
          bRect.top > rect.bottom
        );
        if (intersects) {
          const txt = block.textContent.trim();
          if (txt) {
            extractedParts.push(txt);
            handledElements.add(block);
          }
        }
      });

      // 5. Nếu vẫn chưa quét được (ví dụ text nằm trực tiếp trong container), dùng TreeWalker hỗ trợ
      if (extractedParts.length === 0) {
        const walker = document.createTreeWalker(targetContainer, NodeFilter.SHOW_TEXT, null, false);
        let currNode;
        while ((currNode = walker.nextNode())) {
          const txt = currNode.textContent.trim();
          if (!txt) continue;
          const parent = currNode.parentElement;
          if (parent && !handledElements.has(parent)) {
            const r = parent.getBoundingClientRect();
            const intersects = !(
              r.right < rect.left ||
              r.left > rect.right ||
              r.bottom < rect.top ||
              r.top > rect.bottom
            );
            if (intersects) {
              extractedParts.push(txt);
              handledElements.add(parent);
            }
          }
        }
      }
    } else if (textarea) {
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
      if (sel) {
        extractedParts.push(sel);
      } else {
        const tRect = textarea.getBoundingClientRect();
        const lines = textarea.value.split('\n');
        const lineHeight = tRect.height / Math.max(1, lines.length);
        const startLineIdx = Math.max(0, Math.floor((rect.top - tRect.top) / Math.max(16, lineHeight)));
        const endLineIdx = Math.min(lines.length - 1, Math.ceil((rect.bottom - tRect.top) / Math.max(16, lineHeight)));
        const sliced = lines.slice(startLineIdx, endLineIdx + 1).join('\n').trim();
        if (sliced) extractedParts.push(sliced);
      }
    }

    return {
      text: extractedParts.join('\n\n').trim(),
      matchedImgs
    };
  };

  /**
   * Tự động chuyển đổi con lăn chuột (Mouse Wheel) thành trượt ngang mượt mà cho các khối công thức toán, ma trận, code và bảng
   */
  const handleHorizontalWheelScroll = (e) => {
    const scrollable = e.target.closest(
      '.neural-math-block, .neural-matrix-wrapper, .neural-table-wrapper, .neural-ai-bubble pre, .neural-notepad-rendered-content pre, .neural-modal-inline-preview pre, .neural-math-inline'
    );
    if (!scrollable) return;

    // Kiểm tra nếu phần tử có nội dung thực sự bị tràn ngang
    if (scrollable.scrollWidth > scrollable.clientWidth + 2) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScrollLeft = scrollable.scrollWidth - scrollable.clientWidth;
        const atLeftEdge = scrollable.scrollLeft <= 0 && e.deltaY < 0;
        const atRightEdge = scrollable.scrollLeft >= maxScrollLeft - 1 && e.deltaY > 0;

        // Chỉ chặn cuộn dọc khi đang cuộn trong phạm vi nội dung ngang
        if (!atLeftEdge && !atRightEdge) {
          e.preventDefault();
          e.stopPropagation();
          scrollable.scrollLeft += e.deltaY * 0.85;
        }
      }
    }
  };

  // Mở Popup Chat AI nổi tại đúng vị trí khung chữ nhật vừa khoanh
  const openInSituAiPopup = (boundingBox, focalText, focalImages = []) => {
    closeFloatingPopup();
    currentFocalText = focalText;

    const popup = document.createElement('div');
    popup.className = 'neural-ai-floating-popup';

    const popupWidth = Math.min(420, window.innerWidth - 32);
    const popupHeight = Math.min(480, window.innerHeight - 32);
    let posX = boundingBox.left;
    let posY = boundingBox.bottom + 10;

    if (posX + popupWidth > window.innerWidth - 16) {
      posX = window.innerWidth - popupWidth - 16;
    }
    if (posX < 16) posX = 16;

    if (posY + popupHeight > window.innerHeight - 16) {
      posY = Math.max(16, boundingBox.top - popupHeight - 10);
    }
    if (posY < 16) posY = 16;

    popup.style.width = `${Math.round(popupWidth)}px`;
    popup.style.height = `${Math.round(popupHeight)}px`;
    popup.style.left = `${Math.round(posX)}px`;
    popup.style.top = `${Math.round(posY)}px`;

    const displaySnippet = focalText.length > 55 ? `${focalText.slice(0, 55)}...` : focalText;
    const hasFocalImages = Array.isArray(focalImages) && focalImages.length > 0;
    const thumbHtml = hasFocalImages
      ? `<img src="${focalImages[0].dataUrl}" class="neural-ai-focal-thumb" alt="Ảnh khoanh" />`
      : '';
    const tagHtml = hasFocalImages
      ? `<span class="neural-ai-focal-tag" style="background: rgba(56, 189, 248, 0.2); border-color: rgba(56, 189, 248, 0.5); color: #38bdf8;"><i class="fa-solid fa-eye"></i> Thị giác AI</span>`
      : `<span class="neural-ai-focal-tag">🎯 Đã khoanh</span>`;

    const welcomeMsg = hasFocalImages
      ? '✨ Mình đã **nhìn thấy hình ảnh/bảng biểu** trong vùng bạn vừa khoanh! Sẵn sàng bóc tách chi tiết từng con số, ma trận, công thức hoặc biểu đồ.'
      : `✨ Mình đã nắm nội dung vùng bạn vừa khoanh trong bài <strong>${escapeHtml(node.label || 'ghi chú')}</strong>. Bạn muốn mình giải đáp thế nào?`;

    popup.innerHTML = `
      <div class="neural-ai-drawer-header">
        <div class="neural-ai-drawer-title-group">
          <div class="neural-ai-drawer-badge"><i class="fa-solid fa-crop-simple"></i></div>
          <div>
            <span class="neural-ai-drawer-title">
              AI Copilot
              <span class="neural-ai-drawer-sub">Vùng vừa khoanh</span>
            </span>
          </div>
        </div>
        <div class="neural-ai-drawer-actions">
          <button type="button" class="neural-ai-drawer-btn" id="btn-maximize-floating-popup" title="Toàn màn hình / Thu nhỏ">
            <i class="fa-solid fa-expand"></i>
          </button>
          <button type="button" class="neural-ai-drawer-btn" id="btn-close-floating-popup" title="Đóng popup">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div class="neural-ai-focal-bar">
        <div class="neural-ai-focal-chip" title="${escapeHtml(focalText)}">
          ${thumbHtml}
          ${tagHtml}
          <span class="neural-ai-focal-quote">"${escapeHtml(displaySnippet)}"</span>
        </div>
      </div>

      <div class="neural-ai-quick-chips">
        <button type="button" class="neural-ai-quick-chip" data-prompt="Bóc tách và giải thích chi tiết ý nghĩa cụ thể của từng phần tử, chỉ số con số trong vùng vừa khoanh, không tóm tắt lan man cả bài">
          💡 Ý nghĩa từng phần tử
        </button>
        <button type="button" class="neural-ai-quick-chip" data-prompt="Phân tích tương quan và liên hệ thực tế giữa các phần tử trong vùng này">
          📊 Phân tích tương quan
        </button>
        <button type="button" class="neural-ai-quick-chip" data-prompt="Rút ra nhận xét cốt lõi quan trọng nhất từ các chỉ số trong vùng này">
          ⚡ Nhận xét cốt lõi
        </button>
      </div>

      <div class="neural-ai-chat-body" id="floating-popup-chat-body">
        <div class="neural-ai-msg model">
          <div class="neural-ai-bubble">
            <p>${welcomeMsg}</p>
          </div>
        </div>
      </div>

      <div class="neural-ai-input-row">
        <input type="text" class="neural-ai-input" id="floating-popup-input" placeholder="Hỏi bất kỳ điều gì về vùng này (Enter)..." />
        <button type="button" class="neural-ai-send-btn" id="btn-floating-send" title="Gửi câu hỏi">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>

      <div class="neural-ai-popup-resizer" title="Kéo góc để thay đổi kích thước"></div>
    `;

    document.body.appendChild(popup);
    activeFloatingPopup = popup;

    const closeBtn = popup.querySelector('#btn-close-floating-popup');
    closeBtn.addEventListener('click', closeFloatingPopup);

    const maxBtn = popup.querySelector('#btn-maximize-floating-popup');
    let isMaximized = false;
    let savedBounds = null;

    // Phóng to toàn màn hình hoặc khôi phục kích thước ban đầu
    const toggleMaximize = () => {
      isMaximized = !isMaximized;
      if (isMaximized) {
        savedBounds = {
          left: popup.style.left,
          top: popup.style.top,
          width: popup.style.width,
          height: popup.style.height
        };
        popup.classList.add('is-maximized');
        if (maxBtn) {
          maxBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
          maxBtn.title = 'Thu nhỏ kích thước';
        }
      } else {
        popup.classList.remove('is-maximized');
        if (savedBounds) {
          popup.style.left = savedBounds.left;
          popup.style.top = savedBounds.top;
          popup.style.width = savedBounds.width;
          popup.style.height = savedBounds.height;
        }
        if (maxBtn) {
          maxBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
          maxBtn.title = 'Toàn màn hình';
        }
      }
    };

    if (maxBtn) {
      maxBtn.addEventListener('click', toggleMaximize);
    }

    // --- Cầm kéo di chuyển Popup (Draggable Header) ---
    const header = popup.querySelector('.neural-ai-drawer-header');
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const onHeaderPointerDown = (e) => {
      if (e.target.closest('button')) return;
      if (isMaximized) return;

      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      const rect = popup.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      popup.classList.add('is-dragging');
      try {
        header.setPointerCapture(e.pointerId);
      } catch (_) {}

      window.addEventListener('pointermove', onHeaderPointerMove);
      window.addEventListener('pointerup', onHeaderPointerUp);
      window.addEventListener('pointercancel', onHeaderPointerUp);
    };

    const onHeaderPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;

      const maxLeft = Math.max(8, window.innerWidth - popup.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - popup.offsetHeight - 8);

      newLeft = Math.max(8, Math.min(newLeft, maxLeft));
      newTop = Math.max(8, Math.min(newTop, maxTop));

      popup.style.left = `${Math.round(newLeft)}px`;
      popup.style.top = `${Math.round(newTop)}px`;
    };

    const onHeaderPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      popup.classList.remove('is-dragging');
      try {
        header.releasePointerCapture(e.pointerId);
      } catch (_) {}
      window.removeEventListener('pointermove', onHeaderPointerMove);
      window.removeEventListener('pointerup', onHeaderPointerUp);
      window.removeEventListener('pointercancel', onHeaderPointerUp);
    };

    header.addEventListener('pointerdown', onHeaderPointerDown);
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      toggleMaximize();
    });

    // --- Kéo góc để phóng to / thu nhỏ kích thước (Corner Resizing) ---
    const resizer = popup.querySelector('.neural-ai-popup-resizer');
    let isResizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const onResizerPointerDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isMaximized) return;

      isResizing = true;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;

      const rect = popup.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;

      popup.classList.add('is-resizing');
      try {
        resizer.setPointerCapture(e.pointerId);
      } catch (_) {}

      window.addEventListener('pointermove', onResizerPointerMove);
      window.addEventListener('pointerup', onResizerPointerUp);
      window.addEventListener('pointercancel', onResizerPointerUp);
    };

    const onResizerPointerMove = (e) => {
      if (!isResizing) return;
      const deltaX = e.clientX - resizeStartX;
      const deltaY = e.clientY - resizeStartY;

      let newWidth = startWidth + deltaX;
      let newHeight = startHeight + deltaY;

      const rect = popup.getBoundingClientRect();
      const maxW = Math.max(340, window.innerWidth - rect.left - 12);
      const maxH = Math.max(360, window.innerHeight - rect.top - 12);

      newWidth = Math.max(320, Math.min(newWidth, maxW));
      newHeight = Math.max(340, Math.min(newHeight, maxH));

      popup.style.width = `${Math.round(newWidth)}px`;
      popup.style.height = `${Math.round(newHeight)}px`;
      popup.style.maxWidth = 'none';
      popup.style.maxHeight = 'none';
    };

    const onResizerPointerUp = (e) => {
      if (!isResizing) return;
      isResizing = false;
      popup.classList.remove('is-resizing');
      try {
        resizer.releasePointerCapture(e.pointerId);
      } catch (_) {}
      window.removeEventListener('pointermove', onResizerPointerMove);
      window.removeEventListener('pointerup', onResizerPointerUp);
      window.removeEventListener('pointercancel', onResizerPointerUp);
    };

    if (resizer) {
      resizer.addEventListener('pointerdown', onResizerPointerDown);
    }

    // Đăng ký dọn dẹp trình lắng nghe sự kiện toàn cục khi popup đóng
    popup._cleanupHandlers = () => {
      window.removeEventListener('pointermove', onHeaderPointerMove);
      window.removeEventListener('pointerup', onHeaderPointerUp);
      window.removeEventListener('pointercancel', onHeaderPointerUp);
      window.removeEventListener('pointermove', onResizerPointerMove);
      window.removeEventListener('pointerup', onResizerPointerUp);
      window.removeEventListener('pointercancel', onResizerPointerUp);
    };

    // Lắng nghe lăn chuột để cuộn ngang mượt mà cho các khối công thức và ma trận trong popup
    popup.addEventListener('wheel', handleHorizontalWheelScroll, { passive: false });

    const chatBody = popup.querySelector('#floating-popup-chat-body');
    const input = popup.querySelector('#floating-popup-input');
    const sendBtn = popup.querySelector('#btn-floating-send');
    const chips = popup.querySelectorAll('.neural-ai-quick-chip');

    let floatingHistory = [];
    let isFloatingGenerating = false;

    const sendFloatingQuestion = async (customPrompt = '') => {
      const question = (customPrompt || input.value).trim();
      if (!question || isFloatingGenerating) return;

      input.value = '';
      isFloatingGenerating = true;
      sendBtn.disabled = true;

      const userMsg = document.createElement('div');
      userMsg.className = 'neural-ai-msg user';
      userMsg.innerHTML = `<div class="neural-ai-bubble">${escapeHtml(question)}</div>`;
      chatBody.appendChild(userMsg);

      const loadingEl = document.createElement('div');
      loadingEl.className = 'neural-ai-loading';
      loadingEl.innerHTML = `
        <span>${hasFocalImages ? 'Gemini đang quan sát hình ảnh và bóc tách dữ liệu' : 'Gemini đang phân tích toàn bài ghi chú'}</span>
        <div class="neural-ai-loading-dots">
          <div class="neural-ai-loading-dot"></div>
          <div class="neural-ai-loading-dot"></div>
          <div class="neural-ai-loading-dot"></div>
        </div>
      `;
      chatBody.appendChild(loadingEl);
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        const fullNoteText = [
          textarea ? textarea.value : (node.notes || ''),
          visualEditor ? visualEditor.innerText : (node.visualNotes?.html?.replace(/<[^>]*>/g, ' ') || '')
        ].filter(Boolean).join('\n\n');

        const allNodes = getSubjectKnowledgeNodes(subjectCode);

        const res = await askContextualNoteQuestion({
          subjectCode,
          targetNode: node,
          allNodes,
          fullContext: fullNoteText,
          focalText: focalText,
          focalImages: focalImages,
          userQuestion: question,
          chatHistory: floatingHistory
        });

        if (loadingEl.parentNode) loadingEl.remove();

        const aiMsg = document.createElement('div');
        aiMsg.className = 'neural-ai-msg model';
        aiMsg.innerHTML = `
          <div class="neural-ai-bubble">
            ${renderMarkdownToHtml(res.text)}
          </div>
          <div class="neural-ai-msg-actions">
            <button type="button" class="neural-ai-action-btn copy-btn" title="Sao chép">
              <i class="fa-regular fa-copy"></i> Sao chép
            </button>
            <button type="button" class="neural-ai-action-btn insert-btn" title="Chèn vào bài ghi chú">
              <i class="fa-solid fa-file-circle-plus"></i> Chèn vào ghi chú
            </button>
          </div>
        `;

        aiMsg.querySelector('.copy-btn').addEventListener('click', () => {
          navigator.clipboard.writeText(res.text).then(() => {
            showToast('Đã sao chép câu trả lời!');
          });
        });

        aiMsg.querySelector('.insert-btn').addEventListener('click', () => {
          insertAiAnswerIntoNote(res.text);
        });

        chatBody.appendChild(aiMsg);
        chatBody.scrollTop = chatBody.scrollHeight;

        floatingHistory.push(
          { role: 'user', text: question },
          { role: 'model', text: res.text }
        );
      } catch (err) {
        if (loadingEl.parentNode) loadingEl.remove();
        const errEl = document.createElement('div');
        errEl.className = 'neural-ai-msg model';
        errEl.innerHTML = `
          <div class="neural-ai-bubble" style="background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5;">
            <i class="fa-solid fa-triangle-exclamation"></i> <strong>Lỗi:</strong> ${escapeHtml(err.message)}
          </div>
        `;
        chatBody.appendChild(errEl);
        chatBody.scrollTop = chatBody.scrollHeight;
      } finally {
        isFloatingGenerating = false;
        sendBtn.disabled = false;
        input.focus();
      }
    };

    chips.forEach(c => {
      c.addEventListener('click', () => sendFloatingQuestion(c.dataset.prompt));
    });

    sendBtn.addEventListener('click', () => sendFloatingQuestion());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendFloatingQuestion();
      }
    });

    setTimeout(() => input.focus(), 150);
  };

  // Khởi động Chế độ Khoanh vùng 1 lần (One-shot Snipping Mode)
  const startSnippingMode = () => {
    closeFloatingPopup();
    hideSelectionPill();

    const overlay = document.createElement('div');
    overlay.className = 'neural-snipping-overlay';

    const box = document.createElement('div');
    box.className = 'neural-snipping-box';

    const badge = document.createElement('div');
    badge.className = 'neural-snipping-cursor-badge';
    badge.innerHTML = '<i class="fa-solid fa-crop-simple"></i> Kéo chuột để khoanh vùng hỏi AI';

    document.body.appendChild(overlay);
    document.body.appendChild(box);
    document.body.appendChild(badge);

    let isDrawing = false;
    let startX = 0;
    let startY = 0;

    const cleanupSnipping = () => {
      window.removeEventListener('keydown', onKeyDown);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (box.parentNode) box.parentNode.removeChild(box);
      if (badge.parentNode) badge.parentNode.removeChild(badge);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        cleanupSnipping();
        showToast('Đã hủy khoanh vùng');
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Cho phép lăn chuột cuộn nội dung bài học mượt mà khi đang ở chế độ Snipping
    const onWheel = (e) => {
      e.preventDefault();

      // 1. Dò tìm phần tử cuộn nằm ngay bên dưới con trỏ chuột
      let scrollTarget = null;
      overlay.style.pointerEvents = 'none';
      const underEl = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.pointerEvents = 'auto';

      if (underEl) {
        let curr = underEl;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          if (
            curr === previewContent ||
            curr === visualPane ||
            curr === textarea ||
            curr.id === 'neural-notepad-preview-content' ||
            curr.id === 'neural-np-visual-pane' ||
            curr.id === 'neural-notepad-textarea' ||
            curr.id === 'neural-np-quiz-pane'
          ) {
            scrollTarget = curr;
            break;
          }
          const cs = window.getComputedStyle(curr);
          if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && (curr.scrollHeight > curr.clientHeight)) {
            scrollTarget = curr;
            break;
          }
          curr = curr.parentElement;
        }
      }

      // 2. Fallback: Xác định container cuộn theo tab hiện tại nếu không dò được qua tọa độ
      if (!scrollTarget) {
        const isVisualTab = visualPane && !visualPane.classList.contains('hidden');
        const isPreviewTab = previewPane && !previewPane.classList.contains('hidden');
        const isEditTab = editPane && !editPane.classList.contains('hidden');

        if (isVisualTab) {
          scrollTarget = visualPane;
        } else if (isPreviewTab) {
          scrollTarget = previewContent || previewPane;
        } else if (isEditTab) {
          scrollTarget = textarea;
        } else {
          scrollTarget = previewContent || visualPane || textarea;
        }
      }

      // 3. Thực hiện cuộn dứt khoát không bị delay
      if (scrollTarget) {
        if (typeof scrollTarget.scrollBy === 'function') {
          scrollTarget.scrollBy({
            top: e.deltaY,
            left: e.deltaX,
            behavior: 'auto'
          });
        } else {
          scrollTarget.scrollTop += e.deltaY;
          scrollTarget.scrollLeft += e.deltaX;
        }
      }
    };
    overlay.addEventListener('wheel', onWheel, { passive: false });

    overlay.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDrawing = true;
      startX = e.clientX;
      startY = e.clientY;
      box.style.left = `${startX}px`;
      box.style.top = `${startY}px`;
      box.style.width = '0px';
      box.style.height = '0px';
      box.style.display = 'block';
      badge.style.display = 'none';
    });

    overlay.addEventListener('mousemove', (e) => {
      badge.style.left = `${e.clientX}px`;
      badge.style.top = `${e.clientY}px`;

      if (!isDrawing) return;
      const curX = e.clientX;
      const curY = e.clientY;
      const left = Math.min(startX, curX);
      const top = Math.min(startY, curY);
      const width = Math.abs(curX - startX);
      const height = Math.abs(curY - startY);

      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
    });

    overlay.addEventListener('mouseup', async (e) => {
      if (!isDrawing) {
        cleanupSnipping();
        return;
      }
      isDrawing = false;

      const curX = e.clientX;
      const curY = e.clientY;
      const left = Math.min(startX, curX);
      const top = Math.min(startY, curY);
      const width = Math.abs(curX - startX);
      const height = Math.abs(curY - startY);

      cleanupSnipping();

      if (width < 12 && height < 12) {
        return;
      }

      const boundingBox = { left, top, right: left + width, bottom: top + height, width, height };
      const { text, matchedImgs } = extractContentFromScreenRect(boundingBox);

      // Trích xuất hình ảnh Multimodal Vision từ vùng khoanh
      let focalImages = [];
      if (matchedImgs && matchedImgs.length > 0) {
        for (const imgEl of matchedImgs.slice(0, 3)) {
          const imgData = await extractImageBase64WithCrop(imgEl, boundingBox);
          if (imgData) focalImages.push(imgData);
        }
      }

      // Nếu không có chữ VÀ không bắt được ảnh trong vùng khoanh, nhưng bài ghi chú có ảnh
      if (!text && focalImages.length === 0) {
        const allDocImgs = Array.from(sidebar.querySelectorAll('.visual-pane img, .preview-pane img, #neural-canvas-wrapper img'));
        if (allDocImgs.length > 0) {
          for (const imgEl of allDocImgs.slice(0, 2)) {
            const imgData = await extractImageBase64WithCrop(imgEl, null);
            if (imgData) focalImages.push(imgData);
          }
        }
      }

      let focalText = text;
      if (!focalText) {
        if (focalImages.length > 0) {
          focalText = `[Hình ảnh / sơ đồ số liệu vừa khoanh chọn (${focalImages.length} ảnh)]`;
        } else {
          focalText = 'Vùng ma trận / sơ đồ số liệu vừa khoanh chọn';
        }
      }

      openInSituAiPopup(boundingBox, focalText, focalImages);
    });
  };

  // Gắn sự kiện nút Khoanh hỏi AI trên Markdown toolbar & Visual toolbar
  if (btnSnipeMd) btnSnipeMd.addEventListener('click', startSnippingMode);
  if (btnSnipeVis) btnSnipeVis.addEventListener('click', startSnippingMode);

  // Lắng nghe lăn chuột để cuộn ngang mượt mà cho các khối công thức toán học và ma trận trong toàn bộ sidebar
  sidebar.addEventListener('wheel', handleHorizontalWheelScroll, { passive: false });

  // Dọn dẹp selection pill, popup và listeners khi đóng sidebar
  notepadCleanupFns.push(() => {
    sidebar.removeEventListener('wheel', handleHorizontalWheelScroll);
    closeFloatingPopup();
    document.removeEventListener('selectionchange', onSelectionEvent);
    sidebar.removeEventListener('mouseup', onSelectionEvent);
    sidebar.removeEventListener('keyup', onSelectionEvent);
    sidebar.removeEventListener('mousemove', onSidebarMouseMove);
    clearTimeout(selectionDebounceTimer);
    if (selectionPill && selectionPill.parentNode) {
      selectionPill.parentNode.removeChild(selectionPill);
    }
  });

  // Đóng bảng ghi chú
  sidebar.querySelector('#btn-close-neural-notepad').addEventListener('click', closeNeuralNotepadSidebar);
}

/**
 * Đóng bảng Notepad Sidepanel
 */
export function closeNeuralNotepadSidebar() {
  if (notepadCleanupFns && notepadCleanupFns.length > 0) {
    notepadCleanupFns.forEach(fn => {
      try { fn(); } catch (err) { console.error('Cleanup error:', err); }
    });
    notepadCleanupFns = [];
  }

  if (currentNotepadEl) {
    const parent = currentNotepadEl.parentNode;
    if (parent) {
      parent.classList.remove('has-notepad-sidebar');
      parent.style.removeProperty('--neural-sidebar-w');
    }
    currentNotepadEl.classList.remove('active');
    setTimeout(() => {
      if (currentNotepadEl && currentNotepadEl.parentNode) {
        currentNotepadEl.parentNode.removeChild(currentNotepadEl);
      }
      currentNotepadEl = null;
    }, 280);
  }
}

