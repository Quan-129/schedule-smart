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
let currentHorizonMode = localStorage.getItem('smart_schedule_heatmap_mode') || 'week'; // 'week' | 'month' | 'semester'
let currentMonthlyDate = new Date(); // Tháng đang xem trong chế độ Tháng
let activeWeeklyFile = ''; // File tuần đang xem trong chế độ Tuần

let storedAvailableWeeks = [];
let storedCurrentWeekFile = '';
let storedOnSelectWeek = null;

// Bộ nhớ đệm dữ liệu tất cả các tuần trong học kỳ
const weeksDataCache = new Map();
let isPreloadingWeeks = false;

/* ==========================================================================
   2. HELPER FUNCTIONS & DATA AGGREGATOR
   ========================================================================== */

/**
 * Tính toán mức độ nhiệt (Level 0 - 4) dựa trên số buổi học trong ngày
 * @param {number} classCount - Số buổi học / lớp học
 * @returns {number} 0, 1, 2, 3, 4
 */
export function getHeatmapLevel(classCount = 0) {
  if (!classCount || classCount <= 0) return 0;
  if (classCount === 1) return 1;
  if (classCount === 2) return 2;
  if (classCount === 3) return 3;
  return 4;
}

/**
 * Đánh giá tải học tập của cả tuần (theo số buổi học)
 * @param {number} totalClasses - Tổng số buổi học trong tuần
 * @returns {{ label: string, color: string, bg: string }}
 */
