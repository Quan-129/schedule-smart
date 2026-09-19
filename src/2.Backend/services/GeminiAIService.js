// ==========================================================================
// 1. IMPORTS & CONFIG
// ==========================================================================
const STORAGE_KEY_GEMINI = 'smart_schedule_gemini_api_key';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const BACKUP_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

// ==========================================================================
// 2. API KEY MANAGEMENT
// ==========================================================================
export function getGeminiApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY_GEMINI) || '';
  } catch (e) {
    return '';
  }
}

export function setGeminiApiKey(key) {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
    } else {
      localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
    }
    return true;
  } catch (e) {
    console.error('Không thể lưu Gemini API Key:', e);
    return false;
  }
}

/**
 * Kiểm tra tính hợp lệ và trạng thái kết nối của Google Gemini API Key
 * @param {string} key - API Key cần kiểm tra
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
export async function validateGeminiApiKey(key) {
  if (!key || !key.trim()) {
    return { valid: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' };
  }
  try {
    // Gọi endpoint models tổng quát để kiểm tra quyền truy cập của API Key
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key.trim())}`;
    const res = await fetch(url);
    if (res.ok) {
      return { valid: true, message: 'Kết nối thành công! Google Gemini 2.5 Flash đã sẵn sàng hoạt động.' };
    }
    const errData = await res.json().catch(() => ({}));
    const rawMsg = errData.error?.message || `Lỗi HTTP ${res.status}`;
    let friendlyMsg = rawMsg;
    if (rawMsg.includes('API key not valid')) {
      friendlyMsg = 'API Key không hợp lệ! Vui lòng kiểm tra lại ký tự copy từ Google AI Studio.';
    } else if (rawMsg.includes('Quota exceeded') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      friendlyMsg = 'API Key đã vượt quá hạn mức truy vấn miễn phí của Google trong phút này.';
    }
    return { valid: false, message: friendlyMsg };
  } catch (err) {
    return { valid: false, message: `Không thể kết nối tới Google: ${err.message}` };
  }
}

/**
 * Trích xuất toàn bộ văn bản sạch từ một node (Markdown + Visual Notes HTML)
 * @param {Object} node
 * @returns {string}
 */
export function extractNodeText(node) {
  if (!node) return '';
  let text = node.notes || '';
  if (node.visualNotes) {
    if (typeof node.visualNotes === 'string') {
      text += '\n' + node.visualNotes;
    } else if (typeof node.visualNotes === 'object' && node.visualNotes.html) {
      const visualClean = node.visualNotes.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();
      if (visualClean) text += '\n' + visualClean;
    }
  }
  return text.trim();
}

/**
 * Thuật toán Backtracking phả hệ tri thức nơ-ron (Truy ngược từ Node Hiện Tại ➔ Cha ➔ Ông ➔ ... ➔ Gốc)
 * @param {Array<Object>} allNodes - Danh sách toàn bộ node trong cây tri thức môn học
 * @param {string|Object} targetNodeOrId - Node mục tiêu hoặc ID của node mục tiêu
 * @returns {{
 *   targetNode: Object,
 *   ancestryPath: Array<Object>,
 *   breadcrumbList: Array<string>,
 *   breadcrumbStr: string,
 *   cumulativeNotes: string,
 *   hasTargetNotes: boolean,
 *   hasAnyAncestralNotes: boolean
 * }}
 */
export function traceNodeAncestryPath(allNodes, targetNodeOrId) {
  const nodes = Array.isArray(allNodes) ? allNodes : [];
  const targetId = (typeof targetNodeOrId === 'object' && targetNodeOrId !== null) ? targetNodeOrId.id : targetNodeOrId;
  const target = nodes.find(n => n.id === targetId) || (typeof targetNodeOrId === 'object' ? targetNodeOrId : { id: 'target', label: String(targetNodeOrId || 'Khái niệm') });

  // Backtracking ngược từ Target Node lên Root theo parentId
  const reverseChain = [target];
  let current = target;
  const visited = new Set([target.id]);

  while (current && current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    reverseChain.push(parent);
    current = parent;
  }

  // Đảo lại thứ tự từ Gốc ➔ Tầng 1 ➔ Tầng 2 ➔ ... ➔ Target Node
  const ancestryPath = reverseChain.reverse();
  const breadcrumbList = ancestryPath.map(n => n.label || 'Khái niệm');
  const breadcrumbStr = breadcrumbList.join(' ➔ ');

  const noteBlocks = [];
  let hasTargetNotes = false;
  let hasAnyAncestralNotes = false;

  ancestryPath.forEach((n, idx) => {
    const text = extractNodeText(n);
    const isTarget = (n.id === target.id);
    const depthLevel = (idx === 0) ? 'Node Gốc (Môn học/Gốc tri thức)' : (isTarget ? `Node Mục Tiêu (Cấp ${idx} - Trọng tâm khảo hạch)` : `Node Tổ Tiên (Cấp ${idx})`);

    if (isTarget && text) hasTargetNotes = true;
    if (!isTarget && text) hasAnyAncestralNotes = true;

    if (text) {
      noteBlocks.push(`### [${depthLevel}: "${n.label}"]\n${text}`);
    } else {
      noteBlocks.push(`### [${depthLevel}: "${n.label}"]\n*(Chưa có ghi chú văn bản riêng)*`);
    }
  });

  return {
    targetNode: target,
    ancestryPath,
    breadcrumbList,
    breadcrumbStr,
    cumulativeNotes: noteBlocks.join('\n\n'),
    hasTargetNotes,
    hasAnyAncestralNotes
  };
}

/**
 * Chuyển đổi một nguồn ảnh (Data URL Base64 hoặc HTTP/HTTPS/Blob URL) thành đối tượng { mimeType, base64 }
 * Tương thích cả Browser lẫn môi trường Node.js
 * @param {string} src
 * @returns {Promise<{ mimeType: string, base64: string } | null>}
 */
export async function convertImageSourceToBase64(src) {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();

  // 1. Nếu đã là Data URL Base64
  if (trimmed.startsWith('data:image/')) {
    const parts = trimmed.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64 = parts[1].trim();
    return base64 ? { mimeType, base64 } : null;
  }

  // 2. Nếu là URL từ xa (HTTP/HTTPS) hoặc Blob URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    try {
      if (typeof fetch === 'function') {
        const res = await fetch(trimmed, { mode: 'cors' });
        if (!res.ok) return null;
        const blob = await res.blob();
        const mimeType = blob.type || 'image/jpeg';

        if (typeof FileReader !== 'undefined') {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const resUrl = reader.result;
              if (typeof resUrl === 'string' && resUrl.startsWith('data:image/')) {
                const parts = resUrl.split(',');
                resolve(parts[1] ? { mimeType: (parts[0].match(/:(.*?);/)?.[1] || mimeType), base64: parts[1].trim() } : null);
              } else {
                resolve(null);
              }
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } else if (typeof blob.arrayBuffer === 'function') {
          const buffer = await blob.arrayBuffer();
          if (typeof Buffer !== 'undefined') {
            return {
              mimeType,
              base64: Buffer.from(buffer).toString('base64')
            };
          }
        }
      }
    } catch (err) {
      console.warn('[convertImageSourceToBase64] Không thể tải ảnh từ URL:', trimmed, err);
      return null;
    }
  }

  return null;
}

/**
 * Trích xuất toàn bộ nguồn ảnh từ một Node (visualNotes.images, visualNotes.html, notes markdown/html)
 * @param {Object} node
 * @param {Array<Object>} [extraActiveImages=[]]
 * @returns {Array<{ src: string, source: string, label: string }>}
 */
