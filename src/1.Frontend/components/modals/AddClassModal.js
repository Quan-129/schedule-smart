/**
 * @file AddClassModal.js
 * @description Component Modal Thêm / Chỉnh Sửa Tiết Học Nhanh vào từng Ngày trên Lịch Học
 * @module 1.Frontend/components/modals/AddClassModal
 */

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { state } from '../../../3.Database/state.js';
import { showToast } from '../Toast.js';

// ============================================================================
// 2. CONSTANTS & DOM SELECTORS
// ============================================================================
const MODAL_ID = 'add-class-modal';
let currentEditingClass = null; // { dayName, classIndex, classData }
let onSaveCallback = null;
let onDeleteCallback = null;
let isEventsBound = false;

const TIME_PRESETS = [
  { time: '07:00 - 08:50', period: 'Tiết 2 - 3', label: 'Sáng: Tiết 2-3 (7h-8h50)' },
  { time: '09:00 - 11:50', period: 'Tiết 4 - 6', label: 'Sáng: Tiết 4-6 (9h-11h50)' },
  { time: '07:00 - 09:50', period: 'Tiết 1 - 3', label: 'Sáng: Tiết 1-3 (7h-9h50)' },
  { time: '10:00 - 11:50', period: 'Tiết 5 - 6', label: 'Sáng: Tiết 5-6 (10h-11h50)' },
  { time: '13:00 - 14:50', period: 'Tiết 8 - 9', label: 'Chiều: Tiết 8-9 (13h-14h50)' },
  { time: '15:00 - 16:50', period: 'Tiết 10 - 11', label: 'Chiều: Tiết 10-11 (15h-16h50)' },
  { time: '13:00 - 15:50', period: 'Tiết 7 - 9', label: 'Chiều: Tiết 7-9 (13h-15h50)' },
  { time: '14:00 - 15:50', period: 'Tiết 9 - 10', label: 'Chiều: Tiết 9-10 (14h-15h50)' }
];

const ROOM_PRESETS = ['B1-305 (CS1)', 'B4-505 (CS1)', 'B9-202 (CS1)', 'C4-402 (CS1)', 'B4-301 (CS1)', 'B1-212 (CS1)', 'B4-303 (CS1)'];
const CUSTOM_TIME_PRESETS_KEY = 'smart_schedule_custom_time_presets';
const CUSTOM_ROOM_PRESETS_KEY = 'smart_schedule_custom_room_presets';

/**
 * Đọc danh sách ca học tùy chỉnh do người dùng lưu
 * @returns {Array<Object>}
 */
function getCustomTimePresets() {
  try {
    const raw = localStorage.getItem(CUSTOM_TIME_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc custom time presets:', e);
  }
  return [];
}

/**
 * Lưu danh sách ca học tùy chỉnh vào LocalStorage
 * @param {Array<Object>} presets 
 */
function saveCustomTimePresets(presets) {
  try {
    localStorage.setItem(CUSTOM_TIME_PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Lỗi lưu custom time presets:', e);
  }
}

/**
 * Đọc danh sách phòng học tùy chỉnh do người dùng lưu
 * @returns {Array<string>}
 */
function getCustomRoomPresets() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROOM_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc custom room presets:', e);
  }
  return [];
}

/**
 * Lưu danh sách phòng học tùy chỉnh vào LocalStorage
 * @param {Array<string>} presets 
 */
