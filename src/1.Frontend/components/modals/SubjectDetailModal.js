/**
 * @file SubjectDetailModal.js
 * @description Component Modal hiển thị trang chi tiết môn học (Subject Hub): Tỉ lệ thành phần điểm, Ghi chú môn học, và Nút vào Google Drive.
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
    <div class="modal-card modal-card-lg subject-detail-card" role="dialog" aria-modal="true">
      <div id="subject-detail-content">
        <!-- Nội dung động được nạp qua renderSubjectDetail() -->
      </div>
    </div>
  `;

  modalRoot.appendChild(modalWrapper);
  bindSubjectDetailEvents();
}

/**
 * Tạo SVG Donut Chart hiển thị tỉ lệ điểm môn học
 * @param {Array<Object>} gradeItems 
 * @returns {string} HTML SVG string
 */
function renderDonutChartSvg(gradeItems = []) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const totalWeight = gradeItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  if (!gradeItems || gradeItems.length === 0 || totalWeight === 0) {
    return `
      <div class="detail-donut-wrapper">
        <svg class="donut-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="14" opacity="0.3" />
        </svg>
        <div class="detail-donut-info">
          <span class="detail-donut-val">0%</span>
          <span class="detail-donut-sub">Chưa có %</span>
        </div>
      </div>
    `;
  }

  let cumulative = 0;
  const slices = gradeItems.map((item) => {
    const weightNum = Number(item.weight) || 0;
    const strokeDash = (weightNum / totalWeight) * circumference;
    const strokeOffset = -(cumulative / totalWeight) * circumference;
    cumulative += weightNum;

    return `
      <circle class="donut-slice" 
        cx="50" cy="50" r="${radius}" 
        stroke="${item.color || '#6366f1'}" 
        stroke-width="14"
        stroke-dasharray="${strokeDash} ${circumference}" 
        stroke-dashoffset="${strokeOffset}"
        title="${escapeHtml(item.name || '')}: ${weightNum}%"
      />
    `;
  }).join('');

  return `
    <div class="detail-donut-wrapper">
      <svg class="donut-svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="14" opacity="0.3" />
        ${slices}
      </svg>
      <div class="detail-donut-info">
        <span class="detail-donut-val">${totalWeight}%</span>
        <span class="detail-donut-sub">Tổng điểm</span>
      </div>
    </div>
  `;
}

/**
 * Render toàn bộ nội dung chi tiết của môn học vào Modal
 * @param {Object} subject 
 */
