/**
 * ==========================================================================
 * FRONTEND VIEW - TIMETABLE GRID VIEW (MA TRẬN LỊCH HỌC)
 * ==========================================================================
 */

import { state } from '../../3.Database/state.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';
import { isLessonActiveNow } from '../../2.Backend/utils/dateHelpers.js';
import { SUBJECT_COLORS } from '../../3.Database/storage/SeedData.js';

const subjectColorMap = new Map();

function getSubjectColor(subjectName) {
  const normalized = subjectName.trim();
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
  const gridContainer = document.getElementById('schedule-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';
  const currentDayOfWeek = new Date().getDay();

  days.forEach(day => {
    let filteredClasses = day.classes;
    if (state.activeFilterSubject) {
      filteredClasses = day.classes.filter(c => c.subject.toLowerCase().includes(state.activeFilterSubject.toLowerCase()));
    }

    const isToday = day.dayOfWeekNumber === currentDayOfWeek;
    const dayCard = document.createElement('div');
    dayCard.className = `day-card ${isToday ? 'current-day' : ''} ${day.isDayOff ? 'day-off' : ''}`;

    let classesHtml = '';
    if (day.isDayOff) {
      classesHtml = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fa-regular fa-face-smile"></i></div>
          <div class="empty-state-text">${escapeHtml(day.dayOffText || 'Nghỉ học')}</div>
        </div>
      `;
    } else if (filteredClasses.length === 0) {
      classesHtml = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-mug-hot"></i></div>
          <div class="empty-state-text">Không có tiết học</div>
        </div>
      `;
    } else {
      classesHtml = filteredClasses.map(cls => {
        const color = getSubjectColor(cls.subject);
        const isActiveNow = isToday && isLessonActiveNow(cls.startTime, cls.endTime, currentDayOfWeek);

        return `
          <div class="class-item ${isActiveNow ? 'current-active-lesson' : ''}" style="--subject-border: ${color.border}; --subject-bg: ${color.bg}; --subject-text: ${color.text}">
            <div class="class-time">
              <span class="time-range"><i class="fa-regular fa-clock"></i> ${escapeHtml(cls.timeRange)}</span>
              ${cls.period ? `<span class="period-badge">${escapeHtml(cls.period)}</span>` : ''}
              ${isActiveNow ? '<span class="badge-live-pulse">ĐANG HỌC</span>' : ''}
            </div>
            <div class="class-subject">${escapeHtml(cls.subject)}</div>
            <div class="class-room"><i class="fa-solid fa-location-dot"></i> Phòng: ${escapeHtml(cls.room)}</div>
          </div>
        `;
      }).join('');
    }

    dayCard.innerHTML = `
      <div class="day-header">
        <span class="day-name">${escapeHtml(day.name)}</span>
        ${isToday ? '<span class="today-indicator">Hôm nay</span>' : ''}
      </div>
      <div class="class-list">
        ${classesHtml}
      </div>
    `;

    gridContainer.appendChild(dayCard);
  });
}

/**
 * Render giao diện Focus hôm nay
 * @param {Array<Object>} days 
 */
export function renderTodayView(days = []) {
  const container = document.getElementById('today-timeline-list') || document.getElementById('today-schedule-container');
  if (!container) return;

  const currentDayOfWeek = new Date().getDay();
  const todayData = days.find(d => d.dayOfWeekNumber === currentDayOfWeek);

  if (!todayData || todayData.isDayOff || !todayData.classes || todayData.classes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-umbrella-beach"></i></div>
        <div class="empty-state-title">Hôm nay không có lịch học!</div>
        <div class="empty-state-text">Bạn hãy dành thời gian nghỉ ngơi hoặc ôn bài trong Chiếc Cặp nhé.</div>
      </div>
    `;
    return;
  }

  let listHtml = todayData.classes.map(cls => {
    const color = getSubjectColor(cls.subject);
    const isActiveNow = isLessonActiveNow(cls.startTime, cls.endTime, currentDayOfWeek);
    return `
      <div class="class-item ${isActiveNow ? 'current-active-lesson' : ''}" style="--subject-border: ${color.border}; --subject-bg: ${color.bg}; --subject-text: ${color.text}">
        <div class="class-time">
          <span class="time-range"><i class="fa-regular fa-clock"></i> ${escapeHtml(cls.timeRange)}</span>
          ${cls.period ? `<span class="period-badge">${escapeHtml(cls.period)}</span>` : ''}
          ${isActiveNow ? '<span class="badge-live-pulse">ĐANG HỌC</span>' : ''}
        </div>
        <div class="class-subject">${escapeHtml(cls.subject)}</div>
        <div class="class-room"><i class="fa-solid fa-location-dot"></i> Phòng: ${escapeHtml(cls.room)}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="class-list">${listHtml}</div>`;
}
