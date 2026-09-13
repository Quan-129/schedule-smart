// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { updateNeuralNode, deleteNeuralNode } from '../../../3.Database/state.js';

// ==========================================================================
// 2. TEMPLATES
// ==========================================================================
function renderEditModalTemplate(node) {
  const isRoot = node.parentId === null;
  const status = node.status || 'todo';

  return `
    <div class="neural-editor-card">
      <div class="neural-editor-header">
        <h3>
          <i class="fa-solid fa-atom" style="color: ${escapeHtml(node.color || '#818cf8')};"></i>
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
        <label for="neural-input-notes">Ghi chú vắn tắt</label>
        <input type="text" id="neural-input-notes" class="neural-input" value="${escapeHtml(node.notes || '')}" placeholder="Mẹo nhớ, trang tài liệu cần đọc kỹ...">
      </div>

      <div class="neural-editor-footer">
        ${!isRoot ? `
          <button type="button" class="neural-btn-danger" id="btn-delete-neural-node" data-step="1">
            <i class="fa-solid fa-trash-can"></i> Xóa nhánh này
          </button>
        ` : `<div></div>`}
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

  saveBtn.addEventListener('click', () => {
    const newLabel = labelInput.value.trim();
    if (!newLabel) {
      labelInput.focus();
      return;
    }

    const updates = {
      label: newLabel,
      url: urlInput.value.trim(),
      status: currentStatus,
      notes: notesInput.value.trim()
    };

    updateNeuralNode(subjectCode, node.id, updates);
    closeEditNeuralNodeModal();
    if (onSavedCallback) onSavedCallback(node.id, updates);
  });

  // Delete Event (Two-Step Inline Confirmation)
  const deleteBtn = overlay.querySelector('#btn-delete-neural-node');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const step = deleteBtn.getAttribute('data-step');
      if (step === '1') {
        deleteBtn.setAttribute('data-step', '2');
        deleteBtn.style.background = 'rgba(239, 68, 68, 0.35)';
        deleteBtn.style.borderColor = '#ef4444';
        deleteBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Nhấn lần nữa để xóa';
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
