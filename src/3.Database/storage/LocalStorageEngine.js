/**
 * ==========================================================================
 * DATABASE STORAGE ENGINE - LOCALSTORAGE WRAPPER
 * Xử lý lưu trữ dữ liệu ngoại tuyến an toàn với fallback
 * ==========================================================================
 */

/**
 * Đọc dữ liệu từ localStorage
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[LocalStorageEngine] Không thể đọc key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Ghi dữ liệu vào localStorage
 * @param {string} key 
 * @param {any} value 
 * @returns {boolean} Thành công hay thất bại
 */
export function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[LocalStorageEngine] Lỗi khi ghi key "${key}":`, err);
    return false;
  }
}

/**
 * Xóa một key trong localStorage
 * @param {string} key 
 */
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[LocalStorageEngine] Lỗi khi xóa key "${key}":`, err);
  }
}
