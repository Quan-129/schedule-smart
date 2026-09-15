// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { generateQuizFromNodeKnowledge, getGeminiApiKey, setGeminiApiKey, validateGeminiApiKey, traceNodeAncestryPath } from '../../../2.Backend/services/GeminiAIService.js';
import { saveNeuralNodeQuiz, getSubjectKnowledgeNodes, recordNodeQuizPassed, getSubjectTargetQuizCount } from '../../../3.Database/state.js';

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
export async function openNeuralQuizModal(parentContainer, subjectCode, node, onSavedCallback, allNodesOverride = null) {
  closeNeuralQuizModal();

  const allNodes = Array.isArray(allNodesOverride) && allNodesOverride.length > 0
    ? allNodesOverride
    : (getSubjectKnowledgeNodes(subjectCode) || []);

  const ancestry = traceNodeAncestryPath(allNodes, node);

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
            <p class="neural-quiz-subtitle">Trắc nghiệm Active Recall • Truy vết phả hệ nơ-ron • Bóc tách bẫy tư duy</p>
          </div>
        </div>
        <button type="button" class="neural-quiz-close-btn" id="btn-close-neural-quiz" title="Đóng">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Thanh Breadcrumb Phả Hệ Tri Thức Nơ-ron -->
      <div class="neural-quiz-breadcrumb-bar">
        <div class="neural-quiz-breadcrumb-track">
          <span class="neural-quiz-breadcrumb-icon" title="Cây phả hệ tri thức"><i class="fa-solid fa-sitemap"></i></span>
          ${ancestry.breadcrumbList.map((item, idx) => {
            const isTarget = idx === ancestry.breadcrumbList.length - 1;
            return `
              <span class="neural-quiz-crumb ${isTarget ? 'target' : ''}" title="${escapeHtml(item)}">
                ${isTarget ? '<i class="fa-solid fa-bullseye"></i> ' : ''}${escapeHtml(item)}
              </span>
              ${!isTarget ? '<span class="neural-quiz-crumb-sep">❯</span>' : ''}
            `;
          }).join('')}
        </div>
        <div class="neural-quiz-breadcrumb-badge" title="Độ sâu tầng nơ-ron liên kết">
          <i class="fa-solid fa-layer-group"></i> Cấp ${ancestry.ancestryPath.length}
        </div>
      </div>

      <div class="neural-quiz-body" id="neural-quiz-body">
        <div class="neural-quiz-loading-state">
          <div class="neural-quiz-spinner"></div>
          <div class="neural-quiz-loading-text">AI đang truy vết phả hệ ${ancestry.ancestryPath.length} tầng và phân tích tri thức...</div>
          <div class="neural-quiz-loading-hint">Tự động tổng hợp ngữ cảnh từ Node Gốc đến Node Cha để thiết lập câu hỏi bám sát bản chất.</div>
        </div>
      </div>

      <div class="neural-quiz-footer" id="neural-quiz-footer" style="display: none;">
        <div class="neural-quiz-footer-left">
          <button type="button" class="btn-neural-quiz-action key" id="btn-quiz-config-key" title="Cài đặt Gemini API Key cá nhân">
            <i class="fa-solid fa-key"></i> <span id="quiz-key-status-label">${getGeminiApiKey() ? 'Đã có Key' : 'Nhập API Key'}</span>
          </button>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="btn-neural-quiz-action link" title="Mở trang lấy Google Gemini API Key miễn phí">
            <i class="fa-brands fa-google"></i> Lấy Key ↗
          </a>
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

      <!-- Custom Dialog Cài đặt Key bên trong Modal -->
      <div class="neural-quiz-key-dialog" id="neural-quiz-key-dialog" style="display: none;">
        <div class="neural-quiz-key-dialog-inner">
          <div class="neural-quiz-key-dialog-header">
            <h4><i class="fa-solid fa-key" style="color: #f59e0b;"></i> Cài Đặt Gemini API Key</h4>
            <button type="button" class="neural-quiz-key-dialog-close" id="btn-close-key-dialog" title="Đóng">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <p class="neural-quiz-key-dialog-desc">
            Nhập Google Gemini API Key để AI trích xuất và sinh câu hỏi trắc nghiệm chuyên sâu trực tiếp từ ghi chú của bạn.
          </p>
          <div class="neural-quiz-key-quick-link">
            <span>Chưa có key?</span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="neural-quiz-get-key-link">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở Google AI Studio lấy Key miễn phí ↗
            </a>
          </div>
          <div class="neural-quiz-key-input-group">
            <input type="password" id="input-gemini-api-key" class="neural-quiz-key-input" placeholder="Dán API Key tại đây (AIzaSy...)" autocomplete="off">
            <button type="button" class="btn-toggle-key-visibility" id="btn-toggle-key-visibility" title="Hiện/Ẩn Key">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>

          <!-- Thông báo phản hồi trạng thái kiểm tra Key -->
          <div class="neural-quiz-key-status-box" id="neural-quiz-key-status" style="display: none;"></div>

          <div class="neural-quiz-key-dialog-actions">
            <button type="button" class="btn-neural-key-save" id="btn-save-key-submit">
              <i class="fa-solid fa-check"></i> Lưu & Kích Hoạt
            </button>
            <button type="button" class="btn-neural-key-test" id="btn-test-key-submit" title="Kiểm tra kết nối tới Google trước khi lưu">
              <i class="fa-solid fa-vial-circle-check"></i> Kiểm Tra
            </button>
            <button type="button" class="btn-neural-key-clear" id="btn-clear-key-submit" title="Xóa Key để dùng câu hỏi mẫu mô phỏng">
              <i class="fa-solid fa-trash-can"></i> Xóa
            </button>
          </div>
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
        generateQuizFromNodeKnowledge(node, allNodes, attemptIndex),
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

    // Cảnh báo nếu API Key bị từ chối
    const apiWarningHtml = quiz.apiError ? `
      <div class="neural-quiz-api-alert">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div class="neural-quiz-api-alert-text">
          <div class="neural-quiz-api-alert-title">API Key không hợp lệ hoặc lỗi kết nối:</div>
          <div class="neural-quiz-api-alert-desc">${escapeHtml(quiz.apiError)}</div>
          <div class="neural-quiz-api-alert-sub">Hệ thống đã tự động chuyển sang chế độ <strong>Mô phỏng Demo</strong>. Bấm nút "Nhập API Key" bên dưới để kiểm tra lại Key của bạn.</div>
        </div>
      </div>
    ` : '';

    const ancestryTagHtml = (quiz.ancestryDepth && quiz.ancestryDepth > 1) ? `
      <span class="neural-quiz-ancestry-tag" title="Đã nạp ngữ cảnh xuyên suốt ${quiz.ancestryDepth} tầng nơ-ron: ${escapeHtml(quiz.ancestryBreadcrumb || '')}">
        <i class="fa-solid fa-code-branch"></i> Phả hệ ${quiz.ancestryDepth} tầng
      </span>
    ` : '';

    const engineBadgeHtml = quiz.isAiGenerated ? `
      <span class="neural-quiz-engine-badge live" title="Được sinh trực tiếp bởi Google Gemini 2.5 Flash">
        <i class="fa-solid fa-sparkles"></i> Gemini AI (Trực tiếp)
      </span>
    ` : `
      <span class="neural-quiz-engine-badge demo" title="Đang chạy bằng bộ tạo câu hỏi mô phỏng Fallback">
        <i class="fa-solid fa-microchip"></i> Mô Phỏng Demo
      </span>
    `;

    bodyEl.innerHTML = `
      ${apiWarningHtml}

      <div class="neural-quiz-question-box">
        <div class="neural-quiz-q-meta">
          <div class="neural-quiz-q-tag">
            <i class="fa-solid fa-circle-question"></i> Câu Hỏi Trắc Nghiệm Tình Huống
          </div>
          <div class="neural-quiz-meta-badges">
            ${ancestryTagHtml}
            ${engineBadgeHtml}
          </div>
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

    let progressInfo = null;
    if (isCorrect) {
      progressInfo = recordNodeQuizPassed(subjectCode, node.id);
      if (onSavedCallback) {
        onSavedCallback(node.id, quiz);
      }
    }

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

        ${progressInfo ? `
          <div class="neural-quiz-energy-box">
            <div class="neural-quiz-energy-header">
              <span class="energy-title"><i class="fa-solid fa-bolt" style="color: #f59e0b;"></i> Năng Lượng Nơ-ron: <strong>+1 nấc</strong></span>
              <span class="energy-score">Tiến độ: <strong>${progressInfo.count} / ${progressInfo.target} câu</strong> (${Math.round((progressInfo.count / progressInfo.target) * 100)}%)</span>
            </div>
            <div class="neural-quiz-energy-track">
              <div class="neural-quiz-energy-fill" style="width: ${Math.min(100, Math.round((progressInfo.count / progressInfo.target) * 100))}%;"></div>
            </div>
            ${progressInfo.isMastered ? `
              <div class="neural-quiz-mastery-alert">
                🏆 <strong>ĐẠT CHUẨN 100% MASTERY!</strong> Node này đã đổi sang màu Ngọc Lục Bảo và gắn huy hiệu Hoàn Thành trên Canvas!
              </div>
            ` : `
              <div class="neural-quiz-energy-tip">
                ⚡ Node trên Canvas vừa đổi thêm 1 nấc màu. Bấm <em>"Đổi câu khác"</em> để làm tiếp câu ${progressInfo.count + 1}/${progressInfo.target}!
              </div>
            `}
          </div>
        ` : ''}

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

  // Quản lý Dialog Cài đặt API Key
  const keyDialog = overlay.querySelector('#neural-quiz-key-dialog');
  const configKeyBtn = overlay.querySelector('#btn-quiz-config-key');
  const closeKeyDialogBtn = overlay.querySelector('#btn-close-key-dialog');
  const keyInput = overlay.querySelector('#input-gemini-api-key');
  const toggleVisibilityBtn = overlay.querySelector('#btn-toggle-key-visibility');
  const saveKeyBtn = overlay.querySelector('#btn-save-key-submit');
  const testKeyBtn = overlay.querySelector('#btn-test-key-submit');
  const clearKeyBtn = overlay.querySelector('#btn-clear-key-submit');
  const keyLabel = overlay.querySelector('#quiz-key-status-label');
  const statusBox = overlay.querySelector('#neural-quiz-key-status');

  const showKeyStatus = (type, message) => {
    if (!statusBox) return;
    statusBox.style.display = 'block';
    statusBox.className = `neural-quiz-key-status-box ${type}`;
    statusBox.innerHTML = message;
  };

  const hideKeyStatus = () => {
    if (statusBox) {
      statusBox.style.display = 'none';
      statusBox.innerHTML = '';
    }
  };

  const openKeyDialog = () => {
    keyInput.value = getGeminiApiKey() || '';
    hideKeyStatus();
    keyDialog.style.display = 'flex';
    requestAnimationFrame(() => keyInput.focus());
  };

  const closeKeyDialog = () => {
    hideKeyStatus();
    keyDialog.style.display = 'none';
  };

  configKeyBtn.addEventListener('click', openKeyDialog);
  closeKeyDialogBtn.addEventListener('click', closeKeyDialog);

  toggleVisibilityBtn.addEventListener('click', () => {
    const isPass = keyInput.type === 'password';
    keyInput.type = isPass ? 'text' : 'password';
    toggleVisibilityBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });

  keyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveKeyBtn.click();
    } else if (e.key === 'Escape') {
      closeKeyDialog();
    }
  });

  // Nút Kiểm tra Key
  if (testKeyBtn) {
    testKeyBtn.addEventListener('click', async () => {
      const val = keyInput.value.trim();
      if (!val) {
        showKeyStatus('warning', '<i class="fa-solid fa-triangle-exclamation"></i> Vui lòng dán API Key vào ô bên trên để kiểm tra.');
        return;
      }
      testKeyBtn.disabled = true;
      testKeyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang test...';
      showKeyStatus('info', '<i class="fa-solid fa-spinner fa-spin"></i> Đang kết nối tới Google AI Studio...');

      const result = await validateGeminiApiKey(val);
      testKeyBtn.disabled = false;
      testKeyBtn.innerHTML = '<i class="fa-solid fa-vial-circle-check"></i> Kiểm Tra';

      if (result.valid) {
        showKeyStatus('success', `<i class="fa-solid fa-circle-check"></i> <strong>Chính xác!</strong> ${escapeHtml(result.message)}`);
      } else {
        showKeyStatus('error', `<i class="fa-solid fa-circle-xmark"></i> <strong>Key không hoạt động:</strong> ${escapeHtml(result.message)}`);
      }
    });
  }

  // Nút Lưu & Kích hoạt Key
  saveKeyBtn.addEventListener('click', async () => {
    const val = keyInput.value.trim();

    // Nếu để trống -> xóa key và dùng Demo
    if (!val) {
      setGeminiApiKey('');
      if (keyLabel) keyLabel.textContent = 'Nhập API Key';
      closeKeyDialog();
      attemptIndex = 0;
      loadQuiz();
      return;
    }

    // Kiểm tra tính hợp lệ của Key với Google trước khi lưu
    saveKeyBtn.disabled = true;
    saveKeyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
    showKeyStatus('info', '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực với Google AI Studio...');

    const result = await validateGeminiApiKey(val);
    saveKeyBtn.disabled = false;
    saveKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Lưu & Kích Hoạt';

    if (!result.valid) {
      showKeyStatus('error', `<i class="fa-solid fa-circle-xmark"></i> <strong>Không thể kích hoạt:</strong> ${escapeHtml(result.message)}<br><small style="opacity: 0.85;">Vui lòng kiểm tra lại Key đã copy từ Google AI Studio, hoặc bấm "Xóa" để dùng chế độ Demo.</small>`);
      return;
    }

    // Key hợp lệ -> Lưu và kích hoạt
    setGeminiApiKey(val);
    if (keyLabel) keyLabel.textContent = 'Gemini AI: Đã kết nối';
    showKeyStatus('success', '<i class="fa-solid fa-circle-check"></i> <strong>Thành công!</strong> Đang nạp câu hỏi từ Gemini 1.5 Flash...');

    setTimeout(() => {
      closeKeyDialog();
      attemptIndex = 0;
      loadQuiz();
    }, 600);
  });

  clearKeyBtn.addEventListener('click', () => {
    keyInput.value = '';
    setGeminiApiKey('');
    if (keyLabel) keyLabel.textContent = 'Nhập API Key';
    closeKeyDialog();
    attemptIndex = 0;
    loadQuiz();
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