export function extractAllImageSourcesFromNode(node, extraActiveImages = []) {
  if (!node) return [];
  const sources = [];
  const seenSrc = new Set();

  const addSrc = (src, source) => {
    if (!src || typeof src !== 'string') return;
    const clean = src.trim();
    if (!clean) return;
    if (seenSrc.has(clean)) return;
    seenSrc.add(clean);
    sources.push({ src: clean, source, label: node.label || 'Ghi chú' });
  };

  // 1. Từ visualNotes.images (mảng ảnh dán trong visual editor)
  if (node.visualNotes && typeof node.visualNotes === 'object') {
    if (Array.isArray(node.visualNotes.images)) {
      node.visualNotes.images.forEach(img => {
        if (img && img.src) addSrc(img.src, 'visualNotes.images');
      });
    }
  }

  // 2. Từ extraActiveImages (ảnh đang có trong editor chưa kịp lưu)
  if (Array.isArray(extraActiveImages)) {
    extraActiveImages.forEach(img => {
      if (img && img.src) addSrc(img.src, 'activeEditor.images');
    });
  }

  // 3. Từ visualNotes.html (thẻ <img src="...">)
  if (node.visualNotes && typeof node.visualNotes === 'object' && typeof node.visualNotes.html === 'string') {
    const imgTagMatches = node.visualNotes.html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const match of imgTagMatches) {
      if (match[1]) addSrc(match[1], 'visualNotes.html');
    }
  }

  // 4. Từ node.notes (Markdown images ![alt](url) và thẻ <img>)
  if (typeof node.notes === 'string' && node.notes.trim()) {
    // Markdown syntax ![...](url)
    const mdMatches = node.notes.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s\)]+|data:image\/[^\s\)]+)\)/gi);
    for (const match of mdMatches) {
      if (match[1]) addSrc(match[1], 'notes.markdown');
    }
    // HTML <img> in markdown
    const htmlMatches = node.notes.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const match of htmlMatches) {
      if (match[1]) addSrc(match[1], 'notes.html');
    }
  }

  return sources;
}

/**
 * Thu thập toàn diện cấu trúc ngữ cảnh của một Node: Bao gồm phả hệ tổ tiên, chính nó, toàn bộ các node con gần nhất
 * và ĐẶC BIỆT LÀ TOÀN BỘ HÌNH ẢNH ĐỀ BÀI/GHI CHÚ (Multimodal Vision Hierarchical Context)
 * @param {Array<Object>} allNodes - Toàn bộ danh sách node trong môn học
 * @param {string|Object} targetNodeOrId - Node hiện tại hoặc ID của node
 * @param {string} [activeText=''] - Văn bản đang soạn thảo trực tiếp của node hiện tại (nếu có)
 * @param {Array<Object>} [activeImages=[]] - Danh sách ảnh đang soạn thảo trong visual editor (nếu có)
 * @returns {Promise<{
 *   targetNode: Object,
 *   isParentNode: boolean,
 *   directChildren: Array<Object>,
 *   breadcrumbStr: string,
 *   comprehensiveNotes: string,
 *   allVisualImages: Array<Object>
 * }>}
 */
export async function collectNodeHierarchyContext(allNodes, targetNodeOrId, activeText = '', activeImages = []) {
  const nodes = Array.isArray(allNodes) ? allNodes : [];
  const targetId = (typeof targetNodeOrId === 'object' && targetNodeOrId !== null) ? targetNodeOrId.id : targetNodeOrId;
  const target = nodes.find(n => n.id === targetId) || (typeof targetNodeOrId === 'object' ? targetNodeOrId : { id: 'target', label: String(targetNodeOrId || 'Khái niệm') });

  // 1. Phả hệ tổ tiên (Ancestry path)
  const ancestry = traceNodeAncestryPath(nodes, target);

  // 2. Nội dung của chính node này
  const selfText = (activeText || extractNodeText(target) || '').trim();

  // 3. Tìm các node con gần nhất (Direct Children)
  const directChildren = nodes.filter(n => n && n.parentId === target.id && n.id !== target.id);
  const isParentNode = directChildren.length > 0;

  // 4. Thu thập toàn bộ hình ảnh thị giác (Multimodal Vision) từ Node Cha và các Node Con
  const allVisualImages = [];
  const seenBase64 = new Set();

  // 4.1. Lấy ảnh của chính Node Hiện Tại (Node Cha)
  const targetImgSources = extractAllImageSourcesFromNode(target, activeImages);
  for (const srcObj of targetImgSources) {
    const conv = await convertImageSourceToBase64(srcObj.src);
    if (conv && conv.base64 && !seenBase64.has(conv.base64)) {
      seenBase64.add(conv.base64);
      allVisualImages.push({
        mimeType: conv.mimeType,
        base64: conv.base64,
        nodeLabel: target.label || 'Node Hiện Tại',
        nodeId: target.id,
        isSelf: true
      });
    }
  }

  // 4.2. Xây dựng các khối nội dung tổng hợp
  const blocks = [];

  if (ancestry.breadcrumbStr) {
    blocks.push(`🧭 [VỊ TRÍ PHẢ HỆ TRI THỨC MÔN HỌC]: ${ancestry.breadcrumbStr}`);
  }

  const selfImageCount = allVisualImages.filter(img => img.isSelf).length;
  const selfImgNotice = selfImageCount > 0
    ? `\n🖼️ [ĐÍNH KÈM ${selfImageCount} HÌNH ẢNH CỦA CHÍNH NODE NÀY]: Đã nạp vào dữ liệu thị giác đính kèm bên dưới.`
    : '';

  blocks.push(`📌 [NODE HIỆN TẠI (ĐANG HỎI ĐÁP)]: "${target.label || 'Chính nó'}"
${selfText || '*(Node này chưa có ghi chú văn bản riêng, trọng tâm kiến thức chi tiết nằm tại các node con gần nhất bên dưới)*'}${selfImgNotice}`);

  // 4.3. Duyệt qua từng node con gần nhất để lấy văn bản và ảnh đề bài
  if (isParentNode) {
    const childBlocks = [];

    for (let idx = 0; idx < directChildren.length; idx++) {
      const child = directChildren[idx];
      const childText = extractNodeText(child);
      const childImgSources = extractAllImageSourcesFromNode(child);
      const childImgs = [];

      for (const srcObj of childImgSources) {
        const conv = await convertImageSourceToBase64(srcObj.src);
        if (conv && conv.base64 && !seenBase64.has(conv.base64)) {
          seenBase64.add(conv.base64);
          const imgItem = {
            mimeType: conv.mimeType,
            base64: conv.base64,
            nodeLabel: child.label || `Node Con ${idx + 1}`,
            nodeId: child.id,
            isChild: true
          };
          childImgs.push(imgItem);
          allVisualImages.push(imgItem);
        }
      }

      let childDesc = childText;
      if (childImgs.length > 0) {
        const imgNotice = `🖼️ [DỮ LIỆU ĐỀ BÀI / HÌNH ẢNH CỦA "${child.label}"]:
Node con này có ${childImgs.length} hình ảnh chứa ĐỀ BÀI, CÂU HỎI hoặc BÀI TẬP VÍ DỤ. Toàn bộ hình ảnh này đã được nạp trực tiếp vào dữ liệu thị giác đính kèm (được gắn nhãn: "${child.label}").
BẠN BẮT BUỘC PHẢI "NHÌN VÀ QUAN SÁT TỪNG CON CHỮ TRÊN HÌNH ẢNH NÀY" để đọc toàn bộ đề bài, phương trình, yêu cầu và số liệu của ${child.label}!`;
        childDesc = childDesc ? `${childDesc}\n\n${imgNotice}` : imgNotice;
      } else if (!childDesc) {
        childDesc = '*(Node con này chưa có văn bản riêng hay hình ảnh đính kèm)*';
      }

      childBlocks.push(`🌿 [NODE CON GẦN NHẤT ${idx + 1}: "${child.label || 'Nhánh con'}"]
${childDesc}`);
    }

    blocks.push(`📂 [TOÀN BỘ NGỮ CẢNH CỦA CÁC NODE CON GẦN NHẤT THUỘC "${target.label}" (${directChildren.length} nhánh kiến thức)]:
Dưới đây là TOÀN BỘ NGỮ CẢNH CHI TIẾT của các node con gần nhất trực thuộc node cha này (bao gồm cả ghi chú văn bản và các đề bài dạng hình ảnh đính kèm). Bạn BẮT BUỘC PHẢI đọc cả văn bản và nhìn từng tấm ảnh đính kèm của từng node con để trả lời đầy đủ, viết lại đề bài chính xác và giải thích bản chất câu hỏi của sinh viên:

${childBlocks.join('\n\n')}`);
  }

  return {
    targetNode: target,
    isParentNode,
    directChildren,
    breadcrumbStr: ancestry.breadcrumbStr,
    comprehensiveNotes: blocks.join('\n\n'),
    allVisualImages
  };
}

// ==========================================================================
// 3. AI GENERATION ENGINE (VỚI HIERARCHICAL CONTEXT BACKTRACKING)
// ==========================================================================

