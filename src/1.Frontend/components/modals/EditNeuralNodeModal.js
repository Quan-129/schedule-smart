// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { updateNeuralNode, deleteNeuralNode } from '../../../3.Database/state.js';
import { openNeuralNotepadSidebar } from './NeuralNotepadSidebar.js';
import { renderMarkdownToHtml } from '../../../2.Backend/utils/markdownRenderer.js';

// ==========================================================================
// 2. CONSTANTS
// ==========================================================================
export const BASIC_NEURAL_COLORS = [
  { hex: '#ef4444', name: 'Đỏ Ruby' },
  { hex: '#f97316', name: 'Cam Rực' },
  { hex: '#eab308', name: 'Vàng Chanh' },
  { hex: '#10b981', name: 'Xanh Lục' },
  { hex: '#06b6d4', name: 'Lam Ngọc' },
  { hex: '#8b5cf6', name: 'Tím Thạch Anh' },
  { hex: '#ec4899', name: 'Hồng Neon' }
];

// ==========================================================================
// 3. TEMPLATES
// ==========================================================================
function renderEditModalTemplate(node) {
  const isRoot = node.parentId === null;
  const status = node.status || 'todo';
  const activeColor = node.color || '#8b5cf6';

  const colorSwatchesHtml = BASIC_NEURAL_COLORS.map(c => `
    <button type="button" class="neural-color-swatch ${activeColor.toLowerCase() === c.hex.toLowerCase() ? 'selected' : ''}" data-color="${c.hex}" title="${c.name}" style="--swatch-color: ${c.hex};">
      ${activeColor.toLowerCase() === c.hex.toLowerCase() ? '<i class="fa-solid fa-check"></i>' : ''}
    </button>
  `).join('');

  return `
    <div class="neural-editor-card">
      <div class="neural-editor-header">
        <h3>
          <i class="fa-solid fa-atom" id="neural-editor-icon-atom" style="color: ${escapeHtml(activeColor)};"></i>
          <span>${isRoot ? 'Chỉnh Sửa Node Gốc' : 'Chỉnh Sửa Khái Niệm'}</span>
        </h3>
        <button class="neural-close-btn" id="btn-close-neural-editor" title="Đóng">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="neural-form-group">
        <label for="neural-input-label">Tên khái niệm / Chủ đề <span style="color:#f87171;">*</span></label>
        <input type="text" id="neural-input-label" class="neural-input" value="${escapeHtml(node.label || '')}" placeholder="Ví dụ: Chương 1 - Đạo hàm, Slide bài giảng..." autofocus>
      </div>

      <div class="neural-form-group">
        <label for="neural-input-url">
          <i class="fa-solid fa-link" style="color:#38bdf8;"></i>
          <span>Link Tài Liệu / Google Drive / Web</span>
        </label>
        <input type="url" id="neural-input-url" class="neural-input" value="${escapeHtml(node.url || '')}" placeholder="https://drive.google.com/... hoặc https://youtube.com/...">
      </div>

      <div class="neural-form-group">
        <label>Màu sắc node nơ-ron (7 màu cơ bản)</label>
        <div class="neural-color-palette" id="neural-color-palette-container">
          ${colorSwatchesHtml}
        </div>
      </div>

      <div class="neural-form-group">
        <label>Trạng thái tiếp thu</label>
        <div class="neural-status-selector">
          <button type="button" class="neural-status-btn ${status === 'todo' ? 'selected' : ''}" data-status="todo">
            <i class="fa-regular fa-circle"></i> Cần học
          </button>
          <button type="button" class="neural-status-btn ${status === 'learning' ? 'selected' : ''}" data-status="learning">
            <i class="fa-solid fa-bolt" style="color:#f59e0b;"></i> Đang học
          </button>
          <button type="button" class="neural-status-btn ${status === 'completed' ? 'selected' : ''}" data-status="completed">
            <i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Đã hiểu
          </button>
        </div>
      </div>

      <div class="neural-form-group">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
          <label for="neural-input-notes">Ghi chú Markdown (.md)</label>
          <button type="button" class="btn-open-full-notepad-link" id="btn-open-notepad-from-edit" style="background: none; border: none; color: #818cf8; font-size: 0.76rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-file-pen"></i> Mở Bảng Notepad (50% Phải) ↗
          </button>
        </div>
        <textarea id="neural-input-notes" class="neural-input" style="min-height: 75px; resize: vertical; font-family: 'JetBrains Mono', monospace;" placeholder="Nhập ghi chú hoặc Markdown:&#10;• **In đậm**  • *In nghiêng*&#10;• <u>Gạch chân</u>  • ==Highlight==">${escapeHtml(node.notes || '')}</textarea>
        
        <!-- Bản xem trước đã gen ra (Live Preview) -->
        <div class="neural-modal-inline-preview" id="neural-inline-preview-box">
          <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-wand-magic-sparkles" style="color: #c084fc;"></i> Bản xem trước đã gen ra:
          </div>
          <div id="neural-inline-preview-content">
            ${renderMarkdownToHtml(node.notes || '')}
          </div>
        </div>
      </div>

      <div class="neural-editor-footer">
        <button type="button" class="neural-btn-danger" id="btn-delete-neural-node" data-step="1">
          <i class="fa-solid fa-trash-can"></i> ${isRoot ? 'Xóa Node Gốc' : 'Xóa nhánh này'}
        </button>
        <button type="button" class="neural-btn-save" id="btn-save-neural-node">
          <i class="fa-solid fa-check"></i> Lưu Thay Đổi
        </button>
      </div>
    </div>
  `;
}

