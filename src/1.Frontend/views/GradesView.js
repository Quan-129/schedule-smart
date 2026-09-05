/**
 * ==========================================================================
 * FRONTEND VIEW - GRADES VIEW (ĐỀ CƯƠNG HỌC PHẦN, BIỂU ĐỒ DONUT & TỈ LỆ ĐIỂM)
 * Khôi phục 100% giao diện Glassmorphism & Donut Pie Chart chuẩn style.css
 * ==========================================================================
 */

import { state } from '../../3.Database/state.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';
import { openEditSubjectModal } from '../components/EditModal.js';
import { showToast } from '../components/Toast.js';

/**
 * Tạo SVG Donut Chart cho từng môn học
 */
function generateDonutChartSvg(items = [], schemeCode = '') {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  if (!items || items.length === 0 || totalWeight === 0) {
    return `
      <div class="donut-chart-wrapper" id="donut-wrapper-${schemeCode}">
        <svg class="donut-svg" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="20" opacity="0.3" />
        </svg>
        <div class="donut-center-info" id="donut-center-${schemeCode}">
          <span class="donut-center-val" style="font-size: 0.9rem;">0%</span>
          <span class="donut-center-label">Chưa có %</span>
        </div>
      </div>
    `;
  }

  let cumulative = 0;
  const slices = items.map((item, idx) => {
    const weightNum = Number(item.weight) || 0;
    const strokeDash = (weightNum / totalWeight) * circumference;
    const strokeOffset = -(cumulative / totalWeight) * circumference;
    cumulative += weightNum;

    return `
      <circle class="donut-slice" 
        cx="70" cy="70" r="${radius}" 
        stroke="${item.color || '#6366f1'}" 
        stroke-dasharray="${strokeDash} ${circumference}" 
        stroke-dashoffset="${strokeOffset}"
        data-scheme="${schemeCode}"
        data-weight="${weightNum}%"
        data-name="${escapeHtml(item.name || '')}"
        title="${escapeHtml(item.name || '')}: ${weightNum}%"
      />
    `;
  }).join('');

  return `
    <div class="donut-chart-wrapper" id="donut-wrapper-${schemeCode}">
      <svg class="donut-svg" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="20" opacity="0.3" />
        ${slices}
      </svg>
      <div class="donut-center-info" id="donut-center-${schemeCode}">
        <span class="donut-center-val">${totalWeight}%</span>
        <span class="donut-center-label">Tổng điểm</span>
      </div>
    </div>
  `;
}

/**
 * Highlight lát cắt điểm số khi click
 */
export function highlightGradeSlice(schemeCode, itemIdx, itemName, itemWeight) {
  const centerElem = document.getElementById(`donut-center-${schemeCode}`);
  if (centerElem) {
    centerElem.innerHTML = `
      <span class="donut-center-val" style="font-size: 0.95rem; color: var(--accent-primary);">${itemWeight}</span>
      <span class="donut-center-label" style="font-size: 0.58rem; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemName}</span>
    `;
  }
  showToast(`${itemName}: ${itemWeight}`);
}

/**
 * Render toàn bộ danh sách thẻ môn học & tỉ lệ điểm chuẩn style.css
 * @param {string} filterQuery 
 */