/**
 * Sinh câu hỏi trắc nghiệm Active Recall có truy ngược phả hệ ngữ cảnh nơ-ron
 * @param {string|Object} nodeOrLabel - Node mục tiêu hoặc tên node
 * @param {string|Array<Object>} notesOrAllNodes - Toàn bộ nodes của môn hoặc chuỗi ghi chú
 * @param {number} attemptIndex - Số thứ tự lần sinh câu hỏi (xoay vòng góc độ)
 * @param {Array<Object>} [maybeAllNodes] - Danh sách toàn bộ node nếu truyền theo signature cũ
 * @returns {Promise<Object>}
 */
export async function generateQuizFromNodeKnowledge(nodeOrLabel, notesOrAllNodes, attemptIndex = 0, maybeAllNodes = null) {
  const apiKey = getGeminiApiKey();

  // Chuẩn hóa tham số đầu vào
  let targetNode = null;
  let allNodes = [];
  let fallbackNotes = '';

  if (typeof nodeOrLabel === 'object' && nodeOrLabel !== null) {
    targetNode = nodeOrLabel;
    allNodes = Array.isArray(notesOrAllNodes) ? notesOrAllNodes : (Array.isArray(maybeAllNodes) ? maybeAllNodes : [targetNode]);
  } else {
    const label = String(nodeOrLabel || 'Khái niệm');
    fallbackNotes = typeof notesOrAllNodes === 'string' ? notesOrAllNodes : '';
    allNodes = Array.isArray(maybeAllNodes) ? maybeAllNodes : [];
    targetNode = allNodes.find(n => n.label === label) || { id: 'temp', label, notes: fallbackNotes };
  }

  // Thực hiện truy ngược phả hệ tri thức (Backtracking 4 ➔ 3 ➔ 2 ➔ 1 ➔ Gốc)
  const ancestry = traceNodeAncestryPath(allNodes, targetNode);
  const targetLabel = ancestry.targetNode?.label || 'Khái niệm';
  const combinedContext = ancestry.cumulativeNotes || fallbackNotes || `Khái niệm: ${targetLabel}`;

  // Nếu chưa có API Key -> Dùng Fallback generator thông minh dựa trên ngữ cảnh phả hệ
  if (!apiKey) {
    const fallback = generateFallbackQuiz(targetLabel, combinedContext, 'demo_no_key', attemptIndex);
    fallback.ancestryBreadcrumb = ancestry.breadcrumbStr;
    fallback.ancestryDepth = ancestry.ancestryPath.length;
    fallback.ancestryList = ancestry.breadcrumbList;
    return fallback;
  }

  const prompt = `
Bạn là chuyên gia sư phạm đại học và cố vấn học tập hàng đầu theo phương pháp Active Recall & Phân tích chẩn đoán bẫy tư duy (Diagnostic Testing).

🎯 KHÁI NIỆM MỤC TIÊU CẦN KHẢO HẠCH: "${targetLabel}"

🌳 VỊ TRÍ PHÂN CẤP TRI THỨC TRONG CÂY NƠ-RON (BREADCRUMB PHẢ HỆ TỪ GỐC ĐẾN NGỌN):
${ancestry.breadcrumbStr || targetLabel}

📚 TỔNG HỢP NGỮ CẢNH TRI THỨC THEO DÒNG PHẢ HỆ (TỪ NODE GỐC ➔ CÁC NODE TỔ TIÊN CẤP TRÊN ➔ NODE MỤC TIÊU):
"""
${combinedContext.slice(0, 4200)}
"""

Hãy tạo ĐÚNG 1 câu hỏi trắc nghiệm chất lượng cao bám sát khái niệm "${targetLabel}".
Yêu cầu sư phạm bắt buộc:
1. ĐÂY LÀ LẦN KHẢO HẠCH THỨ ${attemptIndex + 1}. Khai thác một GÓC ĐỘ MỚI LẠ xoay quanh khái niệm "${targetLabel}".
2. TƯ DUY NGỮ CẢNH PHẢ HỆ (BACKTRACKING CONTEXT):
   - Đặt khái niệm "${targetLabel}" trong mối quan hệ hữu cơ với chuỗi phân cấp cấp trên (${ancestry.breadcrumbStr}).
   - Dù khái niệm mục tiêu có ít ghi chú hoặc chưa có ghi chú riêng, HÃY DỰA VÀO BỐI CẢNH LÝ THUYẾT VÀ NGUYÊN LÝ CỦA CÁC NODE CẤP TRÊN ĐỂ RA ĐỀ CHÍNH XÁC VỀ BẢN CHẤT CỦA "${targetLabel}".
   - Tạo câu hỏi tình huống thực tế hoặc nhận định đa chiều, kiểm tra khả năng vận dụng của sinh viên.
3. Có đúng 4 lựa chọn A, B, C, D (trong đó có 1 đáp án đúng và 3 đáp án nhiễu có bẫy tinh vi). Hãy xáo trộn ngẫu nhiên vị trí đáp án đúng (không cố định ở A).
4. Bóc tách sâu sắc: Khái niệm cốt lõi, Lời giải thích, Bẫy/Sai lầm thường gặp mà sinh viên hay mắc phải, và Quy tắc/Bản chất cần nhớ (công thức hoặc chuỗi mũi tên ngắn gọn).
5. Trả về ĐÚNG 1 CHUỖI JSON thuần túy (KHÔNG dùng markdown codeblock, KHÔNG có bất kỳ lời chào nào ngoài JSON).

Cấu trúc JSON bắt buộc:
{
  "question": "Nội dung câu hỏi tình huống hoặc nhận định trắc nghiệm...",
  "options": [
    "A. Nội dung lựa chọn A",
    "B. Nội dung lựa chọn B",
    "C. Nội dung lựa chọn C",
    "D. Nội dung lựa chọn D"
  ],
  "correctIndex": 0,
  "coreConcept": "Tên khái niệm cốt lõi (liên hệ với chuỗi phả hệ)",
  "explanation": "Giải thích chi tiết tại sao đáp án này đúng theo lập luận logic...",
  "trap": "Bẫy đề thi & Sai lầm tư duy thường gặp (tại sao sinh viên dễ chọn nhầm phương án khác)...",
  "rule": "Quy tắc / Bản chất cốt lõi cần nhớ (dạng chuỗi: Bước 1 ➔ Bước 2 ➔ Bước 3 hoặc công thức)",
  "source": "Trích dẫn chuỗi phả hệ hoặc tài liệu bài học"
}
`;

  let lastErrMsg = '';
  for (const model of BACKUP_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.88,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastErrMsg = errData.error?.message || `HTTP ${response.status}`;
        console.warn(`Gemini Model ${model} Error:`, lastErrMsg);
        // Nếu lỗi là model not found -> thử model tiếp theo trong danh sách
        if (lastErrMsg.includes('not found') || lastErrMsg.includes('NOT_FOUND')) {
          continue;
        }
        break;
      }

      const rawQuizParts = data.candidates?.[0]?.content?.parts;
      const candidateText = Array.isArray(rawQuizParts)
        ? rawQuizParts.map(p => p.text || '').join('')
        : (rawQuizParts?.[0]?.text || '');
      
      // Parse JSON
      let cleaned = candidateText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      parsed.id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      parsed.createdAt = new Date().toISOString();
      parsed.isAiGenerated = true;
      parsed.modelUsed = model;
      parsed.ancestryBreadcrumb = ancestry.breadcrumbStr;
      parsed.ancestryDepth = ancestry.ancestryPath.length;
      parsed.ancestryList = ancestry.breadcrumbList;
      parsed.hasTargetNotes = ancestry.hasTargetNotes;
      parsed.hasAnyAncestralNotes = ancestry.hasAnyAncestralNotes;
      return parsed;
    } catch (error) {
      lastErrMsg = error.message;
      console.warn(`Lỗi khi gọi model ${model}:`, error);
    }
  }

  // Nếu tất cả model đều thất bại hoặc lỗi Key -> Chuyển Fallback và hiển thị rõ thông báo lỗi
  const fallback = generateFallbackQuiz(targetLabel, combinedContext, `error_${lastErrMsg}`, attemptIndex);
  fallback.apiError = lastErrMsg;
  fallback.ancestryBreadcrumb = ancestry.breadcrumbStr;
  fallback.ancestryDepth = ancestry.ancestryPath.length;
  fallback.ancestryList = ancestry.breadcrumbList;
  fallback.hasTargetNotes = ancestry.hasTargetNotes;
  fallback.hasAnyAncestralNotes = ancestry.hasAnyAncestralNotes;
  return fallback;
}

