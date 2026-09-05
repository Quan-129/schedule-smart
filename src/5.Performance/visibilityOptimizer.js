/**
 * ==========================================================================
 * PERFORMANCE MODULE - VISIBILITY OPTIMIZER
 * Tối ưu hóa tiêu thụ Pin/CPU khi ẩn tab và quản lý Animation Frame
 * ==========================================================================
 */

/**
 * Đăng ký tối ưu tài nguyên theo trạng thái hiển thị của trang (Page Visibility API)
 * @param {Function} onVisible - Callback khi tab được mở lại
 * @param {Function} onHidden - Callback khi tab bị ẩn
 */
export function initVisibilityOptimizer(onVisible, onHidden) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (typeof onHidden === 'function') onHidden();
    } else {
      if (typeof onVisible === 'function') onVisible();
    }
  });
}
