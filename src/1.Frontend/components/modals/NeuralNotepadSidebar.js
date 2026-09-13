// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { updateNeuralNode } from '../../../3.Database/state.js';
import { renderMarkdownToHtml } from '../../../2.Backend/utils/markdownRenderer.js';

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

  // 1. Trích xuất ngữ cảnh xung quanh từ DOM Selection
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

  // 2. Nếu có ngữ cảnh, quét toàn bộ các vị trí xuất hiện và chấm điểm khớp (Scoring)
  if (prefixContext || suffixContext) {
    let searchPos = 0;
    let bestIdx = -1;
    let maxScore = -1;

    while ((searchPos = rawText.indexOf(sel, searchPos)) !== -1) {
      let score = 0;
      // Khớp ngữ cảnh phía trước
      if (prefixContext) {
        const beforeText = rawText.substring(Math.max(0, searchPos - 45), searchPos);
        for (let word of prefixContext.split(/\s+/)) {
          if (word.length > 1 && beforeText.includes(word)) score += 2;
        }
      }
      // Khớp ngữ cảnh phía sau
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

  // 3. Fallback: Nếu không có ngữ cảnh đặc thù, lấy vị trí đầu tiên
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
        // Toggle OFF: Gỡ bỏ highlight
        newText = text.substring(0, idx - prefix.length) + domSelText + text.substring(idx + domSelText.length + suffix.length);
      } else {
        // Toggle ON: Bọc highlight
        const replacement = prefix + domSelText + suffix;
        newText = text.substring(0, idx) + replacement + text.substring(idx + domSelText.length);
      }

      textarea.value = newText;
      // CỰC KỲ QUAN TRỌNG: Reset selection của textarea về (0, 0) để lần bấm sau không bị dính vết selection cũ!
      textarea.setSelectionRange(0, 0);

      // Giải phóng selection trên DOM để chuẩn bị cho lần bôi đen tiếp theo
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

    // Kiểm tra nếu đã có định dạng -> Gỡ bỏ (Toggle OFF)
    if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix) && selectedText.length >= prefix.length + suffix.length) {
      const unformatted = selectedText.slice(prefix.length, -suffix.length);
      const newText = text.substring(0, start) + unformatted + text.substring(end);
      textarea.value = newText;
      textarea.focus();
      textarea.setSelectionRange(start, start + unformatted.length);
      if (onModifyCallback) onModifyCallback(newText, start, start + unformatted.length);
      return;
    }

    // Chưa có định dạng -> Bọc thẻ (Toggle ON)
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
  // Mặc định: Nếu đã có ghi chú thì mở ngay Bảng Notepad Đã Gen Ra (preview), nếu trống thì mở soạn thảo (edit)
  const defaultTab = hasNotes ? 'preview' : 'edit';

  return `
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
        </div>
        <button type="button" class="neural-close-btn" id="btn-close-neural-notepad" title="Đóng bảng ghi chú">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <!-- Toolbar: Undo/Redo & 4 Chức năng định dạng Markdown -->
    <div class="neural-notepad-toolbar">
      <div class="neural-np-tools-group">
        <!-- Nút Undo / Redo -->
        <button type="button" class="neural-np-tool-btn" id="btn-hist-undo" title="Hoàn tác (Ctrl+Z)" disabled>
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button type="button" class="neural-np-tool-btn" id="btn-hist-redo" title="Làm lại (Ctrl+Y)" disabled>
          <i class="fa-solid fa-rotate-right"></i>
        </button>

        <div class="neural-np-tool-divider"></div>

        <!-- Nút Định dạng -->
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

    <!-- Body Container: Edit Textarea & Preview Notepad -->
    <div class="neural-notepad-body" id="neural-notepad-body-container" data-view-mode="${defaultTab}">
      <!-- 1. Textarea Soạn thảo -->
      <div class="neural-np-pane ${defaultTab === 'preview' ? 'hidden' : ''}" id="neural-np-edit-pane">
        <textarea 
          id="neural-notepad-textarea" 
          class="neural-notepad-textarea" 
          placeholder="Nhập ghi chú định dạng Markdown tại đây...&#10;• **In đậm**&#10;• *In nghiêng*&#10;• <u>Gạch chân</u>&#10;• ==Tô sáng highlight=="
        >${escapeHtml(notes)}</textarea>
      </div>

      <!-- 2. Bảng Notepad Đã Gen Ra (Rich Preview) -->
      <div class="neural-np-pane ${defaultTab === 'edit' ? 'hidden' : ''}" id="neural-np-preview-pane">
        <div class="neural-notepad-rendered-content" id="neural-notepad-preview-content">
          ${renderedHtml}
        </div>
        <button type="button" class="btn-quick-switch-to-edit" id="btn-quick-switch-to-edit" title="Chuyển sang soạn thảo">
          <i class="fa-solid fa-pen-to-square"></i> Sửa nội dung
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

  requestAnimationFrame(() => {
    sidebar.classList.add('active');
  });

  const textarea = sidebar.querySelector('#neural-notepad-textarea');
  const previewContent = sidebar.querySelector('#neural-notepad-preview-content');
  const editPane = sidebar.querySelector('#neural-np-edit-pane');
  const previewPane = sidebar.querySelector('#neural-np-preview-pane');
  const tabBtns = sidebar.querySelectorAll('.neural-np-tab');
  const saveStatus = sidebar.querySelector('#neural-notepad-save-status');
  const bodyContainer = sidebar.querySelector('#neural-notepad-body-container');
  const undoBtn = sidebar.querySelector('#btn-hist-undo');
  const redoBtn = sidebar.querySelector('#btn-hist-redo');

  // ========================================================================
  // UNDO / REDO HISTORY ENGINE
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
    // Cắt bỏ nhánh redo cũ nếu vừa có thao tác mới
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

  // Gắn sự kiện nút Undo/Redo
  if (undoBtn) undoBtn.addEventListener('click', doUndo);
  if (redoBtn) redoBtn.addEventListener('click', doRedo);

  // Phím tắt Ctrl+Z / Ctrl+Y
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
  // TAB SWITCHING & LIVE PREVIEW
  // ========================================================================
  const switchViewTab = (tab) => {
    tabBtns.forEach(b => {
      if (b.dataset.tab === tab) b.classList.add('active');
      else b.classList.remove('active');
    });

    if (tab === 'preview') {
      previewContent.innerHTML = renderMarkdownToHtml(textarea.value);
      bodyContainer.classList.remove('split-active');
      editPane.classList.add('hidden');
      previewPane.classList.remove('hidden');
    } else {
      bodyContainer.classList.remove('split-active');
      editPane.classList.remove('hidden');
      previewPane.classList.add('hidden');
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
  // TOOLBAR 4 CHỨC NĂNG ĐỊNH DẠNG (B, I, U, HL) & GIỮ VÙNG CHỌN (SELECTION)
  // ========================================================================
  // QUAN TRỌNG: Ngăn chặn mousedown làm mất focus và làm mất selection trong textarea!
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

  sidebar.querySelector('#btn-fmt-bold').addEventListener('click', () => handleFormat('**', '**'));
  sidebar.querySelector('#btn-fmt-italic').addEventListener('click', () => handleFormat('*', '*'));
  sidebar.querySelector('#btn-fmt-underline').addEventListener('click', () => handleFormat('<u>', '</u>'));
  sidebar.querySelector('#btn-fmt-highlight').addEventListener('click', () => handleFormat('==', '=='));

  // ========================================================================
  // AUTO-SAVE ENGINE & DEBOUNCE
  // ========================================================================
  const saveNotes = () => {
    const newNotes = textarea.value;
    updateNeuralNode(subjectCode, node.id, { notes: newNotes });
    node.notes = newNotes;

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
    debounceTimer = setTimeout(saveNotes, 1200);
  };

  sidebar.querySelector('#btn-save-neural-notepad').addEventListener('click', saveNotes);

  let historyDebounce = null;
  textarea.addEventListener('input', () => {
    updateLivePreview();
    debouncedSave();

    // Gom cụm lịch sử chỉnh sửa khi gõ phím
    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => {
      pushHistory(textarea.value, textarea.selectionStart, textarea.selectionEnd);
    }, 450);
  });

  // Đóng bảng ghi chú
  sidebar.querySelector('#btn-close-neural-notepad').addEventListener('click', closeNeuralNotepadSidebar);
}

/**
 * Đóng bảng Notepad Sidepanel
 */
export function closeNeuralNotepadSidebar() {
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

