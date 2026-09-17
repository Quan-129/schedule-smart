// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { state, getSubjectKnowledgeNodes, addNeuralNode, getSubjectTargetQuizCount, setSubjectTargetQuizCount } from '../../../3.Database/state.js';
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { NeuralCanvasEngine } from '../../views/neural/NeuralCanvasEngine.js';
import { openEditNeuralNodeModal } from './EditNeuralNodeModal.js';
import { openNeuralNotepadSidebar, closeNeuralNotepadSidebar } from './NeuralNotepadSidebar.js';
import { openNeuralQuizModal } from './NeuralQuizModal.js';

// ==========================================================================
// 2. TEMPLATES
// ==========================================================================
function renderNeuralModalShell(subject) {
  const targetQuizCount = getSubjectTargetQuizCount(subject.code);

  return `
    <div class="neural-header">
      <div class="neural-title-group">
        <div class="neural-icon-badge">
          <i class="fa-solid fa-brain"></i>
        </div>
        <div>
          <h2 class="neural-title">
            <span>${escapeHtml(subject.name || subject.code)}</span>
            <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8;">
              ${escapeHtml(subject.code)}
            </span>
          </h2>
          <p class="neural-subtitle">Cây kiến thức nơ-ron liên kết vô tận • Chạm để mở link • Kéo rê kết nối</p>
        </div>
      </div>

      <button class="neural-close-btn" id="btn-close-neural-cosmos" title="Đóng cây kiến thức">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Canvas Container -->
    <div class="neural-canvas-container" id="neural-canvas-wrapper">
      <canvas class="neural-canvas" id="neural-canvas-element"></canvas>
    </div>

    <!-- Status Legend in Top Right -->
    <div class="neural-legend-badge">
      <div class="neural-legend-item">
        <span class="neural-legend-dot completed"></span>
        <span>Đã hiểu / Xong</span>
      </div>
      <div class="neural-legend-item">
        <span class="neural-legend-dot learning"></span>
        <span>Đang học / Đọc</span>
      </div>
      <div class="neural-legend-item">
        <span class="neural-legend-dot todo"></span>
        <span>Cần học</span>
      </div>
      <div class="neural-legend-item" style="margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
        <span style="color:#38bdf8; font-weight: bold;">↗</span>
        <span>Node có đính kèm Link</span>
      </div>
    </div>

    <!-- Floating HUD Toolbar -->
    <div class="neural-toolbar">
      <button type="button" class="neural-tool-btn primary" id="btn-neural-add-node" title="Thêm Nhánh Con">
        <i class="fa-solid fa-plus"></i>
        <span class="btn-text-full">Thêm Nhánh Con</span>
        <span class="btn-text-short">Thêm</span>
      </button>

      <div class="neural-toolbar-separator"></div>

      <button type="button" class="neural-tool-btn" id="btn-neural-center" title="Căn giữa vào Node Gốc">
        <i class="fa-solid fa-crosshairs"></i>
        <span class="btn-text-full">Căn Giữa</span>
      </button>

      <button type="button" class="neural-tool-btn" id="btn-neural-auto-layout" title="Tối ưu bố cục cây tri thức gọn gàng, chống bè ngang">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        <span class="btn-text-full">Sắp Xếp Gọn</span>
      </button>

      <button type="button" class="neural-tool-btn target-setup-btn" id="btn-neural-target-setup" title="Thiết lập số câu hỏi thử thách mục tiêu cho mỗi node">
        <i class="fa-solid fa-bullseye"></i>
        <span class="btn-text-full">Mục Tiêu: </span>
        <strong id="lbl-target-quiz-count">${targetQuizCount} câu</strong>
      </button>

      <button type="button" class="neural-tool-btn" id="btn-neural-zoom-in" title="Phóng to">
        <i class="fa-solid fa-magnifying-glass-plus"></i>
      </button>

      <button type="button" class="neural-tool-btn" id="btn-neural-zoom-out" title="Thu nhỏ">
        <i class="fa-solid fa-magnifying-glass-minus"></i>
      </button>

      <button type="button" class="neural-tool-btn" id="btn-neural-reset-zoom" title="Reset Zoom">
        <span>100%</span>
      </button>

      <div class="neural-toolbar-separator"></div>

      <button type="button" class="neural-tool-btn" id="btn-neural-open-notepad" title="Mở Bảng Notepad Markdown (50% bên phải)">
        <i class="fa-solid fa-file-pen"></i>
        <span class="btn-text-full">Ghi Chú</span>
      </button>
    </div>

    <!-- Popover Thiết Lập Số Câu Thử Thách Mục Tiêu Mỗi Node -->
    <div class="neural-target-dialog" id="neural-target-dialog" style="display: none;">
      <div class="neural-target-card">
        <div class="neural-target-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-bullseye" style="color: #f59e0b;"></i>
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #f8fafc;">Thử Thách Khảo Hạch Node</h4>
          </div>
          <button type="button" class="neural-target-close" id="btn-close-target-dialog">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p style="margin: 6px 0 12px; font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">
          Chọn số câu trắc nghiệm cần hoàn thành để đổi màu nấc và đạt 100% Mastery tại mỗi node tri thức.
        </p>
        <div class="neural-target-options" id="neural-target-preset-buttons">
          <button type="button" class="btn-target-opt ${targetQuizCount === 1 ? 'active' : ''}" data-val="1">1 câu / node</button>
          <button type="button" class="btn-target-opt ${targetQuizCount === 2 ? 'active' : ''}" data-val="2">2 câu / node</button>
          <button type="button" class="btn-target-opt ${targetQuizCount === 3 ? 'active' : ''}" data-val="3">3 câu (Khuyên dùng)</button>
          <button type="button" class="btn-target-opt ${targetQuizCount === 5 ? 'active' : ''}" data-val="5">5 câu (Chuyên sâu)</button>
        </div>
        <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
          <span style="font-size: 0.78rem; color: #cbd5e1;">Hoặc số khác:</span>
          <input type="number" id="input-custom-target-quiz" min="1" max="20" value="${targetQuizCount}" style="width: 60px; padding: 4px 8px; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.85rem; text-align: center;" />
          <button type="button" class="neural-tool-btn primary" id="btn-save-custom-target" style="padding: 5px 12px; font-size: 0.78rem;">Áp dụng</button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 3. CONTROLLER & INSTANCE MANAGEMENT
// ==========================================================================
let activeModalOverlay = null;
let activeCanvasEngine = null;

/**
 * Mở modal toàn màn hình Cây Kiến Thức Nơ-ron của môn học
 * @param {string} subjectCode 
 */
export function openNeuralKnowledgeModal(subjectCode) {
  closeNeuralKnowledgeModal();

  const subject = (state.driveSubjects || []).find(s => s.code === subjectCode);
  if (!subject) return;

  const nodes = getSubjectKnowledgeNodes(subjectCode);

  const overlay = document.createElement('div');
  overlay.className = 'neural-modal-overlay';
  overlay.innerHTML = renderNeuralModalShell(subject);
  document.body.appendChild(overlay);
  activeModalOverlay = overlay;

  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  const canvasEl = overlay.querySelector('#neural-canvas-element');

  // Khởi tạo Canvas Engine
  activeCanvasEngine = new NeuralCanvasEngine(
    canvasEl,
    subjectCode,
    nodes,
    // Callback khi click đúp để sửa node
    (nodeToEdit) => {
      openEditNeuralNodeModal(
        subjectCode,
        nodeToEdit,
        // Khi lưu xong
        () => {
          const refreshed = getSubjectKnowledgeNodes(subjectCode);
          activeCanvasEngine.updateNodes(refreshed);
        },
        // Khi xóa xong
        () => {
          const refreshed = getSubjectKnowledgeNodes(subjectCode);
          activeCanvasEngine.updateNodes(refreshed);
        }
      );
    },
    // Callback thêm con
    null,
    // Callback khi click icon ghi chú hoặc mở Notepad Sidepanel
    (nodeWithNotes) => {
      openNeuralNotepadSidebar(overlay, subjectCode, nodeWithNotes, () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      });
    },
    // Callback khi click icon Quiz AI ✨
    (nodeForQuiz) => {
      openNeuralQuizModal(overlay, subjectCode, nodeForQuiz, () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      });
    },
    // Số câu hỏi thử thách mục tiêu mỗi node
    getSubjectTargetQuizCount(subjectCode)
  );

  // Gắn sự kiện các nút trên Toolbar
  const closeBtn = overlay.querySelector('#btn-close-neural-cosmos');
  closeBtn.addEventListener('click', closeNeuralKnowledgeModal);

  const centerBtn = overlay.querySelector('#btn-neural-center');
  centerBtn.addEventListener('click', () => activeCanvasEngine.centerOnRoot());

  const autoLayoutBtn = overlay.querySelector('#btn-neural-auto-layout');
  if (autoLayoutBtn) {
    autoLayoutBtn.addEventListener('click', () => {
      activeCanvasEngine.autoLayoutCompactTree();
    });
  }

  // Quản lý Dialog Thiết Lập Mục Tiêu Thử Thách
  const targetSetupBtn = overlay.querySelector('#btn-neural-target-setup');
  const targetDialog = overlay.querySelector('#neural-target-dialog');
  const closeTargetDialogBtn = overlay.querySelector('#btn-close-target-dialog');
  const targetPresetBtns = overlay.querySelectorAll('.btn-target-opt');
  const customTargetInput = overlay.querySelector('#input-custom-target-quiz');
  const saveCustomTargetBtn = overlay.querySelector('#btn-save-custom-target');
  const lblTargetQuizCount = overlay.querySelector('#lbl-target-quiz-count');

  const updateActiveTarget = (newCount) => {
    const saved = setSubjectTargetQuizCount(subjectCode, newCount);
    activeCanvasEngine.setTargetQuizCount(saved);
    if (lblTargetQuizCount) lblTargetQuizCount.textContent = `${saved} câu`;
    if (customTargetInput) customTargetInput.value = saved;
    targetPresetBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.val, 10) === saved);
    });
    activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
  };

  if (targetSetupBtn && targetDialog) {
    targetSetupBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = targetDialog.style.display === 'flex';
      targetDialog.style.display = isVisible ? 'none' : 'flex';
    });

    if (closeTargetDialogBtn) {
      closeTargetDialogBtn.addEventListener('click', () => {
        targetDialog.style.display = 'none';
      });
    }

    targetPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.val, 10);
        updateActiveTarget(val);
        setTimeout(() => { targetDialog.style.display = 'none'; }, 200);
      });
    });

    if (saveCustomTargetBtn && customTargetInput) {
      saveCustomTargetBtn.addEventListener('click', () => {
        const val = parseInt(customTargetInput.value, 10);
        if (val && val > 0) {
          updateActiveTarget(val);
          targetDialog.style.display = 'none';
        }
      });
    }
  }

  const zoomInBtn = overlay.querySelector('#btn-neural-zoom-in');
  zoomInBtn.addEventListener('click', () => activeCanvasEngine.zoomIn());

  const zoomOutBtn = overlay.querySelector('#btn-neural-zoom-out');
  zoomOutBtn.addEventListener('click', () => activeCanvasEngine.zoomOut());

  const resetZoomBtn = overlay.querySelector('#btn-neural-reset-zoom');
  resetZoomBtn.addEventListener('click', () => activeCanvasEngine.resetZoom());

  // Nút mở Bảng Notepad Markdown (50% bên phải)
  const openNotepadBtn = overlay.querySelector('#btn-neural-open-notepad');
  if (openNotepadBtn) {
    openNotepadBtn.addEventListener('click', () => {
      const currentNodes = getSubjectKnowledgeNodes(subjectCode);
      const targetId = activeCanvasEngine.selectedNodeId || currentNodes.find(n => n.parentId === null)?.id || currentNodes[0]?.id;
      const targetNode = currentNodes.find(n => n.id === targetId);
      if (targetNode) {
        openNeuralNotepadSidebar(overlay, subjectCode, targetNode, () => {
          activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
        });
      }
    });
  }

  // Thêm nhánh con mới
  const addNodeBtn = overlay.querySelector('#btn-neural-add-node');
  addNodeBtn.addEventListener('click', () => {
    const currentNodes = getSubjectKnowledgeNodes(subjectCode);
    const parentId = activeCanvasEngine.selectedNodeId || currentNodes.find(n => n.parentId === null)?.id || currentNodes[0]?.id;
    const parent = currentNodes.find(n => n.id === parentId) || { x: 0, y: 0 };

    // Tính toán tọa độ phân nhánh đẹp mắt quanh parent
    const angle = Math.random() * Math.PI * 2;
    const distance = 160 + Math.random() * 60;
    const newX = Math.round((parent.x || 0) + Math.cos(angle) * distance);
    const newY = Math.round((parent.y || 0) + Math.sin(angle) * distance);

    const newNode = addNeuralNode(subjectCode, parentId, {
      label: 'Nhánh kiến thức mới',
      url: '',
      color: subject.color || '#6366f1',
      status: 'todo',
      x: newX,
      y: newY
    });

    const refreshed = getSubjectKnowledgeNodes(subjectCode);
    activeCanvasEngine.updateNodes(refreshed);
    activeCanvasEngine.selectedNodeId = newNode.id;

    // Tự động mở form sửa node để người dùng nhập thông tin và link luôn
    openEditNeuralNodeModal(
      subjectCode,
      newNode,
      () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      },
      () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      }
    );
  });

  // Đóng bằng phím Escape
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeNeuralKnowledgeModal();
      window.removeEventListener('keydown', onKeyDown);
    }
  };
  window.addEventListener('keydown', onKeyDown);
}

/**
 * Đóng Modal Toàn Cảnh
 */
export function closeNeuralKnowledgeModal() {
  closeNeuralNotepadSidebar();
  if (activeCanvasEngine) {
    activeCanvasEngine.stop();
    activeCanvasEngine = null;
  }

  if (activeModalOverlay) {
    activeModalOverlay.classList.remove('active');
    setTimeout(() => {
      if (activeModalOverlay && activeModalOverlay.parentNode) {
        activeModalOverlay.parentNode.removeChild(activeModalOverlay);
      }
      activeModalOverlay = null;
    }, 280);
  }
}
