import { INITIAL_SUBJECT_DRIVE } from './storage/SeedData.js';
import { getStorageItem, setStorageItem } from './storage/LocalStorageEngine.js';
import { isOwnerUser, getCurrentUser } from './auth/FirebaseAuthService.js';

export const STORAGE_KEYS = {
  DRIVE_SUBJECTS: 'smart_schedule_drive_v2',
  GRADES: 'smart_schedule_grades_v1',
  THEME: 'smart_schedule_theme',
  DAYS_DISPLAY_MODE: 'smart_schedule_days_mode',
  CUSTOM_WEEKS: 'smart_schedule_custom_weeks',
  LAST_ACTIVE_TAB: 'smart_schedule_last_active_tab',
  LAST_SELECTED_WEEK: 'smart_schedule_last_selected_week'
};

/**
 * Trả về key lưu trữ theo User Scope
 * @param {string} baseKey 
 * @param {Object|null} user 
 * @returns {string}
 */
export function getScopedStorageKey(baseKey, user = null) {
  const activeUser = user || getCurrentUser();
  if (isOwnerUser(activeUser)) {
    return baseKey;
  }
  if (activeUser && activeUser.uid) {
    return `smart_schedule_${activeUser.uid}_${baseKey}`;
  }
  return `smart_schedule_guest_${baseKey}`;
}

// Khởi tạo state ban đầu
export const state = {
  // Navigation & View
  currentTab: 'backpack', // 'grid' | 'today' | 'grades' | 'backpack' | 'raw'
  lastActiveTab: 'grid',
  selectedWeek: 'tuan-35',
  lastSelectedWeek: '',
  weeks: [],
  scheduleData: null,
  daysDisplayMode: '7', // '1' | '3' | '7'
  
  // Backpack & Drive
  driveSubjects: [],
  selectedSubject: null,
  isJiggleMode: false,
  
  // Grades
  studentGrades: {},
  
  // Theme & Settings
  isDarkTheme: true
};

const listeners = [];

/**
 * Đăng ký hàm lắng nghe sự thay đổi của State
 * @param {Function} callback 
 * @returns {Function} Hàm hủy đăng ký
 */
export function subscribeState(callback) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

/**
 * Cập nhật một phần state và thông báo cho các component
 * @param {Object} partialState 
 */
export function setState(partialState) {
  Object.assign(state, partialState);
  listeners.forEach(fn => {
    try {
      fn(state);
    } catch (e) {
      console.error('[State Subscriber Error]', e);
    }
  });
}

/**
 * Nạp dữ liệu ban đầu từ LocalStorage theo phạm vi người dùng (User Scope)
 * @param {Object|null} user 
 */
export function initApplicationState(user = null) {
  const activeUser = user || getCurrentUser();
  const isOwner = isOwnerUser(activeUser);

  // 1. Nạp danh sách môn học Drive
  const driveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser);
  const savedSubjects = getStorageItem(driveKey, null);

  if (isOwner) {
    // CHỦ SỞ HỮU: Nạp dữ liệu lịch học thực tế
    if (savedSubjects && Array.isArray(savedSubjects) && savedSubjects.length > 0) {
      state.driveSubjects = savedSubjects;
    } else {
      state.driveSubjects = JSON.parse(JSON.stringify(INITIAL_SUBJECT_DRIVE));
      setStorageItem(driveKey, state.driveSubjects);
    }
  } else {
    // NGƯỜI DÙNG KHÁC / KHÁCH: Dữ liệu hoàn toàn mới (trống rỗng)
    state.driveSubjects = Array.isArray(savedSubjects) ? savedSubjects : [];
  }

  // 2. Nạp điểm số
  const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser);
  state.studentGrades = getStorageItem(gradesKey, {});

  // 3. Nạp Theme
  const savedTheme = getStorageItem(STORAGE_KEYS.THEME, 'violet');
  state.isDarkTheme = savedTheme !== 'white';

  // 4. Nạp chế độ hiển thị ngày (1, 3, 7)
  state.daysDisplayMode = getStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, '7');

  // 5. Nạp Tab và Tuần đã lưu gần nhất (Cấp độ 1 & Tips Auto-Restore)
  const lastTabKey = getScopedStorageKey(STORAGE_KEYS.LAST_ACTIVE_TAB, activeUser);
  state.lastActiveTab = getStorageItem(lastTabKey, 'grid');

  const lastWeekKey = getScopedStorageKey(STORAGE_KEYS.LAST_SELECTED_WEEK, activeUser);
  state.lastSelectedWeek = getStorageItem(lastWeekKey, '');
}

/**
 * Lưu danh sách môn học vào Storage
 * @param {Object|null} user 
 */
export function persistDriveSubjects(user = null) {
  const driveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, user);
  setStorageItem(driveKey, state.driveSubjects);
}

/**
 * Lưu điểm số vào Storage
 * @param {Object|null} user 
 */
export function persistGrades(user = null) {
  const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, user);
  setStorageItem(gradesKey, state.studentGrades);
}

/**
 * Lưu chế độ hiển thị ngày vào Storage
 */
export function persistDaysDisplayMode() {
  setStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, state.daysDisplayMode);
}

/**
 * Lưu Tab đang xem cuối cùng vào Storage theo User Scope
 * @param {string} tabName 
 * @param {Object|null} user 
 */
