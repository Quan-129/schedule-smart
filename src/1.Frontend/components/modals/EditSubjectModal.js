/**
 * ==========================================================================
 * FRONTEND COMPONENT - EDIT SUBJECT & GRADE MODAL (3-PART MODULAR DESIGN)
 * Giao diện 3 phần chuẩn Apple / Glassmorphism:
 * 1. Google Drive & Link
 * 2. Tỉ Lệ Điểm (%)
 * 3. Quy Chế & Ghi Chú
 * ==========================================================================
 */

import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { formatSafeUrl } from '../../../4.Security/urlValidator.js';
import { state, persistDriveSubjects } from '../../../3.Database/state.js';
import { showToast } from '../Toast.js';
import { syncDriveSubjectsToCloud } from '../../../3.Database/auth/FirebaseAuthService.js';

let currentEditingSubject = null;
let modalEventsInitialized = false;

/**
 * Render template HTML của Modal vào DOM nếu chưa tồn tại
 */
export function ensureEditSubjectModalDom() {
  if (document.getElementById('edit-drive-modal')) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div id="edit-drive-modal" class="modal-backdrop hidden">
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-glow" style="background: linear-gradient(135deg, #34a853 0%, #1e7e34 100%);">
              <i class="fa-solid fa-pen-to-square"></i>
            </div>
            <div>
              <h3 id="edit-drive-modal-title" class="modal-title">Chỉnh Sửa Môn Học</h3>
              <div class="modal-badges-row">
                <span id="edit-drive-modal-code" class="modal-subj-badge">MT1003</span>
                <span id="edit-drive-modal-sub" class="modal-subj-sub">3 Tín chỉ • Giải tích 1</span>
              </div>
            </div>
          </div>
          <button type="button" id="edit-drive-close-btn" class="btn-modal-close" title="Đóng modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 3-Segment Nav Tabs -->
        <div class="modal-nav-tabs">
          <button type="button" class="modal-tab-btn active" data-tab="tab-drive">
            <i class="fa-brands fa-google-drive"></i> <span>1. Link Drive</span>
          </button>
          <button type="button" class="modal-tab-btn" data-tab="tab-grades">
            <i class="fa-solid fa-chart-pie"></i> <span>2. Tỉ Lệ Điểm (%)</span>
          </button>
          <button type="button" class="modal-tab-btn" data-tab="tab-notes">
            <i class="fa-solid fa-clipboard-list"></i> <span>3. Quy Chế & Lưu Ý</span>
          </button>
        </div>

        <form id="edit-drive-form" class="modal-form">
          <input type="hidden" id="edit-drive-subject-code" value="">

          <!-- PHẦN 1: GOOGLE DRIVE & LIÊN KẾT TÀI LIỆU -->
          <div class="modal-tab-pane active" id="modal-tab-pane-drive">
            <div class="form-section-card">
              <div class="section-card-header">
                <div class="section-card-icon" style="background: rgba(52, 168, 83, 0.15); color: #34a853;">
                  <i class="fa-brands fa-google-drive"></i>
                </div>
                <div>
                  <h4>Thư Mục Google Drive Môn Học</h4>
                  <p>Gắn link thư mục Google Drive để mở nhanh 1-chạm từ Chiếc Cặp</p>
                </div>
              </div>

              <div class="form-group-styled">
                <label for="edit-drive-url-input">Đường dẫn Google Drive (Folder hoặc File):</label>
                <div class="input-with-action">
                  <i class="fa-solid fa-link input-icon"></i>
                  <input type="url" id="edit-drive-url-input" placeholder="https://drive.google.com/drive/folders/..." autocomplete="off">
                  <button type="button" id="btn-test-drive-link" class="btn-input-action" title="Mở thử liên kết trên tab mới">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở thử
                  </button>
                </div>
              </div>

              <div class="drive-helper-box">
                <div class="helper-item">
                  <i class="fa-solid fa-circle-check" style="color: #10b981;"></i>
                  <span>Hỗ trợ cả Google Drive công khai và tài khoản sinh viên BK HCMUT</span>
                </div>
                <div class="helper-item">
                  <i class="fa-solid fa-lightbulb" style="color: #f59e0b;"></i>
                  <span>Chỉ cần vào Drive → Chuột phải thư mục môn → Chọn <strong>Chia sẻ / Sao chép liên kết</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- PHẦN 2: TỈ LỆ ĐIỂM THÀNH PHẦN (%) -->
          <div class="modal-tab-pane" id="modal-tab-pane-grades">
            <div class="form-section-card">
              <div class="section-card-header">
                <div class="section-card-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
                  <i class="fa-solid fa-chart-pie"></i>
                </div>
                <div style="flex: 1;">
                  <div class="grades-header-flex">
                    <h4>Cấu Trúc Tỉ Lệ Điểm (%)</h4>
                    <div id="edit-grade-total-badge" class="badge-grade-total valid">
                      <i class="fa-solid fa-check"></i> Tổng: 100%
                    </div>
                  </div>
                  <p>Tùy chỉnh trọng số giữa kỳ, cuối kỳ, BTL, quiz theo đề cương môn học</p>
                </div>
              </div>

              <div class="grade-table-header">
                <span class="col-handle" style="width: 24px;"></span>
                <span class="col-name">Tên Cột Điểm</span>
                <span class="col-weight">Trọng Số (%)</span>
                <span class="col-type">Hình Thức</span>
                <span class="col-color">Màu</span>
                <span class="col-delete">Xóa</span>
              </div>

              <div id="grade-items-editor-container" class="grade-editor-container"></div>

              <button type="button" id="btn-add-grade-item" class="btn-add-grade-item-large">
                <i class="fa-solid fa-plus-circle"></i> <span>Thêm Cột Điểm Mới</span>
              </button>
            </div>
          </div>

          <!-- PHẦN 3: QUY CHẾ & LƯU Ý MÔN HỌC -->
          <div class="modal-tab-pane" id="modal-tab-pane-notes">
            <div class="form-section-card">
              <div class="section-card-header">
                <div class="section-card-icon" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee;">
                  <i class="fa-solid fa-clipboard-list"></i>
                </div>
                <div>
                  <h4>Quy Chế & Ghi Chú Môn Học</h4>
                  <p>Ghi lại điều kiện thi, trừ điểm nộp trễ hoặc thông tin giảng viên</p>
                </div>
              </div>

              <div class="form-group-styled">
                <label for="edit-subject-notes-input">Nội dung lưu ý / Quy chế đặc biệt:</label>
                <textarea id="edit-subject-notes-input" rows="4" placeholder="Ví dụ:&#10;- Vắng quá 20% số buổi học sẽ bị cấm thi cuối kỳ.&#10;- Nộp bài tập lớn trễ hạn trừ 2đ/ngày.&#10;- Điểm liệt môn học là dưới 3.0 điểm."></textarea>
              </div>

              <div class="preset-notes-group">
                <span class="preset-label"><i class="fa-solid fa-wand-magic-sparkles"></i> Mẫu nhanh:</span>
                <button type="button" class="preset-chip" data-text="Vắng quá 20% cấm thi">+ Vắng 20% cấm thi</button>
                <button type="button" class="preset-chip" data-text="Nộp BTL trễ -2đ/ngày">+ Nộp trễ -2đ/ngày</button>
                <button type="button" class="preset-chip" data-text="Điểm liệt môn học < 3.0">+ Điểm liệt &lt; 3.0</button>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button type="button" id="edit-drive-delete-btn" class="btn-danger-ghost" title="Xóa môn này khỏi Chiếc Cặp">
              <i class="fa-regular fa-trash-can"></i> <span>Xóa môn</span>
            </button>
            <div class="modal-footer-right">
              <button type="button" id="edit-drive-cancel-btn" class="btn-ghost">Hủy</button>
              <button type="submit" class="btn-primary-gradient"><i class="fa-solid fa-check"></i> <span>Lưu Thay Đổi</span></button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
  modalRoot.appendChild(modalWrapper.firstElementChild);
}

/**
 * Mở modal chỉnh sửa môn học
 */
export function openEditDriveModal(subjectCode, initialTab = 'tab-drive') {
  ensureEditSubjectModalDom();

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

  renderGradeEditorRows(subject.gradeItems || []);
  initModalInteractions();
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

function initModalInteractions() {
  if (modalEventsInitialized) return;
  modalEventsInitialized = true;

  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchModalTab(btn.dataset.tab);
    });
  });

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

  const form = document.getElementById('edit-drive-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      saveSubjectDriveChanges();
    };
  }

  const addRowBtn = document.getElementById('btn-add-grade-item') || document.getElementById('btn-add-grade-row');
  if (addRowBtn) {
    addRowBtn.onclick = (e) => {
      e.preventDefault();
      addGradeEditorRow();
    };
  }

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

  const closeBtn = document.getElementById('edit-drive-close-btn');
  const cancelBtn = document.getElementById('edit-drive-cancel-btn');
  if (closeBtn) closeBtn.onclick = closeEditDriveModal;
  if (cancelBtn) cancelBtn.onclick = closeEditDriveModal;
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

