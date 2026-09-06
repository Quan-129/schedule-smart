/**
 * ==========================================================================
 * 1. IMPORTS
 * ==========================================================================
 */
import { state, getAllSpaces, createSpace, updateSpace, deleteSpace, archiveSpace } from '../../../3.Database/state.js';
import { showToast } from '../Toast.js';
import { escapeHtml } from '../../../4.Security/sanitizer.js';

/**
 * ==========================================================================
 * 2. CONSTANTS & TEMPLATES
 * ==========================================================================
 */
const DEFAULT_ICONS = ['🎒', '📚', '🎓', '🏛️', '🔬', '💻', '💼', '🚀', '⭐', '✨'];

/**
 * Tạo template HTML cho Modal Tạo/Sửa Space
 * @param {Object} [space] - Đối tượng space nếu đang chỉnh sửa
 * @returns {string}
 */
function createSpaceModalTemplate(space = null) {
  const isEdit = !!space;
  const currentIcon = space ? (space.icon || '🎒') : '🎒';

  return `
    <div id="space-modal" class="modal-overlay active">
      <div class="modal-content space-modal-content">
        <div class="modal-header">
          <div class="modal-header-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
            <i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-folder-plus'}"></i>
          </div>
          <div class="modal-header-text">
            <h3>${isEdit ? 'Chỉnh Sửa Bộ Lịch / Học Kỳ' : 'Tạo Bộ Lịch Học Kỳ Mới'}</h3>
            <p>${isEdit ? 'Cập nhật thông tin học kỳ' : 'Lưu trữ học kỳ cũ trọn đời & tạo không gian mới độc lập'}</p>
          </div>
          <button type="button" class="btn-modal-close" id="btn-close-space-modal" title="Đóng modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="space-modal-form" class="modal-body">
          <div class="form-group">
            <label for="space-name-input">Tên Học Kỳ / Bộ Lịch <span style="color: #ef4444;">*</span></label>
            <input type="text" id="space-name-input" class="form-control" required
              placeholder="VD: Học Kỳ 2 (2025-2026), Bằng 2, Thực tập..."
              value="${space ? escapeHtml(space.name) : ''}">
          </div>

          <div class="form-group">
            <label>Biểu tượng nhận diện</label>
            <div class="space-icon-picker" id="space-icon-picker">
              ${DEFAULT_ICONS.map(ic => `
                <button type="button" class="space-icon-opt ${ic === currentIcon ? 'selected' : ''}" data-icon="${ic}">${ic}</button>
              `).join('')}
            </div>
            <input type="hidden" id="space-icon-input" value="${currentIcon}">
          </div>

          <div class="form-group">
            <label for="space-desc-input">Mô tả hoặc Ghi chú (tùy chọn)</label>
            <input type="text" id="space-desc-input" class="form-control"
              placeholder="VD: Học kỳ chính khóa tại trường..."
              value="${space ? escapeHtml(space.description || '') : ''}">
          </div>

          ${!isEdit ? `
            <div class="form-group" style="background: rgba(99, 102, 241, 0.08); padding: 0.85rem; border-radius: 8px; border: 1px dashed rgba(99, 102, 241, 0.3);">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin: 0; font-weight: 600;">
                <input type="checkbox" id="space-copy-subjects" checked style="width: 16px; height: 16px; accent-color: var(--accent-primary, #6366f1);">
                <span>Sao chép danh sách môn học Drive hiện tại sang kỳ này</span>
              </label>
              <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0.35rem 0 0 1.5rem;">
                Tiết kiệm thời gian nhập lại môn. Điểm số và Lịch học của mỗi kỳ vẫn được lưu hoàn toàn tách biệt.
              </p>
            </div>
          ` : ''}

          <div class="modal-footer" style="padding-top: 1rem; border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); display: flex; justify-content: flex-end; gap: 0.6rem;">
            <button type="button" class="btn-ghost" id="btn-cancel-space-modal">Hủy</button>
            <button type="submit" class="btn-primary">
              <i class="fa-solid fa-check"></i>
              <span>${isEdit ? 'Lưu Thay Đổi' : 'Tạo Học Kỳ Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * ==========================================================================
 * 3. MODAL LOGIC & CONTROLLER
 * ==========================================================================
 */

/**
 * Mở modal tạo hoặc sửa Space
 * @param {Object} [spaceToEdit]
 * @param {Function} [onSaved]
 */
export function openSpaceModal(spaceToEdit = null, onSaved = null) {
  const modalRoot = document.getElementById('modal-root') || document.body;
  
  // Dọn modal cũ nếu có
  const existing = document.getElementById('space-modal');
  if (existing) existing.remove();

  modalRoot.insertAdjacentHTML('beforeend', createSpaceModalTemplate(spaceToEdit));
  const modalEl = document.getElementById('space-modal');
  const closeBtn = document.getElementById('btn-close-space-modal');
  const cancelBtn = document.getElementById('btn-cancel-space-modal');
  const form = document.getElementById('space-modal-form');
  const iconInput = document.getElementById('space-icon-input');
  const iconOpts = modalEl.querySelectorAll('.space-icon-opt');

  const closeModal = () => {
    modalEl.classList.remove('active');
    setTimeout(() => modalEl.remove(), 200);
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  // Chọn Icon
  iconOpts.forEach(btn => {
    btn.onclick = () => {
      iconOpts.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (iconInput) iconInput.value = btn.getAttribute('data-icon') || '🎒';
    };
  });

  // Xử lý Submit
  form.onsubmit = (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('space-name-input');
    const descInput = document.getElementById('space-desc-input');
    const copySubjectsInput = document.getElementById('space-copy-subjects');

    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      showToast('Vui lòng nhập tên học kỳ!');
      return;
    }

    const icon = iconInput ? iconInput.value : '🎒';
    const description = descInput ? descInput.value.trim() : '';
    const shouldCopySubjects = copySubjectsInput ? copySubjectsInput.checked : false;

    if (spaceToEdit) {
      // Cập nhật Space
      updateSpace(spaceToEdit.id, { name, icon, description });
      showToast(`Đã cập nhật học kỳ "${name}"! ✨`);
    } else {
      // Tạo Space mới
      const newSpace = createSpace({
        name,
        icon,
        description,
        copySubjectsFromActive: shouldCopySubjects
      });
      showToast(`Đã tạo học kỳ mới "${name}"! 🚀`);
      if (onSaved) onSaved(newSpace);
      closeModal();
      return;
    }

    if (onSaved) onSaved(spaceToEdit);
    closeModal();
  };
}

/**
 * Hiển thị xác nhận Lưu trữ / Bỏ lưu trữ Space
 * @param {string} spaceId
 * @param {Function} [onDone]
 */
export function handleToggleArchiveSpace(spaceId, onDone = null) {
  const spaces = getAllSpaces();
  const sp = spaces.find(s => s.id === spaceId);
  if (!sp) return;

  const willArchive = !sp.archived;
  archiveSpace(spaceId, willArchive);
  showToast(willArchive ? `Đã lưu trữ "${sp.name}" vào kho lịch cũ 📦` : `Đã kích hoạt lại "${sp.name}" ⚡`);
  if (onDone) onDone();
}

/**
 * Hiển thị xác nhận Xóa vĩnh viễn Space
 * @param {string} spaceId
 * @param {Function} [onDone]
 */
export function handleDeleteSpace(spaceId, onDone = null) {
  const spaces = getAllSpaces();
  const sp = spaces.find(s => s.id === spaceId);
  if (!sp) return;

  if (sp.id === 'default') {
    showToast('Không thể xóa không gian mặc định ban đầu!');
    return;
  }

  if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn học kỳ "${sp.name}" và toàn bộ lịch học, điểm số thuộc học kỳ này?`)) {
    deleteSpace(spaceId);
    showToast(`Đã xóa vĩnh viễn học kỳ "${sp.name}" 🗑️`);
    if (onDone) onDone();
  }
}

/**
 * ==========================================================================
 * 4. EXPORTS
 * ==========================================================================
 */
export {
  createSpaceModalTemplate
};
