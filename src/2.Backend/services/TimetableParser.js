/**
 * ==========================================================================
 * BACKEND SERVICE - TIMETABLE PARSER
 * Phân tích cú pháp file Markdown lịch học & trích xuất cấu trúc tiết học
 * ==========================================================================
 */

import { getDayNumber } from '../utils/dateHelpers.js';

/**
 * Phân tích file Markdown lịch học thành cấu trúc JSON chuẩn
 * @param {string} markdownText 
 * @returns {{ title: string, days: Array<Object>, notes: Array<string> }}
 */
export function parseScheduleMarkdown(markdownText) {
  if (!markdownText) return { title: 'Lịch học', days: [], notes: [] };

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

/**
 * Chuyển đổi cấu trúc scheduleData JSON ngược lại thành chuỗi Markdown chuẩn
 * @param {Object} scheduleData - { title, days, notes }
 * @returns {string} Markdown string
 */
export function serializeScheduleToMarkdown(scheduleData) {
  if (!scheduleData) return '';
  const title = scheduleData.title || 'Lịch học';
  const lines = [`# ${title}`, ''];

  const standardDayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7 & Chủ Nhật'];
  const daysMap = new Map();
  (scheduleData.days || []).forEach(d => {
    daysMap.set(d.name, d);
  });

  standardDayNames.forEach(dayName => {
    lines.push(`## ${dayName}`);
    const day = daysMap.get(dayName);

    if (!day || day.isDayOff || !day.classes || day.classes.length === 0) {
      lines.push('- Nghỉ.');
    } else {
      day.classes.forEach(c => {
        const periodText = c.period ? ` (${c.period})` : '';
        const roomText = c.room ? ` | Phòng: ${c.room}` : '';
        lines.push(`- ${c.timeRange}${periodText}: ${c.subject}${roomText}`);
      });
    }
    lines.push('');
  });

  const notes = scheduleData.notes || [];
  if (notes.length > 0) {
    lines.push('## Lưu ý nhỏ:');
    notes.forEach(n => {
      lines.push(`- ${n}`);
    });
  }

  return lines.join('\n');
}

/**
 * Sinh chuỗi Markdown cho một tuần học mới với 7 khung ngày trống
 * @param {string} weekTitle - Tên tuần (VD: 'Tuần 37' hoặc 'Lịch học Tuần 37')
 * @returns {string} Markdown string
 */
export function generateEmptyWeekMarkdown(weekTitle = 'Tuần mới') {
  const cleanTitle = weekTitle.startsWith('Lịch học') ? weekTitle : `Lịch học ${weekTitle}`;
  return `# ${cleanTitle}

## Thứ 2
- Nghỉ.

## Thứ 3
- Nghỉ.

## Thứ 4
- Nghỉ.

## Thứ 5
- Nghỉ.

## Thứ 6
- Nghỉ.

## Thứ 7 & Chủ Nhật
- Nghỉ.

## Lưu ý nhỏ:
- Bấm "+ Thêm tiết" hoặc nhấn giữ ô ngày để thêm lịch học nhanh.`;
}

