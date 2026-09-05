/**
 * ==========================================================================
 * FRONTEND COMPONENT - ADD WEEK MODAL
 * ==========================================================================
 */

import { showToast } from '../Toast.js';
import { generateEmptyWeekMarkdown } from '../../../2.Backend/services/TimetableParser.js';

let modalInitialized = false;

/**
 * Render template HTML của Modal vào DOM nếu chưa tồn tại
 */
export function ensureAddWeekModalDom() {
  if (document.getElementById('add-week-modal')) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div id="add-week-modal" class="modal-backdrop hidden">
      <div class="modal-card modal-card-md">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-glow" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <i class="fa-solid fa-calendar-plus"></i>
            </div>
            <div>
              <h3 class="modal-title">Thêm Tuần Học Mới</h3>
              <div class="modal-badges-row">
                <span class="modal-subj-badge" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3);">Tạo lịch Markdown</span>
                <span class="modal-subj-sub">Tự động thêm vào danh sách tuần học</span>
              </div>
            </div>
          </div>
          <button type="button" id="add-week-close-btn" class="btn-modal-close" title="Đóng modal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="add-week-form" class="modal-form">
          <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; overflow-y: auto; max-height: 520px;">
            
            <div class="form-group-styled">
              <label for="new-week-title-input"><i class="fa-solid fa-heading"></i> Tên tuần hiển thị <span class="required-star">*</span></label>
              <input type="text" id="new-week-title-input" placeholder="Ví dụ: Tuần 51 (14/12)" required autofocus>
            </div>

            <div class="modal-grid-2col">
              <div class="form-group-styled">
                <label for="new-week-id-input"><i class="fa-solid fa-fingerprint"></i> Mã định danh (ID) <span class="required-star">*</span></label>
                <input type="text" id="new-week-id-input" placeholder="tuan-51" style="font-family: var(--font-mono);" required>
              </div>
              <div class="form-group-styled">
                <label for="new-week-date-input"><i class="fa-regular fa-calendar-days"></i> Ngày bắt đầu (Thứ 2)</label>
                <input type="date" id="new-week-date-input">
              </div>
            </div>

            <div class="form-group-styled">
              <label for="new-week-desc-input"><i class="fa-solid fa-align-left"></i> Ghi chú / Tiêu đề tuần</label>
              <input type="text" id="new-week-desc-input" placeholder="Ví dụ: Lịch học Tuần 51, thi cuối kỳ, nộp đồ án...">
            </div>

            <div class="form-group-styled">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.1rem;">
                <label for="new-week-md-content"><i class="fa-brands fa-markdown" style="color: #38bdf8;"></i> Nội dung Markdown Lịch học:</label>
                <button type="button" id="btn-copy-template-md" class="preset-chip" style="font-size: 0.76rem; padding: 0.25rem 0.65rem; color: #10b981; border-color: rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.1);">
                  <i class="fa-regular fa-copy"></i> Sao chép từ tuần trước
                </button>
              </div>
              <textarea id="new-week-md-content" rows="6" placeholder="# Lịch học Tuần 51 (14/12 - 20/12/2026)&#10;&#10;## Thứ 2&#10;- 07:00 - 08:50 | Tiết 1 - 2 | Nhập môn AI | Phòng: B4-301&#10;..."></textarea>
            </div>

          </div>

          <div class="modal-footer">
            <button type="button" id="add-week-cancel-btn" class="btn-ghost">Hủy</button>
            <button type="submit" class="btn-primary-gradient" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
              <i class="fa-solid fa-plus"></i> <span>Tạo Tuần Học</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  modalRoot.appendChild(modalWrapper.firstElementChild);
}

export function openAddWeekModal(onCopyTemplate) {
  ensureAddWeekModalDom();
  initAddWeekModal(onCopyTemplate);

  const modal = document.getElementById('add-week-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

export function closeAddWeekModal() {
  const modal = document.getElementById('add-week-modal');
  const form = document.getElementById('add-week-form');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  if (form) form.reset();
}

export function initAddWeekModal(getCurrentMarkdownCallback, onWeekCreatedCallback) {
  ensureAddWeekModalDom();
  if (modalInitialized) return;
  modalInitialized = true;

  const closeBtn = document.getElementById('add-week-close-btn');
  const cancelBtn = document.getElementById('add-week-cancel-btn');
  const copyBtn = document.getElementById('btn-copy-template-md');
  const form = document.getElementById('add-week-form');

  if (closeBtn) closeBtn.onclick = closeAddWeekModal;
  if (cancelBtn) cancelBtn.onclick = closeAddWeekModal;

  if (copyBtn) {
    copyBtn.onclick = () => {
      const textarea = document.getElementById('new-week-md-content');
      const currentMd = typeof getCurrentMarkdownCallback === 'function' ? getCurrentMarkdownCallback() : '';
      if (textarea && currentMd) {
        textarea.value = currentMd;
        showToast('Đã sao chép lịch học từ tuần hiện tại!');
      }
    };
  }

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('new-week-title-input');
      const idInput = document.getElementById('new-week-id-input');
      const dateInput = document.getElementById('new-week-date-input');
      const descInput = document.getElementById('new-week-desc-input');
      const mdInput = document.getElementById('new-week-md-content');

      const title = titleInput ? titleInput.value.trim() : '';
      let id = idInput ? idInput.value.trim().toLowerCase().replace(/\s+/g, '-') : '';
      const startDate = dateInput ? dateInput.value : '';
      const desc = descInput ? descInput.value.trim() : title;
      const mdContent = mdInput && mdInput.value.trim() ? mdInput.value.trim() : generateEmptyWeekMarkdown(title);

      if (!title || !id) {
        showToast('Vui lòng nhập tên và mã định danh tuần!');
        return;
      }

      if (!id.startsWith('tuan-')) {
        id = `tuan-${id}`;
      }

      const filename = `custom_${id}.md`;

      if (typeof onWeekCreatedCallback === 'function') {
        onWeekCreatedCallback({ title, id, startDate, desc, filename, mdContent });
      }

      closeAddWeekModal();
    };
  }
}
