/**
 * ==========================================================================
 * FRONTEND COMPONENT - ADD WEEK MODAL
 * ==========================================================================
 */

import { showToast } from '../Toast.js';
import { generateEmptyWeekMarkdown, generateSampleWeekMarkdown } from '../../../2.Backend/services/TimetableParser.js';
import { getMondayOfCurrentWeek, addDaysToDateStr, formatDateDDMM, formatDateDDMMYYYY } from '../../../2.Backend/utils/dateHelpers.js';

let modalInitialized = false;
let currentWeeksList = [];
let currentDirection = 'after'; // 'after' | 'before'

/**
 * Render template HTML của Modal vào DOM nếu chưa tồn tại
 */
export function ensureAddWeekModalDom() {
  if (document.getElementById('add-week-modal')) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div id="add-week-modal" class="modal-backdrop hidden">
      <div class="modal-card modal-card-add-week">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-glow" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <i class="fa-solid fa-calendar-plus"></i>
            </div>
            <div>
              <h3 class="modal-title">Thêm Tuần Học Mới</h3>
              <div class="modal-badges-row">
                <span class="modal-subj-badge" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3);">Tự động tính ngày</span>
                <span class="modal-subj-sub">Hỗ trợ cộng trên (quá khứ) & cộng dưới (tương lai)</span>
              </div>
            </div>
          </div>
          <button type="button" id="add-week-close-btn" class="btn-modal-close" title="Đóng modal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="add-week-form" class="modal-form">
          <div style="padding: 1.25rem 1.75rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 78vh;">
            
            <!-- Hàng 1: Hướng thêm tuần & Tên tuần hiển thị -->
            <div class="modal-grid-2col">
              <div class="form-group-styled">
                <label><i class="fa-solid fa-arrows-up-down"></i> Vị trí & Hướng thêm tuần:</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                  <button type="button" id="btn-week-dir-after" class="btn-days-mode active" style="justify-content: center; padding: 0.55rem 0.4rem; font-size: 0.78rem;">
                    <i class="fa-solid fa-arrow-down"></i>
                    <span>Tuần Sau (+7 ngày)</span>
                  </button>
                  <button type="button" id="btn-week-dir-before" class="btn-days-mode" style="justify-content: center; padding: 0.55rem 0.4rem; font-size: 0.78rem;">
                    <i class="fa-solid fa-arrow-up"></i>
                    <span>Tuần Trước (-7 ngày)</span>
                  </button>
                </div>
              </div>

              <div class="form-group-styled">
                <label for="new-week-title-input"><i class="fa-solid fa-heading"></i> Tên tuần hiển thị <span class="required-star">*</span></label>
                <input type="text" id="new-week-title-input" placeholder="Ví dụ: Tuần 36 (07-09 - 13-09)" required autofocus>
              </div>
            </div>

            <!-- Hàng 2: Mã ID, Ngày bắt đầu & Ghi chú -->
            <div class="modal-grid-2col">
              <div class="form-group-styled">
                <label for="new-week-id-input"><i class="fa-solid fa-fingerprint"></i> Mã định danh (ID) <span class="required-star">*</span></label>
                <input type="text" id="new-week-id-input" placeholder="tuan-36" style="font-family: var(--font-mono);" required>
              </div>
              <div class="form-group-styled">
                <label for="new-week-date-input"><i class="fa-regular fa-calendar-days"></i> Ngày bắt đầu (Thứ 2)</label>
                <input type="date" id="new-week-date-input" required>
              </div>
            </div>

            <!-- Khung Chế Độ Nhập Nhanh Toàn Tuần (Markdown Quick Setup) -->
            <div class="quick-md-setup-container">
              <div class="quick-md-header">
                <div class="quick-md-title-box">
                  <span class="quick-md-badge">
                    <i class="fa-solid fa-bolt" style="color: #f59e0b;"></i> Chế độ Nhập Nhanh Toàn Tuần (Markdown)
                  </span>
                  <span class="quick-md-hint">Dán hoặc nhập nhanh lịch học cả tuần theo mẫu bên dưới (hoặc bấm tạo rồi thêm từng môn sau).</span>
                </div>
              </div>

              <!-- Thanh nút nạp mẫu nhanh 1-Click -->
              <div class="quick-md-actions-bar">
                <button type="button" id="btn-copy-template-md" class="btn-preset-pill" title="Sao chép toàn bộ môn học từ tuần đang xem">
                  <i class="fa-regular fa-copy" style="color: #10b981;"></i>
                  <span>Sao chép từ tuần này</span>
                </button>
                <button type="button" id="btn-load-sample-md" class="btn-preset-pill btn-preset-sample" title="Nạp mẫu thời khóa biểu có sẵn môn học mẫu">
                  <i class="fa-solid fa-wand-magic-sparkles" style="color: #38bdf8;"></i>
                  <span>Nạp mẫu có sẵn môn</span>
                </button>
                <button type="button" id="btn-reset-empty-md" class="btn-preset-pill btn-preset-empty" title="Khôi phục mẫu tuần trống 7 ngày nghỉ">
                  <i class="fa-solid fa-rotate-left" style="color: #94a3b8;"></i>
                  <span>Nạp tuần trống</span>
                </button>
              </div>

              <!-- Accordion Hướng Dẫn Cú Pháp Siêu Dễ Hiểu (2 Cột Rộng Rãi) -->
              <details class="quick-md-guide-accordion">
                <summary class="quick-md-guide-summary">
                  <span><i class="fa-regular fa-circle-question" style="color: #38bdf8;"></i> <strong>Hướng dẫn cú pháp nhập nhanh</strong> (Bấm để xem mẫu ví dụ)</span>
                  <i class="fa-solid fa-chevron-down guide-toggle-icon"></i>
                </summary>
                <div class="quick-md-guide-content">
                  <div class="guide-syntax-grid">
                    <div class="syntax-item">
                      <code>## Thứ 2 ... ## Chủ Nhật</code>
                      <span>Tiêu đề phân cách từng ngày trong tuần</span>
                    </div>
                    <div class="syntax-item">
                      <code>### Tên Môn Học</code>
                      <span>Tiêu đề tên môn hoặc task cần học</span>
                    </div>
                    <div class="syntax-item">
                      <code>- Thời gian: 07:00 - 08:50</code>
                      <span>Khung giờ học (bắt buộc để vẽ Timeline & Heatmap)</span>
                    </div>
                    <div class="syntax-item">
                      <code>- Phòng học: B4-303 (CS1)</code>
                      <span>Phòng học hoặc link Google Meet / Zoom</span>
                    </div>
                    <div class="syntax-item">
                      <code>- Giảng viên: ThS. Nguyễn Văn A</code>
                      <span>Tên giảng viên (tùy chọn)</span>
                    </div>
                    <div class="syntax-item">
                      <code>- Nghỉ.</code>
                      <span>Ghi vào ngày không có tiết học nào</span>
                    </div>
                  </div>
                </div>
              </details>

              <textarea id="new-week-md-content" rows="11" class="quick-md-textarea" placeholder="# Lịch học Tuần mới&#10;&#10;## Thứ 2&#10;### Tiếp thị Căn bản&#10;- Thời gian: 07:00 - 08:50&#10;- Phòng học: B4-303 (CS1)&#10;&#10;## Thứ 3&#10;- Nghỉ."></textarea>
            </div>

          </div>

          <div class="modal-footer">
            <button type="button" id="add-week-cancel-btn" class="btn-ghost">Hủy</button>
            <button type="submit" class="btn-primary-gradient" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
              <i class="fa-solid fa-plus"></i> <span id="add-week-submit-text">Tạo Tuần Học</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  modalRoot.appendChild(modalWrapper.firstElementChild);
  bindDirectionButtons();
}

