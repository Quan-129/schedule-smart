/**
 * ==========================================================================
 * LỊCH HỌC MARKDOWN HUB & CHIẾC CẶP THÔNG MINH - JAVASCRIPT LOGIC
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

// Grade Schemes parsed from official Course Syllabi (HK261 / HK262 / HK263)
const GRADE_SCHEMES = [
  {
    id: 'co3117',
    name: 'Học máy',
    englishName: 'Machine Learning',
    code: 'CO3117',
    credits: 3,
    lecturers: 'Lê Thành Sách, Trương Vĩnh Lân, Nguyễn Đức Dũng, Lê Hồng Trang, Võ Thanh Hùng, Nguyễn An Khương',
    department: 'Khoa Khoa học & Kỹ thuật Máy tính (CSE)',
    items: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 60, type: 'Tự luận (Constructed response)', duration: '90 phút', color: '#6366f1', note: 'Từ chương 6 đến chương 10' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận (Constructed response)', duration: '60 phút', color: '#ec4899', note: 'Đến hết chương 5' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Assignment)', weight: 10, type: 'Project nhóm thực hành', duration: '45 tiết', color: '#10b981', note: 'Triển khai mô hình bài toán thực tế' }
    ],
    notes: 'Quy định AI: Chỉ cho phép dùng hỗ trợ tìm kiếm tài liệu, gợi ý ngữ pháp. Nghiêm cấm nộp sản phẩm hoàn toàn do AI tạo ra. Báo cáo phải trích dẫn công cụ AI.'
  },
  {
    id: 'im1025',
    name: 'Quản lý Dự án cho Kỹ sư',
    englishName: 'Project Management for Engineers',
    code: 'IM1025',
    credits: 3,
    lecturers: 'Huỳnh Thị Phương Lan, Nguyễn Thùy Trang, Nguyễn Thị Đức Nguyên, Nguyễn Bắc Nguyên, Đường Võ Hùng, Lê Phước Luông',
    department: 'Khoa Quản Lý Công Nghiệp (SIM)',
    items: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 40, type: 'Trắc nghiệm chấm máy (MCQ)', duration: '70 phút', color: '#6366f1', note: 'Bắt buộc tham gia >= 80% số giờ học để đủ điều kiện thi' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Trắc nghiệm chấm máy (MCQ)', duration: '50 phút', color: '#f59e0b', note: 'Đánh giá kiến thức nửa đầu học kỳ' },
      { id: 'item-cn', name: 'Bài tập cá nhân (Individual)', weight: 15, type: 'Bài tập về nhà & Báo cáo phản tư', duration: '--', color: '#06b6d4', note: 'Đánh giá nhận thức & bài học kinh nghiệm' },
      { id: 'item-nhom', name: 'Bài tập nhóm (Group Assignment)', weight: 15, type: 'Báo cáo dự án & Thuyết trình nhóm', duration: '--', color: '#10b981', note: 'Phối hợp làm việc nhóm' }
    ],
    notes: 'Nộp bài trễ trên LMS không có lý do chính đáng bị trừ 2 điểm cho mỗi ngày trễ. Tham dự tối thiểu 80% số giờ học là điều kiện bắt buộc để được dự thi và xét đạt.'
  },
  {
    id: 'im1019',
    name: 'Tiếp thị Căn bản',
    englishName: 'Principle of Marketing',
    code: 'IM1019',
    credits: 3,
    lecturers: 'Bùi Huy Hải Bích, Phạm Ngọc Trâm Anh, Mai Thị Mỹ Quyên, Nguyễn Văn Tuấn, Dương Thị Ngọc Liên, Lê Nguyễn Hậu',
    department: 'Khoa Quản Lý Công Nghiệp (SIM)',
    items: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Trắc nghiệm (MCQ)', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung theo lịch chung' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Project)', weight: 30, type: 'Dự án nhóm & Thuyết trình', duration: 'Nhóm 6-7 SV', color: '#ec4899', note: 'Vắng thuyết trình BTL bị 0 điểm BTL' },
      { id: 'item-tx', name: 'Đánh giá thường xuyên (Formative)', weight: 20, type: 'Bài tập trên lớp / Online / Chuyên cần', duration: '--', color: '#10b981', note: 'Vắng bài tập nào bị 0 điểm bài đó' }
    ],
    notes: 'Sinh viên làm việc nhóm 6-7 người. Vắng bài tập nào tính 0 điểm bài đó. Vắng buổi thuyết trình BTL bị 0 điểm BTL. Sử dụng AI phải tuân thủ liêm chính học thuật.'
  },
  {
    id: 'co3061',
    name: 'Nhập môn Trí tuệ Nhân tạo',
    englishName: 'Introduction to Artificial Intelligence',
    code: 'CO3061',
    credits: 3,
    lecturers: 'Bộ môn Khoa học Máy tính',
    department: 'Khoa Khoa học và Kỹ thuật Máy tính (CSE)',
    items: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Tự luận / Trắc nghiệm', duration: '90 phút', color: '#6366f1', note: 'Đánh giá toàn diện các chủ đề AI' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận / Trắc nghiệm', duration: '60 phút', color: '#f59e0b', note: 'Thuật toán tìm kiếm, ràng buộc, Logic' },
      { id: 'item-btl', name: 'Bài tập lớn / Thực hành', weight: 20, type: 'Project lập trình AI theo nhóm', duration: 'Hạn: 30/11', color: '#10b981', note: 'Cài đặt thuật toán & nộp báo cáo' }
    ],
    notes: 'Deadline nộp Bài tập lớn vào Thứ 2 (30/11/2026). Tuần 44 có các tiết bổ sung vào buổi tối.'
  },
  {
    id: 'sp1035',
    name: 'Tư tưởng Hồ Chí Minh',
    englishName: 'Ho Chi Minh Ideology',
    code: 'SP1035',
    credits: 2,
    lecturers: 'Bộ môn Lý luận Chính trị',
    department: 'Khoa Khoa học Ứng dụng',
    items: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Trắc nghiệm / Tự luận', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung cuối kỳ' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Chuyên cần, Thảo luận & Kiểm tra trắc nghiệm', duration: '--', color: '#ec4899', note: 'Bài tập trên hệ thống BKEL' }
    ],
    notes: 'Tuần 47 là tuần học cuối môn. Sinh viên cần tham gia đầy đủ các buổi học và làm bài tập trên hệ thống BKEL.'
  },
  {
    id: 'sp1039',
    name: 'Pháp luật Việt Nam Đại cương',
    englishName: 'General Vietnamese Law',
    code: 'SP1039',
    credits: 2,
    lecturers: 'Bộ môn Khoa học Xã hội',
    department: 'Khoa Khoa học Ứng dụng',
    items: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 70, type: 'Trắc nghiệm', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung cuối kỳ' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Giữa kỳ + Thảo luận)', weight: 30, type: 'Trắc nghiệm online / Bài tập lớp', duration: '--', color: '#f59e0b', note: 'Kiểm tra trên hệ thống BKEL' }
    ],
    notes: 'Tuần 47 là tuần học cuối môn.'
  },
  {
    id: 'jp1007',
    name: 'Tiếng Nhật 7',
    englishName: 'Japanese 7',
    code: 'JP1007',
    credits: 4,
    lecturers: 'Giảng viên Bộ môn Ngoại ngữ',
    department: 'Văn phòng Đào tạo Quốc tế (OISP)',
    items: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Nghe, Đọc, Viết & Phỏng vấn Kaiwa', duration: '90 phút', color: '#6366f1', note: 'Đánh giá toàn diện 4 kỹ năng' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Kiểm tra từ vựng, Ngữ pháp, Kaiwa, Chuyên cần', duration: '--', color: '#10b981', note: 'Kiểm tra định kỳ theo từng tuần học' }
    ],
    notes: 'Lịch học 4 buổi sáng liên tục mỗi tuần (Thứ 3 đến Thứ 6). Yêu cầu chuẩn bị bài trước khi đến lớp.'
  }
];

// Default pre-populated documents in the Smart Backpack (linked with official courses & drives)
const DEFAULT_BACKPACK_ITEMS = [
  // CO3117 - Học máy
  {
    id: 'default-ml-1',
    subjectCode: 'CO3117',
    category: 'slides',
    name: 'De_cuong_chi_tiet_Hoc_May_CO3117.pdf',
    type: 'pdf',
    size: '1.2 MB',
    updatedAt: '2026-08-25',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Đề cương học phần chi tiết Học máy HK261'
  },
  {
    id: 'default-ml-2',
    subjectCode: 'CO3117',
    category: 'slides',
    name: 'Slide_Chuong_1_Tong_Quan_Hoc_May.pdf',
    type: 'pdf',
    size: '4.8 MB',
    updatedAt: '2026-08-28',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Bài giảng Chương 1: Giới thiệu Học máy & Quy trình ML'
  },
  {
    id: 'default-ml-3',
    subjectCode: 'CO3117',
    category: 'btl',
    name: 'Huong_dan_BTL_Hoc_May_Nhom.pdf',
    type: 'pdf',
    size: '850 KB',
    updatedAt: '2026-09-01',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Yêu cầu đề tài Bài tập lớn nhóm (10% điểm)'
  },

  // IM1025 - Quản lý Dự án cho Kỹ sư
  {
    id: 'default-pm-1',
    subjectCode: 'IM1025',
    category: 'slides',
    name: 'De_cuong_chi_tiet_QLDA_IM1025.pdf',
    type: 'pdf',
    size: '980 KB',
    updatedAt: '2026-08-20',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Đề cương học phần Quản lý Dự án cho Kỹ sư'
  },
  {
    id: 'default-pm-2',
    subjectCode: 'IM1025',
    category: 'btl',
    name: 'LINK ĐĂNG KÝ NHÓM (Hạn 15-09-2026)',
    type: 'link',
    size: 'Google Forms',
    updatedAt: '2026-09-01',
    driveUrl: 'https://docs.google.com/forms/',
    isOffline: false,
    description: 'Hạn chót Thứ 3 Tuần 38 (15/09/2026)'
  },
  {
    id: 'default-pm-3',
    subjectCode: 'IM1025',
    category: 'btl',
    name: 'LINK NỘP BÀI TẬP LỚN (Hạn 30-11-2026)',
    type: 'link',
    size: 'BKEL LMS',
    updatedAt: '2026-09-01',
    driveUrl: 'https://e-learning.hcmut.edu.vn/',
    isOffline: false,
    description: 'Hạn nộp báo cáo dự án BTL (Thứ 2 Tuần 49)'
  },
  {
    id: 'default-pm-4',
    subjectCode: 'IM1025',
    category: 'other',
    name: 'Folder Google Drive Chung - QLDA',
    type: 'drive',
    size: 'Google Drive',
    updatedAt: '2026-09-01',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Thư mục tài liệu, biểu mẫu WBS, Gantt Chart'
  },

  // IM1019 - Tiếp thị Căn bản
  {
    id: 'default-mkt-1',
    subjectCode: 'IM1019',
    category: 'slides',
    name: 'De_cuong_chi_tiet_Tiep_Thi_Can_Ban.pdf',
    type: 'pdf',
    size: '1.1 MB',
    updatedAt: '2026-08-22',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Đề cương môn Tiếp thị căn bản'
  },
  {
    id: 'default-mkt-2',
    subjectCode: 'IM1019',
    category: 'slides',
    name: 'Slide_Marketing_Ch1_Tong_Quan.pptx',
    type: 'pptx',
    size: '7.5 MB',
    updatedAt: '2026-08-29',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Slide bài giảng Chương 1'
  },
  {
    id: 'default-mkt-3',
    subjectCode: 'IM1019',
    category: 'btl',
    name: 'Rubric_Danh_gia_Thuyet_trinh_BTL_Marketing.pdf',
    type: 'pdf',
    size: '620 KB',
    updatedAt: '2026-09-01',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Tiêu chí chấm điểm thuyết trình nhóm 6-7 sinh viên'
  },

  // CO3061 - Nhập môn Trí tuệ Nhân tạo
  {
    id: 'default-ai-1',
    subjectCode: 'CO3061',
    category: 'slides',
    name: 'Slide_AI_Search_Algorithms.pdf',
    type: 'pdf',
    size: '5.2 MB',
    updatedAt: '2026-08-30',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Thuật toán tìm kiếm A*, BFS, DFS, CSP'
  },
  {
    id: 'default-ai-2',
    subjectCode: 'CO3061',
    category: 'exams',
    name: 'Kho_De_thi_giua_ky_AI_cac_nam.zip',
    type: 'zip',
    size: '14.8 MB',
    updatedAt: '2026-09-01',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Tổng hợp đề thi GK và bài giải tham khảo'
  },

  // SP1035 - Tư tưởng Hồ Chí Minh
  {
    id: 'default-hcm-1',
    subjectCode: 'SP1035',
    category: 'slides',
    name: 'Tai_lieu_Hoc_Tap_BKEL_Tu_Tuong_HCM.pdf',
    type: 'pdf',
    size: '3.4 MB',
    updatedAt: '2026-08-20',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Tài liệu hướng dẫn thảo luận và ôn tập trắc nghiệm'
  },

  // JP1007 - Tiếng Nhật 7
  {
    id: 'default-jp-1',
    subjectCode: 'JP1007',
    category: 'slides',
    name: 'Tu_vung_Kaiwa_Ngu_phap_Tuan_35_36.pdf',
    type: 'pdf',
    size: '2.1 MB',
    updatedAt: '2026-08-26',
    driveUrl: 'https://drive.google.com/',
    isOffline: false,
    description: 'Tài liệu chuẩn bị bài trước giờ học (4 buổi sáng/tuần)'
  }
];

// App State
const state = {
  currentWeekFile: 'schedules/tuan-35.md',
  currentRawMarkdown: '',
  parsedSchedule: null,
  activeFilterSubject: null,
  searchQuery: '',
  gradesSearchQuery: '',
  backpackSearchQuery: '',
  backpackFilterSubject: null,
  activeView: 'grid', // 'grid', 'today', 'grades', 'backpack', 'raw'
  weeksList: [
    { id: 'tuan-35', title: 'Tuần 35', filename: 'schedules/tuan-35.md' },
    { id: 'tuan-36', title: 'Tuần 36', filename: 'schedules/tuan-36.md' }
  ],
  subjectColorMap: new Map(),
  backpackFiles: []
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
  
  // Backpack Elements
  backpackExplorer: document.getElementById('backpack-explorer'),
  backpackSubjectTags: document.getElementById('backpack-subject-tags'),
  backpackBreadcrumbs: document.getElementById('backpack-breadcrumbs'),
  backpackDropzone: document.getElementById('backpack-dropzone'),
  backpackFileInput: document.getElementById('backpack-file-input'),
  bpUploadBtn: document.getElementById('bp-upload-btn'),
  bpAddLinkBtn: document.getElementById('bp-add-link-btn'),
  backpackSearchInput: document.getElementById('backpack-search-input'),
  bpClearSearchBtn: document.getElementById('bp-clear-search-btn'),
  bpStorageText: document.getElementById('bp-storage-text'),
  bpFilesCount: document.getElementById('bp-files-count'),
  
  // Modals
  filePreviewModal: document.getElementById('file-preview-modal'),
  previewFileName: document.getElementById('preview-file-name'),
  previewFileSub: document.getElementById('preview-file-sub'),
  previewFileIcon: document.getElementById('preview-file-icon'),
  previewModalBody: document.getElementById('preview-modal-body'),
  previewOpenExtBtn: document.getElementById('preview-open-ext-btn'),
  previewDownloadBtn: document.getElementById('preview-download-btn'),
  previewCloseBtn: document.getElementById('preview-close-btn'),
  
  addLinkModal: document.getElementById('add-link-modal'),
  addLinkForm: document.getElementById('add-link-form'),
  linkSubjectSelect: document.getElementById('link-subject-select'),
  linkCategorySelect: document.getElementById('link-category-select'),
  linkNameInput: document.getElementById('link-name-input'),
  linkUrlInput: document.getElementById('link-url-input'),
  addLinkCloseBtn: document.getElementById('add-link-close-btn'),
  addLinkCancelBtn: document.getElementById('add-link-cancel-btn'),
  
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
   INDEXED-DB OFFLINE STORAGE ENGINE
   ========================================================================== */

