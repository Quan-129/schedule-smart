/**
 * ==========================================================================
 * FRONTEND VIEW - GRADES VIEW & TARGET CALCULATOR
 * ==========================================================================
 */

import { state, persistGrades } from '../../3.Database/state.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';
import { calculateGradeTotalWeight, solveRequiredFinalExamScore } from '../../2.Backend/services/GradeSolverService.js';
import { openEditSubjectModal } from '../components/EditModal.js';
import { showToast } from '../components/Toast.js';

/**
 * Render toàn bộ giao diện Bảng Điểm & Bộ Tính Điểm Mục Tiêu
 */
export function renderGradesView() {
  const container = document.getElementById('grades-grid') || document.getElementById('grades-container');
  if (!container) return;

  container.innerHTML = '';

  state.driveSubjects.forEach((subject) => {
    const card = document.createElement('div');
    card.className = 'grade-subject-card';
    card.style.setProperty('--card-color', subject.color || '#6366f1');

    const gradeItems = Array.isArray(subject.gradeItems) ? subject.gradeItems : [];
    const totalW = calculateGradeTotalWeight(gradeItems);
    const scores = state.studentGrades[subject.code] || {};
    const selectedTarget = scores.targetLetter || 'A';

    // Tính điểm thi cuối kỳ cần đạt
    const solveResult = solveRequiredFinalExamScore(gradeItems, scores, selectedTarget);

    let rowsHtml = '';
    gradeItems.forEach(item => {
      const currentVal = scores[item.id] !== undefined ? scores[item.id] : '';
      rowsHtml += `
        <div class="grade-item-row">
          <div class="grade-item-info">
            <span class="grade-item-name" style="color: ${item.color || '#6366f1'}">${escapeHtml(item.name)}</span>
            <span class="grade-item-pct">${item.weight}%</span>
          </div>
          <div class="grade-item-input-wrap">
            <input 
              type="number" 
              class="form-input grade-input-score" 
              data-subject="${escapeHtml(subject.code)}" 
              data-item-id="${escapeHtml(item.id)}" 
              placeholder="0.0" 
              min="0" max="10" step="0.1" 
              value="${currentVal}" 
            />
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="grade-card-header">
        <div>
          <h3 class="grade-card-title">${escapeHtml(subject.name)} (${escapeHtml(subject.code)})</h3>
          <span class="grade-card-credits">${subject.credits || 3} Tín chỉ • Tổng tỉ lệ: ${totalW}%</span>
        </div>
        <button class="btn btn-secondary btn-sm btn-edit-scheme" data-code="${escapeHtml(subject.code)}">
          <i class="fa-solid fa-pen-ruler"></i> Sửa tỉ lệ
        </button>
      </div>

      <div class="grade-items-list">
        ${rowsHtml}
      </div>

      <div class="grade-target-solver-box">
        <div class="target-select-row">
          <span>Mục tiêu điểm chữ:</span>
          <select class="form-select target-grade-select" data-subject="${escapeHtml(subject.code)}">
            <option value="A" ${selectedTarget === 'A' ? 'selected' : ''}>Điểm A (>= 8.5)</option>
            <option value="B+" ${selectedTarget === 'B+' ? 'selected' : ''}>Điểm B+ (>= 8.0)</option>
            <option value="B" ${selectedTarget === 'B' ? 'selected' : ''}>Điểm B (>= 7.0)</option>
            <option value="C+" ${selectedTarget === 'C+' ? 'selected' : ''}>Điểm C+ (>= 6.5)</option>
            <option value="C" ${selectedTarget === 'C' ? 'selected' : ''}>Điểm C (>= 5.5)</option>
            <option value="D" ${selectedTarget === 'D' ? 'selected' : ''}>Điểm D - Qua môn (>= 4.0)</option>
          </select>
        </div>
        <div class="solver-result-msg ${solveResult.status}">
          ${solveResult.message}
        </div>
      </div>
    `;

    // Sự kiện sửa tỉ lệ
    const editBtn = card.querySelector('.btn-edit-scheme');
    if (editBtn) {
      editBtn.onclick = () => {
        openEditSubjectModal(subject.code, () => renderGradesView());
      };
    }

    // Sự kiện nhập điểm
    const inputs = card.querySelectorAll('.grade-input-score');
    inputs.forEach(input => {
      input.oninput = (e) => {
        const code = e.target.dataset.subject;
        const itemId = e.target.dataset.itemId;
        if (!state.studentGrades[code]) state.studentGrades[code] = {};
        state.studentGrades[code][itemId] = e.target.value;
        persistGrades();
        
        // Cập nhật lại thông báo mục tiêu trong card
        const updatedSolve = solveRequiredFinalExamScore(gradeItems, state.studentGrades[code], state.studentGrades[code].targetLetter || 'A');
        const msgEl = card.querySelector('.solver-result-msg');
        if (msgEl) {
          msgEl.className = `solver-result-msg ${updatedSolve.status}`;
          msgEl.textContent = updatedSolve.message;
        }
      };
    });

    // Sự kiện chọn mục tiêu A/B/C
    const targetSelect = card.querySelector('.target-grade-select');
    if (targetSelect) {
      targetSelect.onchange = (e) => {
        const code = e.target.dataset.subject;
        if (!state.studentGrades[code]) state.studentGrades[code] = {};
        state.studentGrades[code].targetLetter = e.target.value;
        persistGrades();
        renderGradesView();
      };
    }

    container.appendChild(card);
  });
}
