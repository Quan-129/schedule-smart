/**
 * ==========================================================================
 * FRONTEND VIEW - STUDY INTENSITY HEATMAP & PRODUCTIVITY DASHBOARD
 * Bản đồ nhiệt cường độ học tập & mật độ buổi học (Tuần / Tháng / Học kỳ / Cả năm)
 * Tự động scale thời gian thực & Xếp lớp trùng giờ chuẩn Google Calendar
 * ==========================================================================
 */

import { state } from '../../3.Database/state.js';
import { parseScheduleMarkdown } from '../../2.Backend/services/TimetableParser.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';
import { getSubjectColor } from './TimetableGrid.js';
import { getDateForDayOfWeek } from '../../2.Backend/utils/dateHelpers.js';
import { showToast } from '../components/Toast.js';

/* ==========================================================================
   1. MODULE STATE & CONSTANTS
   ========================================================================== */
let currentHorizonMode = 'semester'; // 'week' | 'month' | 'semester' | 'year'
let currentMonthlyDate = new Date(); // Tháng đang xem trong chế độ Tháng
let activeWeeklyFile = ''; // File tuần đang xem trong chế độ Tuần

// Bộ nhớ đệm dữ liệu tất cả các tuần trong học kỳ
const weeksDataCache = new Map();
let isPreloadingWeeks = false;

/* ==========================================================================
   2. HELPER FUNCTIONS & DATA AGGREGATOR
   ========================================================================== */

/**
 * Tính toán thời lượng (theo giờ thập phân) của một lớp học / task
 * Hỗ trợ cả startTime/endTime và timeRange (ví dụ '07:00 - 11:30' -> 4.5h)
 * @param {Object} cls
 * @returns {number}
 */
export function getClassDurationHours(cls) {
  if (!cls) return 0;
  let sh = 7, sm = 0, eh = 9, em = 0;
  let hasValidTime = false;

  if (cls.startTime && cls.endTime) {
    const [h1, m1 = 0] = String(cls.startTime).split(':').map(Number);
    const [h2, m2 = 0] = String(cls.endTime).split(':').map(Number);
    if (!isNaN(h1) && !isNaN(h2)) {
      sh = h1; sm = m1; eh = h2; em = m2;
      hasValidTime = true;
    }
  } else if (cls.timeRange) {
    const parts = String(cls.timeRange).split('-');
    if (parts.length >= 2) {
      const [h1, m1 = 0] = parts[0].trim().split(':').map(Number);
      const [h2, m2 = 0] = parts[1].trim().split(':').map(Number);
      if (!isNaN(h1) && !isNaN(h2)) {
        sh = h1; sm = m1; eh = h2; em = m2;
        hasValidTime = true;
      }
    }
  }

  if (!hasValidTime) {
    return 1.5; // Mặc định 1 tiết học đại học 1.5 giờ
  }

  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin = startMin + 90;

  const durationMin = endMin - startMin;
  return Math.round((durationMin / 60) * 10) / 10;
}

/**
 * Tính tổng thời lượng (giờ) của tất cả các lớp trong ngày (cộng dồn kể cả trùng giờ)
 * @param {Array<Object>} classes
 * @returns {number}
 */
export function getDayTotalHours(classes = []) {
  if (!classes || classes.length === 0) return 0;
  const total = classes.reduce((sum, c) => sum + getClassDurationHours(c), 0);
  return Math.round(total * 10) / 10;
}

/**
 * Tính toán mức độ nhiệt (Level 0 - 4) dựa trên tổng số giờ học trong ngày
 * @param {number} totalHours - Tổng số giờ học trong ngày
 * @returns {number} 0, 1, 2, 3, 4
 */
export function getHeatmapLevel(totalHours = 0) {
  if (!totalHours || totalHours <= 0) return 0;
  if (totalHours <= 2.0) return 1;
  if (totalHours <= 4.0) return 2;
  if (totalHours <= 6.5) return 3;
  return 4;
}

/**
 * Đánh giá tải học tập của cả tuần (theo tổng số giờ học)
 * @param {number} totalHours - Tổng số giờ học trong tuần
 * @returns {{ label: string, color: string, bg: string }}
 */
