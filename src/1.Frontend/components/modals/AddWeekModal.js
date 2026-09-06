/**
 * ==========================================================================
 * FRONTEND COMPONENT - ADD WEEK MODAL (SMART SCHEDULE GENERATOR)
 * Tính năng thông minh:
 * - Tự động tính toán tuần kế tiếp (cộng trên / cộng dưới) & khoảng ngày (VD: 17-08 - 23-08)
 * - Tự động kế thừa lịch học từ tuần hiện tại & tự động cập nhật tiêu đề tuần mới
 * - 3 Presets 1-chạm: Sao chép tuần này, Nạp mẫu có sẵn môn, Nạp 7 ngày trống
 * - Đồng bộ tức thì tiêu đề `# ...` khi sửa tên tuần
 * - Hướng dẫn cú pháp Markdown Cheat Sheet trực quan
 * ==========================================================================
 */

import { showToast } from '../Toast.js';
import { generateEmptyWeekMarkdown, generateSampleWeekMarkdown } from '../../../2.Backend/services/TimetableParser.js';
import { getMondayOfCurrentWeek, addDaysToDateStr, formatDateDDMM } from '../../../2.Backend/utils/dateHelpers.js';

let modalInitialized = false;
let currentWeeksList = [];
let currentDirection = 'after'; // 'after' | 'before'
let getCurrentMarkdownFn = null;

/**
 * Cập nhật thông minh dòng tiêu đề # đầu tiên trong Markdown mà giữ nguyên các môn học
 * @param {string} markdownText 
 * @param {string} newTitle 
 * @returns {string}
 */
function smartUpdateMarkdownTitle(markdownText, newTitle) {
  if (!markdownText) return generateEmptyWeekMarkdown(newTitle);
  const cleanTitle = newTitle.startsWith('Lịch học') ? newTitle : `Lịch học ${newTitle}`;
  const lines = markdownText.split(/\r?\n/);
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s+/i.test(lines[i])) {
      lines[i] = `# ${cleanTitle}`;
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    lines.unshift(`# ${cleanTitle}`);
  }
  return lines.join('\n');
}

/**
 * Render template HTML của Modal vào DOM nếu chưa tồn tại
 */
export function ensureAddWeekModalDom() {
  if (document.getElementById('add-week-modal')) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div id="add-week-modal" class="modal-backdrop hidden">
      <div class="modal-card modal-card-lg" style="max-width: 820px;">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-glow" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <i class="fa-solid fa-calendar-plus"></i>
            </div>
            <div>
              <h3 class="modal-title">Thêm Tuần Học Mới</h3>
              <div class="modal-badges-row">
                <span class="modal-subj-badge" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3);">✨ Tự động tính ngày & kế thừa môn</span>
                <span class="modal-subj-sub">Hỗ trợ cộng trên (quá khứ) & cộng dưới (tương lai)</span>
              </div>
            </div>
          </div>
          <button type="button" id="add-week-close-btn" class="btn-modal-close" title="Đóng modal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="add-week-form" class="modal-form">
          <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 75vh;">
            
            <!-- Chọn hướng thêm tuần -->
            <div class="form-group-styled">
              <label><i class="fa-solid fa-arrows-up-down"></i> Vị trí & Hướng thêm tuần:</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
                <button type="button" id="btn-week-dir-after" class="btn-days-mode active" style="justify-content: center; padding: 0.55rem;">
                  <i class="fa-solid fa-arrow-down"></i>
                  <span>Thêm Tuần Sau (+7 ngày)</span>
                </button>
                <button type="button" id="btn-week-dir-before" class="btn-days-mode" style="justify-content: center; padding: 0.55rem;">
                  <i class="fa-solid fa-arrow-up"></i>
                  <span>Thêm Tuần Trước (-7 ngày)</span>
                </button>
              </div>
            </div>

            <div class="form-group-styled">
              <label for="new-week-title-input"><i class="fa-solid fa-heading"></i> Tên tuần hiển thị <span class="required-star">*</span></label>
              <input type="text" id="new-week-title-input" placeholder="Ví dụ: Tuần 36 (07-09 - 13-09)" required autofocus>
            </div>

            <div class="modal-grid-2col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group-styled">
                <label for="new-week-id-input"><i class="fa-solid fa-fingerprint"></i> Mã định danh (ID) <span class="required-star">*</span></label>
                <input type="text" id="new-week-id-input" placeholder="tuan-36" style="font-family: var(--font-mono);" required>
              </div>
              <div class="form-group-styled">
                <label for="new-week-date-input"><i class="fa-regular fa-calendar-days"></i> Ngày bắt đầu (Thứ 2)</label>
                <input type="date" id="new-week-date-input" required>
              </div>
            </div>

            <!-- Thanh công cụ Markdown & 3 Presets Thông Minh -->
            <div class="form-group-styled">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; flex-wrap: wrap; gap: 0.4rem;">
                <label for="new-week-md-content" style="margin-bottom: 0;">
                  <i class="fa-brands fa-markdown" style="color: #38bdf8;"></i> Nội dung Markdown Lịch học:
                </label>
                <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                  <button type="button" id="btn-copy-template-md" class="preset-chip" title="Sao chép toàn bộ môn học tuần này & tự đổi ngày mới" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: #10b981; border-color: rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.1); cursor: pointer; border-radius: 6px;">
                    <i class="fa-regular fa-copy"></i> Sao chép từ tuần này
                  </button>
                  <button type="button" id="btn-sample-template-md" class="preset-chip" title="Nạp mẫu thời khóa biểu có sẵn môn học" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: #818cf8; border-color: rgba(129, 140, 248, 0.35); background: rgba(129, 140, 248, 0.1); cursor: pointer; border-radius: 6px;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Mẫu có môn
                  </button>
                  <button type="button" id="btn-empty-template-md" class="preset-chip" title="Tạo 7 ngày nghỉ trống" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: #94a3b8; border-color: rgba(148, 163, 184, 0.35); background: rgba(148, 163, 184, 0.1); cursor: pointer; border-radius: 6px;">
                    <i class="fa-solid fa-rotate-left"></i> Tuần trống
                  </button>
                </div>
              </div>
              <textarea id="new-week-md-content" rows="10" style="min-height: 220px; font-family: var(--font-mono); font-size: 0.84rem; line-height: 1.6; padding: 0.75rem; border-radius: var(--radius-md);" placeholder="# Lịch học Tuần 36&#10;&#10;## Thứ 2&#10;- 07:00 - 08:50: Toán Rời Rạc | P.A201&#10;..."></textarea>
            </div>

            <!-- Khung Hướng dẫn cú pháp Cheat Sheet -->
            <details style="background: rgba(255, 255, 255, 0.03); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 0.55rem 0.85rem;">
              <summary style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 0.4rem; user-select: none;">
                <i class="fa-solid fa-circle-question" style="color: #6366f1;"></i> Hướng dẫn cú pháp Markdown lịch học
              </summary>
              <div style="margin-top: 0.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
                <div><code style="color: #38bdf8;">## Thứ 2</code> : Bắt đầu một ngày trong tuần</div>
                <div><code style="color: #34d399;">- 07:00 - 08:50: Tên Môn | P.101</code> : Tiết học</div>
                <div><code style="color: #f472b6;">- Nghỉ.</code> : Đánh dấu ngày không có lịch</div>
                <div><code style="color: #fbbf24;">## Lưu ý nhỏ:</code> : Ghi chú nhắc nhở cuối tuần</div>
              </div>
            </details>

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
  bindTitleAutoSync();
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

