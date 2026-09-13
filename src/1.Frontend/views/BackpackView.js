/**
 * ==========================================================================
 * FRONTEND VIEW - BACKPACK VIEW (CHIẾC CẶP GOOGLE DRIVE & CIRCULAR NODES)
 * Hỗ trợ chế độ rung lắc Jiggle Mode (Apple Style), Kéo-Thả gom Thư mục & Đầy đủ cách thoát:
 * - Nút "✓ Xong" trên thanh điều khiển
 * - Bấm vào khoảng trống nền
 * - Phím ESC
 * ==========================================================================
 */

// 1. IMPORTS
import { state, persistDriveSubjects, removeDriveFolder } from '../../3.Database/state.js';
import { renderCircularNodeHtml } from '../components/CircularNode.js';
import { renderFolderNodeHtml } from '../components/FolderNode.js';
import { openFolderDetailModal } from '../components/modals/FolderDetailModal.js';
import { openEditDriveModal } from '../components/EditModal.js';
import { openAddSubjectModal } from '../components/modals/AddSubjectModal.js';
import { openSubjectDetailModal } from '../components/modals/SubjectDetailModal.js';
import { showToast } from '../components/Toast.js';
import { syncDriveSubjectsToCloud } from '../../3.Database/auth/FirebaseAuthService.js';
import { attachBackpackDragDrop } from './backpack/BackpackDragDrop.js';

// 2. CONSTANTS & VARIABLES
let longPressTimer = null;
let isLongPressTriggered = false;
let globalEventsAttached = false;

// 3. MAIN RENDER FUNCTION
/**
 * Render toàn bộ giao diện Chiếc Cặp dạng lưới vòng tròn (Folders & Subjects)
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

  // 1. Render các Node Thư Mục (Folders)
  const folders = Array.isArray(state.driveFolders) ? state.driveFolders : [];
  folders.forEach((folder) => {
    const subSubjects = (state.driveSubjects || []).filter(s => s.folderId === folder.id);
    // Chỉ hiển thị thư mục nếu còn môn học bên trong
    if (subSubjects.length === 0) return;

    const folderBtn = document.createElement('div');
    folderBtn.className = `bp-app-btn bp-folder-btn ${state.isJiggleMode ? 'jiggle-active' : ''}`;
    folderBtn.dataset.folderId = folder.id;

    folderBtn.innerHTML = renderFolderNodeHtml(folder, subSubjects, state.isJiggleMode);
    attachFolderEvents(folderBtn, folder);
    container.appendChild(folderBtn);
  });

  // 2. Render từng Node môn học độc lập (chưa thuộc thư mục nào)
  const standaloneSubjects = (state.driveSubjects || []).filter(s => !s.folderId);
  standaloneSubjects.forEach((subject) => {
    const btn = document.createElement('div');
    btn.className = `bp-app-btn ${state.isJiggleMode ? 'jiggle-active' : ''}`;
    btn.style.setProperty('--app-color', subject.color || '#6366f1');
    btn.dataset.code = subject.code;

    btn.innerHTML = renderCircularNodeHtml(subject, state.isJiggleMode);
    attachNodeEvents(btn, subject);
    container.appendChild(btn);
  });

  // 3. Render nút Thêm Môn Học
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

  // 4. Gắn cơ chế Kéo Thả (Pointer Drag & Drop) khi ở Jiggle Mode
  if (state.isJiggleMode) {
    attachBackpackDragDrop(container);
  }

  // 5. Cập nhật thanh công cụ Jiggle Mode (Nút Xong & Hướng dẫn)
  updateJiggleToolbar();

  // 6. Gắn các sự kiện toàn cục để thoát Jiggle (Click ngoài, ESC)
  attachGlobalJiggleEvents();
}

// 4. EVENT HANDLERS
/**
 * Gắn các sự kiện click, long-press cho từng Node môn học
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
    }, 750);
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
    if (moveX > 8 || moveY > 8) {
      cancelLongPress();
    }
  };

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

    // 3. Nếu đang ở chế độ Jiggle, không mở chi tiết
    if (state.isJiggleMode) {
      e.stopPropagation();
      return;
    }

    // 4. Nếu vừa kích hoạt long press thì bỏ qua click
    if (isLongPressTriggered) {
      isLongPressTriggered = false;
      return;
    }

    // 5. Mở trang Chi Tiết Môn Học
    openSubjectDetailModal(subject.code);
  });
}

/**
 * Gắn các sự kiện cho Node Thư Mục (Folder Node)
 */