export function evaluateWeekWorkload(totalHours = 0) {
  if (totalHours === 0) {
    return { label: 'Tuần nghỉ', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  }
  if (totalHours <= 10) {
    return { label: 'Nhẹ nhàng', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (totalHours <= 20) {
    return { label: 'Vừa phải', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
  }
  if (totalHours <= 30) {
    return { label: 'Cao điểm', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
  }
  return { label: 'Cháy máy 🔥', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' };
}

/**
 * Tự động nạp trước (preload) và cache nội dung tất cả các tuần học
 * @param {Array<Object>} availableWeeks 
 * @param {string} currentWeekFile 
 * @param {Function} onSelectWeek 
 */
export async function preloadAllWeeksData(availableWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  if (isPreloadingWeeks || !availableWeeks || availableWeeks.length === 0) return;
  isPreloadingWeeks = true;

  const fetchPromises = availableWeeks.map(async (w) => {
    if (weeksDataCache.has(w.filename)) return;

    const customMd = localStorage.getItem(`smart_schedule_custom_md_${w.filename}`);
    if (customMd) {
      weeksDataCache.set(w.filename, parseScheduleMarkdown(customMd));
      return;
    }

    try {
      const res = await fetch(w.filename);
      if (res.ok) {
        const text = await res.text();
        weeksDataCache.set(w.filename, parseScheduleMarkdown(text));
      }
    } catch (e) {
      console.warn(`[Heatmap] Không thể nạp ${w.filename}:`, e);
    }
  });

  await Promise.allSettled(fetchPromises);
  isPreloadingWeeks = false;

  const container = document.getElementById('today-view-container');
  if (container && document.getElementById('heatmap-dynamic-content-area')) {
    const semesterWeeks = aggregateSemesterData(availableWeeks, currentWeekFile);
    renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);
  }
}

/**
 * Kiểm tra xem một đối tượng tuần có chứa ngày hôm nay hay không (dựa theo startDate)
 * @param {Object} week
 * @returns {boolean}
 */
export function isWeekContainingToday(week) {
  if (!week || !week.startDate) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const start = new Date(week.startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

  return todayStr >= startStr && todayStr <= endStr;
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

    if (w.filename === currentWeekFile && state.scheduleData) {
      parsed = state.scheduleData;
    } else {
      const customMd = localStorage.getItem(`smart_schedule_custom_md_${w.filename}`);
      if (customMd) {
        parsed = parseScheduleMarkdown(customMd);
      } else if (weeksDataCache.has(w.filename)) {
        parsed = weeksDataCache.get(w.filename);
      }
    }

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
    let totalHours = 0;
    const daysStats = [];

    const standardNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    standardNames.forEach(dayName => {
      const foundDay = (parsed.days || []).find(d => d.name === dayName);
      const classes = foundDay && !foundDay.isDayOff && foundDay.classes ? foundDay.classes : [];
      const classesCount = classes.length;
      const dayHours = getDayTotalHours(classes);

      totalClasses += classesCount;
      totalHours += dayHours;

      daysStats.push({
        dayName,
        classesCount,
        totalHours: dayHours,
        level: getHeatmapLevel(dayHours),
        classes,
        isDayOff: !foundDay || foundDay.isDayOff || classesCount === 0
      });
    });

    totalHours = Math.round(totalHours * 10) / 10;
    const workload = evaluateWeekWorkload(totalHours);

    weeksData.push({
      id: w.id || `week-${idx + 1}`,
      filename: w.filename,
      title: w.title || `Tuần ${idx + 1}`,
      description: w.description || '',
      startDate: w.startDate || '',
      totalClasses,
      totalHours,
      workload,
      days: daysStats,
      isCurrent: w.filename === currentWeekFile,
      isTodayWeek: isWeekContainingToday(w)
    });
  });

  return weeksData;
}

/* ==========================================================================
   3. GLOBAL TOOLTIP POPOVER ENGINE
   ========================================================================== */
function setupHeatmapTooltips() {
  let tooltip = document.getElementById('heatmap-global-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'heatmap-global-tooltip';
    tooltip.className = 'heatmap-tooltip-popover hidden';
    document.body.appendChild(tooltip);
  }

  const items = document.querySelectorAll('[data-heatmap-tooltip]');
  items.forEach(el => {
    el.onmouseenter = (e) => {
      const title = el.getAttribute('data-tooltip-title') || '';
      const subtitle = el.getAttribute('data-tooltip-sub') || '';
      const body = el.getAttribute('data-tooltip-body') || '';
      const badge = el.getAttribute('data-tooltip-badge') || '';
      const badgeBg = el.getAttribute('data-tooltip-badge-bg') || 'rgba(99, 102, 241, 0.2)';
      const badgeColor = el.getAttribute('data-tooltip-badge-color') || '#818cf8';

      let html = '';
      if (title) {
        html += `<div class="tooltip-header-row">
          <div class="tooltip-title">${escapeHtml(title)}</div>
          ${badge ? `<span class="tooltip-badge" style="background:${badgeBg}; color:${badgeColor};">${escapeHtml(badge)}</span>` : ''}
        </div>`;
      }
      if (subtitle) {
        html += `<div class="tooltip-subtitle">${escapeHtml(subtitle)}</div>`;
      }
      if (body) {
        html += `<div class="tooltip-body">${body}</div>`;
      }

      tooltip.innerHTML = html;
      tooltip.classList.remove('hidden');
      updateTooltipPos(e);
    };

    el.onmousemove = (e) => {
      updateTooltipPos(e);
    };

    el.onmouseleave = () => {
      tooltip.classList.add('hidden');
    };
  });

  function updateTooltipPos(e) {
    const tooltipW = tooltip.offsetWidth || 240;
    const tooltipH = tooltip.offsetHeight || 80;
    const padding = 12;

    let left = e.clientX;
    let top = e.clientY - tooltipH - 12;

    if (left + tooltipW / 2 > window.innerWidth - padding) {
      left = window.innerWidth - tooltipW / 2 - padding;
    } else if (left - tooltipW / 2 < padding) {
      left = tooltipW / 2 + padding;
    }

    if (top < padding) {
      top = e.clientY + 20;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
}

/* ==========================================================================
   4. RENDERERS CHO 4 CHẾ ĐỘ HEATMAP (WEEK, MONTH, SEMESTER, YEAR)
   ========================================================================== */

/**
 * 1️⃣ CHẾ ĐỘ TUẦN: Lịch Tuần Scale Theo Khung Giờ Thực & Xếp Lớp Trùng Giờ (Google Calendar Style)
 */
function renderWeeklyMatrixView(container, semesterWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  if (!activeWeeklyFile) {
    activeWeeklyFile = currentWeekFile || (semesterWeeks[0] ? semesterWeeks[0].filename : '');
  }

  const selectedWeek = semesterWeeks.find(w => w.filename === activeWeeklyFile) || semesterWeeks[0];
  if (!selectedWeek) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">Chưa có dữ liệu tuần học.</p>`;
    return;
  }

  const currentDayOfWeek = new Date().getDay();
  const dayIndexMap = { 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6, 'Chủ Nhật': 0 };
  const standardDays = selectedWeek.days || [];

  // 1. TỰ ĐỘNG SCALE THỜI GIAN THEO TUẦN (Dynamic Time Bounds)
  let earliestMin = 24 * 60;
  let latestMax = 0;
  let hasAnyClasses = false;

  standardDays.forEach(d => {
    (d.classes || []).forEach(c => {
      hasAnyClasses = true;
      let sh = 7, sm = 0, eh = 9, em = 0;
      if (c.startTime && c.endTime) {
        const [h1, m1 = 0] = c.startTime.split(':').map(Number);
        const [h2, m2 = 0] = c.endTime.split(':').map(Number);
        if (!isNaN(h1)) { sh = h1; sm = m1; }
        if (!isNaN(h2)) { eh = h2; em = m2; }
      } else if (c.timeRange) {
        const parts = c.timeRange.split('-');
        if (parts.length >= 2) {
          const [h1, m1 = 0] = parts[0].trim().split(':').map(Number);
          const [h2, m2 = 0] = parts[1].trim().split(':').map(Number);
          if (!isNaN(h1)) { sh = h1; sm = m1; }
          if (!isNaN(h2)) { eh = h2; em = m2; }
        }
      }
      const sMin = sh * 60 + sm;
      const eMin = eh * 60 + em;
      earliestMin = Math.min(earliestMin, sMin);
      latestMax = Math.max(latestMax, eMin);
    });
  });

  let startHour = 7;
  let endHour = 18;

  if (hasAnyClasses) {
    startHour = Math.max(6, Math.floor(earliestMin / 60)); // Giờ bắt đầu (tối thiểu 6h)
    endHour = Math.min(23, Math.ceil(latestMax / 60) + 1); // Giờ kết thúc (tối đa 23h, cộng 1h đệm)
    if (endHour <= startHour) endHour = startHour + 8;
  }

  const HOUR_HEIGHT = 60; // px cho mỗi giờ
  const pxPerMinute = HOUR_HEIGHT / 60;
  const TOP_PADDING = 20; // Khoảng đệm trên đỉnh để mốc giờ đầu tiên không bị che
  const BOTTOM_PADDING = 24; // Khoảng đệm dưới đáy
  const totalHours = endHour - startHour;
  const totalTimelineHeight = totalHours * HOUR_HEIGHT + TOP_PADDING + BOTTOM_PADDING;

  const hoursList = [];
  for (let h = startHour; h <= endHour; h++) {
    hoursList.push(h);
  }

  // 2. THUẬT TOÁN XẾP LỚP TRÙNG GIỜ (Google Calendar Overlapping Algorithm)
  function layoutDayEvents(classes) {
    if (!classes || classes.length === 0) return [];

    const events = classes.map((c, idx) => {
      let sh = 7, sm = 0, eh = 9, em = 0;
      if (c.startTime && c.endTime) {
        const [h1, m1 = 0] = c.startTime.split(':').map(Number);
        const [h2, m2 = 0] = c.endTime.split(':').map(Number);
        if (!isNaN(h1)) { sh = h1; sm = m1; }
        if (!isNaN(h2)) { eh = h2; em = m2; }
      } else if (c.timeRange) {
        const parts = c.timeRange.split('-');
        if (parts.length >= 2) {
          const [h1, m1 = 0] = parts[0].trim().split(':').map(Number);
          const [h2, m2 = 0] = parts[1].trim().split(':').map(Number);
          if (!isNaN(h1)) { sh = h1; sm = m1; }
          if (!isNaN(h2)) { eh = h2; em = m2; }
        }
      }
      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;
      if (endMin <= startMin) endMin = startMin + 90;

      const top = Math.max(0, (startMin - startHour * 60) * pxPerMinute) + TOP_PADDING;
      const height = Math.max(38, (endMin - startMin) * pxPerMinute);

      return {
        ...c,
        id: `ev-${idx}`,
        startMin,
        endMin,
        top,
        height
      };
    });

    events.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    events.forEach(ev => {
      if (currentCluster.length === 0) {
        currentCluster.push(ev);
        clusterEnd = ev.endMin;
      } else {
        if (ev.startMin < clusterEnd) {
          currentCluster.push(ev);
          clusterEnd = Math.max(clusterEnd, ev.endMin);
        } else {
          clusters.push(currentCluster);
          currentCluster = [ev];
          clusterEnd = ev.endMin;
        }
      }
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);

    const result = [];
    clusters.forEach(cluster => {
      const cols = [];
      cluster.forEach(ev => {
        let placed = false;
        for (let i = 0; i < cols.length; i++) {
          if (ev.startMin >= cols[i]) {
            cols[i] = ev.endMin;
            ev.colIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          ev.colIndex = cols.length;
          cols.push(ev.endMin);
        }
      });

      const totalCols = cols.length;
      cluster.forEach(ev => {
        const widthPct = (100 / totalCols);
        const leftPct = ev.colIndex * widthPct;
        result.push({
          ...ev,
          left: `${leftPct}%`,
          width: totalCols > 1 ? `calc(${widthPct}% - 4px)` : `calc(100% - 6px)`,
          isOverlap: totalCols > 1
        });
      });
    });

    return result;
  }

  container.innerHTML = `
    <div class="heatmap-matrix-card">
      <div class="heatmap-card-header">
        <div class="heatmap-card-title-group">
          <div class="heatmap-card-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
            <i class="fa-solid fa-calendar-week"></i>
          </div>
          <div>
            <h3 class="heatmap-card-title">Thời Khóa Biểu Tuần (Google Calendar Style)</h3>
            <span class="heatmap-card-sub">Khung giờ tự động scale từ ${String(startHour).padStart(2, '0')}:00 đến ${String(endHour).padStart(2, '0')}:00 • ${escapeHtml(selectedWeek.title)}</span>
          </div>
        </div>

        <div class="heatmap-card-actions">
          <span class="semester-workload-badge" style="background: ${selectedWeek.workload.bg}; color: ${selectedWeek.workload.color};">
            ${selectedWeek.workload.label} (${selectedWeek.totalHours || 0} giờ • ${selectedWeek.totalClasses} buổi)
          </span>
          <select id="select-weekly-matrix-week" class="heatmap-select-filter">
            ${semesterWeeks.map(w => `
              <option value="${escapeHtml(w.filename)}" ${w.filename === activeWeeklyFile ? 'selected' : ''}>
                ${escapeHtml(w.title)}
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="weekly-cal-scale-container">
        <!-- Vùng cuộn Timeline & Header Đồng Bộ -->
        <div class="weekly-cal-scroll-area">
          <div class="weekly-cal-scroll-inner">
            <!-- Hàng Header Thứ (Sticky Top) -->
            <div class="weekly-cal-header-row">
              <div class="cal-time-corner">
                <span><i class="fa-regular fa-clock"></i> GIỜ</span>
              </div>
              <div class="cal-days-header-grid">
                ${standardDays.map(d => {
                  const isToday = dayIndexMap[d.dayName] === currentDayOfWeek && selectedWeek.filename === currentWeekFile;
                  const weekStartDate = selectedWeek.startDate || '';
                  const dateInfo = getDateForDayOfWeek(weekStartDate, dayIndexMap[d.dayName]);
                  const dateLabel = dateInfo ? dateInfo.full : '';
                  return `
                    <div class="cal-day-header-cell ${isToday ? 'is-today-cal-header' : ''}">
                      <span class="cal-day-name">${escapeHtml(d.dayName)}</span>
                      ${dateLabel ? `<span class="cal-day-date-tag">${escapeHtml(dateLabel)}</span>` : ''}
                      <span class="cal-day-classes-count">${d.totalHours > 0 ? `${d.totalHours}h` : 'Nghỉ'}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Thân Lịch Scale Thời Gian Thực -->
            <div class="weekly-cal-body" style="height: ${totalTimelineHeight}px;">
              <!-- Cột hiển thị mốc giờ bên trái -->
              <div class="cal-time-axis-col">
                ${hoursList.map(h => `
                  <div class="cal-time-mark" style="top: ${(h - startHour) * HOUR_HEIGHT + TOP_PADDING}px;">
                    <span>${String(h).padStart(2, '0')}:00</span>
                  </div>
                `).join('')}
              </div>

              <!-- Khung Lưới Timeline chứa vạch ngang và 7 cột -->
              <div class="cal-timeline-content">
                <!-- Lớp vạch kẻ giờ ngang trải dài từ T2 đến CN -->
                <div class="cal-grid-lines-layer">
                  ${hoursList.map(h => `
                    <div class="cal-grid-hour-line" style="top: ${(h - startHour) * HOUR_HEIGHT + TOP_PADDING}px;"></div>
                  `).join('')}
                </div>

                <!-- Lưới đúng 7 cột ngày của tuần -->
                <div class="cal-days-columns-grid">
                ${standardDays.map(d => {
                  const dayEvents = layoutDayEvents(d.classes);
                  const isToday = dayIndexMap[d.dayName] === currentDayOfWeek && selectedWeek.filename === currentWeekFile;

                  return `
                    <div class="cal-day-column ${isToday ? 'is-today-cal-column' : ''}">
                      ${dayEvents.map(ev => {
                        const color = getSubjectColor(ev.subject);
                        const tooltipTitle = `${ev.subject} • ${d.dayName}`;
                        const tooltipSub = `${ev.timeRange || ''} • ${selectedWeek.title}`;
                        const tooltipBody = `
                          <div class="tt-row"><strong>Thời gian:</strong> <span>${escapeHtml(ev.timeRange || 'Chưa xếp')}</span></div>
                          <div class="tt-row"><strong>Thời lượng:</strong> <span>${getClassDurationHours(ev)} giờ</span></div>
                          <div class="tt-row"><strong>Phòng học:</strong> <span>${escapeHtml(ev.room || 'Chưa xếp')}</span></div>
                          ${ev.teacher ? `<div class="tt-row"><strong>Giảng viên:</strong> <span>${escapeHtml(ev.teacher)}</span></div>` : ''}
                        `;

                        return `
                          <div class="cal-event-block ${ev.isOverlap ? 'is-overlap-event' : ''}"
                            style="
                              top: ${ev.top}px;
                              height: ${ev.height}px;
                              left: ${ev.left};
                              width: ${ev.width};
                              background: ${color.bg || 'rgba(99, 102, 241, 0.2)'};
                              border-left: 3px solid ${color.border || '#818cf8'};
                            "
                            data-heatmap-tooltip="true"
                            data-tooltip-title="${escapeHtml(tooltipTitle)}"
                            data-tooltip-sub="${escapeHtml(tooltipSub)}"
                            data-tooltip-body="${escapeHtml(tooltipBody)}"
                            data-tooltip-badge="${getClassDurationHours(ev)}h"
                            data-tooltip-badge-bg="${color.border || '#818cf8'}"
                            data-tooltip-badge-color="#ffffff">
                            <span class="cal-event-title">${escapeHtml(ev.subject)}</span>
                            <div class="cal-event-meta">
                              <span class="cal-event-time">
                                <i class="fa-regular fa-clock"></i> ${escapeHtml(ev.timeRange || '')}
                              </span>
                              <span class="cal-event-room">
                                <i class="fa-solid fa-location-dot"></i> ${escapeHtml(ev.room || 'Chưa xếp')}
                              </span>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="heatmap-card-footer">
        <div class="heatmap-legend-row" style="font-size: 0.74rem;">
          <span>Cường độ:</span>
          <div class="legend-scale-boxes">
            <div class="legend-box level-0" title="0h (Nghỉ)"></div>
            <div class="legend-box level-1" title="≤ 2h (Nhẹ)"></div>
            <div class="legend-box level-2" title="2h - 4h (Vừa)"></div>
            <div class="legend-box level-3" title="4h - 6.5h (Dày)"></div>
            <div class="legend-box level-4" title="> 6.5h+ (Cao điểm 🔥)"></div>
          </div>
        </div>

        <button type="button" class="btn-ghost btn-open-week-nav" data-week="${escapeHtml(selectedWeek.filename)}" style="font-size: 0.76rem;">
          <i class="fa-regular fa-calendar-check"></i> Mở Lưới Thời Khóa Biểu Tuần Này
        </button>
      </div>
    </div>
  `;

  const selectWeek = container.querySelector('#select-weekly-matrix-week');
  if (selectWeek) {
    selectWeek.onchange = (e) => {
      activeWeeklyFile = e.target.value;
      renderWeeklyMatrixView(container, semesterWeeks, currentWeekFile, onSelectWeek);
      setupHeatmapTooltips();
    };
  }

  const navBtn = container.querySelector('.btn-open-week-nav');
  if (navBtn) {
    navBtn.onclick = () => {
      const fn = navBtn.dataset.week;
      if (fn && typeof onSelectWeek === 'function') {
        onSelectWeek(fn);
      }
    };
  }
}

/**
 * 2️⃣ CHẾ ĐỘ THÁNG: Ma trận Cường Độ Tháng (Monthly Contribution Matrix)
 */
function renderMonthlyCalendarView(container, semesterWeeks = [], onSelectWeek = null) {
  const year = currentMonthlyDate.getFullYear();
  const month = currentMonthlyDate.getMonth(); // 0 - 11

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0: CN, 1: T2
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells = [];
  let totalMonthClasses = 0;
  let totalMonthHours = 0;

  // Ngày tháng trước
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      dayNum: daysInPrevMonth - i,
      isOtherMonth: true,
      classesCount: 0,
      totalHours: 0,
      level: 0,
      classes: []
    });
  }

  // Ngày tháng hiện tại: Khớp theo startDate thực tế của từng tuần trong kỳ
  for (let d = 1; d <= daysInMonth; d++) {
    const dDate = new Date(year, month, d);
    const dayOfWeek = dDate.getDay();
    const dayNameMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dName = dayNameMap[dayOfWeek];
    const dDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    let count = 0;
    let dayHours = 0;
    let classesList = [];
    
    let matchedWeek = semesterWeeks.find(w => {
      if (!w.startDate) return false;
      const start = new Date(w.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      return dDateStr >= startStr && dDateStr <= endStr;
    });

    if (!matchedWeek) {
      matchedWeek = semesterWeeks[d % semesterWeeks.length] || semesterWeeks[0];
    }

    if (matchedWeek) {
      const dayStat = matchedWeek.days.find(x => x.dayName === dName);
      if (dayStat) {
        count = dayStat.classesCount;
        dayHours = dayStat.totalHours || getDayTotalHours(dayStat.classes || []);
        classesList = dayStat.classes || [];
      }
    }

    totalMonthClasses += count;
    totalMonthHours += dayHours;

    cells.push({
      dayNum: d,
      dayName: dName,
      isOtherMonth: false,
      isToday: isThisMonth && today.getDate() === d,
      classesCount: count,
      totalHours: dayHours,
      level: getHeatmapLevel(dayHours),
      classes: classesList,
      weekRef: matchedWeek ? matchedWeek.filename : '',
      weekTitle: matchedWeek ? matchedWeek.title : ''
    });
  }

  totalMonthHours = Math.round(totalMonthHours * 10) / 10;

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let j = 1; j <= remaining; j++) {
    cells.push({
      dayNum: j,
      isOtherMonth: true,
      classesCount: 0,
      totalHours: 0,
      level: 0,
      classes: []
    });
  }

  container.innerHTML = `
    <div class="heatmap-matrix-card">
      <div class="heatmap-card-header">
        <div class="heatmap-card-title-group">
          <div class="heatmap-card-icon" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
            <i class="fa-solid fa-calendar-days"></i>
          </div>
          <div>
            <h3 class="heatmap-card-title">Bản Đồ Cường Độ ${monthNames[month]} Năm ${year}</h3>
            <span class="heatmap-card-sub">Chuẩn GitHub Monthly Matrix • Tổng ${totalMonthHours} giờ học (${totalMonthClasses} buổi)</span>
          </div>
        </div>

        <div class="heatmap-card-actions">
          <button type="button" id="btn-prev-month" class="btn-ghost" title="Tháng trước">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" id="btn-this-month" class="btn-ghost" style="font-size: 0.78rem;">
            Hiện tại
          </button>
          <button type="button" id="btn-next-month" class="btn-ghost" title="Tháng sau">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div class="monthly-matrix-wrap">
        <div class="monthly-matrix-days-header">
          <span>T2</span>
          <span>T3</span>
          <span>T4</span>
          <span>T5</span>
          <span>T6</span>
          <span>T7</span>
          <span>CN</span>
        </div>

        <div class="monthly-matrix-grid">
          ${cells.map(c => {
            if (c.isOtherMonth) {
              return `<div class="monthly-matrix-square is-other-month level-0"><span>${c.dayNum}</span></div>`;
            }

            const tooltipTitle = `Ngày ${c.dayNum}/${month + 1}/${year} • ${c.dayName}`;
            const tooltipSub = c.totalHours > 0 ? `${c.totalHours} giờ học (${c.classesCount} môn • ${c.weekTitle})` : 'Nghỉ ngơi';
            const tooltipBody = (c.classes || []).length > 0 
              ? c.classes.map(cls => `<div class="tt-row"><strong>${escapeHtml(cls.subject)}</strong> <span>(${escapeHtml(cls.timeRange)} • ${getClassDurationHours(cls)}h)</span></div>`).join('')
              : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có buổi học trong ngày này</div>`;

            return `
              <div class="monthly-matrix-square level-${c.level} ${c.isToday ? 'is-today-square' : ''}"
                data-week="${escapeHtml(c.weekRef || '')}"
                data-heatmap-tooltip="true"
                data-tooltip-title="${escapeHtml(tooltipTitle)}"
                data-tooltip-sub="${escapeHtml(tooltipSub)}"
                data-tooltip-body="${escapeHtml(tooltipBody)}"
                data-tooltip-badge="${c.totalHours > 0 ? `${c.totalHours}h` : 'Nghỉ'}"
                data-tooltip-badge-bg="${c.totalHours > 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)'}"
                data-tooltip-badge-color="${c.totalHours > 0 ? '#38bdf8' : '#94a3b8'}">
                <span class="sq-day-num">${c.dayNum}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="heatmap-card-footer">
        <div class="heatmap-legend-row" style="font-size: 0.74rem;">
          <span>Cường độ:</span>
          <div class="legend-scale-boxes">
            <div class="legend-box level-0" title="0h (Nghỉ)"></div>
            <div class="legend-box level-1" title="≤ 2h (Nhẹ)"></div>
            <div class="legend-box level-2" title="2h - 4h (Vừa)"></div>
            <div class="legend-box level-3" title="4h - 6.5h (Dày)"></div>
            <div class="legend-box level-4" title="> 6.5h+ (Cao điểm 🔥)"></div>
          </div>
        </div>

        <span style="font-size: 0.74rem; color: var(--text-muted);">
          <i class="fa-regular fa-hand-pointer"></i> Bấm vào ô ngày để mở tuần tương ứng
        </span>
      </div>
    </div>
  `;

  const prevBtn = container.querySelector('#btn-prev-month');
  const thisBtn = container.querySelector('#btn-this-month');
  const nextBtn = container.querySelector('#btn-next-month');

  if (prevBtn) {
    prevBtn.onclick = () => {
      currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() - 1);
      renderMonthlyCalendarView(container, semesterWeeks, onSelectWeek);
      setupHeatmapTooltips();
    };
  }
  if (thisBtn) {
    thisBtn.onclick = () => {
      currentMonthlyDate = new Date();
      renderMonthlyCalendarView(container, semesterWeeks, onSelectWeek);
      setupHeatmapTooltips();
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() + 1);
      renderMonthlyCalendarView(container, semesterWeeks, onSelectWeek);
      setupHeatmapTooltips();
    };
  }

  container.querySelectorAll('.monthly-matrix-square:not(.is-other-month)').forEach(sq => {
    sq.onclick = () => {
      const fn = sq.dataset.week;
      if (fn && typeof onSelectWeek === 'function') {
        onSelectWeek(fn);
      }
    };
  });
}

/**
 * 3️⃣ CHẾ ĐỘ HỌC KỲ: Ma trận Tiến Trình Học Kỳ (Semester Contribution Matrix)
 */
function renderSemesterMatrixView(container, semesterWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  if (!semesterWeeks || semesterWeeks.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">Chưa có dữ liệu học kỳ.</p>`;
    return;
  }

  const dayLabels = ['T2', '', 'T4', '', 'T6', '', 'CN'];
  const totalWeeks = semesterWeeks.length;
  
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0: CN, 1: T2, 2: T3...
  const dayIndexMap = { 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6, 'Chủ Nhật': 0 };

  // Xác định tuần thực tế chứa ngày hôm nay (dựa vào startDate)
  let actualTodayWeek = semesterWeeks.find(w => w.isTodayWeek || isWeekContainingToday(w));
  if (!actualTodayWeek) {
    actualTodayWeek = semesterWeeks.find(w => w.filename === currentWeekFile) || semesterWeeks[0];
  }
  const actualWeekIndex = semesterWeeks.findIndex(w => w.filename === (actualTodayWeek ? actualTodayWeek.filename : ''));

  const squares = [];
  semesterWeeks.forEach((w, wIdx) => {
    const isThisActualWeek = actualTodayWeek ? (w.filename === actualTodayWeek.filename) : false;
    w.days.forEach((d, dIdx) => {
      const isToday = isThisActualWeek && (dayIndexMap[d.dayName] === currentDayOfWeek);
      squares.push({
        weekIdx: wIdx + 1,
        weekTitle: w.title,
        weekFilename: w.filename,
        isCurrentWeek: isThisActualWeek,
        isToday,
        dayIdx: dIdx,
        dayName: d.dayName,
        classesCount: d.classesCount,
        totalHours: d.totalHours || 0,
        level: d.level,
        classes: d.classes || [],
        workload: w.workload
      });
    });
  });

  container.innerHTML = `
    <div class="heatmap-matrix-card">
      <div class="heatmap-card-header">
        <div class="heatmap-card-title-group">
          <div class="heatmap-card-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <h3 class="heatmap-card-title">Bản Đồ Toàn Bộ Học Kỳ (${totalWeeks} Tuần Học Tập)</h3>
            <span class="heatmap-card-sub">Chuẩn GitHub Semester Matrix • Đang ở ${actualWeekIndex >= 0 ? `Tuần ${actualWeekIndex + 1}` : 'Học kỳ'}</span>
          </div>
        </div>

        <div class="heatmap-card-actions">
          <span class="semester-workload-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
            ${totalWeeks} Tuần học
          </span>
        </div>
      </div>

      <div class="semester-matrix-scroll-wrap">
        <div class="semester-weeks-header-row" style="grid-template-columns: repeat(${totalWeeks}, 20px);">
          ${semesterWeeks.map((w, idx) => {
            const isHeaderCurrent = actualTodayWeek ? (w.filename === actualTodayWeek.filename) : (w.filename === currentWeekFile);
            return `
              <span class="${isHeaderCurrent ? 'is-current-week-header' : ''}" title="${escapeHtml(w.title)}">
                T${idx + 1}
              </span>
            `;
          }).join('')}
        </div>

        <div class="semester-matrix-body">
          <div class="semester-days-labels">
            ${dayLabels.map(l => `<span>${l}</span>`).join('')}
          </div>

          <div class="semester-squares-grid" style="grid-template-columns: repeat(${totalWeeks}, 20px);">
            ${squares.map(sq => {
              const tooltipTitle = `${sq.weekTitle} • ${sq.dayName}`;
              const tooltipSub = sq.totalHours > 0 ? `${sq.totalHours} giờ học (${sq.classesCount} môn • ${sq.workload.label})` : 'Nghỉ ngơi';
              const tooltipBody = sq.classes.length > 0
                ? sq.classes.map(c => `<div class="tt-row"><strong>${escapeHtml(c.subject)}</strong> <span>(${escapeHtml(c.timeRange)} • ${getClassDurationHours(c)}h)</span></div>`).join('')
                : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có buổi học trong ngày này</div>`;

              return `
                <div class="semester-square-item level-${sq.level} ${sq.isCurrentWeek ? 'is-in-current-week' : ''} ${sq.isToday ? 'is-today-semester-square' : ''}"
                  data-filename="${escapeHtml(sq.weekFilename)}"
                  data-is-today="${sq.isToday ? 'true' : 'false'}"
                  data-day="${escapeHtml(sq.dayName)}"
                  data-week-num="${sq.weekIdx}"
                  data-heatmap-tooltip="true"
                  data-tooltip-title="${escapeHtml(tooltipTitle)}"
                  data-tooltip-sub="${escapeHtml(tooltipSub)}"
                  data-tooltip-body="${escapeHtml(tooltipBody)}"
                  data-tooltip-badge="${sq.totalHours > 0 ? `${sq.totalHours}h` : 'Nghỉ'}"
                  data-tooltip-badge-bg="${sq.totalHours > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)'}"
                  data-tooltip-badge-color="${sq.totalHours > 0 ? '#10b981' : '#94a3b8'}">
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="heatmap-card-footer">
        <div class="heatmap-legend-row" style="font-size: 0.74rem;">
          <span>Cường độ:</span>
          <div class="legend-scale-boxes">
            <div class="legend-box level-0" title="0h (Nghỉ)"></div>
            <div class="legend-box level-1" title="≤ 2h (Nhẹ)"></div>
            <div class="legend-box level-2" title="2h - 4h (Vừa)"></div>
            <div class="legend-box level-3" title="4h - 6.5h (Dày)"></div>
            <div class="legend-box level-4" title="> 6.5h+ (Cao điểm 🔥)"></div>
          </div>
        </div>

        <span style="font-size: 0.74rem; color: var(--text-muted);">
          <i class="fa-regular fa-hand-pointer"></i> Bấm vào ô bất kỳ để mở thời khóa biểu tuần đó
        </span>
      </div>
    </div>
  `;

  container.querySelectorAll('.semester-square-item').forEach(sq => {
    sq.onclick = () => {
      const fn = sq.dataset.filename;
      if (fn && typeof onSelectWeek === 'function') {
        onSelectWeek(fn);
      }
    };
  });
}

/**
 * Điều phối render nội dung chi tiết theo chế độ thời gian đang chọn (Tuần / Tháng / Học kỳ)
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
  } else {
    renderSemesterMatrixView(contentArea, semesterWeeks, currentWeekFile, onSelectWeek);
  }

  setupHeatmapTooltips();
}

/* ==========================================================================
   5. MAIN EXPORT: RENDER HEATMAP VIEW
   ========================================================================== */

/**
 * Render toàn bộ Giao diện Bản Đồ Nhiệt Cường Độ Học Tập
 * @param {Array<Object>} availableWeeks 
 * @param {string} currentWeekFile 
 * @param {Function} onSelectWeek 
 */
export function renderHeatmapView(availableWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  const container = document.getElementById('today-view-container');
  if (!container) return;

  activeWeeklyFile = currentWeekFile;
  const semesterWeeks = aggregateSemesterData(availableWeeks, currentWeekFile);

  preloadAllWeeksData(availableWeeks, currentWeekFile, onSelectWeek);

  let totalSemesterClasses = 0;
  let totalSemesterHours = 0;
  let peakWeek = null;
  let activeStudyDays = 0;

  semesterWeeks.forEach(w => {
    totalSemesterClasses += w.totalClasses;
    totalSemesterHours += (w.totalHours || 0);
    if (!peakWeek || (w.totalHours || 0) > (peakWeek.totalHours || 0)) {
      peakWeek = w;
    }
    w.days.forEach(d => {
      if (d.totalHours > 0 || d.classesCount > 0) activeStudyDays++;
    });
  });

  totalSemesterHours = Math.round(totalSemesterHours * 10) / 10;

  const currentWeekObj = semesterWeeks.find(w => w.filename === currentWeekFile) || semesterWeeks[0];
  const currentDayOfWeek = new Date().getDay();
  const todayDayNameMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayName = todayDayNameMap[currentDayOfWeek];
  
  const todayStats = currentWeekObj ? currentWeekObj.days.find(d => d.dayName === todayName) : null;
  const todayClasses = todayStats ? todayStats.classes : [];
  const todayTotalHours = todayStats ? (todayStats.totalHours || getDayTotalHours(todayClasses)) : getDayTotalHours(todayClasses);

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
              <span class="heatmap-subtitle">Phân tích mật độ thời gian học, theo dõi tải học tập & năng suất sinh viên</span>
            </div>
          </div>
          <div class="heatmap-legend-row">
            <span>Cường độ:</span>
            <div class="legend-scale-boxes">
              <div class="legend-box level-0" title="0h (Nghỉ)"></div>
              <div class="legend-box level-1" title="≤ 2h (Nhẹ)"></div>
              <div class="legend-box level-2" title="2h - 4h (Vừa)"></div>
              <div class="legend-box level-3" title="4h - 6.5h (Dày)"></div>
              <div class="legend-box level-4" title="> 6.5h+ (Cao điểm 🔥)"></div>
            </div>
          </div>
        </div>

        <div class="heatmap-kpi-grid">
          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${todayTotalHours} giờ</span>
              <span class="heatmap-kpi-label">Hôm nay (${todayName} • ${todayClasses.length} môn)</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
              <i class="fa-solid fa-book-bookmark"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${totalSemesterHours} giờ</span>
              <span class="heatmap-kpi-label">Tổng cả học kỳ (${totalSemesterClasses} buổi)</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${peakWeek ? `${peakWeek.title} (${peakWeek.totalHours || 0}h)` : 'Chưa có'}</span>
              <span class="heatmap-kpi-label">Tuần cao điểm nhất</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
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
            <span class="today-focus-badge"><i class="fa-regular fa-clock"></i> Lịch học Hôm nay</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${todayName} • ${currentWeekObj ? currentWeekObj.title : ''}</span>
          </div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${todayClasses.length > 0 ? `${todayTotalHours} giờ học (${todayClasses.length} môn)` : 'Hôm nay bạn được nghỉ ngơi'}</span>
        </div>

        ${todayClasses.length > 0 ? `
          <div class="today-focus-classes-grid">
            ${todayClasses.map(c => `
              <div class="today-class-mini-card">
                <div class="today-mini-time">
                  <i class="fa-regular fa-clock"></i>
                  <span>${escapeHtml(c.timeRange)} (${getClassDurationHours(c)}h)</span>
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
            <i class="fa-solid fa-calendar-week"></i> <span>1. Lịch Tuần</span>
          </button>
          <button type="button" class="btn-heatmap-tab ${currentHorizonMode === 'month' ? 'active' : ''}" data-mode="month">
            <i class="fa-solid fa-calendar-days"></i> <span>2. Tháng</span>
          </button>
          <button type="button" class="btn-heatmap-tab ${currentHorizonMode === 'semester' ? 'active' : ''}" data-mode="semester">
            <i class="fa-solid fa-layer-group"></i> <span>3. Học Kỳ / Quý</span>
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

  renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);

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
 * Định vị thông minh ngày Hôm nay trên Bản Đồ Nhiệt (Smart Focus Context-Aware)
 * Hỗ trợ định vị cho cả 3 chế độ: Tuần (Week), Tháng (Month), Học kỳ (Semester)
 * @param {Array<Object>} availableWeeks
 * @param {string} currentWeekFile
 * @param {Function} onSelectWeek
 */
export function focusHeatmapTodayTarget(availableWeeks = [], currentWeekFile = '', onSelectWeek = null) {
  const contentArea = document.getElementById('heatmap-dynamic-content-area');
  if (!contentArea) return;

  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0: CN, 1: T2, 2: T3...
  const dayNameMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayName = dayNameMap[currentDayOfWeek];

  // Helper kích hoạt hiệu ứng Ping phát sáng trên DOM element
  function triggerFocusPing(element, toastMsg) {
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    element.classList.remove('heatmap-focus-ping');
    void element.offsetWidth; // Reflow
    element.classList.add('heatmap-focus-ping');
    setTimeout(() => {
      element.classList.remove('heatmap-focus-ping');
    }, 2800);
    if (toastMsg) showToast(toastMsg);
  }

  if (currentHorizonMode === 'week') {
    // 1️⃣ Chế độ Tuần: Định vị cột hôm nay trên Timeline
    let todayCol = contentArea.querySelector('.cal-day-column.is-today-cal-column');
    if (!todayCol && currentWeekFile && activeWeeklyFile !== currentWeekFile) {
      activeWeeklyFile = currentWeekFile;
      const semesterWeeks = aggregateSemesterData(availableWeeks, currentWeekFile);
      renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);
      todayCol = contentArea.querySelector('.cal-day-column.is-today-cal-column');
    }

    if (todayCol) {
      triggerFocusPing(todayCol, `🎯 Đã định vị Cột ${todayName} trên Timeline Tuần!`);
    } else {
      const headerCell = contentArea.querySelector('.cal-day-header-cell.is-today-cal-header');
      if (headerCell) {
        triggerFocusPing(headerCell, `🎯 Đã định vị Cột ${todayName} trên Lịch Tuần!`);
      } else {
        showToast(`Tuần đang xem không chứa ngày Hôm nay (${todayName}).`);
      }
    }
  } else if (currentHorizonMode === 'month') {
    // 2️⃣ Chế độ Tháng: Định vị ô ngày hôm nay trong lịch tháng
    const nowYear = today.getFullYear();
    const nowMonth = today.getMonth();

    if (currentMonthlyDate.getFullYear() !== nowYear || currentMonthlyDate.getMonth() !== nowMonth) {
      currentMonthlyDate = new Date();
      const semesterWeeks = aggregateSemesterData(availableWeeks, currentWeekFile);
      renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);
    }

    setTimeout(() => {
      const todaySquare = contentArea.querySelector('.monthly-matrix-square.is-today-square');
      if (todaySquare) {
        triggerFocusPing(todaySquare, `🎯 Đã định vị Ô Ngày ${today.getDate()} Tháng ${nowMonth + 1} Hôm nay!`);
      } else {
        showToast('Không tìm thấy ô ngày Hôm nay trong tháng.');
      }
    }, 80);
  } else {
    // 3️⃣ Chế độ Học Kỳ / Quý: Định vị ô ngày hôm nay trong ma trận học kỳ
    let todaySquare = contentArea.querySelector('.semester-square-item.is-today-semester-square') ||
                      contentArea.querySelector('.semester-square-item[data-is-today="true"]');
    
    if (!todaySquare) {
      // Fallback 1: Tìm ô có đúng Thứ hôm nay trong tuần hiện tại
      todaySquare = contentArea.querySelector(`.semester-square-item.is-in-current-week[data-day="${todayName}"]`);
    }

    if (!todaySquare) {
      // Fallback 2: Tìm ô có đúng Thứ hôm nay bất kỳ trong bảng
      todaySquare = contentArea.querySelector(`.semester-square-item[data-day="${todayName}"]`);
    }

    if (todaySquare) {
      const weekNum = todaySquare.getAttribute('data-week-num') || '';
      triggerFocusPing(todaySquare, `🎯 Đã định vị Ô ${todayName}${weekNum ? ` (Tuần ${weekNum})` : ''} Hôm nay!`);
    } else {
      showToast(`Không tìm thấy ô ${todayName} trong học kỳ.`);
    }
  }
}
