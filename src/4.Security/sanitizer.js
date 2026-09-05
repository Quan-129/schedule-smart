/**
 * ==========================================================================
 * SECURITY MODULE - INPUT SANITIZER
 * Chống tấn công XSS & làm sạch dữ liệu người dùng trước khi render vào DOM
 * ==========================================================================
 */

/**
 * Chuyển đổi các ký tự nguy hiểm thành thực thể HTML an toàn
 * @param {any} str - Chuỗi hoặc giá trị cần escape
 * @returns {string} Chuỗi an toàn
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Làm sạch chuỗi dùng cho thuộc tính HTML
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeAttribute(str) {
  return escapeHtml(str).replace(/javascript:/gi, '');
}
