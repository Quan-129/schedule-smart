/**
 * ==========================================================================
 * FRONTEND VIEW - BACKPACK VIEW (CHIẾC CẶP GOOGLE DRIVE & CIRCULAR NODES)
 * Hỗ trợ chế độ rung lắc Jiggle Mode (Apple Style) & Đầy đủ cách thoát:
 * - Nút "✓ Xong" trên thanh điều khiển
 * - Bấm vào khoảng trống nền
 * - Phím ESC
 * ==========================================================================
 */

import { state, persistDriveSubjects } from '../../3.Database/state.js';
import { renderCircularNodeHtml } from '../components/CircularNode.js';
import { openEditDriveModal } from '../components/EditModal.js';
import { openAddSubjectModal } from '../components/modals/AddSubjectModal.js';
import { showToast } from '../components/Toast.js';
import { syncDriveSubjectsToCloud } from '../../3.Database/auth/FirebaseAuthService.js';

let longPressTimer = null;
let isLongPressTriggered = false;
let globalEventsAttached = false;

/**
 * Render toàn bộ giao diện Chiếc Cặp dạng lưới vòng tròn
 */
export function renderBackpackView() {
  const container = document.getElementById('backpack-launcher-grid');
  const section = document.getElementById('backpack-view-container');
  if (!container) return;

  container.innerHTML = '';

  if (section) {
    if (state.isJiggleMode) {
      section.classList.add('is-jiggle-mode');
    } else {
      section.classList.remove('is-jiggle-mode');
    }
  }

  // 1. Render từng Node môn học
  state.driveSubjects.forEach((subject) => {
    const btn = document.createElement('div');
    btn.className = `bp-app-btn ${state.isJiggleMode ? 'jiggle-active' : ''}`;
    btn.style.setProperty('--app-color', subject.color || '#6366f1');
    btn.dataset.code = subject.code;

    btn.innerHTML = renderCircularNodeHtml(subject, state.isJiggleMode);

    // Gắn sự kiện tương tác
    attachNodeEvents(btn, subject);

    container.appendChild(btn);
  });

  // 2. Render nút Thêm Môn Học
  const addBtn = document.createElement('div');
  addBtn.className = 'bp-app-btn btn-add-app';
  addBtn.innerHTML = `
    <div class="bp-circle-wrapper">
      <div class="bp-circle-core bp-circle-add-core">
        <i class="fa-solid fa-plus"></i>
      </div>
    </div>
    <div class="bp-app-details">
      <span class="bp-app-title">Thêm môn học</span>
      <span class="bp-app-drive-status not-set">+ Thêm mới</span>
    </div>
  `;
  addBtn.onclick = () => {
    openAddSubjectModal();
  };
  container.appendChild(addBtn);

  // 3. Cập nhật thanh công cụ Jiggle Mode (Nút Xong & Hướng dẫn)
  updateJiggleToolbar();

  // 4. Gắn các sự kiện toàn cục để thoát Jiggle (Click ngoài, ESC)
  attachGlobalJiggleEvents();
}

/**
 * Gắn các sự kiện click, long-press, xóa, sửa cho từng Node
 * @param {HTMLElement} btn 
 * @param {Object} subject 
 */
function attachNodeEvents(btn, subject) {
  const circleWrapper = btn.querySelector('.bp-circle-wrapper');
  if (!circleWrapper) return;

  let touchStartX = 0;
  let touchStartY = 0;

  const startLongPress = (e) => {
    isLongPressTriggered = false;
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
    longPressTimer = setTimeout(() => {
      isLongPressTriggered = true;
      enterJiggleMode();
      if (navigator.vibrate) navigator.vibrate(60);
    }, 750); // Giữ lâu hơn (750ms) mới hiện chế độ xóa & bút chì
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const checkTouchMove = (e) => {
    if (!longPressTimer || !e.touches || !e.touches[0]) return;
    const moveX = Math.abs(e.touches[0].clientX - touchStartX);
    const moveY = Math.abs(e.touches[0].clientY - touchStartY);
    // Nếu di chuyển ngón tay quá 8px (đang cuộn màn hình), hủy ngay nhấn giữ
    if (moveX > 8 || moveY > 8) {
      cancelLongPress();
    }
  };

  // CHỈ GẮN SỰ KIỆN NHẤN GIỮ VÀO HÌNH TRÒN NODE (KHÍT ĐÚNG KÍCH THƯỚC VÒNG TRÒN)
  circleWrapper.addEventListener('mousedown', startLongPress);
  circleWrapper.addEventListener('touchstart', startLongPress, { passive: true });
  circleWrapper.addEventListener('touchmove', checkTouchMove, { passive: true });
  circleWrapper.addEventListener('mouseup', cancelLongPress);
  circleWrapper.addEventListener('mouseleave', cancelLongPress);
  circleWrapper.addEventListener('touchend', cancelLongPress);
  circleWrapper.addEventListener('touchcancel', cancelLongPress);

  circleWrapper.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    enterJiggleMode();
  });

  // Xử lý Click vào các nút con hoặc vào ô môn
  btn.addEventListener('click', (e) => {
    // 1. Nút Xóa (-)
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (deleteBtn) {
      e.stopPropagation();
      deleteSubject(subject.code);
      return;
    }

    // 2. Nút Cây Bút Vàng (✏️)
    const editBtn = e.target.closest('[data-action="edit"]');
    if (editBtn) {
      e.stopPropagation();
      openEditDriveModal(subject.code);
      return;
    }

    // 3. Nếu đang ở chế độ Jiggle, bấm vào node sẽ không mở link Drive
    if (state.isJiggleMode) {
      e.stopPropagation();
      return;
    }

    // 4. Nếu vừa kích hoạt long press thì bỏ qua click thông thường
    if (isLongPressTriggered) {
      isLongPressTriggered = false;
      return;
    }

    // 5. Mở liên kết Google Drive
    if (subject.driveUrl && subject.driveUrl.trim()) {
      window.open(subject.driveUrl.trim(), '_blank');
    } else {
      showToast(`Môn "${subject.name}" chưa gắn link Google Drive. Nhấn giữ node để chỉnh sửa!`);
      openEditDriveModal(subject.code);
    }
  });
}