const DB_NAME = 'SmartBackpackDB';
const DB_VERSION = 1;
const STORE_NAME = 'backpack_files';

function openBackpackDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('Trình duyệt không hỗ trợ IndexedDB.');
      return resolve(null);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('subjectCode', 'subjectCode', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Không thể mở IndexedDB:', request.error);
      resolve(null);
    };
  });
}

async function saveFileToIndexedDB(fileObj) {
  const db = await openBackpackDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(fileObj);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (err) {
      console.error('Lỗi lưu IndexedDB:', err);
      resolve(false);
    }
  });
}

async function getAllFilesFromIndexedDB() {
  const db = await openBackpackDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (err) {
      console.error('Lỗi đọc IndexedDB:', err);
      resolve([]);
    }
  });
}

async function deleteFileFromIndexedDB(id) {
  const db = await openBackpackDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (err) {
      console.error('Lỗi xóa IndexedDB:', err);
      resolve(false);
    }
  });
}

/* ==========================================================================
   MARKDOWN PARSER
   ========================================================================== */

/**
 * Parses markdown schedule text into structured JavaScript Object
 * @param {string} markdownText 
 */
function parseScheduleMarkdown(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  
  const result = {
    title: 'Lịch học',
    days: [],
    notes: []
  };

  let currentDay = null;
  let inNotesSection = false;

  // Regex patterns for line matching
  const titleRegex = /^#\s+(.+)$/i;
  const dayHeaderRegex = /^(?:##\s+)?(Thứ\s+[2-7]|Thứ\s+7\s*&\s*Chủ\s+Nhật|Chủ\s+Nhật)/i;
  const notesHeaderRegex = /^(?:##\s+)?(Lưu\s+ý(?:\s+nhỏ)?|Ghi\s+chú):?/i;
  const classItemRegex = /^(?:[-*]\s*)?(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})(?:\s*\(([^)]+)\))?:\s*([^|]+)(?:\|\s*(?:Phòng:\s*)?(.+))?$/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // 1. Check Schedule Title
    const titleMatch = rawLine.match(titleRegex);
    if (titleMatch && !result.titleSet) {
      result.title = titleMatch[1].trim();
      result.titleSet = true;
      continue;
    }

    // 2. Check Notes / Lưu ý header
    const notesMatch = rawLine.match(notesHeaderRegex);
    if (notesMatch) {
      inNotesSection = true;
      currentDay = null;
      continue;
    }

    // 3. If in notes section, collect bullet points or lines
    if (inNotesSection) {
      const cleanNote = rawLine.replace(/^[-*]\s*/, '').trim();
      if (cleanNote) {
        result.notes.push(cleanNote);
      }
      continue;
    }

    // 4. Check Day Header (Thứ 2 -> Chủ Nhật)
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

    // 5. Parse Class Items within a Day
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

        currentDay.classes.push({
          timeRange,
          startTime,
          endTime,
          period,
          subject,
          room
        });
      } else {
        const cleanText = rawLine.replace(/^[-*]\s*/, '').trim();
        if (cleanText) {
          currentDay.rawNotes.push(cleanText);
        }
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
   UI RENDERING FUNCTIONS
   ========================================================================== */

function renderSchedule() {
  if (!state.parsedSchedule) return;

  const { title, days, notes } = state.parsedSchedule;
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ...

  // Update Title & Subtitle
  elements.scheduleTitle.textContent = title;
  elements.scheduleSubtitle.textContent = `Hiển thị dữ liệu từ ${state.currentWeekFile}`;
  elements.rawFileName.textContent = state.currentWeekFile;

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
                <button class="btn-view-subject-backpack" title="Mở Chiếc cặp tài liệu môn ${escapeHtml(c.subject)}" onclick="viewSubjectBackpack('${escapeHtml(c.subject)}')">
                  <i class="fa-solid fa-briefcase"></i>
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
    elements.todaySummaryText.textContent = `Hôm nay bạn không có lịch học. Tận hưởng thời gian nghỉ ngơi hoặc tự học nhé!`;
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
          <button class="btn-view-subject-backpack" title="Mở Chiếc cặp tài liệu môn ${escapeHtml(c.subject)}" onclick="viewSubjectBackpack('${escapeHtml(c.subject)}')">
            <i class="fa-solid fa-briefcase"></i>
          </button>
        </div>
      </div>
    `;
    elements.todayTimelineList.appendChild(item);
  });
}

/* ==========================================================================
   GRADE SCHEMES & DONUT PIE CHARTS
   ========================================================================== */

function generateDonutChartSvg(items, schemeCode, totalWeight = 100) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  const slices = items.map((item, idx) => {
    const strokeDash = (item.weight / totalWeight) * circumference;
    const strokeOffset = -(cumulative / totalWeight) * circumference;
    cumulative += item.weight;

    return `
      <circle class="donut-slice" 
        cx="70" cy="70" r="${radius}" 
        stroke="${item.color}" 
        stroke-dasharray="${strokeDash} ${circumference}" 
        stroke-dashoffset="${strokeOffset}"
        data-scheme="${schemeCode}"
        data-weight="${item.weight}%"
        data-name="${escapeHtml(item.name)}"
        title="${escapeHtml(item.name)}: ${item.weight}%"
        onclick="highlightGradeSlice('${schemeCode}', '${idx}', '${escapeHtml(item.name)}', '${item.weight}%')"
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
        <span class="donut-center-val">100%</span>
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
  const filteredSchemes = GRADE_SCHEMES.filter(s => 
    !q || 
    s.name.toLowerCase().includes(q) ||
    s.englishName.toLowerCase().includes(q) ||
    s.code.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q) ||
    s.lecturers.toLowerCase().includes(q)
  );

  if (filteredSchemes.length === 0) {
    elements.gradesGrid.innerHTML = `
      <div class="day-off-card" style="grid-column: 1 / -1; padding: 3rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>Không tìm thấy môn học</h3>
        <p>Thử tìm kiếm với từ khóa khác như "Học máy", "Quản lý", "CO3117", "IM1025"...</p>
      </div>
    `;
    return;
  }

  filteredSchemes.forEach(scheme => {
    const card = document.createElement('div');
    card.className = 'grade-card';
    card.id = `grade-card-${scheme.code.toLowerCase()}`;

    const chartSvg = generateDonutChartSvg(scheme.items, scheme.code.toLowerCase());

    const breakdownHtml = scheme.items.map((item, idx) => `
      <div class="breakdown-item" style="border-left-color: ${item.color}; cursor: pointer;" onclick="highlightGradeSlice('${scheme.code.toLowerCase()}', '${idx}', '${escapeHtml(item.name)}', '${item.weight}%')">
        <div class="breakdown-row">
          <span class="breakdown-name">
            <span class="breakdown-color-dot" style="background-color: ${item.color};"></span>
            ${escapeHtml(item.name)}
          </span>
          <span class="breakdown-weight" style="color: ${item.color};">${item.weight}%</span>
        </div>
        <div class="breakdown-detail">
          <span class="breakdown-type"><i class="fa-regular fa-file-lines"></i> ${escapeHtml(item.type)}</span>
          ${item.duration && item.duration !== '--' ? `<span><i class="fa-regular fa-clock"></i> ${escapeHtml(item.duration)}</span>` : ''}
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-bar-fill" style="width: ${item.weight}%; background-color: ${item.color};"></div>
        </div>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="grade-card-header">
        <div class="grade-title-group">
          <h3 class="grade-subject-title">
            <i class="fa-solid fa-book-bookmark" style="color: var(--accent-primary); font-size: 0.95rem;"></i>
            ${escapeHtml(scheme.name)}
          </h3>
          <span class="grade-subject-en">${escapeHtml(scheme.englishName)}</span>
          <span class="grade-department"><i class="fa-solid fa-building-columns"></i> ${escapeHtml(scheme.department)}</span>
        </div>
        <div class="grade-badges">
          <span class="badge-code">${escapeHtml(scheme.code)}</span>
          <span class="badge-credits">${scheme.credits} Tín chỉ</span>
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

window.viewSubjectGrade = function(subjectName) {
  switchView('grades');
  if (elements.gradesSearchInput) {
    elements.gradesSearchInput.value = subjectName;
    renderGradesView(subjectName);
  }
  
  setTimeout(() => {
    const matchingScheme = GRADE_SCHEMES.find(s => 
      s.name.toLowerCase().includes(subjectName.toLowerCase()) || 
      subjectName.toLowerCase().includes(s.name.toLowerCase())
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
   SMART BACKPACK (CHIẾC CẶP THÔNG MINH) LOGIC & RENDERING
   ========================================================================== */

/**
 * Get category metadata
 */
function getCategoryInfo(cat) {
  switch (cat) {
    case 'slides':
      return { label: 'Slide & Bài giảng', icon: 'fa-solid fa-file-powerpoint' };
    case 'btl':
      return { label: 'Bài tập lớn & Dự án', icon: 'fa-solid fa-users-rectangle' };
    case 'exams':
      return { label: 'Đề thi & Ôn tập', icon: 'fa-solid fa-pen-ruler' };
    default:
      return { label: 'Tài liệu khác & Drive', icon: 'fa-brands fa-google-drive' };
  }
}

/**
 * Get icon class and color for file type
 */
function getFileIcon(type, name = '') {
  const t = (type || '').toLowerCase();
  const ext = name.split('.').pop().toLowerCase();
  
  if (t === 'pdf' || ext === 'pdf') return { icon: 'fa-solid fa-file-pdf', cls: 'pdf' };
  if (t === 'pptx' || t === 'ppt' || ext === 'pptx' || ext === 'ppt') return { icon: 'fa-solid fa-file-powerpoint', cls: 'pptx' };
  if (t === 'docx' || t === 'doc' || ext === 'docx' || ext === 'doc') return { icon: 'fa-solid fa-file-word', cls: 'docx' };
  if (t === 'xlsx' || t === 'xls' || ext === 'xlsx' || ext === 'xls') return { icon: 'fa-solid fa-file-excel', cls: 'xlsx' };
  if (t === 'zip' || t === 'rar' || ext === 'zip' || ext === 'rar') return { icon: 'fa-solid fa-file-zipper', cls: 'zip' };
  if (t === 'drive') return { icon: 'fa-brands fa-google-drive', cls: 'drive' };
  if (t === 'link') return { icon: 'fa-solid fa-arrow-up-right-from-square', cls: 'link' };
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return { icon: 'fa-solid fa-file-image', cls: 'img' };
  
  return { icon: 'fa-regular fa-file-lines', cls: 'other' };
}

/**
 * Calculates offline storage used in MB
 */
async function updateBackpackStorageStats() {
  const customFiles = state.backpackFiles.filter(f => f.isOffline && f.fileBlob);
  let totalBytes = 0;
  customFiles.forEach(f => {
    if (f.fileBlob && f.fileBlob.size) {
      totalBytes += f.fileBlob.size;
    }
  });

  const mb = (totalBytes / (1024 * 1024)).toFixed(1);
  if (elements.bpStorageText) {
    elements.bpStorageText.textContent = `Offline: ${mb} MB (${customFiles.length} file)`;
  }
  if (elements.bpFilesCount) {
    elements.bpFilesCount.textContent = `${state.backpackFiles.length} tài liệu`;
  }
}

/**
 * Renders subject filter pills and options
 */
function renderBackpackFilters() {
  if (!elements.backpackSubjectTags) return;
  elements.backpackSubjectTags.innerHTML = '';

  // "Tất cả" tag
  const allBtn = document.createElement('button');
  allBtn.className = `tag-btn ${!state.backpackFilterSubject ? 'active' : ''}`;
  allBtn.innerHTML = `Tất cả môn (${GRADE_SCHEMES.length})`;
  allBtn.addEventListener('click', () => {
    state.backpackFilterSubject = null;
    renderBackpackView();
  });
  elements.backpackSubjectTags.appendChild(allBtn);

  // Populate Select in Add Link Modal
  if (elements.linkSubjectSelect) {
    elements.linkSubjectSelect.innerHTML = '';
  }

  GRADE_SCHEMES.forEach(scheme => {
    const color = getSubjectColor(scheme.name);
    const btn = document.createElement('button');
    btn.className = `tag-btn ${state.backpackFilterSubject === scheme.code ? 'active' : ''}`;
    btn.innerHTML = `<span class="tag-color-indicator" style="background-color: ${color.border}"></span> ${scheme.name} (${scheme.code})`;
    btn.addEventListener('click', () => {
      state.backpackFilterSubject = state.backpackFilterSubject === scheme.code ? null : scheme.code;
      renderBackpackView();
    });
    elements.backpackSubjectTags.appendChild(btn);

    if (elements.linkSubjectSelect) {
      const opt = document.createElement('option');
      opt.value = scheme.code;
      opt.textContent = `${scheme.code} - ${scheme.name}`;
      elements.linkSubjectSelect.appendChild(opt);
    }
  });
}

/**
 * Main render function for Smart Backpack
 */
function renderBackpackView() {
  if (!elements.backpackExplorer) return;
  elements.backpackExplorer.innerHTML = '';

  renderBackpackFilters();
  updateBackpackStorageStats();

  const q = (state.backpackSearchQuery || '').toLowerCase().trim();
  const todayDayIndex = (new Date()).getDay();

  // Filter schemes
  let schemes = GRADE_SCHEMES.filter(s => {
    if (state.backpackFilterSubject && s.code !== state.backpackFilterSubject) {
      return false;
    }
    return true;
  });

  // Highlight or sort subjects that have classes today to the top!
  schemes.sort((a, b) => {
    const aHasClass = state.parsedSchedule?.days?.some(d => 
      d.dayOfWeekNumber === todayDayIndex && d.classes.some(c => c.subject.includes(a.name) || a.name.includes(c.subject))
    );
    const bHasClass = state.parsedSchedule?.days?.some(d => 
      d.dayOfWeekNumber === todayDayIndex && d.classes.some(c => c.subject.includes(b.name) || b.name.includes(c.subject))
    );
    if (aHasClass && !bHasClass) return -1;
    if (!aHasClass && bHasClass) return 1;
    return 0;
  });

  // Update Breadcrumbs
  if (elements.backpackBreadcrumbs) {
    if (state.backpackFilterSubject) {
      const currentScheme = GRADE_SCHEMES.find(s => s.code === state.backpackFilterSubject);
      elements.backpackBreadcrumbs.innerHTML = `
        <span class="crumb" onclick="clearBackpackFilter()"><i class="fa-solid fa-house"></i> Chiếc cặp</span>
        <span class="separator"><i class="fa-solid fa-chevron-right"></i></span>
        <span class="crumb active"><i class="fa-solid fa-folder-open"></i> ${escapeHtml(currentScheme ? currentScheme.name : state.backpackFilterSubject)}</span>
      `;
    } else {
      elements.backpackBreadcrumbs.innerHTML = `<span class="crumb active"><i class="fa-solid fa-house"></i> Tất cả môn học (${schemes.length} ngăn cặp)</span>`;
    }
  }

  let totalRenderedSubjects = 0;

  schemes.forEach(scheme => {
    // Get all files for this subject
    const subjectFiles = state.backpackFiles.filter(f => f.subjectCode === scheme.code);
    
    // Apply search query filter if present
    const matchingFiles = subjectFiles.filter(f => 
      !q || 
      f.name.toLowerCase().includes(q) || 
      (f.description && f.description.toLowerCase().includes(q)) ||
      scheme.name.toLowerCase().includes(q) ||
      scheme.code.toLowerCase().includes(q)
    );

    if (q && matchingFiles.length === 0) {
      return;
    }

    totalRenderedSubjects++;
    const color = getSubjectColor(scheme.name);

    const section = document.createElement('div');
    section.className = 'bp-subject-section';
    section.id = `bp-subject-${scheme.code.toLowerCase()}`;

    // Categories: slides, btl, exams, other
    const categories = ['slides', 'btl', 'exams', 'other'];

    const categoriesHtml = categories.map(catKey => {
      const catInfo = getCategoryInfo(catKey);
      const catFiles = matchingFiles.filter(f => f.category === catKey);

      let filesListHtml = '';
      if (catFiles.length === 0) {
        filesListHtml = `<div class="bp-empty-cat"><i class="fa-regular fa-folder"></i> Chưa có tệp nào</div>`;
      } else {
        filesListHtml = catFiles.map(file => {
          const fileIconInfo = getFileIcon(file.type, file.name);
          return `
            <div class="bp-file-item" id="file-${file.id}">
              <div class="bp-file-info">
                <i class="${fileIconInfo.icon} bp-file-icon ${fileIconInfo.cls}"></i>
                <div class="bp-file-text">
                  <span class="bp-file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                  <div class="bp-file-meta">
                    <span>${file.size || 'Tệp'}</span>
                    ${file.isOffline ? `<span class="bp-offline-tag"><i class="fa-solid fa-circle-check"></i> Offline</span>` : ''}
                    ${file.description ? `<span>• ${escapeHtml(file.description)}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="bp-file-actions">
                <button class="btn-file-action" title="Xem trước tài liệu" onclick="previewFile('${file.id}')">
                  <i class="fa-regular fa-eye"></i>
                </button>
                ${file.driveUrl ? `
                  <a href="${escapeHtml(file.driveUrl)}" target="_blank" rel="noopener noreferrer" class="btn-file-action" title="Mở trên Google Drive">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                ` : ''}
                ${file.fileBlob ? `
                  <button class="btn-file-action" title="Tải xuống máy" onclick="downloadOfflineFile('${file.id}')">
                    <i class="fa-solid fa-download"></i>
                  </button>
                ` : ''}
                ${file.isCustom ? `
                  <button class="btn-file-action delete" title="Xóa tài liệu này" onclick="deleteCustomBackpackFile('${file.id}')">
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      return `
        <div class="bp-category-card">
          <div class="bp-cat-header">
            <span><i class="${catInfo.icon}"></i> ${catInfo.label}</span>
            <span class="bp-cat-badge">${catFiles.length}</span>
          </div>
          <div class="bp-file-list">
            ${filesListHtml}
          </div>
        </div>
      `;
    }).join('');

    section.innerHTML = `
      <div class="bp-subject-header">
        <div class="bp-subject-title-group">
          <div class="bp-subject-icon" style="background-color: ${color.bg}; color: ${color.border}">
            <i class="fa-solid fa-book-bookmark"></i>
          </div>
          <div>
            <span class="bp-subject-name">${escapeHtml(scheme.name)}</span>
            <span class="bp-subject-code">${escapeHtml(scheme.code)}</span>
          </div>
        </div>
        <div>
          <button class="btn-action-small" onclick="quickUploadForSubject('${scheme.code}')" title="Thêm tài liệu cho môn này">
            <i class="fa-solid fa-plus"></i> Thêm tệp môn này
          </button>
        </div>
      </div>
      <div class="bp-categories-grid">
        ${categoriesHtml}
      </div>
    `;

    elements.backpackExplorer.appendChild(section);
  });

  if (totalRenderedSubjects === 0) {
    elements.backpackExplorer.innerHTML = `
      <div class="day-off-card" style="padding: 3.5rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>Không tìm thấy tài liệu phù hợp</h3>
        <p>Thử tìm kiếm với tên tài liệu khác hoặc chọn "Tất cả môn".</p>
      </div>
    `;
  }
}

