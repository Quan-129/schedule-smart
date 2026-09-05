/**
 * ==========================================================================
 * FRONTEND COMPONENT - EDIT SUBJECT & GRADE MODAL (CHUẨN STYLE.CSS)
 * ==========================================================================
 */

import { escapeHtml } from '../../4.Security/sanitizer.js';
import { formatSafeUrl } from '../../4.Security/urlValidator.js';
import { state, persistDriveSubjects } from '../../3.Database/state.js';
import { showToast } from './Toast.js';
import { syncDriveSubjectsToCloud } from '../../3.Database/auth/FirebaseAuthService.js';

let currentEditingSubject = null;

export function openEditDriveModal(subjectCode) {
  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject) return;

  currentEditingSubject = subject;

  const modal = document.getElementById('edit-drive-modal');
  const codeInput = document.getElementById('edit-drive-subject-code');
  const titleEl = document.getElementById('edit-drive-modal-title');
  const subEl = document.getElementById('edit-drive-modal-sub');
  const driveInput = document.getElementById('edit-drive-url-input');
  const notesInput = document.getElementById('edit-subject-notes-input');
  const deleteBtn = document.getElementById('edit-drive-delete-btn');

  if (codeInput) codeInput.value = subjectCode;
  if (titleEl) titleEl.textContent = `Chỉnh Sửa Môn Học - ${subject.name}`;
  if (subEl) subEl.textContent = `Mã môn: ${subject.code}`;
  if (driveInput) driveInput.value = subject.driveUrl || '';
  if (notesInput) notesInput.value = subject.notes || '';
  if (deleteBtn) deleteBtn.style.display = 'inline-flex';

  // Render các hàng điểm số
  renderGradeEditorRows(subject.gradeItems || []);

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
  }

  // Gắn form submit
  const form = document.getElementById('edit-drive-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      saveSubjectDriveChanges();
    };
  }

  // Nút thêm hàng điểm
  const addRowBtn = document.getElementById('btn-add-grade-item') || document.getElementById('btn-add-grade-row');
  if (addRowBtn) {
    addRowBtn.onclick = (e) => {
      e.preventDefault();
      addGradeEditorRow();
    };
  }

  // Nút xóa môn trong modal
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (confirm(`Bạn có chắc muốn xóa môn "${subject.name}" (${subject.code}) khỏi Chiếc Cặp?`)) {
        state.driveSubjects = state.driveSubjects.filter(s => s.code !== subjectCode);
        persistDriveSubjects();
        syncDriveSubjectsToCloud();
        closeEditDriveModal();
        if (window.renderBackpackView) window.renderBackpackView();
        if (window.renderGradesView) window.renderGradesView();
        showToast(`Đã xóa môn ${subject.name}!`);
      }
    };
  }

  // Nút đóng / hủy
  const closeBtn = document.getElementById('edit-drive-close-btn');
  const cancelBtn = document.getElementById('edit-drive-cancel-btn');
  if (closeBtn) closeBtn.onclick = closeEditDriveModal;
  if (cancelBtn) cancelBtn.onclick = closeEditDriveModal;
}

export function closeEditDriveModal() {
  const modal = document.getElementById('edit-drive-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  currentEditingSubject = null;
}

export function renderGradeEditorRows(gradeItems = []) {
  const container = document.getElementById('grade-items-editor-container');
  if (!container) return;

  container.innerHTML = '';
  const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];

  if (gradeItems.length === 0) {
    gradeItems = [
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ', weight: 30, type: 'Tự luận', color: '#ec4899' },
      { id: 'item-ck', name: 'Thi cuối kỳ', weight: 50, type: 'Tự luận', color: '#6366f1' },
      { id: 'item-btl', name: 'Bài tập lớn', weight: 20, type: 'BTL', color: '#10b981' }
    ];
  }

  gradeItems.forEach((item, idx) => {
    const color = item.color || palette[idx % palette.length];
    const row = document.createElement('div');
    row.className = 'grade-item-row';
    row.dataset.itemId = item.id || `item-${idx + 1}`;

    row.innerHTML = `
      <div class="grade-row-handle" title="Kéo để sắp xếp"><i class="fa-solid fa-grip-vertical"></i></div>
      <div class="grade-row-name">
        <input type="text" class="input-grade-name" placeholder="Tên cột (VD: Chuyên cần, Quiz...)" value="${escapeHtml(item.name || '')}" required>
      </div>
      <div class="grade-row-weight">
        <input type="number" class="input-grade-weight" min="0" max="100" step="1" value="${item.weight !== undefined ? item.weight : 10}" required>
        <span class="weight-unit">%</span>
      </div>
      <div class="grade-row-type">
        <input type="text" class="input-grade-type" placeholder="Loại (Tự luận, BTL...)" value="${escapeHtml(item.type || '')}">
      </div>
      <div class="grade-row-color">
        <input type="color" class="input-grade-color" value="${color}" title="Chọn màu nhận diện">
      </div>
      <button type="button" class="btn-delete-grade-row" title="Xóa cột điểm này">
        <i class="fa-solid fa-minus"></i>
      </button>
    `;

    const weightInput = row.querySelector('.input-grade-weight');
    weightInput.addEventListener('input', calculateGradeTotal);

    const deleteBtn = row.querySelector('.btn-delete-grade-row');
    deleteBtn.addEventListener('click', () => {
      row.remove();
      calculateGradeTotal();
    });

    container.appendChild(row);
  });

  calculateGradeTotal();
}

