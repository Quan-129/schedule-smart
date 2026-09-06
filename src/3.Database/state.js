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
  LAST_SELECTED_WEEK: 'smart_schedule_last_selected_week',
  SPACES_LIST: 'smart_schedule_spaces_list',
  ACTIVE_SPACE_ID: 'smart_schedule_active_space_id'
};

/**
 * Trả về key lưu trữ theo User Scope và Space ID
 * @param {string} baseKey 
 * @param {Object|null} user 
 * @param {string|null} spaceId
 * @returns {string}
 */
export function getScopedStorageKey(baseKey, user = null, spaceId = null) {
  const activeUser = user || getCurrentUser();
  const currentSpace = spaceId !== null ? spaceId : (state.activeSpaceId || 'default');
  const spaceSuffix = currentSpace && currentSpace !== 'default' ? `_${currentSpace}` : '';

  if (isOwnerUser(activeUser)) {
    return `${baseKey}${spaceSuffix}`;
  }
  if (activeUser && activeUser.uid) {
    return `smart_schedule_${activeUser.uid}_${baseKey}${spaceSuffix}`;
  }
  return `smart_schedule_guest_${baseKey}${spaceSuffix}`;
}

// Khởi tạo state ban đầu
export const state = {
  // Không gian Lịch Học (Schedule Spaces / Profiles)
  spaces: [],
  activeSpaceId: 'default',

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
 * ==========================================================================
 * KHÔNG GIAN LỊCH HỌC (SCHEDULE SPACES ENGINE)
 * ==========================================================================
 */

/**
 * Lấy danh sách tất cả các Không Gian Lịch Học
 * @param {Object|null} user 
 * @returns {Array<Object>}
 */
export function getAllSpaces(user = null) {
  const activeUser = user || getCurrentUser();
  const spacesKey = isOwnerUser(activeUser) ? STORAGE_KEYS.SPACES_LIST : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_spaces_list`;
  const saved = getStorageItem(spacesKey, null);

  if (Array.isArray(saved) && saved.length > 0) {
    // Tự động chuẩn hóa icon nếu còn lưu class fontawesome cũ
    let hasChanged = false;
    const normalized = saved.map(s => {
      let icon = s.icon;
      let name = s.name;
      if (icon === 'fa-solid fa-graduation-cap' || !icon || icon.includes('fa-')) {
        icon = '🎓';
        hasChanged = true;
      }
      if (s.id === 'default' && (name === 'HK1 2026–2027 (Chính khóa)' || name === 'HK1 2026–2027')) {
        name = 'Học Kỳ 1';
        hasChanged = true;
      }
      return { ...s, icon, name };
    });
    if (hasChanged) {
      setStorageItem(spacesKey, normalized);
    }
    return normalized;
  }

  // Khởi tạo không gian mặc định ban đầu
  const defaultSpaces = [
    {
      id: 'default',
      name: 'Học Kỳ 1',
      code: 'HK1',
      icon: '🎓',
      color: '#6366f1',
      isArchived: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      lastSelectedWeek: ''
    }
  ];
  setStorageItem(spacesKey, defaultSpaces);
  return defaultSpaces;
}

/**
 * Lấy Không Gian Lịch Học hiện đang mở
 * @param {Object|null} user 
 * @returns {Object}
 */
export function getActiveSpace(user = null) {
  const spaces = getAllSpaces(user);
  const found = spaces.find(s => s.id === state.activeSpaceId);
  return found || spaces[0] || { id: 'default', name: 'Học Kỳ 1', code: 'HK1', icon: '🎓' };
}

// Trạng thái cờ chống xung đột / echo loop khi nhận dữ liệu snapshot từ xa
let isApplyingRemoteUpdate = false;

/**
 * Bật/tắt cờ Remote Update để ngăn chặn loop đồng bộ
 * @param {boolean} val 
 */
export function setApplyingRemoteUpdateFlag(val) {
  isApplyingRemoteUpdate = Boolean(val);
}

/**
 * Lấy trạng thái cờ Remote Update
 * @returns {boolean}
 */
export function getApplyingRemoteUpdateFlag() {
  return isApplyingRemoteUpdate;
}

/**
 * Kích hoạt đồng bộ State lên Cloud trong nền
 * @param {Object|null} user 
 */
export function triggerCloudSync(user = null) {
  if (isApplyingRemoteUpdate) {
    // Đang trong quá trình nạp snapshot từ Cloud về máy, không gửi ngược lại
    return;
  }
  try {
    if (typeof window !== 'undefined' && typeof window.__scheduleSmartSyncToCloud === 'function') {
      window.__scheduleSmartSyncToCloud(user);
    }
  } catch (e) {
    console.warn('[State] Cloud Sync Trigger Warning:', e);
  }
}

/**
 * Lưu danh sách Spaces vào Storage
 * @param {Array<Object>} spacesList 
 * @param {Object|null} user 
 */
export function persistSpacesList(spacesList, user = null) {
  const activeUser = user || getCurrentUser();
  const spacesKey = isOwnerUser(activeUser) ? STORAGE_KEYS.SPACES_LIST : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_spaces_list`;
  state.spaces = spacesList;
  setStorageItem(spacesKey, spacesList);
  triggerCloudSync(activeUser);
}

/**
 * Chuyển đổi và lưu Không Gian Lịch Học đang mở
 * @param {string} spaceId 
 * @param {Object|null} user 
 */
export function setActiveSpaceId(spaceId, user = null) {
  const activeUser = user || getCurrentUser();
  const activeSpaceKey = isOwnerUser(activeUser) ? STORAGE_KEYS.ACTIVE_SPACE_ID : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_active_space_id`;
  state.activeSpaceId = spaceId;
  setStorageItem(activeSpaceKey, spaceId);
  triggerCloudSync(activeUser);
}

/**
 * Tạo một Không Gian Lịch Học mới
 * @param {Object} spaceData 
 * @param {Object|null} user 
 * @returns {Object} Không gian vừa tạo
 */
export function createSpace(spaceData, user = null) {
  const spaces = getAllSpaces(user);
  const newSpace = {
    id: `space_${Date.now()}`,
    name: spaceData.name || 'Học Kỳ Mới',
    code: spaceData.code || 'HK',
    icon: spaceData.icon || 'fa-solid fa-calendar-days',
    color: spaceData.color || '#38bdf8',
    isArchived: false,
    createdAt: new Date().toISOString(),
    lastSelectedWeek: ''
  };

  spaces.push(newSpace);
  persistSpacesList(spaces, user);
  setActiveSpaceId(newSpace.id, user);
  return newSpace;
}

/**
 * Cập nhật thông tin một Không Gian Lịch
 * @param {string} spaceId 
 * @param {Object} patch 
 * @param {Object|null} user 
 */
export function updateSpace(spaceId, patch = {}, user = null) {
  const spaces = getAllSpaces(user);
  const target = spaces.find(s => s.id === spaceId);
  if (target) {
    Object.assign(target, patch);
    persistSpacesList(spaces, user);
  }
}

/**
 * Lưu trữ / Bỏ lưu trữ một Không Gian Lịch
 * @param {string} spaceId 
 * @param {boolean} isArchived 
 * @param {Object|null} user 
 */
export function archiveSpace(spaceId, isArchived = true, user = null) {
  updateSpace(spaceId, { isArchived }, user);
}

/**
 * Xóa một Không Gian Lịch và dọn dẹp dữ liệu của không gian đó
 * @param {string} spaceId 
 * @param {Object|null} user 
 */
export function deleteSpace(spaceId, user = null) {
  if (spaceId === 'default') {
    console.warn('[Space] Không thể xóa không gian mặc định');
    return;
  }

  const spaces = getAllSpaces(user).filter(s => s.id !== spaceId);
  persistSpacesList(spaces, user);

  // Xóa các key liên quan đến space này trong LocalStorage
  const prefix = getScopedStorageKey('', user, spaceId);
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes(spaceId)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // Nếu đang đứng ở space bị xóa, chuyển về space đầu tiên
  if (state.activeSpaceId === spaceId) {
    const fallbackSpace = spaces[0] || { id: 'default' };
    state.activeSpaceId = fallbackSpace.id;
    setActiveSpaceId(fallbackSpace.id, user);
  }
}

/**
 * Nạp dữ liệu ban đầu từ LocalStorage theo phạm vi người dùng & Không Gian Lịch (User & Space Scope)
 * @param {Object|null} user 
 */
export function initApplicationState(user = null) {
  const activeUser = user || getCurrentUser();
  const isOwner = isOwnerUser(activeUser);

  // 1. Nạp danh sách Spaces & Active Space ID
  state.spaces = getAllSpaces(activeUser);
  const activeSpaceKey = isOwner ? STORAGE_KEYS.ACTIVE_SPACE_ID : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_active_space_id`;
  const savedActiveSpaceId = getStorageItem(activeSpaceKey, 'default');
  state.activeSpaceId = state.spaces.some(s => s.id === savedActiveSpaceId) ? savedActiveSpaceId : 'default';

  // 2. Nạp danh sách môn học Drive theo Space hiện tại
  const driveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser, state.activeSpaceId);
  const savedSubjects = getStorageItem(driveKey, null);

  if (state.activeSpaceId === 'default') {
    // SPACE GỐC: Nạp dữ liệu lịch học thực tế hoặc seed data
    if (savedSubjects && Array.isArray(savedSubjects) && savedSubjects.length > 0) {
      state.driveSubjects = savedSubjects;
    } else if (isOwner) {
      state.driveSubjects = JSON.parse(JSON.stringify(INITIAL_SUBJECT_DRIVE));
      setStorageItem(driveKey, state.driveSubjects);
    } else {
      state.driveSubjects = Array.isArray(savedSubjects) ? savedSubjects : [];
    }
  } else {
    // CÁC SPACES KHÁC: Dữ liệu độc lập
    state.driveSubjects = Array.isArray(savedSubjects) ? savedSubjects : [];
  }

  // 3. Nạp điểm số theo Space
  const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser, state.activeSpaceId);
  state.studentGrades = getStorageItem(gradesKey, {});

  // 4. Nạp Theme
  const savedTheme = getStorageItem(STORAGE_KEYS.THEME, 'violet');
  state.isDarkTheme = savedTheme !== 'white';

  // 5. Nạp chế độ hiển thị ngày (1, 3, 7)
  state.daysDisplayMode = getStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, '7');

  // 6. Nạp Tab và Tuần đã lưu gần nhất (Cấp độ 1 & Tips Auto-Restore)
  const lastTabKey = getScopedStorageKey(STORAGE_KEYS.LAST_ACTIVE_TAB, activeUser);
  state.lastActiveTab = getStorageItem(lastTabKey, 'grid');

  const lastWeekKey = getScopedStorageKey(STORAGE_KEYS.LAST_SELECTED_WEEK, activeUser, state.activeSpaceId);
  state.lastSelectedWeek = getStorageItem(lastWeekKey, '');
}

