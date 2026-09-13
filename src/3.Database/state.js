import { INITIAL_SUBJECT_DRIVE } from './storage/SeedData.js';
import { getStorageItem, setStorageItem } from './storage/LocalStorageEngine.js';
import { isOwnerUser, getCurrentUser } from './auth/FirebaseAuthService.js';

export const STORAGE_KEYS = {
  DRIVE_SUBJECTS: 'smart_schedule_drive_v2',
  DRIVE_FOLDERS: 'smart_schedule_drive_folders_v2',
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
  driveFolders: [],
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
 * Chuyển đổi và lưu Không Gian Lịch Học đang mở (Cục bộ trên từng thiết bị)
 * @param {string} spaceId 
 * @param {Object|null} user 
 */
export function setActiveSpaceId(spaceId, user = null) {
  const activeUser = user || getCurrentUser();
  const activeSpaceKey = isOwnerUser(activeUser) ? STORAGE_KEYS.ACTIVE_SPACE_ID : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_active_space_id`;
  state.activeSpaceId = spaceId;
  setStorageItem(activeSpaceKey, spaceId);
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
 * Tự động di chuyển (merge) dữ liệu từ chế độ Khách sang tài khoản người dùng khi đăng nhập
 * @param {Object|null} user 
 */
export function mergeGuestDataIntoUser(user = null) {
  const activeUser = user || getCurrentUser();
  if (!activeUser) return;

  const isOwner = isOwnerUser(activeUser);

  // 1. Merge Drive Subjects
  const guestDriveKey = 'smart_schedule_guest_smart_schedule_drive_v2';
  const guestSubjects = getStorageItem(guestDriveKey, null);
  const targetDriveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser, 'default');
  const targetSubjects = getStorageItem(targetDriveKey, null);

  const hasGuestDriveLinks = Array.isArray(guestSubjects) && guestSubjects.some(s => s.driveUrl && s.driveUrl.trim());
  const hasTargetDriveLinks = Array.isArray(targetSubjects) && targetSubjects.some(s => s.driveUrl && s.driveUrl.trim());

  if (Array.isArray(guestSubjects) && guestSubjects.length > 0 && (!hasTargetDriveLinks || !targetSubjects || targetSubjects.length === 0)) {
    setStorageItem(targetDriveKey, guestSubjects);
    if (state.activeSpaceId === 'default') {
      state.driveSubjects = guestSubjects;
    }
  }

  // 2. Merge Spaces
  const guestSpacesKey = 'smart_schedule_guest_spaces_list';
  const guestSpaces = getStorageItem(guestSpacesKey, null);
  const targetSpacesKey = isOwner ? STORAGE_KEYS.SPACES_LIST : `smart_schedule_${activeUser.uid}_spaces_list`;
  const targetSpaces = getStorageItem(targetSpacesKey, null);

  if (Array.isArray(guestSpaces) && guestSpaces.length > 1 && (!targetSpaces || targetSpaces.length <= 1)) {
    setStorageItem(targetSpacesKey, guestSpaces);
    guestSpaces.forEach(sp => {
      if (sp.id !== 'default') {
        const gDKey = `smart_schedule_guest_smart_schedule_drive_v2_${sp.id}`;
        const gVal = getStorageItem(gDKey, null);
        if (gVal) {
          const tDKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser, sp.id);
          setStorageItem(tDKey, gVal);
        }
        const gGKey = `smart_schedule_guest_smart_schedule_grades_v1_${sp.id}`;
        const gGVal = getStorageItem(gGKey, null);
        if (gGVal) {
          const tGKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser, sp.id);
          setStorageItem(tGKey, gGVal);
        }
      }
    });
  }

  // 3. Merge Custom Weeks & Markdown
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('smart_schedule_guest_smart_schedule_custom_md_')) {
      const targetMdKey = k.replace('smart_schedule_guest_', isOwner ? '' : `smart_schedule_${activeUser.uid}_`);
      if (!localStorage.getItem(targetMdKey)) {
        localStorage.setItem(targetMdKey, localStorage.getItem(k));
      }
    }
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

  // 2. Nạp danh sách môn học Drive & Thư mục theo Space hiện tại
  const driveKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_SUBJECTS, activeUser, state.activeSpaceId);
  const savedSubjects = getStorageItem(driveKey, null);

  const foldersKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_FOLDERS, activeUser, state.activeSpaceId);
  const savedFolders = getStorageItem(foldersKey, []);
  state.driveFolders = Array.isArray(savedFolders) ? savedFolders : [];

  if (state.activeSpaceId === 'default') {
    // SPACE GỐC: Nạp dữ liệu lịch học thực tế hoặc seed data
    if (savedSubjects && Array.isArray(savedSubjects) && savedSubjects.length > 0) {
      state.driveSubjects = savedSubjects;
    } else {
      state.driveSubjects = JSON.parse(JSON.stringify(INITIAL_SUBJECT_DRIVE));
      setStorageItem(driveKey, state.driveSubjects);
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
  state.lastActiveTab = getStorageItem(lastTabKey, 'backpack');

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
 * Lưu danh sách thư mục vào Storage theo Space
 * @param {Object|null} user 
 */
export function persistDriveFolders(user = null) {
  const activeUser = user || getCurrentUser();
  const foldersKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_FOLDERS, activeUser, state.activeSpaceId);
  setStorageItem(foldersKey, state.driveFolders);
  triggerCloudSync(activeUser);
}

/**
 * Tạo một thư mục mới và gom các môn học vào thư mục đó
 * @param {string} name - Tên thư mục
 * @param {Array<string>} subjectCodes - Danh sách mã môn
 * @returns {Object} Folder object vừa tạo
 */
export function createDriveFolder(name = 'Thư mục mới', subjectCodes = []) {
  const folderId = 'fld_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newFolder = {
    id: folderId,
    name: name.trim() || 'Thư mục mới',
    color: '#6366f1',
    createdAt: Date.now()
  };

  if (!Array.isArray(state.driveFolders)) {
    state.driveFolders = [];
  }
  state.driveFolders.push(newFolder);

  // Gán folderId cho các môn con
  if (Array.isArray(subjectCodes) && subjectCodes.length > 0) {
    state.driveSubjects.forEach(s => {
      if (subjectCodes.includes(s.code)) {
        s.folderId = folderId;
      }
    });
  }

  persistDriveFolders();
  persistDriveSubjects();
  return newFolder;
}

/**
 * Thêm một môn học vào thư mục
 * @param {string} folderId 
 * @param {string} subjectCode 
 */
export function addSubjectToFolder(folderId, subjectCode) {
  const subj = state.driveSubjects.find(s => s.code === subjectCode);
  if (subj) {
    subj.folderId = folderId;
    persistDriveSubjects();
  }
}

/**
 * Tách một môn học ra khỏi thư mục (Un-group)
 * @param {string} subjectCode 
 */
export function removeSubjectFromFolder(subjectCode) {
  const subj = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subj) return;
  const prevFolderId = subj.folderId;
  subj.folderId = null;
  persistDriveSubjects();

  // Kiểm tra nếu thư mục chỉ còn 0 hoặc 1 môn thì tự động giải tán thư mục
  if (prevFolderId) {
    const remaining = state.driveSubjects.filter(s => s.folderId === prevFolderId);
    if (remaining.length <= 1) {
      // Đưa môn còn lại ra ngoài luôn và xóa thư mục
      remaining.forEach(r => { r.folderId = null; });
      removeDriveFolder(prevFolderId, true);
      persistDriveSubjects();
    }
  }
}

/**
 * Xóa hoặc giải tán thư mục
 * @param {string} folderId 
 * @param {boolean} keepSubjects - Giữ lại các môn học (trả về ngoài màn hình)
 */
export function removeDriveFolder(folderId, keepSubjects = true) {
  if (keepSubjects) {
    state.driveSubjects.forEach(s => {
      if (s.folderId === folderId) {
        s.folderId = null;
      }
    });
    persistDriveSubjects();
  } else {
    state.driveSubjects = state.driveSubjects.filter(s => s.folderId !== folderId);
    persistDriveSubjects();
  }

  state.driveFolders = (state.driveFolders || []).filter(f => f.id !== folderId);
  persistDriveFolders();
}

/**
 * Đổi tên thư mục
 * @param {string} folderId 
 * @param {string} newName 
 */
export function renameDriveFolder(folderId, newName) {
  const folder = (state.driveFolders || []).find(f => f.id === folderId);
  if (folder && newName && newName.trim()) {
    folder.name = newName.trim();
    persistDriveFolders();
  }
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
 * Lưu chế độ hiển thị ngày vào Storage (Trạng thái cục bộ từng thiết bị)
 */
export function persistDaysDisplayMode() {
  setStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, state.daysDisplayMode);
}

/**
 * Lưu Tab đang xem cuối cùng vào Storage theo User Scope (Trạng thái cục bộ từng thiết bị)
 * @param {string} tabName 
 * @param {Object|null} user 
 */
export function persistLastActiveTab(tabName, user = null) {
  const activeUser = user || getCurrentUser();
  state.lastActiveTab = tabName;
  const lastTabKey = getScopedStorageKey(STORAGE_KEYS.LAST_ACTIVE_TAB, activeUser);
  setStorageItem(lastTabKey, tabName);
}

/**
 * Lưu Tuần đang xem cuối cùng vào Storage theo User Scope và Space (Trạng thái cục bộ từng thiết bị)
 * @param {string} weekFilename 
 * @param {Object|null} user 
 */
export function persistLastSelectedWeek(weekFilename, user = null) {
  const activeUser = user || getCurrentUser();
  state.lastSelectedWeek = weekFilename;
  const lastWeekKey = getScopedStorageKey(STORAGE_KEYS.LAST_SELECTED_WEEK, activeUser, state.activeSpaceId);
  setStorageItem(lastWeekKey, weekFilename);
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
    const foldersKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_FOLDERS, activeUser, sp.id);
    const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser, sp.id);
    const customWeeksKey = getScopedStorageKey(STORAGE_KEYS.CUSTOM_WEEKS, activeUser, sp.id);

    let driveSubjectsForSpace = getStorageItem(driveKey, []);
    // Nếu đang là space hiện tại và state.driveSubjects có dữ liệu, ưu tiên lấy từ state
    if (sp.id === (state.activeSpaceId || 'default') && Array.isArray(state.driveSubjects) && state.driveSubjects.length > 0) {
      driveSubjectsForSpace = state.driveSubjects;
    }

    let driveFoldersForSpace = getStorageItem(foldersKey, []);
    if (sp.id === (state.activeSpaceId || 'default') && Array.isArray(state.driveFolders)) {
      driveFoldersForSpace = state.driveFolders;
    }

    const customMds = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes('custom_md') && (sp.id === 'default' ? !k.includes('space_') : k.includes(sp.id))) {
        customMds[k] = localStorage.getItem(k);
      }
    }

    spacesData[sp.id] = {
      driveSubjects: driveSubjectsForSpace,
      driveFolders: driveFoldersForSpace,
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
      lastActiveTab: state.lastActiveTab || state.currentTab || 'backpack',
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

    // 2. Phục hồi Cài đặt (Settings) - Chỉ áp dụng khi người dùng chủ động nhập file sao lưu thủ công
    if (!isSilent && backupData.settings) {
      const s = backupData.settings;
      if (s.theme) localStorage.setItem(STORAGE_KEYS.THEME, s.theme);
      if (s.daysDisplayMode) {
        state.daysDisplayMode = s.daysDisplayMode;
        setStorageItem(STORAGE_KEYS.DAYS_DISPLAY_MODE, s.daysDisplayMode);
      }
      if (s.lastActiveTab) {
        state.lastActiveTab = s.lastActiveTab;
        const lastTabKey = getScopedStorageKey(STORAGE_KEYS.LAST_ACTIVE_TAB, activeUser);
        setStorageItem(lastTabKey, s.lastActiveTab);
      }
      if (s.activeSpaceId) {
        state.activeSpaceId = s.activeSpaceId;
        const activeSpaceKey = isOwnerUser(activeUser) ? STORAGE_KEYS.ACTIVE_SPACE_ID : `smart_schedule_${activeUser ? activeUser.uid : 'guest'}_active_space_id`;
        setStorageItem(activeSpaceKey, s.activeSpaceId);
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
          const localSubjects = getStorageItem(driveKey, []);
          
          // Smart merge: Đảm bảo không làm mất thuộc tính nếu cloud hoặc local có
          const mergedSubjects = spData.driveSubjects.map(cloudSubj => {
            const localSubj = Array.isArray(localSubjects) ? localSubjects.find(l => l.code === cloudSubj.code) : null;
            if (!localSubj) return cloudSubj;
            return {
              ...localSubj,
              ...cloudSubj,
              folderId: cloudSubj.folderId !== undefined ? cloudSubj.folderId : (localSubj.folderId || null),
              driveUrl: (cloudSubj.driveUrl !== undefined && cloudSubj.driveUrl !== null) ? cloudSubj.driveUrl : (localSubj.driveUrl || ''),
              notes: cloudSubj.notes || localSubj.notes || '',
              gradeItems: (Array.isArray(cloudSubj.gradeItems) && cloudSubj.gradeItems.length > 0) ? cloudSubj.gradeItems : (localSubj.gradeItems || [])
            };
          });

          setStorageItem(driveKey, mergedSubjects);
          if (spaceId === (state.activeSpaceId || 'default')) {
            state.driveSubjects = mergedSubjects;
          }
        }
        if (Array.isArray(spData.driveFolders)) {
          const foldersKey = getScopedStorageKey(STORAGE_KEYS.DRIVE_FOLDERS, activeUser, spaceId);
          setStorageItem(foldersKey, spData.driveFolders);
          if (spaceId === (state.activeSpaceId || 'default')) {
            state.driveFolders = spData.driveFolders;
          }
        }
        if (spData.studentGrades && typeof spData.studentGrades === 'object') {
          const gradesKey = getScopedStorageKey(STORAGE_KEYS.GRADES, activeUser, spaceId);
          setStorageItem(gradesKey, spData.studentGrades);
          if (spaceId === (state.activeSpaceId || 'default')) {
            state.studentGrades = spData.studentGrades;
          }
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