function bindDirectionButtons() {
  const btnAfter = document.getElementById('btn-week-dir-after');
  const btnBefore = document.getElementById('btn-week-dir-before');

  if (btnAfter) {
    btnAfter.onclick = () => {
      currentDirection = 'after';
      btnAfter.classList.add('active');
      if (btnBefore) btnBefore.classList.remove('active');
      recalculateWeekInputs();
    };
  }

  if (btnBefore) {
    btnBefore.onclick = () => {
      currentDirection = 'before';
      btnBefore.classList.add('active');
      if (btnAfter) btnAfter.classList.remove('active');
      recalculateWeekInputs();
    };
  }
}

function recalculateWeekInputs() {
  const titleInput = document.getElementById('new-week-title-input');
  const idInput = document.getElementById('new-week-id-input');
  const dateInput = document.getElementById('new-week-date-input');
  const descInput = document.getElementById('new-week-desc-input');
  const mdInput = document.getElementById('new-week-md-content');

  let calculatedStartDate = '';
  let calculatedWeekNum = 1;

  if (currentWeeksList.length === 0) {
    calculatedStartDate = getMondayOfCurrentWeek();
    calculatedWeekNum = 1;
  } else if (currentDirection === 'after') {
    // Cộng dưới: Dựa vào tuần cuối cùng
    const lastWeek = currentWeeksList[currentWeeksList.length - 1];
    let maxNum = 0;
    currentWeeksList.forEach(w => {
      const match = (w.title || w.id || '').match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    calculatedWeekNum = maxNum > 0 ? maxNum + 1 : currentWeeksList.length + 1;
    calculatedStartDate = lastWeek.startDate ? addDaysToDateStr(lastWeek.startDate, 7) : getMondayOfCurrentWeek();
  } else {
    // Cộng trên: Dựa vào tuần đầu tiên
    const firstWeek = currentWeeksList[0];
    let minNum = 999;
    currentWeeksList.forEach(w => {
      const match = (w.title || w.id || '').match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n < minNum) minNum = n;
      }
    });
    calculatedWeekNum = minNum > 1 && minNum !== 999 ? minNum - 1 : (minNum === 1 ? '0' : 1);
    calculatedStartDate = firstWeek.startDate ? addDaysToDateStr(firstWeek.startDate, -7) : addDaysToDateStr(getMondayOfCurrentWeek(), -7);
  }

  const endDate = addDaysToDateStr(calculatedStartDate, 6);
  const formattedRange = `${formatDateDDMM(calculatedStartDate)} - ${formatDateDDMM(endDate)}`;
  const suggestedTitle = `Tuần ${calculatedWeekNum} (${formattedRange})`;
  const suggestedId = `tuan-${calculatedWeekNum}`;

  if (titleInput) titleInput.value = suggestedTitle;
  if (idInput) idInput.value = suggestedId;
  if (dateInput) dateInput.value = calculatedStartDate;
  if (descInput) descInput.value = `Lịch học ${suggestedTitle}`;
  if (mdInput) mdInput.value = generateEmptyWeekMarkdown(suggestedTitle);
}

