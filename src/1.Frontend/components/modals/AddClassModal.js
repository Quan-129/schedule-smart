/**
 * @file AddClassModal.js
 * @description Component Modal Thêm / Chỉnh Sửa Tiết Học Nhanh vào từng Ngày trên Lịch Học
 *              Tích hợp cơ chế chọn giờ Con Lăn 3D chuẩn Báo Thức iPhone (iOS Alarm Drum Roller Wheel),
 *              Bộ Chọn Logo/Icon Môn Học (~120 Icon Tiêu Biểu Theo Ngành),
 *              và Tự Động Đồng Bộ Link Google Drive từ Chiếc Cặp & Lưu Môn Mới vào Chiếc Cặp
 * @module 1.Frontend/components/modals/AddClassModal
 */

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { formatSafeUrl } from '../../../4.Security/urlValidator.js';
import { state, persistDriveSubjects } from '../../../3.Database/state.js';
import { showToast } from '../Toast.js';

// ============================================================================
// 2. CONSTANTS, ICON LIBRARY & STATE
// ============================================================================
const MODAL_ID = 'add-class-modal';
const PICKER_MODAL_ID = 'ios-wheel-picker-modal';
const ICON_PICKER_MODAL_ID = 'subject-icon-picker-modal';
const ITEM_HEIGHT = 44; // Chiều cao mỗi nấc con lăn (chuẩn iOS)

let currentEditingClass = null; // { dayName, classIndex, classData }
let onSaveCallback = null;
let onDeleteCallback = null;
let isEventsBound = false;
let isPickerEventsBound = false;
let isIconPickerEventsBound = false;

// Trạng thái modal
const pickerState = {
  startTime: '07:00',
  endTime: '08:50',
  activeTarget: 'start', // 'start' | 'end'
  selectedIcon: 'fa-solid fa-book',
  activeIconCategory: 'all'
};

/**
 * Danh sách ~120 Icons tiêu biểu chia theo 5 nhóm ngành học & đời sống sinh viên
 */