function attachFolderEvents(btn, folder) {
  const circleWrapper = btn.querySelector('.bp-circle-wrapper');
  if (!circleWrapper) return;

  const startLongPress = () => {
    isLongPressTriggered = false;
    longPressTimer = setTimeout(() => {
      isLongPressTriggered = true;
      enterJiggleMode();
      if (navigator.vibrate) navigator.vibrate(60);
    }, 750);
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  circleWrapper.addEventListener('mousedown', startLongPress);
  circleWrapper.addEventListener('touchstart', startLongPress, { passive: true });
  circleWrapper.addEventListener('mouseup', cancelLongPress);
  circleWrapper.addEventListener('mouseleave', cancelLongPress);
  circleWrapper.addEventListener('touchend', cancelLongPress);
  circleWrapper.addEventListener('touchcancel', cancelLongPress);

  circleWrapper.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    enterJiggleMode();
  });

  btn.addEventListener('click', (e) => {
    // 1. Nút Giải tán thư mục (-)
    const deleteBtn = e.target.closest('[data-action="delete-folder"]');
    if (deleteBtn) {
      e.stopPropagation();
      if (confirm(`Bạn có chắc chắn muốn giải tán thư mục "${folder.name}"?\nToàn bộ các môn học bên trong sẽ trở lại màn hình chính của Chiếc Cặp.`)) {
        removeDriveFolder(folder.id, true);
        renderBackpackView();
        showToast(`Đã giải tán thư mục "${folder.name}" ✓`);
      }
      return;
    }

    // 2. Nút Bút Chì (✏️) Đổi tên thư mục
    const editBtn = e.target.closest('[data-action="edit-folder"]');
    if (editBtn) {
      e.stopPropagation();
      openFolderDetailModal(folder.id);
      return;
    }

    // 3. Nếu đang ở Jiggle mode, không mở modal
    if (state.isJiggleMode) {
      e.stopPropagation();
      return;
    }

    if (isLongPressTriggered) {
      isLongPressTriggered = false;
      return;
    }

    // 4. Chạm vào Folder mở Modal Chi tiết Thư mục
    openFolderDetailModal(folder.id);
  });
}

/**
 * Bật chế độ rung lắc chỉnh sửa (Jiggle Mode)
 */
export function enterJiggleMode() {
  if (state.isJiggleMode) return;
  state.isJiggleMode = true;
  renderBackpackView();
  showToast('Chế độ chỉnh sửa: Kéo thả 2 môn vào nhau để gom thành Thư mục 📁, hoặc bấm ✏️/(-)');
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
        <span><strong>Chế độ chỉnh sửa đang bật:</strong> Cầm kéo thả 2 môn vào nhau để <strong>tạo Thư mục gom nhóm 📁</strong>. Bấm <strong style="color: #f59e0b;">✏️</strong> để sửa, <strong style="color: #ef4444;">-</strong> để xóa. Bấm <strong style="color: #3b82f6;">"Xong"</strong> để hoàn tất.</span>
      `;
    }
  } else {
    if (doneBtn) {
      doneBtn.style.display = 'none';
    }
    if (hintText) {
      hintText.innerHTML = `
        <i class="fa-solid fa-hand-pointer"></i>
        <span><em>Mẹo: <strong>Nhấn giữ ô tròn</strong> để kích hoạt chế độ chỉnh sửa (kéo thả gom nhóm thư mục, đổi link ✏️, xóa -).</em></span>
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isJiggleMode) {
      exitJiggleMode();
    }
  });

  const backpackSection = document.getElementById('backpack-view-container');
  if (backpackSection) {
    backpackSection.addEventListener('click', (e) => {
      if (!state.isJiggleMode) return;

      if (
        e.target.closest('.bp-app-btn') ||
        e.target.closest('#bp-done-jiggle-btn') ||
        e.target.closest('#bp-add-subject-btn') ||
        e.target.closest('.backpack-filter-box') ||
        e.target.closest('.modal-backdrop') ||
        e.target.closest('.modal-folder-box')
      ) {
        return;
      }

      exitJiggleMode();
    });
  }
}

// 5. EXPORTS & WINDOW ALIASES
window.enterJiggleMode = enterJiggleMode;
window.exitJiggleMode = exitJiggleMode;
window.renderBackpackView = renderBackpackView;
