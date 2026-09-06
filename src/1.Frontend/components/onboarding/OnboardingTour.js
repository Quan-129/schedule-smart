/**
 * ==========================================================================
 * FRONTEND COMPONENT - INTERACTIVE SPOTLIGHT ONBOARDING TOUR
 * Hướng dẫn tương tác rọi sáng từng bước (Spotlight Zoom & Smart Tooltip)
 * ==========================================================================
 */

import { getCurrentUser, isOwnerUser } from '../../../3.Database/auth/FirebaseAuthService.js';
import { showToast } from '../Toast.js';
import { escapeHtml } from '../../../4.Security/sanitizer.js';

const ONBOARDING_ROOT_ID = 'onboarding-tour-root';

/**
 * Danh sách 5 bước hướng dẫn tương tác chi tiết & đắt giá
 */
const TOUR_STEPS = [
  {
    targetSelector: '.view-toggles',
    title: '4 Góc Nhìn Học Tập Toàn Diện 🧭',
    badge: 'Bước 1 / 5',
    icon: 'fa-solid fa-compass',
    content: 'Chuyển đổi linh hoạt giữa <b>4 chế độ xem</b>: <br>• <b>Lưới tuần</b>: Thời khóa biểu chi tiết dạng thẻ.<br>• <b>Timeline</b>: Lịch Google Calendar theo khung giờ thực.<br>• <b>Tỉ lệ điểm</b>: Tính toán điểm mục tiêu GPA.<br>• <b>Chiếc Cặp</b>: Quản lý thư mục Google Drive môn học.',
    position: 'bottom'
  },
  {
    targetSelector: '.week-navigation',
    title: 'Quản Lý Tuần & Mở Rộng 2 Chiều 📅',
    badge: 'Bước 2 / 5',
    icon: 'fa-solid fa-calendar-days',
    content: '• Chọn tuần học nhanh từ menu.<br>• Bấm nút <b>Hôm nay</b> (biểu tượng hồng tâm) để tự động định vị.<br>• Mở menu chọn tuần để <b>Thêm tuần sau (+7 ngày)</b> hoặc <b>Thêm tuần trước (-7 ngày)</b>.',
    position: 'bottom'
  },
  {
    targetSelector: '#days-mode-selector',
    title: 'Tùy Chỉnh Chế Độ Hiển Thị Ngày 👁️',
    badge: 'Bước 3 / 5',
    icon: 'fa-solid fa-sliders',
    content: 'Tùy biến màn hình theo nhu cầu của bạn:<br>• <b>1 Ngày</b>: Tập trung tối đa vào buổi học hôm nay.<br>• <b>3 Ngày</b>: Cửa sổ hôm qua, hôm nay và ngày mai.<br>• <b>7 Ngày</b>: Toàn bộ tuần học từ Thứ 2 đến Chủ Nhật.',
    position: 'bottom'
  },
  {
    targetSelector: '.day-card:first-child',
    fallbackSelector: '#schedule-grid',
    title: 'Thêm Tiết Học Siêu Tốc & Con Lăn 3D ⚡',
    badge: 'Bước 4 / 5',
    icon: 'fa-solid fa-bolt',
    content: '• Bấm nút <b>"Thêm buổi học"</b> hoặc <b>giữ đè (Long-press)</b> lên khung ngày bất kỳ.<br>• Dùng <b>con lăn 3D phong cách iOS Alarm</b> để chọn giờ học, xếp phòng và gắn Logo môn học trong chớp mắt!',
    position: 'top'
  },
  {
    targetSelector: '#view-backpack-btn',
    title: 'Chiếc Cặp Google Drive Thông Minh 🎒',
    badge: 'Bước 5 / 5',
    icon: 'fa-brands fa-google-drive',
    content: '• Gắn link Google Drive cho từng môn học để mở tài liệu 1-chạm.<br>• Tự động đồng bộ và lưu trữ an toàn <b>Offline</b> lẫn <b>Cloud</b>!',
    position: 'bottom'
  }
];

let currentStepIndex = 0;
let isTourActive = false;
let resizeHandler = null;
let keydownHandler = null;