export const POPULAR_SUBJECT_ICONS = [
  // 🤖 1. Công nghệ, Lập trình & CNTT (24 icons)
  { icon: 'fa-solid fa-robot', label: 'Robot / AI', category: 'tech' },
  { icon: 'fa-solid fa-code', label: 'Code / Lập trình', category: 'tech' },
  { icon: 'fa-solid fa-laptop-code', label: 'Laptop Code', category: 'tech' },
  { icon: 'fa-solid fa-terminal', label: 'Terminal / CLI', category: 'tech' },
  { icon: 'fa-solid fa-microchip', label: 'Vi mạch / Phần cứng', category: 'tech' },
  { icon: 'fa-solid fa-brain', label: 'Trí tuệ / Trí não', category: 'tech' },
  { icon: 'fa-solid fa-database', label: 'Cơ sở dữ liệu', category: 'tech' },
  { icon: 'fa-solid fa-server', label: 'Server / Máy chủ', category: 'tech' },
  { icon: 'fa-solid fa-network-wired', label: 'Mạng máy tính', category: 'tech' },
  { icon: 'fa-solid fa-cloud', label: 'Điện toán đám mây', category: 'tech' },
  { icon: 'fa-solid fa-shield-halved', label: 'An ninh mạng / Security', category: 'tech' },
  { icon: 'fa-solid fa-bug', label: 'Kiểm thử / Debug', category: 'tech' },
  { icon: 'fa-solid fa-mobile-screen', label: 'App di động', category: 'tech' },
  { icon: 'fa-solid fa-globe', label: 'Web / Internet', category: 'tech' },
  { icon: 'fa-solid fa-wifi', label: 'IoT / Không dây', category: 'tech' },
  { icon: 'fa-solid fa-satellite-dish', label: 'Viễn thông', category: 'tech' },
  { icon: 'fa-solid fa-gamepad', label: 'Lập trình Game', category: 'tech' },
  { icon: 'fa-solid fa-vr-cardboard', label: 'VR / Thực tế ảo', category: 'tech' },
  { icon: 'fa-solid fa-gears', label: 'Hệ thống / Kỹ thuật', category: 'tech' },
  { icon: 'fa-solid fa-file-code', label: 'Mã nguồn / Script', category: 'tech' },
  { icon: 'fa-solid fa-sitemap', label: 'Cấu trúc giải thuật', category: 'tech' },
  { icon: 'fa-solid fa-cubes', label: 'Kiến trúc Module', category: 'tech' },
  { icon: 'fa-solid fa-key', label: 'Mật mã học / Crypto', category: 'tech' },
  { icon: 'fa-solid fa-tower-broadcast', label: 'Truyền thông phát thanh', category: 'tech' },

  // 📐 2. Khoa học Tự nhiên, Toán & Kỹ thuật (24 icons)
  { icon: 'fa-solid fa-atom', label: 'Vật lý nguyên tử', category: 'science' },
  { icon: 'fa-solid fa-flask', label: 'Hóa học / Thí nghiệm', category: 'science' },
  { icon: 'fa-solid fa-dna', label: 'Sinh học / Di truyền', category: 'science' },
  { icon: 'fa-solid fa-calculator', label: 'Toán cao cấp', category: 'science' },
  { icon: 'fa-solid fa-square-root-variable', label: 'Giải tích / Đại số', category: 'science' },
  { icon: 'fa-solid fa-magnet', label: 'Điện từ trường', category: 'science' },
  { icon: 'fa-solid fa-bolt', label: 'Kỹ thuật Điện', category: 'science' },
  { icon: 'fa-solid fa-compass-drafting', label: 'Vẽ kỹ thuật / CAD', category: 'science' },
  { icon: 'fa-solid fa-microscope', label: 'Kính hiển vi / Nghiên cứu', category: 'science' },
  { icon: 'fa-solid fa-lightbulb', label: 'Sáng tạo / Ý tưởng', category: 'science' },
  { icon: 'fa-solid fa-rocket', label: 'Hàng không vũ trụ', category: 'science' },
  { icon: 'fa-solid fa-satellite', label: 'Vệ tinh nhân tạo', category: 'science' },
  { icon: 'fa-solid fa-chart-area', label: 'Xác suất thống kê', category: 'science' },
  { icon: 'fa-solid fa-wave-square', label: 'Tín hiệu & Hệ thống', category: 'science' },
  { icon: 'fa-solid fa-vial', label: 'Hóa nghiệm sinh', category: 'science' },
  { icon: 'fa-solid fa-temperature-high', label: 'Nhiệt động lực học', category: 'science' },
  { icon: 'fa-solid fa-bridge', label: 'Kỹ thuật Xây dựng', category: 'science' },
  { icon: 'fa-solid fa-car', label: 'Kỹ thuật Ô tô', category: 'science' },
  { icon: 'fa-solid fa-oil-well', label: 'Dầu khí / Mỏ', category: 'science' },
  { icon: 'fa-solid fa-water', label: 'Thủy lực / Thủy văn', category: 'science' },
  { icon: 'fa-solid fa-ruler-combined', label: 'Đo lường / Trắc địa', category: 'science' },
  { icon: 'fa-solid fa-screwdriver-wrench', label: 'Cơ khí chế tạo', category: 'science' },
  { icon: 'fa-solid fa-circle-nodes', label: 'Lý thuyết đồ thị', category: 'science' },
  { icon: 'fa-solid fa-shapes', label: 'Hình học không gian', category: 'science' },

  // 🏛️ 3. Kinh tế, Quản trị, Xã hội & Luật (24 icons)
  { icon: 'fa-solid fa-chart-line', label: 'Kinh tế học / Chứng khoán', category: 'business' },
  { icon: 'fa-solid fa-chart-pie', label: 'Phân tích số liệu', category: 'business' },
  { icon: 'fa-solid fa-diagram-project', label: 'Quản lý dự án', category: 'business' },
  { icon: 'fa-solid fa-scale-balanced', label: 'Pháp luật / Công lý', category: 'business' },
  { icon: 'fa-solid fa-building-columns', label: 'Tài chính Ngân hàng', category: 'business' },
  { icon: 'fa-solid fa-coins', label: 'Tiền tệ / Kế toán', category: 'business' },
  { icon: 'fa-solid fa-handshake', label: 'Đàm phán thương mại', category: 'business' },
  { icon: 'fa-solid fa-gavel', label: 'Luật học / Tố tụng', category: 'business' },
  { icon: 'fa-solid fa-landmark', label: 'Chính trị / Lịch sử', category: 'business' },
  { icon: 'fa-solid fa-briefcase', label: 'Quản trị kinh doanh', category: 'business' },
  { icon: 'fa-solid fa-bullhorn', label: 'Marketing / Quảng cáo', category: 'business' },
  { icon: 'fa-solid fa-users', label: 'Nhân sự / Teamwork', category: 'business' },
  { icon: 'fa-solid fa-user-tie', label: 'Lãnh đạo / Khởi nghiệp', category: 'business' },
  { icon: 'fa-solid fa-money-bill-trend-up', label: 'Đầu tư phát triển', category: 'business' },
  { icon: 'fa-solid fa-shop', label: 'Thương mại điện tử', category: 'business' },
  { icon: 'fa-solid fa-truck-fast', label: 'Logistics / Kho vận', category: 'business' },
  { icon: 'fa-solid fa-passport', label: 'Quan hệ quốc tế', category: 'business' },
  { icon: 'fa-solid fa-newspaper', label: 'Báo chí truyền thông', category: 'business' },
  { icon: 'fa-solid fa-book-journal-whills', label: 'Triết học Mác - Lênin', category: 'business' },
  { icon: 'fa-solid fa-monument', label: 'Tư tưởng Hồ Chí Minh', category: 'business' },
  { icon: 'fa-solid fa-hand-holding-dollar', label: 'Thuế & Kiểm toán', category: 'business' },
  { icon: 'fa-solid fa-boxes-stacked', label: 'Quản lý chuỗi cung ứng', category: 'business' },
  { icon: 'fa-solid fa-clipboard-check', label: 'Quản lý chất lượng', category: 'business' },
  { icon: 'fa-solid fa-ranking-star', label: 'Thương hiệu / Brand', category: 'business' },

  // 🎨 4. Ngoại ngữ, Văn học & Nghệ thuật (24 icons)
  { icon: 'fa-solid fa-language', label: 'Ngoại ngữ / Dịch thuật', category: 'arts' },
  { icon: 'fa-solid fa-earth-asia', label: 'Tiếng Nhật / Tiếng Hàn', category: 'arts' },
  { icon: 'fa-solid fa-torii-gate', label: 'Tiếng Nhật / Văn hóa', category: 'arts' },
  { icon: 'fa-solid fa-book-open', label: 'Đọc hiểu / Giáo trình', category: 'arts' },
  { icon: 'fa-solid fa-book-bookmark', label: 'Tài liệu học tập', category: 'arts' },
  { icon: 'fa-solid fa-palette', label: 'Mỹ thuật / Hội họa', category: 'arts' },
  { icon: 'fa-solid fa-paintbrush', label: 'Thiết kế mỹ thuật', category: 'arts' },
  { icon: 'fa-solid fa-music', label: 'Âm nhạc / Nghệ thuật', category: 'arts' },
  { icon: 'fa-solid fa-camera', label: 'Nhiếp ảnh', category: 'arts' },
  { icon: 'fa-solid fa-film', label: 'Điện ảnh / Video', category: 'arts' },
  { icon: 'fa-solid fa-pen-nib', label: 'Sáng tác / Viết văn', category: 'arts' },
  { icon: 'fa-solid fa-feather-pointed', label: 'Văn học cổ điển', category: 'arts' },
  { icon: 'fa-solid fa-spell-check', label: 'Ngữ pháp / Chính tả', category: 'arts' },
  { icon: 'fa-solid fa-font', label: 'Typography / Chữ viết', category: 'arts' },
  { icon: 'fa-solid fa-microphone', label: 'Thuyết trình / Hùng biện', category: 'arts' },
  { icon: 'fa-solid fa-headphones', label: 'Luyện nghe ngoại ngữ', category: 'arts' },
  { icon: 'fa-solid fa-masks-theater', label: 'Kịch nghệ / Sân khấu', category: 'arts' },
  { icon: 'fa-solid fa-icons', label: 'Biểu tượng / Ký hiệu', category: 'arts' },
  { icon: 'fa-solid fa-scroll', label: 'Lịch sử / Cổ thư', category: 'arts' },
  { icon: 'fa-solid fa-quote-left', label: 'Trích dẫn văn chương', category: 'arts' },
  { icon: 'fa-solid fa-signature', label: 'Chữ ký / Bút tích', category: 'arts' },
  { icon: 'fa-solid fa-vector-square', label: 'Thiết kế đồ họa vector', category: 'arts' },
  { icon: 'fa-solid fa-image', label: 'Hình ảnh truyền thông', category: 'arts' },
  { icon: 'fa-solid fa-earth-americas', label: 'Tiếng Anh quốc tế', category: 'arts' },

  // ⭐ 5. Kỹ năng, Thể chất & Đời sống Sinh viên (24 icons)
  { icon: 'fa-solid fa-graduation-cap', label: 'Tốt nghiệp / Đại học', category: 'life' },
  { icon: 'fa-solid fa-trophy', label: 'Thành tích / Giải thưởng', category: 'life' },
  { icon: 'fa-solid fa-medal', label: 'Huy chương / Thi đua', category: 'life' },
  { icon: 'fa-solid fa-crown', label: 'Xuất sắc / Thủ khoa', category: 'life' },
  { icon: 'fa-solid fa-award', label: 'Chứng chỉ / Bằng cấp', category: 'life' },
  { icon: 'fa-solid fa-star', label: 'Ngôi sao / Yêu thích', category: 'life' },
  { icon: 'fa-solid fa-heart-pulse', label: 'Y tế / Sức khỏe', category: 'life' },
  { icon: 'fa-solid fa-dumbbell', label: 'Thể dục / Thể thao', category: 'life' },
  { icon: 'fa-solid fa-person-running', label: 'Điền kinh / Chạy bộ', category: 'life' },
  { icon: 'fa-solid fa-futbol', label: 'Bóng đá', category: 'life' },
  { icon: 'fa-solid fa-basketball', label: 'Bóng rổ', category: 'life' },
  { icon: 'fa-solid fa-volleyball', label: 'Bóng chuyền', category: 'life' },
  { icon: 'fa-solid fa-person-swimming', label: 'Bơi lội', category: 'life' },
  { icon: 'fa-solid fa-mug-hot', label: 'Cà phê / Học đêm', category: 'life' },
  { icon: 'fa-solid fa-fire', label: 'Nhiệt huyết / Deadline', category: 'life' },
  { icon: 'fa-solid fa-flag', label: 'Hoạt động Đoàn - Hội', category: 'life' },
  { icon: 'fa-solid fa-hand-holding-heart', label: 'Tình nguyện / Mùa hè xanh', category: 'life' },
  { icon: 'fa-solid fa-tree', label: 'Môi trường / Sinh thái', category: 'life' },
  { icon: 'fa-solid fa-seedling', label: 'Phát triển bản thân', category: 'life' },
  { icon: 'fa-solid fa-compass', label: 'Định hướng tương lai', category: 'life' },
  { icon: 'fa-solid fa-map-location-dot', label: 'Dã ngoại / Thực tập', category: 'life' },
  { icon: 'fa-solid fa-calendar-check', label: 'Lập kế hoạch học tập', category: 'life' },
  { icon: 'fa-solid fa-clock', label: 'Quản lý thời gian', category: 'life' },
  { icon: 'fa-solid fa-gem', label: 'Kỹ năng vàng', category: 'life' }
];

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
            <span id="add-class-modal-subtitle" class="modal-subj-sub">Chọn môn từ Chiếc Cặp, gắn logo và ca học</span>
          </div>
        </div>
        <button type="button" id="btn-close-add-class" class="btn-modal-close" title="Đóng (ESC)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="add-class-form" class="modal-form" style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 550px;">
        
        <!-- SECTION 1: MÔN HỌC & CHỌN LOGO ICON -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="class-subject-input"><i class="fa-solid fa-graduation-cap"></i> Tên môn học & Logo: <span class="required-star">*</span></label>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Gợi ý từ Chiếc Cặp:</span>
          </div>
          <div class="subject-chips-picker" id="subject-chips-picker">
            <!-- Render danh sách chip môn học -->
          </div>
          
          <div class="subject-input-with-icon-picker" style="display: flex; gap: 0.5rem; align-items: center;">
            <!-- Nút Mở Bộ Chọn Logo / Icon Môn Học -->
            <button type="button" id="btn-open-icon-picker" class="btn-subject-icon-trigger" title="Bấm để đổi Logo / Icon đại diện môn học (~120 icons tiêu biểu)">
              <div class="subject-icon-preview-box">
                <i id="display-subject-icon" class="fa-solid fa-book"></i>
              </div>
              <span class="icon-picker-badge-caret"><i class="fa-solid fa-caret-down"></i></span>
            </button>

            <!-- Ô Nhập Tên Môn Học -->
            <div class="input-with-icon" style="flex: 1;">
              <i class="fa-solid fa-book-open input-icon"></i>
              <input type="text" id="class-subject-input" class="form-input-styled" placeholder="Nhập tên môn học (VD: Học máy, Tiếng Nhật 7...)" required autocomplete="off">
            </div>
          </div>
        </div>

        <!-- SECTION 1B: LINK GOOGLE DRIVE / TÀI LIỆU -->
        <div class="form-group-styled">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="class-drive-url-input"><i class="fa-brands fa-google-drive"></i> Link Google Drive / Thư mục:</label>
            <span id="drive-sync-badge" class="drive-sync-status-badge hidden">
              <i class="fa-solid fa-link"></i> Đã lấy từ Chiếc Cặp
            </span>
          </div>
          <div class="input-row-preset-creator" style="display: flex; gap: 0.45rem; align-items: stretch;">
            <div class="input-with-icon" style="flex: 1;">
              <i class="fa-solid fa-link input-icon" style="color: #818cf8;"></i>
              <input type="url" id="class-drive-url-input" class="form-input-styled" placeholder="https://drive.google.com/drive/folders/... (Tùy chọn)" autocomplete="off">
            </div>
            <a id="btn-open-drive-preview" href="#" target="_blank" rel="noopener noreferrer" class="btn-open-drive-preview hidden" title="Mở thư mục Drive này trong tab mới">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Mở Drive</span>
            </a>
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
  ensureSubjectIconPickerDom();
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
      <!-- HEADER CHUẨN iPHONE BÁO THỨC TONE TÍM THAN -->
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
 * Đảm bảo Modal Chọn Logo Icon (~120 Icon Tiêu Biểu) đã tồn tại trong DOM
 */