/**
 * Lưu danh sách môn học vào Storage theo Space
 * @param {Object|null} user 
 */
export function persistDriveSubjects(user = null) {
  const activeUser = user || getCurrentUser();
  const driveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser, state.activeSpaceId);
  setStorageItem(driveKey, state.driveSubjects);
  triggerCloudSync(activeUser);
}

/**
 * Lưu điểm số vào Storage theo Space
 * @param {Object|null} user 
 */
export function persistGrades(user = null) {
  const activeUser = user || getCurrentUser();
  const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser, state.activeSpaceId);
  setStorageItem(gradesKey, state.studentGrades);
  triggerCloudSync(activeUser);
}

/**
 * Lưu chế độ hiển thị ngày vào Storage
 */
export function persistDaysDisplayMode() {
  setStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, state.daysDisplayMode);
  triggerCloudSync(getCurrentUser());
}

/**
 * Lưu Tab đang xem cuối cùng vào Storage theo User Scope
 * @param {string} tabName 
 * @param {Object|null} user 
 */
export function persistLastActiveTab(tabName, user = null) {
  const activeUser = user || getCurrentUser();
  state.lastActiveTab = tabName;
  const lastTabKey = getScopedStorageKey(STORAGE_KEYS.LAST_ACTIVE_TAB, activeUser);
  setStorageItem(lastTabKey, tabName);
  triggerCloudSync(activeUser);
}