export function addGradeEditorRow(item = {}) {
  const container = document.getElementById('grade-items-editor-container');
  if (!container) return;

  const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];
  const count = container.querySelectorAll('.grade-item-row').length;
  const color = item.color || palette[count % palette.length];

  const row = document.createElement('div');
  row.className = 'grade-item-row';
  row.dataset.itemId = item.id || `item-new-${Date.now()}`;

  row.innerHTML = `
    <div class="grade-row-handle" title="Kéo để sắp xếp"><i class="fa-solid fa-grip-vertical"></i></div>
    <div class="grade-row-name">
      <input type="text" class="input-grade-name" placeholder="Tên cột (VD: Chuyên cần, Quiz...)" value="${escapeHtml(item.name || '')}" required>
    </div>
    <div class="grade-row-weight">
      <input type="number" class="input-grade-weight" min="0" max="100" step="1" value="${item.weight !== undefined ? item.weight : 10}" required>
      <span class="weight-unit">%</span>
    </div>
    <div class="grade-row-type">
      <input type="text" class="input-grade-type" placeholder="Loại (Tự luận, BTL...)" value="${escapeHtml(item.type || '')}">
    </div>
    <div class="grade-row-color">
      <input type="color" class="input-grade-color" value="${color}" title="Chọn màu nhận diện">
    </div>
    <button type="button" class="btn-delete-grade-row" title="Xóa cột điểm này">
      <i class="fa-solid fa-minus"></i>
    </button>
  `;

  const weightInput = row.querySelector('.input-grade-weight');
  weightInput.addEventListener('input', calculateGradeTotal);

  const deleteBtn = row.querySelector('.btn-delete-grade-row');
  deleteBtn.addEventListener('click', () => {
    row.remove();
    calculateGradeTotal();
  });

  container.appendChild(row);
  row.querySelector('.input-grade-name').focus();
  calculateGradeTotal();
}

export function calculateGradeTotal() {
  const container = document.getElementById('grade-items-editor-container');
  const badge = document.getElementById('edit-grade-total-badge');
  if (!container || !badge) return 0;

  const rows = container.querySelectorAll('.grade-item-row');
  let total = 0;
  rows.forEach(r => {
    const w = parseFloat(r.querySelector('.input-grade-weight')?.value) || 0;
    total += w;
  });

  badge.classList.remove('valid', 'invalid', 'overflow');

  if (total === 100) {
    badge.classList.add('valid');
    badge.innerHTML = `<i class="fa-solid fa-check"></i> Tổng: 100% (Chuẩn)`;
  } else if (total > 100) {
    badge.classList.add('overflow');
    badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Tổng: ${total}% (Thừa ${total - 100}%)`;
  } else {
    badge.classList.add('invalid');
    badge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Tổng: ${total}% (Thiếu ${100 - total}%)`;
  }

  return total;
}

export function getGradeEditorData() {
  const container = document.getElementById('grade-items-editor-container');
  if (!container) return [];
  const rows = container.querySelectorAll('.grade-item-row');
  const items = [];
  rows.forEach((r, idx) => {
    const name = r.querySelector('.input-grade-name')?.value.trim() || `Cột ${idx + 1}`;
    const weight = parseFloat(r.querySelector('.input-grade-weight')?.value) || 0;
    const type = r.querySelector('.input-grade-type')?.value.trim() || 'Đánh giá';
    const color = r.querySelector('.input-grade-color')?.value || '#6366f1';
    items.push({
      id: `item-${idx + 1}-${Date.now()}`,
      name: name,
      weight: weight,
      type: type,
      color: color
    });
  });
  return items;
}

function saveSubjectDriveChanges() {
  if (!currentEditingSubject) return;

  const driveInput = document.getElementById('edit-drive-url-input');
  const notesInput = document.getElementById('edit-subject-notes-input');

  const gradeItems = getGradeEditorData();
  const total = calculateGradeTotal();

  if (total > 100) {
    showToast('Tổng tỉ lệ điểm vượt quá 100%. Vui lòng điều chỉnh lại!');
    return;
  }

  currentEditingSubject.driveUrl = driveInput ? formatSafeUrl(driveInput.value) : '';
  currentEditingSubject.notes = notesInput ? notesInput.value.trim() : '';
  currentEditingSubject.gradeItems = gradeItems;

  persistDriveSubjects();
  syncDriveSubjectsToCloud();
  closeEditDriveModal();

  if (window.renderBackpackView) window.renderBackpackView();
  if (window.renderGradesView) window.renderGradesView();

  showToast(`Đã lưu thay đổi môn ${currentEditingSubject.name}!`);
}

// Window aliases for backward compatibility
window.openEditDriveModal = openEditDriveModal;
window.closeEditDriveModal = closeEditDriveModal;
export const openEditSubjectModal = openEditDriveModal;