function bindTitleAutoSync() {
  const titleInput = document.getElementById('new-week-title-input');
  const mdInput = document.getElementById('new-week-md-content');

  if (titleInput && mdInput) {
    titleInput.addEventListener('input', () => {
      const currentVal = titleInput.value.trim();
      if (currentVal && mdInput.value) {
        mdInput.value = smartUpdateMarkdownTitle(mdInput.value, currentVal);
      }
    });
  }
}

function recalculateWeekInputs() {
  const titleInput = document.getElementById('new-week-title-input');
  const idInput = document.getElementById('new-week-id-input');
  const dateInput = document.getElementById('new-week-date-input');
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

  // Kế thừa thông minh: Ưu tiên sao chép lịch học tuần hiện tại và tự đổi ngày mới
  const currentMd = typeof getCurrentMarkdownFn === 'function' ? getCurrentMarkdownFn() : '';
  if (mdInput) {
    if (currentMd && currentMd.trim()) {
      mdInput.value = smartUpdateMarkdownTitle(currentMd, suggestedTitle);
    } else {
      mdInput.value = generateEmptyWeekMarkdown(suggestedTitle);
    }
  }
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
  getCurrentMarkdownFn = getCurrentMarkdownCallback;
  if (modalInitialized) return;
  modalInitialized = true;

  const closeBtn = document.getElementById('add-week-close-btn');
  const cancelBtn = document.getElementById('add-week-cancel-btn');
  const copyBtn = document.getElementById('btn-copy-template-md');
  const sampleBtn = document.getElementById('btn-sample-template-md');
  const emptyBtn = document.getElementById('btn-empty-template-md');
  const form = document.getElementById('add-week-form');

  if (closeBtn) closeBtn.onclick = closeAddWeekModal;
  if (cancelBtn) cancelBtn.onclick = closeAddWeekModal;

  // Preset 1: Sao chép từ tuần này & tự đổi ngày mới
  if (copyBtn) {
    copyBtn.onclick = () => {
      const textarea = document.getElementById('new-week-md-content');
      const titleInput = document.getElementById('new-week-title-input');
      const currentMd = typeof getCurrentMarkdownFn === 'function' ? getCurrentMarkdownFn() : '';
      const currentTitle = titleInput ? titleInput.value.trim() : 'Tuần mới';
      if (textarea && currentMd) {
        textarea.value = smartUpdateMarkdownTitle(currentMd, currentTitle);
        showToast('Đã sao chép lịch học và tự động cập nhật tiêu đề tuần mới! ✨');
      } else {
        showToast('Không có dữ liệu tuần hiện tại để sao chép.');
      }
    };
  }

  // Preset 2: Nạp mẫu có sẵn môn học
  if (sampleBtn) {
    sampleBtn.onclick = () => {
      const textarea = document.getElementById('new-week-md-content');
      const titleInput = document.getElementById('new-week-title-input');
      const currentTitle = titleInput ? titleInput.value.trim() : 'Tuần mới';
      if (textarea) {
        textarea.value = generateSampleWeekMarkdown(currentTitle);
        showToast('Đã nạp thời khóa biểu mẫu có sẵn môn học! 🚀');
      }
    };
  }

  // Preset 3: Nạp 7 ngày trống
  if (emptyBtn) {
    emptyBtn.onclick = () => {
      const textarea = document.getElementById('new-week-md-content');
      const titleInput = document.getElementById('new-week-title-input');
      const currentTitle = titleInput ? titleInput.value.trim() : 'Tuần mới';
      if (textarea) {
        textarea.value = generateEmptyWeekMarkdown(currentTitle);
        showToast('Đã nạp mẫu 7 ngày trống! 🔄');
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
