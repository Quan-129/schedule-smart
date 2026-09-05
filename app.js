/**
 * ==========================================================================
 * LỊCH HỌC MARKDOWN HUB & CHIẾC CẶP GOOGLE DRIVE (FIREBASE CLOUD SYNC)
 * ==========================================================================
 */

// Embedded default fallback schedule if running locally via file:// without web server
const DEFAULT_WEEK_35_MD = `# Lịch học Tuần 35

## Thứ 2
- 10:00 - 11:50 (Tiết 5 - 6): Quản lý Dự án cho Kỹ sư | Phòng: B1-212 (CS1)
- 14:00 - 15:50 (Tiết 9 - 10): Tư tưởng Hồ Chí Minh | Phòng: B4-505 (CS1)

## Thứ 3
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)
- 13:00 - 14:50 (Tiết 8 - 9): Nhập môn Trí tuệ Nhân tạo | Phòng: B4-301 (CS1)

## Thứ 4
- 07:00 - 08:50 (Tiết 2 - 3): Pháp luật Việt Nam Đại cương | Phòng: C4-402 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 5
- 07:00 - 08:50 (Tiết 2 - 3): Tiếp thị Căn bản | Phòng: B4-303 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 6
- 07:00 - 08:50 (Tiết 2 - 3): Học máy | Phòng: B1-305 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 7 & Chủ Nhật
- Nghỉ.

## Lưu ý nhỏ:
- Môn Đồ án Chuyên ngành đã bắt đầu tính từ tuần 35, bạn nhớ chủ động sắp xếp thời gian làm việc với giáo viên hướng dẫn nhé.
- Tuần này bạn học Tiếng Nhật 7 liên tục 4 buổi sáng (từ Thứ 3 đến Thứ 6).`;

const DEFAULT_WEEK_36_MD = `# Lịch học Tuần 36

## Thứ 2, Thứ 3 & Thứ 4
- Nghỉ (Lịch trống hoàn toàn, khả năng cao là nghỉ Lễ Quốc khánh 2/9).

## Thứ 5
- 07:00 - 08:50 (Tiết 2 - 3): Tiếp thị Căn bản | Phòng: B4-303 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 6
- 07:00 - 08:50 (Tiết 2 - 3): Học máy | Phòng: B1-305 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 7 & Chủ Nhật
- Nghỉ.

## Lưu ý nhỏ:
- Tuần này bạn được nghỉ từ Thứ 2 đến hết Thứ 4, lịch học trên trường chỉ tập trung vào buổi sáng Thứ 5 và Thứ 6.
- Môn Đồ án Chuyên ngành vẫn tiếp tục tiến độ, bạn nhớ tự sắp xếp thời gian làm việc nhé.`;

// Pre-defined color palettes for subjects
const SUBJECT_COLORS = [
  { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', text: '#f472b6' },
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', text: '#22d3ee' },
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24' },
  { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },
  { border: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', text: '#2dd4bf' },
  { border: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', text: '#fb923c' },
  { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa' }
];

// Unified Clean Subject List with Dynamic Grade Schemes & Speed-Dial Drive Launcher
const INITIAL_SUBJECT_DRIVE = [
  {
    code: 'CO3117',
    name: 'Học máy',
    englishName: 'Machine Learning',
    credits: 3,
    lecturers: 'Lê Thành Sách, Trương Vĩnh Lân, Nguyễn Đức Dũng, Lê Hồng Trang, Võ Thanh Hùng, Nguyễn An Khương',
    department: 'Khoa Khoa học & Kỹ thuật Máy tính (CSE)',
    icon: 'fa-solid fa-robot',
    color: '#6366f1',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 60, type: 'Tự luận', duration: '90 phút', color: '#6366f1', note: 'Từ chương 6 đến chương 10' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận', duration: '60 phút', color: '#ec4899', note: 'Đến hết chương 5' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Assignment)', weight: 10, type: 'Project nhóm thực hành', duration: '45 tiết', color: '#10b981', note: 'Triển khai mô hình bài toán thực tế' }
    ],
    notes: 'Quy định AI: Chỉ cho phép dùng hỗ trợ tìm kiếm tài liệu. Nghiêm cấm nộp sản phẩm hoàn toàn do AI tạo ra.'
  },
  {
    code: 'IM1025',
    name: 'Quản lý Dự án cho Kỹ sư',
    englishName: 'Project Management for Engineers',
    credits: 3,
    lecturers: 'Huỳnh Thị Phương Lan, Nguyễn Thùy Trang, Nguyễn Thị Đức Nguyên, Nguyễn Bắc Nguyên, Đường Võ Hùng, Lê Phước Luông',
    department: 'Khoa Quản Lý Công Nghiệp (SIM)',
    icon: 'fa-solid fa-diagram-project',
    color: '#f59e0b',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 40, type: 'Trắc nghiệm chấm máy', duration: '70 phút', color: '#6366f1', note: 'Bắt buộc tham gia >= 80% số giờ học' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Trắc nghiệm chấm máy', duration: '50 phút', color: '#f59e0b', note: 'Đánh giá kiến thức nửa đầu học kỳ' },
      { id: 'item-cn', name: 'Bài tập cá nhân (Individual)', weight: 15, type: 'Bài tập về nhà & Phản tư', duration: '--', color: '#06b6d4', note: 'Đánh giá nhận thức cá nhân' },
      { id: 'item-nhom', name: 'Bài tập nhóm (Group Assignment)', weight: 15, type: 'Báo cáo dự án & Thuyết trình', duration: '--', color: '#10b981', note: 'Phối hợp làm việc nhóm' }
    ],
    notes: 'Nộp bài trễ trên LMS bị trừ 2 điểm/ngày. Tham dự tối thiểu 80% số giờ học là điều kiện bắt buộc.'
  },
  {
    code: 'IM1019',
    name: 'Tiếp thị Căn bản',
    englishName: 'Principle of Marketing',
    credits: 3,
    lecturers: 'Bùi Huy Hải Bích, Phạm Ngọc Trâm Anh, Mai Thị Mỹ Quyên, Nguyễn Văn Tuấn, Dương Thị Ngọc Liên, Lê Nguyễn Hậu',
    department: 'Khoa Quản Lý Công Nghiệp (SIM)',
    icon: 'fa-solid fa-chart-line',
    color: '#ec4899',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Trắc nghiệm', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung theo lịch chung' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Project)', weight: 30, type: 'Dự án nhóm & Thuyết trình', duration: 'Nhóm 6-7 SV', color: '#ec4899', note: 'Vắng thuyết trình BTL bị 0 điểm BTL' },
      { id: 'item-tx', name: 'Đánh giá thường xuyên (Formative)', weight: 20, type: 'Bài tập trên lớp / Online', duration: '--', color: '#10b981', note: 'Vắng bài tập nào bị 0 điểm bài đó' }
    ],
    notes: 'Sinh viên làm việc nhóm 6-7 người. Vắng buổi thuyết trình BTL bị 0 điểm BTL.'
  },
  {
    code: 'CO3061',
    name: 'Nhập môn Trí tuệ Nhân tạo',
    englishName: 'Introduction to Artificial Intelligence',
    credits: 3,
    lecturers: 'Bộ môn Khoa học Máy tính',
    department: 'Khoa Khoa học và Kỹ thuật Máy tính (CSE)',
    icon: 'fa-solid fa-brain',
    color: '#06b6d4',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Tự luận / Trắc nghiệm', duration: '90 phút', color: '#6366f1', note: 'Đánh giá toàn diện các chủ đề AI' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận / Trắc nghiệm', duration: '60 phút', color: '#f59e0b', note: 'Thuật toán tìm kiếm, Logic, CSP' },
      { id: 'item-btl', name: 'Bài tập lớn / Thực hành', weight: 20, type: 'Project lập trình AI theo nhóm', duration: 'Hạn: 30/11', color: '#10b981', note: 'Cài đặt thuật toán & nộp báo cáo' }
    ],
    notes: 'Deadline nộp Bài tập lớn vào Thứ 2 (30/11/2026).'
  },
  {
    code: 'SP1035',
    name: 'Tư tưởng Hồ Chí Minh',
    englishName: 'Ho Chi Minh Ideology',
    credits: 2,
    lecturers: 'Bộ môn Lý luận Chính trị',
    department: 'Khoa Khoa học Ứng dụng',
    icon: 'fa-solid fa-landmark',
    color: '#10b981',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Trắc nghiệm / Tự luận', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung cuối kỳ' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Chuyên cần & Trắc nghiệm online', duration: '--', color: '#ec4899', note: 'Bài tập trên hệ thống BKEL' }
    ],
    notes: 'Tuần 47 là tuần học cuối môn.'
  },
  {
    code: 'SP1039',
    name: 'Pháp luật Việt Nam Đại cương',
    englishName: 'General Vietnamese Law',
    credits: 2,
    lecturers: 'Bộ môn Khoa học Xã hội',
    department: 'Khoa Khoa học Ứng dụng',
    icon: 'fa-solid fa-scale-balanced',
    color: '#8b5cf6',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 70, type: 'Trắc nghiệm', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung cuối kỳ' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Giữa kỳ & Thảo luận)', weight: 30, type: 'Trắc nghiệm online / Bài tập lớp', duration: '--', color: '#f59e0b', note: 'Kiểm tra trên hệ thống BKEL' }
    ],
    notes: 'Tuần 47 là tuần học cuối môn.'
  },
  {
    code: 'JP1007',
    name: 'Tiếng Nhật 7',
    englishName: 'Japanese 7',
    credits: 4,
    lecturers: 'Giảng viên Bộ môn Ngoại ngữ',
    department: 'Văn phòng Đào tạo Quốc tế (OISP)',
    icon: 'fa-solid fa-torii-gate',
    color: '#14b8a6',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Nghe, Đọc, Viết & Kaiwa', duration: '90 phút', color: '#6366f1', note: 'Đánh giá toàn diện 4 kỹ năng' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Kiểm tra từ vựng, Kaiwa, Chuyên cần', duration: '--', color: '#10b981', note: 'Kiểm tra định kỳ theo từng tuần học' }
    ],
    notes: 'Lịch học 4 buổi sáng liên tục mỗi tuần (Thứ 3 đến Thứ 6).'
  }
];

