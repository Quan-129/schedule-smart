/**
 * ==========================================================================
 * BACKEND UTILS - DATE & PERIOD HELPERS
 * Tiện ích xử lý ngày tháng, thứ trong tuần và khung giờ tiết học
 * ==========================================================================
 */

/**
 * Chuyển đổi tên thứ (Thứ 2, Thứ 3...) thành số thứ tự (0 = Chủ Nhật, 1 = Thứ Hai...)
 * @param {string} dayName 
 * @returns {number}
 */
export function getDayNumber(dayName) {
  if (!dayName) return -1;
  const normalized = dayName.toLowerCase().trim();
  if (normalized === 'chủ nhật' || (normalized.includes('chủ nhật') && !normalized.includes('thứ 7'))) return 0;
  if (normalized.includes('thứ 2')) return 1;
  if (normalized.includes('thứ 3')) return 2;
  if (normalized.includes('thứ 4')) return 3;
  if (normalized.includes('thứ 5')) return 4;
  if (normalized.includes('thứ 6')) return 5;
  if (normalized.includes('thứ 7')) return 6;
  if (normalized.includes('chủ nhật')) return 0;
  return -1;
}

/**
 * Lấy ngày Thứ Hai của tuần hiện tại chứa ngày hôm nay (YYYY-MM-DD)
 * @returns {string}
 */
export function getMondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = now.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Định dạng ngày dạng DD-MM-YYYY (VD: 07-09-2026)
 * @param {Date|string} dateInput 
 * @returns {string}
 */
export function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return '';
  let date = dateInput;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      date = new Date(dateInput);
    }
  }
  if (isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/**
 * Định dạng ngày dạng DD-MM (VD: 07-09)
 * @param {Date|string} dateInput 
 * @returns {string}
 */
export function formatDateDDMM(dateInput) {
  if (!dateInput) return '';
  let date = dateInput;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      date = new Date(dateInput);
    }
  }
  if (isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}-${m}`;
}

/**
 * Cộng/trừ số ngày vào chuỗi ngày YYYY-MM-DD
 * @param {string} dateStr - Định dạng YYYY-MM-DD
 * @param {number} daysCount - Số ngày cần cộng (+) hoặc trừ (-)
 * @returns {string} Chuỗi YYYY-MM-DD mới
 */
export function addDaysToDateStr(dateStr, daysCount) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + daysCount);
  const resY = date.getFullYear();
  const resM = String(date.getMonth() + 1).padStart(2, '0');
  const resD = String(date.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * Lấy thông tin ngày cụ thể cho từng thứ trong tuần dựa trên ngày bắt đầu Thứ Hai
 * @param {string} startDateStr - Ngày bắt đầu tuần (Thứ Hai, YYYY-MM-DD)
 * @param {number} dayOfWeekNumber - 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7
 * @returns {{ raw: string, full: string, short: string, day: number, month: number, year: number }|null}
 */
export function getDateForDayOfWeek(startDateStr, dayOfWeekNumber) {
  if (!startDateStr) return null;
  let offset = 0;
  if (dayOfWeekNumber === 0) offset = 6; // Chủ Nhật
  else if (dayOfWeekNumber >= 1 && dayOfWeekNumber <= 6) offset = dayOfWeekNumber - 1;
  else return null;

  const targetDateStr = addDaysToDateStr(startDateStr, offset);
  if (!targetDateStr) return null;
  const parts = targetDateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return {
    raw: targetDateStr,
    full: formatDateDDMMYYYY(date),
    short: formatDateDDMM(date),
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
}

/**
 * Định dạng ngày giờ hiện tại dạng văn bản tiếng Việt
 * @returns {string}
 */
export function formatCurrentVietnameseDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return now.toLocaleDateString('vi-VN', options);
}

/**
 * Kiểm tra xem một khung giờ tiết học có đang diễn ra hay không
 * @param {string} startTime - Định dạng "HH:mm" (VD: "07:00")
 * @param {string} endTime - Định dạng "HH:mm" (VD: "08:50")
 * @param {number} dayOfWeek - Thứ trong tuần (0-6)
 * @returns {boolean}
 */
export function isLessonActiveNow(startTime, endTime, dayOfWeek) {
  const now = new Date();
  if (now.getDay() !== dayOfWeek) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}
