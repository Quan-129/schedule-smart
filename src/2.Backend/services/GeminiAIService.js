// ==========================================================================
// 1. IMPORTS & CONFIG
// ==========================================================================
const STORAGE_KEY_GEMINI = 'smart_schedule_gemini_api_key';
const DEFAULT_MODEL = 'gemini-1.5-flash';

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

// ==========================================================================
// 3. AI GENERATION ENGINE
// ==========================================================================

/**
 * Sinh câu hỏi trắc nghiệm Active Recall từ tri thức ghi chú của node
 * @param {string} nodeLabel - Tên chủ đề / khái niệm của node
 * @param {string} notesContent - Toàn bộ nội dung ghi chú (Markdown hoặc text)
 * @param {number} attemptIndex - Số thứ tự lần sinh câu hỏi (dùng để đổi góc độ câu hỏi)
 * @returns {Promise<Object>}
 */
export async function generateQuizFromNodeKnowledge(nodeLabel, notesContent, attemptIndex = 0) {
  const apiKey = getGeminiApiKey();

  // Nếu chưa có API Key -> Dùng Fallback generator thông minh
  if (!apiKey) {
    return generateFallbackQuiz(nodeLabel, notesContent, 'demo_no_key', attemptIndex);
  }

  const prompt = `
Bạn là chuyên gia sư phạm đại học và cố vấn học tập hàng đầu theo phương pháp Active Recall & Phân tích chẩn đoán sai lầm tư duy (Diagnostic Testing).
Dưới đây là tri thức học tập của sinh viên trong chủ đề: "${nodeLabel}"

Nội dung ghi chú của sinh viên:
"""
${(notesContent || '').slice(0, 3500)}
"""

Hãy tạo ĐÚNG 1 câu hỏi trắc nghiệm chất lượng cao bám sát nội dung trên để sinh viên tự kiểm tra kiến thức.
Yêu cầu bắt buộc:
1. ĐÂY LÀ LẦN KHẢO HẠCH THỨ ${attemptIndex + 1}. Hãy tạo một câu hỏi MỚI HOÀN TOÀN, khai thác một GÓC ĐỘ / KHÍA CẠNH KHÁC BIỆT so với các câu cơ bản (ví dụ: góc độ tình huống ứng dụng thực tế, góc độ chẩn đoán ngộ nhận tư duy, góc độ so sánh điều kiện biên, hoặc góc độ bản chất lý thuyết).
2. Có đúng 4 lựa chọn A, B, C, D (trong đó có 1 đáp án đúng và 3 đáp án nhiễu có bẫy tinh vi). Hãy xáo trộn ngẫu nhiên vị trí đáp án đúng (không cố định ở A).
3. Bóc tách sâu sắc: Khái niệm cốt lõi, Lời giải thích, Bẫy/Sai lầm thường gặp mà sinh viên hay mắc phải, và Quy tắc/Bản chất cần nhớ (công thức hoặc chuỗi mũi tên ngắn gọn).
4. Trả về ĐÚNG 1 CHUỖI JSON thuần túy (KHÔNG dùng markdown codeblock \`\`\`json, KHÔNG có bất kỳ lời chào nào ngoài JSON).

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
  "coreConcept": "Tên khái niệm / lý thuyết / mô hình cốt lõi",
  "explanation": "Giải thích chi tiết tại sao đáp án này đúng theo lập luận logic...",
  "trap": "Bẫy đề thi & Sai lầm tư duy thường gặp (tại sao sinh viên dễ chọn nhầm phương án khác)...",
  "rule": "Quy tắc / Bản chất cốt lõi cần nhớ (dạng chuỗi: Bước 1 ➔ Bước 2 ➔ Bước 3 hoặc công thức)",
  "source": "Trích dẫn ngắn chứng minh từ bài học hoặc tài liệu"
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
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
      const errMsg = errData.error?.message || `HTTP ${response.status}`;
      console.warn('Gemini API Error:', errMsg);
      return generateFallbackQuiz(nodeLabel, notesContent, `error_${errMsg}`, attemptIndex);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
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
    return parsed;
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return generateFallbackQuiz(nodeLabel, notesContent, `catch_${error.message}`, attemptIndex);
  }
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

