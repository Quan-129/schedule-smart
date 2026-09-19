// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { state, getSubjectKnowledgeNodes, addNeuralNode, deleteNeuralNode, getSubjectTargetQuizCount, setSubjectTargetQuizCount } from '../../../3.Database/state.js';
import { escapeHtml } from '../../../4.Security/sanitizer.js';
import { NeuralCanvasEngine, getDescendantCount } from '../../views/neural/NeuralCanvasEngine.js';
import { openEditNeuralNodeModal } from './EditNeuralNodeModal.js';
import { openNeuralNotepadSidebar, closeNeuralNotepadSidebar } from './NeuralNotepadSidebar.js';
import { openNeuralQuizModal } from './NeuralQuizModal.js';
import { decomposeKnowledgeToExerciseTopics } from '../../../2.Backend/services/GeminiAIService.js';
import { showToast } from '../Toast.js';

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
      <div class="neural-legend-item">
        <span style="color:#f97316; font-size: 0.85rem;">🎯</span>
        <span>Node Bài Tập &amp; Ôn Luyện</span>
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

      <button type="button" class="neural-tool-btn danger-tool" id="btn-neural-delete-node" title="Xóa nhánh đang chọn (hoặc bấm phím Delete trên bàn phím)">
        <i class="fa-solid fa-trash-can"></i>
        <span class="btn-text-full">Xóa Nhánh</span>
        <span class="btn-text-short">Xóa</span>
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
      if (!currentNodes || currentNodes.length === 0) {
        showToast('Sơ đồ hiện tại đang trống. Hãy thêm nhánh để mở ghi chú!', 'info');
        return;
      }
      const targetId = activeCanvasEngine.selectedNodeId || currentNodes.find(n => n.parentId === null)?.id || currentNodes[0]?.id;
      const targetNode = currentNodes.find(n => n.id === targetId);
      if (targetNode) {
        openNeuralNotepadSidebar(overlay, subjectCode, targetNode, () => {
          activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
        });
      }
    });
  }

  // ========================================================================
  // QUẢN LÝ TẠO NHÁNH MỚI (KIẾN THỨC vs BÀI TẬP & ÔN LUYỆN)
  // ========================================================================
  let activeAddTypePopover = null;
  const closeAddTypePopover = () => {
    if (activeAddTypePopover && activeAddTypePopover.parentNode) {
      activeAddTypePopover.parentNode.removeChild(activeAddTypePopover);
      activeAddTypePopover = null;
    }
  };

  // 1. Tạo Nhánh Kiến Thức thông thường (Lý thuyết)
  const handleCreateKnowledgeNode = (specifiedParentId = null) => {
    closeAddTypePopover();
    const currentNodes = getSubjectKnowledgeNodes(subjectCode);
    const isFirstNode = !currentNodes || currentNodes.length === 0;

    let parentId = null;
    let newX = 0;
    let newY = 0;

    if (!isFirstNode) {
      parentId = specifiedParentId || activeCanvasEngine.selectedNodeId || currentNodes.find(n => n.parentId === null)?.id || currentNodes[0]?.id || null;
      const parent = currentNodes.find(n => n.id === parentId) || { x: 0, y: 0 };
      const angle = Math.random() * Math.PI * 2;
      const distance = 160 + Math.random() * 60;
      newX = Math.round((parent.x || 0) + Math.cos(angle) * distance);
      newY = Math.round((parent.y || 0) + Math.sin(angle) * distance);
    }

    const newNode = addNeuralNode(subjectCode, parentId, {
      label: isFirstNode ? (subject.name || subject.code || 'Node Gốc Mới') : 'Nhánh kiến thức mới',
      url: isFirstNode ? (subject.link || '') : '',
      color: subject.color || '#6366f1',
      status: isFirstNode ? 'completed' : 'todo',
      x: newX,
      y: newY,
      notes: isFirstNode ? 'Node gốc môn học' : '',
      nodeType: 'knowledge'
    });

    const refreshed = getSubjectKnowledgeNodes(subjectCode);
    activeCanvasEngine.updateNodes(refreshed);
    activeCanvasEngine.selectedNodeId = newNode.id;

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
  };

  // 2. Tạo Nhánh Bài Tập & Ôn Luyện (AI bóc tách chuyên đề, mẹo thi & câu mẫu từ Node Cha)
  const handleCreateExerciseNode = async (specifiedParentId = null) => {
    closeAddTypePopover();
    const currentNodes = getSubjectKnowledgeNodes(subjectCode);
    if (!currentNodes || currentNodes.length === 0) {
      showToast('⚠️ Vui lòng tạo Node Gốc trước khi thêm bài tập!');
      return;
    }

    const parentId = specifiedParentId || activeCanvasEngine.selectedNodeId || currentNodes.find(n => n.parentId === null)?.id || currentNodes[0]?.id;
    const parent = currentNodes.find(n => n.id === parentId) || currentNodes[0];

    showToast(`🤖 AI đang đọc toàn bộ ghi chú & các đoạn chat đã ghim của "${parent.label}" để bóc tách chuyên đề...`);

    let topics = [];
    try {
      topics = await decomposeKnowledgeToExerciseTopics(parent, currentNodes);
    } catch (err) {
      console.warn('Lỗi phân tách chuyên đề:', err);
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      topics = [
        {
          topicName: `Đặc tính & Khái niệm cốt lõi: ${parent.label}`,
          summary: 'Nắm vững định nghĩa, đặc điểm bản chất và phạm vi ứng dụng.',
          examTips: [
            { title: 'Bí kíp nhận diện', content: 'Ghi nhớ định nghĩa chuẩn và các điều kiện cần & đủ.' },
            { title: 'Bẫy thi thường gặp', content: 'Cảnh giác với phương án đảo ngược nguyên nhân - kết quả.' }
          ]
        },
        {
          topicName: `Quy trình & Phương pháp áp dụng: ${parent.label}`,
          summary: 'Trình tự các bước thực hiện, công thức và nguyên lý vận hành.',
          examTips: [
            { title: 'Mẹo thứ tự các bước', content: 'Học thuộc mốc bước đầu tiên và bước nghiệm thu cuối cùng.' },
            { title: 'Loại trừ đáp án', content: 'Loại ngay phương án làm sai lệch thứ tự logic của quy trình.' }
          ]
        },
        {
          topicName: `Bài toán thực tế & Tình huống: ${parent.label}`,
          summary: 'Vận dụng lý thuyết vào xử lý case study thực tiễn.',
          examTips: [
            { title: 'Đọc kỹ câu hỏi', content: 'Xác định câu hỏi tìm khẳng định ĐÚNG hay khẳng định SAI.' },
            { title: 'Phân tích số liệu', content: 'Chú ý đơn vị tính và các giả định ngoại lệ của bài toán.' }
          ]
        }
      ];
    }

    // Tọa độ cho Node Bài Tập chính
    const pX = parent.x || 0;
    const pY = parent.y || 0;
    const mainAngle = Math.random() * Math.PI * 2;
    const mainDist = 180 + Math.random() * 40;
    const mainX = Math.round(pX + Math.cos(mainAngle) * mainDist);
    const mainY = Math.round(pY + Math.sin(mainAngle) * mainDist);

    // Tạo Node Bài Tập chính
    const exerciseMainNode = addNeuralNode(subjectCode, parent.id, {
      label: `🎯 Bài Tập: ${parent.label}`,
      url: '',
      color: '#f97316',
      status: 'learning',
      x: mainX,
      y: mainY,
      notes: `## 🎯 BÀI TẬP & ÔN LUYỆN CHUYÊN ĐỀ: ${parent.label}\n\n*Hệ thống đã tự động đọc toàn bộ tri thức của node cha và phân tách thành ${topics.length} chuyên đề ôn luyện bên dưới.*\n\n${topics.map((t, idx) => `### ${idx + 1}. ${t.topicName}\n- **Trọng tâm**: ${t.summary}\n- **Mẹo thi**: ${t.examTips?.map(m => m.title).join(', ') || 'Xem chi tiết trong từng nhánh'}`).join('\n\n')}`,
      nodeType: 'exercise',
      exerciseData: {
        parentLabel: parent.label,
        topicsCount: topics.length,
        topics
      }
    });

    // Tạo các Sub-nodes Chuyên đề tỏa ra quanh Node Bài Tập chính
    const baseAngle = mainAngle;
    const spreadAngle = Math.PI * 0.8;
    const stepAngle = topics.length > 1 ? spreadAngle / (topics.length - 1) : 0;
    const startSubAngle = baseAngle - spreadAngle / 2;

    topics.forEach((topic, idx) => {
      const subAngle = startSubAngle + idx * stepAngle;
      const subDist = 145 + (idx % 2 === 1 ? 35 : 0);
      const subX = Math.round(mainX + Math.cos(subAngle) * subDist);
      const subY = Math.round(mainY + Math.sin(subAngle) * subDist);

      const tipsMd = (topic.examTips || []).map((t, i) => `**${i + 1}. 💡 ${t.title}**\n${t.content}`).join('\n\n');

      addNeuralNode(subjectCode, exerciseMainNode.id, {
        label: `📋 ${topic.topicName}`,
        url: '',
        color: '#f59e0b',
        status: 'todo',
        x: subX,
        y: subY,
        notes: `## 📋 CHUYÊN ĐỀ: ${topic.topicName}\n\n> 🎯 **Trọng tâm kiến thức**: ${topic.summary}\n\n---\n\n### 💡 Mẹo Làm Trắc Nghiệm & Bẫy Thi Thường Gặp:\n\n${tipsMd || 'Chưa có mẹo cụ thể.'}\n\n---\n\n*Bấm nút "Thử thách Quiz" hoặc mở bảng để AI sinh 5 câu hỏi mẫu thực chiến cho chuyên đề này!*`,
        nodeType: 'exercise_topic',
        exerciseData: {
          topicName: topic.topicName,
          summary: topic.summary,
          tips: topic.examTips || [],
          quizzes: []
        }
      });
    });

    const refreshed = getSubjectKnowledgeNodes(subjectCode);
    activeCanvasEngine.updateNodes(refreshed);
    activeCanvasEngine.selectedNodeId = exerciseMainNode.id;
    showToast(`✨ Đã tạo bộ bài tập với ${topics.length} chuyên đề! Bấm vào từng nhánh để xem mẹo thi & luyện 5 câu mẫu.`, 'success');
  };

  // Nút Thêm Nhánh trên Toolbar: Mở Popover chọn loại node
  const addNodeBtn = overlay.querySelector('#btn-neural-add-node');
  addNodeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentNodes = getSubjectKnowledgeNodes(subjectCode);
    const isFirstNode = !currentNodes || currentNodes.length === 0;

    if (isFirstNode) {
      handleCreateKnowledgeNode();
      return;
    }

    if (activeAddTypePopover) {
      closeAddTypePopover();
      return;
    }

    const btnRect = addNodeBtn.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'neural-add-node-popover';
    popover.style.position = 'fixed';
    popover.style.bottom = `${window.innerHeight - btnRect.top + 8}px`;
    popover.style.left = `${Math.max(12, btnRect.left)}px`;
    popover.style.zIndex = '99999';

    popover.innerHTML = `
      <div style="padding: 6px 12px 6px; font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        Chọn loại nhánh muốn thêm
      </div>
      <button type="button" class="neural-add-type-btn" id="popover-add-knowledge">
        <span class="type-icon" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;"><i class="fa-solid fa-book-open"></i></span>
        <div class="type-info">
          <strong>📘 Nhánh Kiến Thức (Lý thuyết)</strong>
          <span>Ghi chép Markdown, bảng vẽ ảnh, hỏi đáp AI</span>
        </div>
      </button>
      <button type="button" class="neural-add-type-btn" id="popover-add-exercise">
        <span class="type-icon" style="background: rgba(249, 115, 22, 0.2); color: #f97316;"><i class="fa-solid fa-bullseye"></i></span>
        <div class="type-info">
          <strong>🎯 Nhánh Bài Tập &amp; Ôn Luyện</strong>
          <span>AI đọc hiểu toàn bộ node cha ➔ Tự bóc tách chuyên đề, mẹo thi &amp; 5 câu mẫu</span>
        </div>
      </button>
    `;

    document.body.appendChild(popover);
    activeAddTypePopover = popover;

    popover.querySelector('#popover-add-knowledge')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      handleCreateKnowledgeNode();
    });

    popover.querySelector('#popover-add-exercise')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      handleCreateExerciseNode();
    });

    const onDocClick = (ev) => {
      if (!popover.contains(ev.target) && ev.target !== addNodeBtn) {
        closeAddTypePopover();
        document.removeEventListener('click', onDocClick);
      }
    };
    setTimeout(() => document.addEventListener('click', onDocClick), 50);
  });

  // ========================================================================
  // XÓA NHÁNH KIẾN THỨC (DELETE NODE / ROOT NODE) & CONTEXT MENU CHUỘT PHẢI
  // ========================================================================
  const deleteNodeBtn = overlay.querySelector('#btn-neural-delete-node');
  const handleDeleteSelectedNode = () => {
    const selectedId = activeCanvasEngine?.selectedNodeId;
    const currentNodes = getSubjectKnowledgeNodes(subjectCode);
    if (!selectedId) {
      showToast('⚠️ Vui lòng chọn một node nơ-ron trước khi xóa!');
      return;
    }

    const nodeToDelete = currentNodes.find(n => n.id === selectedId);
    if (!nodeToDelete) return;

    const isRoot = nodeToDelete.parentId === null;
    const childCount = currentNodes.filter(n => n && n.parentId === nodeToDelete.id && n.id !== nodeToDelete.id).length;

    let confirmMsg = '';
    if (isRoot) {
      confirmMsg = childCount > 0
        ? `⚠️ BẠN ĐANG XÓA NODE GỐC CỦA MÔN HỌC!\n\nThao tác này sẽ xóa toàn bộ sơ đồ tri thức gồm Node Gốc "${nodeToDelete.label}" và ${childCount} nhánh con trực thuộc.\n\nBạn có chắc chắn muốn xóa toàn bộ không?`
        : `⚠️ Bạn có chắc chắn muốn xóa Node Gốc "${nodeToDelete.label}" không?`;
    } else {
      confirmMsg = childCount > 0
        ? `Xóa node "${nodeToDelete.label}" sẽ đồng thời xóa ${childCount} nhánh con trực thuộc.\n\nBạn có chắc chắn muốn xóa không?`
        : `Bạn có chắc chắn muốn xóa node "${nodeToDelete.label}" không?`;
    }

    if (window.confirm(confirmMsg)) {
      deleteNeuralNode(subjectCode, nodeToDelete.id);
      showToast(isRoot ? `Đã xóa Node Gốc "${nodeToDelete.label}" thành công! 🗑️` : `Đã xóa node "${nodeToDelete.label}" thành công! 🗑️`, 'success');
      activeCanvasEngine.selectedNodeId = null;
      activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      closeNeuralNotepadSidebar();
    }
  };

  deleteNodeBtn.addEventListener('click', handleDeleteSelectedNode);

  // Context Menu chuột phải
  let currentContextMenuEl = null;
  const closeContextMenu = () => {
    if (currentContextMenuEl && currentContextMenuEl.parentNode) {
      currentContextMenuEl.parentNode.removeChild(currentContextMenuEl);
      currentContextMenuEl = null;
    }
  };

  activeCanvasEngine.onContextMenuRequest = (clickedNode, clientX, clientY) => {
    closeContextMenu();
    closeAddTypePopover();
    if (!clickedNode) return;

    const menu = document.createElement('div');
    menu.className = 'neural-canvas-context-menu';
    menu.style.left = `${Math.min(clientX, window.innerWidth - 200)}px`;
    menu.style.top = `${Math.min(clientY, window.innerHeight - 260)}px`;

    const isRoot = (clickedNode.parentId === null);

    menu.innerHTML = `
      <div style="padding: 4px 10px 6px; font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${escapeHtml(clickedNode.label || 'Nhánh')} ${isRoot ? '(Gốc)' : ''}
      </div>
      <button type="button" class="neural-context-menu-item" id="ctx-open-notes">
        <i class="fa-solid fa-file-pen"></i> Mở ghi chú
      </button>
      <button type="button" class="neural-context-menu-item" id="ctx-edit-node">
        <i class="fa-solid fa-pen-to-square"></i> Sửa thông tin
      </button>
      <button type="button" class="neural-context-menu-item" id="ctx-open-quiz">
        <i class="fa-solid fa-bullseye"></i> Thử thách Quiz
      </button>
      <button type="button" class="neural-context-menu-item" id="ctx-add-child">
        <i class="fa-solid fa-plus"></i> Thêm nhánh kiến thức
      </button>
      <button type="button" class="neural-context-menu-item" id="ctx-add-exercise" style="color: #f97316;">
        <i class="fa-solid fa-bullseye" style="color: #f97316;"></i> Thêm bài tập (AI bóc tách)
      </button>
      <div class="neural-context-menu-divider"></div>
      <button type="button" class="neural-context-menu-item danger" id="ctx-delete-node">
        <i class="fa-solid fa-trash-can"></i> ${isRoot ? 'Xóa Node Gốc (Toàn bộ)' : 'Xóa nhánh này'}
      </button>
    `;

    document.body.appendChild(menu);
    currentContextMenuEl = menu;

    menu.querySelector('#ctx-open-notes')?.addEventListener('click', () => {
      closeContextMenu();
      openNeuralNotepadSidebar(overlay, subjectCode, clickedNode, () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      });
    });

    menu.querySelector('#ctx-edit-node')?.addEventListener('click', () => {
      closeContextMenu();
      openEditNeuralNodeModal(subjectCode, clickedNode, () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      }, () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      });
    });

    menu.querySelector('#ctx-open-quiz')?.addEventListener('click', () => {
      closeContextMenu();
      openNeuralQuizModal(overlay, subjectCode, clickedNode, () => {
        activeCanvasEngine.updateNodes(getSubjectKnowledgeNodes(subjectCode));
      });
    });

    menu.querySelector('#ctx-add-child')?.addEventListener('click', () => {
      closeContextMenu();
      handleCreateKnowledgeNode(clickedNode.id);
    });

    menu.querySelector('#ctx-add-exercise')?.addEventListener('click', () => {
      closeContextMenu();
      handleCreateExerciseNode(clickedNode.id);
    });

    menu.querySelector('#ctx-delete-node')?.addEventListener('click', () => {
      closeContextMenu();
      activeCanvasEngine.selectedNodeId = clickedNode.id;
      handleDeleteSelectedNode();
    });
  };

  const onWindowPointerDown = (e) => {
    if (currentContextMenuEl && !currentContextMenuEl.contains(e.target)) {
      closeContextMenu();
    }
  };
  window.addEventListener('pointerdown', onWindowPointerDown);
  window.addEventListener('wheel', closeContextMenu, { passive: true });

  // Đóng bằng phím Escape, xóa node bằng phím Delete / Backspace
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeContextMenu();
      closeNeuralKnowledgeModal();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onWindowPointerDown);
      window.removeEventListener('wheel', closeContextMenu);
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable ||
        activeEl.closest('#neural-notepad-sidebar-panel')
      );
      if (!isTyping && activeCanvasEngine && activeCanvasEngine.selectedNodeId) {
        e.preventDefault();
        handleDeleteSelectedNode();
      }
    }
  };
  window.addEventListener('keydown', onKeyDown);
}

/**
 * Đóng Modal Toàn Cảnh
 */
export function closeNeuralKnowledgeModal() {
  const oldCtx = document.querySelector('.neural-canvas-context-menu');
  if (oldCtx && oldCtx.parentNode) {
    oldCtx.parentNode.removeChild(oldCtx);
  }
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