function ensureSubjectIconPickerDom() {
  if (document.getElementById(ICON_PICKER_MODAL_ID)) return;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const iconPickerWrapper = document.createElement('div');
  iconPickerWrapper.id = ICON_PICKER_MODAL_ID;
  iconPickerWrapper.className = 'icon-picker-backdrop hidden';
  iconPickerWrapper.innerHTML = `
    <div class="icon-picker-sheet" role="dialog" aria-modal="true">
      <!-- HEADER -->
      <div class="icon-picker-header">
        <div class="icon-picker-title-group">
          <div class="icon-preview-current-badge">
            <i id="icon-picker-active-badge-icon" class="fa-solid fa-book"></i>
          </div>
          <div>
            <h4 class="icon-picker-title">Chọn Logo Môn Học</h4>
            <span class="icon-picker-subtitle">~120 biểu tượng tiêu biểu theo ngành</span>
          </div>
        </div>
        <button type="button" id="btn-close-icon-picker" class="btn-modal-close" title="Đóng">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- SEARCH BAR -->
      <div class="icon-picker-search-wrap">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="icon-picker-search-input" placeholder="Tìm nhanh icon (VD: robot, code, toán, book, star...)" autocomplete="off">
      </div>

      <!-- CATEGORY TABS -->
      <div class="icon-picker-tabs-row" id="icon-picker-tabs-row">
        <button type="button" class="icon-tab-btn active" data-cat="all">Tất cả (120)</button>
        <button type="button" class="icon-tab-btn" data-cat="tech">🤖 CNTT & AI</button>
        <button type="button" class="icon-tab-btn" data-cat="science">📐 Kỹ thuật</button>
        <button type="button" class="icon-tab-btn" data-cat="business">🏛️ Kinh tế</button>
        <button type="button" class="icon-tab-btn" data-cat="arts">🎨 Ngoại ngữ</button>
        <button type="button" class="icon-tab-btn" data-cat="life">⭐ Kỹ năng</button>
      </div>

      <!-- ICON GRID -->
      <div class="icon-picker-grid-container" id="icon-picker-grid-container">
        <!-- Render động 120 icons -->
      </div>

      <!-- FOOTER -->
      <div class="icon-picker-footer">
        <span class="icon-picker-hint">💡 Bấm vào biểu tượng để áp dụng ngay</span>
        <button type="button" id="btn-confirm-icon-picker" class="btn-primary-gradient" style="padding: 0.45rem 1.1rem; font-size: 0.85rem;">
          <i class="fa-solid fa-check"></i> Xong
        </button>
      </div>
    </div>
  `;

  modalRoot.appendChild(iconPickerWrapper);
  renderIconPickerGrid();
  bindSubjectIconPickerEvents();
}