/**
 * Kiểm tra xem người dùng hiện tại đã hoàn thành tour hay chưa
 * @returns {boolean}
 */
export function hasCompletedOnboarding() {
  const activeUser = getCurrentUser();
  const uid = activeUser ? activeUser.uid : 'guest';
  const key = `smart_schedule_onboarding_done_${uid}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * Đánh dấu người dùng đã hoàn thành tour
 */
export function markOnboardingCompleted() {
  const activeUser = getCurrentUser();
  const uid = activeUser ? activeUser.uid : 'guest';
  const key = `smart_schedule_onboarding_done_${uid}`;
  localStorage.setItem(key, 'true');
}

/**
 * Xóa cờ để có thể mở lại tour từ đầu
 */
export function resetOnboarding() {
  const activeUser = getCurrentUser();
  const uid = activeUser ? activeUser.uid : 'guest';
  const key = `smart_schedule_onboarding_done_${uid}`;
  localStorage.removeItem(key);
}

/**
 * Đảm bảo khung DOM của Onboarding Tour đã tồn tại
 */
function ensureOnboardingDom() {
  if (document.getElementById(ONBOARDING_ROOT_ID)) return;

  const root = document.createElement('div');
  root.id = ONBOARDING_ROOT_ID;
  root.className = 'onboarding-tour-container hidden';
  root.innerHTML = `
    <!-- Lớp phủ tối mờ toàn màn hình -->
    <div class="onboarding-backdrop" id="onboarding-backdrop"></div>

    <!-- Khung Spotlight khoét lỗ rọi sáng vào phần tử mục tiêu -->
    <div class="onboarding-spotlight-box" id="onboarding-spotlight-box">
      <div class="spotlight-pulse-ring"></div>
    </div>

    <!-- Thẻ Chú Thích Popover Card Thông Minh -->
    <div class="onboarding-popover-card" id="onboarding-popover-card" role="dialog" aria-modal="true">
      <div class="popover-arrow" id="popover-arrow"></div>

      <!-- Header thẻ -->
      <div class="popover-header">
        <div class="popover-badge-group">
          <div class="popover-icon-box" id="popover-icon-box">
            <i class="fa-solid fa-compass"></i>
          </div>
          <span class="popover-badge" id="popover-step-badge">Bước 1 / 5</span>
        </div>
        <button type="button" class="btn-popover-skip" id="btn-popover-skip" title="Bỏ qua hướng dẫn">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Nội dung chính -->
      <div class="popover-body">
        <h4 class="popover-title" id="popover-title">Tiêu đề bước</h4>
        <div class="popover-content" id="popover-content">Nội dung hướng dẫn</div>
      </div>

      <!-- Footer điều hướng -->
      <div class="popover-footer">
        <!-- Dots tiến trình -->
        <div class="popover-dots" id="popover-dots">
          ${TOUR_STEPS.map((_, i) => `<span class="tour-dot ${i === 0 ? 'active' : ''}" data-step="${i}"></span>`).join('')}
        </div>

        <div class="popover-actions">
          <button type="button" class="btn-popover-prev" id="btn-popover-prev" style="display: none;">
            <i class="fa-solid fa-chevron-left"></i> Trước
          </button>
          <button type="button" class="btn-popover-next" id="btn-popover-next">
            <span>Tiếp tục</span> <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  bindPopoverEvents();
}

/**
 * Gắn các sự kiện cho popover
 */