/**
 * Lưu Tuần đang xem cuối cùng vào Storage theo User Scope và Space
 * @param {string} weekFilename 
 * @param {Object|null} user 
 */
export function persistLastSelectedWeek(weekFilename, user = null) {
  const activeUser = user || getCurrentUser();
  state.lastSelectedWeek = weekFilename;
  const lastWeekKey = getScopedStorageKey(STORAGE_KEYS.LAST_SELECTED_WEEK, activeUser, state.activeSpaceId);
  setStorageItem(lastWeekKey, weekFilename);

  // Cập nhật vào đối tượng Space
  updateSpace(state.activeSpaceId, { lastSelectedWeek: weekFilename }, activeUser);
  triggerCloudSync(activeUser);
}

/**
 * Xuất toàn bộ cấu hình và dữ liệu của tất cả các Spaces ra định dạng JSON (Cấp độ 3)
 * @param {Object|null} user 
 * @returns {Object}
 */
export function exportFullBackupData(user = null) {
  const activeUser = user || getCurrentUser();
  const spaces = getAllSpaces(activeUser);

  // Thu thập dữ liệu của tất cả các spaces trong LocalStorage
  const spacesData = {};
  spaces.forEach(sp => {
    const driveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser, sp.id);
    const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser, sp.id);
    const customWeeksKey = getScopedStorageKey(STORAGE_KEYS.CUSTOM_WEEKS, activeUser, sp.id);

    const customMds = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes('custom_md') && (sp.id === 'default' ? !k.includes('space_') : k.includes(sp.id))) {
        customMds[k] = localStorage.getItem(k);
      }
    }

    spacesData[sp.id] = {
      driveSubjects: getStorageItem(driveKey, []),
      studentGrades: getStorageItem(gradesKey, {}),
      customWeeks: getStorageItem(customWeeksKey, []),
      customMds: customMds
    };
  });

  return {
    app: 'ScheduleSmart',
    version: '2.1.0',
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
      activeSpaceId: state.activeSpaceId || 'default',
      heatmapMode: localStorage.getItem('smart_schedule_heatmap_mode') || 'week',
      heatmapBannerCollapsed: localStorage.getItem('smart_schedule_heatmap_banner_collapsed') || 'true'
    },
    spaces: spaces,
    data: spacesData
  };
}

