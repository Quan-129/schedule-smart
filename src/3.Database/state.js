/**
 * ==========================================================================
 * DATABASE - CENTRALIZED STATE MANAGEMENT
 * Quản lý trạng thái trung tâm duy nhất cho toàn bộ ứng dụng (Single Source of Truth)
 * ==========================================================================
 */

import { INITIAL_SUBJECT_DRIVE } from './storage/SeedData.js';
import { getStorageItem, setStorageItem } from './storage/LocalStorageEngine.js';

export const STORAGE_KEYS = {
  DRIVE_SUBJECTS: 'smart_schedule_drive_v2',
  GRADES: 'smart_schedule_grades_v1',
  THEME: 'smart_schedule_theme',
  DAYS_DISPLAY_MODE: 'smart_schedule_days_mode'
};

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
 * Nạp dữ liệu ban đầu từ LocalStorage
 */
export function initApplicationState() {
  // 1. Nạp danh sách môn học Drive
  const savedSubjects = getStorageItem(STORAGE_KEYS.DRIVE_SUBJECTS, null);
  if (savedSubjects && Array.isArray(savedSubjects) && savedSubjects.length > 0) {
    state.driveSubjects = savedSubjects;
  } else {
    state.driveSubjects = JSON.parse(JSON.stringify(INITIAL_SUBJECT_DRIVE));
    setStorageItem(STORAGE_KEYS.DRIVE_SUBJECTS, state.driveSubjects);
  }

  // 2. Nạp điểm số
  state.studentGrades = getStorageItem(STORAGE_KEYS.GRADES, {});

  // 3. Nạp Theme
  const savedTheme = getStorageItem(STORAGE_KEYS.THEME, 'dark');
  state.isDarkTheme = savedTheme === 'dark';

  // 4. Nạp chế độ hiển thị ngày (1, 3, 7)
  state.daysDisplayMode = getStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, '7');
}

/**
 * Lưu danh sách môn học vào Storage
 */
export function persistDriveSubjects() {
  setStorageItem(STORAGE_KEYS.DRIVE_SUBJECTS, state.driveSubjects);
}

/**
 * Lưu điểm số vào Storage
 */
export function persistGrades() {
  setStorageItem(STORAGE_KEYS.GRADES, state.studentGrades);
}

/**
 * Lưu chế độ hiển thị ngày vào Storage
 */
export function persistDaysDisplayMode() {
  setStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, state.daysDisplayMode);
}
