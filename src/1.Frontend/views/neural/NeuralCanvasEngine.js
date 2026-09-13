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

// ==========================================================================
// 3. NEURAL CANVAS ENGINE CLASS
// ==========================================================================
export class NeuralCanvasEngine {
  constructor(canvasElement, subjectCode, nodes, onNodeEditRequest, onNodeAddChild, onOpenNotepad) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.subjectCode = subjectCode;
    this.nodes = Array.isArray(nodes) ? nodes : [];
    this.onNodeEditRequest = onNodeEditRequest;
    this.onNodeAddChild = onNodeAddChild;
    this.onOpenNotepad = onOpenNotepad;

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

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Grid Dots in Background
    this.drawBackgroundGrid(ctx);

    // 2. Draw Connections & Pulses
    this.drawConnections(ctx);

    // 3. Draw Nodes
    this.nodes.forEach(node => this.drawNode(ctx, node));
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

  drawConnections(ctx) {
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    this.nodes.forEach(node => {
      if (!node.parentId) return;
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

    ctx.save();

    // 1. Aura Glow
    const nodeColor = node.color || (node.status === 'completed' ? '#10b981' : (node.status === 'learning' ? '#f59e0b' : '#6366f1'));
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

    // 4. Node Label Text
    ctx.font = `${Math.max(10, (isRoot ? 13 : 11.5) * this.zoom)}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(node.label || 'Node', pos.x, pos.y + radius + 6);

    // 5. Status Badge on Top-Left (✓ hoặc ⚡)
    if (node.status === 'completed' || node.status === 'learning') {
      const isCompleted = node.status === 'completed';
      const statusX = pos.x - radius * 0.7;
      const statusY = pos.y - radius * 0.7;
      const statusR = Math.max(7, 9.5 * this.zoom);

      ctx.beginPath();
      ctx.arc(statusX, statusY, statusR, 0, Math.PI * 2);
      ctx.fillStyle = isCompleted ? '#10b981' : '#f59e0b';
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
    if (node.notes && node.notes.trim()) {
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
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
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

      // 1. Check if clicked the URL badge on top-right of node
      const badgeX = pos.x + radius * 0.7;
      const badgeY = pos.y - radius * 0.7;
      if (clickedNode.url && Math.hypot(sx - badgeX, sy - badgeY) <= 14 * this.zoom) {
        window.open(clickedNode.url, '_blank');
        return;
      }

      // 2. Check if clicked the Notes badge on bottom-left
      const noteX = pos.x - radius * 0.7;
      const noteY = pos.y + radius * 0.7;
      if (clickedNode.notes && Math.hypot(sx - noteX, sy - noteY) <= 14 * this.zoom) {
        if (this.onOpenNotepad) {
          this.onOpenNotepad(clickedNode);
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
}