/**
 * Nhập và phục hồi dữ liệu từ file JSON sao lưu (Cấp độ 3)
 * @param {Object} backupData 
 * @param {Object|null} user 
 * @param {Object} options - { isSilent: boolean } nếu là true thì không kích hoạt cloud sync ngược lại
 * @returns {{success: boolean, message: string}}
 */
export function importFullBackupData(backupData, user = null, options = {}) {
  try {
    if (!backupData || typeof backupData !== 'object') {
      return { success: false, message: 'File dữ liệu không hợp lệ hoặc bị rỗng.' };
    }

    if (backupData.app !== 'ScheduleSmart' && !backupData.data) {
      return { success: false, message: 'Định dạng file không thuộc về ScheduleSmart.' };
    }

    const activeUser = user || getCurrentUser();
    const isSilent = options.isSilent === true;

    // 1. Phục hồi danh sách Spaces
    if (Array.isArray(backupData.spaces) && backupData.spaces.length > 0) {
      if (isSilent) {
        const spacesKey = isOwnerUser(activeUser) ? STORAGE_KEYS.SPACES_LIST : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_spaces_list`;
        state.spaces = backupData.spaces;
        setStorageItem(spacesKey, backupData.spaces);
      } else {
        persistSpacesList(backupData.spaces, activeUser);
      }
    }

    // 2. Phục hồi Cài đặt (Settings)
    if (backupData.settings) {
      const s = backupData.settings;
      if (s.theme) localStorage.setItem(STORAGE_KEYS.THEME, s.theme);
      if (s.daysDisplayMode) {
        state.daysDisplayMode = s.daysDisplayMode;
        if (isSilent) {
          setStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, s.daysDisplayMode);
        } else {
          persistDaysDisplayMode();
        }
      }
      if (s.lastActiveTab) {
        state.lastActiveTab = s.lastActiveTab;
        if (isSilent) {
          const lastTabKey = getScopedStorageKey(STORAGE_KEYS.LAST_ACTIVE_TAB, activeUser);
          setStorageItem(lastTabKey, s.lastActiveTab);
        } else {
          persistLastActiveTab(s.lastActiveTab, activeUser);
        }
      }
      if (s.activeSpaceId) {
        state.activeSpaceId = s.activeSpaceId;
        if (isSilent) {
          const activeSpaceKey = isOwnerUser(activeUser) ? STORAGE_KEYS.ACTIVE_SPACE_ID : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_active_space_id`;
          setStorageItem(activeSpaceKey, s.activeSpaceId);
        } else {
          setActiveSpaceId(s.activeSpaceId, activeUser);
        }
      }
      if (s.heatmapMode) localStorage.setItem('smart_schedule_heatmap_mode', s.heatmapMode);
      if (s.heatmapBannerCollapsed) localStorage.setItem('smart_schedule_heatmap_banner_collapsed', s.heatmapBannerCollapsed);
    }

    // 3. Phục hồi Dữ liệu từng Space
    const d = backupData.data || {};
    Object.keys(d).forEach(spaceId => {
      const spData = d[spaceId];
      if (spData) {
        if (Array.isArray(spData.driveSubjects)) {
          const driveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser, spaceId);
          setStorageItem(driveKey, spData.driveSubjects);
        }
        if (spData.studentGrades && typeof spData.studentGrades === 'object') {
          const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser, spaceId);
          setStorageItem(gradesKey, spData.studentGrades);
        }
        if (Array.isArray(spData.customWeeks)) {
          const customWeeksKey = getScopedStorageKey(STORAGE_KEYS.CUSTOM_WEEKS, activeUser, spaceId);
          setStorageItem(customWeeksKey, spData.customWeeks);
        }
        if (spData.customMds && typeof spData.customMds === 'object') {
          Object.keys(spData.customMds).forEach(k => {
            if (typeof spData.customMds[k] === 'string') {
              localStorage.setItem(k, spData.customMds[k]);
            }
          });
        }
      }
    });

    return { success: true, message: 'Phục hồi toàn bộ Không Gian Lịch Học & Cài Đặt thành công! ✨' };
  } catch (err) {
    console.error('[Import Backup Error]', err);
    return { success: false, message: `Lỗi xử lý file: ${err.message}` };
  }
}