// Fallback constant for backwards compatibility
const GRADE_SCHEMES = INITIAL_SUBJECT_DRIVE;

// Firebase Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfFsMGvFKQSOk1HgzT-QtNc66thwjEOLE",
  authDomain: "schedule-smart-ee05e.firebaseapp.com",
  projectId: "schedule-smart-ee05e",
  storageBucket: "schedule-smart-ee05e.firebasestorage.app",
  messagingSenderId: "1036082312669",
  appId: "1:1036082312669:web:0b3d8d2fedeeedf889f234",
  measurementId: "G-9CE6MNZT5Z"
};

// Initialize Firebase App, Auth & Firestore
let firebaseApp = null;
let auth = null;
let db = null;
let currentUser = null;
let firestoreUnsubscribe = null;

try {
  if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
  }
} catch (e) {
  console.warn('Firebase init error:', e);
}

// App State
const state = {
  currentWeekFile: 'schedules/tuan-35.md',
  currentRawMarkdown: '',
  parsedSchedule: null,
  activeFilterSubject: null,
  searchQuery: '',
  gradesSearchQuery: '',
  backpackSearchQuery: '',
  activeView: 'grid', // 'grid', 'today', 'grades', 'backpack', 'raw'
  isJiggleMode: false, // iOS Jiggle Delete Mode state
  weeksList: [
    { id: 'tuan-35', title: 'Tuần 35', filename: 'schedules/tuan-35.md' },
    { id: 'tuan-36', title: 'Tuần 36', filename: 'schedules/tuan-36.md' }
  ],
  subjectColorMap: new Map(),
  driveSubjects: [] // Speed dial subjects
};

// DOM Elements
const elements = {
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  weekSelect: document.getElementById('week-select'),
  prevWeekBtn: document.getElementById('prev-week-btn'),
  nextWeekBtn: document.getElementById('next-week-btn'),
  
  viewGridBtn: document.getElementById('view-grid-btn'),
  viewTodayBtn: document.getElementById('view-today-btn'),
  viewGradesBtn: document.getElementById('view-grades-btn'),
  viewBackpackBtn: document.getElementById('view-backpack-btn'),
  viewRawBtn: document.getElementById('view-raw-btn'),
  
  gridViewContainer: document.getElementById('grid-view-container'),
  todayViewContainer: document.getElementById('today-view-container'),
  gradesViewContainer: document.getElementById('grades-view-container'),
  backpackViewContainer: document.getElementById('backpack-view-container'),
  rawViewContainer: document.getElementById('raw-view-container'),
  
  scheduleGrid: document.getElementById('schedule-grid'),
  todayTimelineList: document.getElementById('today-timeline-list'),
  todayTitleBadge: document.getElementById('today-title-badge'),
  todaySummaryText: document.getElementById('today-summary-text'),
  
  gradesGrid: document.getElementById('grades-grid'),
  gradesSearchInput: document.getElementById('grades-search-input'),
  
  // User Auth Elements
  loginScreen: document.getElementById('login-screen'),
  mainAppWrapper: document.getElementById('main-app-wrapper'),
  landingLoginBtn: document.getElementById('landing-login-btn'),
  authLoginBtn: document.getElementById('auth-login-btn'),
  userProfileWidget: document.getElementById('user-profile-widget'),
  userAvatar: document.getElementById('user-avatar'),
  userDisplayName: document.getElementById('user-display-name'),
  authLogoutBtn: document.getElementById('auth-logout-btn'),

  // Speed Dial Backpack Elements
  backpackLauncherGrid: document.getElementById('backpack-launcher-grid'),
  bpAddSubjectBtn: document.getElementById('bp-add-subject-btn'),
  bpDoneJiggleBtn: document.getElementById('bp-done-jiggle-btn'),
  backpackSearchInput: document.getElementById('backpack-search-input'),
  bpClearSearchBtn: document.getElementById('bp-clear-search-btn'),
  
  // Edit Subject & Grade Modal
  editDriveModal: document.getElementById('edit-drive-modal'),
  editDriveForm: document.getElementById('edit-drive-form'),
  editDriveSubjectCode: document.getElementById('edit-drive-subject-code'),
  editDriveModalTitle: document.getElementById('edit-drive-modal-title'),
  editDriveModalSub: document.getElementById('edit-drive-modal-sub'),
  editDriveUrlInput: document.getElementById('edit-drive-url-input'),
  editDriveDeleteBtn: document.getElementById('edit-drive-delete-btn'),
  editDriveCloseBtn: document.getElementById('edit-drive-close-btn'),
  editDriveCancelBtn: document.getElementById('edit-drive-cancel-btn'),
  editGradeTotalBadge: document.getElementById('edit-grade-total-badge'),
  gradeItemsEditorContainer: document.getElementById('grade-items-editor-container'),
  btnAddGradeItem: document.getElementById('btn-add-grade-item'),
  editSubjectNotesInput: document.getElementById('edit-subject-notes-input'),
  
  // Add Subject Modal
  addSubjectModal: document.getElementById('add-subject-modal'),
  addSubjectForm: document.getElementById('add-subject-form'),
  newSubjNameInput: document.getElementById('new-subj-name-input'),
  newSubjCodeInput: document.getElementById('new-subj-code-input'),
  newSubjDriveInput: document.getElementById('new-subj-drive-input'),
  addSubjectCloseBtn: document.getElementById('add-subject-close-btn'),
  addSubjectCancelBtn: document.getElementById('add-subject-cancel-btn'),
  
  scheduleTitle: document.getElementById('schedule-title'),
  scheduleSubtitle: document.getElementById('schedule-subtitle'),
  currentDateText: document.getElementById('current-date-text'),
  nextClassName: document.getElementById('next-class-name'),
  nextClassDetail: document.getElementById('next-class-detail'),
  statTotalClasses: document.getElementById('stat-total-classes'),
  statTotalSubjects: document.getElementById('stat-total-subjects'),
  printScheduleBtn: document.getElementById('print-schedule-btn'),
  
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  subjectFilterTags: document.getElementById('subject-filter-tags'),
  
  notesSection: document.getElementById('notes-section'),
  notesBody: document.getElementById('notes-body'),
  
  rawFileName: document.getElementById('raw-file-name'),
  markdownRawContent: document.getElementById('markdown-raw-content'),
  copyMarkdownBtn: document.getElementById('copy-markdown-btn'),
  reloadMarkdownBtn: document.getElementById('reload-markdown-btn'),
  applyRawBtn: document.getElementById('apply-raw-btn'),
  toastContainer: document.getElementById('toast-container')
};

/* ==========================================================================
   FIREBASE AUTH & CLOUD FIRESTORE SYNCHRONIZATION
   ========================================================================== */

function initFirebaseAuth() {
  if (!auth) return;

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUserAuthUI(user);

    if (user) {
      // User is logged in -> Listen to Firestore Realtime updates
      attachFirestoreListener(user.uid);
      showToast(`Xin chào, ${user.displayName || 'bạn'}! Đã kết nối Cloud.`);
    } else {
      // User logged out -> detach listener
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = null;
      }
    }
  });

  const handleGoogleLogin = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (err) {
      console.error('Google Sign In Error:', err);
      showToast('Lỗi đăng nhập: ' + (err.message || 'Vui lòng kiểm tra lại'));
    }
  };

  if (elements.landingLoginBtn) {
    elements.landingLoginBtn.addEventListener('click', handleGoogleLogin);
  }

  if (elements.authLoginBtn) {
    elements.authLoginBtn.addEventListener('click', handleGoogleLogin);
  }

  if (elements.authLogoutBtn) {
    elements.authLogoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        showToast('Đã đăng xuất tài khoản');
      } catch (err) {
        console.error('Logout Error:', err);
      }
    });
  }
}