function renderSubjectDetail(subject) {
  const container = document.getElementById('subject-detail-content');
  if (!container) return;

  const subjectColor = subject.color || '#6366f1';
  const gradeItems = subject.gradeItems || [];
  const hasDrive = Boolean(subject.driveUrl && subject.driveUrl.trim());

  // Render danh sách breakdown điểm
  const breakdownHtml = gradeItems.length > 0 ? gradeItems.map((item) => `
    <div class="detail-grade-row" style="border-left-color: ${item.color || subjectColor};">
      <div class="detail-grade-info">
        <div class="detail-grade-name-row">
          <span class="detail-grade-dot" style="background-color: ${item.color || subjectColor};"></span>
          <span class="detail-grade-name">${escapeHtml(item.name || 'Thành phần')}</span>
          <span class="detail-grade-weight" style="color: ${item.color || subjectColor};">${item.weight || 0}%</span>
        </div>
        <div class="detail-grade-meta">
          <span><i class="fa-regular fa-file-lines"></i> ${escapeHtml(item.type || 'Đánh giá')}</span>
          ${item.duration && item.duration !== '--' ? `<span><i class="fa-regular fa-clock"></i> ${escapeHtml(item.duration)}</span>` : ''}
          ${item.note ? `<span class="detail-grade-note"><i class="fa-regular fa-comment-dots"></i> ${escapeHtml(item.note)}</span>` : ''}
        </div>
      </div>
      <div class="detail-grade-bar">
        <div class="detail-grade-bar-fill" style="width: ${item.weight || 0}%; background-color: ${item.color || subjectColor};"></div>
      </div>
    </div>
  `).join('') : `
    <div class="detail-empty-grades">
      <i class="fa-solid fa-chart-pie" style="font-size: 1.5rem; color: var(--text-muted);"></i>
      <p>Chưa thiết lập tỉ lệ thành phần điểm.</p>
      <button type="button" class="btn-detail-edit-grades" data-code="${escapeHtml(subject.code)}">
        <i class="fa-solid fa-plus"></i> Thêm Tỉ Lệ Điểm
      </button>
    </div>
  `;

  container.innerHTML = `
    <!-- 1. HERO HEADER -->
    <div class="detail-hero-header" style="--subj-accent: ${subjectColor};">
      <div class="detail-header-top">
        <div class="detail-icon-box" style="background: ${subjectColor}25; border-color: ${subjectColor}50; color: ${subjectColor};">
          <i class="${subject.icon || 'fa-solid fa-book'}"></i>
        </div>
        <div class="detail-header-titles">
          <div class="detail-badges-bar">
            <span class="detail-code-badge">${escapeHtml(subject.code)}</span>
            ${subject.credits ? `<span class="detail-credits-badge">${subject.credits} Tín chỉ</span>` : ''}
          </div>
          <h2 class="detail-subject-title">${escapeHtml(subject.name)}</h2>
          ${subject.englishName ? `<div class="detail-subject-en">${escapeHtml(subject.englishName)}</div>` : ''}
        </div>
        <button type="button" id="btn-close-subject-detail" class="btn-modal-close" title="Đóng (ESC)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- 2. QUICK CTA ACTION BUTTONS -->
      <div class="detail-cta-bar">
        ${hasDrive ? `
          <a href="${escapeHtml(subject.driveUrl.trim())}" target="_blank" rel="noopener noreferrer" class="btn-cta-drive btn-cta-drive--active">
            <div class="btn-cta-drive__icon"><i class="fa-brands fa-google-drive"></i></div>
            <div class="btn-cta-drive__text">
              <strong>Mở Thư Mục Google Drive</strong>
              <span>Truy cập giáo trình, đề thi & tài liệu môn</span>
            </div>
            <i class="fa-solid fa-arrow-up-right-from-square btn-cta-drive__arrow"></i>
          </a>
        ` : `
          <button type="button" class="btn-cta-drive btn-cta-drive--empty" data-action="edit-link" data-code="${escapeHtml(subject.code)}">
            <div class="btn-cta-drive__icon"><i class="fa-brands fa-google-drive"></i></div>
            <div class="btn-cta-drive__text">
              <strong>Chưa Gắn Link Google Drive</strong>
              <span>Bấm vào đây để thêm đường dẫn thư mục môn học</span>
            </div>
            <i class="fa-solid fa-plus btn-cta-drive__arrow"></i>
          </button>
        `}
        <button type="button" class="btn-cta-edit-subject" data-action="edit-subject" data-code="${escapeHtml(subject.code)}" title="Chỉnh sửa thông tin môn học">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>Chỉnh Sửa</span>
        </button>
      </div>
    </div>

    <!-- 3. BODY CONTENT: TỈ LỆ ĐIỂM + GHI CHÚ + THÔNG TIN -->
    <div class="detail-body-scrollable">
      
      <!-- PHẦN 1: TỈ LỆ THÀNH PHẦN ĐIỂM -->
      <section class="detail-section-card">
        <div class="detail-section-title">
          <div class="detail-sec-icon" style="color: #6366f1;"><i class="fa-solid fa-chart-pie"></i></div>
          <h3>Tỷ Lệ Thành Phần Điểm</h3>
          <button type="button" class="btn-sec-action" data-action="edit-grades" data-code="${escapeHtml(subject.code)}">
            <i class="fa-solid fa-sliders"></i> Sửa Tỉ Lệ
          </button>
        </div>
        <div class="detail-grades-container">
          <div class="detail-chart-side">
            ${renderDonutChartSvg(gradeItems)}
          </div>
          <div class="detail-breakdown-side">
            ${breakdownHtml}
          </div>
        </div>
      </section>

      <!-- PHẦN 2: GHI CHÚ MÔN HỌC & QUY ĐỊNH -->
      <section class="detail-section-card">
        <div class="detail-section-title">
          <div class="detail-sec-icon" style="color: #f59e0b;"><i class="fa-solid fa-clipboard-list"></i></div>
          <h3>Ghi Chú & Lưu Ý Học Phần</h3>
          <button type="button" class="btn-sec-action" data-action="edit-notes" data-code="${escapeHtml(subject.code)}">
            <i class="fa-solid fa-pen"></i> Sửa Ghi Chú
          </button>
        </div>
        <div class="detail-notes-box">
          ${subject.notes && subject.notes.trim() ? `
            <div class="detail-notes-content">
              <i class="fa-solid fa-quote-left detail-quote-icon"></i>
              <p>${escapeHtml(subject.notes)}</p>
            </div>
          ` : `
            <div class="detail-empty-notes">
              <p>Chưa có ghi chú nào cho môn học này.</p>
              <span>Bạn có thể lưu lại quy định thi cử, lưu ý của giảng viên hoặc mục tiêu điểm số.</span>
            </div>
          `}
        </div>
      </section>

      <!-- PHẦN 3: THÔNG TIN BỔ SUNG (GIẢNG VIÊN & KHOA) -->
      ${(subject.department || subject.lecturers) ? `
        <section class="detail-section-card detail-section-card--info">
          <div class="detail-meta-grid">
            ${subject.department ? `
              <div class="detail-meta-item">
                <div class="meta-item-label"><i class="fa-solid fa-building-columns"></i> Khoa / Bộ Môn:</div>
                <div class="meta-item-value">${escapeHtml(subject.department)}</div>
              </div>
            ` : ''}
            ${subject.lecturers ? `
              <div class="detail-meta-item">
                <div class="meta-item-label"><i class="fa-solid fa-chalkboard-user"></i> Giảng Viên:</div>
                <div class="meta-item-value">${escapeHtml(subject.lecturers)}</div>
              </div>
            ` : ''}
          </div>
        </section>
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
    const editGradesBtn = e.target.closest('[data-action="edit-grades"]') || e.target.closest('.btn-detail-edit-grades');
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
 * Mở trang chi tiết môn học
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
