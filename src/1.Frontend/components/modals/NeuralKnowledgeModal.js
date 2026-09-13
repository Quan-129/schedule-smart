// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { state, getSubjectKnowledgeNodes, addNeuralNode } from '../../../3.Database/state.js';
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { NeuralCanvasEngine } from '../../views/neural/NeuralCanvasEngine.js';
import { openEditNeuralNodeModal } from './EditNeuralNodeModal.js';
import { openNeuralNotepadSidebar, closeNeuralNotepadSidebar } from './NeuralNotepadSidebar.js';

// ==========================================================================
// 2. TEMPLATES
// ==========================================================================
function renderNeuralModalShell(subject) {
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
      <button type="button" class="neural-tool-btn primary" id="btn-neural-add-node">
        <i class="fa-solid fa-plus"></i>
        <span>Thêm Nhánh Con</span>
      </button>

      <div class="neural-toolbar-separator"></div>

      <button type="button" class="neural-tool-btn" id="btn-neural-center" title="Căn giữa vào Node Gốc">
        <i class="fa-solid fa-crosshairs"></i>
        <span>Căn Giữa</span>
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
        <span>Ghi Chú (.md)</span>
      </button>
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
    }
  );

  // Gắn sự kiện các nút trên Toolbar
  const closeBtn = overlay.querySelector('#btn-close-neural-cosmos');
  closeBtn.addEventListener('click', closeNeuralKnowledgeModal);

  const centerBtn = overlay.querySelector('#btn-neural-center');
  centerBtn.addEventListener('click', () => activeCanvasEngine.centerOnRoot());

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