/**
 * Bật chế độ rung lắc chỉnh sửa (Jiggle Mode)
 */
export function enterJiggleMode() {
  if (state.isJiggleMode) return;
  state.isJiggleMode = true;
  renderBackpackView();
  showToast('Chế độ chỉnh sửa: Bấm ✏️ để sửa, (-) để xóa, hoặc bấm "Xong" để thoát.');
}

/**
 * Thoát chế độ rung lắc chỉnh sửa (Jiggle Mode)
 */
export function exitJiggleMode() {
  if (!state.isJiggleMode) return;
  state.isJiggleMode = false;
  renderBackpackView();
  showToast('Đã lưu trạng thái Chiếc Cặp ✓');
}

/**
 * Xóa một môn học khỏi Chiếc Cặp
 * @param {string} subjectCode 
 */
function deleteSubject(subjectCode) {
  const subj = state.driveSubjects.find(s => s.code === subjectCode);
  const name = subj ? subj.name : subjectCode;
  if (confirm(`Bạn có chắc chắn muốn xóa môn "${name}" (${subjectCode}) khỏi Chiếc Cặp?`)) {
    state.driveSubjects = state.driveSubjects.filter(s => s.code !== subjectCode);
    persistDriveSubjects();
    syncDriveSubjectsToCloud();
    renderBackpackView();
    if (window.renderGradesView) window.renderGradesView();
    showToast(`Đã xóa môn "${name}" (${subjectCode})`);
  }
}

/**
 * Cập nhật thanh công cụ Jiggle Mode (Nút Xong và Text hướng dẫn)
 */
function updateJiggleToolbar() {
  const doneBtn = document.getElementById('bp-done-jiggle-btn');
  const hintText = document.getElementById('backpack-hint-text');

  if (state.isJiggleMode) {
    if (doneBtn) {
      doneBtn.style.display = 'inline-flex';
      doneBtn.onclick = (e) => {
        e.stopPropagation();
        exitJiggleMode();
      };
    }
    if (hintText) {
      hintText.innerHTML = `
        <i class="fa-solid fa-arrows-spin fa-spin" style="color: #3b82f6;"></i>
        <span><strong>Chế độ chỉnh sửa đang bật:</strong> Bấm <strong style="color: #f59e0b;">✏️</strong> để sửa link/tỉ lệ điểm, <strong style="color: #ef4444;">-</strong> để xóa môn. Bấm nút <strong style="color: #3b82f6;">"Xong"</strong> hoặc bấm vào khoảng trống để hoàn tất.</span>
      `;
    }
  } else {
    if (doneBtn) {
      doneBtn.style.display = 'none';
    }
    if (hintText) {
      hintText.innerHTML = `
        <i class="fa-solid fa-hand-pointer"></i>
        <span><em>Mẹo: <strong>Nhấn giữ ô tròn</strong> để bật chế độ chỉnh sửa (hiện nút cây bút ✏️ và nút xóa -).</em></span>
      `;
    }
  }
}

/**
 * Gắn sự kiện toàn cục để thoát chế độ Jiggle (Click ngoài & phím ESC)
 */
function attachGlobalJiggleEvents() {
  if (globalEventsAttached) return;
  globalEventsAttached = true;

  // 1. Phím ESC để thoát Jiggle Mode
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isJiggleMode) {
      exitJiggleMode();
    }
  });

  // 2. Click vào khoảng trống của Backpack View để thoát Jiggle Mode
  const backpackSection = document.getElementById('backpack-view-container');
  if (backpackSection) {
    backpackSection.addEventListener('click', (e) => {
      if (!state.isJiggleMode) return;

      // Không thoát nếu bấm vào nút môn học, nút xong, hoặc modal
      if (
        e.target.closest('.bp-app-btn') ||
        e.target.closest('#bp-done-jiggle-btn') ||
        e.target.closest('#bp-add-subject-btn') ||
        e.target.closest('.backpack-filter-box') ||
        e.target.closest('.modal-backdrop')
      ) {
        return;
      }

      exitJiggleMode();
    });
  }
}

// Window aliases for backward compatibility
window.enterJiggleMode = enterJiggleMode;
window.exitJiggleMode = exitJiggleMode;
window.renderBackpackView = renderBackpackView;