/**
 * Render lưới các icon trong Icon Picker Modal theo từ khóa và danh mục
 * @param {string} query 
 * @param {string} category 
 */
function renderIconPickerGrid(query = '', category = 'all') {
  const container = document.getElementById('icon-picker-grid-container');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();
  const filtered = POPULAR_SUBJECT_ICONS.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const matchQuery = !q || item.icon.toLowerCase().includes(q) || item.label.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <i class="fa-solid fa-face-meh" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block; opacity: 0.6;"></i>
        Không tìm thấy icon nào khớp với "${escapeHtml(q)}"
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isSelected = item.icon === pickerState.selectedIcon;
    return `
      <button type="button" class="icon-grid-item ${isSelected ? 'active' : ''}" data-icon="${escapeHtml(item.icon)}" title="${escapeHtml(item.label)}">
        <i class="${item.icon}"></i>
        <span class="icon-item-label">${escapeHtml(item.label)}</span>
      </button>
    `;
  }).join('');

  // Gắn sự kiện click icon -> Chọn ngay
  container.querySelectorAll('.icon-grid-item').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.icon-grid-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const iconClass = btn.dataset.icon;
      setSelectedSubjectIcon(iconClass);
      closeSubjectIconPicker();
    };
  });
}

/**
 * Cập nhật icon môn học đang chọn lên nút trigger và badge
 * @param {string} iconClass 
 */