function updateUserAuthUI(user) {
  if (user) {
    // Hide Landing Login Screen & Show Main App
    if (elements.loginScreen) {
      elements.loginScreen.style.display = 'none';
      elements.loginScreen.classList.add('hidden');
    }
    if (elements.mainAppWrapper) {
      elements.mainAppWrapper.style.display = 'block';
      elements.mainAppWrapper.classList.remove('hidden');
    }
    if (elements.authLoginBtn) {
      elements.authLoginBtn.style.display = 'none';
      elements.authLoginBtn.classList.add('hidden');
    }
    if (elements.userProfileWidget) {
      elements.userProfileWidget.style.display = 'inline-flex';
      elements.userProfileWidget.classList.remove('hidden');
      if (elements.userAvatar) {
        elements.userAvatar.src = user.photoURL || 'https://lh3.googleusercontent.com/a/default-user';
      }
      if (elements.userDisplayName) {
        elements.userDisplayName.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'Sinh viên');
      }
    }
  } else {
    // Show Landing Login Screen & Hide Main App
    if (elements.loginScreen) {
      elements.loginScreen.style.display = 'flex';
      elements.loginScreen.classList.remove('hidden');
    }
    if (elements.mainAppWrapper) {
      elements.mainAppWrapper.style.display = 'none';
      elements.mainAppWrapper.classList.add('hidden');
    }
    if (elements.authLoginBtn) {
      elements.authLoginBtn.style.display = 'none';
      elements.authLoginBtn.classList.add('hidden');
    }
    if (elements.userProfileWidget) {
      elements.userProfileWidget.style.display = 'none';
      elements.userProfileWidget.classList.add('hidden');
    }
  }
}

function attachFirestoreListener(uid) {
  if (!db) return;

  const docRef = db.collection('users').doc(uid);

  if (firestoreUnsubscribe) firestoreUnsubscribe();

  firestoreUnsubscribe = docRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (Array.isArray(data.driveSubjects)) {
        state.driveSubjects = data.driveSubjects;
        renderBackpackView();
        renderGradesView(state.gradesSearchQuery || '');
      }
    } else {
      // Upload existing local state to initialize user document
      docRef.set({
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        driveSubjects: state.driveSubjects,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }, (err) => {
    console.warn('Firestore snapshot error:', err);
  });
}

/* ==========================================================================
   MARKDOWN PARSER
   ========================================================================== */

function parseScheduleMarkdown(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const result = { title: 'Lịch học', days: [], notes: [] };

  let currentDay = null;
  let inNotesSection = false;

  const titleRegex = /^#\s+(.+)$/i;
  const dayHeaderRegex = /^(?:##\s+)?(Thứ\s+[2-7]|Thứ\s+7\s*&\s*Chủ\s+Nhật|Chủ\s+Nhật)/i;
  const notesHeaderRegex = /^(?:##\s+)?(Lưu\s+ý(?:\s+nhỏ)?|Ghi\s+chú):?/i;
  const classItemRegex = /^(?:[-*]\s*)?(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})(?:\s*\(([^)]+)\))?:\s*([^|]+)(?:\|\s*(?:Phòng:\s*)?(.+))?$/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const titleMatch = rawLine.match(titleRegex);
    if (titleMatch && !result.titleSet) {
      result.title = titleMatch[1].trim();
      result.titleSet = true;
      continue;
    }

    const notesMatch = rawLine.match(notesHeaderRegex);
    if (notesMatch) {
      inNotesSection = true;
      currentDay = null;
      continue;
    }

    if (inNotesSection) {
      const cleanNote = rawLine.replace(/^[-*]\s*/, '').trim();
      if (cleanNote) result.notes.push(cleanNote);
      continue;
    }

    const dayMatch = rawLine.match(dayHeaderRegex);
    if (dayMatch) {
      currentDay = {
        name: dayMatch[1].trim(),
        dayOfWeekNumber: getDayNumber(dayMatch[1].trim()),
        classes: [],
        isDayOff: false,
        rawNotes: []
      };
      result.days.push(currentDay);
      continue;
    }

    if (currentDay) {
      if (/^(?:[-*]\s*)?Nghỉ/i.test(rawLine)) {
        currentDay.isDayOff = true;
        currentDay.dayOffText = rawLine.replace(/^[-*]\s*/, '').trim();
        continue;
      }

      const classMatch = rawLine.match(classItemRegex);
      if (classMatch) {
        const timeRange = classMatch[1].trim();
        const period = classMatch[2] ? classMatch[2].trim() : '';
        const subject = classMatch[3].trim();
        const room = classMatch[4] ? classMatch[4].trim() : 'Chưa xếp phòng';
        const [startTime, endTime] = timeRange.split('-').map(t => t.trim());

        currentDay.classes.push({ timeRange, startTime, endTime, period, subject, room });
      } else {
        const cleanText = rawLine.replace(/^[-*]\s*/, '').trim();
        if (cleanText) currentDay.rawNotes.push(cleanText);
      }
    }
  }

  return result;
}

function getDayNumber(dayName) {
  const normalized = dayName.toLowerCase();
  if (normalized.includes('thứ 2')) return 1;
  if (normalized.includes('thứ 3')) return 2;
  if (normalized.includes('thứ 4')) return 3;
  if (normalized.includes('thứ 5')) return 4;
  if (normalized.includes('thứ 6')) return 5;
  if (normalized.includes('thứ 7')) return 6;
  if (normalized.includes('chủ nhật')) return 0;
  return -1;
}

function getSubjectColor(subjectName) {
  const normalized = subjectName.trim();
  if (!state.subjectColorMap.has(normalized)) {
    const colorIndex = state.subjectColorMap.size % SUBJECT_COLORS.length;
    state.subjectColorMap.set(normalized, SUBJECT_COLORS[colorIndex]);
  }
  return state.subjectColorMap.get(normalized);
}

/* ==========================================================================
   SCHEDULE RENDERING
   ========================================================================== */

function renderSchedule() {
  if (!state.parsedSchedule) return;

  const { title, days, notes } = state.parsedSchedule;
  const today = new Date();
  const currentDayOfWeek = today.getDay();

  elements.scheduleTitle.textContent = title;
  elements.scheduleSubtitle.textContent = `Hiển thị dữ liệu từ ${state.currentWeekFile}`;
  if (elements.rawFileName) elements.rawFileName.textContent = state.currentWeekFile;

  let totalClasses = 0;
  const uniqueSubjects = new Set();
  
  const currentWeekInfo = state.weeksList.find(w => w.filename === state.currentWeekFile);
  let startDate = null;
  if (currentWeekInfo && currentWeekInfo.startDate) {
    startDate = new Date(currentWeekInfo.startDate);
  }

  days.forEach(d => {
    totalClasses += d.classes.length;
    d.classes.forEach(c => uniqueSubjects.add(c.subject));
    
    if (startDate && d.dayOfWeekNumber !== -1) {
      let offset = d.dayOfWeekNumber === 0 ? 6 : d.dayOfWeekNumber - 1;
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + offset);
      const dateStr = dayDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      
      if (!d.name.includes(dateStr)) {
        if (d.name.toLowerCase().includes('chủ nhật') && d.name.toLowerCase().includes('thứ 7')) {
          const sunDate = new Date(startDate);
          sunDate.setDate(sunDate.getDate() + 6);
          const sunDateStr = sunDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          d.name = `Thứ 7 (${dateStr}) & Chủ Nhật (${sunDateStr})`;
        } else {
          d.name = `${d.name} (${dateStr})`;
        }
      }
    }
  });

  elements.statTotalClasses.textContent = `${totalClasses} buổi học`;
  elements.statTotalSubjects.textContent = `${uniqueSubjects.size} môn học`;

  renderSubjectFilters(Array.from(uniqueSubjects));
  renderGridView(days, currentDayOfWeek);
  renderTodayView(days, currentDayOfWeek);
  renderNotesView(notes);
  updateNextClassBadge(days, currentDayOfWeek);
}

function renderSubjectFilters(subjects) {
  elements.subjectFilterTags.innerHTML = '';
  
  const allBtn = document.createElement('button');
  allBtn.className = `tag-btn ${!state.activeFilterSubject ? 'active' : ''}`;
  allBtn.innerHTML = `Tất cả môn (${subjects.length})`;
  allBtn.addEventListener('click', () => {
    state.activeFilterSubject = null;
    renderSchedule();
  });
  elements.subjectFilterTags.appendChild(allBtn);

  subjects.forEach(subject => {
    const color = getSubjectColor(subject);
    const btn = document.createElement('button');
    btn.className = `tag-btn ${state.activeFilterSubject === subject ? 'active' : ''}`;
    btn.innerHTML = `<span class="tag-color-indicator" style="background-color: ${color.border}"></span> ${subject}`;
    btn.addEventListener('click', () => {
      state.activeFilterSubject = state.activeFilterSubject === subject ? null : subject;
      renderSchedule();
    });
    elements.subjectFilterTags.appendChild(btn);
  });
}

