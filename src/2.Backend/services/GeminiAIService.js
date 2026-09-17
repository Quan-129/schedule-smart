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
  userQuestion = '',
  chatHistory = []
}) {
  const apiKey = getGeminiApiKey();

  // Truy vết phả hệ nơ-ron từ Root đến Node hiện tại
  const nodes = Array.isArray(allNodes) ? allNodes : [];
  const node = targetNode || { label: 'Ghi chú học tập' };
  const ancestry = traceNodeAncestryPath(nodes, node);
  const targetLabel = node.label || 'Khái niệm';
  const breadcrumb = ancestry.breadcrumbStr || targetLabel;

  // Tổng hợp toàn cảnh ghi chú
  const effectiveFullNotes = (fullContext || ancestry.cumulativeNotes || extractNodeText(node) || '').trim();

  // Nếu chưa cấu hình API Key, thông báo hướng dẫn người dùng
  if (!apiKey) {
    return {
      text: `⚠️ **Chưa cấu hình Google Gemini API Key!**\n\nĐể AI có thể đọc toàn bộ ghi chú và giải thích chuyên sâu đoạn trích này, bạn vui lòng:\n1. Mở Cài đặt hoặc modal API Key.\n2. Lấy API Key miễn phí từ [Google AI Studio](https://aistudio.google.com/app/apikey).\n3. Dán vào hệ thống để kích hoạt trợ lý AI Copilot.\n\n*Trích đoạn bạn vừa chọn:* "${focalText.slice(0, 100)}${focalText.length > 100 ? '...' : ''}"`,
      modelUsed: 'none',
      ancestryBreadcrumb: breadcrumb
    };
  }

  // Hướng dẫn Multimodal Vision nếu có ảnh đính kèm
  const hasImages = Array.isArray(focalImages) && focalImages.length > 0;
  const imageVisionGuide = hasImages ? `
🖼️ DỮ LIỆU THỊ GIÁC TRỰC TIẾP ĐƯỢC ĐÍNH KÈM (MULTIMODAL VISION):
- Hệ thống đã gửi kèm trực tiếp ${focalImages.length} hình ảnh (ảnh chụp slide bài giảng, ảnh ma trận tương quan, biểu đồ đồ thị, bảng số liệu hoặc bài viết tay) từ bài ghi chú hoặc từ vùng sinh viên vừa khoanh chọn.
- BẮT BUỘC BẠN PHẢI "NHÌN VÀ QUAN SÁT TRỰC TIẾP TỪNG PIXEL TRÊN HÌNH ẢNH":
  * Đọc chính xác từng con số, ký hiệu ma trận hàng - cột, hệ số tương quan, phương trình toán học trên ảnh.
  * Nếu ghi chú chỉ toàn ảnh (không có chữ gõ văn bản), bạn hoàn toàn dựa vào nội dung trong ảnh và câu hỏi của sinh viên để bóc tách và giải thích cặn kẽ, đầy đủ 100%.
  * Không đoán mò, hãy đọc đúng con số hiển thị trên ảnh.` : '';

  // Xây dựng System Prompt sư phạm cao cấp: TIÊU ĐIỂM HÓA CHUYÊN SÂU
  const systemInstruction = `Bạn là Trợ lý Học tập & Cố vấn Nghiên cứu AI Chuyên Sâu cấp Đại học.

🎯 TIÊU ĐIỂM BẮT BUỘC PHẢN HỒI (VÙNG MÀ SINH VIÊN VỪA KHOANH CHỌN ĐỂ HỎI):
"""
${focalText ? focalText.slice(0, 3000) : (hasImages ? '(Sinh viên khoanh chọn vùng hình ảnh / bảng biểu, hãy quan sát trực tiếp dữ liệu ảnh đính kèm)' : '(Không trích xuất được văn bản trực tiếp, hãy dựa vào câu hỏi sinh viên)')}
"""
${imageVisionGuide}

❓ CÂU HỎI TRỌNG TÂM CỦA SINH VIÊN:
"${userQuestion.trim() || 'Giải thích chi tiết ý nghĩa cụ thể của từng phần tử / con số trong vùng được chọn này.'}"

📖 TÀI LIỆU TOÀN BÀI ĐỂ TRA CỨU PHỤ (CHỈ DÙNG ĐỂ ĐỐI CHIẾU KÝ HIỆU, TÊN BIẾN - TUYỆT ĐỐI KHÔNG TÓM TẮT TOÀN BỘ TÀI LIỆU NÀY):
"""
${effectiveFullNotes ? effectiveFullNotes.slice(0, 5000) : '(Ghi chú dạng thị giác / hình ảnh trực tiếp)'}
"""

⚡ QUY TẮC PHẢN HỒI BẮT BUỘC (ANTI-GENERIC & LASER-FOCUSED):
1. ĐI THẲNG VÀO TRỌNG TÂM CÂU HỎI (ZERO FLUFF - NO GENERIC INTRO):
   - TUYỆT ĐỐI KHÔNG mở đầu bằng việc giới thiệu, tóm tắt cả chương hay bài học đang làm gì.
   - TUYỆT ĐỐI KHÔNG nói lan man những điều chung chung ngoài vùng chọn.
   - Trả lời TRỰC DIỆN, BÓC TÁCH TỪNG PHẦN TỬ:
     * Nếu là Ma trận (ví dụ: Ma trận tương quan): Giải thích ngay ý nghĩa cụ thể của từng phần tử hàng-cột $r_{ij}$, đường chéo chính (tự tương quan = 1), các hệ số tương quan giữa từng cặp biến (âm/dương, mạnh/yếu), và biến nào tương quan mạnh nhất đến biến phụ thuộc.
     * Nếu là Công thức: Phân tích trực tiếp từng biến số, tham số, dấu phép toán và ý nghĩa thực tiễn.
     * Nếu là Bảng số liệu hoặc Biểu đồ trên ảnh: Đọc và nhận xét trực tiếp các giá trị đột biến, xu hướng hoặc tương quan cụ thể.
2. SỬ DỤNG NGỮ CẢNH TOÀN BÀI MỘT CÁCH THẨM THẤU (SUBTLE CONTEXT INTEGRATION):
   - Chỉ dùng tài liệu toàn bài để biết các ký hiệu trong vùng chọn đại diện cho đại lượng thực tế nào trong bài tập (ví dụ: x1 là gì, x2 là gì, y là gì...). Hãy gọi đúng tên biến thực tế đó khi giải thích từng phần tử trong vùng chọn!
3. TRÌNH BÀY GỌN GÀNG, SƯ PHẠM, ĐẦY ĐỦ Ý & TRỌN VẸN (KHÔNG NGẮT GIỮA CHỪNG):
   - Trả lời TRỌN VẸN câu kết luận, tuyệt đối KHÔNG dừng lửng lơ hay ngắt câu giữa chừng.
   - Về Ma trận: Hãy biểu diễn rõ ràng từng hàng và từng cột (hoặc Bảng Markdown, hoặc cú pháp LaTeX đầy đủ chuẩn xác \begin{bmatrix} a & b \\ c & d \end{bmatrix} với dấu xuống dòng \\ rõ ràng giữa các hàng).
   - Về công thức & ký hiệu toán học: Hãy viết bằng ký hiệu Unicode trực quan (ví dụ: XᵀX, r_ij, x₁, x₂, β̂ = (XᵀX)⁻¹Xᵀy), tuyệt đối KHÔNG để sót các ký hiệu gãy dở dang.
4. Trả lời bằng Tiếng Việt chuẩn mực.`;

  // Xây dựng lịch sử hội thoại nội dung
  const contents = [];

  // Lượt hỏi ban đầu có kèm ngữ cảnh hệ thống
  const initialUserPrompt = `${systemInstruction}\n\n❓ CÂU HỎI CỦA SINH VIÊN:\n"${userQuestion.trim() || 'Hãy giải thích cặn kẽ đoạn trích này theo bối cảnh toàn bộ ghi chú.'}"`;

  // Chuẩn bị parts cho turn đầu tiên (bao gồm Text Prompt + Multimodal Image Parts)
  const initialParts = [{ text: initialUserPrompt }];
  if (hasImages) {
    focalImages.forEach(img => {
      if (img && img.base64) {
        const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '').trim();
        if (cleanBase64) {
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


