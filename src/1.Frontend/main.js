/**
 * ==========================================================================
 * FRONTEND MAIN ENTRY POINT (src/1.Frontend/main.js)
 * Khởi tạo ứng dụng, kết nối State, điều hướng View và quản lý sự kiện
 * ==========================================================================
 */

import { state, initApplicationState, persistDriveSubjects, persistDaysDisplayMode, setState } from '../3.Database/state.js';
import { DEFAULT_WEEK_35_MD, DEFAULT_WEEK_36_MD } from '../3.Database/storage/SeedData.js';
import { parseScheduleMarkdown, serializeScheduleToMarkdown, generateEmptyWeekMarkdown } from '../2.Backend/services/TimetableParser.js';
import { formatCurrentVietnameseDate } from '../2.Backend/utils/dateHelpers.js';
import { renderBackpackView, enterJiggleMode, exitJiggleMode } from './views/BackpackView.js';
import { renderGradesView, highlightGradeSlice } from './views/GradesView.js';
import { renderTimetableGrid, renderTodayView, getSubjectColor } from './views/TimetableGrid.js';
import { ensureEditSubjectModalDom, openEditSubjectModal, openEditDriveModal } from './components/modals/EditSubjectModal.js';
import { ensureAddSubjectModalDom, openAddSubjectModal, initAddSubjectModal } from './components/modals/AddSubjectModal.js';
import { ensureAddWeekModalDom, openAddWeekModal, initAddWeekModal } from './components/modals/AddWeekModal.js';
import { ensureDeleteWeekModalDom, openDeleteWeekModal } from './components/modals/DeleteWeekModal.js';
import { ensureSubjectDetailModalDom, openSubjectDetailModal } from './components/modals/SubjectDetailModal.js';
import { ensureAddClassModalDom, openAddClassModal, openEditClassModal } from './components/modals/AddClassModal.js';
import { showToast, initToastContainer } from './components/Toast.js';
import { initPWA, promptPWAInstall } from '../5.Performance/pwaManager.js';
import { initVisibilityOptimizer } from '../5.Performance/visibilityOptimizer.js';
import { formatSafeUrl } from '../4.Security/urlValidator.js';
import { initFirebaseAuth, syncDriveSubjectsToCloud } from '../3.Database/auth/FirebaseAuthService.js';
import { escapeHtml } from '../4.Security/sanitizer.js';

let availableWeeks = [];
let currentRawMarkdown = '';
let currentWeekFile = '';

/**
 * Khởi động ứng dụng
 */
async function initApp() {
  console.log('[Smart Schedule] 🚀 Khởi tạo hệ thống kiến trúc 5 tầng hoàn chỉnh...');

  // 1. Nạp State trung tâm, Container Toast & Khởi tạo DOM Modals
  initApplicationState();
  initToastContainer();
  ensureEditSubjectModalDom();
  ensureAddSubjectModalDom();
  ensureAddWeekModalDom();
  ensureDeleteWeekModalDom();
  ensureSubjectDetailModalDom();
  ensureAddClassModalDom();

  // 2. Gắn các hàm tiện ích toàn cục vào window để hỗ trợ HTML onclick
  setupWindowHelpers();

  // 3. Hiển thị ngày tháng tiếng Việt & gắn click định vị
  const currentDateEl = document.getElementById('current-date-text');
  const currentDateBadge = document.getElementById('current-date-badge');
  if (currentDateEl) {
    currentDateEl.textContent = formatCurrentVietnameseDate();
  }
  if (currentDateBadge) {
    currentDateBadge.onclick = focusTodayTarget;
  }

  // 4. Khởi tạo Firebase Auth & Google Login
  initFirebaseAuth((user) => {
    if (user) {
      renderBackpackView();
      renderGradesView();
    }
  });

  // 5. Đăng ký PWA & Service Worker
  initPWA((canInstall) => {
    const installBtn = document.getElementById('install-pwa-btn');
    if (installBtn) {
      installBtn.style.display = canInstall ? 'inline-flex' : 'none';
      installBtn.onclick = promptPWAInstall;
    }
  });

  // 6. Gắn sự kiện điều hướng Tabs
  initTabNavigation();

  // 7. Nạp danh sách tuần học từ index.json và hiển thị tuần mặc định
  await initWeekSelector();

  // 8. Khởi tạo công cụ tìm kiếm và bộ lọc
  initSearchAndFilters();

  // 9. Render các Views ban đầu
  renderBackpackView();
  renderGradesView();

  // 10. Gắn các sự kiện Modal Thêm Môn, Thêm Tuần, Theme, Print, Raw Editor & Hero Toggle
  initAddSubjectModal();
  initAddWeekModal(
    () => currentRawMarkdown,
    (newWeekData) => {
      availableWeeks.push({
        id: newWeekData.id,
        title: newWeekData.title,
        startDate: newWeekData.startDate,
        filename: newWeekData.filename,
        description: newWeekData.desc
      });
      localStorage.setItem(`smart_schedule_custom_md_${newWeekData.filename}`, newWeekData.mdContent);
      const customWeeks = availableWeeks.filter(w => w.filename.startsWith('custom_'));
      localStorage.setItem('smart_schedule_custom_weeks', JSON.stringify(customWeeks));
      renderWeekDropdownOptions(newWeekData.filename);
      loadWeekSchedule(newWeekData.filename);
      showToast(`Đã tạo thành công ${newWeekData.title}!`);
    }
  );
  initThemeToggle();
  initDaysModeSelector();
  initPrintButton();
  initHeroToggle();
  initRawMarkdownEditor();

  // 11. Tối ưu hiệu năng khi chuyển tab trình duyệt
  initVisibilityOptimizer(
    () => console.log('[App] Tab Active'),
    () => console.log('[App] Tab Hidden - Tiết kiệm tài nguyên')
  );

  // 12. Tự động kiểm tra tham số URL (?tab=backpack | ?tab=grades | ?tab=today | ?tab=grid)
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get('tab') || 'backpack';
  switchTab(targetTab);
}