window.clearBackpackFilter = function() {
  state.backpackFilterSubject = null;
  renderBackpackView();
};

window.quickUploadForSubject = function(subjectCode) {
  if (elements.linkSubjectSelect) {
    elements.linkSubjectSelect.value = subjectCode;
  }
  elements.backpackFileInput.setAttribute('data-target-subject', subjectCode);
  elements.backpackFileInput.click();
};

/**
 * Navigate to Backpack View from Timetable item
 */
window.viewSubjectBackpack = function(subjectName) {
  switchView('backpack');
  
  // Find matching scheme
  const matched = GRADE_SCHEMES.find(s => 
    s.name.toLowerCase().includes(subjectName.toLowerCase()) ||
    subjectName.toLowerCase().includes(s.name.toLowerCase())
  );

  if (matched) {
    state.backpackFilterSubject = matched.code;
    renderBackpackView();

    setTimeout(() => {
      const section = document.getElementById(`bp-subject-${matched.code.toLowerCase()}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        section.style.borderColor = 'var(--accent-primary)';
        section.style.boxShadow = '0 0 24px rgba(99, 102, 241, 0.45)';
        setTimeout(() => {
          section.style.borderColor = '';
          section.style.boxShadow = '';
        }, 2500);
      }
    }, 120);
  }
};

/**
 * Preview file modal handler
 */
window.previewFile = function(fileId) {
  const file = state.backpackFiles.find(f => f.id === fileId);
  if (!file) return;

  const modal = elements.filePreviewModal;
  const fileIconInfo = getFileIcon(file.type, file.name);

  elements.previewFileName.textContent = file.name;
  elements.previewFileSub.textContent = `${file.subjectCode} • ${file.size || 'Tài liệu'}`;
  elements.previewFileIcon.className = `${fileIconInfo.icon} ${fileIconInfo.cls}`;

  // Handle external open button
  if (file.driveUrl) {
    elements.previewOpenExtBtn.style.display = 'inline-flex';
    elements.previewOpenExtBtn.href = file.driveUrl;
  } else {
    elements.previewOpenExtBtn.style.display = 'none';
  }

  // Handle download button
  if (file.fileBlob) {
    elements.previewDownloadBtn.style.display = 'inline-flex';
    elements.previewDownloadBtn.onclick = () => downloadOfflineFile(file.id);
  } else {
    elements.previewDownloadBtn.style.display = 'none';
  }

  elements.previewModalBody.innerHTML = '';

  // Render preview content
  if (file.fileBlob) {
    const objectUrl = URL.createObjectURL(file.fileBlob);
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
      elements.previewModalBody.innerHTML = `
        <iframe class="preview-iframe" src="${objectUrl}#toolbar=1&navpanes=1"></iframe>
      `;
    } else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      elements.previewModalBody.innerHTML = `
        <img class="preview-img" src="${objectUrl}" alt="${escapeHtml(file.name)}">
      `;
    } else {
      elements.previewModalBody.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <i class="${fileIconInfo.icon}" style="font-size: 4rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
          <h3>${escapeHtml(file.name)}</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Tài liệu đã được lưu trữ Offline trên máy của bạn.</p>
          <button class="btn-primary-small" onclick="downloadOfflineFile('${file.id}')">
            <i class="fa-solid fa-download"></i> Tải về máy để mở
          </button>
        </div>
      `;
    }
  } else if (file.driveUrl) {
    // If it's a Drive URL, embed Google Drive preview or open button
    let embedUrl = file.driveUrl;
    if (embedUrl.includes('drive.google.com/file/d/')) {
      embedUrl = embedUrl.replace(/\/view.*$/, '/preview');
    }

    elements.previewModalBody.innerHTML = `
      <iframe class="preview-iframe" src="${embedUrl}" allow="autoplay"></iframe>
    `;
  }

  modal.classList.remove('hidden');
};

window.downloadOfflineFile = function(fileId) {
  const file = state.backpackFiles.find(f => f.id === fileId);
  if (!file || !file.fileBlob) return;

  const url = URL.createObjectURL(file.fileBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Đang tải xuống: ${file.name}`);
};

window.deleteCustomBackpackFile = async function(fileId) {
  if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi Chiếc cặp?')) return;
  await deleteFileFromIndexedDB(fileId);
  state.backpackFiles = state.backpackFiles.filter(f => f.id !== fileId);
  renderBackpackView();
  showToast('Đã xóa tài liệu khỏi Chiếc cặp');
};

/**
 * Handle new files upload (Drag & Drop or File Input)
 */
async function handleFilesUpload(filesList, targetSubject = null) {
  if (!filesList || filesList.length === 0) return;

  let addedCount = 0;
  for (let i = 0; i < filesList.length; i++) {
    const file = filesList[i];
    const subjectCode = targetSubject || state.backpackFilterSubject || 'CO3117'; // default to CO3117 if none selected
    const ext = file.name.split('.').pop().toLowerCase();
    
    // Categorize
    let category = 'slides';
    if (file.name.toLowerCase().includes('btl') || file.name.toLowerCase().includes('nhom')) category = 'btl';
    if (file.name.toLowerCase().includes('thi') || file.name.toLowerCase().includes('de')) category = 'exams';

    const fileItem = {
      id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      subjectCode: subjectCode,
      category: category,
      name: file.name,
      type: ext,
      size: (file.size / (1024 * 1024) > 1) ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
      updatedAt: new Date().toISOString().split('T')[0],
      fileBlob: file,
      isOffline: true,
      isCustom: true,
      description: 'Tài liệu tải lên lưu trữ Offline'
    };

    await saveFileToIndexedDB(fileItem);
    state.backpackFiles.unshift(fileItem);
    addedCount++;
  }

  renderBackpackView();
  showToast(`Đã lưu thành công ${addedCount} tệp vào Chiếc cặp (Offline)!`);
}

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

async function loadWeeksIndex() {
  try {
    const res = await fetch('schedules/index.json');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        state.weeksList = json;
      }
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
    if (filePath.includes('tuan-36')) {
      markdownContent = DEFAULT_WEEK_36_MD;
    } else {
      markdownContent = DEFAULT_WEEK_35_MD;
    }
  }

  state.currentRawMarkdown = markdownContent;
  elements.markdownRawContent.value = markdownContent;
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
  elements.viewGridBtn.classList.toggle('active', viewName === 'grid');
  elements.viewTodayBtn.classList.toggle('active', viewName === 'today');
  elements.viewGradesBtn.classList.toggle('active', viewName === 'grades');
  elements.viewBackpackBtn.classList.toggle('active', viewName === 'backpack');
  elements.viewRawBtn.classList.toggle('active', viewName === 'raw');

  elements.gridViewContainer.classList.toggle('active', viewName === 'grid');
  elements.todayViewContainer.classList.toggle('active', viewName === 'today');
  elements.gradesViewContainer.classList.toggle('active', viewName === 'grades');
  elements.backpackViewContainer.classList.toggle('active', viewName === 'backpack');
  elements.rawViewContainer.classList.toggle('active', viewName === 'raw');

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
  elements.weekSelect.addEventListener('change', (e) => {
    loadWeekMarkdown(e.target.value);
  });

  // Prev / Next Week Buttons
  elements.prevWeekBtn.addEventListener('click', () => {
    const currentIndex = state.weeksList.findIndex(w => w.filename === state.currentWeekFile);
    if (currentIndex > 0) {
      loadWeekMarkdown(state.weeksList[currentIndex - 1].filename);
    } else {
      showToast('Đang ở tuần đầu tiên');
    }
  });

  elements.nextWeekBtn.addEventListener('click', () => {
    const currentIndex = state.weeksList.findIndex(w => w.filename === state.currentWeekFile);
    if (currentIndex < state.weeksList.length - 1) {
      loadWeekMarkdown(state.weeksList[currentIndex + 1].filename);
    } else {
      showToast('Đang ở tuần mới nhất');
    }
  });

  // View Switchers
  elements.viewGridBtn.addEventListener('click', () => switchView('grid'));
  elements.viewTodayBtn.addEventListener('click', () => switchView('today'));
  elements.viewGradesBtn.addEventListener('click', () => switchView('grades'));
  elements.viewBackpackBtn.addEventListener('click', () => switchView('backpack'));
  elements.viewRawBtn.addEventListener('click', () => switchView('raw'));

  // Search Box
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

  // Backpack Upload Actions
  if (elements.bpUploadBtn) {
    elements.bpUploadBtn.addEventListener('click', () => {
      elements.backpackFileInput.removeAttribute('data-target-subject');
      elements.backpackFileInput.click();
    });
  }

  if (elements.backpackFileInput) {
    elements.backpackFileInput.addEventListener('change', (e) => {
      const targetSub = elements.backpackFileInput.getAttribute('data-target-subject');
      handleFilesUpload(e.target.files, targetSub);
      elements.backpackFileInput.value = '';
    });
  }

  // Drag and Drop Zone
  if (elements.backpackDropzone) {
    elements.backpackDropzone.addEventListener('click', () => {
      elements.backpackFileInput.removeAttribute('data-target-subject');
      elements.backpackFileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      elements.backpackDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.backpackDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      elements.backpackDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.backpackDropzone.classList.remove('dragover');
      });
    });

    elements.backpackDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFilesUpload(files);
    });
  }

  // Add Link Modal
  if (elements.bpAddLinkBtn) {
    elements.bpAddLinkBtn.addEventListener('click', () => {
      elements.addLinkModal.classList.remove('hidden');
    });
  }

  if (elements.addLinkCloseBtn) {
    elements.addLinkCloseBtn.addEventListener('click', () => {
      elements.addLinkModal.classList.add('hidden');
    });
  }

  if (elements.addLinkCancelBtn) {
    elements.addLinkCancelBtn.addEventListener('click', () => {
      elements.addLinkModal.classList.add('hidden');
    });
  }

  if (elements.addLinkForm) {
    elements.addLinkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = elements.linkSubjectSelect.value;
      const category = elements.linkCategorySelect.value;
      const name = elements.linkNameInput.value.trim();
      const url = elements.linkUrlInput.value.trim();

      if (!name || !url) return;

      const newLinkItem = {
        id: 'link-' + Date.now(),
        subjectCode: subject,
        category: category,
        name: name,
        type: url.includes('drive.google.com') ? 'drive' : 'link',
        size: 'Liên kết',
        updatedAt: new Date().toISOString().split('T')[0],
        driveUrl: url,
        isOffline: false,
        isCustom: true,
        description: 'Liên kết do bạn thêm'
      };

      await saveFileToIndexedDB(newLinkItem);
      state.backpackFiles.unshift(newLinkItem);
      renderBackpackView();

      elements.addLinkForm.reset();
      elements.addLinkModal.classList.add('hidden');
      showToast(`Đã thêm liên kết: ${name}`);
    });
  }

  // Preview Modal Close
  if (elements.previewCloseBtn) {
    elements.previewCloseBtn.addEventListener('click', () => {
      elements.filePreviewModal.classList.add('hidden');
      elements.previewModalBody.innerHTML = '';
    });
  }

  // Close modals when clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === elements.filePreviewModal) {
      elements.filePreviewModal.classList.add('hidden');
      elements.previewModalBody.innerHTML = '';
    }
    if (e.target === elements.addLinkModal) {
      elements.addLinkModal.classList.add('hidden');
    }
  });

  // Print Button
  elements.printScheduleBtn.addEventListener('click', () => {
    window.print();
  });

  // Raw Markdown Actions
  elements.copyMarkdownBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.markdownRawContent.value).then(() => {
      showToast('Đã sao chép toàn bộ Markdown vào bộ nhớ tạm!');
    });
  });

  elements.reloadMarkdownBtn.addEventListener('click', () => {
    loadWeekMarkdown(state.currentWeekFile);
    showToast('Đã tải lại nội dung Markdown gốc');
  });

  elements.applyRawBtn.addEventListener('click', () => {
    const editedMd = elements.markdownRawContent.value;
    state.parsedSchedule = parseScheduleMarkdown(editedMd);
    renderSchedule();
    switchView('grid');
    showToast('Đã cập nhật giao diện xem thử từ Markdown!');
  });
}

/* ==========================================================================
   APP INITIALIZATION & PWA SERVICE WORKER
   ========================================================================== */

async function init() {
  // Load saved theme
  const savedTheme = localStorage.getItem('sched_theme');
  if (savedTheme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    elements.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  // Setup Clock and update every 10 seconds
  updateCurrentClock();
  setInterval(updateCurrentClock, 10000);

  // Setup Event Listeners
  setupEventListeners();

  // Load custom offline files from IndexedDB and combine with defaults
  const dbFiles = await getAllFilesFromIndexedDB();
  state.backpackFiles = [...dbFiles, ...DEFAULT_BACKPACK_ITEMS];

  // Initial render of Views
  renderGradesView();
  renderBackpackView();

  // Load available weeks and load initial week
  await loadWeeksIndex();
  await loadWeekMarkdown(state.currentWeekFile);

  // Register PWA Service Worker for Offline capability
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('PWA Service Worker đã kích hoạt:', reg.scope);
    } catch (err) {
      console.warn('Không thể đăng ký Service Worker:', err);
    }
  }
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