function saveCustomRoomPresets(presets) {
  try {
    localStorage.setItem(CUSTOM_ROOM_PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Lỗi lưu custom room presets:', e);
  }
}

// ============================================================================
// 3. COMPONENT TEMPLATE / DOM GENERATION
// ============================================================================

/**
 * Đảm bảo khung DOM của Modal Thêm Tiết Học đã tồn tại
 */
export function ensureAddClassModalDom() {
  if (document.getElementById(MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const modalWrapper = document.createElement('div');
  modalWrapper.id = MODAL_ID;
  modalWrapper.className = 'modal-backdrop hidden';
  modalWrapper.innerHTML = `
    <div class="modal-card modal-card-md add-class-modal-card" role="dialog" aria-modal="true">
      <!-- HEADER -->
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-icon-glow" style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);">
            <i class="fa-solid fa-calendar-plus" id="add-class-modal-icon"></i>
          </div>
          <div>
            <h3 id="add-class-modal-title" class="modal-title">Thêm Tiết Học</h3>
            <span id="add-class-modal-subtitle" class="modal-subj-sub">Chọn môn từ Chiếc Cặp và ca học nhanh</span>
          </div>
        </div>
        <button type="button" id="btn-close-add-class" class="btn-modal-close" title="Đóng (ESC)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="add-class-form" class="modal-form" style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 520px;">
        
        <!-- SECTION 1: MÔN HỌC -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="class-subject-input"><i class="fa-solid fa-graduation-cap"></i> Tên môn học: <span class="required-star">*</span></label>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Gợi ý từ Chiếc Cặp:</span>
          </div>
          <div class="subject-chips-picker" id="subject-chips-picker">
            <!-- Render danh sách chip môn học -->
          </div>
          <div class="input-with-icon">
            <i class="fa-solid fa-book-open input-icon"></i>
            <input type="text" id="class-subject-input" class="form-input-styled" placeholder="Nhập tên môn học (VD: Học máy, Tiếng Nhật 7...)" required autocomplete="off">
          </div>
        </div>

        <!-- SECTION 2: KHUNG GIỜ & CA HỌC CHUẨN ĐHBK & TỰ TẠO -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label><i class="fa-solid fa-clock"></i> Ca học mẫu (Chuẩn ĐHBK & Tự tạo):</label>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Bấm để chọn nhanh</span>
          </div>
          <div class="preset-buttons-grid" id="time-presets-grid">
            <!-- Render động từ TIME_PRESETS + Custom Presets -->
          </div>
          
          <!-- Hàng Dual Input: Khung giờ & Tiết học + Nút Lưu Ca Mẫu -->
          <div class="input-row-preset-creator" style="display: flex; gap: 0.45rem; align-items: stretch; margin-top: 0.35rem;">
            <div class="input-with-icon" style="flex: 1.2;">
              <i class="fa-regular fa-clock input-icon"></i>
              <input type="text" id="class-time-input" class="form-input-styled" placeholder="07:00 - 08:50 (VD: 17:00 - 19:30)" required>
            </div>
            <div class="input-with-icon" style="flex: 1;">
              <i class="fa-solid fa-list-ol input-icon"></i>
              <input type="text" id="class-period-input" class="form-input-styled" placeholder="Tiết 2 - 3 (VD: Tiết 12-14)">
            </div>
            <button type="button" id="btn-save-custom-preset" class="btn-save-custom-preset" title="Lưu khung giờ & tiết này lên danh sách mẫu ở trên để dùng lại">
              <i class="fa-solid fa-plus"></i>
              <span>Lưu mẫu</span>
            </button>
          </div>
        </div>

        <!-- SECTION 3: NGÀY & PHÒNG HỌC (Ô Thứ ngắn gọn, Ô Phòng rộng thoáng) -->
        <div class="modal-grid-day-room">
          <!-- Chọn ngày -->
          <div class="form-group-styled">
            <label for="class-day-select"><i class="fa-solid fa-calendar-day"></i> Thứ trong tuần:</label>
            <div class="input-with-icon">
              <i class="fa-regular fa-calendar input-icon"></i>
              <select id="class-day-select" class="form-input-styled" required>
                <option value="Thứ 2">Thứ 2</option>
                <option value="Thứ 3">Thứ 3</option>
                <option value="Thứ 4">Thứ 4</option>
                <option value="Thứ 5">Thứ 5</option>
                <option value="Thứ 6">Thứ 6</option>
                <option value="Thứ 7">Thứ 7</option>
                <option value="Chủ Nhật">Chủ Nhật</option>
              </select>
            </div>
          </div>

          <!-- Phòng học -->
          <div class="form-group-styled">
            <label for="class-room-input"><i class="fa-solid fa-door-open"></i> Phòng học:</label>
            <div class="input-row-preset-creator" style="display: flex; gap: 0.45rem; align-items: stretch;">
              <div class="input-with-icon" style="flex: 1;">
                <i class="fa-solid fa-location-dot input-icon"></i>
                <input type="text" id="class-room-input" class="form-input-styled" placeholder="VD: B1-305 (CS1)" required>
              </div>
              <button type="button" id="btn-save-custom-room" class="btn-save-custom-preset" title="Lưu phòng học này thành gợi ý mẫu để dùng sau">
                <i class="fa-solid fa-plus"></i>
                <span>Lưu phòng</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Gợi ý phòng học nhanh -->
        <div class="room-presets-row" id="room-presets-row">
          <!-- Render động từ ROOM_PRESETS + Custom Room Presets -->
        </div>

        <!-- FOOTER BUTTONS -->
        <div class="modal-footer" style="padding: 1rem 0 0 0; margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
          <button type="button" id="btn-delete-class" class="btn-danger-ghost" style="display: none;">
            <i class="fa-solid fa-trash-can"></i> Xóa tiết này
          </button>
          <div style="display: flex; gap: 0.65rem; margin-left: auto;">
            <button type="button" id="btn-cancel-add-class" class="btn-ghost">Hủy</button>
            <button type="submit" class="btn-primary-gradient">
              <i class="fa-solid fa-check"></i> <span id="btn-save-class-text">Thêm Tiết Học</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  modalRoot.appendChild(modalWrapper);
  bindAddClassModalEvents();
}

/**
 * Render danh sách Chip môn học từ Chiếc Cặp
 */
function renderSubjectChips(selectedSubjectName = '') {
  const container = document.getElementById('subject-chips-picker');
  if (!container) return;

  const subjects = state.driveSubjects || [];
  if (subjects.length === 0) {
    container.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">Chưa có môn trong Chiếc Cặp. Bạn có thể tự gõ tên môn bên dưới.</span>`;
    return;
  }

  container.innerHTML = subjects.map(s => {
    const isSelected = selectedSubjectName && s.name.toLowerCase() === selectedSubjectName.toLowerCase();
    const color = s.color || '#6366f1';
    return `
      <button type="button" class="subject-chip-btn ${isSelected ? 'active' : ''}" 
        style="--chip-color: ${color};"
        data-name="${escapeHtml(s.name)}" 
        data-code="${escapeHtml(s.code)}">
        <i class="${s.icon || 'fa-solid fa-book'}"></i>
        <span>${escapeHtml(s.name)}</span>
      </button>
    `;
  }).join('');

  // Gắn sự kiện click chip
  container.querySelectorAll('.subject-chip-btn').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.subject-chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const nameInput = document.getElementById('class-subject-input');
      if (nameInput) {
        nameInput.value = btn.dataset.name;
        nameInput.focus();
      }
    };
  });
}

