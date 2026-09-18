// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { saveSubjectKnowledgeNodes } from '../../../3.Database/state.js';
import { showToast } from '../../components/Toast.js';

// ==========================================================================
// 2. CONSTANTS & CONFIG
// ==========================================================================
const NODE_RADIUS = 26;
const ROOT_RADIUS = 34;
const PULSE_SPEED = 0.008;

/**
 * Kiểm tra xem potentialAncestorId có phải là tổ tiên của targetNodeId không
 * (Để chống nối cành tạo chu trình vòng lặp vô tận)
 * @param {string} potentialAncestorId 
 * @param {string} targetNodeId 
 * @param {Array<Object>} nodes 
 * @returns {boolean}
 */
export function isAncestorOf(potentialAncestorId, targetNodeId, nodes) {
  if (!potentialAncestorId || !targetNodeId || !Array.isArray(nodes)) return false;
  if (potentialAncestorId === targetNodeId) return true;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let curr = nodeMap.get(targetNodeId);
  while (curr && curr.parentId) {
    if (curr.parentId === potentialAncestorId) {
      return true;
    }
    curr = nodeMap.get(curr.parentId);
  }
  return false;
}

/**
 * Kiểm tra xem node có chứa nội dung (ở phần Soạn thảo hoặc phần Ghi chú) hay không
 * @param {Object} node 
 * @returns {boolean}
 */
export function nodeHasAnyNotes(node) {
  if (!node) return false;

  // 1. Kiểm tra phần Soạn thảo (Markdown notes)
  if (typeof node.notes === 'string' && node.notes.trim().length > 0) {
    return true;
  }

  // 2. Kiểm tra phần Ghi chú (Visual notes: html & ảnh nổi)
  if (node.visualNotes) {
    if (typeof node.visualNotes === 'string' && node.visualNotes.trim().length > 0) {
      return true;
    }
    if (typeof node.visualNotes === 'object') {
      if (Array.isArray(node.visualNotes.images) && node.visualNotes.images.length > 0) {
        return true;
      }
      if (typeof node.visualNotes.html === 'string' && node.visualNotes.html.trim().length > 0) {
        const textOnly = node.visualNotes.html
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        if (textOnly.length > 0) return true;
        if (/<img\b/i.test(node.visualNotes.html)) return true;
      }
    }
  }

  return false;
}

/**
 * Tách nhãn chữ dài thành nhiều dòng ngắn cân đối (chống bè ngang)
 * @param {string} text - Chuỗi nhãn của node
 * @param {number} maxCharsPerLine - Số ký tự tối đa trên 1 dòng
 * @param {number} maxLines - Số dòng tối đa
 * @returns {Array<string>}
 */
export function wrapCanvasText(text, maxCharsPerLine = 17, maxLines = 3) {
  if (!text) return ['Node'];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Nếu còn từ chưa đưa vào mà đã hết số dòng -> gắn dấu "..."
  const totalRenderedWords = lines.join(' ').split(/\s+/).length;
  if (totalRenderedWords < words.length && lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[\.,\s]+$/, '') + '...';
  }

  return lines;
}

/**
 * Lấy danh sách các node đang được hiển thị (không bị ẩn bởi cha/tổ tiên collapsed)
 * @param {Array<Object>} nodes 
 * @returns {Array<Object>}
 */
