/**
 * ==========================================================================
 * SECURITY MODULE - URL VALIDATOR
 * Kiểm tra whitelist URL Google Drive & định dạng liên kết an toàn
 * ==========================================================================
 */

/**
 * Kiểm tra xem URL có phải là liên kết hợp lệ hay không
 * @param {string} url 
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Kiểm tra xem liên kết có thuộc hệ thống Google Drive hay không
 * @param {string} url 
 * @returns {boolean}
 */
export function isGoogleDriveUrl(url) {
  if (!isValidUrl(url)) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname.includes('drive.google.com') || parsed.hostname.includes('docs.google.com');
  } catch (e) {
    return false;
  }
}

/**
 * Chuẩn hóa URL trước khi mở ngoài tab mới
 * @param {string} url 
 * @returns {string}
 */
export function formatSafeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'https://' + trimmed;
  }
  return trimmed;
}
