/**
 * ==========================================================================
 * FRONTEND VIEW - STUDY INTENSITY HEATMAP & PRODUCTIVITY DASHBOARD
 * Bản đồ nhiệt cường độ học tập & mật độ tiết học (Tuần / Tháng / Học kỳ / Cả năm)
 * Đồng bộ toàn diện theo phong cách GitHub Contribution Matrix
 * ==========================================================================
 */

import { state } from '../../3.Database/state.js';
import { parseScheduleMarkdown } from '../../2.Backend/services/TimetableParser.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';

/* ==========================================================================
   1. MODULE STATE & CONSTANTS (HCMUT STANDARD SCHEDULE: 16 PERIODS)
   ========================================================================== */
let currentHorizonMode = 'semester'; // 'week' | 'month' | 'semester' | 'year'
let currentMonthlyDate = new Date(); // Tháng đang xem trong chế độ Tháng
let activeWeeklyFile = ''; // File tuần đang xem trong chế độ Tuần

// Bộ nhớ đệm dữ liệu tất cả các tuần trong học kỳ
const weeksDataCache = new Map();
let isPreloadingWeeks = false;

// 16 Tiết học chuẩn ĐH Bách Khoa TP.HCM (Ca Sáng: 1-6, Ca Chiều: 7-12, Ca Tối: 13-16)
const PERIOD_TIME_MAP = {
  1: { start: '06:00', end: '06:50', session: 'Sáng', code: 'T1' },
  2: { start: '07:00', end: '07:50', session: 'Sáng', code: 'T2' },
  3: { start: '08:00', end: '08:50', session: 'Sáng', code: 'T3' },
  4: { start: '09:00', end: '09:50', session: 'Sáng', code: 'T4' },
  5: { start: '10:00', end: '10:50', session: 'Sáng', code: 'T5' },
  6: { start: '11:00', end: '11:50', session: 'Sáng', code: 'T6' },
  7: { start: '12:00', end: '12:50', session: 'Chiều', code: 'T7' },
  8: { start: '13:00', end: '13:50', session: 'Chiều', code: 'T8' },
  9: { start: '14:00', end: '14:50', session: 'Chiều', code: 'T9' },
  10: { start: '15:00', end: '15:50', session: 'Chiều', code: 'T10' },
  11: { start: '16:00', end: '16:50', session: 'Chiều', code: 'T11' },
  12: { start: '17:00', end: '17:50', session: 'Chiều', code: 'T12' },
  13: { start: '18:00', end: '18:50', session: 'Tối', code: 'T13' },
  14: { start: '18:50', end: '19:40', session: 'Tối', code: 'T14' },
  15: { start: '19:45', end: '20:35', session: 'Tối', code: 'T15' },
  16: { start: '20:35', end: '21:25', session: 'Tối', code: 'T16' }
};

/* ==========================================================================
   2. HELPER FUNCTIONS & DATA AGGREGATOR
   ========================================================================== */

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
 * Phân bổ các môn học trong ngày vào 16 tiết chuẩn
 * @param {Array<Object>} classes 
 * @returns {Array<Object|null>} 16 phần tử (index 0 -> 15 đại diện Tiết 1 -> 16)
 */
