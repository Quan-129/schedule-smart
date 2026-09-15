// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { saveSubjectKnowledgeNodes } from '../../../3.Database/state.js';

// ==========================================================================
// 2. CONSTANTS & CONFIG
// ==========================================================================
const NODE_RADIUS = 26;
const ROOT_RADIUS = 34;
const PULSE_SPEED = 0.008;

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

    // Animation loop
    this.animationFrameId = null;
    this.pulsePhase = 0;

    this.initCanvasSize();
    this.centerOnRoot();
    this.bindEvents();
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
  // 4. RENDERING LOOP
  // ==========================================================================
  startRenderLoop() {
    const render = () => {
      this.pulsePhase = (this.pulsePhase + PULSE_SPEED) % 1;
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.unbindEvents();
  }

  getVisibleNodes() {
    return getVisibleNodes(this.nodes);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Grid Dots in Background
    this.drawBackgroundGrid(ctx);

    // 2. Visible nodes only (ẩn các nhánh con của node bị collapsed)
    const visibleNodes = this.getVisibleNodes();

    // 3. Draw Connections & Pulses
    this.drawConnections(ctx, visibleNodes);

    // 4. Draw Nodes
    visibleNodes.forEach(node => this.drawNode(ctx, node));
  }

  drawBackgroundGrid(ctx) {
    const gridSize = 40 * this.zoom;
    if (gridSize < 14) return;
    const startX = (this.panX % gridSize);
    const startY = (this.panY % gridSize);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = startX; x < this.width; x += gridSize) {
      for (let y = startY; y < this.height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawConnections(ctx, visibleNodes = this.nodes) {
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    const visibleSet = new Set(visibleNodes.map(n => n.id));

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

    // 1. Aura Glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + (isSelected ? 10 * this.zoom : 5 * this.zoom), 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? `${nodeColor}45` : (isHovered ? `${nodeColor}30` : `${nodeColor}18`);
    ctx.fill();

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

    this.canvas.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    this.canvas.addEventListener('wheel', this.onWheelBound, { passive: false });
    this.canvas.addEventListener('dblclick', this.onDblClickBound);
    window.addEventListener('resize', this.onResizeBound);
  }

  unbindEvents() {
    this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    this.canvas.removeEventListener('wheel', this.onWheelBound);
    this.canvas.removeEventListener('dblclick', this.onDblClickBound);
    window.removeEventListener('resize', this.onResizeBound);
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

    const clickedNode = this.findNodeAt(sx, sy);
    if (clickedNode) {
      const pos = this.worldToScreen(clickedNode.x, clickedNode.y);
      const radius = (clickedNode.parentId === null ? ROOT_RADIUS : NODE_RADIUS) * this.zoom;

      const distToCenter = Math.hypot(sx - pos.x, sy - pos.y);

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

    if (this.isDraggingNode && this.draggedNode) {
      this.hasMovedDrag = true;
      const worldPos = this.screenToWorld(sx, sy);
      this.draggedNode.x = Math.round(worldPos.x - this.dragOffset.x);
      this.draggedNode.y = Math.round(worldPos.y - this.dragOffset.y);
    } else if (this.isDraggingCanvas) {
      this.hasMovedDrag = true;
      this.panX += (sx - this.lastPointerPos.x);
      this.panY += (sy - this.lastPointerPos.y);
      this.lastPointerPos = { x: sx, y: sy };
    } else {
      this.hoveredNode = this.findNodeAt(sx, sy);
      this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
    }
  }

  handleMouseUp() {
    if (this.isDraggingNode && this.draggedNode && this.hasMovedDrag) {
      saveSubjectKnowledgeNodes(this.subjectCode, this.nodes);
    }
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
