/**
 * ==========================================================================
 * FRONTEND COMPONENT - EDIT SUBJECT & GRADE MODAL
 * Modal chỉnh sửa thông tin môn học, link Drive và cấu trúc % điểm động
 * ==========================================================================
 */

import { escapeHtml } from '../../4.Security/sanitizer.js';
import { formatSafeUrl } from '../../4.Security/urlValidator.js';
import { calculateGradeTotalWeight } from '../../2.Backend/services/GradeSolverService.js';
import { state, persistDriveSubjects } from '../../3.Database/state.js';
import { showToast } from './Toast.js';

let currentEditingSubject = null;

/**
 * Mở modal chỉnh sửa môn học
 * @param {string} subjectCode 
 * @param {Function} onSavedCallback 
 */
export function openEditSubjectModal(subjectCode, onSavedCallback) {
  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject) return;

  currentEditingSubject = subject;

  const modal = document.getElementById('edit-drive-modal');
  const codeEl = document.getElementById('edit-subject-code');
  const nameInput = document.getElementById('edit-subject-name-input');
  const driveInput = document.getElementById('edit-drive-url-input');
  const lecturerInput = document.getElementById('edit-lecturers-input');
  const notesInput = document.getElementById('edit-notes-input');

  if (codeEl) codeEl.textContent = subject.code;
  if (nameInput) nameInput.value = subject.name || '';
  if (driveInput) driveInput.value = subject.driveUrl || '';
  if (lecturerInput) lecturerInput.value = subject.lecturers || '';
  if (notesInput) notesInput.value = subject.notes || '';

  // Render danh sách các dòng điểm số
  renderGradeEditorRows(subject.gradeItems || []);

  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }

  // Gắn handler cho nút Lưu
  const form = document.getElementById('edit-drive-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      saveSubjectChanges(onSavedCallback);
    };
  }

  // Nút thêm hàng điểm
  const addRowBtn = document.getElementById('btn-add-grade-row');
  if (addRowBtn) {
    addRowBtn.onclick = () => {
      addGradeEditorRow();
    };
  }

  // Nút Đóng / Hủy
  const closeBtn = document.getElementById('edit-drive-close-btn');
  const cancelBtn = document.getElementById('edit-drive-cancel-btn');
  const handleClose = () => closeEditModal();
  if (closeBtn) closeBtn.onclick = handleClose;
  if (cancelBtn) cancelBtn.onclick = handleClose;
}

export function closeEditModal() {
  const modal = document.getElementById('edit-drive-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  currentEditingSubject = null;
}

/**
 * Render danh sách các dòng điểm trong Modal
 * @param {Array<Object>} items 
 */
export function renderGradeEditorRows(items) {
  const container = document.getElementById('grade-editor-rows-container');
  if (!container) return;

  container.innerHTML = '';
  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'grade-editor-row';
    row.innerHTML = `
      <input type="text" class="form-input grade-row-name" placeholder="Tên cột điểm (VD: Giữa kỳ)" value="${escapeHtml(item.name || '')}" required />
      <div class="grade-row-pct-wrapper">
        <input type="number" class="form-input grade-row-pct" placeholder="%" value="${item.weight || 0}" min="0" max="100" step="1" required />
        <span class="pct-unit">%</span>
      </div>
      <input type="color" class="grade-row-color" value="${item.color || '#6366f1'}" title="Mã màu lát cắt" />
      <button type="button" class="btn-remove-grade-row" title="Xóa cột điểm này">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    // Sự kiện xóa dòng
    row.querySelector('.btn-remove-grade-row').onclick = () => {
      row.remove();
      updateModalTotalWeightBadge();
    };

    // Sự kiện thay đổi % để cập nhật Badge tổng
    row.querySelector('.grade-row-pct').oninput = () => {
      updateModalTotalWeightBadge();
    };

    container.appendChild(row);
  });

  updateModalTotalWeightBadge();
}

export function addGradeEditorRow() {
  const container = document.getElementById('grade-editor-rows-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'grade-editor-row';
  row.innerHTML = `
    <input type="text" class="form-input grade-row-name" placeholder="Cột điểm mới" value="Đánh giá khác" required />
    <div class="grade-row-pct-wrapper">
      <input type="number" class="form-input grade-row-pct" placeholder="%" value="10" min="0" max="100" step="1" required />
      <span class="pct-unit">%</span>
    </div>
    <input type="color" class="grade-row-color" value="#10b981" title="Mã màu lát cắt" />
    <button type="button" class="btn-remove-grade-row" title="Xóa cột điểm này">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  row.querySelector('.btn-remove-grade-row').onclick = () => {
    row.remove();
    updateModalTotalWeightBadge();
  };

  row.querySelector('.grade-row-pct').oninput = () => {
    updateModalTotalWeightBadge();
  };

  container.appendChild(row);
  updateModalTotalWeightBadge();
}

function updateModalTotalWeightBadge() {
  const badge = document.getElementById('grade-total-pct-badge');
  if (!badge) return;

  const rows = document.querySelectorAll('.grade-editor-row');
  let total = 0;
  rows.forEach(r => {
    const val = parseFloat(r.querySelector('.grade-row-pct').value) || 0;
    total += val;
  });

  badge.textContent = `Tổng: ${total}%`;
  if (Math.abs(total - 100) < 0.01) {
    badge.className = 'badge-grade-total valid';
  } else {
    badge.className = 'badge-grade-total invalid';
  }
}

function saveSubjectChanges(onSavedCallback) {
  if (!currentEditingSubject) return;

  const nameInput = document.getElementById('edit-subject-name-input');
  const driveInput = document.getElementById('edit-drive-url-input');
  const lecturerInput = document.getElementById('edit-lecturers-input');
  const notesInput = document.getElementById('edit-notes-input');

  // Lấy dữ liệu từ các hàng điểm
  const rows = document.querySelectorAll('.grade-editor-row');
  const gradeItems = [];
  rows.forEach((r, idx) => {
    const name = r.querySelector('.grade-row-name').value.trim();
    const weight = parseFloat(r.querySelector('.grade-row-pct').value) || 0;
    const color = r.querySelector('.grade-row-color').value;
    if (name) {
      gradeItems.push({
        id: `item-custom-${idx + 1}`,
        name,
        weight,
        color
      });
    }
  });

  currentEditingSubject.name = nameInput ? nameInput.value.trim() : currentEditingSubject.name;
  currentEditingSubject.driveUrl = driveInput ? formatSafeUrl(driveInput.value) : '';
  currentEditingSubject.lecturers = lecturerInput ? lecturerInput.value.trim() : '';
  currentEditingSubject.notes = notesInput ? notesInput.value.trim() : '';
  currentEditingSubject.gradeItems = gradeItems;

  persistDriveSubjects();
  closeEditModal();
  showToast(`Đã lưu thay đổi môn ${currentEditingSubject.code}!`);

  if (typeof onSavedCallback === 'function') {
    onSavedCallback();
  }
}
