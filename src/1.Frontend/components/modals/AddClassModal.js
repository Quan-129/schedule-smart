/**
 * @file AddClassModal.js
 * @description Component Modal Thêm / Chỉnh Sửa Tiết Học Nhanh vào từng Ngày trên Lịch Học
 *              Tích hợp cơ chế chọn giờ Con Lăn 3D chuẩn Báo Thức iPhone (iOS Alarm Drum Roller Wheel)
 * @module 1.Frontend/components/modals/AddClassModal
 */

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { state } from '../../../3.Database/state.js';
import { showToast } from '../Toast.js';

// ============================================================================
// 2. CONSTANTS & STATE
// ============================================================================
const MODAL_ID = 'add-class-modal';
const PICKER_MODAL_ID = 'ios-wheel-picker-modal';
const ITEM_HEIGHT = 44; // Chiều cao mỗi nấc con lăn (chuẩn iOS)

let currentEditingClass = null; // { dayName, classIndex, classData }
let onSaveCallback = null;
let onDeleteCallback = null;
let isEventsBound = false;
let isPickerEventsBound = false;

// Trạng thái giờ được chọn
const pickerState = {
  startTime: '07:00',
  endTime: '08:50',
  activeTarget: 'start' // 'start' | 'end'
};

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

/**
 * Tự động tìm tên Tiết học từ khung giờ nếu khớp với ca học chuẩn
 * @param {string} timeRange 
 * @returns {string}
 */
function getPeriodFromTimeRange(timeRange = '') {
  const allPresets = [...TIME_PRESETS, ...getCustomTimePresets()];
  const matched = allPresets.find(p => p.time.trim() === timeRange.trim());
  return matched ? (matched.period || '') : '';
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
          
          <!-- Hàng Chọn Giờ Con Lăn 3D Chuẩn iOS Alarm + Nút Lưu Ca Mẫu -->
          <div class="ios-time-picker-row">
            <div class="ios-time-range-capsules">
              <!-- Capsule Bắt đầu -->
              <button type="button" id="btn-pick-start-time" class="ios-capsule-box" title="Bấm để mở con lăn iOS chọn giờ bắt đầu">
                <span class="ios-capsule-label">BẮT ĐẦU</span>
                <div class="ios-capsule-input-wrap">
                  <i class="fa-regular fa-clock"></i>
                  <span id="display-start-time" class="ios-capsule-time-text">07:00</span>
                </div>
              </button>

              <div class="ios-time-arrow">
                <i class="fa-solid fa-arrow-right-long"></i>
              </div>

              <!-- Capsule Kết thúc -->
              <button type="button" id="btn-pick-end-time" class="ios-capsule-box" title="Bấm để mở con lăn iOS chọn giờ kết thúc">
                <span class="ios-capsule-label">KẾT THÚC</span>
                <div class="ios-capsule-input-wrap">
                  <i class="fa-regular fa-clock"></i>
                  <span id="display-end-time" class="ios-capsule-time-text">08:50</span>
                </div>
              </button>
            </div>

            <!-- Nút Lưu ca mẫu -->
            <button type="button" id="btn-save-custom-preset" class="btn-save-custom-preset" title="Lưu khung giờ này lên danh sách mẫu ở trên">
              <i class="fa-solid fa-plus"></i>
              <span>Lưu ca mẫu</span>
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
  ensureIosWheelPickerDom();
  bindAddClassModalEvents();
}

/**
 * Đảm bảo Modal Con Lăn 3D Kiểu Báo Thức iOS (Alarm Drum Roller Picker) đã tồn tại trong DOM
 */
