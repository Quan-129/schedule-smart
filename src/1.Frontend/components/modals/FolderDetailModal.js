/**
 * ==========================================================================
 * FRONTEND MODAL - FOLDER DETAIL MODAL (APPLE iOS STYLE POPUP)
 * Hiển thị danh sách môn học trong Thư Mục, đổi tên, tách môn (Un-group), giải tán
 * ==========================================================================
 */

// 1. IMPORTS
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { state, renameDriveFolder, removeSubjectFromFolder, removeDriveFolder } from '../../../3.Database/state.js';
import { renderCircularNodeHtml } from '../CircularNode.js';
import { openSubjectDetailModal } from './SubjectDetailModal.js';
import { showToast } from '../Toast.js';

// 2. CONSTANTS & DOM SELECTORS
const MODAL_ID = 'folder-detail-modal';
let currentFolderId = null;

// 3. TEMPLATES / DOM GENERATION
export function ensureFolderDetailModalDom() {
  if (document.getElementById(MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.id = MODAL_ID;
  modalWrapper.className = 'modal-backdrop hidden';
  modalWrapper.innerHTML = `
    <div class="modal-folder-box" role="dialog" aria-modal="true">
      <div id="folder-detail-content"></div>
    </div>
  `;

  modalWrapper.addEventListener('click', (e) => {
    if (e.target === modalWrapper) {
      closeFolderDetailModal();
    }
  });

  modalRoot.appendChild(modalWrapper);
}

/**
 * Mở modal chi tiết thư mục
 * @param {string} folderId 
 */
export function openFolderDetailModal(folderId) {
  ensureFolderDetailModalDom();
  currentFolderId = folderId;

  const folder = (state.driveFolders || []).find(f => f.id === folderId);
  if (!folder) return;

  const modalWrapper = document.getElementById(MODAL_ID);
  const contentEl = document.getElementById('folder-detail-content');
  if (!modalWrapper || !contentEl) return;

  const subSubjects = (state.driveSubjects || []).filter(s => s.folderId === folderId);

  // Template HTML
  contentEl.innerHTML = `
    <div class="modal-folder-header">
      <div class="modal-folder-title-wrap">
        <i class="fa-solid fa-folder-open folder-icon"></i>
        <input 
          type="text" 
          id="folder-name-input" 
          class="modal-folder-title-input" 
          value="${escapeHtml(folder.name)}" 
          placeholder="Nhập tên thư mục..."
          title="Bấm vào để đổi tên thư mục"
        />
      </div>
      <button class="modal-close-btn" id="close-folder-detail-btn" title="Đóng">&times;</button>
    </div>

    <div class="modal-folder-grid" id="folder-items-grid">
      ${subSubjects.map(subject => `
        <div class="folder-sub-item-card" data-code="${escapeHtml(subject.code)}">
          <div class="bp-app-btn" style="--app-color: ${subject.color || '#6366f1'}; cursor: pointer;">
            ${renderCircularNodeHtml(subject, false)}
          </div>
          <button class="btn-ungroup-sub-node" data-action="ungroup" data-code="${escapeHtml(subject.code)}" title="Đưa môn này ra khỏi thư mục">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Tách ra
          </button>
        </div>
      `).join('')}
    </div>

    <div class="modal-folder-footer">
      <button type="button" class="btn-dissolve-folder" id="btn-dissolve-folder-action" title="Giải tán thư mục và trả toàn bộ môn về màn hình chính">
        <i class="fa-solid fa-folder-minus"></i> <span>Giải tán thư mục</span>
      </button>
      <button type="button" class="btn-close-folder-modal" id="btn-done-folder-action">
        Xong
      </button>
    </div>
  `;

  bindModalEvents(folderId);

  modalWrapper.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Đóng modal chi tiết thư mục
 */
export function closeFolderDetailModal() {
  const modalWrapper = document.getElementById(MODAL_ID);
  if (modalWrapper) {
    modalWrapper.classList.add('hidden');
  }
  document.body.style.overflow = '';
  currentFolderId = null;
}

// 4. EVENT HANDLERS
function bindModalEvents(folderId) {
  // 1. Đổi tên thư mục khi gõ và rời ô input
  const nameInput = document.getElementById('folder-name-input');
  if (nameInput) {
    const handleRename = () => {
      const val = nameInput.value.trim();
      if (val) {
        renameDriveFolder(folderId, val);
        if (window.renderBackpackView) window.renderBackpackView();
      }
    };
    nameInput.addEventListener('blur', handleRename);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        nameInput.blur();
      }
    });
  }

  // 2. Nút Đóng & Xong
  const closeBtn = document.getElementById('close-folder-detail-btn');
  const doneBtn = document.getElementById('btn-done-folder-action');
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeFolderDetailModal();
    };
  }
  if (doneBtn) {
    doneBtn.onclick = (e) => {
      e.stopPropagation();
      closeFolderDetailModal();
    };
  }

  // 3. Giải tán thư mục (Cơ chế Two-Step Confirmation an toàn 100%, không bị browser chặn)
  const dissolveBtn = document.getElementById('btn-dissolve-folder-action');
  let isConfirmingDissolve = false;
  let dissolveTimeout = null;

  if (dissolveBtn) {
    dissolveBtn.onclick = (e) => {
      e.stopPropagation();

      // Bước 2: Bấm lần 2 để thực hiện giải tán
      if (isConfirmingDissolve) {
        if (dissolveTimeout) clearTimeout(dissolveTimeout);
        const folder = (state.driveFolders || []).find(f => f.id === folderId);
        const name = folder ? folder.name : 'thư mục';

        removeDriveFolder(folderId, true);
        closeFolderDetailModal();
        if (window.renderBackpackView) window.renderBackpackView();
        showToast(`Đã giải tán "${name}", các môn đã trở về màn hình chính! ✓`);
        return;
      }

      // Bước 1: Yêu cầu xác nhận inline trên nút
      isConfirmingDissolve = true;
      dissolveBtn.classList.add('btn-dissolve-confirming');
      dissolveBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>Chắc chắn giải tán?</span>';

      dissolveTimeout = setTimeout(() => {
        isConfirmingDissolve = false;
        dissolveBtn.classList.remove('btn-dissolve-confirming');
        dissolveBtn.innerHTML = '<i class="fa-solid fa-folder-minus"></i> <span>Giải tán thư mục</span>';
      }, 3500);
    };
  }

  // 4. Tách lẻ từng môn con hoặc Bấm vào môn con để xem chi tiết
  const gridEl = document.getElementById('folder-items-grid');
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const ungroupBtn = e.target.closest('[data-action="ungroup"]');
      if (ungroupBtn) {
        e.stopPropagation();
        const code = ungroupBtn.dataset.code;
        removeSubjectFromFolder(code);
        showToast(`Đã đưa môn ${code} ra khỏi thư mục ✓`);
        if (window.renderBackpackView) window.renderBackpackView();

        // Kiểm tra xem folder còn tồn tại không
        const remaining = (state.driveSubjects || []).filter(s => s.folderId === folderId);
        if (remaining.length <= 1) {
          closeFolderDetailModal();
        } else {
          openFolderDetailModal(folderId); // Re-render modal
        }
        return;
      }

      const card = e.target.closest('.folder-sub-item-card');
      if (card) {
        const code = card.dataset.code;
        if (code) {
          closeFolderDetailModal();
          openSubjectDetailModal(code);
        }
      }
    });
  }
}
