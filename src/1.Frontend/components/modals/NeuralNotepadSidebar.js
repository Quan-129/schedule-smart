// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { updateNeuralNode } from '../../../3.Database/state.js';
import { renderMarkdownToHtml } from '../../../2.Backend/utils/markdownRenderer.js';

// ==========================================================================
// 2. HELPER FUNCTIONS
// ==========================================================================
function applyFormat(textarea, prefix, suffix) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end) || 'văn bản';
  const replacement = prefix + selectedText + suffix;
  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
}

// ==========================================================================
// 3. COMPONENT TEMPLATE
// ==========================================================================
function renderNotepadTemplate(node) {
  const notes = node.notes || '';
  const renderedHtml = renderMarkdownToHtml(notes);

  return `
    <div class="neural-notepad-header">
      <div class="neural-notepad-title-group">
        <span class="neural-notepad-badge"><i class="fa-solid fa-file-pen"></i></span>
        <div>
          <h3 class="neural-notepad-title">${escapeHtml(node.label || 'Ghi Chú Khái Niệm')}</h3>
          <p class="neural-notepad-subtitle">Bảng Notepad Markdown • Chiếm 50% màn hình</p>
        </div>
      </div>
      <div class="neural-notepad-header-actions">
        <div class="neural-notepad-tabs">
          <button type="button" class="neural-np-tab active" data-tab="edit" title="Soạn thảo Markdown">
            <i class="fa-solid fa-code"></i> Soạn thảo
          </button>
          <button type="button" class="neural-np-tab" data-tab="preview" title="Bảng notepad đã gen ra">
            <i class="fa-solid fa-eye"></i> Xem trước
          </button>
        </div>
        <button type="button" class="neural-close-btn" id="btn-close-neural-notepad" title="Đóng bảng ghi chú">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <!-- Toolbar 4 chức năng định dạng Markdown -->
    <div class="neural-notepad-toolbar">
      <div class="neural-np-tools-group">
        <button type="button" class="neural-np-tool-btn" id="btn-fmt-bold" title="In đậm (**văn bản**)">
          <strong>B</strong>
        </button>
        <button type="button" class="neural-np-tool-btn" id="btn-fmt-italic" title="In nghiêng (*văn bản*)">
          <em>I</em>
        </button>
        <button type="button" class="neural-np-tool-btn" id="btn-fmt-underline" title="Gạch chân (&lt;u&gt;văn bản&lt;/u&gt;)">
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
    <div class="neural-notepad-body">
      <!-- 1. Textarea Soạn thảo -->
      <div class="neural-np-pane" id="neural-np-edit-pane">
        <textarea 
          id="neural-notepad-textarea" 
          class="neural-notepad-textarea" 
          placeholder="Nhập ghi chú định dạng Markdown tại đây...&#10;• **In đậm**&#10;• *In nghiêng*&#10;• <u>Gạch chân</u>&#10;• ==Tô sáng highlight=="
        >${escapeHtml(notes)}</textarea>
      </div>

      <!-- 2. Bảng Notepad Đã Gen Ra (Rich Preview) -->
      <div class="neural-np-pane hidden" id="neural-np-preview-pane">
        <div class="neural-notepad-rendered-content" id="neural-notepad-preview-content">
          ${renderedHtml}
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="neural-notepad-footer">
      <span class="neural-notepad-hint">Phím tắt: Bôi đen chữ rồi bấm 4 nút trên thanh công cụ</span>
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

  // 1. Tab Switching (Soạn thảo vs Xem trước đã gen)
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      if (tab === 'preview') {
        previewContent.innerHTML = renderMarkdownToHtml(textarea.value);
        editPane.classList.add('hidden');
        previewPane.classList.remove('hidden');
      } else {
        editPane.classList.remove('hidden');
        previewPane.classList.add('hidden');
        textarea.focus();
      }
    });
  });

  // 2. Toolbar 4 Chức năng Định dạng
  sidebar.querySelector('#btn-fmt-bold').addEventListener('click', () => {
    applyFormat(textarea, '**', '**');
  });

  sidebar.querySelector('#btn-fmt-italic').addEventListener('click', () => {
    applyFormat(textarea, '*', '*');
  });

  sidebar.querySelector('#btn-fmt-underline').addEventListener('click', () => {
    applyFormat(textarea, '<u>', '</u>');
  });

  sidebar.querySelector('#btn-fmt-highlight').addEventListener('click', () => {
    applyFormat(textarea, '==', '==');
  });

  // 3. Lưu ghi chú
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

  sidebar.querySelector('#btn-save-neural-notepad').addEventListener('click', saveNotes);

  // Auto-save debounce khi gõ
  let debounceTimer = null;
  textarea.addEventListener('input', () => {
    if (saveStatus) {
      saveStatus.innerHTML = '<i class="fa-solid fa-pen-nib"></i> Đang chỉnh sửa...';
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveNotes, 1200);
  });

  // 4. Đóng Notepad
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