export function addGradeEditorRow() {
  const container = document.getElementById('grade-items-editor-container');
  if (!container) return;

  const currentRows = container.querySelectorAll('.grade-item-row');
  const newIndex = currentRows.length + 1;
  const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];
  const newColor = palette[newIndex % palette.length];

  const row = document.createElement('div');
  row.className = 'grade-item-row';
  row.dataset.itemId = `item-custom-${Date.now()}`;

  row.innerHTML = `
    <div class="grade-row-handle" title="Kéo để sắp xếp"><i class="fa-solid fa-grip-vertical"></i></div>
    <div class="grade-row-name">
      <input type="text" class="input-grade-name" placeholder="Cột điểm ${newIndex}" value="Cột điểm ${newIndex}" required>
    </div>
    <div class="grade-row-weight">
      <input type="number" class="input-grade-weight" min="0" max="100" step="1" value="10" required>
      <span class="weight-unit">%</span>
    </div>
    <div class="grade-row-type">
      <input type="text" class="input-grade-type" placeholder="Hình thức" value="Tự luận">
    </div>
    <div class="grade-row-color">
      <input type="color" class="input-grade-color" value="${newColor}" title="Chọn màu nhận diện">
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
  calculateGradeTotal();

  const nameInput = row.querySelector('.input-grade-name');
  if (nameInput) {
    nameInput.focus();
    nameInput.select();
  }
}

export function calculateGradeTotal() {
  const container = document.getElementById('grade-items-editor-container');
  const badge = document.getElementById('edit-grade-total-badge');
  if (!container || !badge) return 0;

  let total = 0;
  container.querySelectorAll('.input-grade-weight').forEach(input => {
    const val = parseFloat(input.value) || 0;
    total += val;
  });

  badge.innerHTML = total === 100 
    ? `<i class="fa-solid fa-check"></i> Tổng: ${total}%` 
    : `<i class="fa-solid fa-triangle-exclamation"></i> Tổng: ${total}% (Cần = 100%)`;

  badge.className = `badge-grade-total ${total === 100 ? 'valid' : 'invalid'}`;
  return total;
}

export function saveSubjectDriveChanges() {
  if (!currentEditingSubject) return;

  const codeInput = document.getElementById('edit-drive-subject-code');
  const driveInput = document.getElementById('edit-drive-url-input');
  const notesInput = document.getElementById('edit-subject-notes-input');

  const subjectCode = codeInput ? codeInput.value.trim() : '';
  const driveUrl = driveInput ? driveInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  const subjectIndex = state.driveSubjects.findIndex(s => s.code === subjectCode);
  if (subjectIndex === -1) {
    showToast('Lỗi: Không tìm thấy môn học cần lưu!');
    return;
  }

  const container = document.getElementById('grade-items-editor-container');
  const updatedGradeItems = [];

  if (container) {
    container.querySelectorAll('.grade-item-row').forEach(row => {
      const nameInput = row.querySelector('.input-grade-name');
      const weightInput = row.querySelector('.input-grade-weight');
      const typeInput = row.querySelector('.input-grade-type');
      const colorInput = row.querySelector('.input-grade-color');

      if (nameInput && weightInput) {
        updatedGradeItems.push({
          id: row.dataset.itemId || `item-${Date.now()}`,
          name: nameInput.value.trim(),
          weight: parseFloat(weightInput.value) || 0,
          type: typeInput ? typeInput.value.trim() : '',
          color: colorInput ? colorInput.value : '#6366f1'
        });
      }
    });
  }

  const total = calculateGradeTotal();
  if (total !== 100 && updatedGradeItems.length > 0) {
    if (!confirm(`Tổng tỉ lệ điểm hiện tại là ${total}% (chưa bằng 100%). Bạn vẫn muốn lưu?`)) {
      switchModalTab('tab-grades');
      return;
    }
  }

  state.driveSubjects[subjectIndex].driveUrl = driveUrl ? formatSafeUrl(driveUrl) : '';
  state.driveSubjects[subjectIndex].notes = notes;
  if (updatedGradeItems.length > 0) {
    state.driveSubjects[subjectIndex].gradeItems = updatedGradeItems;
  }

  persistDriveSubjects();
  syncDriveSubjectsToCloud();
  closeEditDriveModal();

  if (window.renderBackpackView) window.renderBackpackView();
  if (window.renderGradesView) window.renderGradesView();

  showToast(`Đã lưu thay đổi cho môn "${state.driveSubjects[subjectIndex].name}"!`);
}
