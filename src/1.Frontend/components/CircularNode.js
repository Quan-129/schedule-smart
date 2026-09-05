/**
 * ==========================================================================
 * FRONTEND COMPONENT - CIRCULAR BACKPACK NODE
 * Vẽ Node môn học hình tròn kèm SVG Donut Ring % điểm đa sắc (Apple Style)
 * ==========================================================================
 */

import { escapeHtml } from '../../4.Security/sanitizer.js';
import { calculateGradeTotalWeight } from '../../2.Backend/services/GradeSolverService.js';

/**
 * Render HTML cho một Node môn học hình tròn kèm viền Donut Ring
 * @param {Object} subject - Đối tượng môn học
 * @param {boolean} isJiggleMode - Trạng thái rung lắc
 * @returns {string} HTML string
 */
export function renderCircularNodeHtml(subject, isJiggleMode = false) {
  const icon = subject.icon || 'fa-solid fa-book-bookmark';
  const color = subject.color || '#6366f1';
  const hasDrive = !!(subject.driveUrl && subject.driveUrl.trim());
  const gradeItems = Array.isArray(subject.gradeItems) ? subject.gradeItems : [];

  // 1. Tính toán SVG Donut Ring
  const radius = 46;
  const circumference = 2 * Math.PI * radius; // ~289.026
  let cumulativeOffset = 0;
  let ringSlicesHtml = '';
  const totalW = calculateGradeTotalWeight(gradeItems);

  if (gradeItems.length > 0 && totalW > 0) {
    gradeItems.forEach((item) => {
      const w = parseFloat(item.weight) || 0;
      if (w <= 0) return;

      const sliceLength = (w / totalW) * circumference;
      const sliceOffset = -cumulativeOffset;
      cumulativeOffset += sliceLength;

      const sliceColor = item.color || color;
      const itemNameEsc = escapeHtml(item.name);
      ringSlicesHtml += `
        <circle 
          class="bp-ring-slice" 
          cx="55" cy="55" r="${radius}" 
          fill="none" 
          stroke="${sliceColor}" 
          stroke-width="6.5" 
          stroke-dasharray="${sliceLength.toFixed(2)} ${(circumference - sliceLength).toFixed(2)}" 
          stroke-dashoffset="${sliceOffset.toFixed(2)}"
        >
          <title>${itemNameEsc}: ${w}%</title>
        </circle>
      `;
    });
  } else {
    // Vòng mặc định đơn sắc nếu chưa có grade breakdown
    ringSlicesHtml = `
      <circle 
        class="bp-ring-slice" 
        cx="55" cy="55" r="${radius}" 
        fill="none" 
        stroke="${color}" 
        stroke-width="6.5" 
        stroke-dasharray="${circumference.toFixed(2)} 0" 
        stroke-dashoffset="0"
      />
    `;
  }

  // Mini Grade Tags
  const gradePillsHtml = gradeItems.length > 0 ? `
    <div class="bp-grade-pill-row">
      ${gradeItems.slice(0, 3).map(g => {
        const shortName = g.name.split('(')[0].trim().replace('Kiểm tra ', '').replace('Thi ', '');
        return `<span class="bp-grade-mini-tag" style="--tag-color: ${g.color || '#6366f1'};">${escapeHtml(shortName)} ${g.weight}%</span>`;
      }).join('')}
    </div>
  ` : '';

  // Nút xóa đỏ (-) và Nút cây bút vàng (✏️) chỉ render khi isJiggleMode = true
  const deleteBadgeHtml = isJiggleMode ? `
    <button class="btn-delete-node-badge" title="Xóa môn ${escapeHtml(subject.name)}" data-action="delete" data-code="${escapeHtml(subject.code)}">
      <i class="fa-solid fa-minus"></i>
    </button>
  ` : '';

  const editBadgeHtml = isJiggleMode ? `
    <button class="btn-edit-node-pencil" title="Chỉnh sửa link Google Drive & Tỉ lệ điểm môn ${escapeHtml(subject.name)}" data-action="edit" data-code="${escapeHtml(subject.code)}">
      <i class="fa-solid fa-pen"></i>
    </button>
  ` : '';

  return `
    <div class="bp-circle-wrapper">
      <svg class="bp-circle-ring-svg" viewBox="0 0 110 110">
        <circle class="bp-ring-track" cx="55" cy="55" r="${radius}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6.5" />
        ${ringSlicesHtml}
      </svg>

      <div class="bp-circle-core">
        <span class="bp-app-code">${escapeHtml(subject.code)}</span>
        <div class="bp-app-icon-wrapper">
          <i class="${icon}"></i>
        </div>
        <span class="bp-circle-total-val">${totalW > 0 ? totalW + '%' : '100%'}</span>
      </div>

      ${deleteBadgeHtml}
      ${editBadgeHtml}
    </div>

    <div class="bp-app-details">
      <span class="bp-app-title" title="${escapeHtml(subject.name)}">${escapeHtml(subject.name)}</span>
      <span class="bp-app-drive-status ${hasDrive ? '' : 'not-set'}">
        ${hasDrive ? '<i class="fa-brands fa-google-drive"></i> Drive ↗' : '<i class="fa-solid fa-link-slash"></i> Chưa gắn'}
      </span>
      ${gradePillsHtml}
    </div>
  `;
}
