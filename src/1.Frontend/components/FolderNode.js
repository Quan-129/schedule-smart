/**
 * ==========================================================================
 * FRONTEND COMPONENT - CIRCULAR FOLDER NODE (APPLE iOS STYLE)
 * Vẽ Node Thư Mục hình tròn kèm lưới 2x2 các icon thu nhỏ của các môn bên trong
 * ==========================================================================
 */

import { escapeHtml } from '../../4.Security/sanitizer.js';

/**
 * Render HTML cho một Node Thư Mục hình tròn
 * @param {Object} folder - Đối tượng thư mục { id, name, color, ... }
 * @param {Array} subSubjects - Danh sách các môn học con bên trong
 * @param {boolean} isJiggleMode - Trạng thái rung lắc chỉnh sửa
 * @returns {string} HTML string
 */
export function renderFolderNodeHtml(folder, subSubjects = [], isJiggleMode = false) {
  const folderName = escapeHtml(folder.name || 'Thư mục');
  const count = subSubjects.length;

  // 1. Tạo 4 ô icon thu nhỏ bên trong thư mục (kiểu iOS Home Screen Folder)
  const miniGridItems = subSubjects.slice(0, 4).map(subj => {
    const icon = subj.icon || 'fa-solid fa-book';
    const color = subj.color || '#6366f1';
    return `
      <div class="bp-folder-mini-item" style="background-color: ${color};" title="${escapeHtml(subj.name)}">
        <i class="${icon}"></i>
      </div>
    `;
  }).join('');

  // 2. Nút Xóa đỏ (-) và Nút Cây Bút vàng (✏️) chỉ hiển thị khi ở Jiggle Mode
  const deleteBadgeHtml = isJiggleMode ? `
    <button class="btn-delete-node-badge" title="Giải tán thư mục ${folderName}" data-action="delete-folder" data-id="${folder.id}">
      <i class="fa-solid fa-minus"></i>
    </button>
  ` : '';

  const editBadgeHtml = isJiggleMode ? `
    <button class="btn-edit-node-pencil" title="Đổi tên thư mục ${folderName}" data-action="edit-folder" data-id="${folder.id}">
      <i class="fa-solid fa-pen"></i>
    </button>
  ` : '';

  return `
    <div class="bp-circle-wrapper">
      <div class="bp-folder-mini-grid">
        ${miniGridItems}
      </div>
      ${deleteBadgeHtml}
      ${editBadgeHtml}
    </div>

    <div class="bp-app-details">
      <span class="bp-app-title" title="${folderName}">${folderName}</span>
      <span class="bp-app-drive-status has-url">${count} môn học</span>
    </div>
  `;
}
