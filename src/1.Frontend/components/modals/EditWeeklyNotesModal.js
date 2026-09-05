/**
 * ==========================================================================
 * FRONTEND COMPONENT - EDIT WEEKLY NOTES MODAL
 * Modal chỉnh sửa danh sách Lưu ý & Ghi chú của tuần học hiện tại
 * ==========================================================================
 */

import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { showToast } from '../Toast.js';

const MODAL_ID = 'edit-weekly-notes-modal';
let isEventsBound = false;
let onSaveCallback = null;

// Các mẫu gợi ý ghi chú thông dụng cho sinh viên
const NOTE_PRESET_TEMPLATES = [
  'Tuần này bạn được nghỉ từ Thứ ... đến hết Thứ ..., lịch học tập trung vào ...',
  'Môn Đồ án Chuyên ngành vẫn tiếp tục tiến độ, bạn nhớ tự sắp xếp thời gian làm việc nhé.',
  'Tuần này có bài kiểm tra giữa kỳ môn ..., các bạn nhớ ôn tập kỹ.',
  'Hạn chót nộp Báo cáo / Bài tập lớn vào Chủ Nhật tuần này trước 23:59.',
  'Lịch thi vấn đáp / thuyết trình đề tài nhóm tại phòng ...',
  'Tuần nghỉ lễ theo quy định nhà trường, chúc bạn có kỳ nghỉ vui vẻ!'
];

/**
 * Đảm bảo khung HTML của Modal Chỉnh Sửa Ghi Chú Tuần đã tồn tại trong DOM
 */