function renderGridView(days, currentDayOfWeek) {
  elements.scheduleGrid.innerHTML = '';

  days.forEach(day => {
    let filteredClasses = day.classes;

    if (state.activeFilterSubject) {
      filteredClasses = filteredClasses.filter(c => c.subject === state.activeFilterSubject);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const normalizedDayName = day.name.toLowerCase();
      const dayMatches = normalizedDayName.includes(q) || normalizedDayName.replace(/\//g, '-').includes(q);
      
      if (!dayMatches) {
        filteredClasses = filteredClasses.filter(c => 
          c.subject.toLowerCase().includes(q) ||
          c.room.toLowerCase().includes(q) ||
          c.timeRange.toLowerCase().includes(q) ||
          c.period.toLowerCase().includes(q)
        );
      }
    }

    const isToday = (day.dayOfWeekNumber === currentDayOfWeek) || 
      (day.name.includes('Thứ 7 & Chủ Nhật') && (currentDayOfWeek === 6 || currentDayOfWeek === 0));

    const dayCard = document.createElement('div');
    dayCard.className = `day-card ${isToday ? 'is-today' : ''}`;

    let classesHtml = '';

    if (day.isDayOff) {
      classesHtml = `
        <div class="day-off-card">
          <div class="day-off-icon"><i class="fa-solid fa-mug-hot"></i></div>
          <div class="day-off-text">${escapeHtml(day.dayOffText || 'Nghỉ ngơi')}</div>
        </div>
      `;
    } else if (filteredClasses.length === 0) {
      if (day.classes.length > 0 && (state.searchQuery || state.activeFilterSubject)) {
        classesHtml = `<div class="day-off-card"><p class="day-off-text">Không tìm thấy môn phù hợp</p></div>`;
      } else {
        classesHtml = `
          <div class="day-off-card">
            <div class="day-off-icon"><i class="fa-regular fa-calendar-check"></i></div>
            <div class="day-off-text">Không có tiết học</div>
          </div>
        `;
      }
    } else {
      classesHtml = `<div class="classes-list">` + filteredClasses.map(c => {
        const color = getSubjectColor(c.subject);
        return `
          <div class="class-item" style="border-left-color: ${color.border};">
            <div class="class-time-row">
              <span class="class-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(c.timeRange)}</span>
              ${c.period ? `<span class="class-period">${escapeHtml(c.period)}</span>` : ''}
            </div>
            <div class="class-subject-name" style="color: ${color.text || 'inherit'};">${escapeHtml(c.subject)}</div>
            <div class="class-room-row">
              <span class="class-room"><i class="fa-solid fa-door-open"></i> ${escapeHtml(c.room)}</span>
              <div class="class-actions-group">
                <button class="btn-view-subject-grade" title="Xem tỉ lệ điểm môn ${escapeHtml(c.subject)}" onclick="viewSubjectGrade('${escapeHtml(c.subject)}')">
                  <i class="fa-solid fa-chart-pie"></i>
                </button>
                <button class="btn-view-subject-backpack" title="Mở nhanh Google Drive môn ${escapeHtml(c.subject)}" onclick="viewSubjectBackpack('${escapeHtml(c.subject)}')">
                  <i class="fa-brands fa-google-drive"></i>
                </button>
                <button class="btn-copy-info" title="Sao chép thông tin tiết học" onclick="copyClassInfo('${escapeHtml(c.subject)}', '${escapeHtml(c.timeRange)}', '${escapeHtml(c.room)}')">
                  <i class="fa-regular fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('') + `</div>`;
    }

    dayCard.innerHTML = `
      <div class="day-header">
        <h3 class="day-title">
          <span>${escapeHtml(day.name)}</span>
          ${isToday ? `<span class="badge-today">Hôm nay</span>` : ''}
        </h3>
        <span class="class-count-badge">${day.classes.length} tiết</span>
      </div>
      ${classesHtml}
    `;

    elements.scheduleGrid.appendChild(dayCard);
  });
}

function renderTodayView(days, currentDayOfWeek) {
  elements.todayTimelineList.innerHTML = '';
  
  const todayDay = days.find(d => 
    d.dayOfWeekNumber === currentDayOfWeek || 
    (d.name.includes('Thứ 7 & Chủ Nhật') && (currentDayOfWeek === 6 || currentDayOfWeek === 0))
  );

  if (!todayDay || todayDay.isDayOff || todayDay.classes.length === 0) {
    elements.todaySummaryText.textContent = `Hôm nay bạn không có lịch học. Tận hưởng thời gian nghỉ ngơi nhé!`;
    elements.todayTimelineList.innerHTML = `
      <div class="day-off-card" style="padding: 3rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-mug-hot"></i></div>
        <h3>Hôm nay được nghỉ!</h3>
        <p>Không có buổi học nào được ghi nhận trong lịch tuần này.</p>
      </div>
    `;
    return;
  }

  elements.todaySummaryText.textContent = `Hôm nay (${todayDay.name}) bạn có ${todayDay.classes.length} buổi học cần tham gia:`;

  todayDay.classes.forEach(c => {
    const color = getSubjectColor(c.subject);
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.style.borderLeft = `4px solid ${color.border}`;
    
    item.innerHTML = `
      <div class="class-time-row">
        <span class="class-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(c.timeRange)}</span>
        ${c.period ? `<span class="class-period">${escapeHtml(c.period)}</span>` : ''}
      </div>
      <h3 style="color: ${color.text || 'inherit'}; font-size: 1.15rem; font-weight: 700;">${escapeHtml(c.subject)}</h3>
      <div class="class-room-row">
        <span class="class-room" style="font-size: 0.95rem;"><i class="fa-solid fa-location-dot"></i> Phòng: ${escapeHtml(c.room)}</span>
        <div class="class-actions-group">
          <button class="btn-view-subject-grade" title="Xem tỉ lệ điểm môn ${escapeHtml(c.subject)}" onclick="viewSubjectGrade('${escapeHtml(c.subject)}')">
            <i class="fa-solid fa-chart-pie"></i>
          </button>
          <button class="btn-view-subject-backpack" title="Mở nhanh Google Drive môn ${escapeHtml(c.subject)}" onclick="viewSubjectBackpack('${escapeHtml(c.subject)}')">
            <i class="fa-brands fa-google-drive"></i>
          </button>
        </div>
      </div>
    `;
    elements.todayTimelineList.appendChild(item);
  });
}

/* ==========================================================================
   GRADE SCHEMES & DONUT PIE CHARTS (DYNAMIC FROM SUBJECT HUB)
   ========================================================================== */

function generateDonutChartSvg(items = [], schemeCode = '') {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  if (!items || items.length === 0 || totalWeight === 0) {
    return `
      <div class="donut-chart-wrapper" id="donut-wrapper-${schemeCode}">
        <svg class="donut-svg" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="20" opacity="0.3" />
        </svg>
        <div class="donut-center-info" id="donut-center-${schemeCode}">
          <span class="donut-center-val" style="font-size: 0.9rem;">0%</span>
          <span class="donut-center-label">Chưa có %</span>
        </div>
      </div>
    `;
  }

  let cumulative = 0;
  const slices = items.map((item, idx) => {
    const weightNum = Number(item.weight) || 0;
    const strokeDash = (weightNum / totalWeight) * circumference;
    const strokeOffset = -(cumulative / totalWeight) * circumference;
    cumulative += weightNum;

    return `
      <circle class="donut-slice" 
        cx="70" cy="70" r="${radius}" 
        stroke="${item.color || '#6366f1'}" 
        stroke-dasharray="${strokeDash} ${circumference}" 
        stroke-dashoffset="${strokeOffset}"
        data-scheme="${schemeCode}"
        data-weight="${weightNum}%"
        data-name="${escapeHtml(item.name || '')}"
        title="${escapeHtml(item.name || '')}: ${weightNum}%"
        onclick="highlightGradeSlice('${schemeCode}', '${idx}', '${escapeHtml(item.name || '')}', '${weightNum}%')"
      />
    `;
  }).join('');

  return `
    <div class="donut-chart-wrapper" id="donut-wrapper-${schemeCode}">
      <svg class="donut-svg" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="20" opacity="0.3" />
        ${slices}
      </svg>
      <div class="donut-center-info" id="donut-center-${schemeCode}">
        <span class="donut-center-val">${totalWeight}%</span>
        <span class="donut-center-label">Tổng điểm</span>
      </div>
    </div>
  `;
}

window.highlightGradeSlice = function(schemeCode, itemIdx, itemName, itemWeight) {
  const centerElem = document.getElementById(`donut-center-${schemeCode}`);
  if (centerElem) {
    centerElem.innerHTML = `
      <span class="donut-center-val" style="font-size: 0.95rem; color: var(--accent-primary);">${itemWeight}</span>
      <span class="donut-center-label" style="font-size: 0.58rem; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemName}</span>
    `;
  }
  showToast(`${itemName}: ${itemWeight}`);
};

function renderGradesView(filterQuery = '') {
  if (!elements.gradesGrid) return;
  elements.gradesGrid.innerHTML = '';

  const q = filterQuery.toLowerCase().trim();
  const filteredSchemes = (state.driveSubjects || []).filter(s => 
    !q || 
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.englishName && s.englishName.toLowerCase().includes(q)) ||
    (s.code && s.code.toLowerCase().includes(q)) ||
    (s.department && s.department.toLowerCase().includes(q)) ||
    (s.lecturers && s.lecturers.toLowerCase().includes(q))
  );

  if (filteredSchemes.length === 0) {
    elements.gradesGrid.innerHTML = `
      <div class="day-off-card" style="grid-column: 1 / -1; padding: 3rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>Không tìm thấy môn học</h3>
        <p>Thử tìm kiếm với từ khóa khác như "Học máy", "Quản lý", "CO3117", "IM1025"... hoặc thêm môn mới trong Chiếc Cặp.</p>
      </div>
    `;
    return;
  }

  filteredSchemes.forEach(scheme => {
    const card = document.createElement('div');
    card.className = 'grade-card';
    card.id = `grade-card-${scheme.code.toLowerCase()}`;

    const gradeItems = scheme.gradeItems || [];
    const chartSvg = generateDonutChartSvg(gradeItems, scheme.code.toLowerCase());

    const breakdownHtml = gradeItems.length > 0 ? gradeItems.map((item, idx) => `
      <div class="breakdown-item" style="border-left-color: ${item.color || '#6366f1'}; cursor: pointer;" onclick="highlightGradeSlice('${scheme.code.toLowerCase()}', '${idx}', '${escapeHtml(item.name)}', '${item.weight}%')">
        <div class="breakdown-row">
          <span class="breakdown-name">
            <span class="breakdown-color-dot" style="background-color: ${item.color || '#6366f1'};"></span>
            ${escapeHtml(item.name)}
          </span>
          <span class="breakdown-weight" style="color: ${item.color || '#6366f1'};">${item.weight}%</span>
        </div>
        <div class="breakdown-detail">
          <span class="breakdown-type"><i class="fa-regular fa-file-lines"></i> ${escapeHtml(item.type || 'Đánh giá')}</span>
          ${item.duration && item.duration !== '--' ? `<span><i class="fa-regular fa-clock"></i> ${escapeHtml(item.duration)}</span>` : ''}
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-bar-fill" style="width: ${item.weight}%; background-color: ${item.color || '#6366f1'};"></div>
        </div>
      </div>
    `).join('') : `
      <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        Chưa có tỉ lệ điểm. Bấm "Sửa Tỉ Lệ" để thiết lập.
      </div>
    `;

    card.innerHTML = `
      <div class="grade-card-header">
        <div class="grade-title-group">
          <h3 class="grade-subject-title">
            <i class="${scheme.icon || 'fa-solid fa-book-bookmark'}" style="color: var(--accent-primary); font-size: 0.95rem;"></i>
            ${escapeHtml(scheme.name)}
          </h3>
          ${scheme.englishName ? `<span class="grade-subject-en">${escapeHtml(scheme.englishName)}</span>` : ''}
          ${scheme.department ? `<span class="grade-department"><i class="fa-solid fa-building-columns"></i> ${escapeHtml(scheme.department)}</span>` : ''}
        </div>
        <div class="grade-badges">
          <span class="badge-code">${escapeHtml(scheme.code)}</span>
          ${scheme.credits ? `<span class="badge-credits">${scheme.credits} Tín chỉ</span>` : ''}
          <button class="btn-edit-grade-scheme" title="Chỉnh sửa thông số & tỉ lệ điểm môn ${escapeHtml(scheme.name)}" onclick="editSubjectGradeScheme('${escapeHtml(scheme.code)}', event)">
            <i class="fa-solid fa-pen-to-square"></i> Sửa Tỉ Lệ
          </button>
        </div>
      </div>

      <div class="grade-card-body">
        ${chartSvg}
        <div class="grade-breakdown-list">
          ${breakdownHtml}
        </div>
      </div>

      ${scheme.notes ? `
        <div class="grade-card-footer">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>${escapeHtml(scheme.notes)}</span>
        </div>
      ` : ''}
    `;

    elements.gradesGrid.appendChild(card);
  });
}

window.editSubjectGradeScheme = function(subjectCode, event) {
  if (event) event.stopPropagation();
  openEditDriveModal(subjectCode);
};

window.viewSubjectGrade = function(subjectName) {
  switchView('grades');
  if (elements.gradesSearchInput) {
    elements.gradesSearchInput.value = subjectName;
    renderGradesView(subjectName);
  }
  
  setTimeout(() => {
    const matchingScheme = state.driveSubjects.find(s => 
      s.name.toLowerCase().includes(subjectName.toLowerCase()) || 
      subjectName.toLowerCase().includes(s.name.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectName.toLowerCase())
    );
    if (matchingScheme) {
      const cardElem = document.getElementById(`grade-card-${matchingScheme.code.toLowerCase()}`);
      if (cardElem) {
        cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardElem.style.borderColor = 'var(--accent-primary)';
        cardElem.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.4)';
        setTimeout(() => {
          cardElem.style.borderColor = '';
          cardElem.style.boxShadow = '';
        }, 2500);
      }
    }
  }, 100);
};

/* ==========================================================================
   SPEED-DIAL 1-CHẠM GOOGLE DRIVE, DYNAMIC GRADE EDITOR & iOS JIGGLE
   ========================================================================== */

function loadDriveData() {
  try {
    const saved = localStorage.getItem('smart_backpack_subjects_speeddial');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with initial defaults to ensure full schema (gradeItems, englishName, etc.)
        state.driveSubjects = parsed.map(item => {
          const defaultItem = INITIAL_SUBJECT_DRIVE.find(d => d.code === item.code);
          if (!item.gradeItems || !Array.isArray(item.gradeItems) || item.gradeItems.length === 0) {
            return {
              ...(defaultItem || {}),
              ...item,
              gradeItems: defaultItem ? JSON.parse(JSON.stringify(defaultItem.gradeItems)) : [
                { id: 'item-ck', name: 'Thi cuối kỳ', weight: 50, type: 'Tự luận', color: '#6366f1' },
                { id: 'item-qt', name: 'Quá trình / GK', weight: 50, type: 'Kiểm tra', color: '#ec4899' }
              ]
            };
          }
          return {
            ...(defaultItem || {}),
            ...item
          };
        });
        return;
      }
    }
  } catch (e) {
    console.warn('Could not parse saved drive data from localStorage', e);
  }
  state.driveSubjects = JSON.parse(JSON.stringify(INITIAL_SUBJECT_DRIVE));
}

function saveDriveData() {
  try {
    localStorage.setItem('smart_backpack_subjects_speeddial', JSON.stringify(state.driveSubjects));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }

  // If user is logged in with Firebase, sync directly to Firestore!
  if (currentUser && db) {
    db.collection('users').doc(currentUser.uid).set({
      driveSubjects: state.driveSubjects,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => {
      console.warn('Could not sync to Firestore:', err);
    });
  }
}

/**
 * Dynamic Grade Breakdown Editor Helpers
 */
function renderGradeEditorRows(gradeItems = []) {
  if (!elements.gradeItemsEditorContainer) return;
  elements.gradeItemsEditorContainer.innerHTML = '';

  const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];

  gradeItems.forEach((item, index) => {
    const color = item.color || palette[index % palette.length];
    const row = document.createElement('div');
    row.className = 'grade-item-row';
    row.innerHTML = `
      <div class="grade-row-name">
        <input type="text" class="input-grade-name" placeholder="Tên cột (VD: Cuối kỳ, GK...)" value="${escapeHtml(item.name || '')}" required>
      </div>
      <div class="grade-row-weight">
        <input type="number" class="input-grade-weight" min="0" max="100" step="1" value="${item.weight !== undefined ? item.weight : 0}" required>
        <span class="weight-unit">%</span>
      </div>
      <div class="grade-row-type">
        <input type="text" class="input-grade-type" placeholder="Loại (Tự luận, BTL...)" value="${escapeHtml(item.type || '')}">
      </div>
      <div class="grade-row-color">
        <input type="color" class="input-grade-color" value="${color}" title="Chọn màu nhận diện">
      </div>
      <button type="button" class="btn-delete-grade-row" title="Xóa cột điểm này">
        <i class="fa-solid fa-minus"></i>
      </button>
    `;

    const weightInput = row.querySelector('.input-grade-weight');
    weightInput.addEventListener('input', calculateGradeTotal);

    const deleteBtn = row.querySelector('.btn-delete-grade-row');
    deleteBtn.addEventListener('click', () => {
      row.remove();
      calculateGradeTotal();
    });

    elements.gradeItemsEditorContainer.appendChild(row);
  });

  calculateGradeTotal();
}

function addGradeEditorRow(item = {}) {
  if (!elements.gradeItemsEditorContainer) return;

  const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];
  const currentIndex = elements.gradeItemsEditorContainer.querySelectorAll('.grade-item-row').length;
  const color = item.color || palette[currentIndex % palette.length];

  const row = document.createElement('div');
  row.className = 'grade-item-row';
  row.innerHTML = `
    <div class="grade-row-name">
      <input type="text" class="input-grade-name" placeholder="Tên cột (VD: Chuyên cần, Quiz...)" value="${escapeHtml(item.name || '')}" required>
    </div>
    <div class="grade-row-weight">
      <input type="number" class="input-grade-weight" min="0" max="100" step="1" value="${item.weight !== undefined ? item.weight : 10}" required>
      <span class="weight-unit">%</span>
    </div>
    <div class="grade-row-type">
      <input type="text" class="input-grade-type" placeholder="Loại (Tự luận, BTL...)" value="${escapeHtml(item.type || '')}">
    </div>
    <div class="grade-row-color">
      <input type="color" class="input-grade-color" value="${color}" title="Chọn màu nhận diện">
    </div>
    <button type="button" class="btn-delete-grade-row" title="Xóa cột điểm này">
      <i class="fa-solid fa-minus"></i>
    </button>
  `;

  const weightInput = row.querySelector('.input-grade-weight');
  weightInput.addEventListener('input', calculateGradeTotal);

  const deleteBtn = row.querySelector('.btn-delete-grade-row');
  deleteBtn.addEventListener('click', () => {
    row.remove();
    calculateGradeTotal();
  });

  elements.gradeItemsEditorContainer.appendChild(row);
  row.querySelector('.input-grade-name').focus();
  calculateGradeTotal();
}

function calculateGradeTotal() {
  if (!elements.gradeItemsEditorContainer || !elements.editGradeTotalBadge) return 0;

  const rows = elements.gradeItemsEditorContainer.querySelectorAll('.grade-item-row');
  let total = 0;
  rows.forEach(r => {
    const w = parseFloat(r.querySelector('.input-grade-weight')?.value) || 0;
    total += w;
  });

  elements.editGradeTotalBadge.classList.remove('valid', 'invalid', 'overflow');

  if (total === 100) {
    elements.editGradeTotalBadge.classList.add('valid');
    elements.editGradeTotalBadge.innerHTML = `<i class="fa-solid fa-check"></i> Tổng: 100% (Chuẩn)`;
  } else if (total > 100) {
    elements.editGradeTotalBadge.classList.add('overflow');
    elements.editGradeTotalBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Tổng: ${total}% (Thừa ${total - 100}%)`;
  } else {
    elements.editGradeTotalBadge.classList.add('invalid');
    elements.editGradeTotalBadge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Tổng: ${total}% (Thiếu ${100 - total}%)`;
  }

  return total;
}

function getGradeEditorData() {
  if (!elements.gradeItemsEditorContainer) return [];
  const rows = elements.gradeItemsEditorContainer.querySelectorAll('.grade-item-row');
  const items = [];
  rows.forEach((r, idx) => {
    const name = r.querySelector('.input-grade-name')?.value.trim() || `Cột ${idx + 1}`;
    const weight = parseFloat(r.querySelector('.input-grade-weight')?.value) || 0;
    const type = r.querySelector('.input-grade-type')?.value.trim() || 'Đánh giá';
    const color = r.querySelector('.input-grade-color')?.value || '#6366f1';
    items.push({
      id: `item-${idx + 1}-${Date.now()}`,
      name: name,
      weight: weight,
      type: type,
      color: color
    });
  });
  return items;
}

/**
 * Enter iOS Jiggle / Wiggle Mode
 */
function enterJiggleMode() {
  state.isJiggleMode = true;
  if (elements.backpackLauncherGrid) {
    elements.backpackLauncherGrid.classList.add('is-jiggle-mode');
  }
  if (elements.bpDoneJiggleBtn) {
    elements.bpDoneJiggleBtn.classList.remove('hidden');
  }
  if (navigator.vibrate) {
    try { navigator.vibrate([40, 30, 40]); } catch (e) {}
  }
  renderBackpackView();
  showToast('Đang ở chế độ chỉnh sửa: Bấm (✏️) để sửa môn, bấm (-) để xóa môn!');
}

/**
 * Exit iOS Jiggle Mode
 */
function exitJiggleMode() {
  state.isJiggleMode = false;
  if (elements.backpackLauncherGrid) {
    elements.backpackLauncherGrid.classList.remove('is-jiggle-mode');
  }
  if (elements.bpDoneJiggleBtn) {
    elements.bpDoneJiggleBtn.classList.add('hidden');
  }
  renderBackpackView();
}

/**
 * Delete a subject from Backpack
 */
window.deleteSubjectCard = function(subjectCode, event) {
  if (event) event.stopPropagation();

  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject) return;

  if (confirm(`Bạn có chắc muốn xóa môn "${subject.name}" (${subject.code}) khỏi Chiếc Cặp?`)) {
    state.driveSubjects = state.driveSubjects.filter(s => s.code !== subjectCode);
    saveDriveData();
    renderBackpackView();
    renderGradesView(state.gradesSearchQuery || '');
    showToast(`Đã xóa môn ${subject.name}!`);
  }
};

/**
 * Render square App Launcher buttons in Backpack with Mini Grade Bar
 */
function renderBackpackView() {
  if (!elements.backpackLauncherGrid) return;
  elements.backpackLauncherGrid.innerHTML = '';

  const q = (state.backpackSearchQuery || '').toLowerCase().trim();

  const filteredSubjects = state.driveSubjects.filter(s => {
    if (!q) return true;
    return (s.name && s.name.toLowerCase().includes(q)) || (s.code && s.code.toLowerCase().includes(q));
  });

  filteredSubjects.forEach(subject => {
    const color = subject.color || '#6366f1';
    const icon = subject.icon || 'fa-solid fa-book-bookmark';
    const hasDrive = !!subject.driveUrl;

    const btn = document.createElement('div');
    btn.className = 'bp-app-btn';
    btn.style.setProperty('--app-color', color);
    btn.setAttribute('title', hasDrive ? `Mở Google Drive môn ${subject.name} ↗` : `Chưa có link Drive. Bấm để gắn link môn ${subject.name}`);
    
    // Long-press detection variables
    let pressTimer = null;
    let isLongPressTriggered = false;

    const startPress = (e) => {
      if (state.isJiggleMode) return;
      isLongPressTriggered = false;
      pressTimer = setTimeout(() => {
        isLongPressTriggered = true;
        enterJiggleMode();
      }, 480);
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('touchstart', startPress, { passive: true });
    btn.addEventListener('mouseup', cancelPress);
    btn.addEventListener('mouseleave', cancelPress);
    btn.addEventListener('touchend', cancelPress);
    btn.addEventListener('touchcancel', cancelPress);
    btn.addEventListener('selectstart', (e) => e.preventDefault());
    btn.addEventListener('dragstart', (e) => e.preventDefault());
    
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!state.isJiggleMode) enterJiggleMode();
    });

    btn.onclick = (e) => {
      if (isLongPressTriggered) return;
      if (state.isJiggleMode) return; // In jiggle mode, clicking card does nothing
      handleSubjectClick(subject.code);
    };

    // Calculate Circular Ring SVG Segments for Grade Breakdown
    const gradeItems = subject.gradeItems || [];
    const totalW = gradeItems.reduce((acc, cur) => acc + (Number(cur.weight) || 0), 0);
    const radius = 48;
    const circumference = 2 * Math.PI * radius; // ~301.59
    let cumulative = 0;

    let ringSlicesHtml = '';
    if (totalW > 0) {
      ringSlicesHtml = gradeItems.map(g => {
        const weightNum = Number(g.weight) || 0;
        const strokeDash = (weightNum / totalW) * circumference;
        const strokeOffset = -(cumulative / totalW) * circumference;
        cumulative += weightNum;
        return `
          <circle class="bp-ring-slice"
            cx="55" cy="55" r="${radius}"
            fill="none"
            stroke="${g.color || color}"
            stroke-width="6.5"
            stroke-dasharray="${strokeDash} ${circumference}"
            stroke-dashoffset="${strokeOffset}"
            stroke-linecap="round"
          >
            <title>${escapeHtml(g.name)}: ${weightNum}%</title>
          </circle>
        `;
      }).join('');
    } else {
      ringSlicesHtml = `
        <circle class="bp-ring-slice"
          cx="55" cy="55" r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="5"
          stroke-dasharray="${circumference} ${circumference}"
          stroke-dashoffset="0"
          opacity="0.5"
        />
      `;
    }

    const gradePillsHtml = gradeItems.length > 0 ? `
      <div class="bp-grade-pill-row">
        ${gradeItems.slice(0, 3).map(g => {
          const shortName = g.name.split('(')[0].trim().replace('Kiểm tra ', '').replace('Thi ', '');
          return `<span class="bp-grade-mini-tag" style="--tag-color: ${g.color || '#6366f1'};">${escapeHtml(shortName)} ${g.weight}%</span>`;
        }).join('')}
      </div>
    ` : '';

    const deleteBadgeHtml = state.isJiggleMode ? `
      <button class="btn-delete-node-badge" title="Xóa môn ${escapeHtml(subject.name)}" onclick="deleteSubjectCard('${escapeHtml(subject.code)}', event)">
        <i class="fa-solid fa-minus"></i>
      </button>
    ` : '';

    const editBadgeHtml = state.isJiggleMode ? `
      <button class="btn-edit-node-pencil" title="Chỉnh sửa link Google Drive & Tỉ lệ điểm môn ${escapeHtml(subject.name)}" onclick="editSubjectDriveLink('${escapeHtml(subject.code)}', event)">
        <i class="fa-solid fa-pen"></i>
      </button>
    ` : '';

    btn.innerHTML = `
      <div class="bp-circle-wrapper">
        <svg class="bp-circle-ring-svg" viewBox="0 0 110 110">
          <circle class="bp-ring-track" cx="55" cy="55" r="${radius}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6.5" />
          ${ringSlicesHtml}
        </svg>

        <div class="bp-circle-core">
          <span class="bp-app-code">${escapeHtml(subject.code)}</span>
          <div class="bp-app-icon-wrapper">
            <i class="${icon}"></i>
          </div>
          <span class="bp-circle-total-val">${totalW > 0 ? totalW + '%' : '100%'}</span>
        </div>

        ${deleteBadgeHtml}
        ${editBadgeHtml}
      </div>

      <div class="bp-app-details">
        <span class="bp-app-title" title="${escapeHtml(subject.name)}">${escapeHtml(subject.name)}</span>
        <span class="bp-app-drive-status ${hasDrive ? '' : 'not-set'}">
          ${hasDrive ? '<i class="fa-brands fa-google-drive"></i> Drive ↗' : '<i class="fa-solid fa-link-slash"></i> Chưa gắn'}
        </span>
        ${gradePillsHtml}
      </div>
    `;

    elements.backpackLauncherGrid.appendChild(btn);
  });

  // Always append the [+ Thêm Môn] App button at the end (not shaken in jiggle mode)
  const addBtn = document.createElement('div');
  addBtn.className = 'bp-app-btn btn-add-app';
  addBtn.title = 'Tạo thêm môn học mới';
  addBtn.onclick = () => {
    if (state.isJiggleMode) exitJiggleMode();
    openAddSubjectModal();
  };
  addBtn.innerHTML = `
    <div class="bp-circle-wrapper">
      <div class="bp-circle-core bp-circle-add-core">
        <i class="fa-solid fa-plus"></i>
      </div>
    </div>
    <div class="bp-app-details">
      <span class="bp-app-title">Thêm Môn</span>
      <span class="bp-app-drive-status" style="visibility: hidden;">--</span>
    </div>
  `;
  elements.backpackLauncherGrid.appendChild(addBtn);
}

/**
 * 1-Click Click Handler on Subject Node
 */
window.handleSubjectClick = function(subjectCode) {
  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject) return;

  if (subject.driveUrl) {
    showToast(`Đang mở Google Drive: ${subject.name} ↗`);
    window.open(subject.driveUrl, '_blank', 'noopener,noreferrer');
  } else {
    openEditDriveModal(subjectCode);
  }
};

/**
 * Open Modal to edit/attach Drive Link and Grade Breakdown
 */
window.editSubjectDriveLink = function(subjectCode, event) {
  if (event) {
    event.stopPropagation(); // Don't trigger direct open
  }
  openEditDriveModal(subjectCode);
};

function openEditDriveModal(subjectCode) {
  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject) return;

  elements.editDriveSubjectCode.value = subjectCode;
  elements.editDriveModalTitle.textContent = `Chỉnh Sửa Môn Học - ${subject.name}`;
  elements.editDriveModalSub.textContent = `Mã môn: ${subject.code}`;
  elements.editDriveUrlInput.value = subject.driveUrl || '';
  if (elements.editSubjectNotesInput) {
    elements.editSubjectNotesInput.value = subject.notes || '';
  }

  // Populate dynamic Grade breakdown items
  renderGradeEditorRows(subject.gradeItems || []);

  // Show or hide Delete Subject button
  if (elements.editDriveDeleteBtn) {
    elements.editDriveDeleteBtn.style.display = 'inline-flex';
  }

  elements.editDriveModal.classList.remove('hidden');
  elements.editDriveUrlInput.focus();
}

/**
 * Open Add Subject Modal
 */
window.openAddSubjectModal = function() {
  elements.addSubjectForm.reset();
  elements.addSubjectModal.classList.remove('hidden');
  elements.newSubjNameInput.focus();
};

/**
 * Jump from Timetable to Subject in Backpack / Open Drive
 */
window.viewSubjectBackpack = function(subjectName) {
  const matched = state.driveSubjects.find(s => 
    s.name.toLowerCase().includes(subjectName.toLowerCase()) || 
    subjectName.toLowerCase().includes(s.name.toLowerCase()) ||
    s.code.toLowerCase().includes(subjectName.toLowerCase())
  );

  if (matched && matched.driveUrl) {
    showToast(`Đang mở Google Drive môn ${matched.name} ↗`);
    window.open(matched.driveUrl, '_blank', 'noopener,noreferrer');
  } else if (matched) {
    switchView('backpack');
    openEditDriveModal(matched.code);
  } else {
    switchView('backpack');
  }
};

/* ==========================================================================
   INTERACTION HELPERS & UTILS
   ========================================================================== */

function renderMarkdownInline(text) {
  if (!text) return '';
  let safe = escapeHtml(text);
  safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary-light); text-decoration: underline;">$1</a>');
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 700;">$1</strong>');
  safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return safe;
}

function renderNotesView(notes) {
  if (!notes || notes.length === 0) {
    elements.notesSection.style.display = 'none';
    return;
  }

  elements.notesSection.style.display = 'block';
  elements.notesBody.innerHTML = `
    <ul>
      ${notes.map(n => `<li>${renderMarkdownInline(n)}</li>`).join('')}
    </ul>
  `;
}

function updateNextClassBadge(days, currentDayOfWeek) {
  const todayDay = days.find(d => d.dayOfWeekNumber === currentDayOfWeek);
  
  if (todayDay && todayDay.classes.length > 0) {
    const firstClass = todayDay.classes[0];
    elements.nextClassName.textContent = firstClass.subject;
    elements.nextClassDetail.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(firstClass.room)} | <i class="fa-regular fa-clock"></i> ${escapeHtml(firstClass.timeRange)}`;
  } else {
    let foundNext = null;
    let foundDayName = '';

    for (let offset = 1; offset <= 7; offset++) {
      const nextDayIdx = (currentDayOfWeek + offset) % 7;
      const targetDay = days.find(d => d.dayOfWeekNumber === nextDayIdx);
      if (targetDay && targetDay.classes.length > 0) {
        foundNext = targetDay.classes[0];
        foundDayName = targetDay.name;
        break;
      }
    }

    if (foundNext) {
      elements.nextClassName.textContent = `${foundNext.subject} (${foundDayName})`;
      elements.nextClassDetail.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(foundNext.room)} | <i class="fa-regular fa-clock"></i> ${escapeHtml(foundNext.timeRange)}`;
    } else {
      elements.nextClassName.textContent = 'Đã hoàn thành các tiết học';
      elements.nextClassDetail.innerHTML = `<i class="fa-solid fa-check"></i> Không còn lịch học trong tuần`;
    }
  }
}

function findWeekForDate(date, weeksList) {
  if (!weeksList || weeksList.length === 0) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const targetDateStr = `${year}-${month}-${day}`;

  for (let i = 0; i < weeksList.length; i++) {
    const w = weeksList[i];
    if (!w.startDate) continue;

    const start = new Date(w.startDate);
    const end = new Date(w.startDate);
    end.setDate(end.getDate() + 6); // 7 days of the week

    const endYear = end.getFullYear();
    const endMonth = String(end.getMonth() + 1).padStart(2, '0');
    const endDay = String(end.getDate()).padStart(2, '0');
    const endDateStr = `${endYear}-${endMonth}-${endDay}`;

    if (targetDateStr >= w.startDate && targetDateStr <= endDateStr) {
      return w;
    }
  }

  // Fallback: If before the start of the semester, return first week
  if (weeksList[0] && weeksList[0].startDate && targetDateStr < weeksList[0].startDate) {
    return weeksList[0];
  }

  // Fallback: If after semester ends, return the latest week
  return weeksList[weeksList.length - 1];
}

async function loadWeeksIndex() {
  try {
    const res = await fetch('schedules/index.json');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) state.weeksList = json;
    }
  } catch (err) {
    console.warn('Could not fetch schedules/index.json, using fallback weeks.', err);
  }

  elements.weekSelect.innerHTML = '';
  state.weeksList.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.filename;
    opt.textContent = w.title;
    elements.weekSelect.appendChild(opt);
  });

  // Tự động tìm và chọn tuần chứa ngày hôm nay (VD: 03/09/2026 -> Tuần 36)
  const today = new Date();
  const currentWeek = findWeekForDate(today, state.weeksList);
  if (currentWeek) {
    state.currentWeekFile = currentWeek.filename;
  }

  elements.weekSelect.value = state.currentWeekFile;
}

async function loadWeekMarkdown(filePath) {
  state.currentWeekFile = filePath;
  elements.weekSelect.value = filePath;

  let markdownContent = '';
  try {
    const res = await fetch(filePath);
    if (res.ok) {
      markdownContent = await res.text();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`Could not fetch ${filePath} via network. Using embedded data fallback.`, err);
    markdownContent = filePath.includes('tuan-36') ? DEFAULT_WEEK_36_MD : DEFAULT_WEEK_35_MD;
  }

  state.currentRawMarkdown = markdownContent;
  if (elements.markdownRawContent) elements.markdownRawContent.value = markdownContent;
  state.parsedSchedule = parseScheduleMarkdown(markdownContent);
  renderSchedule();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success);"></i> ${message}`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

window.copyClassInfo = function(subject, time, room) {
  const text = `${subject} | ${time} | ${room}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Đã sao chép: ${subject}`);
  });
};

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateCurrentClock() {
  const now = new Date();
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayStr = dayNames[now.getDay()];
  const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  elements.currentDateText.textContent = `${dayStr}, ${dateStr} • ${timeStr}`;
}

function switchView(viewName) {
  state.activeView = viewName;
  if (state.isJiggleMode) exitJiggleMode();

  elements.viewGridBtn.classList.toggle('active', viewName === 'grid');
  elements.viewTodayBtn.classList.toggle('active', viewName === 'today');
  elements.viewGradesBtn.classList.toggle('active', viewName === 'grades');
  elements.viewBackpackBtn.classList.toggle('active', viewName === 'backpack');
  if (elements.viewRawBtn) elements.viewRawBtn.classList.toggle('active', viewName === 'raw');

  elements.gridViewContainer.classList.toggle('active', viewName === 'grid');
  elements.todayViewContainer.classList.toggle('active', viewName === 'today');
  elements.gradesViewContainer.classList.toggle('active', viewName === 'grades');
  elements.backpackViewContainer.classList.toggle('active', viewName === 'backpack');
  if (elements.rawViewContainer) elements.rawViewContainer.classList.toggle('active', viewName === 'raw');

  if (viewName === 'grades') {
    renderGradesView(state.gradesSearchQuery);
  } else if (viewName === 'backpack') {
    renderBackpackView();
  }
}

/* ==========================================================================
   EVENT LISTENERS INITIALIZATION
   ========================================================================== */

function setupEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('theme-dark');
    document.body.classList.toggle('theme-dark', !isDark);
    document.body.classList.toggle('theme-light', isDark);
    elements.themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('sched_theme', isDark ? 'light' : 'dark');
  });

  // Week Select Dropdown
  elements.weekSelect.addEventListener('change', (e) => loadWeekMarkdown(e.target.value));

  // Prev / Next Week Buttons
  elements.prevWeekBtn.addEventListener('click', () => {
    const currentIndex = state.weeksList.findIndex(w => w.filename === state.currentWeekFile);
    if (currentIndex > 0) loadWeekMarkdown(state.weeksList[currentIndex - 1].filename);
    else showToast('Đang ở tuần đầu tiên');
  });

  elements.nextWeekBtn.addEventListener('click', () => {
    const currentIndex = state.weeksList.findIndex(w => w.filename === state.currentWeekFile);
    if (currentIndex < state.weeksList.length - 1) loadWeekMarkdown(state.weeksList[currentIndex + 1].filename);
    else showToast('Đang ở tuần mới nhất');
  });

  // View Switchers (Icon dock)
  elements.viewGridBtn.addEventListener('click', () => switchView('grid'));
  elements.viewTodayBtn.addEventListener('click', () => switchView('today'));
  elements.viewGradesBtn.addEventListener('click', () => switchView('grades'));
  elements.viewBackpackBtn.addEventListener('click', () => switchView('backpack'));
  if (elements.viewRawBtn) elements.viewRawBtn.addEventListener('click', () => switchView('raw'));

  // Search Box in Timetable
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    elements.clearSearchBtn.classList.toggle('hidden', !state.searchQuery);
    renderSchedule();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearchBtn.classList.add('hidden');
    renderSchedule();
  });

  // Grades Search Box
  if (elements.gradesSearchInput) {
    elements.gradesSearchInput.addEventListener('input', (e) => {
      state.gradesSearchQuery = e.target.value.trim();
      renderGradesView(state.gradesSearchQuery);
    });
  }

  // Backpack Search Box
  if (elements.backpackSearchInput) {
    elements.backpackSearchInput.addEventListener('input', (e) => {
      state.backpackSearchQuery = e.target.value.trim();
      elements.bpClearSearchBtn.classList.toggle('hidden', !state.backpackSearchQuery);
      renderBackpackView();
    });
  }

  if (elements.bpClearSearchBtn) {
    elements.bpClearSearchBtn.addEventListener('click', () => {
      elements.backpackSearchInput.value = '';
      state.backpackSearchQuery = '';
      elements.bpClearSearchBtn.classList.add('hidden');
      renderBackpackView();
    });
  }

  // Done Jiggle Button
  if (elements.bpDoneJiggleBtn) {
    elements.bpDoneJiggleBtn.addEventListener('click', exitJiggleMode);
  }

  // Dynamic Grade Editor Add Row Trigger
  if (elements.btnAddGradeItem) {
    elements.btnAddGradeItem.addEventListener('click', () => {
      addGradeEditorRow();
    });
  }

  // Add Subject Triggers
  if (elements.bpAddSubjectBtn) {
    elements.bpAddSubjectBtn.addEventListener('click', openAddSubjectModal);
  }

  if (elements.addSubjectCloseBtn) {
    elements.addSubjectCloseBtn.addEventListener('click', () => elements.addSubjectModal.classList.add('hidden'));
  }
  if (elements.addSubjectCancelBtn) {
    elements.addSubjectCancelBtn.addEventListener('click', () => elements.addSubjectModal.classList.add('hidden'));
  }

  if (elements.addSubjectForm) {
    elements.addSubjectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = elements.newSubjNameInput.value.trim();
      const code = elements.newSubjCodeInput.value.trim().toUpperCase();
      const driveUrl = elements.newSubjDriveInput.value.trim();

      if (!name || !code) return;

      const randomColors = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316'];
      const chosenColor = randomColors[state.driveSubjects.length % randomColors.length];

      state.driveSubjects.push({
        code: code,
        name: name,
        englishName: '',
        credits: 3,
        lecturers: '',
        department: '',
        icon: 'fa-solid fa-book-bookmark',
        color: chosenColor,
        driveUrl: driveUrl,
        gradeItems: [
          { id: `item-ck-${Date.now()}`, name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Tự luận', color: '#6366f1' },
          { id: `item-qt-${Date.now()}`, name: 'Quá trình & Giữa kỳ', weight: 50, type: 'Kiểm tra', color: '#ec4899' }
        ],
        notes: ''
      });

      saveDriveData();
      renderBackpackView();
      renderGradesView(state.gradesSearchQuery || '');
      elements.addSubjectModal.classList.add('hidden');
      showToast(`Đã tạo môn học mới: ${name} (${code})!`);
    });
  }

  // Edit Subject & Grade Modal Triggers
  if (elements.editDriveCloseBtn) {
    elements.editDriveCloseBtn.addEventListener('click', () => elements.editDriveModal.classList.add('hidden'));
  }
  if (elements.editDriveCancelBtn) {
    elements.editDriveCancelBtn.addEventListener('click', () => elements.editDriveModal.classList.add('hidden'));
  }

  if (elements.editDriveDeleteBtn) {
    elements.editDriveDeleteBtn.addEventListener('click', () => {
      const subjectCode = elements.editDriveSubjectCode.value;
      const subject = state.driveSubjects.find(s => s.code === subjectCode);
      if (subject && confirm(`Bạn có chắc muốn xóa môn "${subject.name}" (${subject.code}) khỏi Chiếc Cặp và bảng Điểm?`)) {
        state.driveSubjects = state.driveSubjects.filter(s => s.code !== subjectCode);
        saveDriveData();
        renderBackpackView();
        renderGradesView(state.gradesSearchQuery || '');
        elements.editDriveModal.classList.add('hidden');
        showToast(`Đã xóa môn ${subject.name}!`);
      }
    });
  }

  if (elements.editDriveForm) {
    elements.editDriveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subjectCode = elements.editDriveSubjectCode.value;
      const url = elements.editDriveUrlInput.value.trim();
      const notes = elements.editSubjectNotesInput ? elements.editSubjectNotesInput.value.trim() : '';
      const updatedGradeItems = getGradeEditorData();

      const subject = state.driveSubjects.find(s => s.code === subjectCode);
      if (subject) {
        subject.driveUrl = url;
        subject.notes = notes;
        subject.gradeItems = updatedGradeItems;
        saveDriveData();
        renderBackpackView();
        renderGradesView(state.gradesSearchQuery || '');
        showToast(`Đã cập nhật thông tin và tỉ lệ điểm môn ${subject.name}!`);
      }

      elements.editDriveModal.classList.add('hidden');
    });
  }

  // Exit Jiggle Mode when clicking on background
  document.addEventListener('click', (e) => {
    if (state.isJiggleMode) {
      if (!e.target.closest('.bp-app-btn') && !e.target.closest('#bp-done-jiggle-btn')) {
        exitJiggleMode();
      }
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === elements.editDriveModal) elements.editDriveModal.classList.add('hidden');
    if (e.target === elements.addSubjectModal) elements.addSubjectModal.classList.add('hidden');
  });

  // Print Button
  elements.printScheduleBtn.addEventListener('click', () => window.print());

  // Raw Markdown Actions
  if (elements.copyMarkdownBtn) {
    elements.copyMarkdownBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(elements.markdownRawContent.value).then(() => {
        showToast('Đã sao chép toàn bộ Markdown vào bộ nhớ tạm!');
      });
    });
  }

  if (elements.reloadMarkdownBtn) {
    elements.reloadMarkdownBtn.addEventListener('click', () => {
      loadWeekMarkdown(state.currentWeekFile);
      showToast('Đã tải lại nội dung Markdown gốc');
    });
  }

  if (elements.applyRawBtn) {
    elements.applyRawBtn.addEventListener('click', () => {
      const editedMd = elements.markdownRawContent.value;
      state.parsedSchedule = parseScheduleMarkdown(editedMd);
      renderSchedule();
      switchView('grid');
      showToast('Đã cập nhật giao diện xem thử từ Markdown!');
    });
  }
}

/* ==========================================================================
   APP INITIALIZATION & PWA SERVICE WORKER
   ========================================================================== */

async function init() {
  const savedTheme = localStorage.getItem('sched_theme');
  if (savedTheme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    elements.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  updateCurrentClock();
  setInterval(updateCurrentClock, 10000);

  setupEventListeners();

  // Initialize Firebase Auth & Cloud Firestore
  initFirebaseAuth();

  // Load local Drive data as initial fallback
  loadDriveData();

  renderGradesView();
  renderBackpackView();

  await loadWeeksIndex();
  await loadWeekMarkdown(state.currentWeekFile);

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (err) {
      console.warn('Service Worker registration skipped:', err);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
