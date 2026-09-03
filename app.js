/**
 * ==========================================================================
 * LỊCH HỌC MARKDOWN HUB & CHIẾC CẶP GOOGLE DRIVE
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

// Grade Schemes parsed from official Course Syllabi
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
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 60, type: 'Tự luận', duration: '90 phút', color: '#6366f1', note: 'Từ chương 6 đến chương 10' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận', duration: '60 phút', color: '#ec4899', note: 'Đến hết chương 5' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Assignment)', weight: 10, type: 'Project nhóm thực hành', duration: '45 tiết', color: '#10b981', note: 'Triển khai mô hình bài toán thực tế' }
    ],
    notes: 'Quy định AI: Chỉ cho phép dùng hỗ trợ tìm kiếm tài liệu. Nghiêm cấm nộp sản phẩm hoàn toàn do AI tạo ra.'
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
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 40, type: 'Trắc nghiệm chấm máy', duration: '70 phút', color: '#6366f1', note: 'Bắt buộc tham gia >= 80% số giờ học' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Trắc nghiệm chấm máy', duration: '50 phút', color: '#f59e0b', note: 'Đánh giá kiến thức nửa đầu học kỳ' },
      { id: 'item-cn', name: 'Bài tập cá nhân (Individual)', weight: 15, type: 'Bài tập về nhà & Phản tư', duration: '--', color: '#06b6d4', note: 'Đánh giá nhận thức cá nhân' },
      { id: 'item-nhom', name: 'Bài tập nhóm (Group Assignment)', weight: 15, type: 'Báo cáo dự án & Thuyết trình', duration: '--', color: '#10b981', note: 'Phối hợp làm việc nhóm' }
    ],
    notes: 'Nộp bài trễ trên LMS bị trừ 2 điểm/ngày. Tham dự tối thiểu 80% số giờ học là điều kiện bắt buộc.'
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
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Trắc nghiệm', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung theo lịch chung' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Project)', weight: 30, type: 'Dự án nhóm & Thuyết trình', duration: 'Nhóm 6-7 SV', color: '#ec4899', note: 'Vắng thuyết trình BTL bị 0 điểm BTL' },
      { id: 'item-tx', name: 'Đánh giá thường xuyên (Formative)', weight: 20, type: 'Bài tập trên lớp / Online', duration: '--', color: '#10b981', note: 'Vắng bài tập nào bị 0 điểm bài đó' }
    ],
    notes: 'Sinh viên làm việc nhóm 6-7 người. Vắng buổi thuyết trình BTL bị 0 điểm BTL.'
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
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận / Trắc nghiệm', duration: '60 phút', color: '#f59e0b', note: 'Thuật toán tìm kiếm, Logic, CSP' },
      { id: 'item-btl', name: 'Bài tập lớn / Thực hành', weight: 20, type: 'Project lập trình AI theo nhóm', duration: 'Hạn: 30/11', color: '#10b981', note: 'Cài đặt thuật toán & nộp báo cáo' }
    ],
    notes: 'Deadline nộp Bài tập lớn vào Thứ 2 (30/11/2026).'
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
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Chuyên cần & Trắc nghiệm online', duration: '--', color: '#ec4899', note: 'Bài tập trên hệ thống BKEL' }
    ],
    notes: 'Tuần 47 là tuần học cuối môn.'
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
      { id: 'item-qt', name: 'Đánh giá quá trình (Giữa kỳ & Thảo luận)', weight: 30, type: 'Trắc nghiệm online / Bài tập lớp', duration: '--', color: '#f59e0b', note: 'Kiểm tra trên hệ thống BKEL' }
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
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Nghe, Đọc, Viết & Kaiwa', duration: '90 phút', color: '#6366f1', note: 'Đánh giá toàn diện 4 kỹ năng' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Kiểm tra từ vựng, Kaiwa, Chuyên cần', duration: '--', color: '#10b981', note: 'Kiểm tra định kỳ theo từng tuần học' }
    ],
    notes: 'Lịch học 4 buổi sáng liên tục mỗi tuần (Thứ 3 đến Thứ 6).'
  }
];

// Clean Initial Subject List (PURE GOOGLE DRIVE - NO DUMMY FOLDERS OR MOCK FILES)
const INITIAL_SUBJECT_DRIVE = [
  { code: 'CO3117', name: 'Học máy', color: '#6366f1', driveUrl: '', links: [] },
  { code: 'IM1025', name: 'Quản lý Dự án cho Kỹ sư', color: '#f59e0b', driveUrl: '', links: [] },
  { code: 'IM1019', name: 'Tiếp thị Căn bản', color: '#ec4899', driveUrl: '', links: [] },
  { code: 'CO3061', name: 'Nhập môn Trí tuệ Nhân tạo', color: '#06b6d4', driveUrl: '', links: [] },
  { code: 'SP1035', name: 'Tư tưởng Hồ Chí Minh', color: '#10b981', driveUrl: '', links: [] },
  { code: 'SP1039', name: 'Pháp luật Việt Nam Đại cương', color: '#8b5cf6', driveUrl: '', links: [] },
  { code: 'JP1007', name: 'Tiếng Nhật 7', color: '#14b8a6', driveUrl: '', links: [] }
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
  driveSubjects: [] // Pure Google Drive data
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
  
  // Minimal Backpack Elements (Google Drive Hub)
  backpackExplorer: document.getElementById('backpack-explorer'),
  backpackSubjectTags: document.getElementById('backpack-subject-tags'),
  bpAddLinkBtn: document.getElementById('bp-add-link-btn'),
  backpackSearchInput: document.getElementById('backpack-search-input'),
  bpClearSearchBtn: document.getElementById('bp-clear-search-btn'),
  bpSubjectsCount: document.getElementById('bp-subjects-count'),
  bpFilesCount: document.getElementById('bp-files-count'),
  
  // Modals
  filePreviewModal: document.getElementById('file-preview-modal'),
  previewFileName: document.getElementById('preview-file-name'),
  previewFileSub: document.getElementById('preview-file-sub'),
  previewFileIcon: document.getElementById('preview-file-icon'),
  previewModalBody: document.getElementById('preview-modal-body'),
  previewOpenExtBtn: document.getElementById('preview-open-ext-btn'),
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
                <button class="btn-view-subject-backpack" title="Mở Google Drive môn ${escapeHtml(c.subject)}" onclick="viewSubjectBackpack('${escapeHtml(c.subject)}')">
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
          <button class="btn-view-subject-backpack" title="Mở Google Drive môn ${escapeHtml(c.subject)}" onclick="viewSubjectBackpack('${escapeHtml(c.subject)}')">
            <i class="fa-brands fa-google-drive"></i>
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
   PURE GOOGLE DRIVE HUB (NO DUMMY FOLDERS - FULLY USER-CONTROLLED)
   ========================================================================== */