/**
 * Render danh sách Ca học mẫu (Chuẩn ĐHBK + Ca Tùy Chỉnh do người dùng tạo)
 * @param {string} activeTime - Thời gian đang được chọn
 */
function renderTimePresets(activeTime = '') {
  const container = document.getElementById('time-presets-grid');
  if (!container) return;

  const customPresets = getCustomTimePresets();
  const allPresets = [
    ...TIME_PRESETS.map(p => ({ ...p, isCustom: false })),
    ...customPresets.map(p => ({ ...p, isCustom: true }))
  ];

  container.innerHTML = allPresets.map((p, idx) => {
    const isCustom = p.isCustom;
    const customIdx = isCustom ? (idx - TIME_PRESETS.length) : -1;
    const isActive = activeTime && (p.time.trim() === activeTime.trim());
    return `
      <div class="time-preset-wrapper ${isCustom ? 'is-custom' : ''}">
        <button type="button" class="btn-time-preset ${isActive ? 'active' : ''}" 
          data-time="${escapeHtml(p.time)}" 
          data-period="${escapeHtml(p.period || '')}"
          title="${escapeHtml(p.label || p.time)}">
          <span class="preset-time-title">${escapeHtml(p.time)}</span>
          <span class="preset-time-period">${escapeHtml(p.period || 'Tự chọn')}</span>
        </button>
        ${isCustom ? `
          <button type="button" class="btn-delete-custom-preset" data-custom-idx="${customIdx}" title="Xóa ca mẫu tự tạo này">
            <i class="fa-solid fa-xmark"></i>
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  // Gắn sự kiện click chọn ca học mẫu
  container.querySelectorAll('.btn-time-preset').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-time-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const timeInput = document.getElementById('class-time-input');
      const periodInput = document.getElementById('class-period-input');
      if (timeInput) timeInput.value = btn.dataset.time;
      if (periodInput) periodInput.value = btn.dataset.period;
    };
  });

  // Gắn sự kiện xóa ca tự tạo
  container.querySelectorAll('.btn-delete-custom-preset').forEach(delBtn => {
    delBtn.onclick = (e) => {
      e.stopPropagation();
      const customIdx = parseInt(delBtn.dataset.customIdx, 10);
      const currentList = getCustomTimePresets();
      if (currentList[customIdx]) {
        const removed = currentList.splice(customIdx, 1)[0];
        saveCustomTimePresets(currentList);
        const timeInput = document.getElementById('class-time-input');
        renderTimePresets(timeInput ? timeInput.value : '');
        showToast(`Đã xóa ca mẫu "${removed.time}" 🗑️`);
      }
    };
  });
}