export function evaluateWeekWorkload(totalClasses = 0) {
  if (totalClasses === 0) {
    return { label: 'Tuần nghỉ', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  }
  if (totalClasses <= 4) {
    return { label: 'Nhẹ nhàng', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (totalClasses <= 8) {
    return { label: 'Vừa phải', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
  }
  if (totalClasses <= 12) {
    return { label: 'Cao điểm', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
  }
  return { label: 'Lịch học dày 🔥', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' };
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
 * Tạo mã HTML cho bộ nút chuyển đổi chế độ xem (Lịch Tuần, Tháng, Học Kỳ) tích hợp trực tiếp vào Card Header
 * @param {string} currentMode 
 * @returns {string}
 */
export function generateHorizonModeTabsHtml(currentMode = 'week') {
  return `
    <div class="heatmap-mode-tabs" role="tablist" aria-label="Chế độ xem lịch học">
      <button type="button" class="btn-heatmap-tab ${currentMode === 'week' ? 'active' : ''}" data-mode="week" title="1. Xem thời khóa biểu theo tuần (Google Calendar)">
        <i class="fa-solid fa-calendar-week"></i> <span>1. Lịch Tuần</span>
      </button>
      <button type="button" class="btn-heatmap-tab ${currentMode === 'month' ? 'active' : ''}" data-mode="month" title="2. Xem ma trận lịch học theo tháng">
        <i class="fa-solid fa-calendar-days"></i> <span>2. Tháng</span>
      </button>
      <button type="button" class="btn-heatmap-tab ${currentMode === 'semester' ? 'active' : ''}" data-mode="semester" title="3. Xem toàn bộ ma trận tiến độ học kỳ">
        <i class="fa-solid fa-layer-group"></i> <span>3. Học Kỳ / Quý</span>
      </button>
    </div>
  `;
}

/**
 * Gắn sự kiện chuyển đổi chế độ xem cho các nút Tabs trong Card Header
 * @param {HTMLElement} container 
 * @param {Array<Object>} semesterWeeks 
 * @param {string} currentWeekFile 
 * @param {Function} onSelectWeek 
 */
export function bindHorizonModeTabsEvents(container, semesterWeeks, currentWeekFile, onSelectWeek) {
  if (!container) return;
  container.querySelectorAll('.btn-heatmap-tab').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const mode = btn.dataset.mode || 'week';
      if (mode === currentHorizonMode) return;
      currentHorizonMode = mode;
      localStorage.setItem('smart_schedule_heatmap_mode', currentHorizonMode);
      renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);
    };
  });
}

/**
 * 1️⃣ CHẾ ĐỘ TUẦN: Lịch Tuần Scale Theo Khung Giờ Thực & Xếp Lớp Trùng Giờ (Google Calendar Style)
 * Cố định hiển thị trọn vẹn 7 Ngày (Thứ 2 -> Chủ Nhật) với Unified Single Scroll Container
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
  const visibleDays = standardDays; // Cố định hiển thị trọn vẹn 7 Ngày

  // 1. TỰ ĐỘNG SCALE THỜI GIAN THEO TUẦN (Dynamic Time Bounds)
  let earliestMin = 24 * 60;
  let latestMax = 0;
  let hasAnyClasses = false;

  visibleDays.forEach(d => {
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
    endHour = Math.min(23, Math.ceil(latestMax / 60)); // Giờ kết thúc (tối đa 23h)
    if (endHour - startHour < 6) endHour = Math.min(23, startHour + 6);
    if (endHour <= startHour) endHour = startHour + 8;
  }

  const HOUR_HEIGHT = 60; // px cho mỗi giờ
  const pxPerMinute = HOUR_HEIGHT / 60;
  const TOP_PADDING = 20; // Khoảng đệm trên đỉnh
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
          ${generateHorizonModeTabsHtml('week')}

          <select id="select-weekly-matrix-week" class="heatmap-select-filter" title="Chọn tuần học">
            ${semesterWeeks.map(w => `
              <option value="${escapeHtml(w.filename)}" ${w.filename === activeWeeklyFile ? 'selected' : ''}>
                ${escapeHtml(w.title)}
              </option>
            `).join('')}
          </select>

          <span class="semester-workload-badge" style="background: ${selectedWeek.workload.bg}; color: ${selectedWeek.workload.color};">
            ${selectedWeek.workload.label} (${selectedWeek.totalClasses} buổi)
          </span>
        </div>
      </div>

      <div class="weekly-cal-scale-container">
        <!-- KHUNG CUỘN DUY NHẤT (UNIFIED SINGLE SCROLL CONTAINER - TRIỆT TIÊU 100% LỖI LỆCH CỘT) -->
        <div class="weekly-cal-unified-scroll-area">
          <div class="weekly-cal-unified-grid" style="--cal-cols: 7; min-width: 720px;">
            
            <!-- HÀNG HEADER DÍNH ĐỈNH (STICKY TOP) -->
            <div class="weekly-cal-sticky-header">
              <div class="cal-time-corner-sticky">
                <span><i class="fa-regular fa-clock"></i> GIỜ</span>
              </div>
              <div class="cal-days-header-grid">
                ${visibleDays.map(d => {
                  const isToday = dayIndexMap[d.dayName] === currentDayOfWeek && selectedWeek.filename === currentWeekFile;
                  const weekStartDate = selectedWeek.startDate || '';
                  const dateInfo = getDateForDayOfWeek(weekStartDate, dayIndexMap[d.dayName]);
                  const dateLabel = dateInfo ? dateInfo.full : '';
                  return `
                    <div class="cal-day-header-cell ${isToday ? 'is-today-cal-header' : ''}">
                      <span class="cal-day-name">${escapeHtml(d.dayName)}</span>
                      ${dateLabel ? `<span class="cal-day-date-tag">${escapeHtml(dateLabel)}</span>` : ''}
                      <span class="cal-day-classes-count">${d.classesCount > 0 ? `${d.classesCount} buổi học` : 'Nghỉ'}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- THÂN TIMELINE CÙNG CONTAINER (STICKY LEFT CHO CỘT GIỜ) -->
            <div class="weekly-cal-body-grid" style="height: ${totalTimelineHeight}px; min-height: ${totalTimelineHeight}px;">
              <!-- Cột Trục Thời Gian Dính Trái (Sticky Left Axis) -->
              <div class="cal-time-axis-col-sticky">
                ${hoursList.map(h => `
                  <div class="cal-time-mark" style="top: ${(h - startHour) * HOUR_HEIGHT + TOP_PADDING}px;">
                    <span>${String(h).padStart(2, '0')}:00</span>
                  </div>
                `).join('')}
              </div>

              <!-- 7 Cột Ngày dạng Timeline -->
              <div class="cal-days-columns-grid">
                ${visibleDays.map(d => {
                  const isToday = dayIndexMap[d.dayName] === currentDayOfWeek && selectedWeek.filename === currentWeekFile;
                  const dayEvents = layoutDayEvents(d.classes);

                  // Vạch thời gian hiện tại
                  const now = new Date();
                  const currentMinutesNow = now.getHours() * 60 + now.getMinutes();
                  const showNowLine = isToday && currentMinutesNow >= startHour * 60 && currentMinutesNow <= (endHour + 1) * 60;
                  const nowTop = (currentMinutesNow - startHour * 60) * pxPerMinute + TOP_PADDING;

                  return `
                    <div class="cal-day-column ${isToday ? 'is-today-cal-column' : ''}">
                      <!-- Các đường vạch giờ ngang -->
                      ${hoursList.map(h => `
                        <div class="cal-grid-hour-line" style="top: ${(h - startHour) * HOUR_HEIGHT + TOP_PADDING}px;"></div>
                      `).join('')}

                      <!-- Vạch chỉ thời gian hiện tại (Current Time Indicator) -->
                      ${showNowLine ? `
                        <div class="cal-current-time-line" style="top: ${nowTop}px;" title="Hiện tại: ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}">
                          <span class="cal-current-time-dot"></span>
                        </div>
                      ` : ''}

                      <!-- Thẻ sự kiện các môn học -->
                      ${dayEvents.map(ev => {
                        const color = getSubjectColor(ev.subject);
                        const tooltipTitle = `${d.dayName} • ${escapeHtml(ev.timeRange)}`;
                        const tooltipSub = escapeHtml(ev.subject);
                        const tooltipBody = `<div class="tt-row"><i class="fa-solid fa-location-dot"></i> <span>Phòng: ${escapeHtml(ev.room || 'Chưa rõ')}</span></div>
                                             <div class="tt-row"><i class="fa-regular fa-clock"></i> <span>Thời lượng: ${Math.round((ev.endMin - ev.startMin))} phút</span></div>`;

                        return `
                          <div class="cal-event-block ${ev.isOverlap ? 'is-overlap-event' : ''}"
                            style="top: ${ev.top}px; height: ${ev.height}px; left: ${ev.left}; width: ${ev.width}; --event-accent: ${color.border}; --event-bg: ${color.bg || 'rgba(99, 102, 241, 0.15)'};"
                            data-heatmap-tooltip="true"
                            data-tooltip-title="${escapeHtml(tooltipTitle)}"
                            data-tooltip-sub="${escapeHtml(tooltipSub)}"
                            data-tooltip-body="${escapeHtml(tooltipBody)}"
                            data-tooltip-badge="${escapeHtml(ev.timeRange)}"
                            data-tooltip-badge-bg="${color.border}"
                            data-tooltip-badge-color="#ffffff">
                            <div class="cal-event-title">${escapeHtml(ev.subject)}</div>
                            <div class="cal-event-meta">
                              <span class="cal-event-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(ev.timeRange)}</span>
                              ${ev.room ? `<span class="cal-event-room"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(ev.room)}</span>` : ''}
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
        <div style="display: flex; align-items: center; gap: 0.85rem; font-size: 0.74rem; color: var(--text-muted); flex-wrap: wrap;">
          <span><i class="fa-solid fa-layer-group" style="color: #818cf8;"></i> Tự động xếp chồng khi trùng giờ</span>
          <span>•</span>
          <span><i class="fa-regular fa-hand-pointer"></i> Di chuột vào thẻ để xem chi tiết môn</span>
        </div>

        <button type="button" class="btn-ghost btn-open-week-nav" data-week="${escapeHtml(selectedWeek.filename)}" style="font-size: 0.78rem; color: #818cf8;">
          <span>Xem chi tiết lịch tuần</span> <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `;

  // GẮN SỰ KIỆN: 1. Đổi tuần học trong dropdown
  const selectWeek = container.querySelector('#select-weekly-matrix-week');
  if (selectWeek) {
    selectWeek.onchange = (e) => {
      activeWeeklyFile = e.target.value;
      renderWeeklyMatrixView(container, semesterWeeks, currentWeekFile, onSelectWeek);
      setupHeatmapTooltips();
    };
  }

  // GẮN SỰ KIỆN: 2. Mở chi tiết tuần
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

  // Ngày tháng trước
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      dayNum: daysInPrevMonth - i,
      isOtherMonth: true,
      classesCount: 0,
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
        classesList = dayStat.classes || [];
      }
    }

    totalMonthClasses += count;

    cells.push({
      dayNum: d,
      dayName: dName,
      isOtherMonth: false,
      isToday: isThisMonth && today.getDate() === d,
      classesCount: count,
      level: getHeatmapLevel(count),
      classes: classesList,
      weekRef: matchedWeek ? matchedWeek.filename : '',
      weekTitle: matchedWeek ? matchedWeek.title : ''
    });
  }

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let j = 1; j <= remaining; j++) {
    cells.push({
      dayNum: j,
      isOtherMonth: true,
      classesCount: 0,
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
            <span class="heatmap-card-sub">Chuẩn GitHub Monthly Matrix • Tổng ${totalMonthClasses} buổi học trong tháng</span>
          </div>
        </div>

        <div class="heatmap-card-actions">
          ${generateHorizonModeTabsHtml('month')}

          <div class="monthly-nav-btn-group" style="display: inline-flex; align-items: center; gap: 0.25rem;">
            <button type="button" id="btn-prev-month" class="btn-ghost" title="Tháng trước" style="padding: 0.35rem 0.6rem;">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" id="btn-this-month" class="btn-ghost" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;">
              Hiện tại
            </button>
            <button type="button" id="btn-next-month" class="btn-ghost" title="Tháng sau" style="padding: 0.35rem 0.6rem;">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
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
    const tooltipSub = c.classesCount > 0 ? `${c.classesCount} buổi học (${c.weekTitle})` : 'Nghỉ ngơi';
    const tooltipBody = (c.classes || []).length > 0
      ? c.classes.map(cls => `<div class="tt-row"><strong>${escapeHtml(cls.subject)}</strong> <span>(${escapeHtml(cls.timeRange)})</span></div>`).join('')
      : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có buổi học trong ngày này</div>`;

    return `
              <div class="monthly-matrix-square level-${c.level} ${c.isToday ? 'is-today-square' : ''}"
                data-week="${escapeHtml(c.weekRef || '')}"
                data-heatmap-tooltip="true"
                data-tooltip-title="${escapeHtml(tooltipTitle)}"
                data-tooltip-sub="${escapeHtml(tooltipSub)}"
                data-tooltip-body="${escapeHtml(tooltipBody)}"
                data-tooltip-badge="${c.classesCount > 0 ? `${c.classesCount} buổi` : 'Nghỉ'}"
                data-tooltip-badge-bg="${c.classesCount > 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)'}"
                data-tooltip-badge-color="${c.classesCount > 0 ? '#38bdf8' : '#94a3b8'}">
                <span class="sq-day-num">${c.dayNum}</span>
              </div>
            `;
  }).join('')}
        </div>
      </div>

      <div class="heatmap-card-footer">
        <div class="heatmap-legend-row" style="font-size: 0.74rem;">
          <span>Mức nhiệt:</span>
          <div class="legend-scale-boxes">
            <div class="legend-box level-0" title="0 buổi (Nghỉ)"></div>
            <div class="legend-box level-1" title="1 buổi (Nhẹ)"></div>
            <div class="legend-box level-2" title="2 buổi (Vừa)"></div>
            <div class="legend-box level-3" title="3 buổi (Dày)"></div>
            <div class="legend-box level-4" title="4+ buổi (Cao điểm)"></div>
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
  const currentWeekIndex = semesterWeeks.findIndex(w => w.filename === currentWeekFile);

  const squares = [];
  semesterWeeks.forEach((w, wIdx) => {
    w.days.forEach((d, dIdx) => {
      squares.push({
        weekIdx: wIdx + 1,
        weekTitle: w.title,
        weekFilename: w.filename,
        isCurrentWeek: w.filename === currentWeekFile,
        dayIdx: dIdx,
        dayName: d.dayName,
        classesCount: d.classesCount,
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
            <span class="heatmap-card-sub">Chuẩn GitHub Semester Matrix • Đang ở ${currentWeekIndex >= 0 ? `Tuần ${currentWeekIndex + 1}` : 'Học kỳ'}</span>
          </div>
        </div>

        <div class="heatmap-card-actions">
          ${generateHorizonModeTabsHtml('semester')}

          <span class="semester-workload-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
            ${totalWeeks} Tuần học
          </span>
        </div>
      </div>

      <div class="semester-matrix-scroll-wrap">
        <div class="semester-weeks-header-row" style="grid-template-columns: repeat(${totalWeeks}, 20px);">
          ${semesterWeeks.map((w, idx) => `
            <span class="${w.filename === currentWeekFile ? 'is-current-week-header' : ''}" title="${escapeHtml(w.title)}">
              T${idx + 1}
            </span>
          `).join('')}
        </div>

        <div class="semester-matrix-body">
          <div class="semester-days-labels">
            ${dayLabels.map(l => `<span>${l}</span>`).join('')}
          </div>

          <div class="semester-squares-grid" style="grid-template-columns: repeat(${totalWeeks}, 20px);">
            ${squares.map(sq => {
    const tooltipTitle = `${sq.weekTitle} • ${sq.dayName}`;
    const tooltipSub = sq.classesCount > 0 ? `${sq.classesCount} buổi học (${sq.workload.label})` : 'Nghỉ ngơi';
    const tooltipBody = sq.classes.length > 0
      ? sq.classes.map(c => `<div class="tt-row"><strong>${escapeHtml(c.subject)}</strong> <span>(${escapeHtml(c.timeRange)})</span></div>`).join('')
      : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có buổi học trong ngày này</div>`;

    return `
                <div class="semester-square-item level-${sq.level} ${sq.isCurrentWeek ? 'is-in-current-week' : ''}"
                  data-filename="${escapeHtml(sq.weekFilename)}"
                  data-heatmap-tooltip="true"
                  data-tooltip-title="${escapeHtml(tooltipTitle)}"
                  data-tooltip-sub="${escapeHtml(tooltipSub)}"
                  data-tooltip-body="${escapeHtml(tooltipBody)}"
                  data-tooltip-badge="${sq.classesCount > 0 ? `${sq.classesCount} buổi` : 'Nghỉ'}"
                  data-tooltip-badge-bg="${sq.classesCount > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)'}"
                  data-tooltip-badge-color="${sq.classesCount > 0 ? '#10b981' : '#94a3b8'}">
                </div>
              `;
  }).join('')}
          </div>
        </div>
      </div>

      <div class="heatmap-card-footer">
        <div class="heatmap-legend-row" style="font-size: 0.74rem;">
          <span>Mức nhiệt:</span>
          <div class="legend-scale-boxes">
            <div class="legend-box level-0" title="0 buổi (Nghỉ)"></div>
            <div class="legend-box level-1" title="1 buổi (Nhẹ)"></div>
            <div class="legend-box level-2" title="2 buổi (Vừa)"></div>
            <div class="legend-box level-3" title="3 buổi (Dày)"></div>
            <div class="legend-box level-4" title="4+ buổi (Cao điểm)"></div>
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
 * 4️⃣ CHẾ ĐỘ CẢ NĂM: Ma trận 52 tuần x 7 ngày GitHub Matrix
 */
function renderYearlyMatrixView(container, semesterWeeks = [], onSelectWeek = null) {
  const months = ['Th 9', 'Th 10', 'Th 11', 'Th 12', 'Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8'];
  const dayLabels = ['T2', '', 'T4', '', 'T6', '', 'CN'];

  const totalWeeksCount = 52;
  const squares = [];

  for (let w = 0; w < totalWeeksCount; w++) {
    const weekData = semesterWeeks[w % semesterWeeks.length] || null;
    for (let d = 0; d < 7; d++) {
      let count = 0;
      let dayName = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'][d];
      let level = 0;
      let classesList = [];

      if (weekData && weekData.days) {
        const dStat = weekData.days[d];
        if (dStat) {
          count = dStat.classesCount;
          level = dStat.level;
          classesList = dStat.classes || [];
        }
      }

      squares.push({
        weekIdx: w + 1,
        dayIdx: d,
        dayName,
        classesCount: count,
        level,
        classes: classesList,
        weekFilename: weekData ? weekData.filename : ''
      });
    }
  }

  container.innerHTML = `
    <div class="heatmap-matrix-card">
      <div class="heatmap-card-header">
        <div class="heatmap-card-title-group">
          <div class="heatmap-card-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <h3 class="heatmap-card-title">Toàn Cảnh Năm Học (52 Tuần Học & Rèn Luyện)</h3>
            <span class="heatmap-card-sub">Chuẩn GitHub Contribution Matrix • 364 Ô Ngày Toàn Niên Khóa</span>
          </div>
        </div>

        <div class="heatmap-card-actions">
          ${generateHorizonModeTabsHtml('year')}
        </div>
      </div>

      <div class="yearly-matrix-scroll-wrap">
        <div class="yearly-months-row">
          ${months.map(m => `<span>${m}</span>`).join('')}
        </div>

        <div class="yearly-matrix-body">
          <div class="yearly-days-labels">
            ${dayLabels.map(l => `<span>${l}</span>`).join('')}
          </div>

          <div class="yearly-squares-grid" id="yearly-squares-grid">
            ${squares.map(sq => {
              const tooltipTitle = `Tuần ${sq.weekIdx} • ${sq.dayName}`;
              const tooltipSub = sq.classesCount > 0 ? `${sq.classesCount} buổi học` : 'Nghỉ ngơi';
              const tooltipBody = sq.classes.length > 0
                ? sq.classes.map(c => `<div class="tt-row"><strong>${escapeHtml(c.subject)}</strong> <span>(${escapeHtml(c.timeRange)})</span></div>`).join('')
                : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có buổi học</div>`;

              return `
                <div class="yearly-square-item level-${sq.level}" 
                  data-week-num="${sq.weekIdx}"
                  data-day="${sq.dayName}"
                  data-count="${sq.classesCount}"
                  data-filename="${escapeHtml(sq.weekFilename)}"
                  data-heatmap-tooltip="true"
                  data-tooltip-title="${escapeHtml(tooltipTitle)}"
                  data-tooltip-sub="${escapeHtml(tooltipSub)}"
                  data-tooltip-body="${escapeHtml(tooltipBody)}"
                  data-tooltip-badge="${sq.classesCount > 0 ? `Level ${sq.level}` : 'Nghỉ'}"
                  data-tooltip-badge-bg="${sq.classesCount > 0 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(148, 163, 184, 0.15)'}"
                  data-tooltip-badge-color="${sq.classesCount > 0 ? '#c084fc' : '#94a3b8'}">
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="heatmap-card-footer">
        <div class="heatmap-legend-row" style="font-size: 0.74rem;">
          <span>Mức nhiệt:</span>
          <div class="legend-scale-boxes">
            <div class="legend-box level-0" title="0 buổi (Nghỉ)"></div>
            <div class="legend-box level-1" title="1 buổi (Nhẹ)"></div>
            <div class="legend-box level-2" title="2 buổi (Vừa)"></div>
            <div class="legend-box level-3" title="3 buổi (Dày)"></div>
            <div class="legend-box level-4" title="4+ buổi (Cao điểm)"></div>
          </div>
        </div>

        <span style="font-size: 0.74rem; color: var(--text-muted);">
          <i class="fa-regular fa-hand-pointer"></i> Bấm vào ô bất kỳ để mở tuần tương ứng
        </span>
      </div>
    </div>
  `;

  container.querySelectorAll('.yearly-square-item').forEach(sq => {
    sq.onclick = () => {
      const fn = sq.dataset.filename;
      if (fn && typeof onSelectWeek === 'function') {
        onSelectWeek(fn);
      }
    };
  });
}

/**
 * Điều phối render nội dung chi tiết theo chế độ thời gian đang chọn
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
    renderSemesterMatrixView(contentArea, semesterWeeks, currentWeekFile, onSelectWeek);
  }

  // Tích hợp bộ bắt sự kiện Tabs trực tiếp trong Card Header
  bindHorizonModeTabsEvents(contentArea, semesterWeeks, currentWeekFile, onSelectWeek);
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

  storedAvailableWeeks = availableWeeks;
  storedCurrentWeekFile = currentWeekFile;
  storedOnSelectWeek = onSelectWeek;

  activeWeeklyFile = currentWeekFile;
  const semesterWeeks = aggregateSemesterData(availableWeeks, currentWeekFile);

  preloadAllWeeksData(availableWeeks, currentWeekFile, onSelectWeek);

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

  const currentWeekObj = semesterWeeks.find(w => w.filename === currentWeekFile) || semesterWeeks[0];
  const currentDayOfWeek = new Date().getDay();
  const todayDayNameMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayName = todayDayNameMap[currentDayOfWeek];

  const todayStats = currentWeekObj ? currentWeekObj.days.find(d => d.dayName === todayName) : null;
  const todayClasses = todayStats ? todayStats.classes : [];

  const isHeaderCollapsed = localStorage.getItem('smart_schedule_heatmap_banner_collapsed') !== 'false';

  container.innerHTML = `
    <div class="heatmap-view-wrapper">
      
      <!-- 1. HERO BANNER THỐNG KÊ CƯỜNG ĐỘ HỌC TẬP -->
      <div class="heatmap-hero-banner ${isHeaderCollapsed ? 'is-collapsed' : ''}" id="heatmap-hero-banner">
        <div class="heatmap-hero-header">
          <div class="heatmap-badge-group">
            <span class="heatmap-status-badge">
              <i class="fa-solid fa-chart-simple"></i> Bản Đồ Cường Độ Học Tập
            </span>
            <span class="heatmap-version-badge">Timeline Google Calendar</span>
          </div>

          <!-- Các thẻ tóm tắt nhanh khi thu gọn -->
          <div class="heatmap-collapsed-tags">
            <span class="collapsed-tag">Hôm nay: <strong>${todayClasses.length}b</strong></span>
            <span class="collapsed-tag">Học kỳ: <strong>${totalSemesterClasses}b</strong></span>
            <span class="collapsed-tag">Cao điểm: <strong>${peakWeek ? peakWeek.title : 'Chưa có'}</strong></span>
            <span class="collapsed-tag">Lên lớp: <strong>${activeStudyDays} ngày</strong></span>
          </div>

          <button type="button" class="btn-toggle-hero" id="btn-toggle-heatmap-banner" title="${isHeaderCollapsed ? 'Mở rộng bảng thống kê chi tiết' : 'Thu gọn bảng thống kê'}">
            <i class="fa-solid ${isHeaderCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
            <span class="toggle-text">${isHeaderCollapsed ? 'Chi tiết' : 'Thu gọn'}</span>
          </button>
        </div>

        <div class="heatmap-hero-body">
          <div class="heatmap-hero-main">
            <h2 class="heatmap-main-title">
              Nhịp Độ Học Tập & Không Gian Thời Gian ⏱️
            </h2>
            <p class="heatmap-sub-title">
              Quan sát cường độ học tập dưới góc nhìn đa chiều: Lịch Google Calendar thời gian thực, Ma trận tháng GitHub và Tiến độ cả học kỳ.
            </p>
          </div>
        </div>

        <div class="heatmap-kpi-grid">
          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${todayClasses.length} buổi</span>
              <span class="heatmap-kpi-label">Hôm nay (${todayName})</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
              <i class="fa-solid fa-book-bookmark"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${totalSemesterClasses} buổi</span>
              <span class="heatmap-kpi-label">Tổng buổi cả học kỳ</span>
            </div>
          </div>

          <div class="heatmap-kpi-card">
            <div class="heatmap-kpi-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="heatmap-kpi-info">
              <span class="heatmap-kpi-value">${peakWeek ? `${peakWeek.title} (${peakWeek.totalClasses}b)` : 'Chưa có'}</span>
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
      <div class="today-focus-card ${isHeaderCollapsed ? 'is-collapsed' : ''}" id="heatmap-today-focus-card">
        <div class="today-focus-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span class="today-focus-badge"><i class="fa-regular fa-clock"></i> Lịch học Hôm nay</span>
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

      <!-- 3. KHUNG NỘI DUNG HEATMAP TÍCH HỢP TABS ĐỒNG NHẤT (UNIFIED SINGLE CARD) -->
      <div id="heatmap-dynamic-content-area">
        <!-- Render động trọn gói Card + Tabs Header theo currentHorizonMode -->
      </div>
    </div>
  `;

  renderActiveHorizonModeContent(semesterWeeks, currentWeekFile, onSelectWeek);

  // Gắn sự kiện nút Toggle Thu gọn / Mở rộng Banner
  const toggleBannerBtn = container.querySelector('#btn-toggle-heatmap-banner');
  const heroBannerEl = container.querySelector('#heatmap-hero-banner');
  const todayFocusCardEl = container.querySelector('#heatmap-today-focus-card');
  if (toggleBannerBtn && heroBannerEl) {
    toggleBannerBtn.onclick = () => {
      heroBannerEl.classList.toggle('is-collapsed');
      if (todayFocusCardEl) {
        todayFocusCardEl.classList.toggle('is-collapsed');
      }
      const isNowCollapsed = heroBannerEl.classList.contains('is-collapsed');
      localStorage.setItem('smart_schedule_heatmap_banner_collapsed', isNowCollapsed ? 'true' : 'false');

      const icon = toggleBannerBtn.querySelector('i');
      const text = toggleBannerBtn.querySelector('.toggle-text');
      if (icon) {
        icon.className = isNowCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
      }
      if (text) {
        text.textContent = isNowCollapsed ? 'Chi tiết' : 'Thu gọn';
      }
      toggleBannerBtn.title = isNowCollapsed ? 'Mở rộng bảng thống kê chi tiết' : 'Thu gọn bảng thống kê';
    };
  }
}

/**
 * Định vị & Focus vào ngày hôm nay NGAY TRONG Bản Đồ Nhiệt (Mục 2)
 * Tự động nhận diện chế độ xem hiện tại (Tuần / Tháng / Học kỳ) mà KHÔNG chuyển tab
 */
export async function focusTodayInHeatmap() {
  const container = document.getElementById('today-view-container');
  if (!container) return;

  // 1. Chế độ TUẦN (Google Calendar Weekly Matrix)
  if (currentHorizonMode === 'week') {
    const todayWeekFile = storedCurrentWeekFile || state.currentWeekFile || '';
    if (todayWeekFile && activeWeeklyFile !== todayWeekFile) {
      activeWeeklyFile = todayWeekFile;
      const semesterWeeks = aggregateSemesterData(storedAvailableWeeks, todayWeekFile);
      renderActiveHorizonModeContent(semesterWeeks, todayWeekFile, storedOnSelectWeek);
    }

    setTimeout(() => {
      const todayCol = container.querySelector('.cal-day-column.is-today-cal-column');
      const todayHeader = container.querySelector('.cal-day-header-cell.is-today-cal-header');
      const nowLine = container.querySelector('.cal-current-time-line');
      const scrollArea = container.querySelector('.weekly-cal-unified-scroll-area');

      if (todayCol || todayHeader) {
        // Cuộn ngang tới cột hôm nay
        if (todayCol && scrollArea) {
          const colLeft = todayCol.offsetLeft;
          const colWidth = todayCol.offsetWidth;
          const targetScrollLeft = Math.max(0, colLeft - (scrollArea.clientWidth / 2) + (colWidth / 2));
          scrollArea.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
        }

        // Cuộn dọc tới vạch giờ hiện tại nếu có
        if (nowLine && scrollArea) {
          const lineTop = nowLine.offsetTop;
          scrollArea.scrollTo({ top: Math.max(0, lineTop - 120), behavior: 'smooth' });
        } else if (todayCol) {
          todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        // Kích hoạt hiệu ứng Radar Ping
        if (todayCol) {
          todayCol.classList.remove('heatmap-focus-ping');
          void todayCol.offsetWidth;
          todayCol.classList.add('heatmap-focus-ping');
        }
        if (todayHeader) {
          todayHeader.classList.remove('heatmap-focus-ping');
          void todayHeader.offsetWidth;
          todayHeader.classList.add('heatmap-focus-ping');
        }

        setTimeout(() => {
          if (todayCol) todayCol.classList.remove('heatmap-focus-ping');
          if (todayHeader) todayHeader.classList.remove('heatmap-focus-ping');
        }, 2500);

        showToast('Đã định vị ngày Hôm nay trên Lịch Tuần! 🎯');
      } else {
        showToast('Hôm nay không nằm trong tuần học đang hiển thị.');
      }
    }, 120);
    return;
  }

  // 2. Chế độ THÁNG (Monthly Matrix)
  if (currentHorizonMode === 'month') {
    const today = new Date();
    if (currentMonthlyDate.getFullYear() !== today.getFullYear() || currentMonthlyDate.getMonth() !== today.getMonth()) {
      currentMonthlyDate = new Date();
      const semesterWeeks = aggregateSemesterData(storedAvailableWeeks, storedCurrentWeekFile);
      renderActiveHorizonModeContent(semesterWeeks, storedCurrentWeekFile, storedOnSelectWeek);
    }

    setTimeout(() => {
      const todaySquare = container.querySelector('.monthly-matrix-square.is-today-square');
      if (todaySquare) {
        todaySquare.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        todaySquare.classList.remove('heatmap-focus-ping');
        void todaySquare.offsetWidth;
        todaySquare.classList.add('heatmap-focus-ping');

        setTimeout(() => {
          todaySquare.classList.remove('heatmap-focus-ping');
        }, 2500);

        showToast('Đã định vị ngày Hôm nay trên Lịch Tháng! 🎯');
      } else {
        showToast('Đã chuyển tới tháng hiện tại.');
      }
    }, 120);
    return;
  }

  // 3. Chế độ HỌC KỲ (Semester Matrix)
  if (currentHorizonMode === 'semester') {
    const currentWeekSquare = container.querySelector('.semester-square-item.is-in-current-week');
    if (currentWeekSquare) {
      currentWeekSquare.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      const currentWeekSquares = container.querySelectorAll('.semester-square-item.is-in-current-week');
      currentWeekSquares.forEach(sq => {
        sq.classList.remove('heatmap-focus-ping');
        void sq.offsetWidth;
        sq.classList.add('heatmap-focus-ping');
      });

      setTimeout(() => {
        currentWeekSquares.forEach(sq => sq.classList.remove('heatmap-focus-ping'));
      }, 2500);

      showToast('Đã định vị Tuần Hiện Tại trên Bản Đồ Học Kỳ! 🎯');
    } else {
      showToast('Tuần hiện tại không có trong danh sách học kỳ.');
    }
  }
}
