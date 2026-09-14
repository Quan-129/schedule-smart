// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { generateQuizFromNodeKnowledge, getGeminiApiKey, setGeminiApiKey } from '../../../2.Backend/services/GeminiAIService.js';
import { saveNeuralNodeQuiz } from '../../../3.Database/state.js';

// ==========================================================================
// 2. STATE & CONTROLLER
// ==========================================================================
let currentQuizModalEl = null;

/**
 * Mở Popup Modal Trắc Nghiệm AI cho node nơ-ron
 * @param {HTMLElement} parentContainer - Container cha (thường là .neural-modal-overlay)
 * @param {string} subjectCode - Mã môn học
 * @param {Object} node - Node nơ-ron đang kiểm tra kiến thức
 * @param {Function} onSavedCallback - Callback khi câu hỏi được lưu
 */
export async function openNeuralQuizModal(parentContainer, subjectCode, node, onSavedCallback) {
  closeNeuralQuizModal();

  const overlay = document.createElement('div');
  overlay.className = 'neural-quiz-overlay';
  overlay.id = 'neural-quiz-modal-overlay';

  overlay.innerHTML = `
    <div class="neural-quiz-card">
      <div class="neural-quiz-header">
        <div class="neural-quiz-title-group">
          <div class="neural-quiz-icon-badge">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h3 class="neural-quiz-title">
              <span>Khảo Hạch AI: ${escapeHtml(node.label || 'Khái Niệm')}</span>
            </h3>
            <p class="neural-quiz-subtitle">Trắc nghiệm Active Recall • Chẩn đoán bẫy tư duy • Đúc kết quy tắc</p>
          </div>
        </div>
        <button type="button" class="neural-quiz-close-btn" id="btn-close-neural-quiz" title="Đóng">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="neural-quiz-body" id="neural-quiz-body">
        <div class="neural-quiz-loading-state">
          <div class="neural-quiz-spinner"></div>
          <div class="neural-quiz-loading-text">AI đang phân tích tri thức ghi chú...</div>
          <div class="neural-quiz-loading-hint">Hệ thống đang bóc tách bản chất, tạo lập các phương án nhiễu và thiết lập cảnh báo bẫy tư duy.</div>
        </div>
      </div>

      <div class="neural-quiz-footer" id="neural-quiz-footer" style="display: none;">
        <div class="neural-quiz-footer-left">
          <button type="button" class="btn-neural-quiz-action key" id="btn-quiz-config-key" title="Cài đặt Gemini API Key cá nhân">
            <i class="fa-solid fa-key"></i> <span id="quiz-key-status-label">${getGeminiApiKey() ? 'Đã có Key' : 'Nhập API Key'}</span>
          </button>
        </div>
        <div class="neural-quiz-footer-right">
          <button type="button" class="btn-neural-quiz-action save" id="btn-quiz-save" disabled>
            <i class="fa-solid fa-bookmark"></i> Lưu câu này
          </button>
          <button type="button" class="btn-neural-quiz-action next" id="btn-quiz-next">
            <i class="fa-solid fa-dice"></i> Đổi câu khác
          </button>
        </div>
      </div>
    </div>
  `;

  parentContainer.appendChild(overlay);
  currentQuizModalEl = overlay;

  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Sự kiện đóng
  overlay.querySelector('#btn-close-neural-quiz').addEventListener('click', closeNeuralQuizModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeNeuralQuizModal();
  });

  // Lấy nội dung ghi chú tổng hợp của node
  const getCombinedNotes = () => {
    let text = node.notes || '';
    if (node.visualNotes?.html) {
      const visualText = node.visualNotes.html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
      if (visualText) text += '\n' + visualText;
    }
    return text.trim();
  };

  let currentQuiz = null;
  let isSaved = false;
  let attemptIndex = 0;

  const loadQuiz = async () => {
    const bodyEl = overlay.querySelector('#neural-quiz-body');
    const footerEl = overlay.querySelector('#neural-quiz-footer');
    const saveBtn = overlay.querySelector('#btn-quiz-save');
    const nextBtn = overlay.querySelector('#btn-quiz-next');

    bodyEl.innerHTML = `
      <div class="neural-quiz-loading-state">
        <div class="neural-quiz-spinner"></div>
        <div class="neural-quiz-loading-text">AI đang phân tích tri thức ghi chú (Góc độ #${attemptIndex + 1})...</div>
        <div class="neural-quiz-loading-hint">Đang bóc tách bản chất, tạo lập các phương án nhiễu mới và thiết lập cảnh báo bẫy tư duy.</div>
      </div>
    `;
    footerEl.style.display = 'none';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.classList.remove('saved');
      saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Lưu câu này';
    }
    isSaved = false;

    try {
      // Đảm bảo có hiệu ứng loading tối thiểu 450ms để người dùng thấy rõ AI đang suy nghĩ đổi câu
      const [quiz] = await Promise.all([
        generateQuizFromNodeKnowledge(node.label, getCombinedNotes(), attemptIndex),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);
      currentQuiz = quiz;
      renderQuizContent(currentQuiz);
      footerEl.style.display = 'flex';
    } catch (err) {
      bodyEl.innerHTML = `
        <div class="neural-quiz-loading-state">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: #ef4444;"></i>
          <div class="neural-quiz-loading-text" style="color: #f87171;">Không thể tạo câu hỏi trắc nghiệm</div>
          <div class="neural-quiz-loading-hint">${escapeHtml(err.message || 'Vui lòng kiểm tra lại kết nối hoặc API Key.')}</div>
        </div>
      `;
      footerEl.style.display = 'flex';
    }
  };

  const renderQuizContent = (quiz) => {
    const bodyEl = overlay.querySelector('#neural-quiz-body');
    const saveBtn = overlay.querySelector('#btn-quiz-save');

    const optionsHtml = (quiz.options || []).map((opt, idx) => {
      const prefix = ['A', 'B', 'C', 'D'][idx] || String.fromCharCode(65 + idx);
      // Xóa tiền tố A. B. C. D. nếu AI đã gắn sẵn
      const cleanOpt = opt.replace(/^[A-D]\.\s*/i, '');
      return `
        <button type="button" class="neural-quiz-option-btn" data-index="${idx}">
          <span class="neural-quiz-option-prefix">${prefix}.</span>
          <span>${escapeHtml(cleanOpt)}</span>
        </button>
      `;
    }).join('');

    bodyEl.innerHTML = `
      <div class="neural-quiz-question-box">
        <div class="neural-quiz-q-tag">
          <i class="fa-solid fa-circle-question"></i> Câu Hỏi Trắc Nghiệm Tình Huống
        </div>
        <p class="neural-quiz-q-text">${escapeHtml(quiz.question)}</p>
      </div>

      <div class="neural-quiz-options-list" id="neural-quiz-options-container">
        ${optionsHtml}
      </div>

      <div class="neural-quiz-analysis-box" id="neural-quiz-analysis-container" style="display: none;">
        <!-- Sẽ được fill khi chọn đáp án -->
      </div>
    `;

    // Gắn sự kiện chọn đáp án
    const optionBtns = bodyEl.querySelectorAll('.neural-quiz-option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.dataset.index, 10);
        handleSelectAnswer(selectedIdx, quiz, optionBtns);
        if (saveBtn) saveBtn.disabled = false;
      });
    });
  };

  const handleSelectAnswer = (selectedIdx, quiz, optionBtns) => {
    const isCorrect = (selectedIdx === quiz.correctIndex);
    const analysisBox = overlay.querySelector('#neural-quiz-analysis-container');

    optionBtns.forEach((b, idx) => {
      b.disabled = true;
      if (idx === quiz.correctIndex) {
        b.classList.add('correct');
      } else if (idx === selectedIdx && !isCorrect) {
        b.classList.add('wrong');
      }
    });

    if (analysisBox) {
      analysisBox.style.display = 'flex';
      analysisBox.innerHTML = `
        <div class="neural-quiz-analysis-header">
          <span class="neural-quiz-result-badge ${isCorrect ? 'correct' : 'wrong'}">
            ${isCorrect ? '<i class="fa-solid fa-circle-check"></i> Chính xác tuyệt đối!' : '<i class="fa-solid fa-circle-xmark"></i> Chưa chính xác - Hãy xem bẫy bên dưới!'}
          </span>
          <span style="font-size: 0.78rem; color: #94a3b8;">
            Đáp án đúng: <strong>${['A', 'B', 'C', 'D'][quiz.correctIndex]}</strong>
          </span>
        </div>

        <div class="neural-quiz-item-concept">
          <i class="fa-solid fa-atom"></i>
          <span><strong>Khái niệm cốt lõi:</strong> ${escapeHtml(quiz.coreConcept || node.label)}</span>
        </div>

        <div class="neural-quiz-item-expl">
          <strong>💡 Giải thích logic:</strong> ${escapeHtml(quiz.explanation || '')}
        </div>

        <div class="neural-quiz-item-trap">
          <strong>⚠️ Bẫy & Sai lầm thường gặp:</strong> ${escapeHtml(quiz.trap || 'Cẩn thận với các phương án khái quát hóa quá mức hoặc đảo lộn thứ tự tiến trình.')}
        </div>

        <div class="neural-quiz-item-rule">
          <strong>💎 Bản chất / Quy tắc cần nhớ:</strong> ${escapeHtml(quiz.rule || 'Nắm vững chuỗi liên kết nhân quả từ lý thuyết đến thực hành.')}
        </div>

        ${quiz.source ? `
          <div class="neural-quiz-item-source">
            <i class="fa-solid fa-quote-left"></i>
            <span>${escapeHtml(quiz.source)}</span>
          </div>
        ` : ''}
      `;
    }
  };

  // Nút Lưu câu hỏi
  const saveBtn = overlay.querySelector('#btn-quiz-save');
  saveBtn.addEventListener('click', () => {
    if (!currentQuiz || isSaved) return;
    saveNeuralNodeQuiz(subjectCode, node.id, currentQuiz);
    isSaved = true;
    saveBtn.classList.add('saved');
    saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã lưu vào Kho!';
    if (onSavedCallback) onSavedCallback(node.id, currentQuiz);
  });

  // Nút Đổi câu khác
  const nextBtn = overlay.querySelector('#btn-quiz-next');
  nextBtn.addEventListener('click', () => {
    attemptIndex++;
    loadQuiz();
  });

  // Nút Cài đặt API Key
  const configKeyBtn = overlay.querySelector('#btn-quiz-config-key');
  configKeyBtn.addEventListener('click', () => {
    const currentKey = getGeminiApiKey();
    const inputKey = prompt(
      'Nhập Google Gemini API Key để sinh câu hỏi chuyên sâu không giới hạn:\n(Lấy miễn phí 1-click tại: https://aistudio.google.com/app/apikey)\n\nĐể trống nếu muốn dùng bộ tạo mô phỏng Fallback:',
      currentKey
    );

    if (inputKey !== null) {
      setGeminiApiKey(inputKey.trim());
      const label = overlay.querySelector('#quiz-key-status-label');
      if (label) label.textContent = inputKey.trim() ? 'Đã có Key' : 'Nhập API Key';
      alert(inputKey.trim() ? 'Đã lưu Google Gemini API Key thành công!' : 'Đã chuyển về chế độ Demo Fallback.');
      loadQuiz();
    }
  });

  // Tải câu hỏi đầu tiên
  loadQuiz();
}

/**
 * Đóng Popup Modal Trắc Nghiệm
 */
export function closeNeuralQuizModal() {
  if (currentQuizModalEl) {
    currentQuizModalEl.classList.remove('active');
    setTimeout(() => {
      if (currentQuizModalEl && currentQuizModalEl.parentNode) {
        currentQuizModalEl.parentNode.removeChild(currentQuizModalEl);
      }
      currentQuizModalEl = null;
    }, 280);
  }
}
