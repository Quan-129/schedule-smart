/**
 * ==========================================================================
 * FRONTEND VIEW - STUDY INTENSITY HEATMAP & PRODUCTIVITY DASHBOARD
 * Bản đồ nhiệt cường độ học tập & mật độ tiết học (Tuần / Tháng / Quý / Năm)
 * ==========================================================================
 */

import { state } from '../../3.Database/state.js';
import { parseScheduleMarkdown } from '../../2.Backend/services/TimetableParser.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';

let currentHorizonMode = 'semester'; // 'week' | 'month' | 'semester' | 'year'
let currentMonthlyDate = new Date(); // Tháng đang xem trong chế độ Tháng

/**
 * Tính toán mức độ nhiệt (Level 0 - 4) dựa trên số tiết học trong ngày
 * @param {number} classCount 
 * @returns {number} 0, 1, 2, 3, 4
 */
export function getHeatmapLevel(classCount = 0) {
  if (!classCount || classCount <= 0) return 0;
  if (classCount <= 2) return 1;
  if (classCount <= 4) return 2;
  if (classCount <= 6) return 3;
  return 4;
}

/**
 * Đánh giá tải học tập của cả tuần
 * @param {number} totalClasses 
 * @returns {{ label: string, color: string, bg: string }}
 */
export function evaluateWeekWorkload(totalClasses = 0) {
  if (totalClasses === 0) {
    return { label: 'Tuần nghỉ', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  }
  if (totalClasses <= 8) {
    return { label: 'Nhẹ nhàng', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (totalClasses <= 16) {
    return { label: 'Vừa phải', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
  }
  if (totalClasses <= 24) {
    return { label: 'Cao điểm', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
  }
  return { label: 'Cháy Deadline 🔥', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' };
}

/**
 * Tổng hợp dữ liệu học tập của tất cả các tuần có sẵn
 * @param {Array<Object>} availableWeeks 
 * @param {string} currentWeekFile 
 * @returns {Array<Object>}
 */
export function aggregateSemesterData(availableWeeks = [], currentWeekFile = '') {
  const weeksData = [];

  (availableWeeks || []).forEach((w, idx) => {
    let parsed = null;

    // 1. Nếu là tuần hiện tại đang nạp trong state
    if (w.filename === currentWeekFile && state.scheduleData) {
      parsed = state.scheduleData;
    } else {
      // 2. Đọc từ LocalStorage nếu có bản sửa tùy chỉnh
      const customMd = localStorage.getItem(`smart_schedule_custom_md_${w.filename}`);
      if (customMd) {
        parsed = parseScheduleMarkdown(customMd);
      }
    }

    // 3. Nếu chưa có, tạo cấu trúc mặc định từ standard 7 days
    if (!parsed || !parsed.days) {
      parsed = {
        title: w.title || `Tuần ${idx + 1}`,
        days: [
          { name: 'Thứ 2', dayOfWeekNumber: 1, classes: [], isDayOff: true },
          { name: 'Thứ 3', dayOfWeekNumber: 2, classes: [], isDayOff: true },
          { name: 'Thứ 4', dayOfWeekNumber: 3, classes: [], isDayOff: true },
          { name: 'Thứ 5', dayOfWeekNumber: 4, classes: [], isDayOff: true },
          { name: 'Thứ 6', dayOfWeekNumber: 5, classes: [], isDayOff: true },
          { name: 'Thứ 7', dayOfWeekNumber: 6, classes: [], isDayOff: true },
          { name: 'Chủ Nhật', dayOfWeekNumber: 0, classes: [], isDayOff: true }
        ]
      };
    }

    let totalClasses = 0;
    const daysStats = [];

    const standardNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    standardNames.forEach(dayName => {
      const foundDay = (parsed.days || []).find(d => d.name === dayName);
      const classesCount = foundDay && !foundDay.isDayOff && foundDay.classes ? foundDay.classes.length : 0;
      totalClasses += classesCount;
      daysStats.push({
        dayName,
        classesCount,
        level: getHeatmapLevel(classesCount),
        classes: foundDay ? (foundDay.classes || []) : [],
        isDayOff: !foundDay || foundDay.isDayOff || classesCount === 0
      });
    });

    const workload = evaluateWeekWorkload(totalClasses);

    weeksData.push({
      id: w.id || `week-${idx + 1}`,
      filename: w.filename,
      title: w.title || `Tuần ${idx + 1}`,
      description: w.description || '',
      startDate: w.startDate || '',
      totalClasses,
      workload,
      days: daysStats,
      isCurrent: w.filename === currentWeekFile
    });
  });

  return weeksData;
}

/**
 * Render toàn bộ Giao diện Bản Đồ Nhiệt Cường Độ Học Tập
 * @param {Array<Object>} availableWeeks 
 * @param {string} currentWeekFile 
 * @param {Function} onSelectWeek 
 */
export function renderHeatmapView(availableWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  const container = document.getElementById('today-view-container');
  if (!container) return;

  const semesterWeeks = aggregateSemesterData(availableWeeks, currentWeekFile);

  // Tính các chỉ số thống kê KPI
  let totalSemesterClasses = 0;
  let peakWeek = null;
  let activeStudyDays = 0;

  semesterWeeks.forEach(w => {
    totalSemesterClasses += w.totalClasses;
    if (!peakWeek || w.totalClasses > peakWeek.totalClasses) {
      peakWeek = w;
    }
    w.days.forEach(d => {
      if (d.classesCount > 0) activeStudyDays++;
    });
  });

  // Tìm các tiết học hôm nay từ tuần hiện tại
  const currentWeekObj = semesterWeeks.find(w => w.filename === currentWeekFile) || semesterWeeks[0];
  const currentDayOfWeek = new Date().getDay(); // 0: CN, 1: T2, ..., 6: T7
  const todayDayNameMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayName = todayDayNameMap[currentDayOfWeek];
  
  const todayStats = currentWeekObj ? currentWeekObj.days.find(d => d.dayName === todayName) : null;
  const todayClasses = todayStats ? todayStats.classes : [];

  container.innerHTML = `
    <div class="heatmap-view-wrapper">
      
      <!-- 1. HERO KPI BANNER & TỔNG QUAN HỌC TẬP -->
      <div class="heatmap-hero-banner">
        <div class="heatmap-header-row">
          <div class="heatmap-title-group">
            <div class="heatmap-icon-glow">
              <i class="fa-solid fa-fire-flame-curved"></i>
            </div>
            <div>
              <h2 class="heatmap-title">Bản Đồ Nhiệt Cường Độ Học Tập</h2>
              <span class="heatmap-subtitle">Phân tích mật độ tiết học, theo dõi tải học tập & năng suất sinh viên</span>
            </div>
          </div>
          <div class="heatmap-legend-row">
            <span>Mật độ:</span>
            <div class="legend-scale-boxes">
              <div class="legend-box level-0" title="0 tiết (Nghỉ)"></div>
              <div class="legend-box level-1" title="1-2 tiết (Nhẹ)"></div>
              <div class="legend-box level-2" title="3-4 tiết (Vừa)"></div>
              <div class="legend-box level-3" title="5-6 tiết (Dày)"></div>
              <div class="legend-box level-4" title="7+ tiết (Cao điểm / Thi)"></div>
            </div>
          </div>
        </div>

        <div class="heatmap-kpi-grid">
          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${todayClasses.length} tiết</span>
              <span class="heatmap-kpi-label">Hôm nay (${todayName})</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
              <i class="fa-solid fa-book-bookmark"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${totalSemesterClasses} tiết</span>
              <span class="heatmap-kpi-label">Tổng tiết cả học kỳ</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${peakWeek ? `${peakWeek.title} (${peakWeek.totalClasses}t)` : 'Chưa có'}</span>
              <span class="heatmap-kpi-label">Tuần cao điểm nhất</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
              <i class="fa-solid fa-fire"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${activeStudyDays} ngày</span>
              <span class="heatmap-kpi-label">Tổng ngày lên lớp</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. TODAY QUICK FOCUS WIDGET -->
      <div class="today-focus-card">
        <div class="today-focus-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span class="today-focus-badge"><i class="fa-regular fa-clock"></i> Tiết học Hôm nay</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${todayName} • ${currentWeekObj ? currentWeekObj.title : ''}</span>
          </div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${todayClasses.length > 0 ? `${todayClasses.length} buổi học đang chờ bạn` : 'Hôm nay bạn được nghỉ ngơi'}</span>
        </div>

        ${todayClasses.length > 0 ? `
          <div class="today-focus-classes-grid">
            ${todayClasses.map(c => `
              <div class="today-class-mini-card">
                <div class="today-mini-time">
                  <i class="fa-regular fa-clock"></i>
                  <span>${escapeHtml(c.timeRange)}</span>
                  ${c.period ? `<span style="opacity: 0.75;">(${escapeHtml(c.period)})</span>` : ''}
                </div>
                <div class="today-mini-subject">
                  <i class="fa-solid fa-book-open" style="color: #818cf8; font-size: 0.85rem;"></i>
                  <span>${escapeHtml(c.subject)}</span>
                </div>
                <div class="today-mini-room">
                  <i class="fa-solid fa-location-dot"></i>
                  <span>Phòng: ${escapeHtml(c.room || 'Chưa xếp')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; color: var(--text-muted); font-size: 0.88rem;">
            <i class="fa-solid fa-mug-hot" style="font-size: 1.25rem; color: #10b981;"></i>
            <span>Không có lịch học trong ngày hôm nay. Hãy tận dụng thời gian để ôn tập hoặc nghỉ ngơi nhé!</span>
          </div>
        `}
      </div>

      <!-- 3. BỘ LỌC CHUYỂN ĐỔI CHẾ ĐỘ THỜI GIAN -->
      <div class="heatmap-controls-bar">
        <div class="heatmap-mode-tabs">
          <button type="button" class="btn-heatmap-tab ${currentHorizonMode === 'week' ? 'active' : ''}" data-mode="week">
            <i class="fa-solid fa-table-columns"></i> <span>1. Tuần</span>
          </button>
          <button type="button" class="btn-heatmap-tab ${currentHorizonMode === 'month' ? 'active' : ''}" data-mode="month">
            <i class="fa-solid fa-calendar-days"></i> <span>2. Tháng</span>
          </button>
          <button type="button" class="btn-heatmap-tab ${currentHorizonMode === 'semester' ? 'active' : ''}" data-mode="semester">
            <i class="fa-solid fa-layer-group"></i> <span>3. Học Kỳ / Quý</span>
          </button>
          <button type="button" class="btn-heatmap-tab ${currentHorizonMode === 'year' ? 'active' : ''}" data-mode="year">
            <i class="fa-solid fa-chart-line"></i> <span>4. Cả Năm</span>
          </button>
        </div>

        <span style="font-size: 0.76rem; color: var(--text-muted);">
          <i class="fa-regular fa-hand-pointer"></i> Bấm vào ô/thẻ để mở nhanh lịch học
        </span>
      </div>

      <!-- 4. KHUNG NỘI DUNG HEATMAP TƯƠNG ỨNG -->
      <div id="heatmap-dynamic-content-area">
        <!-- Render động theo currentHorizonMode -->
      </div>
    </div>
  `;

  // Render nội dung theo chế độ hiện tại
  renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);

  // Gắn sự kiện chuyển chế độ Tab
  container.querySelectorAll('.btn-heatmap-tab').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-heatmap-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentHorizonMode = btn.dataset.mode || 'semester';
      renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);
    };
  });
}

/**
 * Render nội dung chi tiết theo chế độ thời gian đang chọn
 * @param {Array<Object>} semesterWeeks 
 * @param {string} currentWeekFile 
 * @param {Function} onSelectWeek 
 */
function renderActiveHorizonModeContent(semesterWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  const contentArea = document.getElementById('heatmap-dynamic-content-area');
  if (!contentArea) return;

  if (currentHorizonMode === 'week') {
    renderWeeklyMatrixView(contentArea, semesterWeeks, currentWeekFile, onSelectWeek);
  } else if (currentHorizonMode === 'month') {
    renderMonthlyCalendarView(contentArea, semesterWeeks, onSelectWeek);
  } else if (currentHorizonMode === 'year') {
    renderYearlyMatrixView(contentArea, semesterWeeks, onSelectWeek);
  } else {
    renderSemesterCardsView(contentArea, semesterWeeks, currentWeekFile, onSelectWeek);
  }
}

/**
 * 1️⃣ CHẾ ĐỘ TUẦN: Ma trận 7 ngày theo thời gian thực
 */
function renderWeeklyMatrixView(container, semesterWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  const currentWeek = semesterWeeks.find(w => w.filename === currentWeekFile) || semesterWeeks[0];
  if (!currentWeek) {
    container.innerHTML = `<p style="color: var(--text-muted);">Chưa có dữ liệu tuần.</p>`;
    return;
  }

  const currentDayOfWeek = new Date().getDay();
  const dayIndexMap = { 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6, 'Chủ Nhật': 0 };

  container.innerHTML = `
    <div class="heatmap-weekly-container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">
          ${escapeHtml(currentWeek.title)} ${currentWeek.description ? `• <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">${escapeHtml(currentWeek.description)}</span>` : ''}
        </h3>
        <span class="semester-workload-badge" style="background: ${currentWeek.workload.bg}; color: ${currentWeek.workload.color};">
          ${currentWeek.workload.label} (${currentWeek.totalClasses} tiết)
        </span>
      </div>

      <table class="weekly-matrix-table">
        <thead>
          <tr>
            ${currentWeek.days.map(d => {
              const isToday = dayIndexMap[d.dayName] === currentDayOfWeek;
              return `<th class="${isToday ? 'is-today-col' : ''}">${escapeHtml(d.dayName)} ${isToday ? '(Hôm nay)' : ''}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${currentWeek.days.map(d => `
              <td class="weekly-matrix-cell ${d.classesCount > 0 ? 'has-classes' : 'is-day-off'}">
                <span class="weekly-cell-badge level-${d.level}">
                  ${d.classesCount > 0 ? `${d.classesCount} tiết` : 'Nghỉ'}
                </span>
                ${d.classesCount > 0 ? `
                  <div class="weekly-cell-classes-list">
                    ${d.classes.map(c => `
                      <div class="weekly-cell-class-pill">
                        <strong>${escapeHtml(c.subject)}</strong>
                        <span><i class="fa-regular fa-clock"></i> ${escapeHtml(c.timeRange)}</span>
                        ${c.room ? `<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.room)}</span>` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div style="text-align: center; padding: 1.5rem 0; color: var(--text-muted); font-size: 0.78rem;">
                    <i class="fa-solid fa-couch" style="font-size: 1.25rem; opacity: 0.4; margin-bottom: 0.35rem; display: block;"></i>
                    Nghỉ ngơi
                  </div>
                `}
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 2️⃣ CHẾ ĐỘ THÁNG: Lưới lịch 30/31 ngày Heatmap
 */
function renderMonthlyCalendarView(container, semesterWeeks = [], onSelectWeek = null) {
  const year = currentMonthlyDate.getFullYear();
  const month = currentMonthlyDate.getMonth(); // 0 - 11

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0: CN, 1: T2
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Chuyển start day: Thứ 2 = index 0
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  // Xây dựng các ô ngày
  const cells = [];

  // Các ngày của tháng trước
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      dayNum: daysInPrevMonth - i,
      isOtherMonth: true,
      classesCount: 0,
      level: 0
    });
  }

  // Các ngày trong tháng hiện tại
  for (let d = 1; d <= daysInMonth; d++) {
    // Ước tính số tiết từ dữ liệu tuần (hoặc ngẫu nhiên mô phỏng nếu chưa có ngày cụ thể)
    const dayOfWeek = new Date(year, month, d).getDay();
    const dayNameMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dName = dayNameMap[dayOfWeek];

    // Lấy số tiết từ tuần gần nhất có ngày đó
    let count = 0;
    const matchedWeek = semesterWeeks[d % semesterWeeks.length] || semesterWeeks[0];
    if (matchedWeek) {
      const dayStat = matchedWeek.days.find(x => x.dayName === dName);
      count = dayStat ? dayStat.classesCount : 0;
    }

    cells.push({
      dayNum: d,
      isOtherMonth: false,
      isToday: isThisMonth && today.getDate() === d,
      classesCount: count,
      level: getHeatmapLevel(count),
      weekRef: matchedWeek ? matchedWeek.filename : ''
    });
  }

  container.innerHTML = `
    <div class="heatmap-monthly-container">
      <div class="monthly-calendar-header">
        <h3 class="monthly-calendar-title">
          <i class="fa-solid fa-calendar-days" style="color: #818cf8;"></i>
          <span>${monthNames[month]} Năm ${year}</span>
        </h3>
        <div style="display: flex; gap: 0.35rem;">
          <button type="button" id="btn-prev-month" class="btn-ghost" style="padding: 0.35rem 0.65rem;" title="Tháng trước">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" id="btn-this-month" class="btn-ghost" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
            Hiện tại
          </button>
          <button type="button" id="btn-next-month" class="btn-ghost" style="padding: 0.35rem 0.65rem;" title="Tháng sau">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div class="monthly-calendar-grid">
        <div class="monthly-day-header">T2</div>
        <div class="monthly-day-header">T3</div>
        <div class="monthly-day-header">T4</div>
        <div class="monthly-day-header">T5</div>
        <div class="monthly-day-header">T6</div>
        <div class="monthly-day-header">T7</div>
        <div class="monthly-day-header">CN</div>

        ${cells.map(c => `
          <div class="monthly-day-cell level-${c.level} ${c.isOtherMonth ? 'is-other-month' : ''} ${c.isToday ? 'is-today-cell' : ''}" 
            data-week="${escapeHtml(c.weekRef || '')}" 
            title="Ngày ${c.dayNum}/${month + 1}: ${c.classesCount} tiết học">
            <span class="monthly-day-number">${c.dayNum}</span>
            <span class="monthly-day-status">
              ${c.classesCount > 0 ? `${c.classesCount} tiết` : 'Nghỉ'}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Gắn sự kiện chuyển tháng
  const prevBtn = document.getElementById('btn-prev-month');
  const thisBtn = document.getElementById('btn-this-month');
  const nextBtn = document.getElementById('btn-next-month');

  if (prevBtn) {
    prevBtn.onclick = () => {
      currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() - 1);
      renderMonthlyCalendarView(container, semesterWeeks, onSelectWeek);
    };
  }
  if (thisBtn) {
    thisBtn.onclick = () => {
      currentMonthlyDate = new Date();
      renderMonthlyCalendarView(container, semesterWeeks, onSelectWeek);
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() + 1);
      renderMonthlyCalendarView(container, semesterWeeks, onSelectWeek);
    };
  }

  // Click vào ngày -> Mở tuần tương ứng
  container.querySelectorAll('.monthly-day-cell').forEach(cell => {
    cell.onclick = () => {
      const weekFile = cell.dataset.week;
      if (weekFile && typeof onSelectWeek === 'function') {
        onSelectWeek(weekFile);
      }
    };
  });
}

/**
 * 3️⃣ CHẾ ĐỘ HỌC KỲ / QUÝ: Dải thẻ nhiệt của tất cả các tuần trong kỳ
 */
function renderSemesterCardsView(container, semesterWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  if (!semesterWeeks || semesterWeeks.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted);">Chưa có danh sách tuần học trong kỳ.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="heatmap-semester-container">
      ${semesterWeeks.map(w => `
        <div class="semester-week-card ${w.isCurrent ? 'is-current-viewed' : ''}" data-filename="${escapeHtml(w.filename)}">
          <div class="semester-card-header">
            <div>
              <h4 class="semester-week-title">${escapeHtml(w.title)}</h4>
              ${w.description ? `<span style="font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(w.description)}</span>` : ''}
            </div>
            <span class="semester-workload-badge" style="background: ${w.workload.bg}; color: ${w.workload.color};">
              ${w.workload.label}
            </span>
          </div>

          <!-- DẢI 7 NGÀY MINI HEATMAP -->
          <div class="semester-days-mini-strip">
            ${w.days.map(d => `
              <div class="semester-day-mini-box level-${d.level}" title="${escapeHtml(d.dayName)}: ${d.classesCount} tiết">
                <span>${d.dayName.replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}</span>
              </div>
            `).join('')}
          </div>

          <div class="semester-card-footer">
            <span><i class="fa-solid fa-graduation-cap"></i> ${w.totalClasses} tiết học</span>
            <button type="button" class="btn-open-week-direct">
              <span>Xem lịch tuần</span> <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Gắn sự kiện click vào thẻ tuần -> Chuyển về xem tuần đó trên Tab 1
  container.querySelectorAll('.semester-week-card').forEach(card => {
    card.onclick = () => {
      const filename = card.dataset.filename;
      if (filename && typeof onSelectWeek === 'function') {
        onSelectWeek(filename);
      }
    };
  });
}

/**
 * 4️⃣ CHẾ ĐỘ CẢ NĂM: Ma trận 52 tuần x 7 ngày GitHub-Style
 */
function renderYearlyMatrixView(container, semesterWeeks = [], onSelectWeek = null) {
  const months = ['Th 9', 'Th 10', 'Th 11', 'Th 12', 'Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8'];
  const dayLabels = ['T2', '', 'T4', '', 'T6', '', 'CN'];

  // Tạo 52 tuần x 7 ngày = 364 ô
  const totalWeeksCount = 52;
  const squares = [];

  for (let w = 0; w < totalWeeksCount; w++) {
    const weekData = semesterWeeks[w % semesterWeeks.length] || null;
    for (let d = 0; d < 7; d++) {
      let count = 0;
      let dayName = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'][d];
      let level = 0;

      if (weekData && weekData.days) {
        const dStat = weekData.days[d];
        if (dStat) {
          count = dStat.classesCount;
          level = dStat.level;
        }
      }

      squares.push({
        weekIdx: w + 1,
        dayIdx: d,
        dayName,
        classesCount: count,
        level,
        weekFilename: weekData ? weekData.filename : ''
      });
    }
  }

  container.innerHTML = `
    <div class="heatmap-yearly-container">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-chart-line" style="color: #a855f7;"></i>
          <span>Toàn Cảnh Năm Học (52 Tuần Học & Rèn Luyện)</span>
        </h3>
        <span style="font-size: 0.76rem; color: var(--text-muted);">
          Chuẩn GitHub Contribution Matrix
        </span>
      </div>

      <div class="yearly-matrix-scroll-wrap">
        <!-- Hàng tên tháng -->
        <div class="yearly-months-row">
          ${months.map(m => `<span>${m}</span>`).join('')}
        </div>

        <div class="yearly-matrix-body">
          <!-- Nhãn thứ -->
          <div class="yearly-days-labels">
            ${dayLabels.map(l => `<span>${l}</span>`).join('')}
          </div>

          <!-- Lưới 364 ô vuông -->
          <div class="yearly-squares-grid" id="yearly-squares-grid">
            ${squares.map(sq => `
              <div class="yearly-square-item level-${sq.level}" 
                data-week-num="${sq.weekIdx}"
                data-day="${sq.dayName}"
                data-count="${sq.classesCount}"
                data-filename="${escapeHtml(sq.weekFilename)}"
                title="Tuần ${sq.weekIdx} • ${sq.dayName}: ${sq.classesCount} tiết học">
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Click vào ô vuông -> Mở tuần tương ứng
  container.querySelectorAll('.yearly-square-item').forEach(sq => {
    sq.onclick = () => {
      const fn = sq.dataset.filename;
      if (fn && typeof onSelectWeek === 'function') {
        onSelectWeek(fn);
      }
    };
  });
}