// ==========================================================================
// 4. FALLBACK / MOCK GENERATOR (KHI CHƯA CÓ KEY HOẶC LỖI MẠNG)
// ==========================================================================
export function generateFallbackQuiz(nodeLabel, notesContent, reason = 'demo', attemptIndex = 0) {
  const cleanNotes = (notesContent || '').replace(/<[^>]*>/g, ' ').replace(/[#*_`]/g, '').trim();
  const title = nodeLabel || 'Kiến thức cốt lõi';
  
  // Tách các câu từ ghi chú để làm ngữ liệu mẫu
  const sentences = cleanNotes.split(/[.\n;!?]+/).map(s => s.trim()).filter(s => s.length > 12);
  const totalSentences = sentences.length || 1;

  const s1 = sentences[attemptIndex % totalSentences] || `Nội dung cốt lõi của chuyên đề ${title}`;
  const s2 = sentences[(attemptIndex + 1) % totalSentences] || `Các nguyên lý và ràng buộc cơ bản trong ${title}`;
  const s3 = sentences[(attemptIndex + 2) % totalSentences] || `Phương pháp ứng dụng thực tiễn của ${title}`;

  // 4 Archetypes câu hỏi phong phú
  const archetypes = [
    // Góc độ 1: Tiến trình & Bản chất
    {
      question: `Trong quá trình tiếp cận chuyên đề "${title}", nhận định nào sau đây phản ánh chính xác nhất bản chất và quy luật vận hành?`,
      correct: `${s1} đóng vai trò điều kiện tiên quyết, định hình và dẫn dắt toàn bộ tiến trình áp dụng thực tế.`,
      distractors: [
        `${title} chỉ là thủ tục mang tính hình thức, hoàn toàn có thể lược bỏ khi đã có đủ nguồn lực ban đầu.`,
        `${s2} là yếu tố tách rời và không chịu sự chi phối của các nguyên lý cốt lõi trong hệ thống.`,
        `Mọi quyết định đều phải được chốt cứng ngay từ khâu đầu tiên mà không trải qua bước đánh giá khả thi.`
      ],
      coreConcept: `${title} (Mô hình bản chất & Chuỗi tiến trình)`,
      explanation: `Dựa trên cơ sở lý luận, ${s1} giữ vai trò trọng tâm dẫn dắt, tạo nền tảng vững chắc để chuyển hóa nhận thức lý thuyết thành hành động thực tế hiệu quả.`,
      trap: `Sinh viên thường ngộ nhận rằng ${title} có thể đốt cháy giai đoạn, bỏ qua mắt xích logic cốt lõi.`,
      rule: `${title} là chuỗi tương tác hữu cơ: Nhận diện ➔ Đánh giá & Thẩm định ➔ Triển khai thực thi`
    },
    // Góc độ 2: Phân tích Sai lầm & Bẫy tư duy
    {
      question: `Khi giải quyết vấn đề liên quan đến "${title}", sai lầm phổ biến nhất mà người học hoặc người thực hành hay mắc phải là gì?`,
      correct: `Tập trung phiến diện vào bề nổi của kết quả mà bỏ qua cơ chế chi phối: ${s2}.`,
      distractors: [
        `Luôn tuân thủ nghiêm ngặt quy trình chuẩn mực và tiến hành kiểm tra chéo ở từng giai đoạn.`,
        `Xác định rõ ràng mục tiêu và đánh giá đúng mức độ tương thích giữa nguồn lực và phương pháp.`,
        `Dành thời gian nghiên cứu kỹ lưỡng các nguyên lý nền tảng trước khi bắt tay vào thực hiện.`
      ],
      coreConcept: `${title} (Chẩn đoán ngộ nhận tư duy)`,
      explanation: `Sai lầm cốt tử là chỉ nhìn vào hiện tượng bề mặt mà coi nhẹ ${s2}. Điều này dẫn đến các quyết định chắp vá và thất bại khi gặp tình huống phức tạp.`,
      trap: `Dễ nhầm lẫn giữa "làm nhanh" với "làm đúng bản chất", dẫn đến việc bỏ qua các bước kiểm soát cốt lõi.`,
      rule: `Nguyên tắc phòng ngừa bẫy: Cốt lõi quyết định hình thức ➔ Bản chất định hình giải pháp`
    },
    // Góc độ 3: Tình huống Ứng dụng & Ra quyết định
    {
      question: `Giả sử bạn đang phụ trách một dự án thực tế về "${title}". Để đảm bảo tính bền vững và tối ưu, bước can thiệp mang tính đòn bẩy nhất là:`,
      correct: `Vận dụng ${s3 || s1} để thiết lập hệ quy chiếu chuẩn và tối ưu hóa chu trình phối hợp.`,
      distractors: [
        `Tăng tốc độ triển khai bất chấp các cảnh báo về xung đột nguyên lý và thiếu hụt dữ liệu đầu vào.`,
        `Sao chép nguyên xi mô hình của đơn vị khác mà không tính đến các ràng buộc đặc thù của hệ thống.`,
        `Cắt giảm toàn bộ thời gian đánh giá để tập trung 100% nhân lực cho khâu nghiệm thu sản phẩm.`
      ],
      coreConcept: `${title} (Phương pháp đòn bẩy trong thực hành)`,
      explanation: `Điểm tựa đòn bẩy hiệu quả nhất luôn xuất phát từ việc vận dụng đúng ${s3 || s1}, giúp giảm thiểu chi phí sửa sai và nâng cao hiệu suất toàn diện.`,
      trap: `Tâm lý "đi tắt đón đầu" sai cách, sao chép máy móc giải pháp mà không thấu hiểu bài toán cốt lõi.`,
      rule: `Đòn bẩy thực thi: Đúng nguyên tắc nền tảng ➔ Giảm thiểu 80% rủi ro phát sinh`
    },
    // Góc độ 4: So sánh & Giới hạn phạm vi
    {
      question: `Điểm phân định then chốt giữa việc hiểu đúng và hiểu sai về phạm vi ảnh hưởng của "${title}" nằm ở nhận thức nào?`,
      correct: `Hiểu rõ ${title} có ranh giới áp dụng rõ ràng và phải dựa trên điều kiện: ${s1}.`,
      distractors: [
        `Cho rằng ${title} là công thức vạn năng, có thể giải quyết được tất cả các bài toán mà không cần điều kiện.`,
        `Xem nhẹ tính hệ thống và coi ${title} chỉ là một tập hợp các mẹo vặt rời rạc không liên kết.`,
        `Khẳng định rằng lý thuyết không có bất kỳ giá trị ứng dụng nào trong môi trường thực tiễn.`
      ],
      coreConcept: `${title} (Điều kiện biên & Giới hạn áp dụng)`,
      explanation: `Mọi lý thuyết khoa học đều có điều kiện biên. Nhận thức sâu sắc về ${title} đòi hỏi phải gắn liền với điều kiện tiên quyết: ${s1}.`,
      trap: `Bẫy "tuyệt đối hóa" lý thuyết, áp dụng mù quáng vào những bối cảnh không thỏa mãn điều kiện tiên quyết.`,
      rule: `Ranh giới khoa học: Xác định tiền đề trước ➔ Áp dụng phương pháp sau`
    }
  ];

  // Chọn archetype xoay vòng theo attemptIndex
  const selectedArchetype = archetypes[attemptIndex % archetypes.length];

  // Xáo trộn vị trí đáp án đúng (correctIndex ngẫu nhiên từ 0 đến 3)
  const correctIndex = (attemptIndex + 1) % 4;
  const distractorPool = [
    selectedArchetype.distractors[0],
    selectedArchetype.distractors[1],
    selectedArchetype.distractors[2]
  ];
  let distractorIdx = 0;

  const shuffledOptions = [];
  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      shuffledOptions.push(selectedArchetype.correct);
    } else {
      shuffledOptions.push(distractorPool[distractorIdx++]);
    }
  }

  const prefixLabels = ['A', 'B', 'C', 'D'];
  const formattedOptions = shuffledOptions.map((opt, i) => `${prefixLabels[i]}. ${opt}`);

  return {
    id: `quiz_fallback_${Date.now()}_${attemptIndex}_${Math.random().toString(36).substring(2, 6)}`,
    isFallback: true,
    fallbackReason: reason,
    attemptNumber: attemptIndex + 1,
    question: selectedArchetype.question,
    options: formattedOptions,
    correctIndex: correctIndex,
    coreConcept: selectedArchetype.coreConcept,
    explanation: selectedArchetype.explanation,
    trap: selectedArchetype.trap,
    rule: selectedArchetype.rule,
    source: `Trích xuất từ ghi chú môn học: "${s1.slice(0, 80)}..."`,
    createdAt: new Date().toISOString()
  };
}