export function getVisibleNodes(nodes) {
  if (!Array.isArray(nodes)) return [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  return nodes.filter(node => {
    let curr = node;
    while (curr.parentId) {
      const parent = nodeMap.get(curr.parentId);
      if (!parent) break;
      if (parent.collapsed) return false;
      curr = parent;
    }
    return true;
  });
}

/**
 * Đếm tổng số node con cháu (đệ quy) của một node
 * @param {string} nodeId 
 * @param {Array<Object>} nodes 
 * @returns {number}
 */
export function getDescendantCount(nodeId, nodes) {
  if (!Array.isArray(nodes)) return 0;
  const directChildren = nodes.filter(n => n.parentId === nodeId);
  let total = directChildren.length;
  for (const child of directChildren) {
    total += getDescendantCount(child.id, nodes);
  }
  return total;
}

// ==========================================================================
// 3. NEURAL CANVAS ENGINE CLASS
// ==========================================================================
export class NeuralCanvasEngine {
  constructor(canvasElement, subjectCode, nodes, onNodeEditRequest, onNodeAddChild, onOpenNotepad, onOpenQuiz, targetQuizCount = 3) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.subjectCode = subjectCode;
    this.nodes = Array.isArray(nodes) ? nodes : [];
    this.onNodeEditRequest = onNodeEditRequest;
    this.onNodeAddChild = onNodeAddChild;
    this.onOpenNotepad = onOpenNotepad;
    this.onOpenQuiz = onOpenQuiz;
    this.onContextMenuRequest = null;
    this.targetQuizCount = typeof targetQuizCount === 'number' && targetQuizCount > 0 ? targetQuizCount : 3;

    // Viewport transform
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;

    // Interaction state
    this.isDraggingCanvas = false;
    this.isDraggingNode = false;
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.lastPointerPos = { x: 0, y: 0 };
    this.hoveredNode = null;
    this.selectedNodeId = null;
    this.hasMovedDrag = false;

    // Connection wire & Branch cutting state (Cắt cành & Kéo nối node)
    this.hoveredConnection = null;
    this.isHoveringCutButton = false;
    this.isConnectingWire = false;
    this.wireStartNode = null;
    this.wireEndPos = { x: 0, y: 0 };
    this.wireTargetNode = null;
    this.wireCycleBlocked = false;
    this.potentialDropTargetNode = null;
    this.connectPortHovered = false;

    // Animation loop & Power Saver
    this.animationFrameId = null;
    this.pulsePhase = 0;
    this.isPaused = false;
    this.onVisibilityChange = null;

    this.initCanvasSize();
    this.centerOnRoot();
    this.bindEvents();
    this.initVisibilityListener();
    this.startRenderLoop();
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  centerOnRoot() {
    const root = this.nodes.find(n => n.parentId === null) || this.nodes[0];
    if (root) {
      this.panX = this.width / 2 - (root.x || 0) * this.zoom;
      this.panY = this.height / 2 - (root.y || 0) * this.zoom;
    } else {
      this.panX = this.width / 2;
      this.panY = this.height / 2;
    }
  }

  updateNodes(newNodes) {
    this.nodes = Array.isArray(newNodes) ? newNodes : [];
  }

  setTargetQuizCount(newTarget) {
    this.targetQuizCount = Math.max(1, parseInt(newTarget, 10) || 3);
  }

  // World to Screen & Screen to World transforms
  worldToScreen(wx, wy) {
    return {
      x: wx * this.zoom + this.panX,
      y: wy * this.zoom + this.panY
    };
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom
    };
  }

  // ==========================================================================
  // 4. RENDERING LOOP & PERFORMANCE OPTIMIZATION
  // ==========================================================================
  initVisibilityListener() {
    this.onVisibilityChange = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  startRenderLoop() {
    let lastTime = 0;
    const render = (currentTime) => {
      if (this.isPaused) return;

      // Smart FPS Throttling:
      // Khi người dùng tương tác (drag, pan, hover, kéo dây): Render mượt 60 FPS
      // Khi màn hình tĩnh (idle): Giảm xuống 30 FPS để cắt giảm 60% nhiệt độ và tải CPU/GPU
      const isInteracting = this.isDraggingNode || this.isDraggingCanvas || this.isConnectingWire || this.hoveredNode || this.hoveredConnection;
      const targetFPS = isInteracting ? 60 : 30;
      const interval = 1000 / targetFPS;
      const delta = currentTime - lastTime;

      if (delta >= interval - 2) {
        lastTime = currentTime - (delta % interval);
        this.pulsePhase = (this.pulsePhase + PULSE_SPEED) % 1;
        this.draw();
      }

      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  pause() {
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (!this.animationFrameId) {
      this.startRenderLoop();
    }
  }

  stop() {
    this.pause();
    this.unbindEvents();
    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.onVisibilityChange = null;
    }
  }

  getVisibleNodes() {
    return getVisibleNodes(this.nodes);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Lưới nền tĩnh đã được xử lý bằng CSS hardware-acceleration trên .neural-canvas-container
    this.drawBackgroundGrid(ctx);

    // Nếu sơ đồ chưa có nhánh nào (hoặc vừa xóa Node Gốc)
    if (!this.nodes || this.nodes.length === 0) {
      this.drawEmptyState(ctx);
      return;
    }

    // 2. Visible nodes only (ẩn các nhánh con của node bị collapsed)
    const visibleNodes = this.getVisibleNodes();

    // 3. Draw Connections & Pulses (kèm nút cắt cành ✂️)
    this.drawConnections(ctx, visibleNodes);

    // 4. Draw Nodes
    visibleNodes.forEach(node => this.drawNode(ctx, node));

    // 5. Draw Connecting Wire (Sợi dây điện quang phát sáng khi đang kéo nối)
    if (this.isConnectingWire && this.wireStartNode) {
      this.drawConnectingWire(ctx);
    }

    // 6. Draw Drop Target Tooltip nếu đang kéo thả node đè lên node khác
    if (this.potentialDropTargetNode && this.draggedNode) {
      const pos = this.worldToScreen(this.draggedNode.x, this.draggedNode.y);
      this.drawTooltipBadge(
        ctx,
        `🔗 Thả để nối vào "${this.potentialDropTargetNode.label}"`,
        pos.x,
        pos.y - 35 * this.zoom,
        'rgba(6, 78, 59, 0.95)',
        '#34d399',
        '#10b981'
      );
    }
  }

  drawBackgroundGrid(ctx) {
    // Tối ưu hóa hiệu năng: Lưới chấm tĩnh được đảm nhiệm bằng CSS hardware-acceleration
    // trên .neural-canvas-container, triệt tiêu 100,000+ lệnh vẽ arc/fill mỗi giây giúp quạt máy tính êm ru!
  }

  /**
   * Vẽ trạng thái rỗng khi sơ đồ chưa có nhánh nào
   */
  drawEmptyState(ctx) {
    ctx.save();
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Vòng tròn phát sáng nhịp đập ở tâm
    const pulseRadius = 52 + Math.sin(this.pulsePhase * Math.PI * 2) * 5;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();

    // Điểm mút tâm sáng
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#818cf8';
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 16;
    ctx.fill();

    // Thông điệp hướng dẫn
    ctx.shadowBlur = 0;
    ctx.font = "bold 16px 'Outfit', sans-serif";
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sơ đồ tri thức đang trống 🌱', cx, cy + 82);

    ctx.font = "13px 'Outfit', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Bấm nút "+ Thêm Nhánh" trên thanh công cụ để tạo Node Gốc mới', cx, cy + 107);
    ctx.restore();
  }

  drawConnections(ctx, visibleNodes = this.nodes) {
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    const visibleSet = new Set(visibleNodes.map(n => n.id));
    let activeHoverConn = null;

    visibleNodes.forEach(node => {
      if (!node.parentId || !visibleSet.has(node.parentId)) return;
      const parent = nodeMap.get(node.parentId);
      if (!parent) return;

      const pPos = this.worldToScreen(parent.x, parent.y);
      const cPos = this.worldToScreen(node.x, node.y);

      // Bezier curve control points
      const dx = cPos.x - pPos.x;
      const dy = cPos.y - pPos.y;
      const cx1 = pPos.x + dx * 0.5;
      const cy1 = pPos.y;
      const cx2 = pPos.x + dx * 0.5;
      const cy2 = cPos.y;

      const isHoveredConn = this.hoveredConnection && this.hoveredConnection.child.id === node.id;
      if (isHoveredConn) {
        activeHoverConn = { node, parent, pPos, cPos, cx1, cy1, cx2, cy2 };
        return; // Để vẽ sau cùng giúp cành hover và nút kéo nổi lên trên các cành khác
      }

      // Draw connection axon line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, cPos.x, cPos.y);
      ctx.strokeStyle = node.color ? `${node.color}55` : 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = Math.max(1.5, 2.5 * this.zoom);
      ctx.stroke();

      // Draw flowing pulse particle along axon
      const t = (this.pulsePhase + (node.id.length % 5) * 0.2) % 1;
      const pulsePt = this.getBezierPoint(t, pPos, { x: cx1, y: cy1 }, { x: cx2, y: cy2 }, cPos);
      ctx.beginPath();
      ctx.arc(pulsePt.x, pulsePt.y, Math.max(2, 3.5 * this.zoom), 0, Math.PI * 2);
      ctx.fillStyle = node.color || '#818cf8';
      ctx.shadowColor = node.color || '#818cf8';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });

    // Vẽ cành đang hover & Nút Cắt Cành ✂️ (nổi lên trên cùng)
    if (activeHoverConn) {
      const { node, parent, pPos, cPos, cx1, cy1, cx2, cy2 } = activeHoverConn;
      const midPt = this.getBezierPoint(0.5, pPos, { x: cx1, y: cy1 }, { x: cx2, y: cy2 }, cPos);
      const isBtnHovered = this.isHoveringCutButton;

      ctx.save();
      // Đường cành bừng sáng đỏ neon cảnh báo ngắt cành
      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, cPos.x, cPos.y);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = Math.max(2.5, 4 * this.zoom);
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Nút Cắt Cành ✂️
      const btnRadius = Math.max(10.5, 12.5 * this.zoom) * (isBtnHovered ? 1.25 : 1);
      ctx.beginPath();
      ctx.arc(midPt.x, midPt.y, btnRadius, 0, Math.PI * 2);
      ctx.fillStyle = isBtnHovered ? '#f43f5e' : 'rgba(15, 23, 42, 0.94)';
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = isBtnHovered ? 2.5 : 1.8;
      ctx.stroke();

      // Icon cây kéo
      ctx.font = `bold ${Math.max(10, 11 * this.zoom) * (isBtnHovered ? 1.2 : 1)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✂', midPt.x, midPt.y);
      ctx.restore();

      // Tooltip hướng dẫn
      this.drawTooltipBadge(
        ctx,
        isBtnHovered ? '✂ Bấm để ngắt cành này' : '✂ Di chuột vào kéo để cắt cành',
        midPt.x,
        midPt.y - btnRadius - 4,
        'rgba(15, 23, 42, 0.95)',
        '#ffffff',
        '#f43f5e'
      );
    }
  }

  /**
   * Vẽ Sợi dây điện quang nối 2 node (Interactive Connecting Wire)
   * @param {CanvasRenderingContext2D} ctx 
   */
  drawConnectingWire(ctx) {
    const startPos = this.worldToScreen(this.wireStartNode.x, this.wireStartNode.y);
    const endPos = this.wireEndPos;

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const cx1 = startPos.x + dx * 0.5;
    const cy1 = startPos.y;
    const cx2 = startPos.x + dx * 0.5;
    const cy2 = endPos.y;

    let wireColor = '#38bdf8'; // Cyan mặc định
    let badgeText = '🔗 Kéo đến node đích để kết nối (Esc để hủy)';
    let badgeBg = 'rgba(15, 23, 42, 0.95)';
    let badgeTextCol = '#38bdf8';

    if (this.wireCycleBlocked) {
      wireColor = '#ef4444';
      badgeText = `🚫 Không thể nối: Sẽ tạo vòng lặp vô tận!`;
      badgeBg = 'rgba(69, 10, 10, 0.95)';
      badgeTextCol = '#fca5a5';
    } else if (this.wireTargetNode) {
      wireColor = '#10b981';
      badgeText = `🔗 Thả chuột để kết nối với "${this.wireTargetNode.label}"`;
      badgeBg = 'rgba(6, 78, 59, 0.95)';
      badgeTextCol = '#6ee7b7';
    }

    ctx.save();
    // Đường dây điện quang
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, endPos.x, endPos.y);
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = Math.max(2.5, 3.5 * this.zoom);
    ctx.shadowColor = wireColor;
    ctx.shadowBlur = 12;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -this.pulsePhase * 36;
    ctx.stroke();

    // Điểm mút phát sáng ở con trỏ chuột
    ctx.beginPath();
    ctx.arc(endPos.x, endPos.y, Math.max(6, 8 * this.zoom), 0, Math.PI * 2);
    ctx.fillStyle = wireColor;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();

    // Tooltip ngay trên con trỏ chuột
    this.drawTooltipBadge(
      ctx,
      badgeText,
      endPos.x,
      endPos.y - 18,
      badgeBg,
      badgeTextCol,
      wireColor
    );
  }

  /**
   * Vẽ khung badge tooltip nhỏ tinh gọn trên Canvas
   */
  drawTooltipBadge(ctx, text, x, y, bgColor = '#0f172a', textColor = '#ffffff', borderColor = '#38bdf8') {
    ctx.save();
    const fontSize = 11.5;
    ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
    const textMetrics = ctx.measureText(text);
    const boxW = textMetrics.width + 20;
    const boxH = 26;
    const boxX = Math.max(8, Math.min(this.width - boxW - 8, x - boxW / 2));
    const boxY = Math.max(8, y - boxH);

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fillStyle = bgColor;
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, boxX + boxW / 2, boxY + boxH / 2);
    ctx.restore();
  }

  /**
   * Tìm cành nối và vị trí nút cắt ✂️ tại tọa độ màn hình
   * @param {number} screenX 
   * @param {number} screenY 
   * @returns {Object|null}
   */
  findConnectionAt(screenX, screenY) {
    const visibleNodes = this.getVisibleNodes();
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    const visibleSet = new Set(visibleNodes.map(n => n.id));

    for (const node of visibleNodes) {
      if (!node.parentId || !visibleSet.has(node.parentId)) continue;
      const parent = nodeMap.get(node.parentId);
      if (!parent) continue;

      const pPos = this.worldToScreen(parent.x, parent.y);
      const cPos = this.worldToScreen(node.x, node.y);

      const dx = cPos.x - pPos.x;
      const cx1 = pPos.x + dx * 0.5;
      const cy1 = pPos.y;
      const cx2 = pPos.x + dx * 0.5;
      const cy2 = cPos.y;

      const p0 = pPos;
      const p1 = { x: cx1, y: cy1 };
      const p2 = { x: cx2, y: cy2 };
      const p3 = cPos;

      const midPt = this.getBezierPoint(0.5, p0, p1, p2, p3);
      const distToMid = Math.hypot(screenX - midPt.x, screenY - midPt.y);
      const btnRadius = Math.max(10.5, 12.5 * this.zoom);

      // Nếu đang hover trúng nút cắt
      if (distToMid <= btnRadius + 6) {
        return {
          child: node,
          parent,
          midPt,
          isCutButton: true
        };
      }

      // Kiểm tra khoảng cách chuột tới các điểm trên đường cong Bezier
      let minDistanceToCurve = Infinity;
      const sampleCount = 14;
      for (let s = 1; s <= sampleCount; s++) {
        const t = s / (sampleCount + 1);
        const pt = this.getBezierPoint(t, p0, p1, p2, p3);
        const dist = Math.hypot(screenX - pt.x, screenY - pt.y);
        if (dist < minDistanceToCurve) {
          minDistanceToCurve = dist;
        }
      }

      if (minDistanceToCurve <= Math.max(9, 11 * this.zoom)) {
        return {
          child: node,
          parent,
          midPt,
          isCutButton: distToMid <= btnRadius + 6
        };
      }
    }

    return null;
  }

  getBezierPoint(t, p0, p1, p2, p3) {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;
    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;
    const tSquared = t * t;
    const tCubed = tSquared * t;
    return {
      x: (ax * tCubed) + (bx * tSquared) + (cx * t) + p0.x,
      y: (ay * tCubed) + (by * tSquared) + (cy * t) + p0.y
    };
  }

  drawNode(ctx, node) {
    const isRoot = node.parentId === null;
    const baseRadius = isRoot ? ROOT_RADIUS : NODE_RADIUS;
    const radius = baseRadius * this.zoom;
    const pos = this.worldToScreen(node.x, node.y);
    const isSelected = this.selectedNodeId === node.id;
    const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;

    // 0. Tính toán Tiến Trình Thử Thách & Nấc Màu Nơ-ron
    const passedCount = parseInt(node.quizPassedCount, 10) || 0;
    const targetCount = this.targetQuizCount || 3;
    const progress = Math.min(1, passedCount / targetCount);

    // 1. Nấc Màu Nơ-ron (Đổi màu theo 1/3 nấc, 2/3 nấc, 3/3 nấc)
    let nodeColor = node.color || '#6366f1';
    if (progress >= 1 || node.status === 'completed') {
      nodeColor = '#10b981'; // 100% Mastered: Xanh Ngọc Lục Bảo
    } else if (progress >= 0.5) {
      nodeColor = '#f59e0b'; // Nấc 2 (>= 50%): Cam hổ phách năng lượng
    } else if (progress > 0) {
      nodeColor = '#06b6d4'; // Nấc 1 (> 0%): Cyan / Xanh lam sáng
    }

    ctx.save();

    const isTargetOfDrop = this.potentialDropTargetNode && this.potentialDropTargetNode.id === node.id;
    const isTargetOfWire = this.wireTargetNode && this.wireTargetNode.id === node.id;
    const isConnectionTarget = isTargetOfDrop || isTargetOfWire;

    // 1. Aura Glow (và Hào quang khi là mục tiêu kết nối)
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + (isConnectionTarget ? 16 * this.zoom : (isSelected ? 10 * this.zoom : 5 * this.zoom)), 0, Math.PI * 2);
    if (isConnectionTarget) {
      ctx.fillStyle = this.wireCycleBlocked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)';
    } else {
      ctx.fillStyle = isSelected ? `${nodeColor}45` : (isHovered ? `${nodeColor}30` : `${nodeColor}18`);
    }
    ctx.fill();

    if (isConnectionTarget) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + Math.max(8, 12 * this.zoom), 0, Math.PI * 2);
      ctx.strokeStyle = this.wireCycleBlocked ? '#ef4444' : '#10b981';
      ctx.lineWidth = Math.max(2, 3 * this.zoom);
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -this.pulsePhase * 24;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Node Core Sphere
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.1, pos.x, pos.y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.35, nodeColor);
    gradient.addColorStop(1, '#0b0f19');
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Border Stroke
    ctx.lineWidth = Math.max(1.5, (isSelected ? 3 : 2) * this.zoom);
    ctx.strokeStyle = isSelected ? '#ffffff' : nodeColor;
    ctx.stroke();

    // 3.5. Vòng Cung Năng Lượng (Progress Arc Ring) bao quanh node khi có tiến trình
    if (progress > 0) {
      const progressRadius = radius + Math.max(3.5, 4.5 * this.zoom);
      const startArc = -Math.PI / 2; // Bắt đầu từ 12h
      const endArc = startArc + progress * (Math.PI * 2);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, progressRadius, startArc, endArc);
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = Math.max(2.5, 3.5 * this.zoom);
      ctx.lineCap = 'round';
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = progress >= 1 ? 14 : 7;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Node Label Text (Tự động xuống dòng thông minh cân đối, chống bè ngang)
    const labelLines = wrapCanvasText(node.label || 'Node', isRoot ? 18 : 15, 3);
    const fontSize = Math.max(9.5, (isRoot ? 12.5 : 11) * this.zoom);
    const lineHeight = fontSize * 1.25;
    ctx.font = `${fontSize}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    labelLines.forEach((line, idx) => {
      ctx.fillText(line, pos.x, pos.y + radius + 7 + idx * lineHeight);
    });
    ctx.shadowBlur = 0; // Triệt tiêu rò rỉ Gaussian blur sang các icon và badge tiếp theo

    // 5. Status Badge on Top-Left (✓ hoặc ⚡)
    if (progress >= 1 || node.status === 'completed' || progress > 0 || node.status === 'learning') {
      const isCompleted = progress >= 1 || node.status === 'completed';
      const statusX = pos.x - radius * 0.7;
      const statusY = pos.y - radius * 0.7;
      const statusR = Math.max(7, 9.5 * this.zoom);

      ctx.beginPath();
      ctx.arc(statusX, statusY, statusR, 0, Math.PI * 2);
      ctx.fillStyle = isCompleted ? '#10b981' : nodeColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `${Math.max(7, 8.5 * this.zoom)}px sans-serif`;
      ctx.fillStyle = isCompleted ? '#ffffff' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isCompleted ? '✓' : '⚡', statusX, statusY);
    }

    // 6. Direct Link Icon Badge (🔗) on Top-Right
    if (node.url && node.url.trim()) {
      const badgeX = pos.x + radius * 0.7;
      const badgeY = pos.y - radius * 0.7;
      const badgeR = Math.max(7, 10 * this.zoom);

      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `${Math.max(8, 9 * this.zoom)}px sans-serif`;
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('↗', badgeX, badgeY);
    }

    // 7. Mini Notes Badge (📝) on Bottom-Left if node has notes
    if (nodeHasAnyNotes(node)) {
      const noteX = pos.x - radius * 0.7;
      const noteY = pos.y + radius * 0.7;
      const noteR = Math.max(7, 9.5 * this.zoom);

      ctx.beginPath();
      ctx.arc(noteX, noteY, noteR, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `${Math.max(7, 8.5 * this.zoom)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✎', noteX, noteY);
    }

    // 8. Mini Quiz AI Badge / Progress Counter on Bottom-Right
    const hasNotes = nodeHasAnyNotes(node);
    const quizX = pos.x + radius * 0.7;
    const quizY = pos.y + radius * 0.7;
    const quizR = Math.max(7, (progress > 0 && progress < 1 ? 11 : 9.5) * this.zoom);

    ctx.beginPath();
    ctx.arc(quizX, quizY, quizR, 0, Math.PI * 2);
    ctx.fillStyle = (progress > 0 && progress < 1) ? '#0f172a' : (progress >= 1 ? '#10b981' : (hasNotes ? '#f59e0b' : '#8b5cf6'));
    ctx.fill();
    ctx.strokeStyle = (progress > 0 && progress < 1) ? nodeColor : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (progress > 0 && progress < 1) {
      // Hiển thị nấc câu: ví dụ "1/3" hoặc "2/3"
      ctx.font = `bold ${Math.max(6.5, 7.5 * this.zoom)}px 'Outfit', sans-serif`;
      ctx.fillStyle = nodeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${passedCount}/${targetCount}`, quizX, quizY);
    } else {
      ctx.font = `${Math.max(7, 8.5 * this.zoom)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', quizX, quizY);
    }

    // 9. Toggle Collapse / Expand Badge (ở đỉnh trên node, chỉ hiện khi node có con)
    const hasChildren = this.nodes.some(n => n.parentId === node.id);
    if (hasChildren) {
      const toggleX = pos.x;
      const toggleY = pos.y - radius * 0.95;
      const isCollapsed = !!node.collapsed;
      const toggleR = Math.max(8, (isCollapsed ? 11 : 9) * this.zoom);

      ctx.beginPath();
      ctx.arc(toggleX, toggleY, toggleR, 0, Math.PI * 2);
      ctx.fillStyle = isCollapsed ? '#ef4444' : '#1e293b';
      ctx.shadowColor = isCollapsed ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = isCollapsed ? 8 : 4;
      ctx.fill();
      ctx.strokeStyle = isCollapsed ? '#ffffff' : '#64748b';
      ctx.lineWidth = isCollapsed ? 1.8 : 1.2;
      ctx.stroke();

      if (isCollapsed) {
        const count = getDescendantCount(node.id, this.nodes);
        ctx.font = `bold ${Math.max(7, 8.5 * this.zoom)}px 'Outfit', sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${count}`, toggleX, toggleY);
      } else {
        ctx.font = `bold ${Math.max(9, 10 * this.zoom)}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('−', toggleX, toggleY);
      }
    }

    // 10. Núm Tròn Kết Nối Dây (Connect Port ⚯) ở mép phải của node khi hover
    if (isHovered && !this.isConnectingWire && !this.isDraggingNode) {
      const portX = pos.x + radius + Math.max(10, 13 * this.zoom);
      const portY = pos.y;
      const portRadius = Math.max(8, 10 * this.zoom);
      const isPortHovered = this.connectPortHovered;

      ctx.beginPath();
      ctx.arc(portX, portY, portRadius * (isPortHovered ? 1.25 : 1), 0, Math.PI * 2);
      ctx.fillStyle = isPortHovered ? '#38bdf8' : 'rgba(15, 23, 42, 0.94)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = isPortHovered ? 14 : 6;
      ctx.fill();
      ctx.strokeStyle = isPortHovered ? '#ffffff' : '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = `bold ${Math.max(8.5, 9.5 * this.zoom) * (isPortHovered ? 1.2 : 1)}px sans-serif`;
      ctx.fillStyle = isPortHovered ? '#0f172a' : '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚯', portX, portY);

      if (isPortHovered) {
        this.drawTooltipBadge(
          ctx,
          'Kéo để nối cành (hoặc giữ Shift + kéo)',
          portX,
          portY - portRadius - 6,
          'rgba(15, 23, 42, 0.95)',
          '#38bdf8',
          '#38bdf8'
        );
      }
    }

    ctx.restore();
  }

  // ==========================================================================
  // 5. EVENT HANDLERS (PAN, ZOOM, DRAG)
  // ==========================================================================
  bindEvents() {
    this.onMouseDownBound = this.handleMouseDown.bind(this);
    this.onMouseMoveBound = this.handleMouseMove.bind(this);
    this.onMouseUpBound = this.handleMouseUp.bind(this);
    this.onWheelBound = this.handleWheel.bind(this);
    this.onDblClickBound = this.handleDoubleClick.bind(this);
    this.onResizeBound = () => this.initCanvasSize();
    this.onKeyDownBound = (e) => {
      if (e.key === 'Escape') {
        this.isConnectingWire = false;
        this.wireStartNode = null;
        this.wireTargetNode = null;
        this.potentialDropTargetNode = null;
      }
    };

    this.onContextMenuBound = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const clickedNode = this.findNodeAt(sx, sy);
      if (clickedNode) {
        this.selectedNodeId = clickedNode.id;
      }
      if (this.onContextMenuRequest) {
        this.onContextMenuRequest(clickedNode, e.clientX, e.clientY);
      }
    };

    this.canvas.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    this.canvas.addEventListener('wheel', this.onWheelBound, { passive: false });
    this.canvas.addEventListener('dblclick', this.onDblClickBound);
    this.canvas.addEventListener('contextmenu', this.onContextMenuBound);
    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('keydown', this.onKeyDownBound);
  }

  unbindEvents() {
    this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    this.canvas.removeEventListener('wheel', this.onWheelBound);
    this.canvas.removeEventListener('dblclick', this.onDblClickBound);
    if (this.onContextMenuBound) {
      this.canvas.removeEventListener('contextmenu', this.onContextMenuBound);
    }
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
  }

  findNodeAt(screenX, screenY) {
    const visibleNodes = this.getVisibleNodes();
    for (let i = visibleNodes.length - 1; i >= 0; i--) {
      const node = visibleNodes[i];
      const pos = this.worldToScreen(node.x, node.y);
      const isRoot = node.parentId === null;
      const radius = (isRoot ? ROOT_RADIUS : NODE_RADIUS) * this.zoom + 10;
      const dist = Math.hypot(screenX - pos.x, screenY - pos.y);
      if (dist <= radius) {
        return node;
      }
    }
    return null;
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    this.lastPointerPos = { x: sx, y: sy };
    this.hasMovedDrag = false;

    // 0. Kiểm tra nếu click trúng nút Cắt Cành ✂️
    const connHit = this.findConnectionAt(sx, sy);
    if (connHit && connHit.isCutButton) {
      const { child, parent } = connHit;
      if (child) {
        child.parentId = null;
        saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
        showToast(`Đã ngắt cành nối giữa "${parent ? parent.label : 'Cha'}" và "${child.label}"! ✂️`, 'info');
        this.hoveredConnection = null;
        this.isHoveringCutButton = false;
        return;
      }
    }

    const clickedNode = this.findNodeAt(sx, sy);
    if (clickedNode) {
      const pos = this.worldToScreen(clickedNode.x, clickedNode.y);
      const radius = (clickedNode.parentId === null ? ROOT_RADIUS : NODE_RADIUS) * this.zoom;
      const distToCenter = Math.hypot(sx - pos.x, sy - pos.y);

      // A. Kéo dây nối từ Núm ⚯ hoặc khi giữ phím Shift
      const portX = pos.x + radius + Math.max(10, 13 * this.zoom);
      const portY = pos.y;
      const portRadius = Math.max(8, 10 * this.zoom);
      const distToPort = Math.hypot(sx - portX, sy - portY);

      if (e.shiftKey || distToPort <= portRadius + 4) {
        this.isConnectingWire = true;
        this.wireStartNode = clickedNode;
        this.wireEndPos = { x: sx, y: sy };
        this.wireTargetNode = null;
        this.wireCycleBlocked = false;
        return;
      }

      // 0. Check if clicked the Toggle Collapse/Expand badge at top center
      const hasChildren = this.nodes.some(n => n.parentId === clickedNode.id);
      if (hasChildren) {
        const toggleX = pos.x;
        const toggleY = pos.y - radius * 0.95;
        const toggleR = Math.max(8, (clickedNode.collapsed ? 11 : 9) * this.zoom);
        const distToToggle = Math.hypot(sx - toggleX, sy - toggleY);
        if (distToToggle <= toggleR + 3) {
          clickedNode.collapsed = !clickedNode.collapsed;
          saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
          return;
        }
      }

      // 1. Check if clicked the URL badge on top-right of node
      const badgeX = pos.x + radius * 0.7;
      const badgeY = pos.y - radius * 0.7;
      const badgeR = Math.max(7, 10 * this.zoom);
      const distToBadge = Math.hypot(sx - badgeX, sy - badgeY);
      if (clickedNode.url && distToBadge <= badgeR && distToBadge < distToCenter) {
        window.open(clickedNode.url, '_blank');
        return;
      }

      // 2. Check if clicked the Notes badge on bottom-left (Chỉ mở khi click chính xác trúng badge cây bút)
      const noteX = pos.x - radius * 0.7;
      const noteY = pos.y + radius * 0.7;
      const noteR = Math.max(7, 9.5 * this.zoom);
      const distToNoteBadge = Math.hypot(sx - noteX, sy - noteY);
      if (nodeHasAnyNotes(clickedNode) && distToNoteBadge <= (noteR + 1) && distToNoteBadge < distToCenter) {
        if (this.onOpenNotepad) {
          this.onOpenNotepad(clickedNode);
          return;
        }
      }

      // 3. Check if clicked the Quiz AI badge on bottom-right (Kích hoạt khảo hạch AI cho MỌI node)
      const quizX = pos.x + radius * 0.7;
      const quizY = pos.y + radius * 0.7;
      const quizR = Math.max(7, 9.5 * this.zoom);
      const distToQuizBadge = Math.hypot(sx - quizX, sy - quizY);
      if (distToQuizBadge <= (quizR + 2) && distToQuizBadge < distToCenter) {
        if (this.onOpenQuiz) {
          this.onOpenQuiz(clickedNode);
          return;
        }
      }

      this.isDraggingNode = true;
      this.draggedNode = clickedNode;
      this.selectedNodeId = clickedNode.id;
      const worldPos = this.screenToWorld(sx, sy);
      this.dragOffset = { x: worldPos.x - clickedNode.x, y: worldPos.y - clickedNode.y };
    } else {
      this.isDraggingCanvas = true;
      this.selectedNodeId = null;
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // A. Đang kéo dây nối (Interactive Wire)
    if (this.isConnectingWire && this.wireStartNode) {
      this.wireEndPos = { x: sx, y: sy };
      const hovered = this.findNodeAt(sx, sy);
      if (hovered && hovered.id !== this.wireStartNode.id) {
        // Kiểm tra xem có bị chu trình không (nếu hovered là tổ tiên của startNode thì không thể nối)
        if (isAncestorOf(hovered.id, this.wireStartNode.id, this.nodes)) {
          this.wireTargetNode = hovered;
          this.wireCycleBlocked = true;
        } else {
          this.wireTargetNode = hovered;
          this.wireCycleBlocked = false;
        }
      } else {
        this.wireTargetNode = null;
        this.wireCycleBlocked = false;
      }
      this.canvas.style.cursor = 'crosshair';
      return;
    }

    // B. Đang kéo di chuyển node (Drag & Drop)
    if (this.isDraggingNode && this.draggedNode) {
      this.hasMovedDrag = true;
      const worldPos = this.screenToWorld(sx, sy);
      this.draggedNode.x = Math.round(worldPos.x - this.dragOffset.x);
      this.draggedNode.y = Math.round(worldPos.y - this.dragOffset.y);

      // Kiểm tra xem có đang rê chuột đè lên node khác không (để gợi ý nối)
      const targetUnderMouse = this.findNodeAt(sx, sy);
      if (targetUnderMouse && targetUnderMouse.id !== this.draggedNode.id) {
        if (!isAncestorOf(this.draggedNode.id, targetUnderMouse.id, this.nodes)) {
          this.potentialDropTargetNode = targetUnderMouse;
        } else {
          this.potentialDropTargetNode = null;
        }
      } else {
        this.potentialDropTargetNode = null;
      }

      this.canvas.style.cursor = this.potentialDropTargetNode ? 'copy' : 'grabbing';
      return;
    }

    // C. Đang kéo lia canvas (Pan)
    if (this.isDraggingCanvas) {
      this.hasMovedDrag = true;
      this.panX += (sx - this.lastPointerPos.x);
      this.panY += (sy - this.lastPointerPos.y);
      this.lastPointerPos = { x: sx, y: sy };
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // D. Trạng thái rê chuột bình thường (Hover check)
    this.hoveredNode = this.findNodeAt(sx, sy);

    // Kiểm tra hover vào Núm Kết Nối ⚯ ở mép phải của node
    this.connectPortHovered = false;
    if (this.hoveredNode) {
      const pos = this.worldToScreen(this.hoveredNode.x, this.hoveredNode.y);
      const isRoot = this.hoveredNode.parentId === null;
      const radius = (isRoot ? ROOT_RADIUS : NODE_RADIUS) * this.zoom;
      const portX = pos.x + radius + Math.max(10, 13 * this.zoom);
      const portY = pos.y;
      const portRadius = Math.max(8, 10 * this.zoom);
      if (Math.hypot(sx - portX, sy - portY) <= portRadius + 4) {
        this.connectPortHovered = true;
        this.canvas.style.cursor = 'crosshair';
        return;
      }
    }

    // Kiểm tra hover vào cành nối hoặc nút cắt ✂️
    const connHit = this.findConnectionAt(sx, sy);
    if (connHit) {
      this.hoveredConnection = connHit;
      this.isHoveringCutButton = connHit.isCutButton;
      this.canvas.style.cursor = connHit.isCutButton ? 'pointer' : 'crosshair';
      return;
    } else {
      this.hoveredConnection = null;
      this.isHoveringCutButton = false;
    }

    this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
  }

  handleMouseUp() {
    // 1. Kết thúc kéo dây nối (Wire Connection)
    if (this.isConnectingWire) {
      if (this.wireTargetNode && this.wireStartNode && this.wireTargetNode.id !== this.wireStartNode.id) {
        const startNode = this.wireStartNode;
        const targetNode = this.wireTargetNode;

        if (this.wireCycleBlocked) {
          showToast(`Không thể nối: "${targetNode.label}" là tổ tiên của "${startNode.label}"! 🚫`, 'warning');
        } else {
          // Nối targetNode làm con của startNode (kéo từ startNode sang targetNode)
          if (!isAncestorOf(targetNode.id, startNode.id, this.nodes)) {
            targetNode.parentId = startNode.id;
            saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
            showToast(`Đã nối "${targetNode.label}" vào "${startNode.label}"! 🔗`, 'success');
          } else if (!isAncestorOf(startNode.id, targetNode.id, this.nodes)) {
            startNode.parentId = targetNode.id;
            saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
            showToast(`Đã nối "${startNode.label}" vào "${targetNode.label}"! 🔗`, 'success');
          } else {
            showToast(`Không thể tạo vòng lặp vô tận! 🚫`, 'warning');
          }
        }
      }
      this.isConnectingWire = false;
      this.wireStartNode = null;
      this.wireTargetNode = null;
      this.wireCycleBlocked = false;
    }

    // 2. Kết thúc kéo thả node (Drag & Drop Node)
    if (this.isDraggingNode && this.draggedNode) {
      if (this.potentialDropTargetNode && this.potentialDropTargetNode.id !== this.draggedNode.id) {
        const dragged = this.draggedNode;
        const target = this.potentialDropTargetNode;

        if (!isAncestorOf(dragged.id, target.id, this.nodes)) {
          dragged.parentId = target.id;
          // Tách nhẹ vị trí nếu đang đè sát
          const dist = Math.hypot(dragged.x - target.x, dragged.y - target.y);
          if (dist < 90) {
            dragged.x = target.x + 130;
            dragged.y = target.y + 45;
          }
          saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
          showToast(`Đã nối "${dragged.label}" làm nhánh con của "${target.label}"! 🔗`, 'success');
        } else {
          showToast(`Không thể nối: Sẽ tạo vòng lặp vô tận! 🚫`, 'warning');
        }
      } else if (this.hasMovedDrag) {
        saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
      }
    }

    this.potentialDropTargetNode = null;
    this.isDraggingNode = false;
    this.draggedNode = null;
    this.isDraggingCanvas = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(0.3, this.zoom * zoomFactor), 2.5);

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
    this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
  }

  handleDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const node = this.findNodeAt(sx, sy);
    if (node && this.onNodeEditRequest) {
      this.onNodeEditRequest(node);
    }
  }

  zoomIn() {
    this.zoom = Math.min(2.5, this.zoom * 1.25);
  }

  zoomOut() {
    this.zoom = Math.max(0.3, this.zoom / 1.25);
  }

  resetZoom() {
    this.zoom = 1;
    this.centerOnRoot();
  }

  /**
   * Tự động tái bố cục cây tri thức thông minh (Smart Compact Layout):
   * Phân bổ góc theo trọng số lá (Sector Weighting) + Giải tỏa va chạm chống đè cục (Anti-Collision Relaxation)
   */
  autoLayoutCompactTree() {
    if (!this.nodes || this.nodes.length === 0) return;

    // 1. Xác định node gốc (root)
    const root = this.nodes.find(n => n.parentId === null) || this.nodes[0];
    if (!root) return;
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    // 2. Xây dựng cây phân cấp (childrenMap)
    const childrenMap = new Map();
    this.nodes.forEach(n => childrenMap.set(n.id, []));
    this.nodes.forEach(n => {
      if (n.parentId && childrenMap.has(n.parentId)) {
        childrenMap.get(n.parentId).push(n);
      }
    });

    // 3. Tính số lượng node lá (leaf weight) đệ quy cho từng nhánh
    const leafCountMap = new Map();
    const computeLeafCount = (nodeId) => {
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) {
        leafCountMap.set(nodeId, 1);
        return 1;
      }
      let sum = 0;
      for (const child of children) {
        sum += computeLeafCount(child.id);
      }
      leafCountMap.set(nodeId, sum);
      return sum;
    };
    computeLeafCount(root.id);

    // 4. Bố cục cây phân tán góc không chồng chéo (Non-overlapping Angular Allocation)
    root.x = 0;
    root.y = 0;

    const layoutSubtree = (parentNode, startAngle, endAngle, radius) => {
      const children = childrenMap.get(parentNode.id) || [];
      if (children.length === 0) return;

      const totalLeaves = leafCountMap.get(parentNode.id) || 1;
      const angleSpan = endAngle - startAngle;
      let currentAngle = startAngle;

      children.forEach((child, idx) => {
        const childLeaves = leafCountMap.get(child.id) || 1;
        const childFraction = childLeaves / Math.max(1, totalLeaves);
        const childSpan = childFraction * angleSpan;
        const childAngle = currentAngle + childSpan / 2;

        // Bán kính từng nhánh (so le nhẹ để không trùng bán kính)
        const dist = radius + (idx % 2 === 1 ? 25 : 0);
        child.x = Math.round(parentNode.x + Math.cos(childAngle) * dist);
        child.y = Math.round(parentNode.y + Math.sin(childAngle) * dist);

        // Góc mở cho các thế hệ con tiếp theo
        const nextSpan = Math.min(Math.PI * 1.3, Math.max(0.6, childSpan * 1.25));
        const nextStart = childAngle - nextSpan / 2;
        const nextEnd = childAngle + nextSpan / 2;
        const nextRadius = 165;

        layoutSubtree(child, nextStart, nextEnd, nextRadius);
        currentAngle += childSpan;
      });
    };

    const rootChildren = childrenMap.get(root.id) || [];
    if (rootChildren.length === 1) {
      // Nếu root chỉ có 1 con trực tiếp (như chỉ có 1 Chương):
      // Đặt con đó ở phía trên và CHO PHÉP CON ĐÓ MỞ 360 ĐỘ TOÀN DIỆN quanh nó
      const onlyChild = rootChildren[0];
      onlyChild.x = 0;
      onlyChild.y = -190;

      const grandChildren = childrenMap.get(onlyChild.id) || [];
      if (grandChildren.length > 0) {
        layoutSubtree(onlyChild, -Math.PI, Math.PI, 195);
      }
    } else {
      // Phân bổ 360 độ quanh root
      layoutSubtree(root, -Math.PI, Math.PI, 210);
    }

    // 5. Relaxation Pass: Giải tỏa va chạm vật lý chống đè cục (Anti-Collision Simulation)
    // Đảm bảo không có 2 node nào bị dồn đè lên nhau, nhãn text luôn có đủ không gian
    const MIN_DISTANCE = 115; // Bán kính cách ly an toàn giữa 2 tâm node
    const iterations = 60;

    for (let iter = 0; iter < iterations; iter++) {
      // A. Đẩy các node va chạm ra xa nhau
      for (let i = 0; i < this.nodes.length; i++) {
        const nA = this.nodes[i];
        for (let j = i + 1; j < this.nodes.length; j++) {
          const nB = this.nodes[j];
          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          const dist = Math.hypot(dx, dy) || 0.001;

          if (dist < MIN_DISTANCE) {
            const overlap = (MIN_DISTANCE - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;

            if (nA !== root) {
              nA.x -= nx * overlap;
              nA.y -= ny * overlap;
            }
            if (nB !== root) {
              nB.x += nx * overlap;
              nB.y += ny * overlap;
            }
          }
        }
      }

      // B. Lực kéo lò xo (Spring constraint) giữ node con gắn kết quanh cha, chống trôi dạt quá xa
      this.nodes.forEach(node => {
        if (!node.parentId || node === root) return;
        const parent = nodeMap.get(node.parentId);
        if (!parent) return;

        const dx = node.x - parent.x;
        const dy = node.y - parent.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const idealDist = 165;

        if (dist > 250) {
          const pull = (dist - idealDist) * 0.08;
          node.x -= (dx / dist) * pull;
          node.y -= (dy / dist) * pull;
        } else if (dist < 100) {
          const push = (idealDist - dist) * 0.08;
          node.x += (dx / dist) * push;
          node.y += (dy / dist) * push;
        }
      });
    }

    // 6. Làm tròn tọa độ sau khi hoàn tất
    this.nodes.forEach(n => {
      n.x = Math.round(n.x);
      n.y = Math.round(n.y);
    });

    // 7. Lưu lại tọa độ mới vào Database và căn giữa
    saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
    this.centerOnRoot();
  }
}