// ==========================================================================
// 3. EVENT HANDLERS & MODAL CONTROLLER
// ==========================================================================
let currentEditorOverlay = null;

/**
 * Mở modal chỉnh sửa node nơ-ron
 * @param {string} subjectCode 
 * @param {Object} node 
 * @param {Function} onSavedCallback 
 * @param {Function} onDeletedCallback 
 */
export function openEditNeuralNodeModal(subjectCode, node, onSavedCallback, onDeletedCallback) {
  closeEditNeuralNodeModal();

  const overlay = document.createElement('div');
  overlay.className = 'neural-editor-overlay';
  overlay.innerHTML = renderEditModalTemplate(node);
  document.body.appendChild(overlay);
  currentEditorOverlay = overlay;

  // Fade in
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  let currentStatus = node.status || 'todo';
  let currentColor = node.color || '#8b5cf6';
  const atomIcon = overlay.querySelector('#neural-editor-icon-atom');

  // Color Swatches Selector (7 Basic Colors)
  const colorSwatches = overlay.querySelectorAll('.neural-color-swatch');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach(s => {
        s.classList.remove('selected');
        s.innerHTML = '';
      });
      swatch.classList.add('selected');
      swatch.innerHTML = '<i class="fa-solid fa-check"></i>';
      currentColor = swatch.dataset.color;
      if (atomIcon) {
        atomIcon.style.color = currentColor;
      }
    });
  });

  // Status Selector
  const statusBtns = overlay.querySelectorAll('.neural-status-btn');
  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentStatus = btn.dataset.status;
    });
  });

  // Close Events
  const closeBtn = overlay.querySelector('#btn-close-neural-editor');
  closeBtn.addEventListener('click', closeEditNeuralNodeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeEditNeuralNodeModal();
    }
  });

  // Save Event
  const saveBtn = overlay.querySelector('#btn-save-neural-node');
  const labelInput = overlay.querySelector('#neural-input-label');
  const urlInput = overlay.querySelector('#neural-input-url');
  const notesInput = overlay.querySelector('#neural-input-notes');
  const previewEl = overlay.querySelector('#neural-inline-preview-content');
  if (notesInput && previewEl) {
    notesInput.addEventListener('input', () => {
      previewEl.innerHTML = renderMarkdownToHtml(notesInput.value);
    });
  }

  saveBtn.addEventListener('click', () => {
    const newLabel = labelInput.value.trim();
    if (!newLabel) {
      labelInput.focus();
      return;
    }

    const updates = {
      label: newLabel,
      url: urlInput.value.trim(),
      color: currentColor,
      status: currentStatus,
      notes: notesInput.value.trim()
    };

    updateNeuralNode(subjectCode, node.id, updates);
    closeEditNeuralNodeModal();
    if (onSavedCallback) onSavedCallback(node.id, updates);
  });

  // Mở trực tiếp Bảng Notepad (50% bên phải)
  const openNotepadLink = overlay.querySelector('#btn-open-notepad-from-edit');
  if (openNotepadLink) {
    openNotepadLink.addEventListener('click', () => {
      const newLabel = labelInput.value.trim() || node.label;
      const updates = {
        label: newLabel,
        url: urlInput.value.trim(),
        color: currentColor,
        status: currentStatus,
        notes: notesInput.value
      };
      updateNeuralNode(subjectCode, node.id, updates);
      Object.assign(node, updates);

      closeEditNeuralNodeModal();

      const modalOverlay = document.querySelector('.neural-modal-overlay') || document.body;
      openNeuralNotepadSidebar(modalOverlay, subjectCode, node, () => {
        if (onSavedCallback) onSavedCallback(node.id, updates);
      });
    });
  }

  // Delete Event (Two-Step Inline Confirmation)
  const deleteBtn = overlay.querySelector('#btn-delete-neural-node');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const step = deleteBtn.getAttribute('data-step');
      if (step === '1') {
        deleteBtn.setAttribute('data-step', '2');
        deleteBtn.style.background = 'rgba(239, 68, 68, 0.35)';
        deleteBtn.innerHTML = isRoot
          ? '<i class="fa-solid fa-triangle-exclamation"></i> Nhấn lần nữa để xóa toàn bộ sơ đồ'
          : '<i class="fa-solid fa-triangle-exclamation"></i> Nhấn lần nữa để xóa';
      } else {
        deleteNeuralNode(subjectCode, node.id);
        closeEditNeuralNodeModal();
        if (onDeletedCallback) onDeletedCallback(node.id);
      }
    });
  }
}

/**
 * Đóng modal chỉnh sửa
 */
export function closeEditNeuralNodeModal() {
  if (currentEditorOverlay) {
    currentEditorOverlay.classList.remove('active');
    setTimeout(() => {
      if (currentEditorOverlay && currentEditorOverlay.parentNode) {
        currentEditorOverlay.parentNode.removeChild(currentEditorOverlay);
      }
      currentEditorOverlay = null;
    }, 200);
  }
}