// ==========================================================================
// 4. CONTEXTUAL NOTE COPILOT ENGINE (HỎI ĐÁP THEO NGỮ CẢNH GHI CHÚ)
// ==========================================================================

/**
 * Hỏi đáp AI chuyên sâu theo ngữ cảnh toàn bài ghi chú (Contextual Note Q&A)
 * AI tiếp thu toàn bộ bài ghi chú + phả hệ nơ-ron môn học để nắm chắc định nghĩa và bối cảnh,
 * sau đó tập trung phân tích sâu sắc đoạn trích (focalText) theo câu hỏi của sinh viên.
 *
 * @param {Object} params
 * @param {string} [params.subjectCode] - Mã môn học
 * @param {Object} [params.targetNode] - Node nơ-ron hiện tại
 * @param {Array<Object>} [params.allNodes] - Toàn bộ node nơ-ron của môn học
 * @param {string} [params.fullContext] - Toàn văn ghi chú của node (Markdown + Visual)
 * @param {string} params.focalText - Đoạn văn bản hoặc trích đoạn đang được bôi đen
 * @param {Array<Object>} [params.focalImages] - Danh sách ảnh trích xuất từ vùng khoanh hoặc bài ghi chú [{ mimeType, base64 }]
 * @param {string} params.userQuestion - Câu hỏi hoặc yêu cầu của sinh viên
 * @param {Array<Object>} [params.chatHistory] - Lịch sử hội thoại trước đó [{ role: 'user'|'model', text: string }]
 * @returns {Promise<{ text: string, modelUsed: string, ancestryBreadcrumb: string }>}
 */
