// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { updateNeuralNode } from '../../../3.Database/state.js';
import { renderMarkdownToHtml } from '../../../2.Backend/utils/markdownRenderer.js';

// ==========================================================================
// 2. HELPER FUNCTIONS: SMART FORMATTING (KHÔNG CHÈN TEXT RÁC)
// ==========================================================================

/**
 * Áp dụng định dạng Markdown thông minh:
 * - Nếu có bôi đen trong textarea: Bọc định dạng hoặc tháo gỡ nếu đã bọc (Toggle).
 * - Nếu có bôi đen trên màn hình (Preview pane): Tự động tìm từ đó trong textarea và bọc định dạng.
 * - Nếu không bôi đen: Chỉ chèn cặp thẻ rỗng và đưa con trỏ vào giữa để gõ tiếp.
 * Tuyệt đối không chèn chữ giả mạo "văn bản" làm hỏng nội dung của người dùng.
 * 
 * @param {HTMLTextAreaElement} textarea 
 * @param {string} prefix 
 * @param {string} suffix 
 * @param {Function} onModifyCallback 
 */
function applyFormat(textarea, prefix, suffix, onModifyCallback) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  // 1. Nếu có bôi đen trong textarea
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

  // 2. Nếu textarea không có bôi đen, kiểm tra xem có bôi đen trên Preview pane không
  const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection().toString().trim() : '';
  if (sel) {
    const idx = text.indexOf(sel);
    if (idx !== -1) {
      const replacement = prefix + sel + suffix;
      const newText = text.substring(0, idx) + replacement + text.substring(idx + sel.length);
      textarea.value = newText;
      textarea.focus();
      textarea.setSelectionRange(idx, idx + replacement.length);
      if (onModifyCallback) onModifyCallback(newText, idx, idx + replacement.length);
      return;
    }
  }

  // 3. Nếu KHÔNG bôi đen bất kỳ chữ nào:
  // Chèn cặp thẻ rỗng và đặt con trỏ chuột vào chính giữa để người dùng gõ
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
          <p class="neural-notepad-subtitle">Bảng Notepad Markdown • Chiếm 50% bên phải</p>
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
          <button type="button" class="neural-np-tab" data-tab="split" title="Chia đôi: Vừa gõ vừa gen trực tiếp">
            <i class="fa-solid fa-table-columns"></i> Chia đôi
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
    } else if (tab === 'split') {
      previewContent.innerHTML = renderMarkdownToHtml(textarea.value);
      bodyContainer.classList.add('split-active');
      editPane.classList.remove('hidden');
      previewPane.classList.remove('hidden');
      textarea.focus();
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
  // TOOLBAR 4 CHỨC NĂNG ĐỊNH DẠNG (B, I, U, HL)
  // ========================================================================
  const handleFormat = (prefix, suffix) => {
    applyFormat(textarea, prefix, suffix, (newText, s, e) => {
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