/**
 * Render danh sách Gợi ý phòng học (Chuẩn + Tự tạo)
 * @param {string} selectedRoom 
 */
function renderRoomPresets(selectedRoom = '') {
  const container = document.getElementById('room-presets-row');
  if (!container) return;

  const customRooms = getCustomRoomPresets();
  const allRooms = [
    ...ROOM_PRESETS.map(r => ({ room: r, isCustom: false })),
    ...customRooms.map(r => ({ room: r, isCustom: true }))
  ];

  container.innerHTML = `
    <span class="room-preset-label">Gợi ý phòng:</span>
    ${allRooms.map((r, idx) => {
      const isCustom = r.isCustom;
      const customIdx = isCustom ? (idx - ROOM_PRESETS.length) : -1;
      const isActive = selectedRoom && (r.room.trim().toLowerCase() === selectedRoom.trim().toLowerCase());
      return `
        <div class="room-preset-tag-wrapper ${isCustom ? 'is-custom-room' : ''}">
          <button type="button" class="btn-room-preset ${isActive ? 'active' : ''}" data-room="${escapeHtml(r.room)}">
            ${escapeHtml(r.room)}
          </button>
          ${isCustom ? `
            <button type="button" class="btn-delete-custom-room" data-custom-idx="${customIdx}" title="Xóa phòng mẫu này">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : ''}
        </div>
      `;
    }).join('')}
  `;

  // Gắn sự kiện click chọn phòng
  container.querySelectorAll('.btn-room-preset').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-room-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const roomInput = document.getElementById('class-room-input');
      if (roomInput) {
        roomInput.value = btn.dataset.room;
        roomInput.focus();
      }
    };
  });

  // Gắn sự kiện xóa phòng tự tạo
  container.querySelectorAll('.btn-delete-custom-room').forEach(delBtn => {
    delBtn.onclick = (e) => {
      e.stopPropagation();
      const customIdx = parseInt(delBtn.dataset.customIdx, 10);
      const currentList = getCustomRoomPresets();
      if (currentList[customIdx] !== undefined) {
        const removed = currentList.splice(customIdx, 1)[0];
        saveCustomRoomPresets(currentList);
        const roomInput = document.getElementById('class-room-input');
        renderRoomPresets(roomInput ? roomInput.value : '');
        showToast(`Đã xóa phòng mẫu "${removed}" 🗑️`);
      }
    };
  });
}

// ============================================================================
// 4. EVENT HANDLERS & DOM BINDING
// ============================================================================

/**
 * Gắn các sự kiện cho Modal
 */
function bindAddClassModalEvents() {
  if (isEventsBound) return;
  const modal = document.getElementById(MODAL_ID);
  const form = document.getElementById('add-class-form');
  const closeBtn = document.getElementById('btn-close-add-class');
  const cancelBtn = document.getElementById('btn-cancel-add-class');
  const deleteBtn = document.getElementById('btn-delete-class');
  const savePresetBtn = document.getElementById('btn-save-custom-preset');
  const saveRoomBtn = document.getElementById('btn-save-custom-room');
  if (!modal || !form) return;

  // Đóng modal
  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentEditingClass = null;
    form.reset();
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Gắn sự kiện Lưu Ca Học Mẫu Mới
  if (savePresetBtn) {
    savePresetBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const timeInput = document.getElementById('class-time-input');
      const periodInput = document.getElementById('class-period-input');
      const timeVal = timeInput ? timeInput.value.trim() : '';
      const periodVal = periodInput ? periodInput.value.trim() : '';

      if (!timeVal) {
        showToast('Vui lòng nhập khung giờ học trước (VD: 17:00 - 19:30)!');
        if (timeInput) timeInput.focus();
        return;
      }

      const customList = getCustomTimePresets();
      const isDuplicate = TIME_PRESETS.some(p => p.time.trim() === timeVal) ||
                          customList.some(p => p.time.trim() === timeVal && p.period.trim() === (periodVal || 'Tự chọn'));
      if (isDuplicate) {
        showToast('Ca học này đã có sẵn trong danh sách mẫu!');
        renderTimePresets(timeVal);
        return;
      }

      const newPreset = {
        time: timeVal,
        period: periodVal || 'Tự chọn',
        label: `Tùy chỉnh: ${timeVal} (${periodVal || 'Tự chọn'})`
      };

      customList.push(newPreset);
      saveCustomTimePresets(customList);
      renderTimePresets(timeVal);
      showToast(`Đã lưu ca mẫu: ${timeVal} (${newPreset.period}) 🎉`);
    };
  }

  // Gắn sự kiện Lưu Phòng Học Mẫu Mới
  if (saveRoomBtn) {
    saveRoomBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const roomInput = document.getElementById('class-room-input');
      const roomVal = roomInput ? roomInput.value.trim() : '';

      if (!roomVal) {
        showToast('Vui lòng nhập tên phòng học trước (VD: H6-204)!');
        if (roomInput) roomInput.focus();
        return;
      }

      const customList = getCustomRoomPresets();
      const isDuplicate = ROOM_PRESETS.some(r => r.toLowerCase() === roomVal.toLowerCase()) ||
                          customList.some(r => r.toLowerCase() === roomVal.toLowerCase());
      if (isDuplicate) {
        showToast('Phòng học này đã có trong danh sách gợi ý!');
        renderRoomPresets(roomVal);
        return;
      }

      customList.push(roomVal);
      saveCustomRoomPresets(customList);
      renderRoomPresets(roomVal);
      showToast(`Đã lưu phòng mẫu: "${roomVal}" 🎉`);
    };
  }

  // Xóa tiết
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (!currentEditingClass) return;
      if (onDeleteCallback) {
        onDeleteCallback(
          currentEditingClass.dayName, 
          currentEditingClass.classIndex, 
          currentEditingClass.classData
        );
      }
      closeModal();
    };
  }

  // Submit Form Lưu Tiết Học
  form.onsubmit = (e) => {
    e.preventDefault();
    const daySelect = document.getElementById('class-day-select');
    const subjectInput = document.getElementById('class-subject-input');
    const timeInput = document.getElementById('class-time-input');
    const periodInput = document.getElementById('class-period-input');
    const roomInput = document.getElementById('class-room-input');

    const dayName = daySelect ? daySelect.value : 'Thứ 2';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const timeRange = timeInput ? timeInput.value.trim() : '';
    const period = periodInput ? periodInput.value.trim() : '';
    const room = roomInput ? roomInput.value.trim() : 'Chưa xếp phòng';

    if (!subject || !timeRange) {
      showToast('Vui lòng nhập tên môn và khung giờ học!');
      return;
    }

    const classData = {
      subject,
      timeRange,
      period,
      room,
      startTime: timeRange.split('-')[0] ? timeRange.split('-')[0].trim() : '',
      endTime: timeRange.split('-')[1] ? timeRange.split('-')[1].trim() : ''
    };

    if (onSaveCallback) {
      onSaveCallback({
        dayName,
        classData,
        isEdit: Boolean(currentEditingClass),
        classIndex: currentEditingClass ? currentEditingClass.classIndex : -1,
        oldDayName: currentEditingClass ? currentEditingClass.dayName : null
      });
    }

    closeModal();
    showToast(`Đã lưu tiết "${subject}" vào ${dayName} 🎉`);
  };

  isEventsBound = true;
}

// ============================================================================
// 5. PUBLIC CONTROLLER / EXPORTS
// ============================================================================

/**
 * Mở modal Thêm Tiết Học Mới vào 1 ngày cụ thể
 * @param {string} targetDayName - Tên ngày (VD: 'Thứ 2', 'Thứ 3'...)
 * @param {Function} onSave - Callback khi lưu
 */
export function openAddClassModal(targetDayName = 'Thứ 2', onSave) {
  ensureAddClassModalDom();
  currentEditingClass = null;
  onSaveCallback = onSave;
  onDeleteCallback = null;

  const modal = document.getElementById(MODAL_ID);
  const titleEl = document.getElementById('add-class-modal-title');
  const subEl = document.getElementById('add-class-modal-subtitle');
  const daySelect = document.getElementById('class-day-select');
  const deleteBtn = document.getElementById('btn-delete-class');
  const saveText = document.getElementById('btn-save-class-text');

  if (titleEl) titleEl.textContent = `Thêm Tiết Học (${targetDayName})`;
  if (subEl) subEl.textContent = 'Chọn môn từ Chiếc Cặp và ca học nhanh';
  if (daySelect) daySelect.value = targetDayName;
  if (deleteBtn) deleteBtn.style.display = 'none';
  if (saveText) saveText.textContent = 'Thêm Tiết Học';

  // Render chips, time presets & room presets
  renderSubjectChips('');
  renderTimePresets('07:00 - 08:50');
  renderRoomPresets('B1-305 (CS1)');

  // Reset form inputs
  const subjectInput = document.getElementById('class-subject-input');
  const timeInput = document.getElementById('class-time-input');
  const periodInput = document.getElementById('class-period-input');
  const roomInput = document.getElementById('class-room-input');
  if (subjectInput) subjectInput.value = '';
  if (timeInput) timeInput.value = '07:00 - 08:50';
  if (periodInput) periodInput.value = 'Tiết 2 - 3';
  if (roomInput) roomInput.value = 'B1-305 (CS1)';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Mở modal Chỉnh Sửa một tiết học hiện có
 * @param {string} dayName 
 * @param {number} classIndex 
 * @param {Object} classData 
 * @param {Function} onSave 
 * @param {Function} onDelete 
 */
export function openEditClassModal(dayName, classIndex, classData, onSave, onDelete) {
  ensureAddClassModalDom();
  currentEditingClass = { dayName, classIndex, classData };
  onSaveCallback = onSave;
  onDeleteCallback = onDelete;

  const modal = document.getElementById(MODAL_ID);
  const titleEl = document.getElementById('add-class-modal-title');
  const subEl = document.getElementById('add-class-modal-subtitle');
  const daySelect = document.getElementById('class-day-select');
  const deleteBtn = document.getElementById('btn-delete-class');
  const saveText = document.getElementById('btn-save-class-text');

  if (titleEl) titleEl.textContent = `Chỉnh Sửa Tiết: ${classData.subject}`;
  if (subEl) subEl.textContent = `Cập nhật phòng học, ca học hoặc đổi thứ`;
  if (daySelect) daySelect.value = dayName;
  if (deleteBtn) deleteBtn.style.display = 'inline-flex';
  if (saveText) saveText.textContent = 'Cập Nhật Tiết Học';

  // Render chips, time presets & room presets
  renderSubjectChips(classData.subject);
  renderTimePresets(classData.timeRange || '');
  renderRoomPresets(classData.room || '');

  // Fill values
  const subjectInput = document.getElementById('class-subject-input');
  const timeInput = document.getElementById('class-time-input');
  const periodInput = document.getElementById('class-period-input');
  const roomInput = document.getElementById('class-room-input');
  if (subjectInput) subjectInput.value = classData.subject || '';
  if (timeInput) timeInput.value = classData.timeRange || '';
  if (periodInput) periodInput.value = classData.period || '';
  if (roomInput) roomInput.value = classData.room || '';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