export async function askContextualNoteQuestion({
  subjectCode = '',
  targetNode = null,
  allNodes = [],
  fullContext = '',
  focalText = '',
  focalImages = [],
  activeImages = [],
  userQuestion = '',
  chatHistory = []
}) {
  const apiKey = getGeminiApiKey();

  // Phân tích toàn diện phân cấp tri thức nơ-ron (chính nó, tổ tiên, toàn bộ node con gần nhất và ảnh đính kèm)
  const nodes = Array.isArray(allNodes) ? allNodes : [];
  const node = targetNode || { label: 'Ghi chú học tập' };
  const hierarchy = await collectNodeHierarchyContext(nodes, node, fullContext, activeImages);
  const targetLabel = node.label || 'Khái niệm';
  const breadcrumb = hierarchy.breadcrumbStr || targetLabel;

  // Gộp thêm ảnh: Ưu tiên ảnh vùng khoanh (focalImages), sau đó nạp toàn bộ ảnh từ các node con và node cha
  // Mở rộng giới hạn lên 16 ảnh để nạp đủ toàn bộ ảnh đề bài của Câu 1, Câu 2, Câu 3, Câu 4, Câu 5...
  const MAX_AI_IMAGES = 16;
  const effectiveFocalImages = [...(Array.isArray(focalImages) ? focalImages : [])];
  const seenBase64 = new Set(effectiveFocalImages.map(img => img.base64 ? img.base64.slice(0, 100) : ''));

  if (Array.isArray(hierarchy.allVisualImages)) {
    for (const vImg of hierarchy.allVisualImages) {
      if (effectiveFocalImages.length >= MAX_AI_IMAGES) break;
      const sig = vImg.base64 ? vImg.base64.slice(0, 100) : '';
      if (sig && !seenBase64.has(sig)) {
        seenBase64.add(sig);
        effectiveFocalImages.push(vImg);
      }
    }
  }

  // Tổng hợp toàn cảnh ghi chú (kết hợp cả chính nó và toàn bộ các node con gần nhất)
  const effectiveFullNotes = (hierarchy.comprehensiveNotes || fullContext || extractNodeText(node) || '').trim();

  // Nếu chưa cấu hình API Key, thông báo hướng dẫn người dùng
  if (!apiKey) {
    return {
      text: `⚠️ **Chưa cấu hình Google Gemini API Key!**\n\nĐể AI có thể đọc toàn bộ ghi chú và giải thích chuyên sâu đoạn trích này, bạn vui lòng:\n1. Mở Cài đặt hoặc modal API Key.\n2. Lấy API Key miễn phí từ [Google AI Studio](https://aistudio.google.com/app/apikey).\n3. Dán vào hệ thống để kích hoạt trợ lý AI Copilot.\n\n*Trích đoạn bạn vừa chọn:* "${focalText.slice(0, 100)}${focalText.length > 100 ? '...' : ''}"`,
      modelUsed: 'none',
      ancestryBreadcrumb: breadcrumb
    };
  }

  // Hướng dẫn Multimodal Vision nếu có ảnh đính kèm
  const hasImages = Array.isArray(effectiveFocalImages) && effectiveFocalImages.length > 0;
  const imageVisionGuide = hasImages ? `
🖼️ DỮ LIỆU THỊ GIÁC ĐƯỢC ĐÍNH KÈM (MULTIMODAL VISION - CÓ ${effectiveFocalImages.length} HÌNH ẢNH):
- Hệ thống đã gửi kèm trực tiếp ${effectiveFocalImages.length} hình ảnh (bao gồm ảnh chụp đề bài câu hỏi, bài tập, slide bài giảng, ma trận số liệu, đồ thị hoặc bài viết tay) từ bài ghi chú của chính node này và các node con gần nhất.
- BẮT BUỘC BẠN PHẢI "NHÌN VÀ QUAN SÁT TRỰC TIẾP TỪNG PIXEL TRÊN HÌNH ẢNH ĐỂ ĐỌC ĐỀ BÀI & CÂU HỎI":
  * Mỗi hình ảnh đều được đánh số thứ tự và gắn kèm nhãn nguồn gốc cụ thể (ví dụ: [DỮ LIỆU THỊ GIÁC #1 - ĐÍNH KÈM TỪ: "Câu 1"], [DỮ LIỆU THỊ GIÁC #2 - ĐÍNH KÈM TỪ: "Câu 2"]...).
  * NẾU MỘT NODE CON CHƯA CÓ GHI CHÚ CHỮ GÕ NHƯNG CÓ ẢNH ĐÍNH KÈM: ĐỀ BÀI CHÍNH LÀ NỘI DUNG ĐƯỢC CHỤP LẠI TRONG ẢNH!
  * Bạn PHẢI đọc chính xác từng câu chữ, phương trình, số liệu trên ảnh để viết lại đề bài hoặc giải bài một cách đầy đủ 100%.
  * TUYỆT ĐỐI KHÔNG trả lời rằng "chưa có ghi chú văn bản nên không thể viết lại đề bài", hãy NHÌN THẲNG VÀO CÁC TẤM ẢNH ĐƯỢC GỬI KÈM để đọc đề bài!` : '';

  // Chỉ dẫn ngữ cảnh Node Cha và Node Con Gần Nhất
  const parentNodeNotice = hierarchy.isParentNode ? `
🏛️ BẠN ĐANG PHẢN HỒI CHO MỘT NODE CHA TRONG SƠ ĐỒ TRI THỨC (CÓ ${hierarchy.directChildren.length} NODE CON GẦN NHẤT):
- Sinh viên đang đặt câu hỏi tại Node Cha: "${targetLabel}".
- Danh sách các Node con gần nhất: ${hierarchy.directChildren.map((c, i) => `"${c.label}"`).join(', ')}.
- BẮT BUỘC BẠN PHẢI ĐỌC TOÀN BỘ NGỮ CẢNH CỦA CHÍNH NODE NÀY VÀ TẤT CẢ CÁC NODE CON GẦN NHẤT DƯỚI ĐÂY:
  * Đọc cả phần văn bản ghi chú và quan sát toàn bộ các hình ảnh đề bài đính kèm của từng node con.
  * Khi câu hỏi yêu cầu giải thích, viết lại đề bài, cho ví dụ minh họa thực tế, tính toán hoặc bóc tách bài toán: Hãy khai thác triệt để các hình ảnh đề bài, ví dụ, số liệu, trường hợp điển hình, công thức và bản chất đã được ghi chép trong các node con gần nhất để làm sáng tỏ, giúp câu trả lời sinh động, bám sát đúng bài học của sinh viên.` : '';

  // Xây dựng System Prompt sư phạm cao cấp: TIÊU ĐIỂM HÓA CHUYÊN SÂU
  const systemInstruction = `Bạn là Trợ lý Học tập & Cố vấn Nghiên cứu AI Chuyên Sâu cấp Đại học.
${parentNodeNotice}
🎯 TIÊU ĐIỂM BẮT BUỘC PHẢN HỒI (VÙNG MÀ SINH VIÊN VỪA KHOANH CHỌN ĐỂ HỎI):
"""
${focalText ? focalText.slice(0, 3000) : (hasImages ? '(Sinh viên khoanh chọn vùng hình ảnh / bảng biểu, hãy quan sát trực tiếp dữ liệu ảnh đính kèm)' : '(Không trích xuất được văn bản trực tiếp, hãy dựa vào câu hỏi sinh viên)')}
"""
${imageVisionGuide}

❓ CÂU HỎI TRỌNG TÂM CỦA SINH VIÊN:
"${userQuestion.trim() || 'Giải thích chi tiết ý nghĩa cụ thể của từng phần tử / con số trong vùng được chọn này.'}"

📖 TOÀN BỘ NGỮ CẢNH CỦA CHÍNH NODE NÀY VÀ CÁC NODE CON GẦN NHẤT ĐỂ ĐỐI CHIẾU, TÍNH TOÁN & LẤY VÍ DỤ MINH HỌA:
"""
${effectiveFullNotes ? effectiveFullNotes.slice(0, 16000) : '(Ghi chú dạng thị giác / hình ảnh trực tiếp)'}
"""

⚡ QUY TẮC PHẢN HỒI BẮT BUỘC (ANTI-GENERIC & LASER-FOCUSED):
1. ĐI THẲNG VÀO TRỌNG TÂM CÂU HỎI (ZERO FLUFF - NO GENERIC INTRO):
   - TUYỆT ĐỐI KHÔNG mở đầu bằng việc giới thiệu, tóm tắt cả chương hay bài học đang làm gì.
   - TUYỆT ĐỐI KHÔNG nói lan man những điều chung chung ngoài vùng chọn.
   - Trả lời TRỰC DIỆN, BÓC TÁCH TỪNG PHẦN TỬ:
     * Nếu là Đề bài dạng ảnh: Đọc rõ từng câu hỏi, dữ kiện và phương trình trên ảnh của từng node con tương ứng.
     * Nếu là Ma trận (ví dụ: Ma trận tương quan): Giải thích ngay ý nghĩa cụ thể của từng phần tử hàng-cột $r_{ij}$, đường chéo chính (tự tương quan = 1), các hệ số tương quan giữa từng cặp biến (âm/dương, mạnh/yếu), và biến nào tương quan mạnh nhất đến biến phụ thuộc.
     * Nếu là Công thức: Phân tích trực tiếp từng biến số, tham số, dấu phép toán và ý nghĩa thực tiễn.
     * Nếu là Bảng số liệu hoặc Biểu đồ trên ảnh: Đọc và nhận xét trực tiếp các giá trị đột biến, xu hướng hoặc tương quan cụ thể.
2. SỬ DỤNG NGỮ CẢNH CỦA CHÍNH NODE VÀ CÁC NODE CON GẦN NHẤT MỘT CÁCH THẨM THẤU:
   - Dùng tài liệu toàn bài và các node con gần nhất để biết các ký hiệu trong vùng chọn đại diện cho đại lượng thực tế nào trong bài tập (ví dụ: x1 là gì, x2 là gì, y là gì...). Hãy gọi đúng tên biến thực tế đó khi giải thích từng phần tử trong vùng chọn!
   - Nếu sinh viên hỏi về đề bài, ví dụ thực tế hoặc bài toán minh họa: BẮT BUỘC ưu tiên sử dụng đề bài trong các hình ảnh và nội dung đã được ghi chép trong các node con gần nhất của node này.
3. TRÌNH BÀY GỌN GÀNG, SƯ PHẠM, ĐẦY ĐỦ Ý & TRỌN VẸN (KHÔNG NGẮT GIỮA CHỪNG):
   - Trả lời TRỌN VẸN câu kết luận, tuyệt đối KHÔNG dừng lửng lơ hay ngắt câu giữa chừng.
   - Về Ma trận: Hãy biểu diễn rõ ràng từng hàng và từng cột (hoặc Bảng Markdown, hoặc cú pháp LaTeX đầy đủ chuẩn xác \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} với dấu xuống dòng \\\\ rõ ràng giữa các hàng).
   - Về công thức & ký hiệu toán học: Hãy viết bằng ký hiệu Unicode trực quan (ví dụ: XᵀX, r_ij, x₁, x₂, β̂ = (XᵀX)⁻¹Xᵀy), tuyệt đối KHÔNG để sót các ký hiệu gãy dở dang.
4. Trả lời bằng Tiếng Việt chuẩn mực.`;

  // Xây dựng lịch sử hội thoại nội dung
  const contents = [];

  // Lượt hỏi ban đầu có kèm ngữ cảnh hệ thống
  const initialUserPrompt = `${systemInstruction}\n\n❓ CÂU HỎI CỦA SINH VIÊN:\n"${userQuestion.trim() || 'Hãy giải thích cặn kẽ đoạn trích này theo bối cảnh toàn bộ ghi chú.'}"`;

  // Chuẩn bị parts cho turn đầu tiên (bao gồm Text Prompt + Multimodal Image Parts)
  const initialParts = [{ text: initialUserPrompt }];
  if (hasImages) {
    effectiveFocalImages.forEach((img, idx) => {
      if (img && img.base64) {
        const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '').trim();
        if (cleanBase64) {
          const imgLabel = img.nodeLabel || img.label || `Ảnh ${idx + 1}`;
          initialParts.push({
            text: `🖼️ [DỮ LIỆU THỊ GIÁC #${idx + 1} - ĐÍNH KÈM TỪ: "${imgLabel}"]:`
          });
          initialParts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: cleanBase64
            }
          });
        }
      }
    });
  }

  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    // Đưa câu mở đầu vào turn đầu tiên
    contents.push({
      role: 'user',
      parts: initialParts
    });

    // Các turn tiếp theo
    chatHistory.forEach((turn, idx) => {
      if (idx === 0) {
        contents.push({
          role: 'model',
          parts: [{ text: turn.modelText || turn.text || '' }]
        });
      } else {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text || '' }]
        });
      }
    });

    // Câu hỏi mới nhất nếu có khác
    if (userQuestion && chatHistory[chatHistory.length - 1]?.text !== userQuestion) {
      contents.push({
        role: 'user',
        parts: [{ text: userQuestion.trim() }]
      });
    }
  } else {
    contents.push({
      role: 'user',
      parts: initialParts
    });
  }

  let lastError = null;
  for (const model of BACKUP_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.35,
            topP: 0.95,
            maxOutputTokens: 4096
          }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawParts = data.candidates?.[0]?.content?.parts;
      const generatedText = Array.isArray(rawParts)
        ? rawParts.map(p => p.text || '').join('')
        : (rawParts?.[0]?.text || '');

      if (!generatedText) {
        throw new Error('Gemini không trả về nội dung.');
      }

      return {
        text: generatedText.trim(),
        modelUsed: model,
        ancestryBreadcrumb: breadcrumb
      };
    } catch (err) {
      lastError = err;
      console.warn(`Thử model ${model} thất bại:`, err.message);
    }
  }

  throw new Error(`Không thể nhận phản hồi từ Gemini: ${lastError?.message || 'Lỗi không xác định'}`);
}

/**
 * ==========================================================================
 * EXERCISE & PRACTICE MODULE (BÓC TÁCH CHUYÊN ĐỀ & BỘ SINH 5 CÂU HỎI MẪU)
 * ==========================================================================
 */

