/**
 * ==========================================================================
 * LỊCH HỌC MARKDOWN HUB - JAVASCRIPT LOGIC & PARSER
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
- Nghỉ cuối tuần.

## Lưu ý nhỏ:
- Báo cáo tiến độ Đồ án Chuyên ngành tuần 2.
- Chuẩn bị bài thuyết trình Tiếp thị Căn bản.`;

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

// App State
const state = {
  currentWeekFile: 'schedules/tuan-35.md',
  currentRawMarkdown: '',
  parsedSchedule: null,
  activeFilterSubject: null,
  searchQuery: '',
  activeView: 'grid', // 'grid', 'today', 'raw'
  weeksList: [
    { id: 'tuan-35', title: 'Tuần 35', filename: 'schedules/tuan-35.md' },
    { id: 'tuan-36', title: 'Tuần 36', filename: 'schedules/tuan-36.md' }
  ],
  subjectColorMap: new Map()
};

// DOM Elements
const elements = {
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  weekSelect: document.getElementById('week-select'),
  prevWeekBtn: document.getElementById('prev-week-btn'),
  nextWeekBtn: document.getElementById('next-week-btn'),
  
  viewGridBtn: document.getElementById('view-grid-btn'),
  viewTodayBtn: document.getElementById('view-today-btn'),
  viewRawBtn: document.getElementById('view-raw-btn'),
  
  gridViewContainer: document.getElementById('grid-view-container'),
  todayViewContainer: document.getElementById('today-view-container'),
  rawViewContainer: document.getElementById('raw-view-container'),
  
  scheduleGrid: document.getElementById('schedule-grid'),
  todayTimelineList: document.getElementById('today-timeline-list'),
  todayTitleBadge: document.getElementById('today-title-badge'),
  todaySummaryText: document.getElementById('today-summary-text'),
  
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
      // Check if it's day off ("Nghỉ." or "Nghỉ cuối tuần.")
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

        // Extract start and end time for sorting and comparison
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
        // Fallback for non-standard lines
        const cleanText = rawLine.replace(/^[-*]\s*/, '').trim();
        if (cleanText) {
          currentDay.rawNotes.push(cleanText);
        }
      }
    }
  }

  return result;
}

/**
 * Converts Vietnamese day string to standard JS Day of week index (0 = Sun, 1 = Mon, ..., 6 = Sat)
 */
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

/**
 * Deterministically assigns a unique color palette to each subject
 */
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

/**
 * Main render function
 */
function renderSchedule() {
  if (!state.parsedSchedule) return;

  const { title, days, notes } = state.parsedSchedule;
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ...

  // Update Title & Subtitle
  elements.scheduleTitle.textContent = title;
  elements.scheduleSubtitle.textContent = `Hiển thị dữ liệu từ ${state.currentWeekFile}`;
  elements.rawFileName.textContent = state.currentWeekFile;

  // Calculate statistics and append dates
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

  // Render Filter Subject Tags
  renderSubjectFilters(Array.from(uniqueSubjects));

  // Render Grid View
  renderGridView(days, currentDayOfWeek);

  // Render Today View
  renderTodayView(days, currentDayOfWeek);

  // Render Notes
  renderNotesView(notes);

  // Determine and render next class
  updateNextClassBadge(days, currentDayOfWeek);
}

/**
 * Render subject filter buttons
 */
function renderSubjectFilters(subjects) {
  elements.subjectFilterTags.innerHTML = '';
  
  // "All" tag
  const allBtn = document.createElement('button');
  allBtn.className = `tag-btn ${!state.activeFilterSubject ? 'active' : ''}`;
  allBtn.innerHTML = `Tất cả môn (${subjects.length})`;
  allBtn.addEventListener('click', () => {
    state.activeFilterSubject = null;
    renderSchedule();
  });
  elements.subjectFilterTags.appendChild(allBtn);

  // Individual Subject Tags
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

/**
 * Render Weekly Grid View
 */
function renderGridView(days, currentDayOfWeek) {
  elements.scheduleGrid.innerHTML = '';

  days.forEach(day => {
    // Filter classes if search or tag active
    let filteredClasses = day.classes;

    if (state.activeFilterSubject) {
      filteredClasses = filteredClasses.filter(c => c.subject === state.activeFilterSubject);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      
      const normalizedDayName = day.name.toLowerCase();
      // Hỗ trợ tìm kiếm theo cả dạng "25/08" và "25-08"
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

    // Check if this card represents today
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
              <button class="btn-copy-info" title="Sao chép thông tin tiết học" onclick="copyClassInfo('${escapeHtml(c.subject)}', '${escapeHtml(c.timeRange)}', '${escapeHtml(c.room)}')">
                <i class="fa-regular fa-copy"></i>
              </button>
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

/**
 * Render Today Focus View
 */
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
      </div>
    `;
    elements.todayTimelineList.appendChild(item);
  });
}

/**
 * Render Notes and Reminders
 */
function renderNotesView(notes) {
  if (!notes || notes.length === 0) {
    elements.notesSection.style.display = 'none';
    return;
  }

  elements.notesSection.style.display = 'block';
  elements.notesBody.innerHTML = `
    <ul>
      ${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
    </ul>
  `;
}

/**
 * Determines and displays next class in hero banner
 */
function updateNextClassBadge(days, currentDayOfWeek) {
  const todayDay = days.find(d => d.dayOfWeekNumber === currentDayOfWeek);
  
  if (todayDay && todayDay.classes.length > 0) {
    const firstClass = todayDay.classes[0];
    elements.nextClassName.textContent = firstClass.subject;
    elements.nextClassDetail.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(firstClass.room)} | <i class="fa-regular fa-clock"></i> ${escapeHtml(firstClass.timeRange)}`;
  } else {
    // Find next upcoming class in future days of the week
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

/* ==========================================================================
   DATA LOADING & MANAGEMENT
   ========================================================================== */

/**
 * Loads list of weeks from schedules/index.json if available
 */
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

  // Populate Select Dropdown
  elements.weekSelect.innerHTML = '';
  state.weeksList.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.filename;
    opt.textContent = w.title;
    elements.weekSelect.appendChild(opt);
  });

  elements.weekSelect.value = state.currentWeekFile;
}

/**
 * Loads a Markdown file content
 */
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

/* ==========================================================================
   INTERACTION HELPERS & UTILS
   ========================================================================== */

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
  const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  elements.currentDateText.textContent = `${dayStr}, ${dateStr} • ${timeStr}`;
}

function switchView(viewName) {
  state.activeView = viewName;
  elements.viewGridBtn.classList.toggle('active', viewName === 'grid');
  elements.viewTodayBtn.classList.toggle('active', viewName === 'today');
  elements.viewRawBtn.classList.toggle('active', viewName === 'raw');

  elements.gridViewContainer.classList.toggle('active', viewName === 'grid');
  elements.todayViewContainer.classList.toggle('active', viewName === 'today');
  elements.rawViewContainer.classList.toggle('active', viewName === 'raw');
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
   APP INITIALIZATION
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

  // Load available weeks and load initial week
  await loadWeeksIndex();
  await loadWeekMarkdown(state.currentWeekFile);
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