function bindPopoverEvents() {
  const skipBtn = document.getElementById('btn-popover-skip');
  const prevBtn = document.getElementById('btn-popover-prev');
  const nextBtn = document.getElementById('btn-popover-next');
  const backdrop = document.getElementById('onboarding-backdrop');

  if (skipBtn) {
    skipBtn.onclick = () => {
      endOnboardingTour(true);
      showToast('Đã bỏ qua hướng dẫn. Bạn có thể xem lại ở nút ❓ trên thanh điều hướng!', 3500);
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentStepIndex > 0) {
        goToStep(currentStepIndex - 1);
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentStepIndex < TOUR_STEPS.length - 1) {
        goToStep(currentStepIndex + 1);
      } else {
        endOnboardingTour(true);
        showToast('Chúc mừng bạn đã hoàn thành hướng dẫn! Chúc bạn học tập hiệu quả 🎉', 4000);
      }
    };
  }

  if (backdrop) {
    backdrop.onclick = (e) => {
      // Khi bấm ra vùng ngoài, có thể rung nhẹ popover để nhắc nhở người dùng
      const popover = document.getElementById('onboarding-popover-card');
      if (popover) {
        popover.classList.add('popover-shake');
        setTimeout(() => popover.classList.remove('popover-shake'), 400);
      }
    };
  }

  // Click vào dot để nhảy bước
  const dots = document.querySelectorAll('.tour-dot');
  dots.forEach(dot => {
    dot.onclick = () => {
      const step = parseInt(dot.dataset.step, 10);
      if (!isNaN(step) && step >= 0 && step < TOUR_STEPS.length) {
        goToStep(step);
      }
    };
  });
}

/**
 * Di chuyển đến một bước cụ thể trong Tour
 * @param {number} stepIndex 
 */
function goToStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) return;
  currentStepIndex = stepIndex;
  const step = TOUR_STEPS[stepIndex];

  // 1. Tìm phần tử mục tiêu
  let targetEl = document.querySelector(step.targetSelector);
  if (!targetEl && step.fallbackSelector) {
    targetEl = document.querySelector(step.fallbackSelector);
  }

  // Nếu không tìm thấy phần tử mục tiêu nào, chuyển sang bước tiếp
  if (!targetEl) {
    if (stepIndex < TOUR_STEPS.length - 1) {
      goToStep(stepIndex + 1);
    } else {
      endOnboardingTour(true);
    }
    return;
  }

  // 2. Cuộn màn hình tới phần tử
  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

  // Đợi cuộn ổn định và render spotlight
  setTimeout(() => {
    updateSpotlightPosition(targetEl);
    updatePopoverContent(step, targetEl);
  }, 120);
}

/**
 * Cập nhật vị trí khung rọi sáng (Spotlight) bao bọc phần tử
 * @param {HTMLElement} targetEl 
 */
function updateSpotlightPosition(targetEl) {
  const spotlight = document.getElementById('onboarding-spotlight-box');
  if (!spotlight || !targetEl) return;

  const rect = targetEl.getBoundingClientRect();
  const PADDING = 8;

  const top = Math.max(0, rect.top - PADDING);
  const left = Math.max(0, rect.left - PADDING);
  const width = rect.width + PADDING * 2;
  const height = rect.height + PADDING * 2;

  spotlight.style.top = `${top}px`;
  spotlight.style.left = `${left}px`;
  spotlight.style.width = `${width}px`;
  spotlight.style.height = `${height}px`;
}

/**
 * Cập nhật nội dung & toạ độ của Popover Card
 * @param {Object} step 
 * @param {HTMLElement} targetEl 
 */
