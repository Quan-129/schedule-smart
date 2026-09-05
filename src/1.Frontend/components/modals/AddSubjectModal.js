/**
 * ==========================================================================
 * FRONTEND COMPONENT - ADD SUBJECT MODAL
 * ==========================================================================
 */

import { state, persistDriveSubjects } from '../../../3.Database/state.js';
import { formatSafeUrl } from '../../../4.Security/urlValidator.js';
import { showToast } from '../Toast.js';
import { syncDriveSubjectsToCloud } from '../../../3.Database/auth/FirebaseAuthService.js';

let modalInitialized = false;

/**
 * Render template HTML của Modal vào DOM nếu chưa tồn tại
 */
export function ensureAddSubjectModalDom() {
  if (document.getElementById('add-subject-modal')) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div id="add-subject-modal" class="modal-backdrop hidden">
      <div class="modal-card modal-card-sm">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-glow" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);">
              <i class="fa-solid fa-book-bookmark"></i>
            </div>
            <div>
              <h3 class="modal-title" style="font-size: 1.15rem;">Thêm Môn Học Mới</h3>
              <span class="modal-subj-sub">Tạo phím tắt & chiếc cặp cho môn học</span>
            </div>
          </div>
          <button id="add-subject-close-btn" class="btn-modal-close" title="Đóng modal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="add-subject-form" class="modal-form">
          <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group-styled">
              <label for="new-subj-name-input"><i class="fa-solid fa-book-open"></i> Tên môn học <span class="required-star">*</span></label>
              <input type="text" id="new-subj-name-input" placeholder="Ví dụ: Giải tích 1, Vật lý đại cương..." required autofocus>
            </div>

            <div class="form-group-styled">
              <label for="new-subj-code-input"><i class="fa-solid fa-barcode"></i> Mã môn học <span class="required-star">*</span></label>
              <input type="text" id="new-subj-code-input" placeholder="Ví dụ: MT1003, PH1003, CO2001..." required style="text-transform: uppercase; font-family: var(--font-mono);">
            </div>

            <div class="form-group-styled">
              <label for="new-subj-drive-input"><i class="fa-brands fa-google-drive" style="color: #34a853;"></i> Link Google Drive (Tùy chọn)</label>
              <input type="url" id="new-subj-drive-input" placeholder="https://drive.google.com/drive/folders/...">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" id="add-subject-cancel-btn" class="btn-ghost">Hủy</button>
            <button type="submit" class="btn-primary-gradient"><i class="fa-solid fa-plus"></i> <span>Tạo Môn Học</span></button>
          </div>
        </form>
      </div>
    </div>
  `;
  modalRoot.appendChild(modalWrapper.firstElementChild);
}

export function openAddSubjectModal() {
  ensureAddSubjectModalDom();
  initAddSubjectModal();

  const modal = document.getElementById('add-subject-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

export function closeAddSubjectModal() {
  const modal = document.getElementById('add-subject-modal');
  const form = document.getElementById('add-subject-form');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  if (form) form.reset();
}

export function initAddSubjectModal() {
  ensureAddSubjectModalDom();
  if (modalInitialized) return;
  modalInitialized = true;

  const closeBtn = document.getElementById('add-subject-close-btn');
  const cancelBtn = document.getElementById('add-subject-cancel-btn');
  const form = document.getElementById('add-subject-form');

  if (closeBtn) closeBtn.onclick = closeAddSubjectModal;
  if (cancelBtn) cancelBtn.onclick = closeAddSubjectModal;

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('new-subj-name-input');
      const codeInput = document.getElementById('new-subj-code-input');
      const driveInput = document.getElementById('new-subj-drive-input');

      const name = nameInput ? nameInput.value.trim() : '';
      const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
      const driveUrl = driveInput ? driveInput.value.trim() : '';

      if (!name || !code) {
        showToast('Vui lòng nhập đầy đủ tên và mã môn học!');
        return;
      }

      if (state.driveSubjects.some(s => s.code === code)) {
        showToast(`Môn học có mã "${code}" đã tồn tại!`);
        return;
      }

      const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];
      const randomColor = palette[state.driveSubjects.length % palette.length];

      const newSubject = {
        name,
        code,
        englishName: name,
        credits: 3,
        driveUrl: driveUrl ? formatSafeUrl(driveUrl) : '',
        color: randomColor,
        notes: '',
        gradeItems: [
          { id: 'item-gk', name: 'Kiểm tra giữa kỳ', weight: 30, type: 'Tự luận', color: '#ec4899' },
          { id: 'item-ck', name: 'Thi cuối kỳ', weight: 50, type: 'Tự luận', color: '#6366f1' },
          { id: 'item-btl', name: 'Bài tập lớn', weight: 20, type: 'BTL', color: '#10b981' }
        ]
      };

      state.driveSubjects.push(newSubject);
      persistDriveSubjects();
      syncDriveSubjectsToCloud();

      closeAddSubjectModal();

      if (window.renderBackpackView) window.renderBackpackView();
      if (window.renderGradesView) window.renderGradesView();

      showToast(`Đã thêm môn "${name}" (${code}) vào hệ thống!`);
    };
  }
}