function setSelectedSubjectIcon(iconClass = 'fa-solid fa-book') {
  pickerState.selectedIcon = iconClass || 'fa-solid fa-book';
  
  const displayIcon = document.getElementById('display-subject-icon');
  const badgeIcon = document.getElementById('icon-picker-active-badge-icon');
  
  if (displayIcon) {
    displayIcon.className = pickerState.selectedIcon;
  }
  if (badgeIcon) {
    badgeIcon.className = pickerState.selectedIcon;
  }
}

/**
 * Mở modal chọn Logo Icon
 */
export function openSubjectIconPicker() {
  ensureSubjectIconPickerDom();
  const modal = document.getElementById(ICON_PICKER_MODAL_ID);
  if (!modal) return;

  renderIconPickerGrid('', pickerState.activeIconCategory || 'all');
  setSelectedSubjectIcon(pickerState.selectedIcon);

  modal.classList.remove('hidden');
  const searchInput = document.getElementById('icon-picker-search-input');
  if (searchInput) {
    searchInput.value = '';
    setTimeout(() => searchInput.focus(), 80);
  }
}

/**
 * Đóng modal chọn Logo Icon
 */
export function closeSubjectIconPicker() {
  const modal = document.getElementById(ICON_PICKER_MODAL_ID);
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Gắn các sự kiện cho Modal Chọn Icon
 */
function bindSubjectIconPickerEvents() {
  if (isIconPickerEventsBound) return;
  const modal = document.getElementById(ICON_PICKER_MODAL_ID);
  const closeBtn = document.getElementById('btn-close-icon-picker');
  const confirmBtn = document.getElementById('btn-confirm-icon-picker');
  const searchInput = document.getElementById('icon-picker-search-input');
  const tabsRow = document.getElementById('icon-picker-tabs-row');

  if (!modal) return;

  if (closeBtn) closeBtn.onclick = closeSubjectIconPicker;
  if (confirmBtn) confirmBtn.onclick = closeSubjectIconPicker;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSubjectIconPicker();
  });

  // Tìm kiếm icon theo từ khóa
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      renderIconPickerGrid(q, pickerState.activeIconCategory || 'all');
    });
  }

  // Chuyển tab danh mục
  if (tabsRow) {
    tabsRow.querySelectorAll('.icon-tab-btn').forEach(tabBtn => {
      tabBtn.onclick = () => {
        tabsRow.querySelectorAll('.icon-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        pickerState.activeIconCategory = tabBtn.dataset.cat || 'all';
        const q = searchInput ? searchInput.value.trim() : '';
        renderIconPickerGrid(q, pickerState.activeIconCategory);
      };
    });
  }

  isIconPickerEventsBound = true;
}

