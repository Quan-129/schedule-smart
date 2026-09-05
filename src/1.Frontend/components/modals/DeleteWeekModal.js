/**
 * ==========================================================================
 * FRONTEND COMPONENT - DELETE WEEK MODAL (src/1.Frontend/components/modals/DeleteWeekModal.js)
 * Modal xác nhận xóa tuần học an toàn với giao diện Glassmorphism Dark Mode
 * ==========================================================================
 */

import { escapeHtml } from '../../../4.Security/sanitizer.js';

let modalInitialized = false;
let currentPendingWeek = null;
let currentConfirmCallback = null;

/**
 * Khởi tạo khung DOM của Modal Xác Nhận Xóa Tuần
 */
export function ensureDeleteWeekModalDom() {
  if (document.getElementById('delete-week-modal')) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div id="delete-week-modal" class="modal-backdrop hidden">
      <div class="modal-card modal-card-sm" style="max-width: 440px;">
        <div class="modal-header" style="border-bottom-color: rgba(239, 68, 68, 0.2);">
          <div class="modal-title-group">
            <div class="modal-icon-glow" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 class="modal-title" style="color: #f87171;">Xác Nhận Xóa Tuần</h3>
              <div class="modal-badges-row">
                <span class="modal-subj-badge" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">Hành động nguy hiểm</span>
              </div>
            </div>
          </div>
          <button type="button" id="delete-week-close-btn" class="btn-modal-close" title="Đóng"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div style="padding: 1.5rem 1.5rem 1.25rem 1.5rem;">
          <p style="color: var(--text-primary); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem;">
            Bạn có chắc chắn muốn xóa tuần học này không?
          </p>

          <div id="delete-week-info-card" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.2rem;">
            <div id="delete-week-name" style="font-weight: 700; color: #f87171; font-size: 1.05rem; margin-bottom: 0.35rem;">Tuần học</div>
            <div id="delete-week-meta" style="font-size: 0.82rem; color: var(--text-muted); display: flex; gap: 0.8rem; flex-wrap: wrap;">
              <span id="delete-week-subjects"><i class="fa-solid fa-graduation-cap"></i> -- môn</span>
              <span id="delete-week-classes"><i class="fa-solid fa-book-open"></i> -- tiết</span>
            </div>
          </div>

          <p style="color: var(--text-muted); font-size: 0.82rem; line-height: 1.4;">
            <i class="fa-solid fa-circle-info" style="color: #f59e0b;"></i> Dữ liệu lịch học của tuần này sẽ bị xóa khỏi danh sách. Bạn có thể thêm lại tuần bất kỳ lúc nào qua nút <strong>+ Thêm Tuần</strong>.
          </p>
        </div>

        <div class="modal-footer" style="background: rgba(0, 0, 0, 0.2); justify-content: flex-end; gap: 0.75rem;">
          <button type="button" id="delete-week-cancel-btn" class="btn-ghost" style="padding: 0.55rem 1.2rem;">Hủy</button>
          <button type="button" id="delete-week-confirm-btn" class="btn-primary-gradient" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35); border: none; padding: 0.55rem 1.2rem;">
            <i class="fa-solid fa-trash-can"></i> <span>Xác Nhận Xóa</span>
          </button>
        </div>
      </div>
    </div>
  `;
  modalRoot.appendChild(modalWrapper.firstElementChild);

  initDeleteWeekModalEvents();
}

/**
 * Gắn sự kiện các nút đóng/hủy/xác nhận
 */
function initDeleteWeekModalEvents() {
  if (modalInitialized) return;
  modalInitialized = true;

  const closeBtn = document.getElementById('delete-week-close-btn');
  const cancelBtn = document.getElementById('delete-week-cancel-btn');
  const confirmBtn = document.getElementById('delete-week-confirm-btn');

  if (closeBtn) closeBtn.onclick = closeDeleteWeekModal;
  if (cancelBtn) cancelBtn.onclick = closeDeleteWeekModal;

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (currentPendingWeek && typeof currentConfirmCallback === 'function') {
        currentConfirmCallback(currentPendingWeek);
      }
      closeDeleteWeekModal();
    };
  }
}

/**
 * Mở modal xác nhận xóa tuần
 * @param {Object} weekObj 
 * @param {Object} scheduleData 
 * @param {Function} onConfirm 
 */
export function openDeleteWeekModal(weekObj, scheduleData, onConfirm) {
  ensureDeleteWeekModalDom();

  currentPendingWeek = weekObj;
  currentConfirmCallback = onConfirm;

  const nameEl = document.getElementById('delete-week-name');
  const subjEl = document.getElementById('delete-week-subjects');
  const classEl = document.getElementById('delete-week-classes');

  if (nameEl && weekObj) {
    nameEl.textContent = weekObj.title || weekObj.id || 'Tuần học';
  }

  let subjectCount = 0;
  let classCount = 0;
  if (scheduleData) {
    subjectCount = (scheduleData.subjects || []).length;
    (scheduleData.days || []).forEach(d => {
      classCount += (d.classes || []).length;
    });
  }

  if (subjEl) subjEl.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${subjectCount} môn`;
  if (classEl) classEl.innerHTML = `<i class="fa-solid fa-book-open"></i> ${classCount} tiết`;

  const modal = document.getElementById('delete-week-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

/**
 * Đóng modal xác nhận xóa tuần
 */
export function closeDeleteWeekModal() {
  const modal = document.getElementById('delete-week-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  currentPendingWeek = null;
  currentConfirmCallback = null;
}
