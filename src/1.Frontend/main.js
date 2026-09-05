/**
 * ==========================================================================
 * FRONTEND MAIN ENTRY POINT (src/1.Frontend/main.js)
 * Khởi tạo ứng dụng, kết nối State, điều hướng View và quản lý sự kiện
 * ==========================================================================
 */

import { state, initApplicationState, persistDriveSubjects, setState } from '../3.Database/state.js';
import { DEFAULT_WEEK_35_MD, DEFAULT_WEEK_36_MD } from '../3.Database/storage/SeedData.js';
import { parseScheduleMarkdown } from '../2.Backend/services/TimetableParser.js';
import { formatCurrentVietnameseDate } from '../2.Backend/utils/dateHelpers.js';
import { renderBackpackView, enterJiggleMode, exitJiggleMode } from './views/BackpackView.js';
import { renderGradesView } from './views/GradesView.js';
import { renderTimetableGrid, renderTodayView } from './views/TimetableGrid.js';
import { showToast, initToastContainer } from './components/Toast.js';
import { initPWA, promptPWAInstall } from '../5.Performance/pwaManager.js';
import { initVisibilityOptimizer } from '../5.Performance/visibilityOptimizer.js';
import { formatSafeUrl } from '../4.Security/urlValidator.js';
import { initFirebaseAuth, syncDriveSubjectsToCloud } from '../3.Database/auth/FirebaseAuthService.js';

// DOM Elements
const elements = {
  viewTabs: document.querySelectorAll('.view-tab'),
  viewSections: document.querySelectorAll('.view-section'),
  weekSelect: document.getElementById('week-select'),
  currentDateText: document.getElementById('current-date-text'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  installPwaBtn: document.getElementById('install-pwa-btn'),
  
  // Add Subject Modal
  addSubjectModal: document.getElementById('add-subject-modal'),
  addSubjectForm: document.getElementById('add-subject-form'),
  newSubjNameInput: document.getElementById('new-subj-name-input'),
  newSubjCodeInput: document.getElementById('new-subj-code-input'),
  newSubjDriveInput: document.getElementById('new-subj-drive-input'),
  addSubjectCloseBtn: document.getElementById('add-subject-close-btn'),
  addSubjectCancelBtn: document.getElementById('add-subject-cancel-btn')
};

/**
 * Khởi động ứng dụng
 */
function initApp() {
  console.log('[Smart Schedule] 🚀 Khởi tạo hệ thống kiến trúc 5 tầng...');

  // 1. Nạp State trung tâm
  initApplicationState();
  initToastContainer();

  // 2. Khởi tạo Firebase Auth & Google Login
  initFirebaseAuth((user) => {
    if (user) {
      renderBackpackView();
      renderGradesView();
    }
  });

  // 2. Hiển thị ngày tháng hiện tại
  if (elements.currentDateText) {
    elements.currentDateText.textContent = formatCurrentVietnameseDate();
  }

  // 3. Đăng ký PWA & Service Worker
  initPWA((canInstall) => {
    if (elements.installPwaBtn) {
      elements.installPwaBtn.style.display = canInstall ? 'inline-flex' : 'none';
    }
  });

  // 4. Gắn sự kiện điều hướng Tabs
  initTabNavigation();

  // 5. Nạp danh sách tuần và lịch học
  loadWeekSchedule('schedules/tuan-35.md');

  // 6. Render các Views ban đầu
  renderBackpackView();
  renderGradesView();

  // 7. Gắn các sự kiện Modal Thêm Môn, Theme, PWA
  initAddSubjectModal();
  initThemeToggle();

  // 8. Tối ưu hiệu năng khi ẩn tab
  initVisibilityOptimizer(
    () => console.log('[App] Tab Active'),
    () => console.log('[App] Tab Hidden - Tiết kiệm tài nguyên')
  );

  // 9. Tự động kiểm tra tham số URL (?tab=backpack hoặc ?tab=grades)
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get('tab') || 'backpack';
  switchTab(targetTab);
}

/**
 * Điều hướng giữa các Tabs giao diện
 */
function initTabNavigation() {
  const tabs = [
    { btnId: 'view-grid-btn', viewId: 'grid-view-container', name: 'grid' },
    { btnId: 'view-today-btn', viewId: 'today-view-container', name: 'today' },
    { btnId: 'view-grades-btn', viewId: 'grades-view-container', name: 'grades' },
    { btnId: 'view-backpack-btn', viewId: 'backpack-view-container', name: 'backpack' }
  ];

  tabs.forEach(t => {
    const btn = document.getElementById(t.btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        switchTab(t.name);
      });
    }
  });

  // Bắt các nút phụ
  const addSubjBtn = document.getElementById('bp-add-subject-btn');
  if (addSubjBtn) {
    addSubjBtn.onclick = () => {
      const modal = document.getElementById('add-subject-modal');
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    };
  }
}