function updatePopoverContent(step, targetEl) {
  const popover = document.getElementById('onboarding-popover-card');
  const badgeEl = document.getElementById('popover-step-badge');
  const iconBox = document.getElementById('popover-icon-box');
  const titleEl = document.getElementById('popover-title');
  const contentEl = document.getElementById('popover-content');
  const prevBtn = document.getElementById('btn-popover-prev');
  const nextBtn = document.getElementById('btn-popover-next');
  const arrowEl = document.getElementById('popover-arrow');

  if (!popover) return;

  if (badgeEl) badgeEl.textContent = step.badge;
  if (iconBox) iconBox.innerHTML = `<i class="${step.icon}"></i>`;
  if (titleEl) titleEl.innerHTML = step.title;
  if (contentEl) contentEl.innerHTML = step.content;

  // Cập nhật nút Previous
  if (prevBtn) {
    prevBtn.style.display = currentStepIndex > 0 ? 'inline-flex' : 'none';
  }

  // Cập nhật nút Next / Hoàn thành
  if (nextBtn) {
    if (currentStepIndex === TOUR_STEPS.length - 1) {
      nextBtn.innerHTML = `<span>Bắt đầu dùng ngay</span> <i class="fa-solid fa-sparkles"></i>`;
      nextBtn.classList.add('btn-popover-finish');
    } else {
      nextBtn.innerHTML = `<span>Tiếp tục</span> <i class="fa-solid fa-chevron-right"></i>`;
      nextBtn.classList.remove('btn-popover-finish');
    }
  }

  // Cập nhật Dots
  document.querySelectorAll('.tour-dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentStepIndex);
  });

  // TÍNH TOÁN TOẠ ĐỘ THÔNG MINH CHO POPOVER
  const rect = targetEl.getBoundingClientRect();
  const popoverWidth = Math.min(380, window.innerWidth - 32);
  popover.style.width = `${popoverWidth}px`;

  const popoverHeight = popover.offsetHeight || 220;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = 0;
  let left = 0;
  let preferredPos = step.position || 'bottom';

  // Kiểm tra không gian phía dưới
  if (preferredPos === 'bottom' && rect.bottom + popoverHeight + 20 > viewportHeight) {
    preferredPos = 'top';
  }
  // Kiểm tra không gian phía trên
  if (preferredPos === 'top' && rect.top - popoverHeight - 20 < 0) {
    preferredPos = 'bottom';
  }

  if (preferredPos === 'bottom') {
    top = rect.bottom + 16;
    left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (arrowEl) {
      arrowEl.className = 'popover-arrow arrow-top';
    }
  } else {
    top = Math.max(16, rect.top - popoverHeight - 16);
    left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (arrowEl) {
      arrowEl.className = 'popover-arrow arrow-bottom';
    }
  }

  // Giới hạn trong khung nhìn màn hình
  if (left < 16) left = 16;
  if (left + popoverWidth > viewportWidth - 16) {
    left = viewportWidth - popoverWidth - 16;
  }

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

/**
 * Bắt đầu Tour Hướng Dẫn
 * @param {boolean} forceStart - Bắt buộc chạy lại kể cả khi đã xem
 */
export function startOnboardingTour(forceStart = false) {
  if (!forceStart && hasCompletedOnboarding()) {
    return;
  }

  ensureOnboardingDom();
  const root = document.getElementById(ONBOARDING_ROOT_ID);
  if (!root) return;

  root.classList.remove('hidden');
  root.classList.add('active');
  isTourActive = true;
  currentStepIndex = 0;

  // Lắng nghe resize cửa sổ để tự điều chỉnh spotlight
  if (!resizeHandler) {
    resizeHandler = () => {
      if (isTourActive) {
        const step = TOUR_STEPS[currentStepIndex];
        if (step) {
          const targetEl = document.querySelector(step.targetSelector) || document.querySelector(step.fallbackSelector);
          if (targetEl) {
            updateSpotlightPosition(targetEl);
            updatePopoverContent(step, targetEl);
          }
        }
      }
    };
    window.addEventListener('resize', resizeHandler, { passive: true });
    window.addEventListener('scroll', resizeHandler, { passive: true });
  }

  // Lắng nghe bàn phím (ArrowRight, ArrowLeft, Escape)
  if (!keydownHandler) {
    keydownHandler = (e) => {
      if (!isTourActive) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        const nextBtn = document.getElementById('btn-popover-next');
        if (nextBtn) nextBtn.click();
      } else if (e.key === 'ArrowLeft') {
        const prevBtn = document.getElementById('btn-popover-prev');
        if (prevBtn && prevBtn.style.display !== 'none') prevBtn.click();
      } else if (e.key === 'Escape') {
        endOnboardingTour(true);
      }
    };
    window.addEventListener('keydown', keydownHandler);
  }

  goToStep(0);
}

/**
 * Kết thúc và đóng Tour
 * @param {boolean} markDone 
 */
export function endOnboardingTour(markDone = true) {
  const root = document.getElementById(ONBOARDING_ROOT_ID);
  if (root) {
    root.classList.remove('active');
    root.classList.add('hidden');
  }
  isTourActive = false;
  if (markDone) {
    markOnboardingCompleted();
  }
}

/**
 * Khởi tạo Tour & Gắn sự kiện cho các nút kích hoạt
 */
export function initOnboardingTour() {
  ensureOnboardingDom();
}