export function ensureEditWeeklyNotesModalDom() {
  if (document.getElementById(MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.id = MODAL_ID;
  modalWrapper.className = 'modal-backdrop hidden';
  modalWrapper.innerHTML = `
    <div class="modal-card modal-card-md edit-weekly-notes-card" role="dialog" aria-modal="true">
      <!-- HEADER -->
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-icon-glow" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <i class="fa-solid fa-bell"></i>
          </div>
          <div>
            <h3 class="modal-title">Chỉnh Sửa Ghi Chú Tuần</h3>
            <span id="edit-notes-modal-subtitle" class="modal-subj-sub">Cập nhật các lưu ý, deadline hoặc nhắc nhở trong tuần</span>
          </div>
        </div>
        <button type="button" id="btn-close-edit-notes" class="btn-modal-close" title="Đóng (ESC)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- FORM BODY -->
      <form id="edit-weekly-notes-form" class="modal-form" style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; overflow-y: auto; max-height: 560px;">
        
        <!-- DANH SÁCH CÁC DÒNG GHI CHÚ ĐỘNG -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <label><i class="fa-solid fa-list-check" style="color: #f59e0b;"></i> Danh sách mục lưu ý tuần:</label>
            <button type="button" id="btn-add-note-row" class="btn-add-note-pill" title="Thêm dòng lưu ý mới">
              <i class="fa-solid fa-plus"></i> <span>Thêm dòng</span>
            </button>
          </div>
          <div id="notes-inputs-list-container" class="notes-inputs-list-container">
            <!-- Render động các input dòng ghi chú -->
          </div>
        </div>

        <!-- HOẶC NHẬP NHANH BẰNG TEXTAREA ĐA DÒNG -->
        <div class="form-group-styled">
          <details class="notes-bulk-input-details">
            <summary class="notes-bulk-summary">
              <span><i class="fa-solid fa-align-left"></i> Nhập nhanh nhiều dòng cùng lúc (Textarea)</span>
              <i class="fa-solid fa-chevron-down bulk-chevron"></i>
            </summary>
            <div class="bulk-textarea-wrap" style="padding-top: 0.65rem;">
              <textarea id="notes-bulk-textarea" rows="4" class="form-input-styled" placeholder="Mỗi dòng là một ghi chú...&#10;👉 Tuần này có bài kiểm tra...&#10;👉 Nộp đồ án đúng hạn..." style="resize: vertical; line-height: 1.5; font-size: 0.88rem;"></textarea>
              <div style="display: flex; justify-content: flex-end; margin-top: 0.4rem;">
                <button type="button" id="btn-sync-from-bulk" class="btn-ghost" style="font-size: 0.78rem; padding: 0.3rem 0.65rem;">
                  <i class="fa-solid fa-arrow-up-from-bracket"></i> Đồng bộ lên danh sách
                </button>
              </div>
            </div>
          </details>
        </div>

        <!-- CÁC MẪU LƯU Ý GỢI Ý NHANH -->
        <div class="form-group-styled">
          <label style="font-size: 0.78rem; color: var(--text-muted);"><i class="fa-regular fa-lightbulb" style="color: #f59e0b;"></i> Mẫu gợi ý nhanh (Bấm để chèn):</label>
          <div class="notes-preset-templates-row">
            ${NOTE_PRESET_TEMPLATES.map(tmpl => `
              <button type="button" class="btn-note-template-pill" data-template="${escapeHtml(tmpl)}">
                <i class="fa-solid fa-plus"></i>
                <span>${escapeHtml(tmpl)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- FOOTER BUTTONS -->
        <div class="modal-footer" style="padding: 1rem 0 0 0; margin-top: 0.5rem; display: flex; justify-content: flex-end; gap: 0.65rem; border-top: 1px solid var(--border-color);">
          <button type="button" id="btn-cancel-edit-notes" class="btn-ghost">Hủy</button>
          <button type="submit" class="btn-primary-gradient" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);">
            <i class="fa-solid fa-check"></i> <span>Lưu Ghi Chú Tuần</span>
          </button>
        </div>
      </form>
    </div>
  `;

  modalRoot.appendChild(modalWrapper);
  bindEditWeeklyNotesEvents();
}

/**
 * Render danh sách các dòng input ghi chú vào container
 * @param {Array<string>} notes 
 */
function renderNoteInputRows(notes = []) {
  const container = document.getElementById('notes-inputs-list-container');
  const bulkTextarea = document.getElementById('notes-bulk-textarea');
  if (!container) return;

  const validNotes = Array.isArray(notes) && notes.length > 0 ? notes : [''];

  container.innerHTML = validNotes.map((noteText, idx) => `
    <div class="note-input-row" data-row-idx="${idx}">
      <span class="note-bullet-prefix"><i class="fa-solid fa-hand-point-right"></i></span>
      <input type="text" class="form-input-styled note-row-input" value="${escapeHtml(noteText)}" placeholder="Nhập nội dung lưu ý tuần này (VD: Lịch thi, nhắc deadline...)" autocomplete="off">
      <button type="button" class="btn-delete-note-row" title="Xóa mục này">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');

  if (bulkTextarea) {
    bulkTextarea.value = validNotes.filter(n => n && n.trim()).join('\n');
  }

  // Gắn sự kiện xóa từng dòng
  container.querySelectorAll('.btn-delete-note-row').forEach(delBtn => {
    delBtn.onclick = () => {
      const row = delBtn.closest('.note-input-row');
      if (row) {
        row.remove();
        // Nếu xóa hết thì chèn lại 1 dòng trống
        if (container.querySelectorAll('.note-input-row').length === 0) {
          addSingleNoteRow('');
        }
      }
    };
  });
}

/**
 * Thêm một dòng input ghi chú mới vào cuối danh sách
 * @param {string} textValue 
 */
function addSingleNoteRow(textValue = '') {
  const container = document.getElementById('notes-inputs-list-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'note-input-row';
  row.innerHTML = `
    <span class="note-bullet-prefix"><i class="fa-solid fa-hand-point-right"></i></span>
    <input type="text" class="form-input-styled note-row-input" value="${escapeHtml(textValue)}" placeholder="Nhập nội dung lưu ý tuần này..." autocomplete="off">
    <button type="button" class="btn-delete-note-row" title="Xóa mục này">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  const delBtn = row.querySelector('.btn-delete-note-row');
  if (delBtn) {
    delBtn.onclick = () => {
      row.remove();
      if (container.querySelectorAll('.note-input-row').length === 0) {
        addSingleNoteRow('');
      }
    };
  }

  container.appendChild(row);
  const inputEl = row.querySelector('input');
  if (inputEl) inputEl.focus();
}

/**
 * Gắn các sự kiện cho Modal Chỉnh Sửa Ghi Chú Tuần
 */
function bindEditWeeklyNotesEvents() {
  if (isEventsBound) return;

  const modal = document.getElementById(MODAL_ID);
  const form = document.getElementById('edit-weekly-notes-form');
  const closeBtn = document.getElementById('btn-close-edit-notes');
  const cancelBtn = document.getElementById('btn-cancel-edit-notes');
  const addRowBtn = document.getElementById('btn-add-note-row');
  const syncBulkBtn = document.getElementById('btn-sync-from-bulk');
  const bulkTextarea = document.getElementById('notes-bulk-textarea');

  if (!modal || !form) return;

  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Nút Thêm Dòng
  if (addRowBtn) {
    addRowBtn.onclick = (e) => {
      e.preventDefault();
      addSingleNoteRow('');
    };
  }

  // Đồng bộ từ Textarea lên các dòng input
  if (syncBulkBtn && bulkTextarea) {
    syncBulkBtn.onclick = (e) => {
      e.preventDefault();
      const rawText = bulkTextarea.value.trim();
      const lines = rawText.split(/\r?\n/).map(l => l.replace(/^(?:👉|[-*•])\s*/, '').trim()).filter(Boolean);
      renderNoteInputRows(lines.length > 0 ? lines : ['']);
      showToast('Đã đồng bộ nội dung lên danh sách thẻ! ✨');
    };
  }

  // Bấm chèn mẫu gợi ý
  modal.querySelectorAll('.btn-note-template-pill').forEach(pill => {
    pill.onclick = (e) => {
      e.preventDefault();
      const tmpl = pill.dataset.template || '';
      if (tmpl) {
        addSingleNoteRow(tmpl);
        showToast('Đã chèn mẫu ghi chú! 💡');
      }
    };
  });

  // Submit Form Lưu Ghi Chú
  form.onsubmit = (e) => {
    e.preventDefault();
    const container = document.getElementById('notes-inputs-list-container');
    const noteInputs = container ? container.querySelectorAll('.note-row-input') : [];
    
    const updatedNotes = [];
    noteInputs.forEach(input => {
      const val = input.value.trim().replace(/^(?:👉|[-*•])\s*/, '');
      if (val) {
        updatedNotes.push(val);
      }
    });

    if (typeof onSaveCallback === 'function') {
      onSaveCallback(updatedNotes);
    }

    closeModal();
    showToast('Đã cập nhật Lưu ý & Ghi chú tuần thành công! 🎉');
  };

  isEventsBound = true;
}

/**
 * Mở Modal Chỉnh Sửa Ghi Chú Tuần
 * @param {Array<string>} currentNotes - Danh sách ghi chú hiện tại của tuần
 * @param {string} weekTitle - Tiêu đề hoặc tên tuần
 * @param {Function} onSave - Callback nhận danh sách ghi chú mới sau khi lưu
 */
export function openEditWeeklyNotesModal(currentNotes = [], weekTitle = '', onSave = null) {
  ensureEditWeeklyNotesModalDom();
  onSaveCallback = onSave;

  const modal = document.getElementById(MODAL_ID);
  const subtitleEl = document.getElementById('edit-notes-modal-subtitle');
  if (!modal) return;

  if (subtitleEl && weekTitle) {
    subtitleEl.textContent = `Chỉnh sửa ghi chú cho ${weekTitle}`;
  }

  renderNoteInputRows(currentNotes || []);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