/**
 * AI đọc toàn bộ tri thức của Node Cha (Markdown, Visual Notes, AI Chat Pins)
 * và tự động phân tách thành 3 - 5 Chủ đề / Chuyên đề bài tập kèm Mẹo thi & Bẫy trắc nghiệm
 * @param {Object} parentNode - Node kiến thức cha
 * @param {Array<Object>} allNodes - Toàn bộ node của môn học
 * @returns {Promise<Array<{ topicName: string, summary: string, examTips: Array<{ title: string, content: string }> }>>}
 */
export async function decomposeKnowledgeToExerciseTopics(parentNode, allNodes = []) {
  if (!parentNode) return generateFallbackTopics('Chương học');

  const apiKey = getGeminiApiKey();
  const parentLabel = parentNode.label || 'Khái niệm';
  const parentText = extractNodeText(parentNode);
  const ancestry = traceNodeAncestryPath(allNodes, parentNode);

  // Trích xuất các phiên chat đã đính kèm (AI Chat Pins)
  let pinnedChatsSummary = '';
  if (Array.isArray(parentNode.aiChatPins) && parentNode.aiChatPins.length > 0) {
    pinnedChatsSummary = parentNode.aiChatPins.map((pin, idx) => {
      const q = pin.title || pin.focalText || `Phiên #${idx + 1}`;
      const lastAnswers = (pin.chatHistory || [])
        .filter(msg => msg.role === 'model')
        .slice(-2)
        .map(m => m.text)
        .join(' ');
      return `[Ghim #${idx + 1} - "${q}"]: ${lastAnswers.slice(0, 300)}`;
    }).join('\n');
  }

  const combinedContext = `
Khái niệm / Bài học: "${parentLabel}"
Phả hệ môn học: ${ancestry.breadcrumbStr || parentLabel}

=== NỘI DUNG GHI CHÚ (LÝ THUYẾT & SƠ ĐỒ): ===
${parentText || 'Chưa có ghi chú văn bản chi tiết'}

=== CÁC PHIÊN THẢO LUẬN / HỎI ĐÁP CHUYÊN SÂU ĐÃ ĐÍNH KÈM (AI PINS): ===
${pinnedChatsSummary || 'Chưa có phiên chat đính kèm'}
  `.trim();

  // Nếu không có API Key, trả về Fallback Topics dựa trên parsing tiêu đề / gạch đầu dòng
  if (!apiKey) {
    return generateFallbackTopics(parentLabel, parentText);
  }

  const prompt = `
Bạn là Giảng viên Đại học chuyên gia xây dựng ngân hàng đề thi và giáo trình thực chiến.
Dựa trên toàn bộ tri thức của chương/khái niệm sau đây:

${combinedContext}

NHIỆM VỤ:
1. Đọc và phân tích sâu toàn bộ lý thuyết, sơ đồ số liệu và các đoạn hỏi đáp ghim.
2. Bóc tách kiến thức này thành 3 đến 5 CHUYÊN ĐỀ / CHỦ ĐỀ BÀI TẬP TRỌNG TÂM (ví dụ ở Chương 1 có thể bóc thành: Đặc tính dự án, Quản lý dự án, Khởi sự dự án...).
3. Với mỗi chuyên đề, cung cấp:
   - "topicName": Tên chuyên đề ngắn gọn, súc tích, thực chiến (ví dụ: "Đặc tính & Vòng đời Dự án").
   - "summary": Tóm tắt 1-2 câu ngắn về trọng tâm lý thuyết cần nắm vững.
   - "examTips": Danh sách 2-4 mẹo thực chiến làm bài trắc nghiệm cho chuyên đề này (gồm "title" và "content"), ví dụ: "Từ khóa nhận diện nhanh", "Bẫy phân biệt giữa X và Y", "Sai lầm thường gặp khi chọn phương án nhiễu".

YÊU CẦU ĐỊNH DẠNG:
Trả về duy nhất một chuỗi JSON hợp lệ theo cấu trúc sau (không kèm markdown thừa):
{
  "topics": [
    {
      "topicName": "Tên chuyên đề",
      "summary": "Tóm tắt ngắn gọn",
      "examTips": [
        {
          "title": "Mẹo / Từ khóa",
          "content": "Nội dung mẹo và cách tránh bẫy..."
        }
      ]
    }
  ]
}
  `.trim();

  for (const model of BACKUP_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const rawParts = data.candidates?.[0]?.content?.parts;
      const candidateText = Array.isArray(rawParts)
        ? rawParts.map(p => p.text || '').join('')
        : (rawParts?.[0]?.text || '');

      let cleaned = candidateText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        return parsed.topics;
      }
    } catch (e) {
      console.warn(`Lỗi phân tách chuyên đề với model ${model}:`, e);
    }
  }

  return generateFallbackTopics(parentLabel, parentText);
}

/**
 * Sinh fallback các chuyên đề nếu không có API Key hoặc mạng lỗi
 */