function loadDriveData() {
  try {
    const saved = localStorage.getItem('smart_backpack_subjects');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.driveSubjects = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('Could not parse saved drive data from localStorage', e);
  }
  // Fallback to initial clean list with no dummy subfolders
  state.driveSubjects = JSON.parse(JSON.stringify(INITIAL_SUBJECT_DRIVE));
}

function saveDriveData() {
  try {
    localStorage.setItem('smart_backpack_subjects', JSON.stringify(state.driveSubjects));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

function getDriveLinkIcon(type) {
  switch (type) {
    case 'pdf': return { icon: 'fa-solid fa-file-pdf', cls: 'pdf' };
    case 'slides': return { icon: 'fa-solid fa-file-powerpoint', cls: 'slides' };
    case 'btl': return { icon: 'fa-solid fa-users-rectangle', cls: 'btl' };
    case 'exams': return { icon: 'fa-solid fa-file-signature', cls: 'exams' };
    case 'drive': return { icon: 'fa-brands fa-google-drive', cls: 'drive' };
    default: return { icon: 'fa-solid fa-arrow-up-right-from-square', cls: 'link' };
  }
}

function renderBackpackView() {
  if (!elements.backpackExplorer) return;
  elements.backpackExplorer.innerHTML = '';

  // Render Subject Filter Tabs
  if (elements.backpackSubjectTags) {
    elements.backpackSubjectTags.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = `tag-btn ${!state.backpackFilterSubject ? 'active' : ''}`;
    allBtn.innerHTML = `Tất cả môn (${state.driveSubjects.length})`;
    allBtn.addEventListener('click', () => {
      state.backpackFilterSubject = null;
      renderBackpackView();
    });
    elements.backpackSubjectTags.appendChild(allBtn);

    state.driveSubjects.forEach(s => {
      const btn = document.createElement('button');
      btn.className = `tag-btn ${state.backpackFilterSubject === s.code ? 'active' : ''}`;
      btn.innerHTML = `<span class="tag-color-indicator" style="background-color: ${s.color || '#6366f1'}"></span> ${s.name}`;
      btn.addEventListener('click', () => {
        state.backpackFilterSubject = state.backpackFilterSubject === s.code ? null : s.code;
        renderBackpackView();
      });
      elements.backpackSubjectTags.appendChild(btn);
    });
  }

  // Populate Select Options in Add Link Modal
  if (elements.linkSubjectSelect) {
    elements.linkSubjectSelect.innerHTML = '';
    state.driveSubjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.code;
      opt.textContent = `${s.code} - ${s.name}`;
      elements.linkSubjectSelect.appendChild(opt);
    });
  }

  // Filter subjects
  const q = (state.backpackSearchQuery || '').toLowerCase().trim();
  let subjects = state.driveSubjects.filter(s => {
    if (state.backpackFilterSubject && s.code !== state.backpackFilterSubject) {
      return false;
    }
    return true;
  });

  // Calculate total links
  let totalLinksCount = 0;
  state.driveSubjects.forEach(s => {
    if (s.driveUrl) totalLinksCount++;
    if (s.links) totalLinksCount += s.links.length;
  });

  if (elements.bpSubjectsCount) elements.bpSubjectsCount.textContent = `${state.driveSubjects.length} Môn học`;
  if (elements.bpFilesCount) elements.bpFilesCount.textContent = `${totalLinksCount} Liên kết Drive`;

  const driveGrid = document.createElement('div');
  driveGrid.className = 'bp-drive-grid';

  let renderedCount = 0;

  subjects.forEach(subject => {
    let links = subject.links || [];
    if (q) {
      const subjectMatches = subject.name.toLowerCase().includes(q) || subject.code.toLowerCase().includes(q);
      if (!subjectMatches) {
        links = links.filter(l => 
          l.name.toLowerCase().includes(q) || 
          (l.note && l.note.toLowerCase().includes(q))
        );
        if (!subject.driveUrl || !subjectMatches) {
          if (links.length === 0) return;
        }
      }
    }

    renderedCount++;
    const color = subject.color || '#6366f1';
    const card = document.createElement('div');
    card.className = 'bp-drive-card';
    card.id = `bp-card-${subject.code.toLowerCase()}`;

    // Main Google Drive Folder button or Prompt
    let mainDriveHtml = '';
    if (subject.driveUrl) {
      mainDriveHtml = `
        <div class="bp-main-drive-action">
          <a href="${escapeHtml(subject.driveUrl)}" target="_blank" rel="noopener noreferrer" class="btn-main-drive-active" title="Mở thư mục Google Drive chính của môn">
            <span><i class="fa-brands fa-google-drive"></i> Mở Google Drive môn học</span>
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      `;
    } else {
      mainDriveHtml = `
        <div class="bp-main-drive-action">
          <button class="btn-main-drive-empty" onclick="editSubjectMainDrive('${subject.code}')" title="Gắn đường dẫn Google Drive của môn này">
            <i class="fa-brands fa-google-drive"></i> Gắn link Google Drive môn học
          </button>
        </div>
      `;
    }

    // Additional sub-links (if any)
    const linksHtml = links.map(l => {
      const iconInfo = getDriveLinkIcon(l.type);
      return `
        <div class="bp-drive-link-item">
          <div class="bp-link-left">
            <i class="${iconInfo.icon} bp-link-icon ${iconInfo.cls}"></i>
            <div class="bp-link-text">
              <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" class="bp-link-title" title="${escapeHtml(l.name)}">
                ${escapeHtml(l.name)}
              </a>
              ${l.note ? `<span class="bp-link-note">${escapeHtml(l.note)}</span>` : ''}
            </div>
          </div>
          <div class="bp-link-actions">
            <button class="btn-drive-action" title="Xem trước tài liệu" onclick="previewDriveUrl('${escapeHtml(l.name)}', '${escapeHtml(l.url)}', '${iconInfo.icon}', '${iconInfo.cls}')">
              <i class="fa-regular fa-eye"></i>
            </button>
            <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" class="btn-drive-action" title="Mở link">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button class="btn-drive-action delete" title="Xóa link này" onclick="deleteSubLink('${subject.code}', '${l.id}')">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="bp-drive-card-header">
        <div class="bp-drive-title-group">
          <div class="bp-drive-icon-badge" style="background-color: ${color}22; color: ${color};">
            <i class="fa-solid fa-book-bookmark"></i>
          </div>
          <div class="bp-drive-name-group">
            <h3 class="bp-drive-subject-name">${escapeHtml(subject.name)}</h3>
            <span class="bp-drive-subject-code">${escapeHtml(subject.code)}</span>
          </div>
        </div>
        ${subject.driveUrl ? `
          <button class="btn-file-action" title="Đổi link Drive chính" onclick="editSubjectMainDrive('${subject.code}')" style="width: 28px; height: 28px;">
            <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>
          </button>
        ` : ''}
      </div>

      ${mainDriveHtml}

      <div class="bp-drive-links-list">
        ${linksHtml}
        <button class="btn-add-sublink" onclick="openAddLinkModalFor('${subject.code}')">
          <i class="fa-solid fa-plus"></i> Thêm tài liệu / link con
        </button>
      </div>
    `;

    driveGrid.appendChild(card);
  });

  if (renderedCount === 0) {
    elements.backpackExplorer.innerHTML = `
      <div class="day-off-card" style="padding: 3.5rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>Không tìm thấy môn học</h3>
        <p>Thử tìm kiếm với tên môn hoặc mã môn khác...</p>
      </div>
    `;
    return;
  }

  elements.backpackExplorer.appendChild(driveGrid);
}

/**
 * Prompt to attach or edit main Google Drive URL for a subject
 */
window.editSubjectMainDrive = function(subjectCode) {
  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject) return;

  const current = subject.driveUrl || '';
  const newUrl = prompt(`Nhập link Google Drive chính cho môn "${subject.name}" (${subject.code}):`, current);
  
  if (newUrl !== null) {
    subject.driveUrl = newUrl.trim();
    saveDriveData();
    renderBackpackView();
    if (subject.driveUrl) {
      showToast(`Đã gắn link Google Drive cho môn ${subject.name}!`);
    } else {
      showToast(`Đã xóa link Drive của môn ${subject.name}`);
    }
  }
};

/**
 * Open modal to add a sub-link to a specific subject
 */
window.openAddLinkModalFor = function(subjectCode) {
  if (elements.addLinkModal) {
    elements.addLinkModal.classList.remove('hidden');
    if (elements.linkSubjectSelect) elements.linkSubjectSelect.value = subjectCode;
    if (elements.linkNameInput) elements.linkNameInput.focus();
  }
};

/**
 * Delete a specific sub-link from a subject
 */
window.deleteSubLink = function(subjectCode, linkId) {
  const subject = state.driveSubjects.find(s => s.code === subjectCode);
  if (!subject || !subject.links) return;

  if (confirm('Bạn có chắc muốn xóa liên kết này?')) {
    subject.links = subject.links.filter(l => l.id !== linkId);
    saveDriveData();
    renderBackpackView();
    showToast('Đã xóa liên kết');
  }
};

/**
 * Preview Google Drive URL in modal
 */
window.previewDriveUrl = function(title, url, iconCls = 'fa-brands fa-google-drive', colorCls = 'drive') {
  elements.previewFileName.textContent = title;
  elements.previewFileSub.textContent = 'Google Drive Preview';
  elements.previewFileIcon.className = `${iconCls} ${colorCls}`;
  elements.previewOpenExtBtn.href = url;

  let embedUrl = url;
  if (embedUrl.includes('drive.google.com/file/d/')) {
    embedUrl = embedUrl.replace(/\/view.*$/, '/preview');
  }

  elements.previewModalBody.innerHTML = `
    <iframe class="preview-iframe" src="${embedUrl}" allow="autoplay" loading="lazy"></iframe>
  `;

  elements.filePreviewModal.classList.remove('hidden');
};

/**
 * Jump from Timetable to Subject in Backpack
 */
window.viewSubjectBackpack = function(subjectName) {
  switchView('backpack');

  const matched = state.driveSubjects.find(s => 
    s.name.toLowerCase().includes(subjectName.toLowerCase()) || 
    subjectName.toLowerCase().includes(s.name.toLowerCase())
  );

  if (matched) {
    state.backpackFilterSubject = matched.code;
    renderBackpackView();

    setTimeout(() => {
      const card = document.getElementById(`bp-card-${matched.code.toLowerCase()}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.borderColor = 'var(--accent-primary)';
        card.style.boxShadow = '0 0 24px rgba(99, 102, 241, 0.45)';
        setTimeout(() => {
          card.style.borderColor = '';
          card.style.boxShadow = '';
        }, 2500);
      }
    }, 120);
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
   ========================================================================= */

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

  // View Switchers
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

  // Backpack Drive Search Box
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

  // Add Link Modal Triggers
  if (elements.bpAddLinkBtn) {
    elements.bpAddLinkBtn.addEventListener('click', () => {
      elements.addLinkModal.classList.remove('hidden');
      if (elements.linkSubjectSelect && state.backpackFilterSubject) {
        elements.linkSubjectSelect.value = state.backpackFilterSubject;
      }
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
    elements.addLinkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subjectCode = elements.linkSubjectSelect.value;
      const category = elements.linkCategorySelect.value;
      const name = elements.linkNameInput.value.trim();
      const url = elements.linkUrlInput.value.trim();

      if (!name || !url) return;

      const targetSubject = state.driveSubjects.find(s => s.code === subjectCode);
      if (targetSubject) {
        if (!targetSubject.links) targetSubject.links = [];
        targetSubject.links.unshift({
          id: 'link-' + Date.now(),
          name: name,
          category: category,
          type: url.includes('drive.google.com') ? 'drive' : 'link',
          url: url,
          note: 'Liên kết do bạn thêm'
        });

        saveDriveData();
        renderBackpackView();
      }

      elements.addLinkForm.reset();
      elements.addLinkModal.classList.add('hidden');
      showToast(`Đã thêm link Drive cho môn ${subjectCode}!`);
    });
  }

  // Preview Modal Close
  if (elements.previewCloseBtn) {
    elements.previewCloseBtn.addEventListener('click', () => {
      elements.filePreviewModal.classList.add('hidden');
      elements.previewModalBody.innerHTML = '';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === elements.filePreviewModal) {
      elements.filePreviewModal.classList.add('hidden');
      elements.previewModalBody.innerHTML = '';
    }
    if (e.target === elements.addLinkModal) elements.addLinkModal.classList.add('hidden');
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

  // Load clean Drive data
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
