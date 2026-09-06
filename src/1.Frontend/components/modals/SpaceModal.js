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
 * Tạo template HTML cho Modal Tạo/Sửa Space theo chuẩn Design System của ứng dụng
 * @param {Object} [space] - Đối tượng space nếu đang chỉnh sửa
 * @returns {string}
 */
function createSpaceModalTemplate(space = null) {
  const isEdit = !!space;
  const currentIcon = space ? (space.icon || '🎓') : '🎓';

  return `
    <div id="space-modal" class="modal-backdrop">
      <div class="modal-card modal-card-sm">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-glow" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);">
              <i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-folder-plus'}"></i>
            </div>
            <div>
              <h3 class="modal-title" style="font-size: 1.15rem;">${isEdit ? 'Chỉnh Sửa Bộ Lịch / Học Kỳ' : 'Tạo Bộ Lịch Học Kỳ Mới'}</h3>
              <span class="modal-subj-sub">${isEdit ? 'Cập nhật thông tin học kỳ' : 'Lưu trữ học kỳ cũ trọn đời & tạo không gian mới độc lập'}</span>
            </div>
          </div>
          <button type="button" class="btn-modal-close" id="btn-close-space-modal" title="Đóng modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="space-modal-form" class="modal-form">
          <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- TÊN HỌC KỲ / BỘ LỊCH -->
            <div class="form-group-styled">
              <label for="space-name-input"><i class="fa-solid fa-tag"></i> Tên Học Kỳ / Bộ Lịch <span class="required-star">*</span></label>
              <div class="input-with-icon">
                <i class="fa-solid fa-layer-group input-icon"></i>
                <input type="text" id="space-name-input" placeholder="Ví dụ: Học Kỳ 2 (2026-2027), Bằng 2, Thực tập..." required value="${space ? escapeHtml(space.name) : ''}" autofocus autocomplete="off">
              </div>
            </div>

            <!-- CHỌN BIỂU TƯỢNG EMOJI -->
            <div class="form-group-styled">
              <label><i class="fa-solid fa-icons"></i> Biểu tượng nhận diện</label>
              <div class="space-icon-picker" id="space-icon-picker">
                ${DEFAULT_ICONS.map(ic => `
                  <button type="button" class="space-icon-opt ${ic === currentIcon ? 'selected' : ''}" data-icon="${ic}">${ic}</button>
                `).join('')}
              </div>
              <input type="hidden" id="space-icon-input" value="${currentIcon}">
            </div>

            <!-- MÔ TẢ / GHI CHÚ -->
            <div class="form-group-styled">
              <label for="space-desc-input"><i class="fa-regular fa-comment-dots"></i> Mô tả hoặc Ghi chú (tùy chọn)</label>
              <div class="input-with-icon">
                <i class="fa-regular fa-note-sticky input-icon"></i>
                <input type="text" id="space-desc-input" placeholder="Ví dụ: Học kỳ chính khóa tại trường..." value="${space ? escapeHtml(space.description || '') : ''}" autocomplete="off">
              </div>
            </div>

            <!-- SAO CHÉP MÔN HỌC (CHỈ KHI TẠO MỚI) -->
            ${!isEdit ? `
              <div class="space-copy-banner">
                <label class="space-checkbox-label">
                  <input type="checkbox" id="space-copy-subjects" checked class="space-checkbox">
                  <span class="space-checkbox-title">Sao chép danh sách môn học Drive hiện tại</span>
                </label>
                <p class="space-checkbox-desc">
                  Tiết kiệm thời gian nhập lại môn. Điểm số và Lịch học của mỗi kỳ vẫn được lưu hoàn toàn tách biệt.
                </p>
              </div>
            ` : ''}
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-ghost" id="btn-cancel-space-modal">Hủy</button>
            <button type="submit" class="btn-primary-gradient">
              <i class="fa-solid ${isEdit ? 'fa-check' : 'fa-plus'}"></i>
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
    modalEl.classList.add('hidden');
    setTimeout(() => modalEl.remove(), 200);
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  // Chọn Icon
  iconOpts.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      iconOpts.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (iconInput) iconInput.value = btn.getAttribute('data-icon') || '🎓';
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

    const icon = iconInput ? iconInput.value : '🎓';
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
    const wasActive = (state.activeSpaceId === spaceId);
    deleteSpace(spaceId);
    showToast(`Đã xóa vĩnh viễn học kỳ "${sp.name}" 🗑️`);
    if (onDone) onDone(wasActive);
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