function ensureIosWheelPickerDom() {
  if (document.getElementById(PICKER_MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const pickerWrapper = document.createElement('div');
  pickerWrapper.id = PICKER_MODAL_ID;
  pickerWrapper.className = 'ios-picker-backdrop hidden';
  pickerWrapper.innerHTML = `
    <div class="ios-picker-sheet" role="dialog" aria-modal="true">
      <!-- HEADER CHUẨN iPHONE BÁO THỨC -->
      <div class="ios-picker-header">
        <button type="button" id="btn-ios-picker-cancel" class="ios-picker-btn-cancel">Hủy</button>
        <div class="ios-picker-title-group">
          <span id="ios-picker-title" class="ios-picker-title">Chọn Giờ Bắt Đầu</span>
          <span id="ios-picker-subpreview" class="ios-picker-subpreview">07 : 00</span>
        </div>
        <button type="button" id="btn-ios-picker-save" class="ios-picker-btn-save">Lưu</button>
      </div>

      <!-- DRUM ROLLER WHEEL 3D CONTAINER -->
      <div class="ios-wheel-roller-container">
        <!-- Vạch thấu kính chọn chính giữa -->
        <div class="ios-wheel-lens"></div>

        <!-- CỘT CON LĂN GIỜ (00 - 23) -->
        <div class="ios-wheel-col" id="ios-wheel-hours-col" data-unit="hours">
          <div class="ios-wheel-scroller" id="ios-wheel-hours-scroller">
            ${Array.from({ length: 24 }, (_, i) => {
              const val = String(i).padStart(2, '0');
              return `<div class="ios-wheel-item" data-val="${i}">${val}</div>`;
            }).join('')}
          </div>
        </div>

        <!-- DẤU HAI CHẤM -->
        <div class="ios-wheel-colon">:</div>

        <!-- CỘT CON LĂN PHÚT (00 - 59) -->
        <div class="ios-wheel-col" id="ios-wheel-minutes-col" data-unit="minutes">
          <div class="ios-wheel-scroller" id="ios-wheel-minutes-scroller">
            ${Array.from({ length: 60 }, (_, i) => {
              const val = String(i).padStart(2, '0');
              return `<div class="ios-wheel-item" data-val="${i}">${val}</div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- GỢI Ý MỐC GIỜ THÔNG DỤNG CHUẨN TIẾT HỌC ĐHBK -->
      <div class="ios-quick-presets-bar">
        <button type="button" class="ios-quick-pill" data-time="07:00">07:00 (Sáng)</button>
        <button type="button" class="ios-quick-pill" data-time="08:50">08:50</button>
        <button type="button" class="ios-quick-pill" data-time="09:00">09:00</button>
        <button type="button" class="ios-quick-pill" data-time="11:50">11:50</button>
        <button type="button" class="ios-quick-pill" data-time="13:00">13:00 (Chiều)</button>
        <button type="button" class="ios-quick-pill" data-time="14:50">14:50</button>
        <button type="button" class="ios-quick-pill" data-time="15:00">15:00</button>
        <button type="button" class="ios-quick-pill" data-time="16:50">16:50</button>
      </div>
    </div>
  `;

  modalRoot.appendChild(pickerWrapper);
  bindIosWheelPickerEvents();
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
 * Lấy chuỗi khung giờ học từ 2 ô Bắt đầu và Kết thúc (VD: '07:00 - 08:50')
 * @returns {string}
 */
export function getCurrentTimeRangeString() {
  const startEl = document.getElementById('display-start-time');
  const endEl = document.getElementById('display-end-time');
  const start = startEl ? startEl.textContent.trim() : (pickerState.startTime || '07:00');
  const end = endEl ? endEl.textContent.trim() : (pickerState.endTime || '08:50');
  return `${start} - ${end}`;
}

/**
 * Đồng bộ 2 ô chọn giờ Bắt đầu và Kết thúc từ chuỗi timeRange
 * @param {string} timeRangeString 
 */
export function syncTimeInputsFromRange(timeRangeString = '07:00 - 08:50') {
  const parts = (timeRangeString || '').split('-').map(s => s.trim());
  const startVal = parts[0] || '07:00';
  const endVal = parts[1] || '08:50';
  
  pickerState.startTime = startVal;
  pickerState.endTime = endVal;

  const startEl = document.getElementById('display-start-time');
  const endEl = document.getElementById('display-end-time');
  if (startEl) startEl.textContent = startVal;
  if (endEl) endEl.textContent = endVal;
}

/**
 * Tô sáng Ca học mẫu nếu khung giờ khớp với các ca học có sẵn
 */
function highlightActivePreset() {
  const currentRange = getCurrentTimeRangeString();
  const container = document.getElementById('time-presets-grid');
  if (container) {
    container.querySelectorAll('.btn-time-preset').forEach(b => {
      b.classList.toggle('active', b.dataset.time === currentRange.trim());
    });
  }
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
          title="${escapeHtml(p.label || p.time)}">
          <span class="preset-time-title">${escapeHtml(p.time)}</span>
          ${p.period ? `<span class="preset-time-period">${escapeHtml(p.period)}</span>` : ''}
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
      syncTimeInputsFromRange(btn.dataset.time);
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
        renderTimePresets(getCurrentTimeRangeString());
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
// 4. iOS DRUM ROLLER WHEEL ENGINE & CONTROLLER
// ============================================================================

/**
 * Cập nhật hiệu ứng 3D (perspective, rotateX, scale, opacity) cho từng item khi cuộn
 * @param {HTMLElement} scroller 
 */
function updateWheel3DEffect(scroller) {
  if (!scroller) return;
  const scrollTop = scroller.scrollTop;
  const items = scroller.querySelectorAll('.ios-wheel-item');
  
  items.forEach((item, idx) => {
    const itemCenter = idx * ITEM_HEIGHT;
    const distance = itemCenter - scrollTop;
    const absDist = Math.abs(distance);
    
    // Tính góc xoay rotateX (-65deg đến 65deg)
    const angle = Math.max(-65, Math.min(65, (distance / ITEM_HEIGHT) * 22));
    // Tính độ mờ opacity (0.18 đến 1.0)
    const opacity = Math.max(0.18, 1 - (absDist / (ITEM_HEIGHT * 2.6)));
    // Tính độ phóng đại
    const scale = absDist < (ITEM_HEIGHT * 0.5) ? 1.15 : 0.95;

    item.style.transform = `perspective(300px) rotateX(${-angle}deg) scale(${scale})`;
    item.style.opacity = opacity.toFixed(2);

    if (absDist < (ITEM_HEIGHT * 0.5)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Cuộn con lăn mượt mà tới giờ và phút cụ thể
 * @param {number} hour 
 * @param {number} minute 
 * @param {boolean} smooth 
 */
function scrollToTime(hour, minute, smooth = true) {
  const hoursScroller = document.getElementById('ios-wheel-hours-scroller');
  const minutesScroller = document.getElementById('ios-wheel-minutes-scroller');
  const behavior = smooth ? 'smooth' : 'auto';

  const h = Math.max(0, Math.min(23, hour || 0));
  const m = Math.max(0, Math.min(59, minute || 0));

  if (hoursScroller) {
    hoursScroller.scrollTo({ top: h * ITEM_HEIGHT, behavior });
    updateWheel3DEffect(hoursScroller);
  }
  if (minutesScroller) {
    minutesScroller.scrollTo({ top: m * ITEM_HEIGHT, behavior });
    updateWheel3DEffect(minutesScroller);
  }

  updatePickerSubpreview(h, m);
}

/**
 * Cập nhật số giờ xem trước trên header của picker
 * @param {number} h 
 * @param {number} m 
 */
function updatePickerSubpreview(h, m) {
  const subpreview = document.getElementById('ios-picker-subpreview');
  if (subpreview) {
    const strH = String(h).padStart(2, '0');
    const strM = String(m).padStart(2, '0');
    subpreview.textContent = `${strH} : ${strM}`;
  }
}

/**
 * Lấy giá trị giờ và phút hiện tại từ vị trí cuộn của 2 con lăn
 * @returns {{ hour: number, minute: number, formatted: string }}
 */
function getSelectedWheelTime() {
  const hoursScroller = document.getElementById('ios-wheel-hours-scroller');
  const minutesScroller = document.getElementById('ios-wheel-minutes-scroller');

  let h = 7;
  let m = 0;

  if (hoursScroller) {
    h = Math.max(0, Math.min(23, Math.round(hoursScroller.scrollTop / ITEM_HEIGHT)));
  }
  if (minutesScroller) {
    m = Math.max(0, Math.min(59, Math.round(minutesScroller.scrollTop / ITEM_HEIGHT)));
  }

  const strH = String(h).padStart(2, '0');
  const strM = String(m).padStart(2, '0');
  return { hour: h, minute: m, formatted: `${strH}:${strM}` };
}

/**
 * Mở modal con lăn iOS cho ô Bắt đầu hoặc ô Kết thúc
 * @param {'start' | 'end'} targetType 
 */
export function openIosWheelPicker(targetType = 'start') {
  ensureIosWheelPickerDom();
  pickerState.activeTarget = targetType;

  const pickerModal = document.getElementById(PICKER_MODAL_ID);
  const titleEl = document.getElementById('ios-picker-title');

  const currentVal = targetType === 'start' ? pickerState.startTime : pickerState.endTime;
  const parts = (currentVal || '').split(':').map(s => parseInt(s, 10));
  const h = isNaN(parts[0]) ? (targetType === 'start' ? 7 : 8) : parts[0];
  const m = isNaN(parts[1]) ? (targetType === 'start' ? 0 : 50) : parts[1];

  if (titleEl) {
    titleEl.textContent = targetType === 'start' ? 'Chọn Giờ Bắt Đầu' : 'Chọn Giờ Kết Thúc';
  }

  if (pickerModal) {
    pickerModal.classList.remove('hidden');
    // Cuộn tới vị trí ngay lập tức khi mở
    requestAnimationFrame(() => {
      scrollToTime(h, m, false);
      setTimeout(() => {
        scrollToTime(h, m, true);
      }, 50);
    });
  }
}

/**
 * Đóng modal con lăn iOS
 */
export function closeIosWheelPicker() {
  const pickerModal = document.getElementById(PICKER_MODAL_ID);
  if (pickerModal) {
    pickerModal.classList.add('hidden');
  }
}

/**
 * Gắn các sự kiện cho Modal Con Lăn iOS
 */
function bindIosWheelPickerEvents() {
  if (isPickerEventsBound) return;

  const pickerModal = document.getElementById(PICKER_MODAL_ID);
  const cancelBtn = document.getElementById('btn-ios-picker-cancel');
  const saveBtn = document.getElementById('btn-ios-picker-save');
  const hoursScroller = document.getElementById('ios-wheel-hours-scroller');
  const minutesScroller = document.getElementById('ios-wheel-minutes-scroller');

  if (!pickerModal) return;

  // Hủy
  if (cancelBtn) {
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      closeIosWheelPicker();
    };
  }

  // Đóng khi click backdrop
  pickerModal.addEventListener('click', (e) => {
    if (e.target === pickerModal) {
      closeIosWheelPicker();
    }
  });

  // Lưu giờ đã chọn
  if (saveBtn) {
    saveBtn.onclick = (e) => {
      e.preventDefault();
      const selected = getSelectedWheelTime();
      
      if (pickerState.activeTarget === 'start') {
        pickerState.startTime = selected.formatted;
        const startEl = document.getElementById('display-start-time');
        if (startEl) startEl.textContent = selected.formatted;
      } else {
        pickerState.endTime = selected.formatted;
        const endEl = document.getElementById('display-end-time');
        if (endEl) endEl.textContent = selected.formatted;
      }

      closeIosWheelPicker();
      highlightActivePreset();
    };
  }

  // Lắng nghe sự kiện scroll của 2 con lăn để cập nhật 3D effect
  let hourScrollTimer = null;
  if (hoursScroller) {
    hoursScroller.addEventListener('scroll', () => {
      updateWheel3DEffect(hoursScroller);
      clearTimeout(hourScrollTimer);
      hourScrollTimer = setTimeout(() => {
        const cur = getSelectedWheelTime();
        updatePickerSubpreview(cur.hour, cur.minute);
      }, 50);
    }, { passive: true });
  }

  let minScrollTimer = null;
  if (minutesScroller) {
    minutesScroller.addEventListener('scroll', () => {
      updateWheel3DEffect(minutesScroller);
      clearTimeout(minScrollTimer);
      minScrollTimer = setTimeout(() => {
        const cur = getSelectedWheelTime();
        updatePickerSubpreview(cur.hour, cur.minute);
      }, 50);
    }, { passive: true });
  }

  // Gắn sự kiện click trực tiếp vào item số để tự cuộn tới item đó
  pickerModal.querySelectorAll('.ios-wheel-item').forEach(item => {
    item.addEventListener('click', () => {
      const val = parseInt(item.dataset.val, 10);
      const parentScroller = item.closest('.ios-wheel-scroller');
      if (parentScroller) {
        parentScroller.scrollTo({ top: val * ITEM_HEIGHT, behavior: 'smooth' });
      }
    });
  });

  // Gắn sự kiện cho các pill phím tắt nhanh mốc giờ chuẩn
  pickerModal.querySelectorAll('.ios-quick-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const timeStr = pill.dataset.time || '07:00';
      const parts = timeStr.split(':').map(s => parseInt(s, 10));
      scrollToTime(parts[0], parts[1], true);
    });
  });

  isPickerEventsBound = true;
}

// ============================================================================
// 5. EVENT HANDLERS & DOM BINDING FOR MAIN MODAL
// ============================================================================

/**
 * Gắn các sự kiện cho Modal Thêm Tiết Học
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
  
  const pickStartBtn = document.getElementById('btn-pick-start-time');
  const pickEndBtn = document.getElementById('btn-pick-end-time');

  if (!modal || !form) return;

  // Đóng modal chính
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
      const pickerModal = document.getElementById(PICKER_MODAL_ID);
      if (pickerModal && !pickerModal.classList.contains('hidden')) {
        closeIosWheelPicker();
      } else {
        closeModal();
      }
    }
  });

  // Gắn sự kiện click 2 Capsule Bắt Đầu và Kết Thúc -> Mở iOS Roller Wheel
  if (pickStartBtn) {
    pickStartBtn.onclick = (e) => {
      e.preventDefault();
      openIosWheelPicker('start');
    };
  }
  if (pickEndBtn) {
    pickEndBtn.onclick = (e) => {
      e.preventDefault();
      openIosWheelPicker('end');
    };
  }

  // Gắn sự kiện Lưu Ca Học Mẫu Mới
  if (savePresetBtn) {
    savePresetBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const timeVal = getCurrentTimeRangeString();

      if (!timeVal) {
        showToast('Vui lòng chọn khung giờ học trước!');
        return;
      }

      const customList = getCustomTimePresets();
      const isDuplicate = TIME_PRESETS.some(p => p.time.trim() === timeVal) ||
                          customList.some(p => p.time.trim() === timeVal);
      if (isDuplicate) {
        showToast('Ca học này đã có sẵn trong danh sách mẫu!');
        renderTimePresets(timeVal);
        return;
      }

      const newPreset = {
        time: timeVal,
        period: '',
        label: `Tùy chỉnh: ${timeVal}`
      };

      customList.push(newPreset);
      saveCustomTimePresets(customList);
      renderTimePresets(timeVal);
      showToast(`Đã lưu ca mẫu: ${timeVal} 🎉`);
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
    const roomInput = document.getElementById('class-room-input');

    const dayName = daySelect ? daySelect.value : 'Thứ 2';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const timeRange = getCurrentTimeRangeString();
    const period = getPeriodFromTimeRange(timeRange);
    const room = roomInput ? roomInput.value.trim() : 'Chưa xếp phòng';

    const startTime = pickerState.startTime || (timeRange.split('-')[0] || '').trim();
    const endTime = pickerState.endTime || (timeRange.split('-')[1] || '').trim();

    if (!subject || !timeRange) {
      showToast('Vui lòng nhập tên môn và khung giờ học!');
      return;
    }

    const classData = {
      subject,
      timeRange,
      period,
      room,
      startTime,
      endTime
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
// 6. PUBLIC CONTROLLER / EXPORTS
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
  syncTimeInputsFromRange('07:00 - 08:50');
  renderTimePresets('07:00 - 08:50');
  renderRoomPresets('B1-305 (CS1)');

  // Reset form inputs
  const subjectInput = document.getElementById('class-subject-input');
  const roomInput = document.getElementById('class-room-input');
  if (subjectInput) subjectInput.value = '';
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
  syncTimeInputsFromRange(classData.timeRange || '07:00 - 08:50');
  renderTimePresets(classData.timeRange || '');
  renderRoomPresets(classData.room || '');

  // Fill values
  const subjectInput = document.getElementById('class-subject-input');
  const roomInput = document.getElementById('class-room-input');
  if (subjectInput) subjectInput.value = classData.subject || '';
  if (roomInput) roomInput.value = classData.room || '';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
