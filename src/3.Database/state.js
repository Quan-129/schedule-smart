import { INITIAL_SUBJECT_DRIVE } from './storage/SeedData.js';
import { getStorageItem, setStorageItem } from './storage/LocalStorageEngine.js';
import { isOwnerUser, getCurrentUser } from './auth/FirebaseAuthService.js';

export const STORAGE_KEYS = {
  DRIVE_SUBJECTS: 'smart_schedule_drive_v2',
  GRADES: 'smart_schedule_grades_v1',
  THEME: 'smart_schedule_theme',
  DAYS_DISPLAY_MODE: 'smart_schedule_days_mode',
  CUSTOM_WEEKS: 'smart_schedule_custom_weeks'
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
  currentTab: 'backpack', // 'schedule' | 'backpack' | 'grades'
  selectedWeek: 'tuan-35',
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
  const savedTheme = getStorageItem(STORAGE_KEYS.THEME, 'dark');
  state.isDarkTheme = savedTheme === 'dark';

  // 4. Nạp chế độ hiển thị ngày (1, 3, 7)
  state.daysDisplayMode = getStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, '7');
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
