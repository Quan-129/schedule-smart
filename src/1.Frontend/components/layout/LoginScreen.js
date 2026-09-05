/**
 * ==========================================================================
 * FRONTEND COMPONENT - LOGIN SCREEN (AUTHENTICATION GATE)
 * ==========================================================================
 */

import { loginWithGoogle } from '../../../3.Database/auth/FirebaseAuthService.js';

/**
 * Render Màn hình Đăng nhập (Auth Landing Screen)
 * @param {HTMLElement} containerEl 
 */
export function renderLoginScreen(containerEl) {
  if (!containerEl) return;

  containerEl.innerHTML = `
    <div id="login-screen" class="login-screen-container">
      <div class="login-card">
        <div class="login-badge">
          <i class="fa-solid fa-graduation-cap"></i> BK TP.HCM • Học Kỳ 1 2026-2027
        </div>

        <div class="login-header">
          <div class="login-logo-glow">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <h1 class="login-title">Schedule<span class="highlight" style="background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Smart</span></h1>
          <p class="login-desc">Thời khóa biểu thông minh, Tỉ lệ điểm & Chiếc Cặp Google Drive 1-chạm đồng bộ tức thì.</p>
        </div>

        <div class="login-features-list">
          <div class="login-feature-item">
            <div class="login-feat-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
              <i class="fa-solid fa-table-columns"></i>
            </div>
            <div class="login-feat-text">
              <strong>Thời khóa biểu tự động</strong>
              <span>Tự nhận diện tuần học và tiết học hôm nay</span>
            </div>
          </div>

          <div class="login-feature-item">
            <div class="login-feat-icon" style="background: rgba(236, 72, 153, 0.15); color: #f472b6;">
              <i class="fa-solid fa-chart-pie"></i>
            </div>
            <div class="login-feat-text">
              <strong>Biểu đồ tỉ lệ điểm chi tiết</strong>
              <span>Xem trọng số GK, CK, BTL trực quan</span>
            </div>
          </div>

          <div class="login-feature-item">
            <div class="login-feat-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
              <i class="fa-brands fa-google-drive"></i>
            </div>
            <div class="login-feat-text">
              <strong>Chiếc Cặp Google Drive</strong>
              <span>Speed-Dial 1-chạm mở ngay tài liệu môn học</span>
            </div>
          </div>

          <div class="login-feature-item">
            <div class="login-feat-icon" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee;">
              <i class="fa-solid fa-cloud"></i>
            </div>
            <div class="login-feat-text">
              <strong>Đồng bộ đa thiết bị Cloud</strong>
              <span>Lưu dữ liệu độc lập giữa Máy tính ⇄ Điện thoại</span>
            </div>
          </div>
        </div>

        <div class="login-actions">
          <button id="landing-login-btn" class="btn-google-login-large">
            <svg class="google-icon-svg" viewBox="0 0 48 48" width="22" height="22">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Đăng nhập bằng tài khoản Google</span>
          </button>
        </div>

        <div class="login-footer-note">
          <i class="fa-solid fa-shield-halved"></i> Đăng nhập an toàn • Mỗi người dùng có một không gian lưu trữ riêng biệt
        </div>
      </div>
    </div>
  `;

  const btn = containerEl.querySelector('#landing-login-btn');
  if (btn) {
    btn.onclick = loginWithGoogle;
  }
}
