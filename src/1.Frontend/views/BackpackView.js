/**
 * ==========================================================================
 * FRONTEND VIEW - BACKPACK VIEW (CHIẾC CẶP GOOGLE DRIVE & CIRCULAR NODES)
 * ==========================================================================
 */

import { state, persistDriveSubjects } from '../../3.Database/state.js';
import { renderCircularNodeHtml } from '../components/CircularNode.js';
import { openEditSubjectModal } from '../components/EditModal.js';
import { showToast } from '../components/Toast.js';

let longPressTimer = null;
let isLongPressTriggered = false;

/**
 * Render toàn bộ giao diện Chiếc Cặp dạng lưới vòng tròn
 */
export function renderBackpackView() {
  const container = document.getElementById('backpack-launcher-grid') || document.getElementById('backpack-app-grid');
  const section = document.getElementById('backpack-view-container') || document.getElementById('backpack-section');
  if (!container) return;

  container.innerHTML = '';

  if (section) {
    if (state.isJiggleMode) {
      section.classList.add('is-jiggle-mode');
    } else {
      section.classList.remove('is-jiggle-mode');
    }
  }

  // Render từng Node môn học
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

  // Render nút Thêm Môn Học
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
    const addModal = document.getElementById('add-subject-modal');
    if (addModal) {
      addModal.classList.add('active');
      addModal.style.display = 'flex';
    }
  };
  container.appendChild(addBtn);

  // Render thanh điều khiển Jiggle Mode
  updateJiggleToolbar();
}

/**
 * Gắn các sự kiện click, long-press, xóa, sửa cho từng Node
 * @param {HTMLElement} btn 
 * @param {Object} subject 
 */
function attachNodeEvents(btn, subject) {
  const startLongPress = (e) => {
    isLongPressTriggered = false;
    longPressTimer = setTimeout(() => {
      isLongPressTriggered = true;
      enterJiggleMode();
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  btn.addEventListener('mousedown', startLongPress);
  btn.addEventListener('touchstart', startLongPress, { passive: true });
  btn.addEventListener('mouseup', cancelLongPress);
  btn.addEventListener('mouseleave', cancelLongPress);
  btn.addEventListener('touchend', cancelLongPress);
  btn.addEventListener('touchcancel', cancelLongPress);

  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    enterJiggleMode();
  });

  // Xử lý Click vào các nút con hoặc vào ô môn
  btn.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (deleteBtn) {
      e.stopPropagation();
      deleteSubject(subject.code);
      return;
    }

    const editBtn = e.target.closest('[data-action="edit"]');
    if (editBtn) {
      e.stopPropagation();
      openEditSubjectModal(subject.code, () => renderBackpackView());
      return;
    }

    if (state.isJiggleMode) {
      return; // Không mở link Drive khi đang ở chế độ Jiggle
    }

    if (isLongPressTriggered) {
      return;
    }

    // Mở liên kết Google Drive
    if (subject.driveUrl && subject.driveUrl.trim()) {
      window.open(subject.driveUrl.trim(), '_blank');
    } else {
      showToast(`Môn ${subject.name} chưa gắn link Google Drive. Hãy nhấn giữ để chỉnh sửa!`);
      openEditSubjectModal(subject.code, () => renderBackpackView());
    }
  });
}

export function enterJiggleMode() {
  if (state.isJiggleMode) return;
  state.isJiggleMode = true;
  renderBackpackView();
}

export function exitJiggleMode() {
  if (!state.isJiggleMode) return;
  state.isJiggleMode = false;
  renderBackpackView();
}

function deleteSubject(subjectCode) {
  const subj = state.driveSubjects.find(s => s.code === subjectCode);
  const name = subj ? subj.name : subjectCode;
  if (confirm(`Bạn có chắc chắn muốn xóa môn "${name}" (${subjectCode}) khỏi Chiếc Cặp?`)) {
    state.driveSubjects = state.driveSubjects.filter(s => s.code !== subjectCode);
    persistDriveSubjects();
    renderBackpackView();
    showToast(`Đã xóa môn ${subjectCode}`);
  }
}

function updateJiggleToolbar() {
  let toolbar = document.getElementById('backpack-jiggle-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'backpack-jiggle-toolbar';
    toolbar.className = 'bp-jiggle-toolbar';
    const section = document.getElementById('backpack-section');
    if (section) section.prepend(toolbar);
  }

  if (state.isJiggleMode) {
    toolbar.innerHTML = `
      <div class="bp-hint-text">
        <i class="fa-solid fa-arrows-spin fa-spin"></i> Chế độ chỉnh sửa: Bấm <strong>✏️</strong> để sửa tỉ lệ điểm, <strong>-</strong> để xóa môn.
      </div>
      <button class="btn btn-primary btn-sm btn-bp-done" id="btn-exit-jiggle">✓ Xong</button>
    `;
    toolbar.style.display = 'flex';
    const doneBtn = document.getElementById('btn-exit-jiggle');
    if (doneBtn) doneBtn.onclick = exitJiggleMode;
  } else {
    toolbar.innerHTML = `
      <div class="bp-hint-text">
        <i class="fa-solid fa-lightbulb"></i> Mẹo: Nhấn giữ ô tròn để bật chế độ chỉnh sửa (hiện nút cây bút ✏️ và nút xóa -).
      </div>
    `;
    toolbar.style.display = 'flex';
  }
}
