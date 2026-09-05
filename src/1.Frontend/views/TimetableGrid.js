/**
 * ==========================================================================
 * FRONTEND VIEW - TIMETABLE GRID VIEW (MA TRẬN LỊCH HỌC CHUẨN STYLE.CSS)
 * ==========================================================================
 */

import { state } from '../../3.Database/state.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';
import { SUBJECT_COLORS } from '../../3.Database/storage/SeedData.js';
import { showToast } from '../components/Toast.js';

const subjectColorMap = new Map();

export function getSubjectColor(subjectName) {
  const normalized = (subjectName || '').trim();
  if (!subjectColorMap.has(normalized)) {
    const colorIndex = subjectColorMap.size % SUBJECT_COLORS.length;
    subjectColorMap.set(normalized, SUBJECT_COLORS[colorIndex]);
  }
  return subjectColorMap.get(normalized);
}

/**
 * Render ma trận thời khóa biểu theo chế độ 1 ngày / 3 ngày / 7 ngày
 * @param {Array<Object>} days 
 * @param {boolean} isCurrentWeek 
 */
export function renderTimetableGrid(days = [], isCurrentWeek = false) {
  const scheduleGrid = document.getElementById('schedule-grid');
  if (!scheduleGrid) return;

  scheduleGrid.innerHTML = '';
  const currentDayOfWeek = new Date().getDay();
  const mode = state.daysDisplayMode || '7';

  // Cập nhật class layout trên container
  scheduleGrid.classList.remove('mode-1-day', 'mode-3-days', 'mode-7-days');
  scheduleGrid.classList.add(mode === '1' ? 'mode-1-day' : (mode === '3' ? 'mode-3-days' : 'mode-7-days'));

  // Lọc danh sách ngày cần hiển thị theo chế độ đã chọn
  let daysToRender = days || [];
  if (daysToRender.length > 0) {
    if (mode === '1') {
      // Chế độ 1 Ngày: Ưu tiên ngày hôm nay (nếu tuần hiện tại), hoặc ngày đầu tiên có tiết học, hoặc ngày đầu tuần
      let targetIndex = -1;
      if (isCurrentWeek) {
        targetIndex = daysToRender.findIndex(d => d.dayOfWeekNumber === currentDayOfWeek);
      }
      if (targetIndex === -1) {
        targetIndex = daysToRender.findIndex(d => d.classes && d.classes.length > 0);
      }
      if (targetIndex === -1) {
        targetIndex = 0;
      }
      daysToRender = [daysToRender[targetIndex]];
    } else if (mode === '3') {
      // Chế độ 3 Ngày: [Hôm qua, Hôm nay, Ngày mai]
      let centerIndex = -1;
      if (isCurrentWeek) {
        centerIndex = daysToRender.findIndex(d => d.dayOfWeekNumber === currentDayOfWeek);
      }
      if (centerIndex === -1) {
        centerIndex = daysToRender.findIndex(d => d.classes && d.classes.length > 0);
      }
      if (centerIndex === -1) {
        centerIndex = 1; // Mặc định Thứ Ba hoặc giữa tuần
      }
      // Tính toán cửa sổ 3 ngày liền kề trong tuần
      let startIdx = centerIndex - 1;
      if (startIdx < 0) startIdx = 0;
      if (startIdx + 3 > daysToRender.length) {
        startIdx = Math.max(0, daysToRender.length - 3);
      }
      daysToRender = daysToRender.slice(startIdx, startIdx + 3);
    }
  }

  daysToRender.forEach(day => {
    let filteredClasses = day.classes || [];

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
          (c.period && c.period.toLowerCase().includes(q))
        );
      }
    }

    const isToday = isCurrentWeek && (day.dayOfWeekNumber === currentDayOfWeek);

    const dayCard = document.createElement('div');
    dayCard.className = `day-card ${isToday ? 'is-today' : ''}`;

    let classesHtml = '';

    if (day.isDayOff || (filteredClasses.length === 0 && (!state.searchQuery && !state.activeFilterSubject))) {
      classesHtml = `
        <div class="day-off-card day-empty-box" data-day="${escapeHtml(day.name)}">
          <div class="day-off-icon"><i class="fa-solid fa-mug-hot"></i></div>
          <div class="day-off-text">${escapeHtml(day.dayOffText || 'Chưa có tiết học')}</div>
          <button type="button" class="btn-quick-add-class" data-day="${escapeHtml(day.name)}" title="Thêm tiết học vào ${escapeHtml(day.name)}">
            <i class="fa-solid fa-plus"></i> <span>Thêm tiết học</span>
          </button>
        </div>
      `;
    } else if (filteredClasses.length === 0) {
      classesHtml = `<div class="day-off-card"><p class="day-off-text">Không tìm thấy môn phù hợp</p></div>`;
    } else {
      classesHtml = `<div class="classes-list">` + filteredClasses.map((c, cIdx) => {
        const color = getSubjectColor(c.subject);
        return `
          <div class="class-item" style="border-left-color: ${color.border};" data-day="${escapeHtml(day.name)}" data-idx="${cIdx}">
            <div class="class-time-row">
              <div class="class-time-badge-group">
                <span class="class-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(c.timeRange)}</span>
                ${c.period ? `<span class="class-period">${escapeHtml(c.period)}</span>` : ''}
              </div>
              <div class="class-edit-actions">
                <button type="button" class="btn-mini-action btn-edit-class-item" title="Chỉnh sửa tiết học này" data-day="${escapeHtml(day.name)}" data-idx="${cIdx}">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn-mini-action btn-delete-class-item" title="Xóa tiết học này" data-day="${escapeHtml(day.name)}" data-idx="${cIdx}">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
            <div class="class-subject-name" style="color: ${color.text || 'inherit'};">${escapeHtml(c.subject)}</div>
            <div class="class-room-row">
              <span class="class-room"><i class="fa-solid fa-door-open"></i> ${escapeHtml(c.room)}</span>
              <div class="class-actions-group">
                <button class="btn-view-subject-grade" title="Xem tỉ lệ điểm môn ${escapeHtml(c.subject)}" data-subject="${escapeHtml(c.subject)}">
                  <i class="fa-solid fa-chart-pie"></i>
                </button>
                <button class="btn-view-subject-backpack" title="Mở nhanh Google Drive môn ${escapeHtml(c.subject)}" data-subject="${escapeHtml(c.subject)}">
                  <i class="fa-brands fa-google-drive"></i>
                </button>
                <button class="btn-copy-info" title="Sao chép thông tin tiết học" data-subject="${escapeHtml(c.subject)}" data-time="${escapeHtml(c.timeRange)}" data-room="${escapeHtml(c.room)}">
                  <i class="fa-regular fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('') + `
        <button type="button" class="btn-add-more-class" data-day="${escapeHtml(day.name)}" title="Thêm tiết học vào ${escapeHtml(day.name)}">
          <i class="fa-solid fa-plus"></i> <span>Thêm tiết vào ${escapeHtml(day.name)}</span>
        </button>
      </div>`;
    }

    dayCard.innerHTML = `
      <div class="day-header">
        <h3 class="day-title">
          <span>${escapeHtml(day.name)}</span>
          ${isToday ? `<span class="badge-today">Hôm nay</span>` : ''}
        </h3>
        <span class="class-count-badge">${day.classes ? day.classes.length : 0} tiết</span>
      </div>
      ${classesHtml}
    `;

    // Gắn sự kiện Long-press trên khung ngày để thêm môn
    attachDayCardLongPress(dayCard, day.name);

    scheduleGrid.appendChild(dayCard);
  });

  // Gắn sự kiện cho các nút trong class item & add buttons
  scheduleGrid.querySelectorAll('.btn-quick-add-class, .btn-add-more-class').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (window.openAddClassModal) {
        window.openAddClassModal(btn.dataset.day);
      }
    };
  });

  scheduleGrid.querySelectorAll('.btn-edit-class-item').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const dayName = btn.dataset.day;
      const idx = parseInt(btn.dataset.idx, 10);
      const day = (days || []).find(d => d.name === dayName);
      if (day && day.classes && day.classes[idx] && window.openEditClassModal) {
        window.openEditClassModal(dayName, idx, day.classes[idx]);
      }
    };
  });

  scheduleGrid.querySelectorAll('.btn-delete-class-item').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const dayName = btn.dataset.day;
      const idx = parseInt(btn.dataset.idx, 10);
      const day = (days || []).find(d => d.name === dayName);
      const cls = day && day.classes ? day.classes[idx] : null;
      if (window.deleteClassFromDay) {
        window.deleteClassFromDay(dayName, idx, cls);
      }
    };
  });

  scheduleGrid.querySelectorAll('.btn-view-subject-grade').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      window.viewSubjectGrade(btn.dataset.subject);
    };
  });

  scheduleGrid.querySelectorAll('.btn-view-subject-backpack').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      window.viewSubjectBackpack(btn.dataset.subject);
    };
  });

  scheduleGrid.querySelectorAll('.btn-copy-info').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      window.copyClassInfo(btn.dataset.subject, btn.dataset.time, btn.dataset.room);
    };
  });
}

/**
 * Gắn sự kiện Long-press trên thẻ ngày để mở modal thêm môn nhanh
 * @param {HTMLElement} dayCard 
 * @param {string} dayName 
 */
function attachDayCardLongPress(dayCard, dayName) {
  let longPressTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;

  const startPress = (e) => {
    if (e.target.closest('button') || e.target.closest('.class-actions-group')) return;
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
    longPressTimer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(60);
      if (window.openAddClassModal) {
        window.openAddClassModal(dayName);
      }
    }, 750);
  };

  const cancelPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const checkMove = (e) => {
    if (!longPressTimer || !e.touches || !e.touches[0]) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 8 || dy > 8) cancelPress();
  };

  dayCard.addEventListener('mousedown', startPress);
  dayCard.addEventListener('touchstart', startPress, { passive: true });
  dayCard.addEventListener('touchmove', checkMove, { passive: true });
  dayCard.addEventListener('mouseup', cancelPress);
  dayCard.addEventListener('mouseleave', cancelPress);
  dayCard.addEventListener('touchend', cancelPress);
  dayCard.addEventListener('touchcancel', cancelPress);
}

/**
 * Render giao diện Focus hôm nay
 * @param {Array<Object>} days 
 * @param {boolean} isCurrentWeek 
 */
export function renderTodayView(days = [], isCurrentWeek = false) {
  const todayList = document.getElementById('today-timeline-list');
  const todaySummary = document.getElementById('today-summary-text');
  if (!todayList) return;

  todayList.innerHTML = '';
  const currentDayOfWeek = new Date().getDay();

  if (!isCurrentWeek) {
    if (todaySummary) todaySummary.textContent = `Bạn đang xem thời khóa biểu của một tuần khác, không phải tuần hiện tại.`;
    todayList.innerHTML = `
      <div class="day-off-card" style="padding: 3rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-calendar-week"></i></div>
        <h3>Đang xem tuần khác</h3>
        <p>Để xem các tiết học của hôm nay, vui lòng chuyển về đúng tuần hiện tại.</p>
      </div>
    `;
    return;
  }

  const todayDay = days.find(d => d.dayOfWeekNumber === currentDayOfWeek);

  if (!todayDay || todayDay.isDayOff || !todayDay.classes || todayDay.classes.length === 0) {
    if (todaySummary) todaySummary.textContent = `Hôm nay bạn không có lịch học. Tận hưởng thời gian nghỉ ngơi nhé!`;
    todayList.innerHTML = `
      <div class="day-off-card" style="padding: 3rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-mug-hot"></i></div>
        <h3>Hôm nay được nghỉ!</h3>
        <p>Không có buổi học nào được ghi nhận trong lịch tuần này.</p>
      </div>
    `;
    return;
  }

  if (todaySummary) {
    todaySummary.textContent = `Hôm nay (${todayDay.name}) bạn có ${todayDay.classes.length} buổi học cần tham gia:`;
  }

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
          <button class="btn-view-subject-grade" title="Xem tỉ lệ điểm môn ${escapeHtml(c.subject)}" data-subject="${escapeHtml(c.subject)}">
            <i class="fa-solid fa-chart-pie"></i>
          </button>
          <button class="btn-view-subject-backpack" title="Mở nhanh Google Drive môn ${escapeHtml(c.subject)}" data-subject="${escapeHtml(c.subject)}">
            <i class="fa-brands fa-google-drive"></i>
          </button>
        </div>
      </div>
    `;

    todayList.appendChild(item);
  });

  todayList.querySelectorAll('.btn-view-subject-grade').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      window.viewSubjectGrade(btn.dataset.subject);
    };
  });

  todayList.querySelectorAll('.btn-view-subject-backpack').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      window.viewSubjectBackpack(btn.dataset.subject);
    };
  });
}
