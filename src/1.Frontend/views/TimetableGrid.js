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
 * Render ma trận thời khóa biểu 7 ngày x 12 tiết
 * @param {Array<Object>} days 
 */
export function renderTimetableGrid(days = []) {
  const scheduleGrid = document.getElementById('schedule-grid');
  if (!scheduleGrid) return;

  scheduleGrid.innerHTML = '';
  const currentDayOfWeek = new Date().getDay();

  days.forEach(day => {
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
      if (day.classes && day.classes.length > 0 && (state.searchQuery || state.activeFilterSubject)) {
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
      }).join('') + `</div>`;
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

    scheduleGrid.appendChild(dayCard);
  });

  // Gắn sự kiện cho các nút trong class item
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
 * Render giao diện Focus hôm nay
 * @param {Array<Object>} days 
 */
export function renderTodayView(days = []) {
  const todayList = document.getElementById('today-timeline-list');
  const todaySummary = document.getElementById('today-summary-text');
  if (!todayList) return;

  todayList.innerHTML = '';
  const currentDayOfWeek = new Date().getDay();

  const todayDay = days.find(d => 
    d.dayOfWeekNumber === currentDayOfWeek || 
    (d.name.includes('Thứ 7 & Chủ Nhật') && (currentDayOfWeek === 6 || currentDayOfWeek === 0))
  );

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
