/**
 * ==========================================================================
 * FRONTEND VIEW - BACKPACK DRAG & DROP ENGINE (APPLE iOS JIGGLE & MERGE)
 * Xử lý kéo thả node bằng Pointer Events để tạo/gom thư mục trên Desktop & Mobile
 * ==========================================================================
 */

// 1. IMPORTS
import { state, createDriveFolder, addSubjectToFolder } from '../../../3.Database/state.js';
import { showToast } from '../../components/Toast.js';

// 2. CONSTANTS & VARIABLES
export let lastDropTimestamp = 0;
let activeDragNode = null;
let ghostEl = null;
let currentDropTarget = null;
let startX = 0;
let startY = 0;
let isDragging = false;

// 3. MAIN EVENT ATTACHMENT
/**
 * Gắn sự kiện kéo thả cho các node trong Backpack Grid
 * @param {HTMLElement} container - Thẻ lưới chứa các node
 */
export function attachBackpackDragDrop(container) {
  if (!container) return;

  const appButtons = container.querySelectorAll('.bp-app-btn:not(.btn-add-app)');
  appButtons.forEach(btn => {
    btn.removeEventListener('pointerdown', handlePointerDown);
    btn.addEventListener('pointerdown', handlePointerDown);
  });
}

// 4. EVENT HANDLERS
function handlePointerDown(e) {
  // Chỉ kích hoạt khi đang ở chế độ Jiggle Mode và dùng chuột trái / chạm tay
  if (!state.isJiggleMode) return;
  if (e.button !== 0 && e.pointerType === 'mouse') return;

  // Không kéo nếu chạm vào nút Xóa (-) hoặc nút Bút chì (✏️)
  if (e.target.closest('.btn-delete-node-badge') || e.target.closest('.btn-edit-node-pencil')) {
    return;
  }

  const btn = e.currentTarget;
  activeDragNode = btn;
  startX = e.clientX;
  startY = e.clientY;
  isDragging = false;
  currentDropTarget = null;

  window.addEventListener('pointermove', handlePointerMove, { passive: false });
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);
}

function handlePointerMove(e) {
  if (!activeDragNode) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const distance = Math.hypot(dx, dy);

  // Ngưỡng bắt đầu kéo: 8px
  if (!isDragging && distance > 8) {
    isDragging = true;
    activeDragNode.classList.add('is-dragging');

    // Tạo Ghost Element bám theo tay/chuột
    createGhostElement(activeDragNode, e.clientX, e.clientY);

    // Chặn cuộn trang khi đang kéo
    if (e.cancelable) e.preventDefault();
  }

  if (isDragging && ghostEl) {
    if (e.cancelable) e.preventDefault();
    updateGhostPosition(e.clientX, e.clientY);

    // Nhận diện node bên dưới tọa độ hiện tại
    ghostEl.style.display = 'none'; // Tạm ẩn ghost để elementFromPoint thấy node bên dưới
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    ghostEl.style.display = '';

    const targetNode = elemBelow ? elemBelow.closest('.bp-app-btn:not(.btn-add-app)') : null;

    if (targetNode && targetNode !== activeDragNode) {
      if (currentDropTarget !== targetNode) {
        if (currentDropTarget) currentDropTarget.classList.remove('bp-drop-target');
        currentDropTarget = targetNode;
        currentDropTarget.classList.add('bp-drop-target');

        // Phản hồi rung nhẹ xúc giác Haptic Feedback
        if (navigator.vibrate) navigator.vibrate(30);
      }
    } else {
      if (currentDropTarget) {
        currentDropTarget.classList.remove('bp-drop-target');
        currentDropTarget = null;
      }
    }
  }
}

function handlePointerUp(e) {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerUp);

  if (ghostEl) {
    ghostEl.remove();
    ghostEl = null;
  }

  if (activeDragNode) {
    activeDragNode.classList.remove('is-dragging');
  }

  // Xử lý Hợp nhất (Drop Action)
  if (isDragging && currentDropTarget && activeDragNode) {
    executeDropMerge(activeDragNode, currentDropTarget);
  }

  if (currentDropTarget) {
    currentDropTarget.classList.remove('bp-drop-target');
    currentDropTarget = null;
  }

  activeDragNode = null;
  isDragging = false;
}

/**
 * Thực hiện logic gom nhóm khi thả một node lên node khác
 */