function generateFallbackTopics(label, text = '') {
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  const headings = lines.filter(l => l.startsWith('#') || l.startsWith('•') || l.startsWith('-'));

  if (headings.length >= 2) {
    return headings.slice(0, 4).map((h, i) => {
      const cleanTitle = h.replace(/^[#•\-\*\d\.\s]+/, '').trim() || `Chuyên đề ${i + 1}`;
      return {
        topicName: cleanTitle,
        summary: `Ôn tập trọng tâm các khái niệm cốt lõi của ${cleanTitle}.`,
        examTips: [
          { title: 'Từ khóa nhận diện', content: `Chú ý các thuật ngữ chính liên quan đến ${cleanTitle}.` },
          { title: 'Bẫy đề thi', content: 'Cảnh giác với các phương án có chứa từ tuyệt đối như "luôn luôn", "chỉ có".' }
        ]
      };
    });
  }

  return [
    {
      topicName: `Đặc tính & Khái niệm cốt lõi: ${label}`,
      summary: `Nắm vững định nghĩa, đặc điểm bản chất và phạm vi ứng dụng của ${label}.`,
      examTips: [
        { title: 'Bí kíp nhận diện', content: 'Ghi nhớ định nghĩa chuẩn và các điều kiện cần & đủ.' },
        { title: 'Bẫy thi thường gặp', content: 'Đề hay gài phương án đảo ngược nguyên nhân - kết quả.' }
      ]
    },
    {
      topicName: `Quy trình & Phương pháp áp dụng: ${label}`,
      summary: `Trình tự các bước thực hiện, công thức và nguyên lý vận hành trong thực tế.`,
      examTips: [
        { title: 'Mẹo thứ tự các bước', content: 'Học thuộc mốc bước đầu tiên và bước nghiệm thu cuối cùng.' },
        { title: 'Loại trừ đáp án', content: 'Loại ngay phương án làm sai lệch thứ tự logic của quy trình.' }
      ]
    },
    {
      topicName: `Phân tích tình huống & Bài toán thực tế: ${label}`,
      summary: `Vận dụng lý thuyết để xử lý case study, liên hệ thực tiễn và giải bài tập tính toán.`,
      examTips: [
        { title: 'Đọc kỹ câu hỏi', content: 'Xác định câu hỏi tìm khẳng định ĐÚNG hay khẳng định SAI.' },
        { title: 'Phân tích số liệu', content: 'Chú ý đơn vị tính và các giả định ngoại lệ của bài toán.' }
      ]
    }
  ];
}

/**
 * Sinh đúng 5 câu hỏi trắc nghiệm thực chiến bám sát chuyên đề đã chọn
 * @param {string} topicName 
 * @param {string} topicSummary 
 * @param {Object} parentNode 
 * @param {Array<Object>} allNodes 
 * @returns {Promise<Array<Object>>}
 */
export async function generate5TopicPracticeQuizzes(topicName, topicSummary, parentNode, allNodes = []) {
  const apiKey = getGeminiApiKey();
  const parentLabel = parentNode?.label || 'Môn học';
  const parentText = extractNodeText(parentNode);
  const ancestry = traceNodeAncestryPath(allNodes, parentNode);

  const prompt = `
Bạn là Giảng viên Đại học kỳ cựu chuyên ra đề thi kết thúc học phần và thi trắc nghiệm chứng chỉ.
Bối cảnh môn học: "${parentLabel}" (${ancestry.breadcrumbStr || ''})
Chuyên đề trọng tâm cần ra đề: "${topicName}"
Tóm tắt chuyên đề: "${topicSummary || ''}"

TÀI LIỆU THAM KHẢO TỪ GHI CHÚ BÀI HỌC:
${(parentText || '').slice(0, 2500)}

NHIỆM VỤ:
Hãy tạo chính xác ĐÚNG 5 CÂU HỎI TRẮC NGHIỆM THỰC CHIẾN bám sát chuyên đề "${topicName}".
Mỗi câu hỏi phải đạt chuẩn sư phạm cao:
1. "question": Câu hỏi rõ ràng, có tình huống thực tế hoặc lý thuyết có bẫy tư duy, không hỏi mẹo vặt vô nghĩa.
2. "options": Đúng 4 lựa chọn (A, B, C, D) có tính nhiễu cao, độ dài cân đối.
3. "answer": Chỉ số đáp án đúng (0 cho A, 1 cho B, 2 cho C, 3 cho D).
4. "explanation": Giải thích chuyên sâu tại sao đáp án đó đúng, đồng thời phân tích ngắn gọn vì sao 3 phương án còn lại là bẫy sai.
5. "trap": Chỉ ra cụ thể bẫy đề thi mà sinh viên hay bị lừa ở câu này.
6. "rule": 1 câu chốt bản chất cốt lõi (Core Rule) để sinh viên nhớ suốt đời.

YÊU CẦU ĐỊNH DẠNG:
Trả về duy nhất một chuỗi JSON hợp lệ theo format:
{
  "quizzes": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": 0,
      "explanation": "...",
      "trap": "...",
      "rule": "..."
    }
  ]
}
  `.trim();

  if (apiKey) {
    for (const model of BACKUP_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.65,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!response.ok) continue;

        const data = await response.json();
        const rawParts = data.candidates?.[0]?.content?.parts;
        const candidateText = Array.isArray(rawParts)
          ? rawParts.map(p => p.text || '').join('')
          : (rawParts?.[0]?.text || '');

        let cleaned = candidateText.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.quizzes) && parsed.quizzes.length > 0) {
          return parsed.quizzes.map((q, idx) => {
            const resolvedIdx = typeof q.correctIndex === 'number' ? q.correctIndex : (typeof q.answer === 'number' ? q.answer : 0);
            return {
              id: `practice_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
              question: q.question,
              options: q.options,
              correctIndex: resolvedIdx,
              answer: resolvedIdx,
              explanation: q.explanation || 'Đáp án chính xác theo tài liệu bài học.',
              trap: q.trap || 'Cẩn thận với các phương án gây nhiễu câu chữ.',
              rule: q.rule || 'Bản chất cốt lõi của chuyên đề.',
              topicName: topicName,
              createdAt: new Date().toISOString()
            };
          });
        }
      } catch (e) {
        console.warn(`Lỗi gen 5 câu hỏi với model ${model}:`, e);
      }
    }
  }

  // Fallback 5 câu mẫu nếu không có API key
  return generateFallback5Quizzes(topicName);
}

function generateFallback5Quizzes(topicName) {
  return [
    {
      id: `practice_fallback_${Date.now()}_1`,
      question: `Đặc điểm bản chất quan trọng nhất của chuyên đề "${topicName}" là gì?`,
      options: [
        `A. Là nền tảng lý thuyết bắt buộc để áp dụng vào các bài toán thực tế`,
        `B. Chỉ có tính chất tham khảo, không có tính bắt buộc trong môn học`,
        `C. Luôn không thay đổi trong mọi điều kiện bài toán`,
        `D. Hoàn toàn độc lập và không liên quan đến các chuyên đề khác`
      ],
      correctIndex: 0,
      answer: 0,
      explanation: `Phương án A phản ánh đúng vai trò then chốt của ${topicName} trong hệ thống kiến thức môn học.`,
      trap: `Các phương án B, C, D sử dụng các từ tuyệt đối hoặc đánh giá thấp vai trò của chuyên đề.`,
      rule: `Hiểu rõ bản chất nền tảng trước khi áp dụng vào các bài tập phức tạp.`,
      topicName: topicName,
      createdAt: new Date().toISOString()
    },
    {
      id: `practice_fallback_${Date.now()}_2`,
      question: `Khi phân tích và giải quyết bài toán thuộc "${topicName}", bước đầu tiên cần thực hiện là gì?`,
      options: [
        `A. Đi ngay vào tính toán kết quả mà không cần kiểm tra điều kiện`,
        `B. Xác định rõ các giả định, dữ liệu đầu vào và mục tiêu của bài toán`,
        `C. Chọn ngẫu nhiên một phương pháp thuận tay`,
        `D. Bỏ qua các ràng buộc biên để đơn giản hóa`
      ],
      correctIndex: 1,
      answer: 1,
      explanation: `Bước xác định giả định và dữ liệu đầu vào là điều kiện tiên quyết để chọn phương pháp giải đúng đắn.`,
      trap: `Sinh viên thường vội vàng tính toán mà bỏ qua các điều kiện biên hoặc ràng buộc đầu vào.`,
      rule: `Chuẩn hóa dữ liệu đầu vào trước khi tiến hành xử lý.`,
      topicName: topicName,
      createdAt: new Date().toISOString()
    },
    {
      id: `practice_fallback_${Date.now()}_3`,
      question: `Sai lầm phổ biến nhất khi làm trắc nghiệm phần "${topicName}" là gì?`,
      options: [
        `A. Đọc kỹ từng từ khóa và câu hỏi`,
        `B. Nhầm lẫn giữa khái niệm định tính và chỉ số định lượng`,
        `C. Sử dụng phương pháp loại trừ đáp án vô lý`,
        `D. Kiểm tra lại kết quả với các ví dụ đơn giản`
      ],
      correctIndex: 1,
      answer: 1,
      explanation: `Sự nhầm lẫn giữa mặt định tính và định lượng là cái bẫy đề thi ưa thích của giảng viên.`,
      trap: `Đề thi hay dùng từ vựng giống nhau nhưng thay đổi bản chất định lượng thành định tính.`,
      rule: `Phân biệt rạch ròi giữa bản chất và số đo hiển thị.`,
      topicName: topicName,
      createdAt: new Date().toISOString()
    },
    {
      id: `practice_fallback_${Date.now()}_4`,
      question: `Trong thực tế, chuyên đề "${topicName}" thường liên kết chặt chẽ nhất với khâu nào?`,
      options: [
        `A. Khâu lập kế hoạch, kiểm soát chất lượng và đánh giá rủi ro`,
        `B. Khâu hủy bỏ dự án và giải thể đội ngũ`,
        `C. Không liên kết với khâu nào trong quy trình`,
        `D. Chỉ liên kết khi dự án đã gặp sự cố lớn`
      ],
      correctIndex: 0,
      answer: 0,
      explanation: `Chuyên đề này đóng vai trò then chốt trong việc kiểm soát rủi ro và chất lượng tổng thể.`,
      trap: `Phương án D chỉ mô tả phần ngọn khi có sự cố, không phải quy trình phòng ngừa chủ động.`,
      rule: `Chủ động kiểm soát từ khâu lập kế hoạch thay vì xử lý hậu quả.`,
      topicName: topicName,
      createdAt: new Date().toISOString()
    },
    {
      id: `practice_fallback_${Date.now()}_5`,
      question: `Mẹo loại trừ nhanh nhất một phương án SAI trong câu hỏi về "${topicName}" là gì?`,
      options: [
        `A. Phương án chứa các từ hạn định tuyệt đối như "luôn luôn", "duy nhất", "không bao giờ"`,
        `B. Phương án có phân tích điều kiện áp dụng rõ ràng`,
        `C. Phương án liên hệ với thực tế quản trị`,
        `D. Phương án có giải thích cơ sở khoa học`
      ],
      correctIndex: 0,
      answer: 0,
      explanation: `Trong các môn khoa học và quản lý, hiếm khi có sự tuyệt đối 100%. Các phương án khẳng định tuyệt đối thường là đáp án nhiễu.`,
      trap: `Sinh viên hay bị lôi cuốn bởi câu chữ mang tính khẳng định mạnh mẽ.`,
      rule: `Cảnh giác tối đa với các phát biểu mang tính tuyệt đối hóa trong đề thi trắc nghiệm.`,
      topicName: topicName,
      createdAt: new Date().toISOString()
    }
  ];
}



