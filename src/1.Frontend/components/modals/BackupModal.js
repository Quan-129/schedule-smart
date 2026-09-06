/**
 * ==========================================================================
 * 1. IMPORTS
 * ==========================================================================
 */
import { state, exportFullBackupData, importFullBackupData } from '../../../3.Database/state.js';
import { getCurrentUser, syncUserDataToCloud } from '../../../3.Database/auth/FirebaseAuthService.js';
import { showToast } from '../Toast.js';
import { escapeHtml } from '../../../4.Security/sanitizer.js';

/**
 * ==========================================================================
 * 2. CONSTANTS & TEMPLATES
 * ==========================================================================
 */

/**
 * Tạo template HTML cho Modal Sao Lưu & Khôi Phục Dữ Liệu
 * @param {Object} backupSummary 
 * @returns {string}
 */
function createBackupModalTemplate(backupSummary) {
  const user = getCurrentUser();
  const isCloudAvailable = !!user;

  return `
    <div id="backup-modal" class="modal-overlay">
      <div class="modal-content backup-modal-content">
        <div class="modal-header">
          <div class="modal-header-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
            <i class="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <div class="modal-header-text">
            <h3>Sao Lưu & Khôi Phục Thiết Lập</h3>
            <p>Bảo toàn 100% dữ liệu: Lịch học, Link Drive, Điểm số, Theme & Chế độ xem</p>
          </div>
          <button type="button" class="btn-modal-close" id="btn-close-backup-modal" title="Đóng modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body backup-modal-body">
          <!-- Tóm tắt dữ liệu hiện tại -->
          <div class="backup-summary-grid">
            <div class="backup-sum-item">
              <span class="sum-label"><i class="fa-brands fa-google-drive"></i> Môn học & Drive</span>
              <strong class="sum-value">${backupSummary.driveCount} môn</strong>
            </div>
            <div class="backup-sum-item">
              <span class="sum-label"><i class="fa-solid fa-chart-pie"></i> Bảng điểm GPA</span>
              <strong class="sum-value">${backupSummary.gradeCount} môn</strong>
            </div>
            <div class="backup-sum-item">
              <span class="sum-label"><i class="fa-solid fa-calendar-week"></i> Tuần tùy chỉnh</span>
              <strong class="sum-value">${backupSummary.customWeekCount} tuần</strong>
            </div>
            <div class="backup-sum-item">
              <span class="sum-label"><i class="fa-solid fa-palette"></i> Tone màu</span>
              <strong class="sum-value" style="text-transform: capitalize;">${escapeHtml(backupSummary.theme)}</strong>
            </div>
          </div>

          <!-- Section 1: Xuất File Sao Lưu (Export) -->
          <div class="backup-action-card">
            <div class="backup-card-info">
              <div class="backup-card-badge"><i class="fa-solid fa-file-export"></i> Cấp độ 3</div>
              <h4>Xuất File Sao Lưu Toàn Bộ (.json)</h4>
              <p>Tải về tệp cấu hình JSON an toàn để lưu trữ dự phòng trên máy tính hoặc chuyển sang thiết bị khác.</p>
            </div>
            <button type="button" id="btn-export-backup-json" class="btn-backup-action btn-export-json">
              <i class="fa-solid fa-download"></i>
              <span>Tải File Sao Lưu (.json)</span>
            </button>
          </div>

          <!-- Section 2: Nhập File Phục Hồi (Import) -->
          <div class="backup-action-card">
            <div class="backup-card-info">
              <div class="backup-card-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i class="fa-solid fa-file-import"></i> Phục Hồi</div>
              <h4>Khôi Phục Dữ Liệu Từ File (.json)</h4>
              <p>Tải lên file JSON đã sao lưu trước đó để đưa toàn bộ trạng thái setup và dữ liệu về nguyên vẹn.</p>
            </div>
            <div class="backup-upload-zone" id="backup-drop-zone">
              <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
              <p class="upload-text"><strong>Nhấp để chọn file JSON</strong> hoặc kéo thả file vào đây</p>
              <input type="file" id="backup-file-input" accept=".json,application/json" style="display: none;">
            </div>
          </div>

          <!-- Section 3: Đồng Bộ Đám Mây (Cloud Sync) -->
          <div class="backup-action-card">
            <div class="backup-card-info">
              <div class="backup-card-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;"><i class="fa-solid fa-cloud"></i> Cấp độ 2</div>
              <h4>Đồng Bộ Trực Tiếp Với Đám Mây</h4>
              <p>${isCloudAvailable ? `Đang kết nối tài khoản: <strong>${escapeHtml(user.email || user.displayName || 'Google User')}</strong>` : 'Đăng nhập Google để kích hoạt tính năng tự động đồng bộ thời gian thực giữa Điện thoại ⇄ Máy tính.'}</p>
            </div>
            ${isCloudAvailable ? `
              <button type="button" id="btn-sync-cloud-now" class="btn-backup-action btn-cloud-sync">
                <i class="fa-solid fa-rotate"></i>
                <span>Đồng Bộ Lên Cloud Ngay</span>
              </button>
            ` : `
              <button type="button" id="btn-login-from-backup" class="btn-backup-action btn-cloud-login">
                <i class="fa-brands fa-google"></i>
                <span>Đăng Nhập Để Đồng Bộ</span>
              </button>
            `}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="btn-backup-cancel">Đóng</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * ==========================================================================
 * 4. EVENT HANDLERS & MODAL CONTROLLER
 * ==========================================================================
 */

/**
 * Mở Modal Sao Lưu & Khôi Phục Thiết Lập
 */
export function openBackupModal() {
  const modalRoot = document.getElementById('modal-root') || document.body;
  const existing = document.getElementById('backup-modal');
  if (existing) existing.remove();

  // Tính toán tóm tắt dữ liệu
  const summary = {
    driveCount: (state.driveSubjects || []).length,
    gradeCount: Object.keys(state.studentGrades || {}).length,
    customWeekCount: 0,
    theme: localStorage.getItem('smart_schedule_theme') || 'violet'
  };

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes('custom_weeks')) {
      try {
        const val = JSON.parse(localStorage.getItem(k));
        if (Array.isArray(val)) summary.customWeekCount += val.length;
      } catch (e) {}
    }
  }

  const modalHtml = createBackupModalTemplate(summary);
  modalRoot.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('backup-modal');
  const closeBtn = document.getElementById('btn-close-backup-modal');
  const cancelBtn = document.getElementById('btn-backup-cancel');
  const exportBtn = document.getElementById('btn-export-backup-json');
  const dropZone = document.getElementById('backup-drop-zone');
  const fileInput = document.getElementById('backup-file-input');
  const syncCloudBtn = document.getElementById('btn-sync-cloud-now');
  const loginBtn = document.getElementById('btn-login-from-backup');

  function closeModal() {
    if (modal) modal.remove();
  }

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // 1. Xử lý Xuất JSON (Export)
  if (exportBtn) {
    exportBtn.onclick = () => {
      try {
        const backupData = exportFullBackupData();
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const nowStr = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule_smart_backup_${nowStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Đã xuất file sao lưu JSON thành công! 📦✨');
      } catch (err) {
        console.error('[Export JSON Error]', err);
        showToast('Lỗi khi xuất file sao lưu!');
      }
    };
  }

  // 2. Xử lý Nhập JSON (Import)
  if (dropZone && fileInput) {
    dropZone.onclick = () => fileInput.click();

    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add('is-dragover');
    };

    dropZone.ondragleave = () => {
      dropZone.classList.remove('is-dragover');
    };

    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('is-dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImportFile(e.dataTransfer.files[0]);
      }
    };

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleImportFile(e.target.files[0]);
      }
    };
  }

  function handleImportFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      showToast('Vui lòng chọn tệp định dạng .json hợp lệ!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const res = importFullBackupData(parsed);
        if (res.success) {
          showToast(res.message);
          closeModal();
          setTimeout(() => {
            window.location.reload();
          }, 900);
        } else {
          showToast(res.message);
        }
      } catch (err) {
        console.error('[Import Parse Error]', err);
        showToast('Tệp JSON bị lỗi định dạng không thể đọc!');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  // 3. Xử lý Đồng bộ Cloud ngay lập tức
  if (syncCloudBtn) {
    syncCloudBtn.onclick = () => {
      syncUserDataToCloud();
      showToast('Đã đồng bộ toàn bộ dữ liệu lên Cloud Firestore! ☁️✨');
    };
  }

  if (loginBtn) {
    loginBtn.onclick = () => {
      closeModal();
      const authBtn = document.getElementById('auth-login-btn');
      if (authBtn) authBtn.click();
    };
  }
}