export function switchTab(tabName) {
  state.currentTab = tabName;

  const tabMapping = {
    'grid': { btnId: 'view-grid-btn', viewId: 'grid-view-container' },
    'schedule': { btnId: 'view-grid-btn', viewId: 'grid-view-container' },
    'today': { btnId: 'view-today-btn', viewId: 'today-view-container' },
    'grades': { btnId: 'view-grades-btn', viewId: 'grades-view-container' },
    'backpack': { btnId: 'view-backpack-btn', viewId: 'backpack-view-container' }
  };

  const target = tabMapping[tabName] || tabMapping['backpack'];

  // Toggle buttons
  document.querySelectorAll('.view-toggles .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === target.btnId);
  });

  // Toggle view panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    const isTarget = panel.id === target.viewId;
    panel.classList.toggle('active', isTarget);
    panel.style.display = isTarget ? 'block' : 'none';
  });

  if (tabName === 'backpack') {
    renderBackpackView();
  } else if (tabName === 'grades') {
    renderGradesView();
  }
}

/**
 * Nạp lịch học Markdown của tuần
 * @param {string} filepath 
 */
async function loadWeekSchedule(filepath) {
  let mdText = '';
  try {
    const res = await fetch(filepath);
    if (res.ok) {
      mdText = await res.text();
    } else {
      mdText = DEFAULT_WEEK_35_MD;
    }
  } catch (err) {
    console.warn('[Schedule] Dùng fallback markdown cục bộ:', err);
    mdText = DEFAULT_WEEK_35_MD;
  }

  const parsed = parseScheduleMarkdown(mdText);
  state.scheduleData = parsed;

  renderTimetableGrid(parsed.days || []);
  renderTodayView(parsed.days || []);

  const titleEl = document.getElementById('schedule-title');
  if (titleEl) titleEl.textContent = parsed.title || 'Lịch Học Thông Minh';
}

/**
 * Khởi tạo Modal Thêm Môn Học
 */
function initAddSubjectModal() {
  if (elements.addSubjectCloseBtn) {
    elements.addSubjectCloseBtn.onclick = () => closeAddModal();
  }
  if (elements.addSubjectCancelBtn) {
    elements.addSubjectCancelBtn.onclick = () => closeAddModal();
  }

  if (elements.addSubjectForm) {
    elements.addSubjectForm.onsubmit = (e) => {
      e.preventDefault();
      const name = elements.newSubjNameInput.value.trim();
      const code = elements.newSubjCodeInput.value.trim().toUpperCase();
      const driveUrl = formatSafeUrl(elements.newSubjDriveInput.value.trim());

      if (!name || !code) {
        showToast('Vui lòng nhập tên và mã môn học');
        return;
      }

      // Kiểm tra trùng mã môn
      if (state.driveSubjects.some(s => s.code === code)) {
        showToast(`Môn có mã "${code}" đã tồn tại!`);
        return;
      }

      state.driveSubjects.push({
        code,
        name,
        englishName: name,
        credits: 3,
        lecturers: '',
        icon: 'fa-solid fa-book',
        color: '#6366f1',
        driveUrl,
        gradeItems: [
          { id: 'item-gk', name: 'Giữa kỳ (GK)', weight: 30, color: '#3b82f6' },
          { id: 'item-ck', name: 'Cuối kỳ (CK)', weight: 50, color: '#ec4899' },
          { id: 'item-btl', name: 'Bài tập lớn (BTL)', weight: 20, color: '#10b981' }
        ],
        notes: ''
      });

      persistDriveSubjects();
      closeAddModal();
      renderBackpackView();
      renderGradesView();
      showToast(`Đã thêm môn "${name}" vào Chiếc Cặp!`);
    };
  }
}

function closeAddModal() {
  if (elements.addSubjectModal) {
    elements.addSubjectModal.classList.remove('active');
    elements.addSubjectModal.style.display = 'none';
  }
  if (elements.addSubjectForm) elements.addSubjectForm.reset();
}

/**
 * Khởi tạo Đổi Theme Sáng/Tối
 */
function initThemeToggle() {
  if (!elements.themeToggleBtn) return;
  elements.themeToggleBtn.onclick = () => {
    state.isDarkTheme = !state.isDarkTheme;
    document.body.classList.toggle('light-theme', !state.isDarkTheme);
    showToast(state.isDarkTheme ? 'Đã bật chế độ Dark Theme 🌙' : 'Đã bật chế độ Light Theme ☀️');
  };
}

// Bắt đầu khi trang tải xong DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