/**
 * Thiết lập các hàm tương tác toàn cục
 */
function setupWindowHelpers() {
  window.viewSubjectGrade = (subjectName) => {
    switchTab('grades');
    const gradesSearchInput = document.getElementById('grades-search-input');
    if (gradesSearchInput) {
      gradesSearchInput.value = subjectName;
      renderGradesView(subjectName);
    }
  };

  window.viewSubjectBackpack = (subjectName) => {
    const matchedSubject = (state.driveSubjects || []).find(s => 
      s.name.toLowerCase() === (subjectName || '').toLowerCase() || 
      (subjectName || '').toLowerCase().includes(s.name.toLowerCase()) ||
      s.code.toLowerCase() === (subjectName || '').toLowerCase()
    );
    if (matchedSubject) {
      openSubjectDetailModal(matchedSubject.code);
    } else {
      switchTab('backpack');
      const bpSearchInput = document.getElementById('backpack-search-input');
      if (bpSearchInput) {
        bpSearchInput.value = subjectName;
      }
    }
  };

  window.copyClassInfo = (subject, time, room) => {
    const text = `📚 Môn: ${subject}\n⏰ Thời gian: ${time}\n📍 Phòng: ${room}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Đã sao chép: ${subject} (${time})`);
    }).catch(() => {
      showToast(`Đã chọn môn ${subject}`);
    });
  };

  window.highlightGradeSlice = highlightGradeSlice;
  window.openEditDriveModal = openEditDriveModal;
  window.openEditSubjectModal = openEditSubjectModal;
  window.openSubjectDetailModal = openSubjectDetailModal;
  window.focusTodayTarget = focusTodayTarget;

  // Visual Schedule Builder Handlers
  window.openAddClassModal = (dayName = 'Thứ 2') => {
    openAddClassModal(dayName, handleSaveClass);
  };

  window.openEditClassModal = (dayName, classIndex) => {
    const day = (state.scheduleData?.days || []).find(d => d.name === dayName);
    const cls = day && day.classes ? day.classes[classIndex] : null;
    if (cls) {
      openEditClassModal(dayName, classIndex, cls, handleSaveClass, handleDeleteClass);
    }
  };

  window.deleteClassFromDay = (dayName, classIndex, classData = null) => {
    handleDeleteClass(dayName, classIndex, classData);
  };
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

  // Nút thêm môn trong Chiếc Cặp
  const addSubjBtn = document.getElementById('bp-add-subject-btn');
  if (addSubjBtn) {
    addSubjBtn.onclick = () => {
      const modal = document.getElementById('add-subject-modal');
      if (modal) {
        modal.classList.add('active');
        modal.classList.remove('hidden');
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
    'backpack': { btnId: 'view-backpack-btn', viewId: 'backpack-view-container' },
    'raw': { btnId: '', viewId: 'raw-view-container' }
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
  } else if (tabName === 'today') {
    if (state.scheduleData && state.scheduleData.days) {
      const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
      renderTodayView(state.scheduleData.days, isCurrentWeek);
    }
  }
}

/**
 * Khởi tạo Dropdown danh sách tuần
 */
async function initWeekSelector() {
  const weekSelect = document.getElementById('week-select');
  const prevBtn = document.getElementById('prev-week-btn');
  const nextBtn = document.getElementById('next-week-btn');
  const addWeekNavBtn = document.getElementById('btn-add-week-modal');
  const deleteWeekNavBtn = document.getElementById('btn-delete-week');

  let deletedWeekIds = [];
  try {
    const delRaw = localStorage.getItem('smart_schedule_deleted_weeks');
    if (delRaw) deletedWeekIds = JSON.parse(delRaw);
  } catch (e) {}

  try {
    const res = await fetch('schedules/index.json');
    if (res.ok) {
      const fetched = await res.json();
      if (Array.isArray(fetched)) {
        availableWeeks = fetched.filter(w => !deletedWeekIds.includes(w.id) && !deletedWeekIds.includes(w.filename));
      }
    }
  } catch (e) {
    console.warn('[Schedule] Không tải được schedules/index.json, dùng danh sách dự phòng:', e);
  }

  if (!availableWeeks || availableWeeks.length === 0) {
    availableWeeks = [
      { id: 'tuan-35', title: 'Tuần 35 (24/08)', filename: 'schedules/tuan-35.md', description: 'Tuần 35' },
      { id: 'tuan-36', title: 'Tuần 36 (31/08)', filename: 'schedules/tuan-36.md', description: 'Tuần 36' }
    ].filter(w => !deletedWeekIds.includes(w.id) && !deletedWeekIds.includes(w.filename));
  }

  // Nạp thêm các tuần do người dùng tự tạo từ LocalStorage
  const customWeeksRaw = localStorage.getItem('smart_schedule_custom_weeks');
  if (customWeeksRaw) {
    try {
      const customWeeks = JSON.parse(customWeeksRaw);
      if (Array.isArray(customWeeks)) {
        customWeeks.forEach(cw => {
          if (!deletedWeekIds.includes(cw.id) && !deletedWeekIds.includes(cw.filename) && !availableWeeks.some(w => w.filename === cw.filename || w.id === cw.id)) {
            availableWeeks.push(cw);
          }
        });
      }
    } catch (err) {
      console.error('Lỗi khi nạp custom weeks:', err);
    }
  }

  if (availableWeeks.length === 0) {
    const fallbackWeek = {
      id: 'tuan-moi',
      title: 'Tuần học mới (Trống)',
      startDate: '',
      filename: 'custom_tuan-moi.md',
      description: 'Lịch học trống'
    };
    availableWeeks.push(fallbackWeek);
  }

  renderWeekDropdownOptions();

  if (weekSelect) {
    weekSelect.onchange = () => {
      if (weekSelect.value === '__ADD_NEW_WEEK__') {
        openAddWeekModal(availableWeeks);
        // Trả lại giá trị trước đó
        weekSelect.value = currentWeekFile || availableWeeks[0].filename;
      } else {
        loadWeekSchedule(weekSelect.value);
      }
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (!weekSelect) return;
      const currentIdx = weekSelect.selectedIndex;
      if (currentIdx > 0) {
        weekSelect.selectedIndex = currentIdx - 1;
        loadWeekSchedule(weekSelect.value);
      } else {
        showToast('Đã ở tuần đầu tiên');
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (!weekSelect) return;
      const currentIdx = weekSelect.selectedIndex;
      const maxIdx = availableWeeks.length - 1;
      if (currentIdx < maxIdx) {
        weekSelect.selectedIndex = currentIdx + 1;
        loadWeekSchedule(weekSelect.value);
      } else {
        showToast('Đã ở tuần cuối cùng trong danh sách');
      }
    };
  }

  if (addWeekNavBtn) {
    addWeekNavBtn.onclick = () => {
      openAddWeekModal(availableWeeks);
    };
  }

  const focusTodayNavBtn = document.getElementById('btn-focus-today');
  if (focusTodayNavBtn) {
    focusTodayNavBtn.onclick = focusTodayTarget;
  }

  if (deleteWeekNavBtn) {
    deleteWeekNavBtn.onclick = () => {
      const currentWeekObj = availableWeeks.find(w => w.filename === currentWeekFile) || availableWeeks[0];
      if (!currentWeekObj) {
        showToast('Không có tuần nào để xóa!');
        return;
      }
      openDeleteWeekModal(currentWeekObj, state.scheduleData, (pendingWeek) => {
        handleDeleteCurrentWeek(pendingWeek);
      });
    };
  }

  // Tự động nhận diện tuần hiện tại theo ngày thực tế
  const initialWeek = getInitialWeekFilename();
  await loadWeekSchedule(initialWeek);
}

/**
 * Xử lý xóa tuần học hiện tại khỏi danh sách và đồng bộ LocalStorage
 * @param {Object} weekObj 
 */
function handleDeleteCurrentWeek(weekObj) {
  if (!weekObj) return;

  // 1. Xóa Markdown trong LocalStorage nếu có
  localStorage.removeItem(`smart_schedule_custom_md_${weekObj.filename}`);

  // 2. Cập nhật danh sách custom_weeks nếu là tuần tự tạo
  let customWeeks = [];
  try {
    const raw = localStorage.getItem('smart_schedule_custom_weeks');
    if (raw) customWeeks = JSON.parse(raw);
  } catch (e) {}
  customWeeks = customWeeks.filter(w => w.filename !== weekObj.filename && w.id !== weekObj.id);
  localStorage.setItem('smart_schedule_custom_weeks', JSON.stringify(customWeeks));

  // 3. Thêm vào danh sách các tuần đã xóa smart_schedule_deleted_weeks
  let deletedWeekIds = [];
  try {
    const delRaw = localStorage.getItem('smart_schedule_deleted_weeks');
    if (delRaw) deletedWeekIds = JSON.parse(delRaw);
  } catch (e) {}
  if (!deletedWeekIds.includes(weekObj.id)) deletedWeekIds.push(weekObj.id);
  if (!deletedWeekIds.includes(weekObj.filename)) deletedWeekIds.push(weekObj.filename);
  localStorage.setItem('smart_schedule_deleted_weeks', JSON.stringify(deletedWeekIds));

  // 4. Cập nhật availableWeeks trong bộ nhớ
  const deletedIndex = availableWeeks.findIndex(w => w.filename === weekObj.filename);
  availableWeeks = availableWeeks.filter(w => w.filename !== weekObj.filename);

  // 5. Nếu hết tuần, tạo 1 tuần trống mặc định
  if (availableWeeks.length === 0) {
    const fallbackWeek = {
      id: 'tuan-moi',
      title: 'Tuần học mới (Trống)',
      startDate: '',
      filename: 'custom_tuan-moi.md',
      description: 'Lịch học trống'
    };
    availableWeeks.push(fallbackWeek);
    localStorage.setItem(`smart_schedule_custom_md_${fallbackWeek.filename}`, generateEmptyWeekMarkdown('Tuần học mới'));
  }

  // 6. Xác định tuần tiếp theo để hiển thị
  const nextWeek = availableWeeks[deletedIndex] || availableWeeks[deletedIndex - 1] || availableWeeks[0];
  
  // 7. Render lại Dropdown và load tuần mới
  renderWeekDropdownOptions(nextWeek.filename);
  loadWeekSchedule(nextWeek.filename);

  showToast(`Đã xóa thành công ${weekObj.title}!`);
}

/**
 * Kiểm tra xem một file tuần học có chứa ngày hôm nay hay không
 * @param {string} filepath 
 * @returns {boolean}
 */
export function checkIsCurrentWeek(filepath) {
  const weekObj = availableWeeks.find(w => w.filename === filepath);
  if (!weekObj || !weekObj.startDate) return false;

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  const start = new Date(weekObj.startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
  const endStr = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');

  return todayStr >= startStr && todayStr <= endStr;
}

/**
 * Tìm file tuần học tương ứng với ngày hôm nay
 * @returns {string}
 */
function getInitialWeekFilename() {
  const currentWeekObj = availableWeeks.find(w => {
    if (!w.startDate) return false;
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const start = new Date(w.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
    const endStr = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');

    return todayStr >= startStr && todayStr <= endStr;
  });

  return currentWeekObj ? currentWeekObj.filename : (availableWeeks[0] ? availableWeeks[0].filename : 'schedules/tuan-35.md');
}

function renderWeekDropdownOptions(selectedFilename) {
  const weekSelect = document.getElementById('week-select');
  if (!weekSelect) return;

  const target = selectedFilename || currentWeekFile || (availableWeeks[0] ? availableWeeks[0].filename : '');

  weekSelect.innerHTML = availableWeeks.map(w => `
    <option value="${w.filename}" ${w.filename === target ? 'selected' : ''}>${escapeHtml(w.title)}</option>
  `).join('') + `
    <option value="__ADD_NEW_WEEK__" style="color: #10b981; font-weight: 700;">➕ Thêm tuần mới...</option>
  `;
}

/**
 * Nạp lịch học Markdown của tuần và cập nhật toàn bộ Banner, Stats & Notes
 * @param {string} filepath 
 */
async function loadWeekSchedule(filepath) {
  currentWeekFile = filepath;
  let mdText = '';

  // 1. Kiểm tra trong LocalStorage nếu là tuần tự tạo
  const customMd = localStorage.getItem(`smart_schedule_custom_md_${filepath}`);
  if (customMd) {
    mdText = customMd;
  } else {
    try {
      const res = await fetch(filepath);
      if (res.ok) {
        mdText = await res.text();
      } else {
        mdText = filepath.includes('36') ? DEFAULT_WEEK_36_MD : DEFAULT_WEEK_35_MD;
      }
    } catch (err) {
      console.warn('[Schedule] Dùng fallback markdown cục bộ:', err);
      mdText = DEFAULT_WEEK_35_MD;
    }
  }

  currentRawMarkdown = mdText;
  const parsed = parseScheduleMarkdown(mdText);
  state.scheduleData = parsed;

  // Cập nhật giá trị đang chọn trong dropdown
  const weekSelect = document.getElementById('week-select');
  if (weekSelect && weekSelect.value !== filepath) {
    weekSelect.value = filepath;
  }

  // 1. Cập nhật Hero Banner
  const titleEl = document.getElementById('schedule-title');
  if (titleEl) titleEl.textContent = parsed.title || 'Lịch Học';

  const subtitleEl = document.getElementById('schedule-subtitle');
  if (subtitleEl) {
    const currentWeekObj = availableWeeks.find(w => w.filename === filepath);
    subtitleEl.textContent = currentWeekObj ? currentWeekObj.description : 'Thời khóa biểu tự động cập nhật';
  }

  // 2. Cập nhật Thống kê Hero
  updateHeroStats(parsed);

  // 3. Render Tags Lọc Môn Học
  renderSubjectFilters(parsed.subjects || []);

  // 4. Render Grid & Today View
  const isCurrentWeek = checkIsCurrentWeek(filepath);
  renderTimetableGrid(parsed.days || [], isCurrentWeek);
  renderTodayView(parsed.days || [], isCurrentWeek);

  // 5. Cập nhật Ghi chú tuần
  renderScheduleNotes(parsed.notes || []);

  // 6. Cập nhật Trình soạn thảo Raw Markdown
  const rawContentEl = document.getElementById('markdown-raw-content');
  const rawFileNameEl = document.getElementById('raw-file-name');
  if (rawContentEl) rawContentEl.value = mdText;
  if (rawFileNameEl) rawFileNameEl.textContent = filepath;
}

/**
 * Cập nhật số liệu thống kê trên Hero Banner
 */
function updateHeroStats(parsed) {
  const days = parsed.days || [];
  let totalClasses = 0;
  const uniqueSubjects = new Set();

  days.forEach(d => {
    if (d.classes && Array.isArray(d.classes)) {
      totalClasses += d.classes.length;
      d.classes.forEach(c => {
        if (c.subject) uniqueSubjects.add(c.subject.trim());
      });
    }
  });

  const totalClassesEl = document.getElementById('stat-total-classes');
  if (totalClassesEl) totalClassesEl.textContent = `${totalClasses} tiết tuần này`;

  const totalSubjEl = document.getElementById('stat-total-subjects');
  if (totalSubjEl) totalSubjEl.textContent = `${uniqueSubjects.size} môn`;

  // Tìm tiết học tiếp theo
  updateNextClassBadge(days);
}

/**
 * Tìm và hiển thị tiết học tiếp theo trong ngày hoặc ngày gần nhất
 */
function updateNextClassBadge(days = []) {
  const nextNameEl = document.getElementById('next-class-name');
  const nextDetailEl = document.getElementById('next-class-detail');
  if (!nextNameEl || !nextDetailEl) return;

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutesTotal = currentHour * 60 + currentMinute;

  let nextClass = null;

  // Tìm trong ngày hôm nay
  const todayDay = days.find(d => d.dayOfWeekNumber === currentDayOfWeek);

  if (todayDay && todayDay.classes && todayDay.classes.length > 0) {
    for (const c of todayDay.classes) {
      if (c.timeRange) {
        const parts = c.timeRange.split('-');
        if (parts.length > 0) {
          const startParts = parts[0].trim().split(':');
          if (startParts.length === 2) {
            const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
            if (startMinutes >= currentMinutesTotal) {
              nextClass = { ...c, dayName: 'Hôm nay' };
              break;
            }
          }
        }
      }
    }
  }

  // Nếu hôm nay đã hết tiết, tìm tiết đầu tiên của các ngày tiếp theo trong tuần
  if (!nextClass) {
    for (const d of days) {
      if (d.dayOfWeekNumber > currentDayOfWeek && d.classes && d.classes.length > 0) {
        nextClass = { ...d.classes[0], dayName: d.name };
        break;
      }
    }
  }

  if (nextClass) {
    nextNameEl.textContent = nextClass.subject;
    nextDetailEl.innerHTML = `
      <span><i class="fa-regular fa-clock"></i> ${escapeHtml(nextClass.timeRange)} (${escapeHtml(nextClass.dayName)})</span>
      <span><i class="fa-solid fa-door-open"></i> ${escapeHtml(nextClass.room)}</span>
    `;
  } else {
    nextNameEl.textContent = 'Đã hoàn thành các tiết học!';
    nextDetailEl.innerHTML = `<span><i class="fa-solid fa-mug-hot"></i> Không còn tiết học sắp tới</span>`;
  }
}

/**
 * Render thanh nút lọc môn học dưới ô tìm kiếm
 */
function renderSubjectFilters(subjects = []) {
  const container = document.getElementById('subject-filter-tags');
  if (!container) return;

  container.innerHTML = '';

  if (!subjects || subjects.length === 0) return;

  // Nút Tất cả
  const allBtn = document.createElement('button');
  allBtn.className = `tag-btn ${!state.activeFilterSubject ? 'active' : ''}`;
  allBtn.textContent = 'Tất cả';
  allBtn.onclick = () => {
    state.activeFilterSubject = null;
    renderSubjectFilters(subjects);
    const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
    renderTimetableGrid(state.scheduleData.days || [], isCurrentWeek);
  };
  container.appendChild(allBtn);

  subjects.forEach(subjName => {
    const color = getSubjectColor(subjName);
    const btn = document.createElement('button');
    const isActive = state.activeFilterSubject === subjName;
    btn.className = `tag-btn ${isActive ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="tag-color-indicator" style="background-color: ${color.border};"></span>
      <span>${escapeHtml(subjName)}</span>
    `;
    btn.onclick = () => {
      state.activeFilterSubject = isActive ? null : subjName;
      renderSubjectFilters(subjects);
      const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
      renderTimetableGrid(state.scheduleData.days || [], isCurrentWeek);
    };
    container.appendChild(btn);
  });
}

/**
 * Render danh sách Lưu ý / Ghi chú từ Markdown
 */
function renderScheduleNotes(notes = []) {
  const notesBody = document.getElementById('notes-body');
  if (!notesBody) return;

  if (!notes || notes.length === 0) {
    notesBody.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Không có ghi chú nào trong tuần này.</p>`;
    return;
  }

  notesBody.innerHTML = `
    <ul>
      ${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
    </ul>
  `;
}

/**
 * Gắn sự kiện ô tìm kiếm trực tiếp (Live Search)
 */
function initSearchAndFilters() {
  // 1. Tìm kiếm Lịch học
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.oninput = () => {
      state.searchQuery = searchInput.value.trim();
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('hidden', !state.searchQuery);
        clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
      }
      const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
      renderTimetableGrid(state.scheduleData ? state.scheduleData.days || [] : [], isCurrentWeek);
    };
  }

  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      if (searchInput) searchInput.value = '';
      state.searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      clearSearchBtn.style.display = 'none';
      const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
      renderTimetableGrid(state.scheduleData ? state.scheduleData.days || [] : [], isCurrentWeek);
    };
  }

  const pingTodaySearchBtn = document.getElementById('btn-ping-today-search');
  if (pingTodaySearchBtn) {
    pingTodaySearchBtn.onclick = focusTodayTarget;
  }

  // 2. Tìm kiếm Tỉ lệ điểm
  const gradesSearch = document.getElementById('grades-search-input');
  if (gradesSearch) {
    gradesSearch.oninput = () => {
      renderGradesView(gradesSearch.value.trim());
    };
  }

  // 3. Tìm kiếm Chiếc Cặp
  const bpSearch = document.getElementById('backpack-search-input');
  const bpClear = document.getElementById('bp-clear-search-btn');
  if (bpSearch) {
    bpSearch.oninput = () => {
      const q = bpSearch.value.toLowerCase().trim();
      if (bpClear) {
        bpClear.classList.toggle('hidden', !q);
        bpClear.style.display = q ? 'block' : 'none';
      }
      document.querySelectorAll('#backpack-launcher-grid .bp-app-btn').forEach(btn => {
        if (btn.classList.contains('btn-add-app')) return;
        const text = btn.textContent.toLowerCase();
        btn.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
      });
    };
  }

  if (bpClear) {
    bpClear.onclick = () => {
      if (bpSearch) bpSearch.value = '';
      bpClear.classList.add('hidden');
      bpClear.style.display = 'none';
      document.querySelectorAll('#backpack-launcher-grid .bp-app-btn').forEach(btn => {
        btn.style.display = 'flex';
      });
    };
  }
}



/**
 * Xử lý thêm mới hoặc chỉnh sửa tiết học từ AddClassModal
 */
function handleSaveClass({ dayName, classData, isEdit, classIndex, oldDayName }) {
  if (!state.scheduleData || !state.scheduleData.days) return;

  // Nếu là sửa và người dùng đổi thứ (oldDayName !== dayName)
  if (isEdit && oldDayName && oldDayName !== dayName) {
    const oldDay = state.scheduleData.days.find(d => d.name === oldDayName);
    if (oldDay && oldDay.classes && oldDay.classes[classIndex]) {
      oldDay.classes.splice(classIndex, 1);
      if (oldDay.classes.length === 0) {
        oldDay.isDayOff = true;
        oldDay.dayOffText = (oldDay.name.includes('7') || oldDay.name.includes('Chủ Nhật')) ? 'Nghỉ ngơi cuối tuần' : 'Nghỉ';
      }
    }
    classIndex = -1; // Chuyển thành thêm mới vào ngày đích
    isEdit = false;
  }

  const day = state.scheduleData.days.find(d => d.name === dayName);
  if (!day) return;

  if (!day.classes) day.classes = [];

  if (isEdit && classIndex >= 0 && day.classes[classIndex]) {
    // Sửa tiết đã có
    day.classes[classIndex] = { ...day.classes[classIndex], ...classData };
    showToast(`Đã cập nhật tiết "${classData.subject}"`);
  } else {
    // Thêm tiết mới
    day.classes.push(classData);
    showToast(`Đã thêm tiết "${classData.subject}" vào ${day.name}`);
  }

  // Chuyển trạng thái ngày sang có tiết
  day.isDayOff = false;
  day.dayOffText = '';

  // Sắp xếp lại tiết theo giờ bắt đầu
  day.classes.sort((a, b) => {
    const startA = a.startTime ? a.startTime.replace(':', '') : '9999';
    const startB = b.startTime ? b.startTime.replace(':', '') : '9999';
    return startA.localeCompare(startB);
  });

  persistCurrentSchedule();
}

/**
 * Xóa một tiết học khỏi ngày
 */
function handleDeleteClass(dayName, classIndex, classData = null) {
  if (!state.scheduleData || !state.scheduleData.days) return;

  // 1. Tìm ngày linh hoạt (khớp chính xác hoặc khớp tương đối)
  let day = state.scheduleData.days.find(d => 
    d.name === dayName || 
    (d.name && dayName && (d.name.toLowerCase() === dayName.toLowerCase() || d.name.includes(dayName) || dayName.includes(d.name)))
  );

  if (!day || !day.classes || day.classes.length === 0) {
    showToast('Không tìm thấy ngày cần xóa!');
    return;
  }

  let removed = null;

  // 2. Ưu tiên tìm theo đối tượng classData nếu có
  if (classData && classData.subject) {
    const idx = day.classes.findIndex(c => 
      c.subject === classData.subject && 
      (c.timeRange === classData.timeRange || c.startTime === classData.startTime)
    );
    if (idx !== -1) {
      removed = day.classes.splice(idx, 1)[0];
    }
  }

  // 3. Fallback theo classIndex
  if (!removed && classIndex !== null && classIndex !== undefined && day.classes[classIndex]) {
    removed = day.classes.splice(classIndex, 1)[0];
  }

  if (!removed) {
    showToast('Không tìm thấy tiết học cần xóa!');
    return;
  }

  // 4. Nếu ngày hết tiết, chuyển sang trạng thái nghỉ
  if (day.classes.length === 0) {
    day.isDayOff = true;
    day.dayOffText = (day.name.includes('7') || day.name.includes('Chủ Nhật')) ? 'Nghỉ ngơi cuối tuần' : 'Nghỉ';
  }

  showToast(`Đã xóa tiết "${removed.subject}" (${day.name}) 🗑️`);
  persistCurrentSchedule();
}

/**
 * Đồng bộ lưu lại Markdown của tuần hiện tại và re-render giao diện
 */
function persistCurrentSchedule() {
  if (!state.scheduleData) return;

  // 1. Serialize ra Markdown
  const newMarkdown = serializeScheduleToMarkdown(state.scheduleData);
  currentRawMarkdown = newMarkdown;

  // 2. Lưu vào storage của tuần hiện tại
  if (currentWeekFile) {
    localStorage.setItem(`smart_schedule_custom_md_${currentWeekFile}`, newMarkdown);
  }

  // 3. Cập nhật Raw Editor textarea
  const rawContentEl = document.getElementById('markdown-raw-content');
  if (rawContentEl) rawContentEl.value = newMarkdown;

  // 4. Cập nhật danh sách môn học tổng hợp trong tuần
  const uniqueSubjects = new Set();
  (state.scheduleData.days || []).forEach(d => {
    (d.classes || []).forEach(c => {
      if (c.subject) uniqueSubjects.add(c.subject.trim());
    });
  });
  state.scheduleData.subjects = Array.from(uniqueSubjects);

  // 5. Re-render UI
  const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
  renderTimetableGrid(state.scheduleData.days || [], isCurrentWeek);
  renderTodayView(state.scheduleData.days || [], isCurrentWeek);
  updateHeroStats(state.scheduleData);
  renderSubjectFilters(state.scheduleData.subjects || []);
}

/**
 * Định vị & Focus vào ngày hôm nay trong Ma trận Thời khóa biểu (Mục 1)
 */
export async function focusTodayTarget() {
  // 1. Chuyển sang Tab Thời khóa biểu nếu đang ở tab khác
  switchTab('grid');

  // 2. Kiểm tra nếu tuần đang xem không phải tuần hiện tại -> Chuyển về tuần hiện tại
  const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
  if (!isCurrentWeek) {
    const todayWeekFile = getInitialWeekFilename();
    if (todayWeekFile && todayWeekFile !== currentWeekFile) {
      showToast('Đang chuyển về tuần hiện tại...');
      await loadWeekSchedule(todayWeekFile);
    }
  }

  // 3. Định vị và kích hoạt hiệu ứng Ping Target trên thẻ ngày Hôm Nay
  setTimeout(() => {
    const todayCard = document.querySelector('.day-card.is-today');
    if (todayCard) {
      todayCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      todayCard.classList.remove('ping-target-active');
      // Trigger reflow để kích hoạt lại CSS animation
      void todayCard.offsetWidth;
      todayCard.classList.add('ping-target-active');

      setTimeout(() => {
        todayCard.classList.remove('ping-target-active');
      }, 2600);

      showToast('Đã định vị ngày Hôm nay! 🎯');
    } else {
      showToast('Hôm nay không nằm trong lịch học đang hiển thị.');
    }
  }, 120);
}



/**
 * Khởi tạo Bộ điều khiển chế độ hiển thị ngày (1 Ngày / 3 Ngày / 7 Ngày)
 */
function initDaysModeSelector() {
  const container = document.getElementById('days-mode-selector');
  if (!container) return;

  const currentMode = state.daysDisplayMode || '7';
  const buttons = container.querySelectorAll('.btn-days-mode');

  // Đặt trạng thái active ban đầu
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === currentMode);
  });

  buttons.forEach(btn => {
    btn.onclick = () => {
      const selectedMode = btn.dataset.mode;
      if (state.daysDisplayMode === selectedMode) return;

      state.daysDisplayMode = selectedMode;
      persistDaysDisplayMode();

      buttons.forEach(b => b.classList.toggle('active', b.dataset.mode === selectedMode));

      // Re-render Timetable Grid
      const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
      if (state.scheduleData) {
        renderTimetableGrid(state.scheduleData.days || [], isCurrentWeek);
      }

      const modeLabels = {
        '1': '1 Ngày (Hôm nay)',
        '3': '3 Ngày (Trước / Hôm nay / Sau)',
        '7': '7 Ngày (Cả tuần)'
      };
      showToast(`Chế độ xem: ${modeLabels[selectedMode] || selectedMode + ' Ngày'}`);
    };
  });
}

/**
 * Khởi tạo Đổi Theme Sáng/Tối
 */
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (!themeBtn) return;

  themeBtn.onclick = () => {
    state.isDarkTheme = !state.isDarkTheme;
    document.body.classList.toggle('theme-light', !state.isDarkTheme);
    document.body.classList.toggle('theme-dark', state.isDarkTheme);
    
    themeBtn.innerHTML = state.isDarkTheme ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    showToast(state.isDarkTheme ? 'Đã bật chế độ Dark Theme 🌙' : 'Đã bật chế độ Light Theme ☀️');
  };
}

/**
 * Khởi tạo Nút In Lịch Học
 */
function initPrintButton() {
  const printBtn = document.getElementById('print-schedule-btn');
  if (printBtn) {
    printBtn.onclick = () => {
      window.print();
    };
  }
}

/**
 * Khởi tạo Nút Thu Gọn / Mở Rộng Hero Banner
 */
function initHeroToggle() {
  const heroBanner = document.getElementById('hero-banner');
  const toggleBtn = document.getElementById('btn-toggle-hero');
  if (!heroBanner || !toggleBtn) return;

  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    heroBanner.classList.toggle('is-collapsed');
    const isCollapsed = heroBanner.classList.contains('is-collapsed');
    const textEl = toggleBtn.querySelector('.toggle-hero-text');
    if (textEl) {
      textEl.textContent = isCollapsed ? 'Chi tiết' : 'Thu gọn';
    }
  };
}

/**
 * Khởi tạo Trình chỉnh sửa Raw Markdown
 */
function initRawMarkdownEditor() {
  const copyBtn = document.getElementById('copy-markdown-btn');
  const reloadBtn = document.getElementById('reload-markdown-btn');
  const applyBtn = document.getElementById('apply-raw-btn');
  const textarea = document.getElementById('markdown-raw-content');

  if (copyBtn && textarea) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(textarea.value).then(() => {
        showToast('Đã sao chép toàn bộ Markdown!');
      });
    };
  }

  if (reloadBtn && textarea) {
    reloadBtn.onclick = () => {
      textarea.value = currentRawMarkdown;
      showToast('Đã khôi phục nội dung Markdown ban đầu');
    };
  }

  if (applyBtn && textarea) {
    applyBtn.onclick = () => {
      const parsed = parseScheduleMarkdown(textarea.value);
      state.scheduleData = parsed;
      const isCurrentWeek = checkIsCurrentWeek(currentWeekFile);
      renderTimetableGrid(parsed.days || [], isCurrentWeek);
      renderTodayView(parsed.days || [], isCurrentWeek);
      updateHeroStats(parsed);
      switchTab('grid');
      showToast('Đã cập nhật giao diện theo Markdown tùy chỉnh!');
    };
  }
}

// Khởi động khi tải xong DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
