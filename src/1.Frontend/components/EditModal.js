/**
 * ==========================================================================
 * FRONTEND COMPONENT - EDIT SUBJECT & GRADE MODAL (3-PART MODULAR DESIGN)
 * Giao diện 3 phần chuẩn Apple / Glassmorphism:
 * 1. Google Drive & Link
 * 2. Tỉ Lệ Điểm (%)
 * 3. Quy Chế & Ghi Chú
 * ==========================================================================
 */

import { escapeHtml } from '../../4.Security/sanitizer.js';
import { formatSafeUrl } from '../../4.Security/urlValidator.js';
import { state, persistDriveSubjects } from '../../3.Database/state.js';
import { showToast } from './Toast.js';
import { syncDriveSubjectsToCloud } from '../../3.Database/auth/FirebaseAuthService.js';

let currentEditingSubject = null;
let modalEventsInitialized = false;

/**
 * Mở modal chỉnh sửa môn học (Hỗ trợ chỉ định Tab mở đầu)
 * @param {string} subjectCode 
 * @param {string} initialTab - 'tab-drive' | 'tab-grades' | 'tab-notes'
 */
export function openEditDriveModal(subjectCode, initialTab = 'tab-drive') {
  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject) return;

  currentEditingSubject = subject;

  const modal = document.getElementById('edit-drive-modal');
  const codeInput = document.getElementById('edit-drive-subject-code');
  const titleEl = document.getElementById('edit-drive-modal-title');
  const codeBadgeEl = document.getElementById('edit-drive-modal-code');
  const subEl = document.getElementById('edit-drive-modal-sub');
  const driveInput = document.getElementById('edit-drive-url-input');
  const notesInput = document.getElementById('edit-subject-notes-input');
  const deleteBtn = document.getElementById('edit-drive-delete-btn');

  if (codeInput) codeInput.value = subjectCode;
  if (titleEl) titleEl.textContent = subject.name;
  if (codeBadgeEl) codeBadgeEl.textContent = subject.code;
  if (subEl) subEl.textContent = `${subject.credits || 3} Tín chỉ • ${subject.englishName || 'Môn học'}`;
  if (driveInput) driveInput.value = subject.driveUrl || '';
  if (notesInput) notesInput.value = subject.notes || '';
  if (deleteBtn) deleteBtn.style.display = 'inline-flex';

  // Render các hàng điểm số
  renderGradeEditorRows(subject.gradeItems || []);

  // Khởi tạo sự kiện tab & preset nếu chưa có
  initModalInteractions();

  // Chuyển về Tab được yêu cầu
  switchModalTab(initialTab);

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

