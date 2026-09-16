// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { updateNeuralNode, deleteNeuralNodeQuiz } from '../../../3.Database/state.js';
import { renderMarkdownToHtml } from '../../../2.Backend/utils/markdownRenderer.js';
import { openNeuralQuizModal } from './NeuralQuizModal.js';

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
      <div class="neural-np-pane ${defaultTab === 'visual' ? '' : 'hidden'}" id="neural-np-visual-pane">
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
    }
  };

  const onDblClick = () => {
    if (window.innerWidth <= 768) return;
    sidebar.style.transition = 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    const defaultWidth = Math.min(680, Math.max(480, Math.floor(window.innerWidth * 0.5)));
    sidebar.style.width = `${defaultWidth}px`;
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

  // Khởi tạo tính năng kéo chỉnh độ rộng bằng thanh 3 chấm
  const cleanupResizer = initSidebarResizer(sidebar);
  notepadCleanupFns.push(cleanupResizer);

  requestAnimationFrame(() => {
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

  // Hàm nạp file ảnh vào Canvas
  const handleImageFile = (file) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const tempImg = new Image();
      tempImg.onload = () => {
        const naturalW = tempImg.naturalWidth || 300;
        const naturalH = tempImg.naturalHeight || 200;
        const width = Math.min(280, naturalW);
        const height = Math.round(width * (naturalH / naturalW));
        const wrapperW = canvasWrapper ? canvasWrapper.clientWidth : 400;
        const x = Math.max(20, Math.round((wrapperW - width) / 2));
        const y = Math.max(20, (visualPane ? visualPane.scrollTop : 0) + 40);

        const newImg = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          src: dataUrl,
          x,
          y,
          width,
          height
        };

        currentImages.push(newImg);
        renderVisualImages();

        // Tự động chọn ảnh mới thêm để hiển thị khung căn chỉnh ngay lập tức
        const newCard = visualImagesLayer.querySelector(`[data-id="${newImg.id}"]`);
        if (newCard) {
          deselectAllVisualCards();
          newCard.classList.add('active');
        }

        saveAllNotes();
      };
      tempImg.src = dataUrl;
    };
    reader.readAsDataURL(file);
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

  // ========================================================================
  // SELECTION TRACKING & VISUAL FORMATTING ENGINE
  // ========================================================================
  let lastVisualRange = null;

  const trackVisualSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const r = sel.getRangeAt(0);
      if (visualEditor && visualEditor.contains(r.commonAncestorContainer)) {
        lastVisualRange = r.cloneRange();
      }
    }
  };

  if (visualEditor) {
    visualEditor.addEventListener('mouseup', trackVisualSelection);
    visualEditor.addEventListener('keyup', trackVisualSelection);
    visualEditor.addEventListener('touchend', trackVisualSelection);
    document.addEventListener('selectionchange', trackVisualSelection);
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
    currentNotepadEl.classList.remove('active');
    setTimeout(() => {
      if (currentNotepadEl && currentNotepadEl.parentNode) {
        currentNotepadEl.parentNode.removeChild(currentNotepadEl);
      }
      currentNotepadEl = null;
    }, 280);
  }
}