export function persistLastActiveTab(tabName, user = null) {
  state.lastActiveTab = tabName;
  const lastTabKey = getScopedStorageKey(STORAGE_KEYS.LAST_ACTIVE_TAB, user);
  setStorageItem(lastTabKey, tabName);
}

/**
 * Lưu Tuần đang xem cuối cùng vào Storage theo User Scope
 * @param {string} weekFilename 
 * @param {Object|null} user 
 */
export function persistLastSelectedWeek(weekFilename, user = null) {
  state.lastSelectedWeek = weekFilename;
  const lastWeekKey = getScopedStorageKey(STORAGE_KEYS.LAST_SELECTED_WEEK, user);
  setStorageItem(lastWeekKey, weekFilename);
}

/**
 * Xuất toàn bộ cấu hình và dữ liệu của người dùng ra định dạng JSON (Cấp độ 3)
 * @param {Object|null} user 
 * @returns {Object}
 */
export function exportFullBackupData(user = null) {
  const activeUser = user || getCurrentUser();
  const isOwner = isOwnerUser(activeUser);

  // Thu thập các file Markdown tùy chỉnh trong LocalStorage
  const customMds = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('smart_schedule_custom_md_')) {
      customMds[key] = localStorage.getItem(key);
    }
  }

  // Thu thập danh sách tuần tùy chỉnh theo Scope
  const customWeeksKey = isOwner ? STORAGE_KEYS.CUSTOM_WEEKS : getScopedStorageKey(STORAGE_KEYS.CUSTOM_WEEKS, activeUser);
  const customWeeks = getStorageItem(customWeeksKey, []);

  return {
    app: 'ScheduleSmart',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    user: activeUser ? {
      uid: activeUser.uid || 'guest',
      email: activeUser.email || 'guest@offline.local',
      displayName: activeUser.displayName || 'Khách Offline'
    } : { uid: 'guest', email: 'guest@offline.local', displayName: 'Khách Offline' },
    settings: {
      theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'violet',
      daysDisplayMode: state.daysDisplayMode || '7',
      lastActiveTab: state.lastActiveTab || state.currentTab || 'grid',
      lastSelectedWeek: state.lastSelectedWeek || '',
      heatmapMode: localStorage.getItem('smart_schedule_heatmap_mode') || 'week',
      heatmapBannerCollapsed: localStorage.getItem('smart_schedule_heatmap_banner_collapsed') || 'true'
    },
    data: {
      driveSubjects: state.driveSubjects || [],
      studentGrades: state.studentGrades || {},
      customWeeks: customWeeks,
      customMds: customMds
    }
  };
}

/**
 * Nhập và phục hồi dữ liệu từ file JSON sao lưu (Cấp độ 3)
 * @param {Object} backupData 
 * @param {Object|null} user 
 * @returns {{success: boolean, message: string}}
 */
export function importFullBackupData(backupData, user = null) {
  try {
    if (!backupData || typeof backupData !== 'object') {
      return { success: false, message: 'File dữ liệu không hợp lệ hoặc bị rỗng.' };
    }

    if (backupData.app !== 'ScheduleSmart' && !backupData.data) {
      return { success: false, message: 'Định dạng file không thuộc về ScheduleSmart.' };
    }

    const activeUser = user || getCurrentUser();
    const isOwner = isOwnerUser(activeUser);

    // 1. Phục hồi Cài đặt (Settings)
    if (backupData.settings) {
      const s = backupData.settings;
      if (s.theme) localStorage.setItem(STORAGE_KEYS.THEME, s.theme);
      if (s.daysDisplayMode) {
        state.daysDisplayMode = s.daysDisplayMode;
        persistDaysDisplayMode();
      }
      if (s.lastActiveTab) persistLastActiveTab(s.lastActiveTab, activeUser);
      if (s.lastSelectedWeek) persistLastSelectedWeek(s.lastSelectedWeek, activeUser);
      if (s.heatmapMode) localStorage.setItem('smart_schedule_heatmap_mode', s.heatmapMode);
      if (s.heatmapBannerCollapsed) localStorage.setItem('smart_schedule_heatmap_banner_collapsed', s.heatmapBannerCollapsed);
    }

    // 2. Phục hồi Dữ liệu (Data)
    const d = backupData.data || {};

    if (Array.isArray(d.driveSubjects)) {
      state.driveSubjects = d.driveSubjects;
      persistDriveSubjects(activeUser);
    }

    if (d.studentGrades && typeof d.studentGrades === 'object') {
      state.studentGrades = d.studentGrades;
      persistGrades(activeUser);
    }

    if (Array.isArray(d.customWeeks)) {
      const customWeeksKey = isOwner ? STORAGE_KEYS.CUSTOM_WEEKS : getScopedStorageKey(STORAGE_KEYS.CUSTOM_WEEKS, activeUser);
      setStorageItem(customWeeksKey, d.customWeeks);
    }

    if (d.customMds && typeof d.customMds === 'object') {
      Object.keys(d.customMds).forEach(k => {
        if (typeof d.customMds[k] === 'string') {
          localStorage.setItem(k, d.customMds[k]);
        }
      });
    }

    return { success: true, message: 'Phục hồi toàn bộ trạng thái setup và dữ liệu thành công! ✨' };
  } catch (err) {
    console.error('[Import Backup Error]', err);
    return { success: false, message: `Lỗi xử lý file: ${err.message}` };
  }
}