function executeDropMerge(sourceNode, targetNode) {
  const sourceCode = sourceNode.dataset.code;
  const sourceFolderId = sourceNode.dataset.folderId;
  const targetCode = targetNode.dataset.code;
  const targetFolderId = targetNode.dataset.folderId;

  // 1. Môn học thả lên Môn học -> Tạo Thư mục mới gom cả 2
  if (sourceCode && targetCode && sourceCode !== targetCode) {
    lastDropTimestamp = Date.now();
    const s1 = state.driveSubjects.find(s => s.code === sourceCode);
    const s2 = state.driveSubjects.find(s => s.code === targetCode);
    const defaultName = s1 && s2 ? `Nhóm ${s1.code} & ${s2.code}` : 'Thư mục mới';

    createDriveFolder(defaultName, [sourceCode, targetCode]);

    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    showToast(`Đã gom "${s1 ? s1.name : sourceCode}" & "${s2 ? s2.name : targetCode}" thành Thư mục mới! 📁`);

    if (window.renderBackpackView) window.renderBackpackView();
    return;
  }

  // 2. Môn học thả lên Thư mục có sẵn -> Thêm môn vào Thư mục
  if (sourceCode && targetFolderId) {
    lastDropTimestamp = Date.now();
    const s1 = state.driveSubjects.find(s => s.code === sourceCode);
    const folder = (state.driveFolders || []).find(f => f.id === targetFolderId);

    addSubjectToFolder(targetFolderId, sourceCode);

    if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    showToast(`Đã thêm môn "${s1 ? s1.name : sourceCode}" vào thư mục "${folder ? folder.name : 'Thư mục'}"! 📁`);

    if (window.renderBackpackView) window.renderBackpackView();
    return;
  }

  // 3. Thư mục thả lên Môn học -> Thêm môn đích vào Thư mục
  if (sourceFolderId && targetCode) {
    lastDropTimestamp = Date.now();
    const s2 = state.driveSubjects.find(s => s.code === targetCode);
    const folder = (state.driveFolders || []).find(f => f.id === sourceFolderId);

    addSubjectToFolder(sourceFolderId, targetCode);

    if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    showToast(`Đã thêm môn "${s2 ? s2.name : targetCode}" vào thư mục "${folder ? folder.name : 'Thư mục'}"! 📁`);

    if (window.renderBackpackView) window.renderBackpackView();
    return;
  }

  // 4. Thư mục thả lên Thư mục khác -> Hợp nhất 2 Thư mục
  if (sourceFolderId && targetFolderId && sourceFolderId !== targetFolderId) {
    lastDropTimestamp = Date.now();
    const f1 = (state.driveFolders || []).find(f => f.id === sourceFolderId);
    const f2 = (state.driveFolders || []).find(f => f.id === targetFolderId);

    state.driveSubjects.forEach(s => {
      if (s.folderId === sourceFolderId) {
        s.folderId = targetFolderId;
      }
    });

    removeDriveFolder(sourceFolderId, false);
    persistDriveSubjects();

    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    showToast(`Đã hợp nhất thư mục "${f1 ? f1.name : 'A'}" vào "${f2 ? f2.name : 'B'}"! 📁`);

    if (window.renderBackpackView) window.renderBackpackView();
    return;
  }
}

/**
 * Tạo Ghost Element nổi lên theo con trỏ chuột
 */
function createGhostElement(node, x, y) {
  const circle = node.querySelector('.bp-circle-wrapper');
  if (!circle) return;

  const rect = circle.getBoundingClientRect();
  ghostEl = circle.cloneNode(true);
  ghostEl.className = 'bp-circle-wrapper bp-drag-ghost';
  ghostEl.style.width = `${rect.width}px`;
  ghostEl.style.height = `${rect.height}px`;

  // Xóa các badge xóa/sửa khỏi ghost element
  const badges = ghostEl.querySelectorAll('.btn-delete-node-badge, .btn-edit-node-pencil');
  badges.forEach(b => b.remove());

  document.body.appendChild(ghostEl);
  updateGhostPosition(x, y);
}

function updateGhostPosition(x, y) {
  if (!ghostEl) return;
  const w = parseFloat(ghostEl.style.width) || 90;
  const h = parseFloat(ghostEl.style.height) || 90;
  ghostEl.style.left = `${x - w / 2}px`;
  ghostEl.style.top = `${y - h / 2}px`;
}