export function mapDayClassesToPeriods(classes = []) {
  const TOTAL_PERIODS = 16;
  const slots = Array(TOTAL_PERIODS).fill(null);
  
  (classes || []).forEach(cls => {
    let periods = [];

    // 1. Phân tích từ trường period: "Tiết 5 - 6", "Tiết 13 - 14", "Tiết 4-6", "Tiết 2,3"
    if (cls.period) {
      const nums = cls.period.match(/\d+/g);
      if (nums && nums.length >= 2) {
        const start = parseInt(nums[0], 10);
        const end = parseInt(nums[nums.length - 1], 10);
        for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
          if (p >= 1 && p <= TOTAL_PERIODS) periods.push(p);
        }
      } else if (nums && nums.length === 1) {
        const p = parseInt(nums[0], 10);
        if (p >= 1 && p <= TOTAL_PERIODS) periods.push(p);
      }
    }

    // 2. Nếu không có period, phân tích từ startTime và endTime
    if (periods.length === 0 && cls.startTime) {
      const [startH, startM = 0] = cls.startTime.split(':').map(Number);
      const [endH = startH + 2, endM = 0] = (cls.endTime || '').split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (let p = 1; p <= TOTAL_PERIODS; p++) {
        const pInfo = PERIOD_TIME_MAP[p];
        const [pH, pM = 0] = pInfo.start.split(':').map(Number);
        const pStartMin = pH * 60 + pM;
        const pEndMin = pStartMin + 50;

        if (startMinutes < pEndMin && endMinutes > pStartMin) {
          periods.push(p);
        }
      }
    }

    // 3. Fallback an toàn nếu không xác định được
    if (periods.length === 0) {
      periods = [2, 3];
    }

    periods.forEach(p => {
      if (p >= 1 && p <= TOTAL_PERIODS) {
        slots[p - 1] = cls;
      }
    });
  });

  return slots;
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

    // 1. Kiểm tra custom md trong LocalStorage
    const customMd = localStorage.getItem(`smart_schedule_custom_md_${w.filename}`);
    if (customMd) {
      weeksDataCache.set(w.filename, parseScheduleMarkdown(customMd));
      return;
    }

    // 2. Fetch từ file tĩnh nếu chưa có
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

  // Re-render lại Heatmap nếu đang hiển thị
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
 * 1️⃣ CHẾ ĐỘ TUẦN: Ma trận Tiết Học Trong Tuần (16 Tiết × 7 Ngày GitHub Matrix)
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

  container.innerHTML = `
    <div class="heatmap-matrix-card">
      <div class="heatmap-card-header">
        <div class="heatmap-card-title-group">
          <div class="heatmap-card-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
            <i class="fa-solid fa-table-columns"></i>
          </div>
          <div>
            <h3 class="heatmap-card-title">Ma Trận Tiết Học Trong Tuần (16 Tiết × 7 Ngày)</h3>
            <span class="heatmap-card-sub">Chuẩn GitHub Time-Slot Matrix • ${escapeHtml(selectedWeek.title)}</span>
          </div>
        </div>

        <div class="heatmap-card-actions">
          <span class="semester-workload-badge" style="background: ${selectedWeek.workload.bg}; color: ${selectedWeek.workload.color};">
            ${selectedWeek.workload.label} (${selectedWeek.totalClasses} tiết)
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

      <div class="weekly-timeslot-matrix-wrap">
        <div class="weekly-timeslot-matrix-body">
          <!-- Cột nhãn Tiết học (1 - 16) -->
          <div class="weekly-periods-col">
            <div class="period-header-corner">Tiết</div>
            ${Array.from({ length: 16 }, (_, i) => {
              const p = i + 1;
              const info = PERIOD_TIME_MAP[p] || {};
              const sessionClass = p <= 6 ? 'session-morning' : (p <= 12 ? 'session-afternoon' : 'session-evening');
              return `
                <div class="period-slot-label ${sessionClass}" title="Tiết ${p} (${info.start} - ${info.end})">
                  <span>T${p}</span>
                  <small>${info.start}</small>
                </div>
              `;
            }).join('')}
          </div>

          <!-- 7 Cột Ngày trong tuần -->
          <div class="weekly-days-matrix-grid">
            ${standardDays.map(d => {
              const isToday = dayIndexMap[d.dayName] === currentDayOfWeek && selectedWeek.filename === currentWeekFile;
              const daySlots = mapDayClassesToPeriods(d.classes);

              return `
                <div class="weekly-day-matrix-col ${isToday ? 'is-today-column' : ''}">
                  <div class="weekly-day-col-header ${isToday ? 'is-today-header' : ''}">
                    <span class="day-code">${d.dayName.replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}</span>
                    <span class="day-count">${d.classesCount}t</span>
                  </div>

                  <div class="weekly-day-slots-list">
                    ${daySlots.map((cls, slotIdx) => {
                      const periodNum = slotIdx + 1;
                      const periodInfo = PERIOD_TIME_MAP[periodNum] || {};
                      const hasClass = !!cls;
                      const level = hasClass ? 3 : 0;

                      const tooltipTitle = `${d.dayName} • Tiết ${periodNum} (${periodInfo.start} - ${periodInfo.end})`;
                      const tooltipSub = hasClass ? cls.subject : 'Tiết trống';
                      const tooltipBody = hasClass 
                        ? `<div class="tt-row"><i class="fa-regular fa-clock"></i> <span>${escapeHtml(cls.timeRange)}</span></div>
                           <div class="tt-row"><i class="fa-solid fa-location-dot"></i> <span>Phòng: ${escapeHtml(cls.room || 'Chưa rõ')}</span></div>`
                        : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có lịch học trong khung giờ này</div>`;

                      return `
                        <div class="matrix-timeslot-cell level-${level} ${hasClass ? 'is-occupied' : 'is-empty'}"
                          data-heatmap-tooltip="true"
                          data-tooltip-title="${escapeHtml(tooltipTitle)}"
                          data-tooltip-sub="${escapeHtml(tooltipSub)}"
                          data-tooltip-body="${escapeHtml(tooltipBody)}"
                          data-tooltip-badge="${hasClass ? 'Có lớp' : 'Trống'}"
                          data-tooltip-badge-bg="${hasClass ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.15)'}"
                          data-tooltip-badge-color="${hasClass ? '#818cf8' : '#94a3b8'}">
                          ${hasClass ? `<span class="slot-dot"></span>` : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="heatmap-card-footer">
        <div class="heatmap-legend-row" style="font-size: 0.74rem;">
          <span>Phân bố:</span>
          <div class="legend-scale-boxes">
            <div class="legend-box level-0" title="Trống"></div>
            <div class="legend-box level-3" title="Có tiết học"></div>
          </div>
          <span style="margin-left: 0.5rem; color: var(--text-muted); font-size: 0.72rem;">(Sáng: Tiết 1-6 • Chiều: Tiết 7-12 • Tối: Tiết 13-16)</span>
        </div>

        <button type="button" class="btn-ghost btn-open-week-nav" data-week="${escapeHtml(selectedWeek.filename)}" style="font-size: 0.78rem; color: #818cf8;">
          <span>Xem chi tiết lịch tuần</span> <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `;

  // Gắn sự kiện đổi tuần trong dropdown
  const selectWeek = container.querySelector('#select-weekly-matrix-week');
  if (selectWeek) {
    selectWeek.onchange = (e) => {
      activeWeeklyFile = e.target.value;
      renderWeeklyMatrixView(container, semesterWeeks, currentWeekFile, onSelectWeek);
      setupHeatmapTooltips();
    };
  }

  // Gắn sự kiện mở tuần
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
 * 2️⃣ CHẾ ĐỘ THÁNG: Ma trận Nhiệt Tháng (Monthly Contribution Matrix)
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
    
    // Tìm tuần khớp theo ngày thực tế
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
            <span class="heatmap-card-sub">Chuẩn GitHub Monthly Matrix • Tổng ${totalMonthClasses} tiết học trong tháng</span>
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
            const tooltipSub = c.classesCount > 0 ? `${c.classesCount} tiết học (${c.weekTitle})` : 'Nghỉ ngơi';
            const tooltipBody = (c.classes || []).length > 0 
              ? c.classes.map(cls => `<div class="tt-row"><strong>${escapeHtml(cls.subject)}</strong> <span>(${escapeHtml(cls.timeRange)})</span></div>`).join('')
              : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có tiết học trong ngày này</div>`;

            return `
              <div class="monthly-matrix-square level-${c.level} ${c.isToday ? 'is-today-square' : ''}"
                data-week="${escapeHtml(c.weekRef || '')}"
                data-heatmap-tooltip="true"
                data-tooltip-title="${escapeHtml(tooltipTitle)}"
                data-tooltip-sub="${escapeHtml(tooltipSub)}"
                data-tooltip-body="${escapeHtml(tooltipBody)}"
                data-tooltip-badge="${c.classesCount > 0 ? `${c.classesCount}t` : 'Nghỉ'}"
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
            <div class="legend-box level-0" title="0 tiết"></div>
            <div class="legend-box level-1" title="1-2 tiết"></div>
            <div class="legend-box level-2" title="3-4 tiết"></div>
            <div class="legend-box level-3" title="5-6 tiết"></div>
            <div class="legend-box level-4" title="7+ tiết"></div>
          </div>
        </div>

        <span style="font-size: 0.74rem; color: var(--text-muted);">
          <i class="fa-regular fa-hand-pointer"></i> Bấm vào ô ngày để mở tuần tương ứng
        </span>
      </div>
    </div>
  `;

  // Gắn sự kiện chuyển tháng
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

  // Click vào ngày -> Mở tuần tương ứng
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
          <span class="semester-workload-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
            ${totalWeeks} Tuần học
          </span>
        </div>
      </div>

      <div class="semester-matrix-scroll-wrap">
        <!-- Hàng Header Tên Tuần -->
        <div class="semester-weeks-header-row" style="grid-template-columns: repeat(${totalWeeks}, 20px);">
          ${semesterWeeks.map((w, idx) => `
            <span class="${w.filename === currentWeekFile ? 'is-current-week-header' : ''}" title="${escapeHtml(w.title)}">
              T${idx + 1}
            </span>
          `).join('')}
        </div>

        <div class="semester-matrix-body">
          <!-- Cột Nhãn Thứ -->
          <div class="semester-days-labels">
            ${dayLabels.map(l => `<span>${l}</span>`).join('')}
          </div>

          <!-- Lưới các ô vuông -->
          <div class="semester-squares-grid" style="grid-template-columns: repeat(${totalWeeks}, 20px);">
            ${squares.map(sq => {
              const tooltipTitle = `${sq.weekTitle} • ${sq.dayName}`;
              const tooltipSub = sq.classesCount > 0 ? `${sq.classesCount} tiết học (${sq.workload.label})` : 'Nghỉ ngơi';
              const tooltipBody = sq.classes.length > 0
                ? sq.classes.map(c => `<div class="tt-row"><strong>${escapeHtml(c.subject)}</strong> <span>(${escapeHtml(c.timeRange)})</span></div>`).join('')
                : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có tiết học trong ngày này</div>`;

              return `
                <div class="semester-square-item level-${sq.level} ${sq.isCurrentWeek ? 'is-in-current-week' : ''}"
                  data-filename="${escapeHtml(sq.weekFilename)}"
                  data-heatmap-tooltip="true"
                  data-tooltip-title="${escapeHtml(tooltipTitle)}"
                  data-tooltip-sub="${escapeHtml(tooltipSub)}"
                  data-tooltip-body="${escapeHtml(tooltipBody)}"
                  data-tooltip-badge="${sq.classesCount > 0 ? `${sq.classesCount}t` : 'Nghỉ'}"
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
            <div class="legend-box level-0" title="0 tiết"></div>
            <div class="legend-box level-1" title="1-2 tiết"></div>
            <div class="legend-box level-2" title="3-4 tiết"></div>
            <div class="legend-box level-3" title="5-6 tiết"></div>
            <div class="legend-box level-4" title="7+ tiết"></div>
          </div>
        </div>

        <span style="font-size: 0.74rem; color: var(--text-muted);">
          <i class="fa-regular fa-hand-pointer"></i> Bấm vào ô bất kỳ để mở thời khóa biểu tuần đó
        </span>
      </div>
    </div>
  `;

  // Click vào ô -> Mở tuần tương ứng
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
          <span style="font-size: 0.76rem; color: var(--text-muted);">
            Chuẩn GitHub Contribution Matrix
          </span>
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
              const tooltipSub = sq.classesCount > 0 ? `${sq.classesCount} tiết học` : 'Nghỉ ngơi';
              const tooltipBody = sq.classes.length > 0
                ? sq.classes.map(c => `<div class="tt-row"><strong>${escapeHtml(c.subject)}</strong> <span>(${escapeHtml(c.timeRange)})</span></div>`).join('')
                : `<div style="color: var(--text-muted); font-size: 0.72rem;">Không có tiết học</div>`;

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
            <div class="legend-box level-0" title="0 tiết"></div>
            <div class="legend-box level-1" title="1-2 tiết"></div>
            <div class="legend-box level-2" title="3-4 tiết"></div>
            <div class="legend-box level-3" title="5-6 tiết"></div>
            <div class="legend-box level-4" title="7+ tiết"></div>
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

  // Kích hoạt nạp trước toàn bộ các tuần trong học kỳ (nếu chưa có trong cache)
  preloadAllWeeksData(availableWeeks, currentWeekFile, onSelectWeek);

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

  const currentWeekObj = semesterWeeks.find(w => w.filename === currentWeekFile) || semesterWeeks[0];
  const currentDayOfWeek = new Date().getDay();
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