export function openAddWeekModal(availableWeeks = [], defaultDirection = 'after') {
  ensureAddWeekModalDom();
  currentWeeksList = Array.isArray(availableWeeks) ? [...availableWeeks] : [];
  currentDirection = defaultDirection || 'after';

  const btnAfter = document.getElementById('btn-week-dir-after');
  const btnBefore = document.getElementById('btn-week-dir-before');

  if (btnAfter && btnBefore) {
    if (currentDirection === 'before') {
      btnBefore.classList.add('active');
      btnAfter.classList.remove('active');
    } else {
      btnAfter.classList.add('active');
      btnBefore.classList.remove('active');
    }
  }

  recalculateWeekInputs();

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
  const sampleBtn = document.getElementById('btn-load-sample-md');
  const emptyBtn = document.getElementById('btn-reset-empty-md');
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

  if (sampleBtn) {
    sampleBtn.onclick = () => {
      const textarea = document.getElementById('new-week-md-content');
      const titleInput = document.getElementById('new-week-title-input');
      const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : 'Tuần mới';
      if (textarea) {
        textarea.value = generateSampleWeekMarkdown(title);
        showToast('Đã nạp mẫu thời khóa biểu có sẵn môn học!');
      }
    };
  }

  if (emptyBtn) {
    emptyBtn.onclick = () => {
      const textarea = document.getElementById('new-week-md-content');
      const titleInput = document.getElementById('new-week-title-input');
      const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : 'Tuần mới';
      if (textarea) {
        textarea.value = generateEmptyWeekMarkdown(title);
        showToast('Đã khôi phục mẫu 7 ngày trống (Nghỉ)!');
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
        onWeekCreatedCallback({ title, id, startDate, desc, filename, mdContent, direction: currentDirection });
      }

      closeAddWeekModal();
    };
  }
}