export function renderGradesView(filterQuery = '') {
  const gradesGrid = document.getElementById('grades-grid');
  if (!gradesGrid) return;

  gradesGrid.innerHTML = '';

  const q = filterQuery.toLowerCase().trim();
  const filteredSchemes = (state.driveSubjects || []).filter(s => 
    !q || 
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.englishName && s.englishName.toLowerCase().includes(q)) ||
    (s.code && s.code.toLowerCase().includes(q)) ||
    (s.department && s.department.toLowerCase().includes(q)) ||
    (s.lecturers && s.lecturers.toLowerCase().includes(q))
  );

  if (filteredSchemes.length === 0) {
    gradesGrid.innerHTML = `
      <div class="day-off-card" style="grid-column: 1 / -1; padding: 3rem 1rem;">
        <div class="day-off-icon" style="font-size: 3rem;"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>Không tìm thấy môn học</h3>
        <p>Thử tìm kiếm với từ khóa khác hoặc thêm môn mới trong Chiếc Cặp.</p>
      </div>
    `;
    return;
  }

  filteredSchemes.forEach(scheme => {
    const card = document.createElement('div');
    card.className = 'grade-card';
    card.id = `grade-card-${scheme.code.toLowerCase()}`;

    const gradeItems = scheme.gradeItems || [];
    const chartSvg = generateDonutChartSvg(gradeItems, scheme.code.toLowerCase());

    const breakdownHtml = gradeItems.length > 0 ? gradeItems.map((item, idx) => `
      <div class="breakdown-item" style="border-left-color: ${item.color || '#6366f1'}; cursor: pointer;" data-scheme="${scheme.code.toLowerCase()}" data-idx="${idx}" data-name="${escapeHtml(item.name)}" data-weight="${item.weight}%">
        <div class="breakdown-row">
          <span class="breakdown-name">
            <span class="breakdown-color-dot" style="background-color: ${item.color || '#6366f1'};"></span>
            ${escapeHtml(item.name)}
          </span>
          <span class="breakdown-weight" style="color: ${item.color || '#6366f1'};">${item.weight}%</span>
        </div>
        <div class="breakdown-detail">
          <span class="breakdown-type"><i class="fa-regular fa-file-lines"></i> ${escapeHtml(item.type || 'Đánh giá')}</span>
          ${item.duration && item.duration !== '--' ? `<span><i class="fa-regular fa-clock"></i> ${escapeHtml(item.duration)}</span>` : ''}
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-bar-fill" style="width: ${item.weight}%; background-color: ${item.color || '#6366f1'};"></div>
        </div>
      </div>
    `).join('') : `
      <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        Chưa có tỉ lệ điểm. Bấm "Sửa Tỉ Lệ" để thiết lập.
      </div>
    `;

    card.innerHTML = `
      <div class="grade-card-header">
        <div class="grade-title-group">
          <h3 class="grade-subject-title">
            <i class="${scheme.icon || 'fa-solid fa-book-bookmark'}" style="color: var(--accent-primary); font-size: 0.95rem;"></i>
            ${escapeHtml(scheme.name)}
          </h3>
          ${scheme.englishName ? `<span class="grade-subject-en">${escapeHtml(scheme.englishName)}</span>` : ''}
          ${scheme.department ? `<span class="grade-department"><i class="fa-solid fa-building-columns"></i> ${escapeHtml(scheme.department)}</span>` : ''}
        </div>
        <div class="grade-badges">
          <span class="badge-code">${escapeHtml(scheme.code)}</span>
          ${scheme.credits ? `<span class="badge-credits">${scheme.credits} Tín chỉ</span>` : ''}
          <button class="btn-edit-grade-scheme" title="Chỉnh sửa thông số & tỉ lệ điểm môn ${escapeHtml(scheme.name)}" data-code="${escapeHtml(scheme.code)}">
            <i class="fa-solid fa-pen-to-square"></i> Sửa Tỉ Lệ
          </button>
        </div>
      </div>

      <div class="grade-card-body">
        ${chartSvg}
        <div class="grade-breakdown-list">
          ${breakdownHtml}
        </div>
      </div>

      ${scheme.notes ? `
        <div class="grade-card-footer">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>${escapeHtml(scheme.notes)}</span>
        </div>
      ` : ''}
    `;

    // Gắn sự kiện sửa tỉ lệ
    const editBtn = card.querySelector('.btn-edit-grade-scheme');
    if (editBtn) {
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditSubjectModal(scheme.code, () => renderGradesView(filterQuery));
      };
    }

    // Gắn sự kiện click vào breakdown item
    card.querySelectorAll('.breakdown-item').forEach(el => {
      el.onclick = () => {
        highlightGradeSlice(el.dataset.scheme, el.dataset.idx, el.dataset.name, el.dataset.weight);
      };
    });

    gradesGrid.appendChild(card);
  });
}