/**
 * Cập nhật giao diện ô nhập link Google Drive, badge và nút xem trước
 * @param {string} url 
 * @param {boolean} fromBackpack 
 */
function updateDriveUrlUi(url = '', fromBackpack = false) {
  const driveInput = document.getElementById('class-drive-url-input');
  const syncBadge = document.getElementById('drive-sync-badge');
  const previewBtn = document.getElementById('btn-open-drive-preview');

  if (driveInput && driveInput.value !== url) {
    driveInput.value = url || '';
  }

  const safe = url ? formatSafeUrl(url) : '';
  if (syncBadge) {
    syncBadge.classList.toggle('hidden', !(fromBackpack && safe));
  }
  if (previewBtn) {
    if (safe && (safe.startsWith('http://') || safe.startsWith('https://'))) {
      previewBtn.href = safe;
      previewBtn.classList.remove('hidden');
    } else {
      previewBtn.classList.add('hidden');
    }
  }
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
        data-icon="${escapeHtml(s.icon || 'fa-solid fa-book')}"
        data-code="${escapeHtml(s.code)}">
        <i class="${s.icon || 'fa-solid fa-book'}"></i>
        <span>${escapeHtml(s.name)}</span>
      </button>
    `;
  }).join('');

  // Gắn sự kiện click chip -> Tự động nạp tên, Icon logo và link Drive từ Chiếc Cặp
  container.querySelectorAll('.subject-chip-btn').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.subject-chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const nameInput = document.getElementById('class-subject-input');
      const sName = btn.dataset.name;
      const sIcon = btn.dataset.icon || 'fa-solid fa-book';

      if (nameInput) {
        nameInput.value = sName;
        nameInput.focus();
      }

      // Tự động nạp Icon logo của môn
      setSelectedSubjectIcon(sIcon);

      // Tự động tìm và điền link Drive của môn này từ Chiếc Cặp
      const matched = (state.driveSubjects || []).find(s => s.name.toLowerCase() === sName.toLowerCase());
      if (matched && matched.driveUrl) {
        updateDriveUrlUi(matched.driveUrl, true);
      } else {
        updateDriveUrlUi('', false);
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
  const iconTriggerBtn = document.getElementById('btn-open-icon-picker');
  const subjectInput = document.getElementById('class-subject-input');
  const driveInput = document.getElementById('class-drive-url-input');

  if (!modal || !form) return;

  // Đóng modal chính
  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentEditingClass = null;
    form.reset();
    updateDriveUrlUi('', false);
    setSelectedSubjectIcon('fa-solid fa-book');
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      const iconPickerModal = document.getElementById(ICON_PICKER_MODAL_ID);
      const wheelModal = document.getElementById(PICKER_MODAL_ID);

      if (iconPickerModal && !iconPickerModal.classList.contains('hidden')) {
        closeSubjectIconPicker();
      } else if (wheelModal && !wheelModal.classList.contains('hidden')) {
        closeIosWheelPicker();
      } else {
        closeModal();
      }
    }
  });

  // Mở bộ chọn Logo Icon Môn Học
  if (iconTriggerBtn) {
    iconTriggerBtn.onclick = (e) => {
      e.preventDefault();
      openSubjectIconPicker();
    };
  }

  // Tự động nhận diện môn có sẵn trong Chiếc Cặp khi gõ tên môn
  if (subjectInput) {
    subjectInput.addEventListener('input', () => {
      const val = subjectInput.value.trim();
      const matched = (state.driveSubjects || []).find(s => s.name.toLowerCase() === val.toLowerCase());
      if (matched) {
        if (matched.icon) setSelectedSubjectIcon(matched.icon);
        if (matched.driveUrl) updateDriveUrlUi(matched.driveUrl, true);
      } else {
        const syncBadge = document.getElementById('drive-sync-badge');
        if (syncBadge) syncBadge.classList.add('hidden');
      }
    });
  }

  // Cập nhật nút xem trước Drive khi người dùng tự nhập link
  if (driveInput) {
    driveInput.addEventListener('input', () => {
      const val = driveInput.value.trim();
      updateDriveUrlUi(val, false);
    });
  }

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

  // Submit Form Lưu Tiết Học & Tự Động Đồng Bộ Vào Chiếc Cặp
  form.onsubmit = (e) => {
    e.preventDefault();
    const daySelect = document.getElementById('class-day-select');
    const roomInput = document.getElementById('class-room-input');
    const driveUrlInput = document.getElementById('class-drive-url-input');

    const dayName = daySelect ? daySelect.value : 'Thứ 2';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const timeRange = getCurrentTimeRangeString();
    const period = getPeriodFromTimeRange(timeRange);
    const room = roomInput ? roomInput.value.trim() : 'Chưa xếp phòng';
    const icon = pickerState.selectedIcon || 'fa-solid fa-book';
    
    const rawDriveUrl = driveUrlInput ? driveUrlInput.value.trim() : '';
    const safeDriveUrl = rawDriveUrl ? formatSafeUrl(rawDriveUrl) : '';

    const startTime = pickerState.startTime || (timeRange.split('-')[0] || '').trim();
    const endTime = pickerState.endTime || (timeRange.split('-')[1] || '').trim();

    if (!subject || !timeRange) {
      showToast('Vui lòng nhập tên môn và khung giờ học!');
      return;
    }

    // ========================================================================
    // TỰ ĐỘNG LƯU / ĐỒNG BỘ MÔN HỌC & ICON VÀO CHIẾC CẶP GOOGLE DRIVE
    // ========================================================================
    const subjectTrim = subject.trim();
    let subjectInBackpack = (state.driveSubjects || []).find(s => s.name.toLowerCase() === subjectTrim.toLowerCase());

    if (!subjectInBackpack) {
      // Tự động tạo môn mới trong Chiếc Cặp kèm Icon logo đã chọn
      const cleanCode = subjectTrim.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10) || 'MON-HOC';
      const newSubject = {
        name: subjectTrim,
        code: cleanCode,
        credits: 3,
        color: '#6366f1',
        icon: icon,
        driveUrl: safeDriveUrl,
        notes: `Được tạo tự động khi thêm tiết học vào lịch (${dayName})`,
        components: [
          { name: 'Quá trình', weight: 50, score: null },
          { name: 'Cuối kỳ', weight: 50, score: null }
        ]
      };
      state.driveSubjects.push(newSubject);
      persistDriveSubjects();
      renderSubjectChips(subjectTrim);
      if (typeof window.renderBackpackView === 'function') {
        window.renderBackpackView();
      }
    } else {
      // Nếu môn đã có: Cập nhật link Drive & Icon nếu có thay đổi
      let updated = false;
      if (!subjectInBackpack.driveUrl && safeDriveUrl) {
        subjectInBackpack.driveUrl = safeDriveUrl;
        updated = true;
      }
      if (icon && icon !== 'fa-solid fa-book' && subjectInBackpack.icon !== icon) {
        subjectInBackpack.icon = icon;
        updated = true;
      }
      if (updated) {
        persistDriveSubjects();
        if (typeof window.renderBackpackView === 'function') {
          window.renderBackpackView();
        }
      }
    }

    const classData = {
      subject: subjectTrim,
      timeRange,
      period,
      room,
      startTime,
      endTime,
      driveUrl: safeDriveUrl,
      icon
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
    showToast(`Đã lưu tiết "${subjectTrim}" vào ${dayName} 🎉`);
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
  if (subEl) subEl.textContent = 'Chọn môn từ Chiếc Cặp, gắn logo và ca học';
  if (daySelect) daySelect.value = targetDayName;
  if (deleteBtn) deleteBtn.style.display = 'none';
  if (saveText) saveText.textContent = 'Thêm Tiết Học';

  // Render chips, time presets & room presets
  renderSubjectChips('');
  syncTimeInputsFromRange('07:00 - 08:50');
  renderTimePresets('07:00 - 08:50');
  renderRoomPresets('B1-305 (CS1)');

  // Reset form inputs, icon & drive preview
  const subjectInput = document.getElementById('class-subject-input');
  const roomInput = document.getElementById('class-room-input');
  if (subjectInput) subjectInput.value = '';
  if (roomInput) roomInput.value = 'B1-305 (CS1)';
  
  setSelectedSubjectIcon('fa-solid fa-book');
  updateDriveUrlUi('', false);

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

  // Nạp Icon của môn
  const matched = (state.driveSubjects || []).find(s => s.name.toLowerCase() === (classData.subject || '').toLowerCase());
  const iconToUse = classData.icon || (matched ? matched.icon : 'fa-solid fa-book');
  setSelectedSubjectIcon(iconToUse);

  // Nạp link Drive từ tiết học hoặc từ Chiếc Cặp
  const urlToUse = classData.driveUrl || (matched ? matched.driveUrl : '');
  updateDriveUrlUi(urlToUse, Boolean(matched && matched.driveUrl && matched.driveUrl === urlToUse));

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
