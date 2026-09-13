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
            <div class="bp-app-details">
              <span class="bp-app-title">${escapeHtml(subject.name)}</span>
              <span class="bp-app-drive-status ${subject.driveUrl ? 'has-url' : 'not-set'}">
                ${subject.driveUrl ? 'Đã có Drive' : 'Chưa có Drive'}
              </span>
            </div>
          </div>
          <button class="btn-ungroup-sub-node" data-action="ungroup" data-code="${escapeHtml(subject.code)}" title="Đưa môn này ra khỏi thư mục">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Tách ra
          </button>
        </div>
      `).join('')}
    </div>

    <div class="modal-folder-footer">
      <button type="button" class="btn-dissolve-folder" id="btn-dissolve-folder-action">
        <i class="fa-solid fa-folder-minus"></i> Giải tán thư mục
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

  // 2. Nút Đóng
  const closeBtn = document.getElementById('close-folder-detail-btn');
  const doneBtn = document.getElementById('btn-done-folder-action');
  if (closeBtn) closeBtn.onclick = closeFolderDetailModal;
  if (doneBtn) doneBtn.onclick = closeFolderDetailModal;

  // 3. Giải tán thư mục (Un-group tất cả)
  const dissolveBtn = document.getElementById('btn-dissolve-folder-action');
  if (dissolveBtn) {
    dissolveBtn.onclick = () => {
      const folder = (state.driveFolders || []).find(f => f.id === folderId);
      const name = folder ? folder.name : 'thư mục';
      if (confirm(`Bạn có chắc chắn muốn giải tán "${name}"?\nToàn bộ các môn học sẽ quay trở lại màn hình chính của Chiếc Cặp.`)) {
        removeDriveFolder(folderId, true);
        closeFolderDetailModal();
        if (window.renderBackpackView) window.renderBackpackView();
        showToast(`Đã giải tán thư mục "${name}" ✓`);
      }
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
