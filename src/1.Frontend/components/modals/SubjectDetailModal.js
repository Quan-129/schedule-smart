/**
 * @file SubjectDetailModal.js
 * @description Component Modal hiển thị trang chi tiết môn học (Subject Hub) siêu tinh gọn, không cần cuộn chuột
 * @module 1.Frontend/components/modals/SubjectDetailModal
 */

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { state } from '../../../3.Database/state.js';
import { showToast } from '../Toast.js';
import { openEditDriveModal } from './EditSubjectModal.js';

// ============================================================================
// 2. CONSTANTS & DOM SELECTORS
// ============================================================================
const MODAL_ID = 'subject-detail-modal';
let currentSubjectCode = null;
let isEventsBound = false;

// ============================================================================
// 3. COMPONENT TEMPLATE / DOM GENERATION
// ============================================================================

/**
 * Đảm bảo khung DOM của Modal đã tồn tại trong #modal-root
 */
export function ensureSubjectDetailModalDom() {
  if (document.getElementById(MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.id = MODAL_ID;
  modalWrapper.className = 'modal-backdrop hidden';
  modalWrapper.innerHTML = `
    <div class="modal-card subject-detail-card-compact" role="dialog" aria-modal="true">
      <div id="subject-detail-content">
        <!-- Nội dung động được nạp qua renderSubjectDetail() -->
      </div>
    </div>
  `;

  modalRoot.appendChild(modalWrapper);
  bindSubjectDetailEvents();
}

/**
 * Render thanh Segmented Bar phân khúc tỉ lệ điểm
 * @param {Array<Object>} gradeItems 
 * @param {string} subjectColor
 * @returns {string} HTML string
 */
function renderSegmentedGradeBar(gradeItems = [], subjectColor = '#6366f1') {
  if (!gradeItems || gradeItems.length === 0) {
    return `
      <div class="compact-empty-grades">
        <span>Chưa có dữ liệu tỉ lệ điểm</span>
      </div>
    `;
  }

  const totalWeight = gradeItems.reduce((sum, i) => sum + (Number(i.weight) || 0), 0) || 100;

  const barSegments = gradeItems.map(item => {
    const w = Number(item.weight) || 0;
    const color = item.color || subjectColor;
    return `<div class="compact-grade-seg" style="width: ${(w / totalWeight) * 100}%; background-color: ${color};" title="${escapeHtml(item.name)}: ${w}%"></div>`;
  }).join('');

  const tagsHtml = gradeItems.map(item => {
    const w = Number(item.weight) || 0;
    const color = item.color || subjectColor;
    return `
      <div class="compact-grade-tag">
        <span class="compact-tag-dot" style="background-color: ${color};"></span>
        <span class="compact-tag-name">${escapeHtml(item.name)}</span>
        <strong class="compact-tag-val" style="color: ${color};">${w}%</strong>
      </div>
    `;
  }).join('');

  return `
    <div class="compact-grade-segmented-bar">
      ${barSegments}
    </div>
    <div class="compact-grade-tags-grid">
      ${tagsHtml}
    </div>
  `;
}

/**
 * Render toàn bộ nội dung chi tiết của môn học vào Modal siêu tinh gọn
 * @param {Object} subject 
 */
function renderSubjectDetail(subject) {
  const container = document.getElementById('subject-detail-content');
  if (!container) return;

  const subjectColor = subject.color || '#6366f1';
  const gradeItems = subject.gradeItems || [];
  const hasDrive = Boolean(subject.driveUrl && subject.driveUrl.trim());

  container.innerHTML = `
    <!-- 1. COMPACT HEADER -->
    <div class="compact-detail-header" style="--subj-accent: ${subjectColor};">
      <div class="compact-header-main">
        <div class="compact-icon-box" style="background: ${subjectColor}20; border-color: ${subjectColor}50; color: ${subjectColor};">
          <i class="${subject.icon || 'fa-solid fa-book-bookmark'}"></i>
        </div>
        <div class="compact-header-text">
          <div class="compact-badges-row">
            <span class="compact-code-badge">${escapeHtml(subject.code)}</span>
            ${subject.credits ? `<span class="compact-credits-badge">${subject.credits} Tín chỉ</span>` : ''}
          </div>
          <h3 class="compact-subj-name">${escapeHtml(subject.name)}</h3>
          ${subject.englishName ? `<div class="compact-subj-en">${escapeHtml(subject.englishName)}</div>` : ''}
        </div>
      </div>
      <button type="button" id="btn-close-subject-detail" class="btn-compact-close" title="Đóng (ESC)">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div class="compact-detail-body">
      <!-- 2. QUICK CTA ACTION BUTTONS -->
      <div class="compact-cta-row">
        ${hasDrive ? `
          <a href="${escapeHtml(subject.driveUrl.trim())}" target="_blank" rel="noopener noreferrer" class="btn-compact-drive btn-compact-drive--active">
            <i class="fa-brands fa-google-drive"></i>
            <span>Mở Thư Mục Google Drive</span>
            <i class="fa-solid fa-arrow-up-right-from-square compact-arrow-icon"></i>
          </a>
        ` : `
          <button type="button" class="btn-compact-drive btn-compact-drive--empty" data-action="edit-link" data-code="${escapeHtml(subject.code)}">
            <i class="fa-brands fa-google-drive"></i>
            <span>Chưa gắn link Drive (+ Thêm)</span>
          </button>
        `}
        <button type="button" class="btn-compact-edit" data-action="edit-subject" data-code="${escapeHtml(subject.code)}" title="Chỉnh sửa môn học">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>Sửa</span>
        </button>
      </div>

      <!-- 3. PHẦN TỶ LỆ THÀNH PHẦN ĐIỂM -->
      <div class="compact-section-box">
        <div class="compact-box-header">
          <div class="compact-box-title">
            <i class="fa-solid fa-chart-pie" style="color: #6366f1;"></i>
            <span>Tỷ Lệ Thành Phần Điểm</span>
          </div>
          <button type="button" class="btn-compact-mini-edit" data-action="edit-grades" data-code="${escapeHtml(subject.code)}">
            <i class="fa-solid fa-sliders"></i> Sửa
          </button>
        </div>
        ${renderSegmentedGradeBar(gradeItems, subjectColor)}
      </div>

      <!-- 4. PHẦN GHI CHÚ MÔN HỌC -->
      <div class="compact-section-box">
        <div class="compact-box-header">
          <div class="compact-box-title">
            <i class="fa-solid fa-clipboard-list" style="color: #f59e0b;"></i>
            <span>Ghi Chú & Lưu Ý</span>
          </div>
          <button type="button" class="btn-compact-mini-edit" data-action="edit-notes" data-code="${escapeHtml(subject.code)}">
            <i class="fa-solid fa-pen"></i> Sửa
          </button>
        </div>
        <div class="compact-notes-content">
          ${subject.notes && subject.notes.trim() ? `
            <p>${escapeHtml(subject.notes)}</p>
          ` : `
            <span class="compact-empty-text">Chưa có ghi chú nào.</span>
          `}
        </div>
      </div>

      <!-- 5. FOOTER INFO (GIẢNG VIÊN & KHOA) -->
      ${(subject.department || subject.lecturers) ? `
        <div class="compact-meta-footer">
          ${subject.department ? `<span><i class="fa-solid fa-building-columns"></i> ${escapeHtml(subject.department)}</span>` : ''}
          ${subject.lecturers ? `<span><i class="fa-solid fa-chalkboard-user"></i> ${escapeHtml(subject.lecturers)}</span>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// 4. EVENT HANDLERS & DOM BINDING
// ============================================================================

/**
 * Gắn các sự kiện cho Modal chi tiết môn học
 */
function bindSubjectDetailEvents() {
  if (isEventsBound) return;
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;

  // 1. Đóng modal khi click ra backdrop ngoài
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSubjectDetailModal();
    }
  });

  // 2. Bắt sự kiện click các nút bên trong modal
  modal.addEventListener('click', (e) => {
    // Nút đóng (X)
    if (e.target.closest('#btn-close-subject-detail')) {
      closeSubjectDetailModal();
      return;
    }

    // Nút mở chỉnh sửa môn (toàn bộ)
    const editSubjBtn = e.target.closest('[data-action="edit-subject"]');
    if (editSubjBtn) {
      const code = editSubjBtn.dataset.code;
      closeSubjectDetailModal();
      openEditDriveModal(code, 'tab-drive');
      return;
    }

    // Nút chỉnh sửa link Drive
    const editLinkBtn = e.target.closest('[data-action="edit-link"]');
    if (editLinkBtn) {
      const code = editLinkBtn.dataset.code;
      closeSubjectDetailModal();
      openEditDriveModal(code, 'tab-drive');
      return;
    }

    // Nút chỉnh sửa tỉ lệ điểm
    const editGradesBtn = e.target.closest('[data-action="edit-grades"]');
    if (editGradesBtn) {
      const code = editGradesBtn.dataset.code;
      closeSubjectDetailModal();
      openEditDriveModal(code, 'tab-grades');
      return;
    }

    // Nút chỉnh sửa ghi chú
    const editNotesBtn = e.target.closest('[data-action="edit-notes"]');
    if (editNotesBtn) {
      const code = editNotesBtn.dataset.code;
      closeSubjectDetailModal();
      openEditDriveModal(code, 'tab-notes');
      return;
    }
  });

  // 3. Phím ESC đóng modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeSubjectDetailModal();
    }
  });

  isEventsBound = true;
}

// ============================================================================
// 5. PUBLIC CONTROLLER / EXPORTS
// ============================================================================

/**
 * Mở trang chi tiết môn học siêu tinh gọn
 * @param {string} subjectCode - Mã môn học cần hiển thị
 */
export function openSubjectDetailModal(subjectCode) {
  ensureSubjectDetailModalDom();
  const subject = (state.driveSubjects || []).find(s => s.code === subjectCode);

  if (!subject) {
    showToast(`Không tìm thấy thông tin cho môn ${subjectCode}`);
    return;
  }

  currentSubjectCode = subjectCode;
  renderSubjectDetail(subject);

  const modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Đóng trang chi tiết môn học
 */
export function closeSubjectDetailModal() {
  const modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  currentSubjectCode = null;
}
