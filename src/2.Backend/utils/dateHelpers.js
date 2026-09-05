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
  const normalized = dayName.toLowerCase();
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