export function openEditSubjectModal(subjectCode) {
  openEditDriveModal(subjectCode, 'tab-grades');
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

/**
 * Điều hướng giữa 3 phần trong Modal
 * @param {string} tabId - 'tab-drive' | 'tab-grades' | 'tab-notes'
 */
export function switchModalTab(tabId) {
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  const paneMap = {
    'tab-drive': 'modal-tab-pane-drive',
    'tab-grades': 'modal-tab-pane-grades',
    'tab-notes': 'modal-tab-pane-notes'
  };

  const activePaneId = paneMap[tabId] || 'modal-tab-pane-drive';

  document.querySelectorAll('.modal-tab-pane').forEach(pane => {
    const isTarget = pane.id === activePaneId;
    pane.classList.toggle('active', isTarget);
    pane.style.display = isTarget ? 'block' : 'none';
  });
}

/**
 * Khởi tạo các sự kiện trong Modal (chỉ gắn 1 lần)
 */
function initModalInteractions() {
  if (modalEventsInitialized) return;
  modalEventsInitialized = true;

  // 1. Chuyển đổi 3 Tab
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchModalTab(btn.dataset.tab);
    });
  });

  // 2. Nút Thử Mở Drive
  const testDriveBtn = document.getElementById('btn-test-drive-link');
  if (testDriveBtn) {
    testDriveBtn.addEventListener('click', () => {
      const driveInput = document.getElementById('edit-drive-url-input');
      const url = driveInput ? driveInput.value.trim() : '';
      if (url) {
        window.open(url, '_blank');
      } else {
        showToast('Vui lòng dán link Google Drive trước khi mở thử!');
      }
    });
  }

  // 3. Các nút Mẫu Nhanh (Preset Chips)
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const notesInput = document.getElementById('edit-subject-notes-input');
      if (notesInput) {
        const textToAdd = chip.dataset.text || chip.textContent.replace('+', '').trim();
        const currentVal = notesInput.value.trim();
        notesInput.value = currentVal ? `${currentVal}\n- ${textToAdd}` : `- ${textToAdd}`;
        notesInput.focus();
        showToast(`Đã thêm: "${textToAdd}"`);
      }
    });
  });

  // 4. Form Submit
  const form = document.getElementById('edit-drive-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      saveSubjectDriveChanges();
    };
  }

  // 5. Nút Thêm Cột Điểm
  const addRowBtn = document.getElementById('btn-add-grade-item') || document.getElementById('btn-add-grade-row');
  if (addRowBtn) {
    addRowBtn.onclick = (e) => {
      e.preventDefault();
      addGradeEditorRow();
    };
  }

  // 6. Nút Xóa Môn
  const deleteBtn = document.getElementById('edit-drive-delete-btn');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (!currentEditingSubject) return;
      const code = currentEditingSubject.code;
      const name = currentEditingSubject.name;
      if (confirm(`Bạn có chắc chắn muốn xóa môn "${name}" (${code}) khỏi hệ thống?`)) {
        state.driveSubjects = state.driveSubjects.filter(s => s.code !== code);
        persistDriveSubjects();
        syncDriveSubjectsToCloud();
        closeEditDriveModal();
        if (window.renderBackpackView) window.renderBackpackView();
        if (window.renderGradesView) window.renderGradesView();
        showToast(`Đã xóa môn "${name}" (${code})!`);
      }
    };
  }

  // 7. Nút Đóng & Hủy
  const closeBtn = document.getElementById('edit-drive-close-btn');
  const cancelBtn = document.getElementById('edit-drive-cancel-btn');
  if (closeBtn) closeBtn.onclick = closeEditDriveModal;
  if (cancelBtn) cancelBtn.onclick = closeEditDriveModal;
}

/**
 * Render danh sách cột điểm trong bảng 6 cột chuẩn
 * @param {Array} gradeItems 
 */
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
        <input type="text" class="input-grade-name" placeholder="Tên cột (VD: Quiz, BTL...)" value="${escapeHtml(item.name || '')}" required>
      </div>
      <div class="grade-row-weight">
        <input type="number" class="input-grade-weight" min="0" max="100" step="1" value="${item.weight !== undefined ? item.weight : 10}" required>
        <span class="weight-unit">%</span>
      </div>
      <div class="grade-row-type">
        <input type="text" class="input-grade-type" placeholder="Hình thức" value="${escapeHtml(item.type || '')}">
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

/**
 * Thêm một hàng cột điểm mới
 */
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
      <input type="text" class="input-grade-name" placeholder="Tên cột mới" value="${escapeHtml(item.name || '')}" required>
    </div>
    <div class="grade-row-weight">
      <input type="number" class="input-grade-weight" min="0" max="100" step="1" value="${item.weight !== undefined ? item.weight : 10}" required>
      <span class="weight-unit">%</span>
    </div>
    <div class="grade-row-type">
      <input type="text" class="input-grade-type" placeholder="Hình thức" value="${escapeHtml(item.type || '')}">
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

/**
 * Tính toán và cập nhật huy hiệu tổng % điểm
 */
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
    switchModalTab('tab-grades');
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

  showToast(`Đã lưu thay đổi môn "${currentEditingSubject.name}"!`);
}

// Window aliases for backward compatibility
window.openEditDriveModal = openEditDriveModal;
window.openEditSubjectModal = openEditSubjectModal;
window.closeEditDriveModal = closeEditDriveModal;
window.switchModalTab = switchModalTab;
