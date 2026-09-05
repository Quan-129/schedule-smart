/**
 * ==========================================================================
 * PERFORMANCE MODULE - PWA MANAGER
 * Đăng ký Service Worker, quản lý cài đặt App & hỗ trợ Cache Offline
 * ==========================================================================
 */

let deferredInstallPrompt = null;

/**
 * Khởi tạo Service Worker và đăng ký sự kiện PWA
 * @param {Function} onInstallable - Callback khi ứng dụng sẵn sàng cài đặt
 */
export function initPWA(onInstallable) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker đăng ký thành công:', registration.scope);
        })
        .catch(err => {
          console.warn('[PWA] Đăng ký Service Worker thất bại:', err);
        });
    });
  }

  // Bắt sự kiện beforeinstallprompt để hiển thị nút cài đặt tùy chỉnh
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (typeof onInstallable === 'function') {
      onInstallable(true);
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    console.log('[PWA] Ứng dụng đã được cài đặt thành công!');
    if (typeof onInstallable === 'function') {
      onInstallable(false);
    }
  });
}

/**
 * Kích hoạt hộp thoại cài đặt PWA Native
 * @returns {Promise<boolean>}
 */
export async function promptPWAInstall() {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === 'accepted';
  } catch (err) {
    console.warn('[PWA] Lỗi khi kích hoạt cài đặt:', err);
    return false;
  }
}
